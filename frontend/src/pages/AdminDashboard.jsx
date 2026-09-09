import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminMe } from '../api/adminApi';
import StatsPanel from '../components/admin/StatsPanel';
import BookingManager from '../components/admin/BookingManager';
import OwnerManager from '../components/admin/OwnerManager';
import StallManager from '../components/admin/StallManager';
import StallOwnerSettings from '../components/admin/StallOwnerSettings';
import ExportPanel from '../components/admin/ExportPanel';
import AIBusinessPanel from '../components/admin/AIBusinessPanel';

const AdminDashboard = () => {
  const { logout, setAdminUser, adminUser, activeStall } = useAuth();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('analytics');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getAdminMe();
        if (user) setAdminUser(user);
      } catch (err) {
        console.error("Admin user profile fetch error:", err);
      }
    };
    fetchUser();
  }, [setAdminUser]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const displayName = adminUser?.displayName || adminUser?.display_name || adminUser?.username || 'व्यवस्थापक';
  const role = adminUser?.role || 'owner';

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div style={{
            width: '40px', height: '40px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(212, 136, 26, 0.2)',
            border: '1px solid rgba(212, 136, 26, 0.4)',
            color: 'var(--accent-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px'
          }}>
            <i className="fa-solid fa-om"></i>
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#FFFFFF', fontSize: '15px', fontWeight: 800 }}>
              {activeStall?.stallName || 'सदिच्छा कला केंद्र'}
            </h3>
            <div style={{ fontSize: '11.5px', color: '#F8DFAC', fontWeight: 600 }}>
              👤 {displayName} ({role === 'superadmin' ? 'सुपर ॲडमिन' : 'सह-मालक'})
            </div>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <div className={`nav-item ${activeMenu === 'ai' ? 'active' : ''}`} onClick={() => setActiveMenu('ai')}>
            <i className="fa-solid fa-wand-magic-sparkles" style={{ color: 'var(--accent-gold)' }}></i>
            <span>AI व्यवसाय विश्लेषण</span>
          </div>
          <div className={`nav-item ${activeMenu === 'analytics' ? 'active' : ''}`} onClick={() => setActiveMenu('analytics')}>
            <i className="fa-solid fa-chart-pie"></i>
            <span>व्यवसाय ॲनालिटिक्स</span>
          </div>
          <div className={`nav-item ${activeMenu === 'bookings' ? 'active' : ''}`} onClick={() => setActiveMenu('bookings')}>
            <i className="fa-solid fa-table-list"></i>
            <span>सर्व बुकिंग मॅनेजमेंट</span>
          </div>
          <div className={`nav-item ${activeMenu === 'settings' ? 'active' : ''}`} onClick={() => setActiveMenu('settings')}>
            <i className="fa-solid fa-gear"></i>
            <span>स्टॉल व मालक सेटिंग्ज</span>
          </div>
          <div className={`nav-item ${activeMenu === 'owners' ? 'active' : ''}`} onClick={() => setActiveMenu('owners')}>
            <i className="fa-solid fa-users-gear"></i>
            <span>सह-मालक खाती</span>
          </div>
          <div className={`nav-item ${activeMenu === 'export' ? 'active' : ''}`} onClick={() => setActiveMenu('export')}>
            <i className="fa-solid fa-file-excel"></i>
            <span>डेटा CSV एक्स्पोर्ट</span>
          </div>
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div 
            className="nav-item" 
            onClick={handleLogout} 
            style={{ color: '#FECDD3', background: 'rgba(225, 29, 72, 0.15)', border: '1px solid rgba(225, 29, 72, 0.3)' }}
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            <span>लॉगआउट (Logout)</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="admin-main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ color: 'var(--text-main)', margin: 0, fontSize: '20px', fontWeight: 800 }}>
              {activeMenu === 'ai' && '🤖 AI व्यवसाय विश्लेषण व स्मार्ट अंतर्दृष्टी'}
              {activeMenu === 'analytics' && '📊 व्यवसाय ॲनालिटिक्स व महसूल अहवाल'}
              {activeMenu === 'bookings' && '📋 सर्व बुकिंग्स मॅनेजमेंट (Bookings Manager)'}
              {activeMenu === 'settings' && '⚙️ स्टॉल व मालक प्रोफाइल सेटिंग्ज'}
              {activeMenu === 'owners' && '👥 स्टॉल सह-मालक खाती व अधिकार'}
              {activeMenu === 'export' && '📤 डेटा CSV एक्स्पोर्ट'}
            </h1>
          </div>
          
          <Link to="/" className="btn btn-outline btn-sm" style={{ fontWeight: 600 }}>
            <i className="fa-solid fa-house" style={{ color: 'var(--primary)' }}></i>
            <span>मुख्य बुकिंग पेज (Home)</span>
          </Link>
        </div>

        {activeMenu === 'ai' && <AIBusinessPanel />}
        {activeMenu === 'analytics' && <StatsPanel />}
        {activeMenu === 'bookings' && <BookingManager />}
        {activeMenu === 'settings' && <StallOwnerSettings />}
        {activeMenu === 'owners' && <OwnerManager />}
        {activeMenu === 'export' && <ExportPanel />}

        <footer style={{
          marginTop: '40px',
          padding: '16px 20px',
          background: 'var(--surface-card)',
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
      </main>
    </div>
  );
};

export default AdminDashboard;
