import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';

const service = new NotificationService();

export class NotificationController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const notifications = await service.generateExpiryNotifications(req.user!.userId);
      res.json({ success: true, data: notifications });
    } catch (err) { next(err); }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await service.markAsRead(req.params.id, req.user!.userId);
      res.json({ success: true });
    } catch (err) { next(err); }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await service.markAllAsRead(req.user!.userId);
      res.status(204).send();
    } catch (err) { next(err); }
  }
}
