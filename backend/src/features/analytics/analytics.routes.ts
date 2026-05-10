import { Router } from 'express';
const router = Router();
router.get('/test', (_req, res) => res.json({ message: 'analytics route works' }));
export { router as analyticsRouter };
