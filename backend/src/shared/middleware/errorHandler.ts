/**
 * shared/middleware/errorHandler.ts
 *
 * Global Express error handler — the final middleware in the chain.
 *
 * WHY THIS ARCHITECTURE MATTERS:
 * Centralizing all error handling here ensures:
 *  1. Consistent response envelope across all error types
 *  2. No internal details (stack traces, DB errors) leak to clients
 *  3. All errors are logged with context before being sanitized
 *
 * LAYER: Application layer — this is Express middleware.
 * It knows about HTTP but delegates error classification to the error class hierarchy.
 */

import { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  BusinessError,
} from '../errors/AppError';

/** Minimal structured logger wrapper. In production, replace with winston/pino. */
const logger = {
  error: (data: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: 'error', timestamp: new Date().toISOString(), ...data }));
  },
};

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // ── Log full details internally (NEVER send stack to client) ──────────────
  logger.error({
    errorName: err.name ?? 'UnknownError',
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id,
  });

  // ── Map known error classes → HTTP responses ──────────────────────────────

  if (err instanceof ValidationError) {
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: err.message, details: err.details },
    });
  }

  if (err instanceof UnauthorizedError) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: err.message, subCode: err.subCode },
    });
  }

  if (err instanceof ForbiddenError) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: err.message },
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: err.message },
    });
  }

  if (err instanceof BusinessError) {
    return res.status(409).json({
      success: false,
      error: { code: 'BUSINESS_RULE_VIOLATION', message: err.message, subCode: err.subCode },
    });
  }

  // ── Prisma-specific errors ─────────────────────────────────────────────────
  // WHY: Prisma errors are not our AppError subclasses, so they need separate handling.
  // Mapping Prisma error codes prevents them from falling through to the 500 catch-all.

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      // Unique constraint violation
      return res.status(409).json({
        success: false,
        error: { code: 'BUSINESS_RULE_VIOLATION', message: 'A record with this value already exists.', subCode: 'DUPLICATE_RECORD' },
      });
    }
    if (err.code === 'P2025') {
      // Record not found (e.g., update/delete on non-existent record)
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'The requested record was not found.' },
      });
    }
  }

  // ── Default: Unknown / Internal Error ─────────────────────────────────────
  // IMPORTANT: Never expose error.message here — it may contain internal details
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred. Please try again later.' },
  });
};
