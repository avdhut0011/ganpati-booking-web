import React, { useState, useEffect, useCallback } from 'react';
import { getAdminBookings, updateBooking, deleteBooking } from '../../api/adminApi';
import Alert from '../shared/Alert';
import ConfirmModal from '../shared/ConfirmModal';
import LoadingSpinner from '../shared/LoadingSpinner';

const BookingManager = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'बुकिंग डेटा लोड करताना अडचण आली.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleEditClick = (booking) => {
    setEditingBooking({ ...booking });
  };

  const handleSaveEdit = async () => {
    if (!editingBooking) return;
    try {
      const res = await updateBooking(editingBooking.bookingId, editingBooking);
      if (res && res.success) {
        setMessage({ type: 'success', text: `बुकिंग ${editingBooking.bookingId} अपडेट झाले!` });
        setEditingBooking(null);
        fetchBookings();
      } else {
        setMessage({ type: 'error', text: res ? res.message : 'अपडेट अयशस्वी.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'अपडेट करताना त्रुटी आली.' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteBooking(deleteTarget.bookingId);
      if (res && res.success) {
        setMessage({ type: 'success', text: `बुकिंग ${deleteTarget.bookingId} कायमस्वरूपी हटवले!` });
        setDeleteTarget(null);
        fetchBookings();
      } else {
        setMessage({ type: 'error', text: res ? res.message : 'हटवण्यात त्रुटी.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'हटवताना त्रुटी (फक्त सुपर अॅडमिन हक्क).' });
    }
  };

  return (
    <div className="card">
      <h3>📋 सर्व बुकिंग मॅनेजमेंट (Full Booking Management)</h3>
      {message && <Alert type={message.type} message={message.text} onClose={() => setMessage(null)} />}

      {/* EDIT MODAL */}
      {editingBooking && (
        <div style={{ background: '#fef9e7', border: '2px solid var(--primary)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
          <h4 style={{ color: 'var(--primary)', marginBottom: '15px' }}>
            ✏️ बुकिंग संपादन: {editingBooking.bookingId}
          </h4>
          <div className="grid-3">
            <div className="form-group">
              <label>ग्राहकाचे नाव</label>
              <input type="text" className="form-control" value={editingBooking.customerName || ''} onChange={e => setEditingBooking({...editingBooking, customerName: e.target.value})} />
            </div>
            <div className="form-group">
              <label>मोबाईल नंबर</label>
              <input type="text" className="form-control" value={editingBooking.mobileNumber || ''} onChange={e => setEditingBooking({...editingBooking, mobileNumber: e.target.value})} />
            </div>
            <div className="form-group">
              <label>मूर्ती क्रमांक</label>
              <input type="text" className="form-control" value={editingBooking.statueNumber || ''} onChange={e => setEditingBooking({...editingBooking, statueNumber: e.target.value})} />
            </div>
            <div className="form-group">
              <label>एकूण रक्कम ₹</label>
              <input type="number" className="form-control" value={editingBooking.totalAmount || 0} onChange={e => setEditingBooking({...editingBooking, totalAmount: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="form-group">
              <label>जमा रक्कम ₹</label>
              <input type="number" className="form-control" value={editingBooking.advanceAmount || 0} onChange={e => setEditingBooking({...editingBooking, advanceAmount: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="form-group">
              <label>स्थिती (Status)</label>
              <select className="form-control" value={editingBooking.bookingStatus || 'BOOKED'} onChange={e => setEditingBooking({...editingBooking, bookingStatus: e.target.value})}>
                <option value="BOOKED">BOOKED</option>
                <option value="PAID">PAID</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button className="btn btn-success" onClick={handleSaveEdit}><i className="fa-solid fa-save"></i> बदल जतन करा</button>
            <button className="btn" onClick={() => setEditingBooking(null)} style={{ background: '#7f8c8d', color: 'white' }}>रद्द करा</button>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner text="लोड होत आहे..." />
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>आयडी</th>
                <th>दिनांक</th>
                <th>ग्राहक</th>
                <th>मूर्ती क्र.</th>
                <th>रक्कम (₹)</th>
                <th>जमा (₹)</th>
                <th>बाकी (₹)</th>
                <th>स्थिती</th>
                <th>कृती (Actions)</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.bookingId}>
                  <td><strong>{b.bookingId}</strong></td>
                  <td>{b.bookingDate}</td>
                  <td>{b.customerName}<br/><small>{b.mobileNumber}</small></td>
                  <td><strong>{b.statueNumber}</strong></td>
                  <td>₹ {b.totalAmount}</td>
                  <td>₹ {b.advanceAmount}</td>
                  <td>₹ {b.balanceAmount}</td>
                  <td>
                    <span className={`badge badge-${(b.bookingStatus || '').toLowerCase()}`}>{b.bookingStatus}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => handleEditClick(b)}>
                        <i className="fa-solid fa-edit"></i>
                      </button>
                      <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => setDeleteTarget(b)}>
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!deleteTarget}
        title="⚠️ कायमस्वरूपी हटवा"
        message={`तुम्हाला नक्की बुकिंग ${deleteTarget?.bookingId} कायमस्वरूपी हटवायचे आहे का?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default BookingManager;
