import { Router } from 'express';
import { RecipeController } from './recipe.controller';
import { authMiddleware } from '../../shared/middleware/authMiddleware';

const router = Router();
const controller = new RecipeController();

router.use(authMiddleware);
router.get('/', (req, res, next) => controller.getAll(req, res, next));
router.get('/:id', (req, res, next) => controller.getOne(req, res, next));

export { router as recipeRouter };
