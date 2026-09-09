import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initFirstTimeSetup } from '../api/adminApi';
import Alert from '../components/shared/Alert';

export default function FirstTimeSetup() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ message: '', type: 'info' });

  // Step 1: Stall Info
  const [stallForm, setStallForm] = useState({
    stallName: 'सदिच्छा कला केंद्र',
    stallNumber: 'स्टॉल क्र.१०',
    locationAddress: 'उदाजी महाराज म्युझियम, आकाशवाणी टॉवर जवळ, गंगापूर रोड, नाशिक',
    contactPhone: '8390397800',
    contactEmail: ''
  });

  // Step 2: Owner Info
  const [ownerForm, setOwnerForm] = useState({
    displayName: '',
    username: '',
    password: ''
  });

  const handleStallChange = (e) => {
    setStallForm({ ...stallForm, [e.target.name]: e.target.value });
  };

  const handleOwnerChange = (e) => {
    setOwnerForm({ ...ownerForm, [e.target.name]: e.target.value });
  };

  const goToStep2 = (e) => {
    e.preventDefault();
    if (!stallForm.stallName.trim()) {
      setAlert({ message: 'कृपया स्टॉलचे नाव टाका.', type: 'error' });
      return;
    }
    setAlert({ message: '', type: 'info' });
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ownerForm.username.trim() || !ownerForm.password.trim()) {
      setAlert({ message: 'कृपया युझरनेम आणि पासवर्ड टाका.', type: 'error' });
      return;
    }

    setLoading(true);
    setAlert({ message: '', type: 'info' });

    try {
      const payload = {
        stall: stallForm,
        owner: {
          username: ownerForm.username.trim(),
          password: ownerForm.password.trim(),
          displayName: (ownerForm.displayName.trim() || ownerForm.username.trim())
        }
      };

      const res = await initFirstTimeSetup(payload);
      if (res.success && res.access_token) {
        login(res.access_token, res.user, res.stall);
        setAlert({ message: 'सेटअप यशस्वीरीत्या पूर्ण झाला! मुख्य पानावर जात आहे...', type: 'success' });
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1000);
      } else {
        setAlert({ message: res.message || 'सेटअप अपयशी ठरला.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setAlert({ message: err.response?.data?.detail || 'सर्व्हर त्रुटी निर्माण झाली.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-[#6c3483] linear-gradient(135deg, #2c0838 0%, #6c3483 50%, #d35400 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        maxWidth: '560px',
        width: '100%',
        boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        border: '2px solid #f4d03f'
      }}>
        {/* Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #d35400 0%, #6c3483 100%)',
          color: '#ffffff',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '6px' }}>
            🌺 ॥ श्री गणेशाय नमः ॥ 🌺
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: '4px 0', color: '#f4d03f' }}>
            गणपती बाप्पा बुकिंग सिस्टीम
          </h2>
          <p style={{ fontSize: '0.95rem', opacity: 0.9, marginTop: '4px' }}>
            प्रारंभिक माहिती व स्टॉल नोंदणी (First-Time Setup)
          </p>

          {/* Stepper Progress */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '20px',
            gap: '15px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: step === 1 ? 'bold' : 'normal',
              opacity: step === 1 ? 1 : 0.7,
              background: step === 1 ? 'rgba(255,255,255,0.2)' : 'transparent',
              padding: '6px 14px',
              borderRadius: '20px',
              border: step === 1 ? '1px solid #f4d03f' : '1px solid transparent'
            }}>
              <span>1. 🏬 स्टॉल माहिती</span>
            </div>
            <span style={{ fontSize: '1.2rem', color: '#f4d03f' }}>➔</span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: step === 2 ? 'bold' : 'normal',
              opacity: step === 2 ? 1 : 0.7,
              background: step === 2 ? 'rgba(255,255,255,0.2)' : 'transparent',
              padding: '6px 14px',
              borderRadius: '20px',
              border: step === 2 ? '1px solid #f4d03f' : '1px solid transparent'
            }}>
              <span>2. 👤 मालक खाते</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px 28px' }}>
          {alert.message && (
            <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ message: '', type: 'info' })} />
          )}

          {step === 1 ? (
            <form onSubmit={goToStep2}>
              <h3 style={{ borderBottom: '2px solid #f5cba7', paddingBottom: '8px', color: '#6c3483', marginBottom: '18px' }}>
                🏬 पायरी १: स्टॉल तपशील प्रविष्ट करा
              </h3>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#2c3e50' }}>
                  स्टॉल / दुकानाचे नाव *
                </label>
                <input
                  type="text"
                  name="stallName"
                  value={stallForm.stallName}
                  onChange={handleStallChange}
                  placeholder="उदा. सदिच्छा कला केंद्र"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#2c3e50' }}>
                  स्टॉल क्रमांक
                </label>
                <input
                  type="text"
                  name="stallNumber"
                  value={stallForm.stallNumber}
                  onChange={handleStallChange}
                  placeholder="उदा. स्टॉल क्र.१०"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#2c3e50' }}>
                  स्टॉलचा पत्ता / ठिकाण
                </label>
                <textarea
                  name="locationAddress"
                  value={stallForm.locationAddress}
                  onChange={handleStallChange}
                  rows="2"
                  placeholder="उदा. उदाजी महाराज म्युझियम, आकाशवाणी टॉवर जवळ, गंगापूर रोड, नाशिक"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#2c3e50' }}>
                    मोबाईल क्रमांक
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={stallForm.contactPhone}
                    onChange={handleStallChange}
                    placeholder="उदा. 8390397800"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #ccc',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#2c3e50' }}>
                    ईमेल आयडी (ऐच्छिक)
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={stallForm.contactEmail}
                    onChange={handleStallChange}
                    placeholder="उदा. contact@example.com"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #ccc',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #d35400 0%, #e67e22 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(211,84,0,0.3)'
                }}
              >
                पुढे जा (Next) ➔
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <h3 style={{ borderBottom: '2px solid #f5cba7', paddingBottom: '8px', color: '#6c3483', marginBottom: '18px' }}>
                👤 पायरी २: मालकाचे लॉगिन खाते तयार करा
              </h3>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#2c3e50' }}>
                  मालकाचे नाव (Display Name) *
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={ownerForm.displayName}
                  onChange={handleOwnerChange}
                  placeholder="उदा. शिव / अविनाश पाटील"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#2c3e50' }}>
                  युझरनेम (Username for Login) *
                </label>
                <input
                  type="text"
                  name="username"
                  value={ownerForm.username}
                  onChange={handleOwnerChange}
                  placeholder="उदा. shiv123"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#2c3e50' }}>
                  पासवर्ड (Password) *
                </label>
                <input
                  type="password"
                  name="password"
                  value={ownerForm.password}
                  onChange={handleOwnerChange}
                  placeholder="********"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    flex: '1',
                    background: '#95a5a6',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  ◀ मागे
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: '2',
                    background: 'linear-gradient(135deg, #27ae60 0%, #2ec4b6 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '1.05rem',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(39,174,96,0.3)'
                  }}
                >
                  {loading ? 'सेटअप सेव्ह होत आहे...' : '🚀 सेटअप पूर्ण करा व अ‍ॅप सुरू करा'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
