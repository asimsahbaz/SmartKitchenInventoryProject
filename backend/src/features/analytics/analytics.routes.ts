import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authMiddleware } from '../../shared/middleware/authMiddleware';

const router = Router();
const controller = new AnalyticsController();

router.use(authMiddleware);
router.get('/summary', (req, res, next) => controller.getSummary(req, res, next));

export { router as analyticsRouter };
