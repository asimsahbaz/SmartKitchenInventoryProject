import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, Users, ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

interface Recipe {
  id: string;
  title: string;
  description: string;
  instructions: string;
  servings: number;
  prepTimeMinutes: number;
  matchScore: number;
  missingCount: number;
  missingIngredients: string[];
  ingredients: any[];
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchRecipes = async (q?: string) => {
    setLoading(true);
    try {
      const params = q ? `?search=${q}` : '';
      const { data } = await apiClient.get(`/recipes${params}`);
      setRecipes(data.data);
    } catch {
      toast.error('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecipes(); }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    fetchRecipes(e.target.value);
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const scoreBar = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-400';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/pantry')} className="text-2xl">🥦</button>
            <span className="font-bold text-gray-900">Recipes</span>
          </div>
          <button onClick={() => navigate('/pantry')}
            className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to pantry
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="relative mb-5">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search recipes..."
            value={search}
            onChange={handleSearch}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading recipes...</div>
        ) : (
          <div className="space-y-3">
            {recipes.map(recipe => (
              <div key={recipe.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900">{recipe.title}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${scoreColor(recipe.matchScore)}`}>
                          {recipe.matchScore}% match
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{recipe.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock size={12} /> {recipe.prepTimeMinutes} min
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Users size={12} /> {recipe.servings} servings
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpanded(expanded === recipe.id ? null : recipe.id)}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-1"
                    >
                      {expanded === recipe.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Pantry match</span>
                      <span>{recipe.ingredients.length - recipe.missingCount}/{recipe.ingredients.length} ingredients</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${scoreBar(recipe.matchScore)}`}
                        style={{ width: `${recipe.matchScore}%` }}
                      />
                    </div>
                  </div>

                  {recipe.missingCount > 0 && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-400">Missing:</span>
                      {recipe.missingIngredients.map(ing => (
                        <span key={ing} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                          {ing}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {expanded === recipe.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-3">Ingredients</h4>
                    <div className="space-y-1.5 mb-4">
                      {recipe.ingredients.map((ing: any) => (
                        <div key={ing.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{ing.ingredientName}</span>
                          <span className="text-gray-400">{ing.quantity} {ing.unit}</span>
                        </div>
                      ))}
                    </div>
                    <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Instructions</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{recipe.instructions}</p>
                    {recipe.missingCount > 0 && (
                      <button
                        onClick={() => navigate('/shopping-list', { state: { recipeId: recipe.id, recipeTitle: recipe.title, missing: recipe.missingIngredients } })}
                        className="mt-4 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                      >
                        <ShoppingCart size={15} />
                        Add missing items to shopping list
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
