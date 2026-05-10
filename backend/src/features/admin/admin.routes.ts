import { Router } from 'express';
const router = Router();
router.get('/test', (_req, res) => res.json({ message: 'admin route works' }));
export { router as adminRouter };
