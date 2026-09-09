import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAdminMe, getSetupStatus, getActiveOwners } from '../api/adminApi';

const DEFAULT_STALL = {
  stallName: 'सदिच्छा कला केंद्र',
  stallNumber: 'स्टॉल क्र.१०',
  locationAddress: 'उदाजी महाराज म्युझियम, आकाशवाणी टॉवर जवळ, गंगापूर रोड, नाशिक',
  contactPhone: '8390397800',
  contactEmail: 'avadhutjagtap1341@gmail.com',
  logoUrl: ''
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('ganpati_admin_token') || null);
  const [adminUser, setAdminUser] = useState(null);
  const [activeStall, setActiveStall] = useState(DEFAULT_STALL);
  const [isConfigured, setIsConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [ownersList, setOwnersList] = useState([]);

  const refreshOwnersList = useCallback(async () => {
    try {
      const names = await getActiveOwners();
      setOwnersList(names);
    } catch (err) {
      console.error("Owners list fetch error:", err);
    }
  }, []);

  const fetchStallAndSetup = async () => {
    try {
      const res = await getSetupStatus();
      setIsConfigured(res.isConfigured);
      if (res.stall) {
        setActiveStall(res.stall);
      }
    } catch (err) {
      console.error("Setup status fetch error:", err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await fetchStallAndSetup();
      await refreshOwnersList();
      if (token) {
        localStorage.setItem('ganpati_admin_token', token);
        try {
          const user = await getAdminMe();
          setAdminUser(user);
        } catch (err) {
          console.error("Auth init error:", err);
          logout();
        }
      } else {
        localStorage.removeItem('ganpati_admin_token');
        setAdminUser(null);
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = (newToken, user = null, stall = null) => {
    localStorage.setItem('ganpati_admin_token', newToken);
    setToken(newToken);
    if (user) setAdminUser(user);
    if (stall) setActiveStall(stall);
    setIsConfigured(true);
    refreshOwnersList();
  };

  const logout = () => {
    localStorage.removeItem('ganpati_admin_token');
    setToken(null);
    setAdminUser(null);
  };

  const updateActiveStall = (newStall) => {
    setActiveStall(prev => ({ ...prev, ...newStall }));
  };

  return (
    <AuthContext.Provider value={{
      token,
      adminUser,
      activeStall,
      isConfigured,
      loading,
      ownersList,
      login,
      logout,
      setAdminUser,
      updateActiveStall,
      fetchStallAndSetup,
      refreshOwnersList
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
