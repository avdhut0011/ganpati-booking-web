import React from 'react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onCancel} style={{ background: '#ddd' }}>रद्द करा</button>
          <button className="btn btn-danger" onClick={onConfirm}>होय, नक्की</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
