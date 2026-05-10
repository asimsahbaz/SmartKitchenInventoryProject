import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from '../../shared/middleware/authMiddleware';

const router = Router();
const controller = new AuthController();

router.post('/register', (req, res, next) => controller.register(req, res, next));
router.post('/login', (req, res, next) => controller.login(req, res, next));
router.post('/refresh', (req, res, next) => controller.refresh(req, res, next));
router.post('/logout', (req, res) => controller.logout(req, res));
router.get('/me', authMiddleware, (req, res) => controller.me(req, res));

export { router as authRouter };
