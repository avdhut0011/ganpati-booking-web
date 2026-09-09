import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin, adminRegister } from '../api/adminApi';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/shared/Alert';

const OwnerAuth = () => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  
  // Login Form Fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration Form Fields
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { token, login, activeStall } = useAuth();

  React.useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await adminLogin(loginUsername.trim(), loginPassword);
      if (res && res.access_token) {
        login(res.access_token, res.user);
        navigate('/', { replace: true });
      } else {
        setMessage({ type: 'error', text: 'लॉगिन अयशस्वी. कृपया युझरनेम व पासवर्ड तपासा.' });
      }
    } catch (err) {
      console.error("Login error:", err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.detail || 'युझरनेम किंवा पासवर्ड चुकीचा आहे!' 
      });
    }
    setLoading(false);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        displayName: regDisplayName.trim(),
        username: regUsername.trim(),
        password: regPassword
      };
      const res = await adminRegister(payload);
      if (res && res.success) {
        setMessage({ type: 'success', text: res.message || 'नोंदणी यशस्वी झाली! आता लॉगिन करा.' });
        // Auto switch to login tab with prefilled username
        setLoginUsername(regUsername.trim());
        setMode('login');
        setRegDisplayName('');
        setRegUsername('');
        setRegPassword('');
      } else {
        setMessage({ type: 'error', text: res ? res.message : 'नोंदणी अयशस्वी.' });
      }
    } catch (err) {
      console.error("Register error:", err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.detail || err.response?.data?.message || 'नोंदणी करताना त्रुटी आली.' 
      });
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(180deg, #fdfbf7 0%, #f7f0e3 100%)', padding: '20px' }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', boxShadow: '0 12px 35px rgba(211, 84, 0, 0.18)', border: '2.5px solid var(--primary)', borderRadius: '18px', background: '#ffffff' }}>
        
        {/* HEADER BANNER */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <h2 style={{ color: 'var(--primary)', margin: 0, fontSize: '24px', fontWeight: '800' }}>
            🌺 {activeStall?.stallName || 'सदिच्छा कला केंद्र'} 🌺
          </h2>
          <p style={{ color: 'var(--secondary)', fontWeight: 'bold', marginTop: '5px', fontSize: '15px' }}>
            गणपती बाप्पा मूर्ती बुकिंग पोर्टल
          </p>
        </div>

        {/* TABS SWITCHER */}
        <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: '20px' }}>
          <button 
            type="button"
            style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: mode === 'login' ? '3px solid var(--primary)' : 'none', color: mode === 'login' ? 'var(--primary)' : '#7f8c8d', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
            onClick={() => { setMode('login'); setMessage(null); }}
          >
            <i className="fa-solid fa-right-to-bracket"></i> लॉगिन (Owner Login)
          </button>
          <button 
            type="button"
            style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: mode === 'register' ? '3px solid var(--secondary)' : 'none', color: mode === 'register' ? 'var(--secondary)' : '#7f8c8d', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
            onClick={() => { setMode('register'); setMessage(null); }}
          >
            <i className="fa-solid fa-user-plus"></i> नवीन नोंदणी (Register)
          </button>
        </div>

        {message && <Alert type={message.type} message={message.text} onClose={() => setMessage(null)} />}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>लॉगिन युझरनेम (Username) *</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="उदा. shiv123 किंवा rahul" 
                value={loginUsername} 
                onChange={e => setLoginUsername(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>पासवर्ड (Password) *</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="पासवर्ड टाका" 
                value={loginPassword} 
                onChange={e => setLoginPassword(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold', marginTop: '10px' }} disabled={loading}>
              {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-right-to-bracket"></i>} {loading ? 'लॉगिन करत आहे...' : 'लॉगिन करा & बुकिंग चालू करा'}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>मालकाचे नाव (Display Name in Marathi) *</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="उदा. शिव, राहुल किंवा हर्षद" 
                value={regDisplayName} 
                onChange={e => setRegDisplayName(e.target.value)} 
                required 
              />
              <small style={{ color: '#7f8c8d' }}>हे नाव बुकिंग व पावतीवर 'बुकिंग करणारा मालक' म्हणून दिसेल.</small>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>नवीन युझरनेम (Username) *</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="उदा. shiv2026" 
                value={regUsername} 
                onChange={e => setRegUsername(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>पासवर्ड सेट करा (Password) *</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="सुरक्षित पासवर्ड टाका" 
                value={regPassword} 
                onChange={e => setRegPassword(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className="btn btn-success" style={{ width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold', marginTop: '10px' }} disabled={loading}>
              {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-user-check"></i>} {loading ? 'नोंदणी होत आहे...' : 'नवीन मालक खाते तयार करा'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '15px', fontSize: '13px', color: '#7f8c8d' }}>
          🔒 सुरक्षित गणपती बाप्पा मूर्ती बुकिंग सिस्टीम
        </div>
      </div>
    </div>
  );
};

export default OwnerAuth;
