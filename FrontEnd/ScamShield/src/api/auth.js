import axios from 'axios';

// Backend port 5000 par run ho raha hai, .env se URL load hoga
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

// Request interceptor: Agar browser storage mein token ho to authorization header mein bhejien
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 1. Register API Call (POST request with complete schema payload)
export const registerUser = async (userData) => {
  try {
    // userData fields: name, username, email, password, confirmPassword, role
    const response = await API.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Registration failed. Network error.' };
  }
};

// 2. Login API Call (Aapka current backend GET endpoint use kar raha hai)
export const loginUser = async (credentials) => {
  try {
    // credentials fields: username/email and password
    const response = await API.post('/auth/login', credentials);

    // Agar response mein token aaye, toh use local storage mein save karein
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Login failed. Network error.' };
  }
};