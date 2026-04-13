export type UserRole = "admin" | "mesero" | "cocina";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branch: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}
