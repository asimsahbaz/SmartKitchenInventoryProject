import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PantryService } from './pantry.service';
import { PantryRepository } from './pantry.repository';
import { ValidationError } from '../../shared/errors/AppError';

const repo = new PantryRepository();
const service = new PantryService(repo);

const createSchema = z.object({
  name: z.string().min(1).max(255),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  categoryId: z.string().uuid().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
});

export class PantryController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        search: req.query.search as string,
        categoryId: req.query.categoryId as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as string,
      };
      const items = await service.findAll(req.user!.userId, filters);
      res.json({ success: true, data: items, meta: { total: items.length } });
    } catch (err) { next(err); }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.findById(req.params.id, req.user!.userId);
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = createSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError('Validation failed', result.error.errors.map(e => ({
          field: e.path[0] as string, message: e.message,
        })));
      }
      const item = await service.create(req.user!.userId, result.data);
      res.status(201).json({ success: true, data: item });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.update(req.params.id, req.user!.userId, req.body);
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
