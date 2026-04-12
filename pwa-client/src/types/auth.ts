export type UserRole = "admin" | "restaurant_admin" | "manager" | "waiter" | "chef" | "cashier" | "mesero" | "cocinero" | "cocina" | "guest";

export interface AuthUser {
  id: string;
  name?: string;     // PWA name
  fullName?: string; // Backend name
  email: string;
  role: UserRole;
  branch?: string;   // PWA branch name
  restaurant?: { id: string; name: string }; // Backend shape
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
