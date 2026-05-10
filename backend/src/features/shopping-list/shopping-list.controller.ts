import { Request, Response, NextFunction } from 'express';
import { ShoppingListService } from './shopping-list.service';

const service = new ShoppingListService();

export class ShoppingListController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const lists = await service.findAll(req.user!.userId);
      res.json({ success: true, data: lists });
    } catch (err) { next(err); }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await service.findOne(req.params.id, req.user!.userId);
      res.json({ success: true, data: list });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, items } = req.body;
      const list = await service.create(req.user!.userId, name ?? 'Shopping List', items ?? []);
      res.status(201).json({ success: true, data: list });
    } catch (err) { next(err); }
  }

  async toggleItem(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.toggleItem(req.params.id, req.params.itemId, req.user!.userId);
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await service.delete(req.params.id, req.user!.userId);
      res.status(204).send();
    } catch (err) { next(err); }
  }
}
