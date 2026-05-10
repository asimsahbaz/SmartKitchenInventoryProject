import { create } from 'zustand';
import { apiClient } from '../api/client';

interface User { id: string; email: string; role: string; }

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email, password) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    const { user, accessToken } = data.data;
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
    delete apiClient.defaults.headers.common['Authorization'];
    set({ user: null, isAuthenticated: false });
  },

  init: async () => {
    set({ isLoading: true });
    try {
      const { data } = await apiClient.post('/auth/refresh');
      const { accessToken, user } = data.data;
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ isLoading: false, isAuthenticated: false });
    }
  },
}));
