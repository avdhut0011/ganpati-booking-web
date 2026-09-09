import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateStall, changePassword, updateOwner } from '../../api/adminApi';
import Alert from '../shared/Alert';

export default function StallOwnerSettings() {
  const { activeStall, updateActiveStall, adminUser, setAdminUser } = useAuth();

  const [alert, setAlert] = useState({ message: '', type: 'info' });
  const [stallLoading, setStallLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Stall Form
  const [stallForm, setStallForm] = useState({
    stallName: activeStall?.stallName || activeStall?.stall_name || '',
    stallNumber: activeStall?.stallNumber || activeStall?.stall_number || '',
    locationAddress: activeStall?.locationAddress || activeStall?.location_address || '',
    contactPhone: activeStall?.contactPhone || activeStall?.contact_phone || '',
    contactEmail: activeStall?.contactEmail || activeStall?.contact_email || ''
  });

  useEffect(() => {
    if (activeStall) {
      setStallForm({
        stallName: activeStall.stallName || activeStall.stall_name || '',
        stallNumber: activeStall.stallNumber || activeStall.stall_number || '',
        locationAddress: activeStall.locationAddress || activeStall.location_address || '',
        contactPhone: activeStall.contactPhone || activeStall.contact_phone || '',
        contactEmail: activeStall.contactEmail || activeStall.contact_email || ''
      });
    }
  }, [activeStall]);

  // Profile Form
  const [profileName, setProfileName] = useState(adminUser?.display_name || adminUser?.displayName || '');

  useEffect(() => {
    if (adminUser) {
      setProfileName(adminUser.display_name || adminUser.displayName || '');
    }
  }, [adminUser]);

  // Password Form
  const [pwForm, setPwForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handleStallSubmit = async (e) => {
    e.preventDefault();
    setStallLoading(true);
    setAlert({ message: '', type: 'info' });

    try {
      const stallId = activeStall?.id || 1;
      const res = await updateStall(stallId, stallForm);
      if (res.success && res.stall) {
        updateActiveStall(res.stall);
        setAlert({ message: 'स्टॉलची माहिती यशस्वीरीत्या अपडेट झाली!', type: 'success' });
      } else {
        setAlert({ message: res.message || 'स्टॉल माहिती अपडेट करता आली नाही.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setAlert({ message: err.response?.data?.detail || 'सर्व्हर त्रुटी निर्माण झाली.', type: 'error' });
    } finally {
      setStallLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setAlert({ message: 'कृपया नाव टाका.', type: 'error' });
      return;
    }
    setProfileLoading(true);
    setAlert({ message: '', type: 'info' });

    try {
      if (adminUser?.id) {
        const res = await updateOwner(adminUser.id, { displayName: profileName.trim() });
        setAdminUser(res);
        setAlert({ message: 'प्रोफाईलचे नाव अपडेट झाले!', type: 'success' });
      }
    } catch (err) {
      console.error(err);
      setAlert({ message: 'प्रोफाईल नाव अपडेट करताना त्रुटी.', type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      setAlert({ message: 'नवीन पासवर्ड आणि कन्फर्म पासवर्ड जुळत नाहीत.', type: 'error' });
      return;
    }
    setPwLoading(true);
    setAlert({ message: '', type: 'info' });

    try {
      const res = await changePassword({
        current_password: pwForm.current_password,
        new_password: pwForm.new_password
      });
      if (res.success) {
        setAlert({ message: 'पासवर्ड यशस्वीरीत्या बदलला!', type: 'success' });
        setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        setAlert({ message: res.message || 'सध्याचा पासवर्ड चुकीचा आहे.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setAlert({ message: err.response?.data?.detail || 'पासवर्ड बदलताना त्रुटी निर्माण झाली.', type: 'error' });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      {alert.message && (
        <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ message: '', type: 'info' })} />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* STALL EDIT FORM */}
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', border: '1px solid #f5cba7' }}>
          <h3 style={{ borderBottom: '2px solid #f5cba7', paddingBottom: '8px', color: '#d35400', marginTop: 0 }}>
            🏬 स्टॉल माहिती एडिट करा
          </h3>
          <form onSubmit={handleStallSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '0.9rem' }}>
                स्टॉलचे नाव
              </label>
              <input
                type="text"
                value={stallForm.stallName}
                onChange={(e) => setStallForm({ ...stallForm, stallName: e.target.value })}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '0.9rem' }}>
                स्टॉल क्रमांक
              </label>
              <input
                type="text"
                value={stallForm.stallNumber}
                onChange={(e) => setStallForm({ ...stallForm, stallNumber: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '0.9rem' }}>
                पत्ता / ठिकाण
              </label>
              <textarea
                value={stallForm.locationAddress}
                onChange={(e) => setStallForm({ ...stallForm, locationAddress: e.target.value })}
                rows="2"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '0.9rem' }}>
                संपर्क मोबाईल
              </label>
              <input
                type="tel"
                value={stallForm.contactPhone}
                onChange={(e) => setStallForm({ ...stallForm, contactPhone: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '0.9rem' }}>
                ईमेल आयडी
              </label>
              <input
                type="email"
                value={stallForm.contactEmail}
                onChange={(e) => setStallForm({ ...stallForm, contactEmail: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <button
              type="submit"
              disabled={stallLoading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #d35400 0%, #e67e22 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: stallLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {stallLoading ? 'सेव्ह होत आहे...' : '💾 स्टॉल माहिती सेव्ह करा'}
            </button>
          </form>
        </div>

        {/* OWNER PROFILE & PASSWORD */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* PROFILE EDIT */}
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', border: '1px solid #e1d5e7' }}>
            <h3 style={{ borderBottom: '2px solid #e1d5e7', paddingBottom: '8px', color: '#6c3483', marginTop: 0 }}>
              👤 मालक प्रोफाईल
            </h3>
            <form onSubmit={handleProfileSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '0.9rem' }}>
                  तुमचे नाव (Display Name)
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>
              <button
                type="submit"
                disabled={profileLoading}
                style={{
                  width: '100%',
                  background: '#6c3483',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: profileLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {profileLoading ? 'अपडेट होत आहे...' : '✏️ नाव अपडेट करा'}
              </button>
            </form>
          </div>

          {/* PASSWORD CHANGE */}
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', border: '1px solid #e1d5e7' }}>
            <h3 style={{ borderBottom: '2px solid #e1d5e7', paddingBottom: '8px', color: '#6c3483', marginTop: 0 }}>
              🔑 पासवर्ड बदला
            </h3>
            <form onSubmit={handlePwSubmit}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '0.85rem' }}>
                  सध्याचा पासवर्ड
                </label>
                <input
                  type="password"
                  value={pwForm.current_password}
                  onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '0.85rem' }}>
                  नवीन पासवर्ड
                </label>
                <input
                  type="password"
                  value={pwForm.new_password}
                  onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '0.85rem' }}>
                  नवीन पासवर्ड पुन्हा टाका
                </label>
                <input
                  type="password"
                  value={pwForm.confirm_password}
                  onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>

              <button
                type="submit"
                disabled={pwLoading}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: pwLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {pwLoading ? 'पासवर्ड बदलत आहे...' : '🔒 पासवर्ड सेव्ह करा'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
