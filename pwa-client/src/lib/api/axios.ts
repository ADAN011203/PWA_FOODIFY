import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";

// Use relative path for production (to trigger Vercel proxy and avoid Mixed Content)
const API_URL = "/api_proxy/api/v1";
const PUBLIC_API_URL = "/api_proxy/api/v1";

// ─── Instance with JWT (Private api/v1) ───────────────────────────────────────
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// ─── Public Instance (Root /) ──────────────────────────────────────────────────
export const publicApi: AxiosInstance = axios.create({
  baseURL: PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// ─── Interceptor REQUEST ───
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Interceptor RESPONSE (Refresh Token logic) ───
let isRefreshing = false;
let failedQueue: { resolve: (v: unknown) => void; reject: (e: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (token && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }
          return Promise.reject(error);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error("No refresh token available");

        const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        
        const data = res.data?.data || res.data;
        const newAccessToken = data?.accessToken || data?.token;
        const newRefreshToken = data?.refreshToken;

        if (!newAccessToken) {
          throw new Error("Failed to extract new access token");
        }

        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.getState().setAuth(currentUser, newAccessToken, newRefreshToken || refreshToken);
        }

        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login?expired=true";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
