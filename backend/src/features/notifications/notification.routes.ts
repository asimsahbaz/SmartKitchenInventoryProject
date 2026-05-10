import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authMiddleware } from '../../shared/middleware/authMiddleware';

const router = Router();
const controller = new NotificationController();

router.use(authMiddleware);
router.get('/', (req, res, next) => controller.getAll(req, res, next));
router.patch('/:id/read', (req, res, next) => controller.markAsRead(req, res, next));
router.patch('/read-all', (req, res, next) => controller.markAllAsRead(req, res, next));

export { router as notificationRouter };
