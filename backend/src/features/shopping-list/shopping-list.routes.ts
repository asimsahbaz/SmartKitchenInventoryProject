import { Router } from 'express';
const router = Router();
router.get('/test', (_req, res) => res.json({ message: 'shopping-list route works' }));
export { router as shoppingListRouter };
