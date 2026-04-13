import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// En producción (Vercel/HTTPS) usamos el proxy para evitar el error de Mixed Content
// si el backend es HTTP (IP directa).
const isClient = typeof window !== 'undefined';
const isProd = isClient && window.location.hostname !== 'localhost';

const API_URL = isProd 
  ? '/api_proxy/api/v1' 
  : (process.env.NEXT_PUBLIC_API_URL || 'http://3.142.73.52:3000/api/v1');

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const sessionRaw = typeof window !== 'undefined' ? localStorage.getItem('foodify_auth') : null;
    if (sessionRaw) {
      try {
        const { state } = JSON.parse(sessionRaw);
        const token = state?.token;
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.error('Error parsing auth session', err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for handling errors (e.g., 401)
axiosInstance.interceptors.response.use(
  (response) => {
    // Standardize response format as requested { data: <T>, status: 200 }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Logic for token refresh could go here if implemented in backend
      // For now, clear session and redirect if on private route
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/menu')) {
        localStorage.removeItem('foodify_auth');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
