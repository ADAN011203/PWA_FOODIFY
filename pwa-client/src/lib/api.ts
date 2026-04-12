import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

// Priorizamos NEXT_PUBLIC_API_URL. En Vercel debería ser "/api_proxy/api/v1".
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api_proxy/api/v1";

// El base URL para el proxy (sin api/v1)
const BASE_URL_PROXY = API_URL.replace("/api/v1", "");

// ─── Instancia principal (con JWT) ───────────────────────────────────────────
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// ─── Instancia pública (sin JWT — menú) ──────────────────────────────────────
export const publicApi: AxiosInstance = axios.create({
  baseURL: BASE_URL_PROXY,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// ─── Helpers de token ─────────────────────────────────────────────────────────
export function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem("foodify_session");
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.accessToken || session?.token || null;
  } catch { return null; }
}

export function getRefreshToken(): string | null {
  try {
    const raw = localStorage.getItem("foodify_session");
    if (!raw) return null;
    return JSON.parse(raw)?.refreshToken ?? null;
  } catch { return null; }
}

export function saveTokens(accessToken: string, refreshToken: string) {
  try {
    const raw = localStorage.getItem("foodify_session");
    const session = raw ? JSON.parse(raw) : {};
    localStorage.setItem("foodify_session", JSON.stringify({
      ...session,
      accessToken,
      refreshToken: refreshToken || session.refreshToken,
    }));
  } catch { /* noop */ }
}

// ─── Interceptor REQUEST — adjuntar Bearer token ──────────────────────────────
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && token !== "undefined") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Interceptor RESPONSE — refresh automático en 401 ────────────────────────
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

    // Si es 401 y no es un reintento
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
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token available");

        // ✅ Usar axios básico para evitar interceptores infinitos
        // Intentar obtener el token nuevo (soportando data.data.accessToken o data.accessToken)
        const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        
        const data = res.data?.data || res.data;
        const newAccessToken = data?.accessToken || data?.token;
        const newRefreshToken = data?.refreshToken;

        if (!newAccessToken || newAccessToken === "undefined") {
          throw new Error("Failed to extract new access token from refresh response");
        }

        saveTokens(newAccessToken, newRefreshToken);
        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        console.error("Session expired or refresh failed:", refreshError);
        localStorage.removeItem("foodify_session");
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