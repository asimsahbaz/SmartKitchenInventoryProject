import { Router } from 'express';
const router = Router();
router.get('/test', (_req, res) => res.json({ message: 'notifications route works' }));
export { router as notificationRouter };
