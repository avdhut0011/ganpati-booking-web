import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminLogin } from '../api/adminApi';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/shared/Alert';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { token, login, activeStall } = useAuth();

  React.useEffect(() => {
    if (token) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [token, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const u = username.trim();
    const p = password.trim();

    if (!u) {
      setError('कृपया युझरनेम टाका.');
      setLoading(false);
      return;
    }
    if (!p) {
      setError('कृपया पासवर्ड टाका.');
      setLoading(false);
      return;
    }

    try {
      const data = await adminLogin(u, p);
      if (data && data.access_token) {
        login(data.access_token, data.user);
        navigate('/admin/dashboard');
      } else {
        setError('लॉगिन अयशस्वी. कृपया नाव व पासवर्ड तपासा.');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.detail || 'नाव किंवा पासवर्ड चुकीचा आहे!');
    }
    setLoading(false);
  };

  const setCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '32px', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            width: '56px', height: '56px', 
            borderRadius: 'var(--radius-lg)', 
            background: 'var(--primary-subtle)', 
            color: 'var(--primary)', 
            fontSize: '26px', 
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '12px',
            border: '1px solid rgba(200, 75, 25, 0.2)'
          }}>
            <i className="fa-solid fa-om"></i>
          </div>
          <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '20px', fontWeight: 800 }}>
            {activeStall?.stallName || 'सदिच्छा कला केंद्र'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginTop: '4px' }}>
            व्यवस्थापक व मालक लॉगिन (Admin Portal)
          </p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">
              युझरनेम किंवा मराठी नाव <span className="required">*</span>
            </label>
            <div className="input-icon-wrap">
              <i className="fa-solid fa-user input-icon"></i>
              <input 
                type="text" 
                className="form-control" 
                placeholder="उदा. admin किंवा shiv किंवा शिव" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">
              पासवर्ड (Password) <span className="required">*</span>
            </label>
            <div className="input-icon-wrap">
              <i className="fa-solid fa-lock input-icon"></i>
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control" 
                placeholder="तुमचा पासवर्ड टाका" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--text-subtle)', fontSize: '15px'
                }}
                title={showPassword ? "पासवर्ड लपवा" : "पासवर्ड दाखवा"}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block" 
            style={{ padding: '13px', fontSize: '15px' }} 
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>लॉगिन करत आहे...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-right-to-bracket"></i>
                <span>लॉगिन करा (Login)</span>
              </>
            )}
          </button>
        </form>

        {/* QUICK CREDENTIALS HELPER */}
        <div style={{ marginTop: '22px', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)', padding: '14px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            🔑 द्रुत डेमो लॉगिन (Quick Access):
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { u: 'admin', p: 'admin123', label: '👑 admin' },
              { u: 'shiv', p: 'shiv123', label: '👤 shiv (शिव)' },
              { u: 'rahul', p: 'rahul123', label: '👤 rahul (राहुल)' },
              { u: 'harshad', p: 'harshad123', label: '👤 harshad' }
            ].map(c => (
              <button 
                key={c.u}
                type="button" 
                onClick={() => setCredentials(c.u, c.p)}
                style={{ 
                  background: '#FFFFFF', border: '1px solid var(--border)', 
                  padding: '4px 9px', borderRadius: 'var(--radius-full)', 
                  fontSize: '11.5px', cursor: 'pointer', fontWeight: 600, 
                  color: 'var(--text-main)', transition: 'var(--transition)' 
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <Link to="/" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '13.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-arrow-left"></i>
            <span>मुख्य बुकिंग पेजवर परत जा</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
