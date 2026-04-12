import { api } from "./api";
import type { AuthUser } from "@/types/auth";

export const USE_MOCK = false;

// Respuesta del backend v3.2 — login devuelve tokens + role directamente (sin objeto user)
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  role: string;
  planName: string;
  subscriptionStatus: string;
}

const MOCK_USERS: Record<string, AuthUser & { password: string }> = {
  "admin@foodify.mx":      { id: "1", name: "Admin Demo",   email: "admin@foodify.mx",      role: "admin",  branch: "Foodify", password: "admin123"   },
  "mesero@foodify.mx":     { id: "2", name: "Mesero Demo",  email: "mesero@foodify.mx",     role: "mesero", branch: "Foodify", password: "mesero123"  },
  "cocina@foodify.mx":     { id: "3", name: "Cocina Demo",  email: "cocina@foodify.mx",     role: "cocina", branch: "Foodify", password: "cocina123"  },
  "admin@foodify.com":     { id: "4", name: "Admin",        email: "admin@foodify.com",     role: "admin",  branch: "Foodify", password: "cualquier6" },
  "admin@demo.foodify.mx": { id: "5", name: "Admin Demo",   email: "admin@demo.foodify.mx", role: "admin",  branch: "Demo Restaurant", password: "Demo2026!" },
};

function mapRole(r: string): AuthUser["role"] {
  switch (r) {
    case "restaurant_admin": return "admin";
    case "manager":          return "admin";
    case "waiter":           return "mesero";
    case "chef":             return "cocina";
    case "cashier":          return "mesero";
    default:                 return "admin";
  }
}

export async function loginApi(
  email: string,
  password: string
): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {

  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    const found = MOCK_USERS[email];
    if (!found || found.password !== password) throw new Error("Credenciales incorrectas");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _ignored, ...user } = found;
    return { user, accessToken: "mock-token", refreshToken: "mock-refresh" };
  }

  try {
    const { data } = await api.post("/auth/login", { email, password });
    const authData = data.data as LoginResponse;

    // v3.2: login devuelve tokens + role directamente, sin objeto user
    // Obtenemos el perfil completo con /auth/me
    const meRes = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${authData.accessToken}` },
    });
    const me = meRes.data.data;

    const user: AuthUser = {
      id:     String(me.id ?? me.userId ?? me.sub ?? ""),
      name:   String(me.fullName ?? me.name ?? email.split("@")[0]),
      email:  String(me.email ?? email),
      role:   mapRole(authData.role),
      branch: String(me.restaurant?.name ?? me.restaurantName ?? "Foodify"),
    };

    return { user, accessToken: authData.accessToken, refreshToken: authData.refreshToken };
  } catch (error: unknown) {
    const msg = (error as { response?: { data?: { message?: string } } })
      ?.response?.data?.message;
    throw new Error(msg ?? "Error al iniciar sesión");
  }
}

export async function logoutApi(): Promise<void> {
  if (USE_MOCK) return;
  try { await api.post("/auth/logout"); } catch { /* ignorar */ }
}

export async function getMeApi(): Promise<AuthUser> {
  const { data } = await api.get("/auth/me");
  const me = data.data;
  return {
    id:     String(me.id ?? me.userId ?? me.sub ?? ""),
    name:   String(me.fullName ?? me.name ?? ""),
    email:  String(me.email),
    role:   mapRole(me.role),
    branch: String(me.restaurant?.name ?? "Foodify"),
  };
}



