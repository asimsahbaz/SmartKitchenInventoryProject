import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { ValidationError } from '../../shared/errors/AppError';

const authService = new AuthService();

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        const details = result.error.errors.map(e => ({
          field: e.path[0] as string,
          message: e.message,
        }));
        throw new ValidationError('Validation failed', details);
      }
      const { email, password } = result.data;
      const { user, accessToken, refreshToken } = await authService.register(email, password);
      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
      res.status(201).json({ success: true, data: { user, accessToken } });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError('Validation failed', []);
      }
      const { email, password } = result.data;
      const { user, accessToken, refreshToken } = await authService.login(email, password);
      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
      res.status(200).json({ success: true, data: { user, accessToken } });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) {
        return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No refresh token' } });
      }
      const { accessToken, user } = await authService.refresh(token);
      res.status(200).json({ success: true, data: { accessToken, user } });
    } catch (err) {
      next(err);
    }
  }

  async logout(_req: Request, res: Response) {
    res.clearCookie('refreshToken');
    res.status(204).send();
  }

  async me(req: Request, res: Response) {
    res.json({ success: true, data: req.user });
  }
}
