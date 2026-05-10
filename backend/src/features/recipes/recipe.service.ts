import { RecipeRepository } from './recipe.repository';
import { PantryRepository } from '../pantry/pantry.repository';
import { NotFoundError } from '../../shared/errors/AppError';

const recipeRepo = new RecipeRepository();
const pantryRepo = new PantryRepository();

function normalize(name: string): string {
  return name.toLowerCase().trim().replace(/s$/, '');
}

export class RecipeService {
  async findAll(userId: string, search?: string) {
    const [recipes, pantryItems] = await Promise.all([
      recipeRepo.findMany(search),
      pantryRepo.findMany(userId, {}),
    ]);

    const pantryNames = pantryItems.map(i => normalize(i.name));

    return recipes.map(recipe => {
      const ingredients = recipe.ingredients ?? [];
      const missing = ingredients.filter(
        ing => !pantryNames.includes(normalize(ing.ingredientName))
      );
      const matchScore = ingredients.length > 0
        ? Math.round(((ingredients.length - missing.length) / ingredients.length) * 100)
        : 0;

      return {
        ...recipe,
        matchScore,
        missingCount: missing.length,
        missingIngredients: missing.map(m => m.ingredientName),
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }

  async findOne(id: string, userId: string) {
    const [recipe, pantryItems] = await Promise.all([
      recipeRepo.findOne(id),
      pantryRepo.findMany(userId, {}),
    ]);

    if (!recipe) throw new NotFoundError('Recipe');

    const pantryNames = pantryItems.map(i => normalize(i.name));

    const ingredients = (recipe.ingredients ?? []).map(ing => ({
      name: ing.ingredientName,
      quantity: Number(ing.quantity),
      unit: ing.unit,
      availableInPantry: pantryNames.includes(normalize(ing.ingredientName)),
    }));

    const available = ingredients.filter(i => i.availableInPantry).length;
    const matchScore = ingredients.length > 0
      ? Math.round((available / ingredients.length) * 100)
      : 0;

    return { ...recipe, matchScore, ingredients };
  }
}
