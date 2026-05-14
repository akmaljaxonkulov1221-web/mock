import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  xp?: number;
  streak?: number;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function setAuthCookie(token: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `token=${encodeURIComponent(token)}; Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'token=; Path=/; Max-Age=0; SameSite=Lax';
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('token') : false,

  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuthCookie(token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearAuthCookie();
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/';
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
}));
