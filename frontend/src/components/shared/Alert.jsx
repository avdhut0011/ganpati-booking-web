import React, { useEffect, useState } from 'react';

const Alert = ({ message, type = 'success', onClose }) => {
  if (!message) return null;

  return (
    <div className={`alert alert-${type}`}>
      <div>
        <i className={`fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
        <span style={{ marginLeft: '10px' }}>{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>
          <i className="fa-solid fa-times"></i>
        </button>
      )}
    </div>
  );
};

export default Alert;
