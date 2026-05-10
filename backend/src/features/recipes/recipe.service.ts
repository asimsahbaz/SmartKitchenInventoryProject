/**
 * features/recipes/recipe.service.ts
 *
 * LAYER: Business Logic Layer
 *
 * Owns recipe-related domain logic:
 *  - Fetching recipes from the repository
 *  - Computing pantry match scores (the core recipe suggestion algorithm)
 *  - Identifying missing ingredients per recipe
 *
 * ALGORITHM NOTE (AI Evaluation Log #10):
 * The initial AI-generated matcher used exact string equality, which failed
 * on "tomatoes" vs "tomato". The current implementation adds naive normalization.
 * This is documented as a known limitation — a production system would use
 * a dedicated ingredient normalization service or NLP library.
 */

import { RecipeRepository } from './recipe.repository';
import { PantryRepository } from '../pantry/pantry.repository';

export interface RecipeMatch {
  id: string;
  title: string;
  description: string | null;
  servings: number;
  prepTimeMinutes: number;
  matchScore: number;        // 0–100 percentage
  missingCount: number;
  missingIngredients: string[];
}

export interface RecipeDetailWithAvailability {
  id: string;
  title: string;
  description: string | null;
  instructions: string;
  servings: number;
  prepTimeMinutes: number;
  matchScore: number;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    availableInPantry: boolean;
    pantryQuantity: number | null;
  }>;
}

export class RecipeService {
  constructor(
    private readonly recipeRepo: RecipeRepository,
    private readonly pantryRepo: PantryRepository,
  ) {}

  /**
   * Get all recipes. If matchPantry=true, sort by how well they match
   * the user's current pantry inventory.
   */
  async findAll(
    userId: string,
    matchPantry: boolean,
    search?: string,
    page = 1,
    limit = 20,
  ): Promise<{ recipes: RecipeMatch[]; total: number }> {
    const { recipes, total } = await this.recipeRepo.findMany(search, page, limit);

    if (!matchPantry) {
      return {
        recipes: recipes.map(r => ({ ...r, matchScore: 0, missingCount: 0, missingIngredients: [] })),
        total,
      };
    }

    // Fetch user's pantry for matching
    const pantryItems = await this.pantryRepo.findMany(userId, {});
    const pantryNames = pantryItems.map(i => this.normalizeIngredientName(i.name));

    const matched = recipes.map(recipe => {
      const ingredients = recipe.ingredients ?? [];
      if (ingredients.length === 0) {
        return { ...recipe, matchScore: 0, missingCount: 0, missingIngredients: [] };
      }

      const missing = ingredients.filter(
        ing => !pantryNames.includes(this.normalizeIngredientName(ing.ingredientName)),
      );

      const matchScore = Math.round(((ingredients.length - missing.length) / ingredients.length) * 100);

      return {
        ...recipe,
        matchScore,
        missingCount: missing.length,
        missingIngredients: missing.map(m => m.ingredientName),
      };
    });

    // Sort: highest match score first
    matched.sort((a, b) => b.matchScore - a.matchScore);

    return { recipes: matched, total };
  }

  /**
   * Get full recipe details with per-ingredient pantry availability.
   */
  async findById(recipeId: string, userId: string): Promise<RecipeDetailWithAvailability> {
    const recipe = await this.recipeRepo.findOne(recipeId);
    if (!recipe) {
      const { NotFoundError } = await import('../../shared/errors/AppError');
      throw new NotFoundError('Recipe');
    }

    const pantryItems = await this.pantryRepo.findMany(userId, {});

    const ingredients = (recipe.ingredients ?? []).map(ing => {
      const match = pantryItems.find(
        p => this.normalizeIngredientName(p.name) === this.normalizeIngredientName(ing.ingredientName),
      );
      return {
        name: ing.ingredientName,
        quantity: Number(ing.quantity),
        unit: ing.unit,
        availableInPantry: !!match,
        pantryQuantity: match ? Number(match.quantity) : null,
      };
    });

    const available = ingredients.filter(i => i.availableInPantry).length;
    const matchScore = ingredients.length > 0
      ? Math.round((available / ingredients.length) * 100)
      : 0;

    return { ...recipe, matchScore, ingredients };
  }

  // ─── Private: Ingredient Normalization ────────────────────────────────────

  /**
   * Normalize ingredient names for fuzzy matching.
   *
   * LIMITATION (documented in AI Prompt Log #10):
   * This is a naive normalization — lowercase + strip trailing 's'.
   * "Tomato" and "Tomatoes" will match; "Cherry Tomatoes" and "Tomatoes" won't.
   * A production system should use an ingredient synonyms database.
   */
  private normalizeIngredientName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/s$/, ''); // naive singular: "tomatoes" → "tomato"
  }
}
