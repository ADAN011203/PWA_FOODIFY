"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { AuthUser, AuthSession } from "@/types/auth";
import { logoutApi } from "@/lib/authApi";

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
      if (raw) {
        const session = JSON.parse(raw);
        // Normalizar nombres de campos
        const u = session.user;
        if (u) {
          u.name   = u.name   || u.fullName || "Usuario";
          u.branch = u.branch || u.restaurant?.name || "Sucursal";
        }
        setUser(u);
        setToken(session.accessToken ?? session.token ?? null);
      }
    } catch {
      localStorage.removeItem("foodify_session");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (session: AuthSession & { accessToken?: string; refreshToken?: string }) => {
    // Normalizar
    const u = session.user;
    if (u) {
      u.name   = u.name   || u.fullName || "Usuario";
      u.branch = u.branch || u.restaurant?.name || "Sucursal";
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