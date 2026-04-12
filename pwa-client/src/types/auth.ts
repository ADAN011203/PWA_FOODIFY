export type UserRole = "admin" | "mesero" | "cocina" | "restaurant_admin" | "manager" | "waiter" | "chef" | "cashier";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branch: string;
  restaurantId?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}
