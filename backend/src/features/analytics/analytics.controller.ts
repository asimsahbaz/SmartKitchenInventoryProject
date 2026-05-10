import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';

const service = new AnalyticsService();

export class AnalyticsController {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await service.getSummary(req.user!.userId);
      res.json({ success: true, data: summary });
    } catch (err) { next(err); }
  }
}
