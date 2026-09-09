import axios from 'axios';

const api = axios.create({
  baseURL: '/api/bookings',
});

export const createBooking = async (data) => {
  // Map fields to Pydantic CreateBookingRequest schema
  const payload = {
    customerName: data.customerName,
    mobileNumber: data.mobileNumber,
    emailId: data.emailId || '-',
    statueNumber: data.statueNumber,
    statueImageBase64: data.statueImageBase64 || '',
    bookingDate: data.bookingDate || '',
    totalAmount: parseFloat(data.totalAmount) || 0,
    advanceAmount: parseFloat(data.advanceAmount) || 0,
    paymentMode: data.paymentMode || 'कॅश',
    bookedByOwner: data.bookedByOwner || 'शिव',
  };

  const response = await api.post('/', payload);
  return response.data;
};

export const getAllBookings = async () => {
  const response = await api.get('/');
  return response.data?.bookings || [];
};

export const searchBooking = async (query) => {
  const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

export const markBookingPaid = async (bookingId, payload) => {
  const response = await api.patch(`/${bookingId}/pay`, payload);
  return response.data;
};

export const cancelBooking = async (bookingId, payload) => {
  const response = await api.patch(`/${bookingId}/cancel`, payload);
  return response.data;
};
