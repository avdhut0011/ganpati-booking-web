import React, { useState } from 'react';
import { searchBooking, cancelBooking } from '../../api/bookingApi';
import Alert from '../shared/Alert';
import ConfirmModal from '../shared/ConfirmModal';

const CancelTab = ({ onRefresh, activeOwner, ownersList = [] }) => {
  const validOwners = React.useMemo(() => {
    return (ownersList || []).filter(o => o && o !== 'सुपर अॅडमिन' && o !== 'admin');
  }, [ownersList]);

  const [query, setQuery] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [payload, setPayload] = useState({
    cancellationReason: '',
    cancellationOwner: (activeOwner && validOwners.includes(activeOwner)) ? activeOwner : (validOwners[0] || '')
  });
  const [showConfirm, setShowConfirm] = useState(false);

  React.useEffect(() => {
    if (activeOwner && validOwners.includes(activeOwner)) {
      setPayload(prev => ({ ...prev, cancellationOwner: activeOwner }));
    } else if (validOwners.length > 0) {
      setPayload(prev => {
        if (!prev.cancellationOwner || !validOwners.includes(prev.cancellationOwner)) {
          return { ...prev, cancellationOwner: validOwners[0] };
        }
        return prev;
      });
    }
  }, [activeOwner, validOwners]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      setMessage({ type: 'error', text: 'कृपया बुकिंग आयडी किंवा मोबाईल नंबर टाका.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    setSuccessData(null);
    setBooking(null);
    try {
      const res = await searchBooking(query.trim());
      if (res && res.success && res.booking) {
        if (res.booking.bookingStatus === 'CANCELLED') {
          setMessage({ type: 'error', text: `बुकिंग आयडी ${res.booking.bookingId} आधीच रद्द (CANCELLED) झाले आहे.` });
        } else {
          setBooking(res.booking);
        }
      } else {
        setMessage({ type: 'error', text: res ? res.message : 'माहिती सापडली नाही.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'शोधताना सर्व्हर त्रुटी आली.' });
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!booking) return;
    setShowConfirm(false);
    setLoading(true);
    setMessage(null);
    try {
      const res = await cancelBooking(booking.bookingId, payload);
      if (res && res.success) {
        const savedBooking = { ...booking };
        setSuccessData({
          bookingId: savedBooking.bookingId,
          customerName: savedBooking.customerName,
          mobileNumber: savedBooking.mobileNumber,
          statueNumber: savedBooking.statueNumber,
          cancellationOwner: payload.cancellationOwner,
          cancellationReason: payload.cancellationReason || 'ग्राहकाची विनंती'
        });

        setMessage({ type: 'success', text: res.message || `बुकिंग ${savedBooking.bookingId} यशस्वीरित्या रद्द करण्यात आले.` });
        setBooking(null);
        setQuery('');
        if (typeof onRefresh === 'function') onRefresh();
      } else {
        setMessage({ type: 'error', text: res ? res.message : 'रद्द करण्यात त्रुटी.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'बुकिंग रद्द करताना सर्व्हर त्रुटी आली.' });
    }
    setLoading(false);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <i className="fa-solid fa-rectangle-xmark" style={{ color: 'var(--danger)' }}></i>
            <span>मूर्ती बुकिंग रद्द करणे</span>
          </h2>
          <p className="card-subtitle">अपरिहार्य कारणास्तव ग्राहकाची मूर्ती बुकिंग सुरक्षितपणे रद्द करा</p>
        </div>
      </div>

      {message && <Alert type={message.type} message={message.text} onClose={() => setMessage(null)} />}
      
      {/* SUCCESS NOTIFICATION FOR CANCEL BOOKING */}
      {successData && (
        <div style={{ 
          background: 'var(--danger-bg)', 
          border: '1.5px solid var(--danger-border)', 
          padding: '24px', 
          borderRadius: 'var(--radius-lg)', 
          marginBottom: '28px', 
          boxShadow: 'var(--shadow-md)' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: 'var(--danger-dark)', margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-circle-xmark" style={{ fontSize: '22px', color: 'var(--danger)' }}></i>
              <span>बुकिंग यशस्वीरीत्या रद्द झाले!</span>
            </h3>
            <button type="button" onClick={() => setSuccessData(null)} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-subtle)' }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '16px', background: 'rgba(255,255,255,0.75)', padding: '14px 18px', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>बुकिंग क्रमांक</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--danger)' }}>{successData.bookingId}</div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>ग्राहकाचे नाव</div>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>{successData.customerName}</div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>मूर्ती क्रमांक</div>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>{successData.statueNumber}</div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>रद्द करण्याचे कारण</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>{successData.cancellationReason}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* SEARCH BAR */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <div className="input-icon-wrap" style={{ flex: 1 }}>
          <i className="fa-solid fa-magnifying-glass input-icon"></i>
          <input 
            type="text" 
            className="form-control" 
            placeholder="रद्द करण्यासाठी बुकिंग आयडी, मोबाईल किंवा मूर्ती क्र. शोधा" 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap', padding: '0 24px' }} disabled={loading}>
          {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-magnifying-glass"></i>}
          <span>शोधा</span>
        </button>
      </form>

      {booking && (
        <div style={{ background: '#FFF9F9', border: '1.5px solid var(--danger-border)', padding: '22px', borderRadius: 'var(--radius-md)' }}>
          <div className="form-section-header" style={{ marginTop: 0, color: 'var(--danger-dark)', borderBottomColor: 'var(--danger-border)' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>रद्द करण्यासाठी निवडलेले बुकिंग</span>
          </div>
          
          <div className="grid-3" style={{ marginBottom: '18px', background: '#FFFFFF', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>बुकिंग आयडी:</span> <div style={{ color: 'var(--danger)', fontWeight: 800 }}>{booking.bookingId}</div></div>
            <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>ग्राहकाचे नाव:</span> <div style={{ fontWeight: 700 }}>{booking.customerName}</div></div>
            <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>मोबाईल:</span> <div>📞 {booking.mobileNumber}</div></div>
            <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>मूर्ती क्रमांक:</span> <div style={{ fontWeight: 700 }}>{booking.statueNumber}</div></div>
            <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>नोंदणी दिनांक:</span> <div>{booking.bookingDate}</div></div>
            <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>स्थिती:</span> <div><span className={`badge badge-${booking.bookingStatus.toLowerCase()}`}>{booking.bookingStatus}</span></div></div>
          </div>

          <div className="form-group">
            <label className="form-label">रद्द करण्याचे कारण (Cancellation Reason) <span className="required">*</span></label>
            <textarea 
              className="form-control" 
              placeholder="उदा. ग्राहकाची वैयक्तिक अडचण / मूर्ती बदलली / ऑर्डर रद्द" 
              value={payload.cancellationReason} 
              onChange={e => setPayload({...payload, cancellationReason: e.target.value})} 
              rows="2"
            ></textarea>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">रद्द करणारा मालक (Cancellation Owner) <span className="required">*</span></label>
            <div className="radio-tiles-grid">
              {validOwners.map(owner => (
                <div 
                  key={owner}
                  className={`radio-tile-card ${payload.cancellationOwner === owner ? 'selected' : ''}`}
                  onClick={() => setPayload({ ...payload, cancellationOwner: owner })}
                >
                  <i className="fa-solid fa-user-xmark radio-tile-icon" style={{ color: 'var(--danger)' }}></i>
                  <span className="radio-tile-label">{owner}</span>
                </div>
              ))}
            </div>
          </div>

          <button 
            type="button"
            className="btn btn-danger btn-block" 
            onClick={() => setShowConfirm(true)} 
            disabled={loading} 
            style={{ padding: '14px', fontSize: '15px', marginTop: '20px' }}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>रद्द करत आहे...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-trash-can"></i>
                <span>बुकिंग कायमस्वरूपी रद्द करा (Confirm Cancellation)</span>
              </>
            )}
          </button>
        </div>
      )}

      <ConfirmModal 
        isOpen={showConfirm} 
        title="⚠️ बुकिंग नक्की रद्द करायचे का?" 
        message={`बुकिंग आयडी ${booking?.bookingId} (ग्राहक: ${booking?.customerName}) रद्द करण्यात येईल. हि कृती पुन्हा बदलता येणार नाही.`}
        onConfirm={handleCancel}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
};

export default CancelTab;
