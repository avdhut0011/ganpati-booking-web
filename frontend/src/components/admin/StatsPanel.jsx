import React, { useEffect, useState } from 'react';
import { getStats } from '../../api/adminApi';
import LoadingSpinner from '../shared/LoadingSpinner';

const StatsPanel = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getStats();
      setStats(data);
    } catch (e) {
      console.error("Stats fetch error:", e);
      setError("डेटा लोड करताना त्रुटी आली.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner text="ॲनालिटिक्स डेटा लोड होत आहे..." />;
  if (error || !stats) return <div style={{ color: 'var(--danger)', padding: '20px', fontWeight: 'bold' }}>{error || 'डेटा उपलब्ध नाही'}</div>;

  const totalRevenue = stats.total_received ?? stats.total_revenue ?? 0;
  const cashReceived = stats.total_cash_received ?? stats.cash_received ?? 0;
  const upiReceived = stats.total_upi_received ?? stats.upi_received ?? 0;
  const pendingBalance = stats.total_pending_balance ?? stats.pending_balance ?? 0;
  const totalBusiness = stats.total_business_value ?? (totalRevenue + pendingBalance);

  let ownerList = [];
  if (Array.isArray(stats.owner_stats)) {
    ownerList = stats.owner_stats;
  } else if (stats.owner_stats && typeof stats.owner_stats === 'object') {
    ownerList = Object.keys(stats.owner_stats).map(key => ({
      name: key,
      count: stats.owner_stats[key].count || 0,
      cash: stats.owner_stats[key].cash || 0,
      upi: stats.owner_stats[key].upi || 0,
      total: stats.owner_stats[key].total || 0,
    }));
  }

  return (
    <div>
      {/* TOP METRICS GRID */}
      <div className="grid-4" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-info">
            <h4>एकूण व्यवसाय (Total Business)</h4>
            <div className="stat-value" style={{ color: 'var(--secondary)' }}>₹ {totalBusiness.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h4>एकूण संकलित (Total Received)</h4>
            <div className="stat-value" style={{ color: 'var(--success)' }}>₹ {totalRevenue.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h4>रोख जमा (Cash Received)</h4>
            <div className="stat-value" style={{ color: '#d35400' }}>₹ {cashReceived.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h4>ऑनलाईन जमा (UPI / Online)</h4>
            <div className="stat-value" style={{ color: '#2980b9' }}>₹ {upiReceived.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* STATUS COUNT BREAKDOWN */}
      <div className="grid-4" style={{ marginBottom: '20px' }}>
        <div className="stat-card" style={{ borderColor: 'var(--primary)' }}>
          <div className="stat-info">
            <h4>एकूण बुकिंग्ज (Total)</h4>
            <div className="stat-value">{stats.total_bookings || 0}</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderColor: 'var(--primary)' }}>
          <div className="stat-info">
            <h4>बुकिंग चालू (BOOKED)</h4>
            <div className="stat-value" style={{ color: 'var(--primary)' }}>{stats.booked_count || 0}</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderColor: 'var(--success)' }}>
          <div className="stat-info">
            <h4>पूर्ण जमा (PAID)</h4>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.paid_count || 0}</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderColor: 'var(--danger)' }}>
          <div className="stat-info">
            <h4>बुकिंग रद्द (CANCELLED)</h4>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.cancelled_count || 0}</div>
          </div>
        </div>
      </div>

      {/* OWNER PERFORMANCE TABLE */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ color: 'var(--primary)', margin: 0 }}>
            👤 मालक संकलन परफॉर्मन्स (Owner Collection Performance)
          </h3>
          <button className="btn btn-primary" onClick={fetchStats} style={{ padding: '6px 14px', fontSize: '13px' }}>
            <i className="fa-solid fa-rotate"></i> रिफ्रेश करा
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>क्र.</th>
              <th>मालकाचे नाव (Owner)</th>
              <th>बुकिंग मोजणी (Bookings)</th>
              <th>रोख जमा (Cash ₹)</th>
              <th>ऑनलाईन जमा (UPI ₹)</th>
              <th>एकूण संकलन (Total ₹)</th>
            </tr>
          </thead>
          <tbody>
            {ownerList.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '15px', color: '#7f8c8d' }}>कोणताही डेटा उपलब्ध नाही.</td></tr>
            ) : (
              ownerList.map((item, idx) => {
                const cashVal = item.cash || 0;
                const upiVal = item.upi || 0;
                const totalVal = item.total || (cashVal + upiVal);
                return (
                  <tr key={idx}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                    <td><strong style={{ color: 'var(--secondary)' }}><i className="fa-solid fa-user-tag"></i> {item.name}</strong></td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.count || 0}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#d35400' }}>₹ {cashVal.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#2980b9' }}>₹ {upiVal.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#1e8449', fontSize: '15px' }}>₹ {totalVal.toLocaleString('en-IN')}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatsPanel;
