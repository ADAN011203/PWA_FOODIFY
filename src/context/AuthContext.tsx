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
        setUser(session.user);
        // Soportar tanto "token" (legacy mock) como "accessToken" (backend real)
        setToken(session.accessToken ?? session.token ?? null);
      }
    } catch {
      localStorage.removeItem("foodify_session");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (session: AuthSession & { accessToken?: string; refreshToken?: string }) => {
    // Guardar todo en localStorage (user + tokens)
    const stored = {
      user:         session.user,
      token:        session.token ?? session.accessToken,
      accessToken:  session.accessToken ?? session.token,
      refreshToken: session.refreshToken ?? null,
    };
    localStorage.setItem("foodify_session", JSON.stringify(stored));
    setUser(session.user);
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