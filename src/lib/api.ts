import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

// En producción usamos el proxy de Next.js para evitar Mixed Content (HTTPS -> HTTP)
const API_URL = typeof window !== "undefined" && window.location.hostname !== "localhost"
  ? "/api_proxy/api/v1"
  : (process.env.NEXT_PUBLIC_API_URL || "http://3.142.73.52:3000/api/v1");

const BASE_URL_PROXY = typeof window !== "undefined" && window.location.hostname !== "localhost"
  ? "/api_proxy"
  : (process.env.NEXT_PUBLIC_API_URL || "http://3.142.73.52:3000").replace("/api/v1", "");

// ─── Instancia principal (con JWT) ───────────────────────────────────────────
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// ─── Instancia pública (sin JWT — menú del comensal) ─────────────────────────
export const publicApi: AxiosInstance = axios.create({
  // Si no hay URL de entorno, usa el origin actual (útil para despliegues locales)
  baseURL: BASE_URL_PROXY,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// ─── Helpers de token ─────────────────────────────────────────────────────────
export function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem("foodify_session");
    if (!raw) return null;
    return JSON.parse(raw)?.accessToken ?? null;
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
      refreshToken,
    }));
  } catch { /* noop */ }
}

// ─── Interceptor REQUEST — adjuntar Bearer token ──────────────────────────────
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
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

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers)
            originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const newAccessToken  = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        saveTokens(newAccessToken, newRefreshToken);
        processQueue(null, newAccessToken);

        if (originalRequest.headers)
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("foodify_session");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);