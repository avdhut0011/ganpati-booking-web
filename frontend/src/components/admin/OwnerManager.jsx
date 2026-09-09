import React, { useEffect, useState, useCallback } from 'react';
import { getOwners, createOwner, updateOwner } from '../../api/adminApi';
import LoadingSpinner from '../shared/LoadingSpinner';
import Alert from '../shared/Alert';
import { useAuth } from '../../context/AuthContext';

const OwnerManager = () => {
  const { refreshOwnersList } = useAuth();
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', displayName: '', role: 'owner' });
  const [editingOwner, setEditingOwner] = useState(null);
  const [editFormData, setEditFormData] = useState({ displayName: '', role: 'owner', isActive: true, password: '' });
  const [message, setMessage] = useState(null);

  const fetchOwners = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOwners();
      setOwners(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Fetch owners error:", e);
      setMessage({ type: 'error', text: 'मालक यादी लोड करताना त्रुटी आली.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await createOwner({
        username: formData.username,
        password: formData.password,
        displayName: formData.displayName,
        display_name: formData.displayName,
        role: formData.role
      });
      if (res) {
        setMessage({ type: 'success', text: `नवीन मालक '${formData.displayName || formData.username}' यशस्वीरित्या तयार केला!` });
        setShowAddForm(false);
        setFormData({ username: '', password: '', displayName: '', role: 'owner' });
        await fetchOwners();
        if (typeof refreshOwnersList === 'function') {
          await refreshOwnersList();
        }
      }
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.detail || 'मालक खाते तयार करताना त्रुटी आली.' });
    }
  };

  const startEdit = (owner) => {
    setEditingOwner(owner);
    setEditFormData({
      displayName: owner.displayName || owner.display_name || '',
      role: owner.role || 'owner',
      isActive: owner.isActive ?? owner.is_active ?? true,
      password: ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingOwner) return;
    setMessage(null);
    try {
      const payload = {
        displayName: editFormData.displayName,
        display_name: editFormData.displayName,
        role: editFormData.role,
        isActive: editFormData.isActive,
        is_active: editFormData.isActive
      };
      if (editFormData.password) {
        payload.password = editFormData.password;
      }
      const res = await updateOwner(editingOwner.id, payload);
      if (res) {
        setMessage({ type: 'success', text: `मालक '${editFormData.displayName}' ची माहिती यशस्वीरित्या अपडेट झाली!` });
        setEditingOwner(null);
        await fetchOwners();
        if (typeof refreshOwnersList === 'function') {
          await refreshOwnersList();
        }
      }
    } catch (e) {
      console.error("Update owner error:", e);
      setMessage({ type: 'error', text: e.response?.data?.detail || 'माहिती अपडेट करताना त्रुटी आली.' });
    }
  };

  const handleToggleStatus = async (owner) => {
    setMessage(null);
    const currentActive = owner.isActive ?? owner.is_active ?? true;
    const newStatus = !currentActive;
    try {
      const res = await updateOwner(owner.id, {
        isActive: newStatus,
        is_active: newStatus
      });
      if (res) {
        setMessage({ 
          type: 'success', 
          text: `मालक '${owner.displayName || owner.display_name}' खाते ${newStatus ? 'सक्रिय (Active)' : 'निष्क्रीय (Inactive)'} केले!` 
        });
        await fetchOwners();
        if (typeof refreshOwnersList === 'function') {
          await refreshOwnersList();
        }
      }
    } catch (e) {
      console.error("Toggle owner status error:", e);
      setMessage({ type: 'error', text: 'स्टेटस बदलताना सर्व्हर त्रुटी आली.' });
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>
        <h3 style={{ color: 'var(--secondary)', margin: 0 }}>
          <i className="fa-solid fa-users-gear"></i> मालक व्यवस्थापन (Owner & Admin User Management)
        </h3>
        <button className="btn btn-primary" onClick={() => { setShowAddForm(!showAddForm); setEditingOwner(null); }}>
          {showAddForm ? <><i className="fa-solid fa-xmark"></i> फॉर्म बंद करा</> : <><i className="fa-solid fa-user-plus"></i> नवीन मालक जोडा</>}
        </button>
      </div>

      {message && <Alert type={message.type} message={message.text} onClose={() => setMessage(null)} />}

      {/* EDIT OWNER MODAL */}
      {editingOwner && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '15px'
        }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '500px', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', border: '2.5px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ color: 'var(--primary)', margin: 0 }}>
                ✏️ मालक माहिती एडिट करा (#{editingOwner.id})
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingOwner(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#7f8c8d' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ fontWeight: 'bold' }}>युझरनेम (Username - Read Only)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={editingOwner.username} 
                  disabled 
                  style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ fontWeight: 'bold' }}>मालकाचे नाव (Display Name) *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  value={editFormData.displayName} 
                  onChange={e => setEditFormData({...editFormData, displayName: e.target.value})} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ fontWeight: 'bold' }}>भूमिका (Role) *</label>
                <select 
                  className="form-control" 
                  value={editFormData.role} 
                  onChange={e => setEditFormData({...editFormData, role: e.target.value})}
                >
                  <option value="owner">मालक (Owner)</option>
                  <option value="superadmin">सुपर अॅडमिन (Super Admin)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ fontWeight: 'bold' }}>नवीन पासवर्ड (बदलायचा असल्यास टाका)</label>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="नवीन पासवर्ड (पर्यायी)" 
                  value={editFormData.password} 
                  onChange={e => setEditFormData({...editFormData, password: e.target.value})} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold' }}>खाते स्थिती (Account Status)</label>
                <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
                  <label style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    <input 
                      type="radio" 
                      name="editStatus" 
                      checked={editFormData.isActive === true} 
                      onChange={() => setEditFormData({...editFormData, isActive: true})} 
                    /> 🟢 सक्रिय (Active)
                  </label>
                  <label style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    <input 
                      type="radio" 
                      name="editStatus" 
                      checked={editFormData.isActive === false} 
                      onChange={() => setEditFormData({...editFormData, isActive: false})} 
                    /> 🔴 निष्क्रीय (Inactive)
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn" 
                  onClick={() => setEditingOwner(null)}
                  style={{ background: '#7f8c8d', color: '#fff', padding: '10px 18px' }}
                >
                  रद्द करा (Cancel)
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ padding: '10px 20px', fontWeight: 'bold' }}
                >
                  <i className="fa-solid fa-floppy-disk"></i> सेव्ह करा (Save Changes)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAddSubmit} style={{ marginBottom: '20px', padding: '20px', background: '#fffdf9', border: '2px solid var(--primary)', borderRadius: '12px' }}>
          <h4 style={{ color: 'var(--primary)', marginBottom: '15px' }}>➕ नवीन मालक / अॅडमिन खाते जोडा</h4>
          
          <div className="grid-2">
            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>नाव (Display Name in Marathi) *</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="उदा. शिव किंवा राहुल" 
                required 
                value={formData.displayName} 
                onChange={e => setFormData({...formData, displayName: e.target.value})} 
              />
            </div>
            
            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>लॉगिन युझरनेम (Username) *</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="उदा. shiv123" 
                required 
                value={formData.username} 
                onChange={e => setFormData({...formData, username: e.target.value})} 
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>लॉगिन पासवर्ड (Password) *</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="पासवर्ड टाका" 
                required 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>भूमिका (Role) *</label>
              <select className="form-control" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                <option value="owner">मालक (Owner)</option>
                <option value="superadmin">सुपर अॅडमिन (Super Admin)</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-success" style={{ marginTop: '10px', padding: '10px 20px', fontWeight: 'bold' }}>
            <i className="fa-solid fa-check"></i> खाते तयार करा (Create User)
          </button>
        </form>
      )}

      {loading ? (
        <LoadingSpinner text="मालक यादी लोड करत आहे..." />
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>आयडी (ID)</th>
                <th>मालकाचे नाव (Display Name)</th>
                <th>युझरनेम (Username)</th>
                <th>भूमिका (Role)</th>
                <th>खाते स्थिती (Status)</th>
                <th>कृती (Actions)</th>
              </tr>
            </thead>
            <tbody>
              {owners.map(o => {
                const name = o.displayName || o.display_name || o.username;
                const active = o.isActive ?? o.is_active ?? true;
                return (
                  <tr key={o.id}>
                    <td><strong>#{o.id}</strong></td>
                    <td><strong style={{ color: 'var(--secondary)' }}><i className="fa-solid fa-user-check"></i> {name}</strong></td>
                    <td><code>{o.username}</code></td>
                    <td>
                      <span className={`badge ${o.role === 'superadmin' ? 'badge-paid' : 'badge-booked'}`}>
                        {o.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${active ? 'badge-paid' : 'badge-cancelled'}`}>
                        {active ? '🟢 Active (सक्रिय)' : '🔴 Inactive (निष्क्रीय)'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-primary" 
                          onClick={() => startEdit(o)} 
                          style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 'bold' }}
                        >
                          <i className="fa-solid fa-pen-to-square"></i> एडिट (Edit)
                        </button>
                        <button 
                          className={`btn ${active ? 'btn-danger' : 'btn-success'}`} 
                          onClick={() => handleToggleStatus(o)} 
                          style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 'bold' }}
                        >
                          {active ? (
                            <><i className="fa-solid fa-user-xmark"></i> निष्क्रीय करा</>
                          ) : (
                            <><i className="fa-solid fa-user-check"></i> सक्रिय करा</>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OwnerManager;

