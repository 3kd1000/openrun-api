import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const devUserId = localStorage.getItem('devUserId');
  if (devUserId) {
    config.headers['X-DEV-USER-ID'] = devUserId;
  }
  return config;
});

export default axiosInstance;
