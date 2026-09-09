import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BookingApp from './pages/BookingApp';
import OwnerAuth from './pages/OwnerAuth';
import AdminDashboard from './pages/AdminDashboard';
import FirstTimeSetup from './pages/FirstTimeSetup';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingSpinner from './components/shared/LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { token, loading, isConfigured } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingSpinner text="लोड होत आहे..." />
      </div>
    );
  }
  if (!isConfigured) {
    return <Navigate to="/setup" replace />;
  }
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const SetupGuard = ({ children }) => {
  const { isConfigured, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingSpinner text="लोड होत आहे..." />
      </div>
    );
  }
  if (!isConfigured) {
    return <Navigate to="/setup" replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/setup" element={<FirstTimeSetup />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <BookingApp />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/login" 
        element={
          <SetupGuard>
            <OwnerAuth />
          </SetupGuard>
        } 
      />
      <Route 
        path="/admin/login" 
        element={
          <SetupGuard>
            <OwnerAuth />
          </SetupGuard>
        } 
      />
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
