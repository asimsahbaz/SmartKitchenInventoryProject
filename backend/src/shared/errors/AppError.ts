/**
 * shared/errors/AppError.ts
 *
 * Custom error class hierarchy for PantryPal.
 *
 * WHY: Using custom error classes instead of plain Error objects allows the
 * global error handler to reliably distinguish error types via instanceof checks
 * and map them to the correct HTTP status codes and response shapes.
 *
 * LAYER RESPONSIBILITY: These classes are defined in the shared layer.
 * Services throw them; the global error handler (Application layer) catches them.
 */

// ─── Base Error ──────────────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    // Maintains proper stack trace in V8 environments
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── 422 — Validation Error ──────────────────────────────────────────────────

export interface ValidationDetail {
  field: string;
  message: string;
}

export class ValidationError extends AppError {
  constructor(
    message: string = 'Request body contains invalid data.',
    public readonly details: ValidationDetail[] = [],
  ) {
    super(message, 'VALIDATION_ERROR');
  }
}

// ─── 401 — Unauthorized ──────────────────────────────────────────────────────

export type UnauthorizedSubCode = 'TOKEN_MISSING' | 'TOKEN_EXPIRED' | 'TOKEN_INVALID';

export class UnauthorizedError extends AppError {
  constructor(
    message: string = 'Authentication required.',
    public readonly subCode: UnauthorizedSubCode = 'TOKEN_MISSING',
  ) {
    super(message, 'UNAUTHORIZED');
  }
}

// ─── 403 — Forbidden ─────────────────────────────────────────────────────────

export class ForbiddenError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action.') {
    super(message, 'FORBIDDEN');
  }
}

// ─── 404 — Not Found ─────────────────────────────────────────────────────────

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found.`, 'NOT_FOUND');
  }
}

// ─── 409 — Business Rule Violation ──────────────────────────────────────────

export class BusinessError extends AppError {
  constructor(
    message: string,
    public readonly subCode: string,
  ) {
    super(message, 'BUSINESS_RULE_VIOLATION');
  }
}

// ─── 500 — Internal ──────────────────────────────────────────────────────────

export class InternalError extends AppError {
  constructor(message: string = 'An unexpected error occurred.') {
    super(message, 'INTERNAL_ERROR');
  }
}
