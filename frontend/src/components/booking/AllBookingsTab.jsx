import React, { useState, useMemo } from 'react';

const AllBookingsTab = ({ bookings = [], onRefresh, ownersList = [], activeStall }) => {
  const [search, setSearch] = useState('');
  const [searchType, setSearchType] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const safeList = Array.isArray(bookings) ? bookings : [];

  const filteredBookings = useMemo(() => {
    let startObj = startDate ? new Date(startDate) : null;
    let endObj = endDate ? new Date(endDate) : null;
    if (startObj) startObj.setHours(0, 0, 0, 0);
    if (endObj) endObj.setHours(23, 59, 59, 999);

    return safeList.filter(b => {
      if (!b) return false;

      // 1. Query & Search Type Filter
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const name = (b.customerName || '').toLowerCase();
        const mob = (b.mobileNumber || '').toLowerCase();
        const id = (b.bookingId || '').toLowerCase();
        const statue = (b.statueNumber || '').toLowerCase();

        if (searchType === 'NAME' && !name.includes(q)) return false;
        if (searchType === 'MOBILE' && !mob.includes(q)) return false;
        if (searchType === 'ID' && !id.includes(q)) return false;
        if (searchType === 'STATUE' && !statue.includes(q)) return false;
        if (searchType === 'ALL' && !name.includes(q) && !mob.includes(q) && !id.includes(q) && !statue.includes(q)) return false;
      }

      // 2. Owner Filter
      if (ownerFilter !== 'ALL' && (b.bookedByOwner || '') !== ownerFilter) return false;

      // 3. Status Filter
      if (statusFilter !== 'ALL' && (b.bookingStatus || '') !== statusFilter) return false;

      // 4. Date Filter
      if (startObj || endObj) {
        let bDate = null;
        if (b.bookingDate && b.bookingDate.includes('/')) {
          const parts = b.bookingDate.split('/');
          if (parts.length === 3) bDate = new Date(parts[2], parts[1] - 1, parts[0]);
        } else if (b.bookingDate) {
          bDate = new Date(b.bookingDate);
        }

        if (bDate) {
          if (startObj && bDate < startObj) return false;
          if (endObj && bDate > endObj) return false;
        }
      }

      return true;
    });
  }, [safeList, search, searchType, startDate, endDate, ownerFilter, statusFilter]);

  const stats = useMemo(() => {
    let totalBusiness = 0;
    let totalCash = 0;
    let totalUpi = 0;
    let totalPending = 0;
    let paidCount = 0;
    let bookedCount = 0;
    let cancelledCount = 0;
    const ownerMap = {};

    function getOwner(name) {
      const clean = name ? String(name).trim() : 'इतर';
      if (!ownerMap[clean]) {
        ownerMap[clean] = { name: clean, bookingsCount: 0, cashCollected: 0, upiCollected: 0 };
      }
      return ownerMap[clean];
    }

    filteredBookings.forEach(b => {
      const status = (b.bookingStatus || '').toUpperCase();
      const totalAmt = parseFloat(b.totalAmount) || 0;
      const advAmt = parseFloat(b.advanceAmount) || 0;
      const balAmt = parseFloat(b.balanceAmount) || 0;
      const advMode = (b.paymentMode || '').toUpperCase();
      const advOwner = b.bookedByOwner || 'शिव';

      if (status === 'CANCELLED') {
        cancelledCount++;
      } else {
        totalBusiness += totalAmt;
        if (status === 'PAID') {
          paidCount++;
        } else {
          bookedCount++;
          totalPending += balAmt;
        }
      }

      // Revenue Attribution: advance_amount from ALL bookings (including CANCELLED) is retained
      const advOwnerObj = getOwner(advOwner);
      advOwnerObj.bookingsCount++;
      if (advMode.includes('कॅश') || advMode.includes('CASH')) {
        totalCash += advAmt;
        advOwnerObj.cashCollected += advAmt;
      } else {
        totalUpi += advAmt;
        advOwnerObj.upiCollected += advAmt;
      }
    });

    const totalReceived = totalCash + totalUpi;
    const cashPct = totalReceived > 0 ? Math.round((totalCash / totalReceived) * 100) : 0;
    const upiPct = totalReceived > 0 ? Math.round((totalUpi / totalReceived) * 100) : 0;

    return {
      totalBusiness,
      totalReceived,
      totalCash,
      totalUpi,
      totalPending,
      cashPct,
      upiPct,
      paidCount,
      bookedCount,
      cancelledCount,
      ownerMap
    };
  }, [filteredBookings]);

  const resetFilters = () => {
    setSearch('');
    setSearchType('ALL');
    setStartDate('');
    setEndDate('');
    setOwnerFilter('ALL');
    setStatusFilter('ALL');
  };

  const getWhatsappLink = (b) => {
    const text = 
      `🚩 *${activeStall?.stallName || 'गणपती बाप्पा'} - गणपती बाप्पा बुकिंग पावती* 🚩\n\n` +
      `नमस्कार *${b.customerName}* जी,\n` +
      "आपले गणपती बाप्पा बुकिंग तपशील:\n\n" +
      `🆔 *बुकिंग क्रमांक:* ${b.bookingId}\n` +
      `📄 *मराठी बिल PDF डाऊनलोड करा:*\n${window.location.origin}${b.pdfBillUrl}\n\n` +
      "🌺 *॥ गणपती बाप्पा मोरया ॥* 🌺";
    return `https://api.whatsapp.com/send?phone=91${b.mobileNumber}&text=${encodeURIComponent(text)}`;
  };

  return (
    <div>
      {/* FILTER & SEARCH CARD */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <i className="fa-solid fa-sliders" style={{ color: 'var(--primary)' }}></i>
              <span>बुकिंग शोध व फिल्टर (Search & Filters)</span>
            </h3>
            <p className="card-subtitle">नाव, मोबाईल, आयडी, तारीख किंवा मालकानुसार रेकॉर्ड्स फिल्टर करा</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={resetFilters}>
              <i className="fa-solid fa-rotate-left"></i> रीसेट
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={onRefresh}>
              <i className="fa-solid fa-arrows-rotate"></i> रिफ्रेश
            </button>
          </div>
        </div>

        {/* QUICK STATUS FILTER PILLS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'ALL', label: 'सर्व बुकिंग्ज', count: safeList.length },
            { id: 'BOOKED', label: '⏳ बाकी असणारे (BOOKED)', count: safeList.filter(b => b.bookingStatus === 'BOOKED').length },
            { id: 'PAID', label: '✅ पूर्ण पेड (PAID)', count: safeList.filter(b => b.bookingStatus === 'PAID').length },
            { id: 'CANCELLED', label: '🛑 रद्द (CANCELLED)', count: safeList.filter(b => b.bookingStatus === 'CANCELLED').length }
          ].map(pill => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setStatusFilter(pill.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: statusFilter === pill.id ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                background: statusFilter === pill.id ? 'var(--primary-subtle)' : '#FFFFFF',
                color: statusFilter === pill.id ? 'var(--primary-dark)' : 'var(--text-main)',
                fontWeight: 600,
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'var(--transition)'
              }}
            >
              <span>{pill.label}</span>
              <span style={{ 
                background: statusFilter === pill.id ? 'var(--primary)' : 'var(--surface-subtle)', 
                color: statusFilter === pill.id ? '#FFFFFF' : 'var(--text-muted)',
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px'
              }}>{pill.count}</span>
            </button>
          ))}
        </div>
        
        <div className="grid-4">
          <div className="form-group">
            <label className="form-label">शोध फील्ड (Field)</label>
            <select className="form-control" value={searchType} onChange={e => setSearchType(e.target.value)}>
              <option value="ALL">सर्व फील्ड्स (All Fields)</option>
              <option value="NAME">ग्राहकाचे नाव (Name)</option>
              <option value="MOBILE">मोबाईल नंबर (Mobile)</option>
              <option value="ID">बुकिंग आयडी (Booking ID)</option>
              <option value="STATUE">मूर्ती क्रमांक (Statue No)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">शोधा (Search Query)</label>
            <div className="input-icon-wrap">
              <i className="fa-solid fa-magnifying-glass input-icon"></i>
              <input type="text" className="form-control" placeholder="उदा. नाव, मोबाईल किंवा मूर्ती क्र." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">दिनांक पासून (From)</label>
            <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">दिनांक पर्यंत (To)</label>
            <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* BOOKINGS HIGH-DENSITY TABLE */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-subtle)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-list-check" style={{ color: 'var(--primary)' }}></i>
            <span>नोंदवलेली सर्व बुकिंग्ज ({filteredBookings.length})</span>
          </h3>
        </div>

        {filteredBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <i className="fa-regular fa-folder-open" style={{ fontSize: '36px', color: 'var(--text-subtle)', marginBottom: '12px', display: 'block' }}></i>
            <p style={{ fontWeight: 600 }}>कोणतेही जुळणारे बुकिंग रेकॉर्ड सापडले नाही.</p>
            <button type="button" className="btn btn-outline btn-sm" onClick={resetFilters} style={{ marginTop: '8px' }}>
              फिल्टर रीसेट करा
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '45px', textAlign: 'center' }}>क्र.</th>
                  <th>बुकिंग आयडी</th>
                  <th>दिनांक</th>
                  <th>ग्राहक माहिती</th>
                  <th>मूर्ती क्र.</th>
                  <th>रक्कम तपशील</th>
                  <th>बुकिंग करणारा</th>
                  <th>ऑडिट / पेमेंट माहिती</th>
                  <th>स्थिती</th>
                  <th style={{ textAlign: 'center' }}>कृती / पावती</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b, i) => {
                  const totalAmt = parseFloat(b.totalAmount) || 0;
                  const advAmt = parseFloat(b.advanceAmount) || 0;
                  const balAmt = parseFloat(b.balanceAmount) || 0;
                  const status = (b.bookingStatus || '').toUpperCase();
                  let badgeClass = 'badge-booked';
                  if (status === 'PAID') badgeClass = 'badge-paid';
                  if (status === 'CANCELLED') badgeClass = 'badge-cancelled';

                  const customerInitial = (b.customerName || 'ग').charAt(0).toUpperCase();

                  return (
                    <tr key={b.bookingId || i}>
                      <td style={{ textAlign: 'center', color: 'var(--text-subtle)', fontWeight: 600 }}>{i + 1}</td>
                      <td>
                        <strong style={{ color: 'var(--primary)', fontFamily: 'monospace', fontSize: '13px' }}>{b.bookingId}</strong>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>{b.bookingDate}</td>
                      <td>
                        <div className="customer-cell">
                          <div className="customer-avatar">{customerInitial}</div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{b.customerName}</div>
                            <small style={{ color: 'var(--text-muted)' }}>📞 {b.mobileNumber}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          fontWeight: 700, 
                          background: 'var(--surface-subtle)', 
                          padding: '3px 8px', 
                          borderRadius: 'var(--radius-xs)', 
                          border: '1px solid var(--border)' 
                        }}>
                          {b.statueNumber}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>एकूण: ₹{totalAmt.toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: '12px', color: 'var(--success-dark)', fontWeight: 600 }}>जमा: ₹{advAmt.toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: balAmt > 0 ? 'var(--primary)' : 'var(--success)' }}>
                          बाकी: ₹{balAmt.toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.bookedByOwner}</div>
                        <small style={{ color: 'var(--text-subtle)' }}>({b.paymentMode})</small>
                      </td>
                      <td>
                        {status === 'PAID' ? (
                          <div style={{ fontSize: '12px', color: 'var(--success-dark)' }}>
                            <strong>जमा:</strong> {b.finalPaymentOwner || b.bookedByOwner}<br/>
                            <small style={{ color: 'var(--text-muted)' }}>{b.finalPaymentMode || b.paymentMode} • {b.finalPaymentDate || '-'}</small>
                          </div>
                        ) : status === 'CANCELLED' ? (
                          <div style={{ fontSize: '12px', color: 'var(--danger-dark)' }}>
                            <strong>रद्द:</strong> {b.cancellationOwner || '-'}<br/>
                            <small style={{ color: 'var(--text-muted)' }}>{b.cancellationReason || 'ग्राहकाची विनंती'}</small>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--warning-dark)', fontSize: '12px', fontWeight: 500 }}>
                            <i className="fa-regular fa-clock"></i> बाकी येणे
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{status}</span>
                      </td>
                      <td>
                        {b.pdfBillUrl ? (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <a 
                              href={b.pdfBillUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn btn-primary btn-sm" 
                              title="मराठी बिल PDF उघडा"
                              style={{ padding: '5px 8px' }}
                            >
                              <i className="fa-solid fa-file-pdf"></i>
                            </a>
                            <a 
                              href={getWhatsappLink(b)} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn btn-whatsapp btn-sm" 
                              title="WhatsApp पावती पाठवा"
                              style={{ padding: '5px 8px' }}
                            >
                              <i className="fa-brands fa-whatsapp"></i>
                            </a>
                          </div>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REVENUE & OWNER PERFORMANCE ANALYTICS */}
      <div className="card" style={{ background: '#FFFFFF', border: '1.5px solid var(--border)' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <i className="fa-solid fa-chart-pie" style={{ color: 'var(--secondary)' }}></i>
              <span>संकलन व मालक कार्यक्षमता विश्लेषण (Performance Analytics)</span>
            </h3>
            <p className="card-subtitle">रोख, ऑनलाईन जमा व को-ओनर संकलन लीडरबोर्ड</p>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-success">
              <i className="fa-solid fa-vault"></i>
            </div>
            <div className="stat-content">
              <h4>एकूण संकलित रक्कम</h4>
              <div className="stat-value" style={{ color: 'var(--success)' }}>₹ {stats.totalReceived.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-primary">
              <i className="fa-solid fa-money-bill-wave"></i>
            </div>
            <div className="stat-content">
              <h4>रोख संकलन (Cash)</h4>
              <div className="stat-value" style={{ color: 'var(--primary)' }}>₹ {stats.totalCash.toLocaleString('en-IN')}</div>
              <small style={{ color: 'var(--text-subtle)', fontSize: '11.5px' }}>{stats.cashPct}% रोख प्रमाण</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-secondary">
              <i className="fa-solid fa-qrcode"></i>
            </div>
            <div className="stat-content">
              <h4>ऑनलाईन / UPI</h4>
              <div className="stat-value" style={{ color: 'var(--secondary)' }}>₹ {stats.totalUpi.toLocaleString('en-IN')}</div>
              <small style={{ color: 'var(--text-subtle)', fontSize: '11.5px' }}>{stats.upiPct}% ऑनलाईन प्रमाण</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-warning">
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div className="stat-content">
              <h4>एकूण बाकी रक्कम</h4>
              <div className="stat-value" style={{ color: 'var(--primary)' }}>₹ {stats.totalPending.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        {/* OWNER PERFORMANCE LEADERBOARD TABLE */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '45px', textAlign: 'center' }}>क्र.</th>
                <th>सह-मालक (Co-owner)</th>
                <th style={{ textAlign: 'center' }}>नोंदवलेली बुकिंग्ज</th>
                <th style={{ textAlign: 'right' }}>रोख जमा (Cash ₹)</th>
                <th style={{ textAlign: 'right' }}>ऑनलाईन जमा (UPI ₹)</th>
                <th style={{ textAlign: 'right' }}>एकूण संकलन (Total ₹)</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(stats.ownerMap).length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>कोणताही डेटा उपलब्ध नाही.</td></tr>
              ) : (
                Object.keys(stats.ownerMap).map((key, idx) => {
                  const o = stats.ownerMap[key];
                  const totalColl = o.cashCollected + o.upiCollected;
                  return (
                    <tr key={key}>
                      <td style={{ textAlign: 'center', color: 'var(--text-subtle)', fontWeight: 600 }}>{idx + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                          <i className="fa-solid fa-user-check" style={{ color: 'var(--primary)' }}></i>
                          <span>{o.name}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{o.bookingsCount}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>₹ {o.cashCollected.toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--secondary)' }}>₹ {o.upiCollected.toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--success-dark)', fontSize: '15px' }}>₹ {totalColl.toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AllBookingsTab;
