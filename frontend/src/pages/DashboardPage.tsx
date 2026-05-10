import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { LogOut, ShoppingCart, BookOpen, BarChart2 } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';

interface Summary {
  totalItems: number;
  expiredItems: number;
  expiringSoon: number;
  recentlyAdded: number;
  categoryCounts: { category: string; icon: string; count: number }[];
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get('/analytics/summary').then(({ data }) => setSummary(data.data));
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥦</span>
            <span className="font-bold text-gray-900">PantryPal</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="text-sm text-gray-500 hidden sm:block">{user?.email}</span>
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Dashboard</h2>

        {summary && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{summary.totalItems}</div>
                <div className="text-xs text-gray-500 mt-1">Total items</div>
              </div>
              <div className="bg-white border border-red-100 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-500">{summary.expiredItems}</div>
                <div className="text-xs text-gray-500 mt-1">Expired</div>
              </div>
              <div className="bg-white border border-yellow-100 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-yellow-500">{summary.expiringSoon}</div>
                <div className="text-xs text-gray-500 mt-1">Expiring soon</div>
              </div>
              <div className="bg-white border border-green-100 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-500">{summary.recentlyAdded}</div>
                <div className="text-xs text-gray-500 mt-1">Added this week</div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <BarChart2 size={15} /> Items by category
              </h3>
              <div className="space-y-2">
                {summary.categoryCounts.map(c => (
                  <div key={c.category} className="flex items-center gap-3">
                    <span className="text-base w-6">{c.icon}</span>
                    <span className="text-sm text-gray-600 w-28 truncate">{c.category}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-400 rounded-full"
                        style={{ width: `${(c.count / summary.totalItems) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-4 text-right">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => navigate('/pantry')}
            className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-green-300 transition-colors">
            <span className="text-2xl block mb-1">🥦</span>
            <span className="text-xs font-medium text-gray-600">Pantry</span>
          </button>
          <button onClick={() => navigate('/recipes')}
            className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-green-300 transition-colors">
            <BookOpen size={24} className="mx-auto mb-1 text-gray-400" />
            <span className="text-xs font-medium text-gray-600">Recipes</span>
          </button>
          <button onClick={() => navigate('/shopping-list')}
            className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-green-300 transition-colors">
            <ShoppingCart size={24} className="mx-auto mb-1 text-gray-400" />
            <span className="text-xs font-medium text-gray-600">Shopping</span>
          </button>
        </div>
      </main>
    </div>
  );
}
