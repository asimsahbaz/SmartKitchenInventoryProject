import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Trash2, CheckCircle, Circle, Plus, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  isPurchased: boolean;
}

interface ShoppingList {
  id: string;
  name: string;
  createdAt: string;
  items: ShoppingItem[];
}

export default function ShoppingListPage() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchLists = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/shopping-lists');
      setLists(data.data);
      if (data.data.length > 0 && !activeList) {
        setActiveList(data.data[0]);
      }
    } catch {
      toast.error('Failed to load shopping lists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists().then(() => {
      const state = location.state as any;
      if (state?.missing && state?.recipeTitle) {
        createFromRecipe(state.recipeTitle, state.missing);
        navigate('/shopping-list', { replace: true });
      }
    });
  }, []);

  const createFromRecipe = async (title: string, missing: string[]) => {
    try {
      const items = missing.map((name: string) => ({
        name,
        quantity: 1,
        unit: 'pcs',
        isPurchased: false,
      }));
      const { data } = await apiClient.post('/shopping-lists', {
        name: `For: ${title}`,
        items,
      });
      setLists(prev => [data.data, ...prev]);
      setActiveList(data.data);
      toast.success('Shopping list created!');
    } catch {
      toast.error('Failed to create list');
    }
  };

  const createEmpty = async () => {
    try {
      const { data } = await apiClient.post('/shopping-lists', {
        name: `Shopping List ${new Date().toLocaleDateString()}`,
        items: [],
      });
      setLists(prev => [data.data, ...prev]);
      setActiveList(data.data);
      toast.success('New list created!');
    } catch {
      toast.error('Failed to create list');
    }
  };

  const toggleItem = async (listId: string, itemId: string) => {
    try {
      await apiClient.patch(`/shopping-lists/${listId}/items/${itemId}`);
      await fetchLists();
      const updated = lists.find(l => l.id === listId);
      if (updated) setActiveList(updated);
    } catch {
      toast.error('Failed to update item');
    }
  };

  const deleteList = async (id: string) => {
    if (!confirm('Delete this list?')) return;
    try {
      await apiClient.delete(`/shopping-lists/${id}`);
      setLists(prev => prev.filter(l => l.id !== id));
      setActiveList(null);
      toast.success('List deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const refreshActive = async (listId: string) => {
    const { data } = await apiClient.get(`/shopping-lists/${listId}`);
    setActiveList(data.data);
    setLists(prev => prev.map(l => l.id === listId ? data.data : l));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/pantry')} className="text-2xl">🥦</button>
            <span className="font-bold text-gray-900">Shopping List</span>
          </div>
          <button onClick={() => navigate('/pantry')} className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to pantry
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-600">Your lists ({lists.length})</h2>
          <button
            onClick={createEmpty}
            className="flex items-center gap-1.5 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={14} /> New list
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : lists.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-2">No shopping lists yet.</p>
            <p className="text-sm text-gray-400">Go to Recipes and add missing ingredients!</p>
            <button onClick={() => navigate('/recipes')}
              className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium">
              Browse recipes →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {lists.map(list => {
              const purchased = list.items.filter(i => i.isPurchased).length;
              const total = list.items.length;
              const isActive = activeList?.id === list.id;

              return (
                <div key={list.id} className={`bg-white border rounded-xl overflow-hidden transition-all ${isActive ? 'border-green-300' : 'border-gray-200'}`}>
                  <div
                    className="p-4 cursor-pointer flex items-center justify-between"
                    onClick={() => setActiveList(isActive ? null : list)}
                  >
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{list.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {purchased}/{total} items · {new Date(list.createdAt).toLocaleDateString()}
                      </p>
                      {total > 0 && (
                        <div className="mt-2 h-1 w-32 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${total > 0 ? (purchased / total) * 100 : 0}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <button onClick={e => { e.stopPropagation(); deleteList(list.id); }}
                      className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {isActive && (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {list.items.length === 0 ? (
                        <p className="text-center text-sm text-gray-400 py-4">No items in this list</p>
                      ) : (
                        list.items.map(item => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleItem(list.id, item.id).then(() => refreshActive(list.id))}
                          >
                            {item.isPurchased
                              ? <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                              : <Circle size={18} className="text-gray-300 flex-shrink-0" />
                            }
                            <span className={`text-sm flex-1 ${item.isPurchased ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                              {item.name}
                            </span>
                            <span className="text-xs text-gray-400">{item.quantity} {item.unit}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
