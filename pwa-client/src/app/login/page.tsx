"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { loginApi } from "@/lib/authApi";
import { Button } from "@/components/ui/Button";
import styles from "./login.module.css";
import { IconUtensils, IconAlertCircle } from "@/components/ui/Icons";

function IconEye({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Completa todos los campos");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { user, accessToken, refreshToken } = await loginApi(email, password);
      login({ user, token: accessToken, accessToken, refreshToken });
      const roleRoutes: Record<string, string> = {
        admin: "/dashboard",
        restaurant_admin: "/dashboard",
        manager: "/dashboard",
        waiter: "/mesero",
        chef: "/cocina",
        cashier: "/dashboard",
      };
      window.location.href = roleRoutes[user.role] ?? "/dashboard";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}>
            <IconUtensils size={32} color="white" />
          </div>
        </div>

        <h1 className={styles.title}>Foodify</h1>
        <p className={styles.subtitle}>Inicia sesión para continuar</p>

        {/* Formulario */}
        <div className={styles.form}>
          {/* Email */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-email">
              Correo electrónico
            </label>
            <input
              id="login-email"
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="nombre@foodify.mx"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-password">
              Contraseña
            </label>
            <div className={styles.passwordWrap}>
              <input
                id="login-password"
                className={`${styles.input} ${styles.passwordInput}`}
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                <IconEye open={showPw} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className={styles.errorBox} role="alert">
              <IconAlertCircle size={18} />
              <p>{error}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            id="login-submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onClick={handleSubmit}
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </Button>
        </div>

        {/* Footer */}
        <p className={styles.footer}>
          Foodify Admin Panel · v3.2
        </p>
      </div>
    </div>
  );
}