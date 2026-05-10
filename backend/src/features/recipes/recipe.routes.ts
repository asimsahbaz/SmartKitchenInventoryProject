import { Router } from 'express';
const router = Router();
router.get('/test', (_req, res) => res.json({ message: 'recipes route works' }));
export { router as recipeRouter };
