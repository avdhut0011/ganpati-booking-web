import React, { useState } from 'react';
import { exportCsv } from '../../api/adminApi';

const ExportPanel = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      await exportCsv();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (e) {
      console.error(e);
      alert("डेटा एक्सपोर्ट करताना त्रुटी आली.");
    }
    setLoading(false);
  };

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
          <i className="fa-solid fa-file-excel"></i>
        </div>
        <div>
          <h3 style={{ margin: 0, color: 'var(--plum-900)' }}>डेटा एक्सपोर्ट (Export Data to CSV)</h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--neutral-500)' }}>
            सर्व बुकिंग्स, पेमेंट व ग्राहक तपशील एका क्लिकवर एक्सेल किंवा CSV फॉरमॅटमध्ये डाऊनलोड करा.
          </p>
        </div>
      </div>

      <div style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--plum-900)' }}>
          <i className="fa-solid fa-circle-info" style={{ color: 'var(--saffron-500)', marginRight: '6px' }}></i>
          एक्सपोर्ट फाईलमध्ये समाविष्ट असणारे तपशील:
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {['बुकिंग आयडी', 'बुकिंग दिनांक', 'ग्राहकाचे नाव', 'मोबाईल क्रमांक', 'मूर्ती क्रमांक', 'एकूण रक्कम (₹)', 'जमा रक्कम (₹)', 'बाकी रक्कम (₹)', 'पेमेंट प्रकार', 'बुकिंग करणारा', 'सद्यस्थिती', 'अंतिम भरणा तपशील', 'रद्दीकरण कारण'].map((field, i) => (
            <span key={i} style={{ background: '#fff', border: '1px solid var(--neutral-300)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: 'var(--neutral-700)', fontWeight: 500 }}>
              ✓ {field}
            </span>
          ))}
        </div>
      </div>

      {success && (
        <div style={{ background: '#e8f8f0', border: '1px solid var(--success)', color: 'var(--success-dark)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>
          <i className="fa-solid fa-circle-check" style={{ marginRight: '8px' }}></i>
          CSV फाईल यशस्वीरित्या डाऊनलोड झाली आहे!
        </div>
      )}

      <button 
        className="btn btn-primary" 
        onClick={handleExport} 
        disabled={loading}
        style={{ padding: '12px 24px', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}
      >
        <i className={loading ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-cloud-arrow-down'}></i>
        {loading ? 'फाईल तयार होत आहे...' : 'सर्व बुकिंग्ज CSV डाऊनलोड करा'}
      </button>
    </div>
  );
};

export default ExportPanel;
