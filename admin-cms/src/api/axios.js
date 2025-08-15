import axios from 'axios';

// Get the current hostname and port for flexible API configuration
const getBaseURL = () => {
  const hostname = window.location.hostname;
  const port = '8080'; // Backend port
  
  // If accessing from localhost, use localhost for API
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:${port}/api`;
  }
  
  // If accessing from IP address, use the same IP for API
  return `http://${hostname}:${port}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('adminUser'));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default api;
