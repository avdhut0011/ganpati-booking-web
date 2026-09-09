import React, { useState, useRef } from 'react';
import { createBooking } from '../../api/bookingApi';
import Alert from '../shared/Alert';

const NewBookingForm = ({ onRefresh, bookings, activeOwner, ownersList = [], activeStall }) => {
  const validOwners = React.useMemo(() => {
    return (ownersList || []).filter(o => o && o !== 'सुपर अॅडमिन' && o !== 'admin');
  }, [ownersList]);

  const [formData, setFormData] = useState({
    bookingDate: new Date().toLocaleDateString('en-GB'),
    customerName: '',
    mobileNumber: '',
    emailId: '',
    statueNumber: '',
    totalAmount: '',
    advanceAmount: '',
    paymentMode: 'कॅश',
    bookedByOwner: (activeOwner && activeOwner !== 'सुपर अॅडमिन' && activeOwner !== 'admin') ? activeOwner : '',
    statueImageBase64: ''
  });

  React.useEffect(() => {
    if (activeOwner && validOwners.includes(activeOwner)) {
      setFormData(prev => ({ ...prev, bookedByOwner: activeOwner }));
    } else if (validOwners.length > 0) {
      setFormData(prev => {
        if (!prev.bookedByOwner || !validOwners.includes(prev.bookedByOwner)) {
          return { ...prev, bookedByOwner: validOwners[0] };
        }
        return prev;
      });
    }
  }, [activeOwner, validOwners]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [dupWarning, setDupWarning] = useState('');
  
  // Camera state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'statueNumber') {
      const isDup = (bookings || []).some(b => 
        String(b.statueNumber || b.statue_number || '').trim().toLowerCase() === String(value).trim().toLowerCase() && 
        (b.bookingStatus || b.status) !== 'CANCELLED'
      );
      setDupWarning(isDup ? '⚠️ सावधान! हा मूर्ती क्रमांक आधीच बुक झाला आहे.' : '');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, statueImageBase64: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Live Camera Capture Logic
  const startCamera = async () => {
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("कॅमेरा सुरू करताना त्रुटी आली. कृपया कॅमेरा परवानगी (Permission) तपासा.");
      setShowCameraModal(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setFormData(prev => ({ ...prev, statueImageBase64: dataUrl }));
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCameraModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (dupWarning) {
      setMessage({ type: 'error', text: 'कृपया दुसरा मूर्ती क्रमांक टाका.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    setSuccessData(null);
    try {
      const res = await createBooking(formData);
      if (res && res.success) {
        const savedMobile = formData.mobileNumber;
        const savedCustomer = formData.customerName;
        const resolvedPdfUrl = res.pdfUrl || `/uploads/pdfs/Bill_${res.bookingId}.pdf`;
        
        setSuccessData({
          bookingId: res.bookingId,
          pdfUrl: resolvedPdfUrl,
          pdfBase64: res.pdfBase64 || '',
          balanceAmount: res.balanceAmount,
          mobileNumber: savedMobile,
          customerName: savedCustomer
        });
        
        setMessage({ type: 'success', text: res.message || `बुकिंग यशस्वीरित्या नोंदवले गेले! आयडी: ${res.bookingId}` });
        
        // Reset form input
        setFormData({
          bookingDate: new Date().toLocaleDateString('en-GB'),
          customerName: '',
          mobileNumber: '',
          emailId: '',
          statueNumber: '',
          totalAmount: '',
          advanceAmount: '',
          paymentMode: 'कॅश',
          bookedByOwner: (activeOwner && validOwners.includes(activeOwner)) ? activeOwner : (validOwners[0] || ''),
          statueImageBase64: ''
        });

        // Trigger refresh of all bookings list
        if (typeof onRefresh === 'function') {
          onRefresh();
        }
      } else {
        setMessage({ type: 'error', text: res ? res.message : 'त्रुटी आली.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'सर्व्हरशी संपर्क साधता आला नाही.' });
    }
    setLoading(false);
  };

  const getWhatsappLink = () => {
    if (!successData) return '#';
    const pdfFullLink = successData.pdfUrl.startsWith('http') 
      ? successData.pdfUrl 
      : `${window.location.origin}${successData.pdfUrl}`;

    const text = 
      `🚩 *${activeStall?.stallName || 'गणपती बाप्पा'} - गणपती बाप्पा बुकिंग पावती* 🚩\n\n` +
      `नमस्कार *${successData.customerName}* जी,\n` +
      "आपले गणपती बाप्पा बुकिंग यशस्वीरीत्या नोंदवले गेले आहे!\n\n" +
      `🆔 *बुकिंग क्रमांक:* ${successData.bookingId}\n` +
      `📄 *मराठी बिल PDF डाऊनलोड करा:*\n${pdfFullLink}\n\n` +
      "🌺 *॥ गणपती बाप्पा मोरया ॥* 🌺";
    return `https://api.whatsapp.com/send?phone=91${successData.mobileNumber}&text=${encodeURIComponent(text)}`;
  };

  const total = parseFloat(formData.totalAmount) || 0;
  const advance = parseFloat(formData.advanceAmount) || 0;
  const balance = Math.max(0, total - advance);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <i className="fa-solid fa-pen-to-square" style={{ color: 'var(--primary)' }}></i>
            <span>नवीन मूर्ती बुकिंग नोंदणी</span>
          </h2>
          <p className="card-subtitle">ग्राहकाची माहिती व बुकिंग तपशील भरून त्वरित मराठी बिल तयार करा</p>
        </div>
      </div>

      {message && <Alert type={message.type} message={message.text} onClose={() => setMessage(null)} />}
      
      {/* SUCCESS NOTIFICATION & PDF BILL BANNER */}
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
              <span>बुकिंग नोंदणी यशस्वी झाली!</span>
            </h3>
            <button 
              type="button" 
              onClick={() => setSuccessData(null)} 
              style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-subtle)' }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '16px', background: 'rgba(255,255,255,0.7)', padding: '14px 18px', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>बुकिंग क्रमांक</div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--primary)' }}>{successData.bookingId}</div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>ग्राहकाचे नाव</div>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>{successData.customerName}</div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>मोबाईल नंबर</div>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>📞 {successData.mobileNumber}</div>
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>शिल्लक बाकी</div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--primary)' }}>₹ {parseFloat(successData.balanceAmount || 0).toLocaleString('en-IN')}</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '18px', flexWrap: 'wrap' }}>
            <a 
              href={successData.pdfUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="btn btn-primary" 
            >
              <i className="fa-solid fa-file-pdf"></i>
              <span>मराठी PDF बिल डाऊनलोड / प्रिंट</span>
            </a>

            <a 
              href={getWhatsappLink()} 
              target="_blank" 
              rel="noreferrer" 
              className="btn btn-whatsapp" 
            >
              <i className="fa-brands fa-whatsapp" style={{ fontSize: '17px' }}></i>
              <span>WhatsApp वर पावती पाठवा</span>
            </a>
          </div>
        </div>
      )}

      {/* CAMERA CAPTURE MODAL */}
      {showCameraModal && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fa-solid fa-camera" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
                मूर्तीचा लाईव्ह फोटो घ्या
              </h3>
              <button type="button" onClick={stopCamera} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ background: '#000', borderRadius: 'var(--radius-sm)', overflow: 'hidden', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }}></video>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={stopCamera}>
                रद्द करा
              </button>
              <button type="button" className="btn btn-primary" onClick={capturePhoto}>
                <i className="fa-solid fa-camera"></i> फोटो सेव्ह करा
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* SECTION 1: CUSTOMER DETAILS */}
        <div className="form-section-header">
          <i className="fa-solid fa-user-tag"></i>
          <span>१. ग्राहकाची माहिती (Customer Details)</span>
        </div>

        <div className="grid-3">
          <div className="form-group">
            <label className="form-label">दिनांक (Date) <span className="required">*</span></label>
            <div className="input-icon-wrap">
              <i className="fa-regular fa-calendar input-icon"></i>
              <input type="text" className="form-control" name="bookingDate" value={formData.bookingDate} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">ग्राहकाचे नाव (Customer Name) <span className="required">*</span></label>
            <div className="input-icon-wrap">
              <i className="fa-solid fa-user input-icon"></i>
              <input type="text" className="form-control" name="customerName" placeholder="उदा. अमित देशपांडे" value={formData.customerName} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">मोबाईल क्रमांक (Mobile Number) <span className="required">*</span></label>
            <div className="input-icon-wrap">
              <i className="fa-solid fa-phone input-icon"></i>
              <input type="tel" className="form-control" name="mobileNumber" placeholder="१० अंकी मोबाईल नंबर" pattern="[0-9]{10}" value={formData.mobileNumber} onChange={handleChange} required />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">ईमेल आयडी (Email ID - ऐच्छिक)</label>
          <div className="input-icon-wrap">
            <i className="fa-regular fa-envelope input-icon"></i>
            <input type="email" className="form-control" name="emailId" placeholder="उदा. example@gmail.com" value={formData.emailId} onChange={handleChange} />
          </div>
        </div>

        {/* SECTION 2: STATUE & PHOTO */}
        <div className="form-section-header">
          <i className="fa-solid fa-shapes"></i>
          <span>२. मूर्ती तपशील व फोटो (Statue Details)</span>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">मूर्ती क्रमांक (Statue Number) <span className="required">*</span></label>
            <div className="input-icon-wrap">
              <i className="fa-solid fa-tag input-icon"></i>
              <input type="text" className="form-control" name="statueNumber" placeholder="उदा. M-108 किंवा लालबाग-०१" value={formData.statueNumber} onChange={handleChange} required />
            </div>
            {dupWarning && (
              <div className="alert alert-error" style={{ marginTop: '8px', padding: '8px 12px', fontSize: '12px' }}>
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>{dupWarning}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">मूर्ती फोटो (Photo Upload / Camera)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="file" className="form-control" accept="image/*" onChange={handleImageChange} style={{ flex: 1 }} />
              <button type="button" className="btn btn-outline" onClick={startCamera} title="कॅमेरा उघडा">
                <i className="fa-solid fa-camera" style={{ color: 'var(--primary)' }}></i>
                <span>कॅमेरा</span>
              </button>
            </div>
          </div>
        </div>

        {formData.statueImageBase64 && (
          <div style={{ margin: '8px 0 16px 0' }}>
            <div className="photo-preview-wrap">
              <img src={formData.statueImageBase64} alt="Statue Preview" className="photo-preview-img" />
              <button 
                type="button" 
                className="photo-remove-btn" 
                onClick={() => setFormData(prev => ({ ...prev, statueImageBase64: '' }))}
                title="फोटो काढा"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* SECTION 3: PAYMENT & FINANCIALS */}
        <div className="form-section-header">
          <i className="fa-solid fa-indian-rupee-sign"></i>
          <span>३. रक्कम, पेमेंट व मालक तपशील (Payment Breakdown)</span>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">एकूण ठरलेली रक्कम (Total Amount ₹) <span className="required">*</span></label>
            <div className="input-icon-wrap">
              <i className="fa-solid fa-calculator input-icon"></i>
              <input type="number" className="form-control" name="totalAmount" placeholder="0" value={formData.totalAmount} onChange={handleChange} required min="0" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">जमा ॲडव्हान्स रक्कम (Advance Amount ₹) <span className="required">*</span></label>
            <div className="input-icon-wrap">
              <i className="fa-solid fa-hand-holding-dollar input-icon"></i>
              <input type="number" className="form-control" name="advanceAmount" placeholder="0" value={formData.advanceAmount} onChange={handleChange} required min="0" />
            </div>
          </div>
        </div>

        {/* LIVE BALANCE SUMMARY PILL */}
        <div className="balance-summary-box">
          <div className="balance-item">
            <div className="balance-item-label">एकूण रक्कम</div>
            <div className="balance-item-val" style={{ color: 'var(--text-main)' }}>₹ {total.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ color: 'var(--text-subtle)', fontSize: '20px' }}>−</div>
          <div className="balance-item">
            <div className="balance-item-label">जमा ॲडव्हान्स</div>
            <div className="balance-item-val" style={{ color: 'var(--success)' }}>₹ {advance.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ color: 'var(--text-subtle)', fontSize: '20px' }}>=</div>
          <div className="balance-item">
            <div className="balance-item-label">शिल्लक बाकी येणे</div>
            <div className="balance-item-val" style={{ color: balance > 0 ? 'var(--primary)' : 'var(--success)' }}>
              ₹ {balance.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* PAYMENT MODE TILES */}
        <div className="form-group" style={{ marginTop: '18px' }}>
          <label className="form-label">पेमेंट प्रकार (Payment Mode) <span className="required">*</span></label>
          <div className="radio-tiles-grid">
            {[
              { id: 'कॅश', icon: 'fa-solid fa-money-bill-wave', label: 'कॅश (Cash)' },
              { id: 'UPI', icon: 'fa-solid fa-qrcode', label: 'UPI / QR' },
              { id: 'ऑनलाईन', icon: 'fa-solid fa-building-columns', label: 'ऑनलाईन (Bank)' }
            ].map(item => (
              <div 
                key={item.id}
                className={`radio-tile-card ${formData.paymentMode === item.id ? 'selected' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, paymentMode: item.id }))}
              >
                <i className={`${item.icon} radio-tile-icon`}></i>
                <span className="radio-tile-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* BOOKED BY OWNER TILES */}
        <div className="form-group" style={{ marginTop: '18px' }}>
          <label className="form-label">बुकिंग नोंदवणारा मालक (Booked By Co-owner) <span className="required">*</span></label>
          <div className="radio-tiles-grid">
            {validOwners.map(owner => (
              <div 
                key={owner}
                className={`radio-tile-card ${formData.bookedByOwner === owner ? 'selected' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, bookedByOwner: owner }))}
              >
                <i className="fa-solid fa-user-check radio-tile-icon"></i>
                <span className="radio-tile-label">{owner}</span>
              </div>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary btn-block" 
          style={{ padding: '14px', fontSize: '15.5px', marginTop: '24px' }} 
          disabled={loading}
        >
          {loading ? (
            <>
              <i className="fa-solid fa-spinner fa-spin"></i>
              <span>नोंदणी करत आहे...</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-check-circle"></i>
              <span>बुकिंग नोंदवा व पावती तयार करा (Submit Booking)</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default NewBookingForm;
