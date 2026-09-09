import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import NewBookingForm from '../components/booking/NewBookingForm';
import MarkPaidTab from '../components/booking/MarkPaidTab';
import CancelTab from '../components/booking/CancelTab';
import AllBookingsTab from '../components/booking/AllBookingsTab';
import { getAllBookings } from '../api/bookingApi';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const BookingApp = () => {
  const { token, adminUser, activeStall, ownersList, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(1);
  const [stats, setStats] = useState({ active: 0, paid: 0, pending: 0 });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const isSuperadmin = adminUser?.role === 'superadmin' || adminUser?.username === 'admin';
  const loggedInDisplayName = adminUser?.display_name || adminUser?.displayName || adminUser?.username || '';
  const activeOwner = isSuperadmin ? (ownersList[0] || '') : loggedInDisplayName;

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllBookings();
      const list = Array.isArray(data) ? data : [];
      setBookings(list);
      
      const activeCount = list.filter(b => b.bookingStatus === 'BOOKED' || b.bookingStatus === 'PAID').length;
      const paidCount = list.filter(b => b.bookingStatus === 'PAID').length;
      const pendingBal = list
        .filter(b => b.bookingStatus === 'BOOKED')
        .reduce((acc, b) => acc + (parseFloat(b.balanceAmount) || 0), 0);
        
      setStats({ active: activeCount, paid: paidCount, pending: pendingBal });
    } catch (e) {
      console.error("Fetch bookings error:", e);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return (
    <div className="app-container">
      {/* TOP NAVIGATION BAR */}
      <header className="top-bar">
        <div className="top-bar-festive">
          <i className="fa-solid fa-om" style={{ color: 'var(--primary)', fontSize: '18px' }}></i>
          <span>॥ श्री गणेशाय नमः ॥</span>
        </div>
        <div className="top-bar-actions">
          <div className="user-badge-pill">
            <i className="fa-solid fa-user-circle" style={{ color: 'var(--primary)' }}></i>
            <span>{loggedInDisplayName || 'व्यवस्थापक'}</span>
          </div>
          <Link to="/admin/dashboard" className="nav-link-btn primary">
            <i className="fa-solid fa-chart-pie"></i>
            <span>डॅशबोर्ड (Dashboard)</span>
          </Link>
          <button 
            type="button" 
            onClick={logout} 
            className="nav-link-btn"
            style={{ color: 'var(--danger)', borderColor: 'rgba(225, 29, 72, 0.2)' }}
            title="लॉगआउट"
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            <span>बाहेर पडा</span>
          </button>
        </div>
      </header>

      {/* HERO BRAND HEADER */}
      <div className="hero-header">
        <div className="hero-content">
          <div className="hero-stall-badge">
            <i className="fa-solid fa-certificate"></i>
            <span>{activeStall?.stallNumber || 'स्टॉल क्र.१०'} • अधिकृत बुकिंग</span>
          </div>
          <h1 className="hero-title">
            {activeStall?.stallName || 'सदिच्छा कला केंद्र'}
          </h1>
          <p className="hero-subtitle">
            गणपती बाप्पा मूर्ती बुकिंग व व्यवस्थापन प्रणाली
          </p>
          <div className="hero-location-pill">
            <i className="fa-solid fa-location-dot" style={{ color: 'var(--accent-gold)' }}></i>
            <span>{activeStall?.locationAddress || 'उदाजी महाराज म्युझियम, आकाशवाणी टॉवर जवळ, गंगापूर रोड, नाशिक'}</span>
            {activeStall?.contactPhone && (
              <span style={{ marginLeft: '6px', opacity: 0.9 }}>• 📞 {activeStall.contactPhone}</span>
            )}
          </div>
        </div>
      </div>

      {/* STATS / KPI CARDS */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon-wrap stat-icon-primary">
            <i className="fa-solid fa-om"></i>
          </div>
          <div className="stat-content">
            <h4>एकूण बुकिंग्ज</h4>
            <div className="stat-value">{stats.active}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap stat-icon-success">
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <div className="stat-content">
            <h4>पूर्ण जमा (PAID)</h4>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.paid}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap stat-icon-warning">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div className="stat-content">
            <h4>शिल्लक बाकी येणे</h4>
            <div className="stat-value" style={{ color: 'var(--primary)' }}>₹ {stats.pending.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* SEGMENTED NAVIGATION TABS */}
      <nav className="tabs-container">
        <button 
          type="button"
          className={`tab-btn ${activeTab === 1 ? 'active' : ''}`} 
          onClick={() => setActiveTab(1)}
        >
          <i className="fa-solid fa-calendar-plus"></i>
          <span>नवीन बुकिंग</span>
        </button>
        <button 
          type="button"
          className={`tab-btn ${activeTab === 2 ? 'active' : ''}`} 
          onClick={() => setActiveTab(2)}
        >
          <i className="fa-solid fa-hand-holding-dollar"></i>
          <span>बाकी जमा</span>
        </button>
        <button 
          type="button"
          className={`tab-btn ${activeTab === 3 ? 'active' : ''}`} 
          onClick={() => setActiveTab(3)}
        >
          <i className="fa-solid fa-rectangle-xmark"></i>
          <span>बुकिंग रद्द</span>
        </button>
        <button 
          type="button"
          className={`tab-btn ${activeTab === 4 ? 'active' : ''}`} 
          onClick={() => setActiveTab(4)}
        >
          <i className="fa-solid fa-table-list"></i>
          <span>सर्व बुकिंग & विश्लेषण</span>
          <span className="tab-badge">{bookings.length}</span>
        </button>
      </nav>

      {/* TAB CONTENT */}
      {loading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <LoadingSpinner text="माहिती लोड होत आहे..." />
        </div>
      ) : (
        <main>
          {activeTab === 1 && (
            <NewBookingForm 
              onRefresh={fetchBookings} 
              bookings={bookings} 
              activeOwner={activeOwner} 
              ownersList={ownersList} 
              activeStall={activeStall} 
            />
          )}
          {activeTab === 2 && (
            <MarkPaidTab 
              onRefresh={fetchBookings} 
              activeOwner={activeOwner} 
              ownersList={ownersList} 
              activeStall={activeStall} 
            />
          )}
          {activeTab === 3 && (
            <CancelTab 
              onRefresh={fetchBookings} 
              activeOwner={activeOwner} 
              ownersList={ownersList} 
            />
          )}
          {activeTab === 4 && (
            <AllBookingsTab 
              bookings={bookings} 
              onRefresh={fetchBookings} 
              ownersList={ownersList} 
              activeStall={activeStall} 
            />
          )}
        </main>
      )}

      {/* DEVELOPER BRAND FOOTER */}
      <footer style={{
        marginTop: '40px',
        padding: '16px 20px',
        background: 'var(--surface-glass)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '12.5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <i className="fa-solid fa-code" style={{ color: 'var(--primary)' }}></i>
        <span>Developed with dedication by <strong>Avadhut Jagtap</strong> • 📞 8390397800 • ✉️ avadhutjagtap1341@gmail.com</span>
      </footer>
    </div>
  );
};

export default BookingApp;
