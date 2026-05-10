/**
 * shared/middleware/authMiddleware.ts
 *
 * JWT authentication guard middleware.
 *
 * ARCHITECTURE ROLE:
 * This middleware sits at the Application layer boundary.
 * It extracts user identity from the JWT and attaches it to `req.user`,
 * making it available to all downstream controllers and services.
 *
 * SECURITY DESIGN:
 * - Reads the JWT from the Authorization header (Bearer scheme)
 * - Verifies the signature against JWT_ACCESS_SECRET
 * - Throws typed errors that the global handler maps to 401 responses
 * - Does NOT check role — role-based checks are done by requireRole()
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/AppError';

export interface JwtPayload {
  userId: string;
  role: 'REGULAR_USER' | 'ADMIN';
  iat: number;
  exp: number;
}

// Extend Express Request to carry user identity downstream
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('No authentication token provided.', 'TOKEN_MISSING');
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Your session has expired. Please log in again.', 'TOKEN_EXPIRED');
    }
    throw new UnauthorizedError('Invalid authentication token.', 'TOKEN_INVALID');
  }
};

/**
 * Role-based authorization guard.
 * Apply AFTER authMiddleware — it assumes req.user is populated.
 *
 * WHY SEPARATE FROM authMiddleware:
 * Separating authentication (who are you?) from authorization (what can you do?)
 * is a core security principle. This allows mixing auth-only routes
 * and role-specific routes without duplicating logic.
 */
export const requireRole = (...roles: Array<'REGULAR_USER' | 'ADMIN'>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    if (!roles.includes(req.user.role)) {
      const { ForbiddenError } = require('../errors/AppError');
      throw new ForbiddenError();
    }
    next();
  };
};
