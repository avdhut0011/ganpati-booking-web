import axios from 'axios';

const api = axios.create({
  baseURL: '/api/admin',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ganpati_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminLogin = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await api.post('/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  return response.data;
};

export const adminRegister = async (data) => {
  const response = await api.post('/register', data);
  return response.data;
};

export const getAdminMe = async () => {
  const response = await api.get('/me');
  return response.data;
};

export const getOwners = async () => {
  const response = await api.get('/owners');
  return response.data;
};

export const createOwner = async (data) => {
  const response = await api.post('/owners', data);
  return response.data;
};

export const updateOwner = async (id, data) => {
  const response = await api.put(`/owners/${id}`, data);
  return response.data;
};

export const deleteOwner = async (id) => {
  const response = await api.delete(`/owners/${id}`);
  return response.data;
};

export const getAdminBookings = async () => {
  const response = await api.get('/bookings');
  return response.data?.bookings || [];
};

export const updateBooking = async (id, data) => {
  const response = await api.put(`/bookings/${id}`, data);
  return response.data;
};

export const deleteBooking = async (id) => {
  const response = await api.delete(`/bookings/${id}`);
  return response.data;
};

export const getStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

export const exportCsv = async () => {
  const response = await api.get('/export/csv', { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `ganpati_bookings_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const changePassword = async (data) => {
  const response = await api.post('/change-password', data);
  return response.data;
};

export const getStalls = async () => {
  const response = await axios.get('/api/stalls/');
  return response.data?.stalls || [];
};

export const createStall = async (data) => {
  const token = localStorage.getItem('ganpati_admin_token');
  const response = await axios.post('/api/stalls/', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateStall = async (id, data) => {
  const token = localStorage.getItem('ganpati_admin_token');
  const response = await axios.put(`/api/stalls/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getSetupStatus = async () => {
  const response = await axios.get('/api/setup/status');
  return response.data;
};

export const initFirstTimeSetup = async (data) => {
  const response = await axios.post('/api/setup/init', data);
  return response.data;
};

export const getActiveOwners = async () => {
  const response = await axios.get('/api/admin/active-owners');
  return Array.isArray(response.data) ? response.data : [];
};

export const getAIInsights = async () => {
  const token = localStorage.getItem('ganpati_admin_token');
  const response = await axios.get('/api/admin/ai/insights', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const askAIQuery = async (query) => {
  const token = localStorage.getItem('ganpati_admin_token');
  const response = await axios.post('/api/admin/ai/query', { query }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getAIStatus = async () => {
  const token = localStorage.getItem('ganpati_admin_token');
  const response = await axios.get('/api/admin/ai/status', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const saveAIApiKey = async (apiKey) => {
  const token = localStorage.getItem('ganpati_admin_token');
  const response = await axios.post('/api/admin/ai/api-key', { apiKey }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

