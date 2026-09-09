import React, { useState, useEffect, useCallback } from 'react';
import { getStalls, createStall, updateStall } from '../../api/adminApi';
import Alert from '../shared/Alert';
import LoadingSpinner from '../shared/LoadingSpinner';

const StallManager = () => {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStall, setEditingStall] = useState(null);
  const [message, setMessage] = useState(null);

  // New Stall Form
  const [formData, setFormData] = useState({
    stallName: '',
    stallNumber: 'स्टॉल क्र.१०',
    locationAddress: '',
    contactPhone: '',
    contactEmail: ''
  });

  const fetchStalls = useCallback(async () => {
    try {
      setLoading(true);
      const list = await getStalls();
      setStalls(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Fetch stalls error:", err);
      setMessage({ type: 'error', text: 'स्टॉल माहिती लोड करताना त्रुटी आली.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStalls();
  }, [fetchStalls]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await createStall(formData);
      if (res && res.success) {
        setMessage({ type: 'success', text: res.message || 'नवीन स्टॉल यशस्वीरीत्या तयार झाला!' });
        setShowAddForm(false);
        setFormData({
          stallName: '',
          stallNumber: 'स्टॉल क्र.१०',
          locationAddress: '',
          contactPhone: '',
          contactEmail: ''
        });
        fetchStalls();
      } else {
        setMessage({ type: 'error', text: res ? res.message : 'स्टॉल तयार करताना त्रुटी आली.' });
      }
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.detail || 'सर्व्हर त्रुटी आली (फक्त सुपर अॅडमिन नवीन स्टॉल तयार करू शकतात).' 
      });
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingStall) return;
    setMessage(null);
    try {
      const res = await updateStall(editingStall.id, editingStall);
      if (res && res.success) {
        setMessage({ type: 'success', text: 'स्टॉल माहिती अद्ययावत झाली!' });
        setEditingStall(null);
        fetchStalls();
      } else {
        setMessage({ type: 'error', text: res ? res.message : 'अपडेट अयशस्वी.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'स्टॉल माहिती अपडेट करताना त्रुटी आली.' });
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>
        <h3 style={{ color: 'var(--secondary)', margin: 0 }}>
          <i className="fa-solid fa-store"></i> मूर्ती स्टॉल व्यवस्थापन (Multi-Tenant Stall Management)
        </h3>
        <button 
          className="btn btn-primary" 
          onClick={() => { setShowAddForm(!showAddForm); setEditingStall(null); }}
        >
          {showAddForm ? <><i className="fa-solid fa-xmark"></i> फॉर्म बंद करा</> : <><i className="fa-solid fa-plus"></i> ➕ नवीन स्टॉल जोडा</>}
        </button>
      </div>

      {message && <Alert type={message.type} message={message.text} onClose={() => setMessage(null)} />}

      {/* CREATE STALL FORM */}
      {showAddForm && (
        <form onSubmit={handleCreateSubmit} style={{ marginBottom: '25px', padding: '20px', background: '#fffdf9', border: '2.5px solid var(--primary)', borderRadius: '14px' }}>
          <h4 style={{ color: 'var(--primary)', marginBottom: '15px' }}>➕ नवीन स्टॉल (Tenant Stall) जोडा</h4>
          <div className="grid-2">
            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>स्टॉलचे नाव (Stall Name) *</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="उदा. सदिच्छा कला केंद्र किंवा जय गणेश कला मंदिर" 
                value={formData.stallName} 
                onChange={e => setFormData({ ...formData, stallName: e.target.value })} 
                required 
              />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>स्टॉल क्रमांक (Stall Number) *</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="उदा. स्टॉल क्र.१० किंवा स्टॉल क्र.१५" 
                value={formData.stallNumber} 
                onChange={e => setFormData({ ...formData, stallNumber: e.target.value })} 
                required 
              />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label style={{ fontWeight: 'bold' }}>पत्ता / ठिकाण (Location Address) *</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="उदा. उदाजी महाराज म्युझियम, आकाशवाणी टॉवर जवळ, गंगापूर रोड, नाशिक" 
                value={formData.locationAddress} 
                onChange={e => setFormData({ ...formData, locationAddress: e.target.value })} 
                required 
              />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>संपर्क मोबाईल (Contact Phone) *</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="उदा. 8390397800 किंवा ९१५८१९९३००" 
                value={formData.contactPhone} 
                onChange={e => setFormData({ ...formData, contactPhone: e.target.value })} 
                required 
              />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>ईमेल आयडी (Contact Email)</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="उदा. contact@stall.com" 
                value={formData.contactEmail} 
                onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} 
              />
            </div>
          </div>
          <button type="submit" className="btn btn-success" style={{ marginTop: '15px', padding: '10px 20px', fontWeight: 'bold' }}>
            <i className="fa-solid fa-check"></i> स्टॉल तयार करा (Create Stall)
          </button>
        </form>
      )}

      {/* EDIT STALL FORM */}
      {editingStall && (
        <form onSubmit={handleUpdateSubmit} style={{ marginBottom: '25px', padding: '20px', background: '#fef9e7', border: '2.5px solid var(--secondary)', borderRadius: '14px' }}>
          <h4 style={{ color: 'var(--secondary)', marginBottom: '15px' }}>✏️ स्टॉल माहिती संपादन (Edit Stall #{editingStall.id})</h4>
          <div className="grid-2">
            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>स्टॉलचे नाव (Stall Name)</label>
              <input 
                type="text" 
                className="form-control" 
                value={editingStall.stallName || editingStall.stall_name || ''} 
                onChange={e => setEditingStall({ ...editingStall, stallName: e.target.value, stall_name: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>स्टॉल क्रमांक (Stall Number)</label>
              <input 
                type="text" 
                className="form-control" 
                value={editingStall.stallNumber || editingStall.stall_number || ''} 
                onChange={e => setEditingStall({ ...editingStall, stallNumber: e.target.value, stall_number: e.target.value })} 
              />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label style={{ fontWeight: 'bold' }}>पत्ता / ठिकाण (Location Address)</label>
              <input 
                type="text" 
                className="form-control" 
                value={editingStall.locationAddress || editingStall.location_address || ''} 
                onChange={e => setEditingStall({ ...editingStall, locationAddress: e.target.value, location_address: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>संपर्क मोबाईल (Contact Phone)</label>
              <input 
                type="text" 
                className="form-control" 
                value={editingStall.contactPhone || editingStall.contact_phone || ''} 
                onChange={e => setEditingStall({ ...editingStall, contactPhone: e.target.value, contact_phone: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>ईमेल (Contact Email)</label>
              <input 
                type="text" 
                className="form-control" 
                value={editingStall.contactEmail || editingStall.contact_email || ''} 
                onChange={e => setEditingStall({ ...editingStall, contactEmail: e.target.value, contact_email: e.target.value })} 
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button type="submit" className="btn btn-success"><i className="fa-solid fa-save"></i> बदल जतन करा</button>
            <button type="button" className="btn" onClick={() => setEditingStall(null)} style={{ background: '#7f8c8d', color: 'white' }}>रद्द करा</button>
          </div>
        </form>
      )}

      {/* STALLS TABLE */}
      {loading ? (
        <LoadingSpinner text="स्टॉल यादी लोड होत आहे..." />
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>क्र.</th>
                <th>कोड (Code)</th>
                <th>स्टॉलचे नाव (Stall Name)</th>
                <th>स्टॉल क्र. (Stall No.)</th>
                <th>पत्ता (Location)</th>
                <th>मोबाईल / संपर्क</th>
                <th>स्थिती</th>
                <th>कृती (Action)</th>
              </tr>
            </thead>
            <tbody>
              {stalls.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>
                    कोणताही स्टॉल सापडला नाही.
                  </td>
                </tr>
              ) : (
                stalls.map((s, idx) => (
                  <tr key={s.id}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                    <td><code>{s.stallCode || s.stall_code}</code></td>
                    <td><strong style={{ color: 'var(--secondary)' }}>🏬 {s.stallName || s.stall_name}</strong></td>
                    <td><span className="badge badge-booked">{s.stallNumber || s.stall_number}</span></td>
                    <td style={{ fontSize: '13px' }}>{s.locationAddress || s.location_address || '-'}</td>
                    <td><strong>{s.contactPhone || s.contact_phone || '-'}</strong></td>
                    <td>
                      <span className={`badge ${s.isActive ?? s.is_active ? 'badge-paid' : 'badge-cancelled'}`}>
                        {s.isActive ?? s.is_active ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '5px 10px', fontSize: '12.5px', fontWeight: 'bold' }} 
                        onClick={() => { setEditingStall({ ...s }); setShowAddForm(false); }}
                      >
                        <i className="fa-solid fa-pen-to-square"></i> संपादन
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StallManager;
