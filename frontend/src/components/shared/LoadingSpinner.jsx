import React from 'react';

const LoadingSpinner = ({ text = 'लोड होत आहे...' }) => (
  <div style={{ textAlign: 'center', padding: '20px' }}>
    <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--primary)', marginBottom: '10px' }}></i>
    <div>{text}</div>
  </div>
);

export default LoadingSpinner;
