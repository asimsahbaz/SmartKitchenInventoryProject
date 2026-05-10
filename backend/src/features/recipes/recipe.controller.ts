import { Request, Response, NextFunction } from 'express';
import { RecipeService } from './recipe.service';

const service = new RecipeService();

export class RecipeController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string | undefined;
      const recipes = await service.findAll(req.user!.userId, search);
      res.json({ success: true, data: recipes, meta: { total: recipes.length } });
    } catch (err) { next(err); }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const recipe = await service.findOne(req.params.id, req.user!.userId);
      res.json({ success: true, data: recipe });
    } catch (err) { next(err); }
  }
}
