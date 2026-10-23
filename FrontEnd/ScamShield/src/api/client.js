import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // backend sets an httpOnly "token" cookie
  timeout: 15000,
});

// Bearer token is kept as a fallback (cross-site cookies can be blocked by browsers)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Every failed request is turned into one simple shape the UI can show directly.
// Backend errors look like: { success:false, message, action?, email?, retryAfter? }
API.interceptors.response.use(
  (res) => res,
  (error) => {
    const d = error.response?.data;
    let message = d?.message;
    if (!message) {
      if (error.code === 'ECONNABORTED') message = 'The request took too long. Please try again.';
      else if (!error.response) message = 'Cannot reach the server. Please check your connection.';
      else message = 'Something went wrong. Please try again.';
    }
    if (error.response?.status === 401) localStorage.removeItem('token');
    return Promise.reject({
      success: false,
      message,
      action: d?.action,       // 'login' | 'verify' | 'resend'
      email: d?.email,
      retryAfter: d?.retryAfter,
      status: error.response?.status,
    });
  }
);

export default API;
