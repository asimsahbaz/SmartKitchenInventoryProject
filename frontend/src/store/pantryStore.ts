import { create } from 'zustand';
import { apiClient } from '../api/client';

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate: string | null;
  expiryStatus: 'FRESH' | 'EXPIRING_SOON' | 'EXPIRED' | 'NO_EXPIRY';
  notes: string | null;
  category: { id: string; name: string; icon: string } | null;
}

interface PantryStore {
  items: PantryItem[];
  isLoading: boolean;
  error: string | null;
  fetchItems: (search?: string) => Promise<void>;
  addItem: (data: any) => Promise<void>;
  updateItem: (id: string, data: any) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const usePantryStore = create<PantryStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async (search) => {
    set({ isLoading: true, error: null });
    try {
      const params = search ? `?search=${search}` : '';
      const { data } = await apiClient.get(`/pantry${params}`);
      set({ items: data.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error?.message ?? 'Failed to load', isLoading: false });
    }
  },

  addItem: async (item) => {
    await apiClient.post('/pantry', item);
    await get().fetchItems();
  },

  updateItem: async (id, item) => {
    await apiClient.patch(`/pantry/${id}`, item);
    await get().fetchItems();
  },

  deleteItem: async (id) => {
    set(s => ({ items: s.items.filter(i => i.id !== id) }));
    try {
      await apiClient.delete(`/pantry/${id}`);
    } catch {
      await get().fetchItems();
    }
  },
}));
