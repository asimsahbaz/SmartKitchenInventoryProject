import { Router } from 'express';
import { PantryController } from './pantry.controller';
import { authMiddleware } from '../../shared/middleware/authMiddleware';

const router = Router();
const controller = new PantryController();

router.use(authMiddleware);
router.get('/', (req, res, next) => controller.getAll(req, res, next));
router.get('/:id', (req, res, next) => controller.getOne(req, res, next));
router.post('/', (req, res, next) => controller.create(req, res, next));
router.patch('/:id', (req, res, next) => controller.update(req, res, next));
router.delete('/:id', (req, res, next) => controller.remove(req, res, next));

export { router as pantryRouter };
