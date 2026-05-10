import React, { useEffect, useState } from 'react';
import { usePantryStore, PantryItem } from '../store/pantryStore';
import { useAuthStore } from '../store/authStore';
import { Search, Plus, Trash2, LogOut, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  FRESH: 'bg-green-100 text-green-700',
  EXPIRING_SOON: 'bg-yellow-100 text-yellow-700',
  EXPIRED: 'bg-red-100 text-red-700',
  NO_EXPIRY: 'bg-gray-100 text-gray-600',
};

const statusLabels: Record<string, string> = {
  FRESH: 'Fresh',
  EXPIRING_SOON: 'Expiring soon',
  EXPIRED: 'Expired',
  NO_EXPIRY: 'No expiry',
};

export default function PantryPage() {
  const { items, isLoading, fetchItems, addItem, deleteItem } = usePantryStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', quantity: 1, unit: 'pcs', expiryDate: '' });

  useEffect(() => { fetchItems(); }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    fetchItems(e.target.value);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addItem({
        ...form,
        quantity: Number(form.quantity),
        expiryDate: form.expiryDate || undefined,
      });
      toast.success('Item added!');
      setShowAdd(false);
      setForm({ name: '', quantity: 1, unit: 'pcs', expiryDate: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? 'Failed to add item');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    await deleteItem(id);
    toast.success('Item removed');
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const expired = items.filter(i => i.expiryStatus === 'EXPIRED').length;
  const expiringSoon = items.filter(i => i.expiryStatus === 'EXPIRING_SOON').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥦</span>
            <span className="font-bold text-gray-900">PantryPal</span>
          <button onClick={() => navigate("/recipes")} className="text-sm text-green-600 hover:text-green-700 font-medium">Recipes</button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">{user?.email}</span>
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {(expired > 0 || expiringSoon > 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <p className="text-sm text-yellow-800">
              {expired > 0 && <span className="font-medium">{expired} item{expired > 1 ? 's' : ''} expired. </span>}
              {expiringSoon > 0 && <span>{expiringSoon} item{expiringSoon > 1 ? 's' : ''} expiring soon.</span>}
            </p>
          </div>
        )}

        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search ingredients..."
              value={search}
              onChange={handleSearch}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
            />
          </div>
          <button
            onClick={() => fetchItems(search)}
            className="p-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-600"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Add item
          </button>
        </div>

        {showAdd && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
            <h3 className="font-medium text-gray-900 mb-4">Add new item</h3>
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Whole Milk"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quantity *</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                  min="0.01"
                  step="0.01"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Unit *</label>
                <select
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  {['pcs', 'g', 'kg', 'ml', 'l', 'tbsp', 'tsp', 'cup', 'oz', 'lb'].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Expiry date (optional)</label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
              <div className="col-span-2 flex gap-2 justify-end">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium">
                  Add item
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🛒</div>
            <p className="text-gray-500">Your pantry is empty. Add your first item!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item: PantryItem) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-xl">{item.category?.icon ?? '📦'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 text-sm">{item.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[item.expiryStatus]}`}>
                      {statusLabels[item.expiryStatus]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.quantity} {item.unit}
                    {item.category && ` · ${item.category.name}`}
                    {item.expiryDate && ` · Expires ${new Date(item.expiryDate).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(item.id, item.name)}
                  className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 text-center text-xs text-gray-400">
          {items.length} item{items.length !== 1 ? 's' : ''} in pantry
        </div>
      </main>
    </div>
  );
}
