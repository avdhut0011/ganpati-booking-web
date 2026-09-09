import React, { useState } from 'react';
import { searchBooking, markBookingPaid } from '../../api/bookingApi';
import Alert from '../shared/Alert';

const MarkPaidTab = ({ onRefresh, activeOwner, ownersList = [], activeStall }) => {
  const validOwners = React.useMemo(() => {
    return (ownersList || []).filter(o => o && o !== 'सुपर अॅडमिन' && o !== 'admin');
  }, [ownersList]);

  const [query, setQuery] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [payload, setPayload] = useState({
    finalPaymentMode: 'कॅश',
    finalPaymentOwner: (activeOwner && validOwners.includes(activeOwner)) ? activeOwner : (validOwners[0] || ''),
    paidAmount: 0
  });

  React.useEffect(() => {
    if (activeOwner && validOwners.includes(activeOwner)) {
      setPayload(prev => ({ ...prev, finalPaymentOwner: activeOwner }));
    } else if (validOwners.length > 0) {
      setPayload(prev => {
        if (!prev.finalPaymentOwner || !validOwners.includes(prev.finalPaymentOwner)) {
          return { ...prev, finalPaymentOwner: validOwners[0] };
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
        if (res.booking.bookingStatus === 'PAID') {
          setMessage({ type: 'error', text: `बुकिंग आयडी ${res.booking.bookingId} चे स्टेटस आधीच 'PAID' (पूर्ण जमा) आहे!` });
        } else if (res.booking.bookingStatus === 'CANCELLED') {
          setMessage({ type: 'error', text: `बुकिंग आयडी ${res.booking.bookingId} रद्द (CANCELLED) झाले आहे.` });
        } else {
          setBooking(res.booking);
          setPayload({
            finalPaymentMode: 'कॅश',
            finalPaymentOwner: activeOwner || '',
            paidAmount: res.booking.balanceAmount || 0
          });
        }
      } else {
        setMessage({ type: 'error', text: res ? res.message : 'माहिती सापडली नाही.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'शोधताना सर्व्हर त्रुटी आली.' });
    }
    setLoading(false);
  };

  const handlePay = async () => {
    if (!booking) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await markBookingPaid(booking.bookingId, payload);
      if (res && res.success) {
        const savedBooking = { ...booking };
        const pdfPath = savedBooking.pdfBillUrl || `/uploads/pdfs/Bill_${savedBooking.bookingId}.pdf`;
        const isFull = (payload.paidAmount || 0) >= (savedBooking.balanceAmount || 0);
        
        setSuccessData({
          bookingId: savedBooking.bookingId,
          customerName: savedBooking.customerName,
          mobileNumber: savedBooking.mobileNumber,
          statueNumber: savedBooking.statueNumber,
          totalAmount: savedBooking.totalAmount,
          paidAmount: payload.paidAmount,
          finalPaymentOwner: payload.finalPaymentOwner,
          finalPaymentMode: payload.finalPaymentMode,
          pdfUrl: pdfPath,
          isFullPayment: isFull
        });

        setMessage({ type: 'success', text: res.message || `बुकिंग ${savedBooking.bookingId} चे बाकी जमा यशस्वीरित्या झाले!` });
        setBooking(null);
        setQuery('');
        if (typeof onRefresh === 'function') onRefresh();
      } else {
        setMessage({ type: 'error', text: res ? res.message : 'अपडेट करण्यात त्रुटी.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'पेमेंट अपडेट करताना सर्व्हर त्रुटी आली.' });
    }
    setLoading(false);
  };

  const getWhatsappPaidLink = () => {
    if (!successData) return '#';
    const pdfFullLink = successData.pdfUrl.startsWith('http') 
      ? successData.pdfUrl 
      : `${window.location.origin}${successData.pdfUrl}`;

    const text = 
      `🚩 *${activeStall?.stallName || 'गणपती बाप्पा'} - बाकी जमा पावती (RECEIPT)* 🚩\n\n` +
      `नमस्कार *${successData.customerName}* जी,\n` +
      `आपल्या गणपती बाप्पा बुकिंग (आयडी: *${successData.bookingId}*) ची ₹${successData.paidAmount} रक्कम जमा झाली आहे!\n\n` +
      `✅ *स्थिती:* ${successData.isFullPayment ? 'PAID (पूर्ण जमा)' : 'BOOKED (अंशतः जमा)'}\n` +
      `💳 *पेमेंट प्रकार:* ${successData.finalPaymentMode}\n` +
      `👤 *जमा घेणारा:* ${successData.finalPaymentOwner}\n` +
      `📄 *मराठी बिल PDF डाऊनलोड करा:*\n${pdfFullLink}\n\n` +
      "🌺 *॥ गणपती बाप्पा मोरया ॥* 🌺";
    return `https://api.whatsapp.com/send?phone=91${successData.mobileNumber}&text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <i className="fa-solid fa-hand-holding-dollar" style={{ color: 'var(--success)' }}></i>
            <span>शिल्लक बाकी रक्कम जमा करणे</span>
          </h2>
          <p className="card-subtitle">बुकिंग शोधून उर्वरित किंवा अंशतः बाकी रक्कम जमा करा व पावती द्या</p>
        </div>
      </div>

      {message && <Alert type={message.type} message={message.text} onClose={() => setMessage(null)} />}
      
      {/* SUCCESS NOTIFICATION FOR MARK PAID */}
      {successData && (
        <div style={{ 
          background: 'linear-gradient(135deg, #ECFDF5 0%, #E0F2FE 100%)', 
          border: '1.5px solid var(--success-border)', 
          padding: '24px', 
          borderRadius: 'var(--radius-lg)', 
          marginBottom: '28px', 
          boxShadow: 'var(--shadow-md)' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: 'var(--success-dark)', margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: '22px', color: 'var(--success)' }}></i>
              <span>बाकी रक्कम जमा नोंदणी यशस्वी! ({successData.isFullPayment ? 'PAID - पूर्ण जमा' : 'अंशतः जमा'})</span>
            </h3>
            <button type="button" onClick={() => setSuccessData(null)} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-subtle)' }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '16px', background: 'rgba(255,255,255,0.75)', padding: '14px 18px', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>बुकिंग क्रमांक</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)' }}>{successData.bookingId}</div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>ग्राहकाचे नाव</div>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>{successData.customerName}</div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>मूर्ती क्रमांक</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--success-dark)' }}>{successData.statueNumber}</div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>आता जमा केलेली रक्कम</div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--success)' }}>₹ {parseFloat(successData.paidAmount || 0).toLocaleString('en-IN')}</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '18px', flexWrap: 'wrap' }}>
            <a href={successData.pdfUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
              <i className="fa-solid fa-file-pdf"></i>
              <span>अपडेटेड मराठी बिल PDF पहा / प्रिंट</span>
            </a>
            <a href={getWhatsappPaidLink()} target="_blank" rel="noreferrer" className="btn btn-whatsapp">
              <i className="fa-brands fa-whatsapp" style={{ fontSize: '17px' }}></i>
              <span>WhatsApp वर पावती पाठवा</span>
            </a>
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
            placeholder="बुकिंग आयडी (उदा. GB-2026-0001), मोबाईल नंबर किंवा मूर्ती क्र. शोधा" 
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
        <div style={{ background: 'var(--surface-subtle)', border: '1.5px solid var(--border)', padding: '22px', borderRadius: 'var(--radius-md)' }}>
          <div className="form-section-header" style={{ marginTop: 0 }}>
            <i className="fa-solid fa-file-invoice"></i>
            <span>बुकिंग माहिती व शिल्लक बाकी हिशोब</span>
          </div>
          
          <div className="grid-3" style={{ marginBottom: '18px', background: '#FFFFFF', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>बुकिंग आयडी:</span> <div style={{ color: 'var(--primary)', fontWeight: 800 }}>{booking.bookingId}</div></div>
            <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>ग्राहकाचे नाव:</span> <div style={{ fontWeight: 700 }}>{booking.customerName}</div></div>
            <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>मोबाईल:</span> <div>📞 {booking.mobileNumber}</div></div>
            <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>मूर्ती क्रमांक:</span> <div style={{ color: 'var(--success-dark)', fontWeight: 700 }}>{booking.statueNumber}</div></div>
            <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>एकूण रक्कम:</span> <div style={{ fontWeight: 700 }}>₹ {parseFloat(booking.totalAmount || 0).toLocaleString('en-IN')}</div></div>
            <div><span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>आधी जमा रक्कम:</span> <div style={{ color: 'var(--success)', fontWeight: 700 }}>₹ {parseFloat(booking.advanceAmount || 0).toLocaleString('en-IN')}</div></div>
          </div>

          {/* EDITABLE DEPOSIT AMOUNT INPUT */}
          <div className="form-group" style={{ background: '#FFF8EB', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--warning-border)', marginBottom: '18px' }}>
            <label htmlFor="paidAmountInput" className="form-label" style={{ fontSize: '14px', color: 'var(--warning-dark)' }}>
              💰 आता जमा करायची नवीन रक्कम (₹):
            </label>
            <div className="input-icon-wrap">
              <i className="fa-solid fa-indian-rupee-sign input-icon" style={{ color: 'var(--primary)' }}></i>
              <input 
                id="paidAmountInput"
                type="number" 
                className="form-control" 
                style={{ fontWeight: '800', fontSize: '18px', color: 'var(--primary)', backgroundColor: '#FFFFFF' }}
                value={payload.paidAmount} 
                onChange={e => {
                  const val = parseFloat(e.target.value) || 0;
                  const capped = Math.min(Math.max(0, val), booking.balanceAmount || 0);
                  setPayload({...payload, paidAmount: capped});
                }} 
                min="0"
                max={booking.balanceAmount || 0}
                step="1"
              />
            </div>

            {/* LIVE CALCULATION SUMMARY */}
            <div style={{ marginTop: '14px', background: '#FFFFFF', padding: '14px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13.5px' }}>
                <span style={{ color: 'var(--text-muted)' }}>आधी जमा झालेली रक्कम:</span>
                <strong>₹ {parseFloat(booking.advanceAmount || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13.5px', color: 'var(--success)' }}>
                <span>+ आता नवीन जमा:</span>
                <strong>₹ {parseFloat(payload.paidAmount || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>उर्वरित बाकी येणे:</span>
                <span style={{ 
                  fontSize: '18px', 
                  fontWeight: 800, 
                  color: (parseFloat(booking.balanceAmount || 0) - parseFloat(payload.paidAmount || 0)) <= 0 ? 'var(--success)' : 'var(--primary)' 
                }}>
                  ₹ {Math.max(0, parseFloat(booking.balanceAmount || 0) - parseFloat(payload.paidAmount || 0)).toLocaleString('en-IN')}
                  {(parseFloat(booking.balanceAmount || 0) - parseFloat(payload.paidAmount || 0)) <= 0 && ' (पूर्ण पेड ✅)'}
                </span>
              </div>
            </div>
          </div>

          {/* PAYMENT MODE TILES */}
          <div className="form-group">
            <label className="form-label">अंतिम पेमेंट प्रकार (Payment Mode) <span className="required">*</span></label>
            <div className="radio-tiles-grid">
              {[
                { id: 'कॅश', icon: 'fa-solid fa-money-bill-wave', label: 'कॅश (Cash)' },
                { id: 'UPI', icon: 'fa-solid fa-qrcode', label: 'UPI / QR' },
                { id: 'ऑनलाईन', icon: 'fa-solid fa-building-columns', label: 'ऑनलाईन (Bank)' }
              ].map(item => (
                <div 
                  key={item.id}
                  className={`radio-tile-card ${payload.finalPaymentMode === item.id ? 'selected' : ''}`}
                  onClick={() => setPayload({ ...payload, finalPaymentMode: item.id })}
                >
                  <i className={`${item.icon} radio-tile-icon`}></i>
                  <span className="radio-tile-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* COLLECTING OWNER TILES */}
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">रक्कम जमा घेणारा मालक (Payment Owner) <span className="required">*</span></label>
            <div className="radio-tiles-grid">
              {validOwners.map(owner => (
                <div 
                  key={owner}
                  className={`radio-tile-card ${payload.finalPaymentOwner === owner ? 'selected' : ''}`}
                  onClick={() => setPayload({ ...payload, finalPaymentOwner: owner })}
                >
                  <i className="fa-solid fa-user-check radio-tile-icon"></i>
                  <span className="radio-tile-label">{owner}</span>
                </div>
              ))}
            </div>
          </div>

          <button 
            type="button"
            className="btn btn-success btn-block" 
            onClick={handlePay} 
            disabled={loading || (payload.paidAmount || 0) <= 0} 
            style={{ padding: '14px', fontSize: '15px', marginTop: '20px' }}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>अपडेट करत आहे...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-circle-check"></i>
                <span>₹{parseFloat(payload.paidAmount || 0).toLocaleString('en-IN')} जमा नोंदवा {payload.paidAmount >= (booking.balanceAmount || 0) ? "→ 'PAID' (पूर्ण जमा)" : "→ अंशतः बाकी नोंदवा"}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default MarkPaidTab;
