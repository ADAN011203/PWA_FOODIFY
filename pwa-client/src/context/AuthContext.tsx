"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { AuthUser, AuthSession } from "@/types/auth";
import { logoutApi } from "@/lib/authApi";
import { getRestaurantDetailsApi, getOwnedRestaurantsApi } from "@/lib/restaurantApi";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (session: AuthSession & { accessToken?: string; refreshToken?: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, token: null, isLoading: true,
  login: () => {}, logout: () => {},
});

export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [token, setToken]       = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehidratar sesión desde localStorage al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem("foodify_session");
        // Normalizar nombres de campos
        const u = session.user;
        if (u) {
          u.name   = u.name   || u.fullName || "Usuario";
          u.branch = u.branch || u.restaurant?.name || "Sucursal";
          u.slug   = u.slug   || u.restaurant?.slug || u.restaurant?.restaurant_slug || "";
          // Refuerzo manual para asegurar carga de datos reales
          if (u.branch?.toLowerCase().includes("centro educativo") || u.name?.toLowerCase().includes("centro educativo")) {
            u.slug = "centro-educativo";
          } else if (u.email === "admin@demo.foodify.mx") {
            u.slug = "comedor-verapaz";
          }
        }
        setUser(u);
        // Soportar tanto "token" (legacy mock) como "accessToken" (backend real)
        setToken(session.accessToken ?? session.token ?? null);
      }
    } catch {
      localStorage.removeItem("foodify_session");
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Auto-resolución de slug para sesiones antiguas
  useEffect(() => {
    async function resolveSlug() {
      if (!user || user.slug || !user.restaurantId) return;

      try {
        // Intento 2: Mapeo manual de emergencia (para asegurar que "Centro educativo" cargue)
        if (user.branch?.toLowerCase().includes("centro educativo") || user.name?.toLowerCase().includes("centro educativo")) {
           updateUserSlug("centro-educativo");
           return;
        } else if (user.email === "admin@demo.foodify.mx") {
           updateUserSlug("demo");
           return;
        }

        // Intento 3: Consulta directa
        const rest = await getRestaurantDetailsApi(user.restaurantId);
        if (rest.slug) {
          updateUserSlug(rest.slug);
          return;
        }

        // Intento 2: Mapeo manual de emergencia (para asegurar que "Centro educativo" cargue)
        if (user.branch?.toLowerCase().includes("centro educativo")) {
           updateUserSlug("centro-educativo");
           return;
        }

        // Intento 3: Buscar en la lista de dueños
        const list = await getOwnedRestaurantsApi();
        const found = list.find(r => String(r.id) === String(user.restaurantId));
        if (found?.slug) {
          updateUserSlug(found.slug);
        }
      } catch (e) {
        console.warn("Failed to auto-resolve restaurant slug:", e);
      }
    }

    function updateUserSlug(slug: string) {
      if (!user) return;
      const updated = { ...user, slug };
      setUser(updated);
      const raw = localStorage.getItem("foodify_session");
      if (raw) {
        const session = JSON.parse(raw);
        session.user = updated;
        localStorage.setItem("foodify_session", JSON.stringify(session));
      }
    }

    resolveSlug();
  }, [user?.id, user?.restaurantId, user?.slug]);

  const login = (session: AuthSession & { accessToken?: string; refreshToken?: string }) => {
    // Normalizar
    const u = session.user;
    if (u) {
      u.name   = u.name   || u.fullName || "Usuario";
      u.branch = u.branch || u.restaurant?.name || "Sucursal";
      u.slug   = u.slug   || u.restaurant?.slug || u.restaurant?.restaurant_slug || "";
      // Refuerzo manual para asegurar carga de datos reales
      if (u.branch?.toLowerCase().includes("centro educativo") || u.name?.toLowerCase().includes("centro educativo")) {
        u.slug = "centro-educativo";
      } else if (u.email === "admin@demo.foodify.mx") {
        u.slug = "demo";
      }
    }
    
    // Guardar en localStorage
    const stored = {
      user:         u,
      token:        session.token ?? session.accessToken,
      accessToken:  session.accessToken ?? session.token,
      refreshToken: session.refreshToken ?? null,
    };
    localStorage.setItem("foodify_session", JSON.stringify(stored));
    setUser(u);
    setToken(stored.accessToken ?? null);
  };

  const logout = async () => {
    // Llamar al backend para invalidar el refresh token
    await logoutApi();
    localStorage.removeItem("foodify_session");
    setUser(null);
    setToken(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
