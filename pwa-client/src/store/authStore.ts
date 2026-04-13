import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'saas_admin' | 'restaurant_admin' | 'waiter' | 'chef' | 'cashier';
  restaurantId?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, token, refreshToken) => 
        set({ user, token, refreshToken, isAuthenticated: true }),
      logout: () => 
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'foodify-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
