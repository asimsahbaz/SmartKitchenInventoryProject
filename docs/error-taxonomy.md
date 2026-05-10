# Error Taxonomy — PantryPal

> Categorized error types, HTTP status codes, response formats, and frontend behavior guidelines.

---

## Response Envelope

All API responses follow a consistent envelope format:

### Success
```json
{
  "success": true,
  "data": { ... },
  "meta": { "total": 42, "page": 1 }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": [ ... ]
  }
}
```

---

## Error Categories

### 1. Validation Errors

**HTTP Status:** `422 Unprocessable Entity`  
**Error Code:** `VALIDATION_ERROR`

Occur when incoming request data fails schema validation (missing required fields, wrong types, constraint violations).

**Example: Missing required field**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request body contains invalid data.",
    "details": [
      {
        "field": "name",
        "message": "Name is required"
      },
      {
        "field": "quantity",
        "message": "Quantity must be a positive number"
      }
    ]
  }
}
```

**Frontend behavior:**
- Display inline field-level error messages next to the offending input
- Do NOT show a toast for validation errors — surface them in the form
- Highlight invalid fields with red border
- Keep the form open (do not close modal on validation failure)

---

### 2. Authentication Errors

**HTTP Status:** `401 Unauthorized`  
**Error Code:** `UNAUTHORIZED`

Occur when a request reaches a protected endpoint without a valid JWT, with an expired token, or with a malformed token.

**Sub-codes:**

| Sub-code | Trigger |
|----------|---------|
| `TOKEN_MISSING` | No `Authorization` header present |
| `TOKEN_EXPIRED` | JWT signature valid but `exp` claim is in the past |
| `TOKEN_INVALID` | JWT signature verification failed (tampered or wrong secret) |

**Example: Expired token**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Your session has expired. Please log in again.",
    "subCode": "TOKEN_EXPIRED"
  }
}
```

**Frontend behavior:**
- On `TOKEN_EXPIRED`: automatically attempt token refresh via `/auth/refresh`
- If refresh succeeds: retry the original request transparently
- If refresh fails: redirect to `/login` with a "Session expired" toast
- On `TOKEN_MISSING` or `TOKEN_INVALID`: redirect to `/login` immediately

---

### 3. Authorization Errors

**HTTP Status:** `403 Forbidden`  
**Error Code:** `FORBIDDEN`

Occur when a request is authenticated (valid JWT) but the user lacks permission for the requested resource or action.

**Triggers:**
- A `REGULAR_USER` attempting to access an admin endpoint
- A user attempting to read/modify another user's pantry item (resource ownership check)

**Example: Role violation**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action."
  }
}
```

**Frontend behavior:**
- Show a non-dismissible error toast: "You don't have permission to do that"
- Do NOT expose which role is required (information disclosure)
- Log the incident to the browser console for debugging

---

### 4. Not Found Errors

**HTTP Status:** `404 Not Found`  
**Error Code:** `NOT_FOUND`

Occur when a requested resource does not exist, or exists but belongs to a different user (to avoid information disclosure about resource existence, both cases return 404).

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Pantry item not found."
  }
}
```

**Frontend behavior:**
- Show toast: "Item not found. It may have been deleted."
- If navigating to a detail page, redirect to the parent list page
- Remove the item from local state if it was previously shown

---

### 5. Business Logic Errors

**HTTP Status:** `409 Conflict`  
**Error Code:** `BUSINESS_RULE_VIOLATION`

Occur when the request is technically valid but violates a domain rule.

**Triggers and sub-codes:**

| Sub-code | Trigger | Example |
|----------|---------|---------|
| `DUPLICATE_EMAIL` | Registration with already-used email | User already exists |
| `ITEM_ALREADY_EXISTS` | Adding pantry item with identical name | "Milk" already in pantry |
| `INVALID_EXPIRY_DATE` | Expiry date set in the past | Cannot add already-expired item |
| `EMPTY_SHOPPING_LIST` | Generating shopping list with no recipe selected | Nothing to generate |

**Example: Duplicate email**
```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "An account with this email address already exists.",
    "subCode": "DUPLICATE_EMAIL"
  }
}
```

**Frontend behavior:**
- Show field-specific error if applicable (e.g., under email field on registration)
- Show general toast for non-field-specific business errors
- Do not close the form/modal

---

### 6. Database Errors

**HTTP Status:** `500 Internal Server Error`  
**Error Code:** `DATABASE_ERROR`

Occur when a database operation fails unexpectedly. These errors are **never exposed with internal details** to the client.

**Server logs** (internal only, never sent to client):
```
[ERROR] 2025-04-15T14:23:01Z DATABASE_ERROR: Connection timeout after 5000ms
  at PantryRepository.findMany (pantry.repository.ts:47)
  requestId: req_abc123
```

**Client response:**
```json
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "A database error occurred. Please try again later."
  }
}
```

**Frontend behavior:**
- Show generic error toast: "Something went wrong. Please try again."
- Provide a retry button if the operation was a read
- Log error details to browser console for developer debugging

---

### 7. External Service Errors

**HTTP Status:** `502 Bad Gateway` or `503 Service Unavailable`  
**Error Code:** `EXTERNAL_SERVICE_ERROR`

Currently: PantryPal does not integrate external services in v1. This category is defined for future integration (e.g., a recipe API, nutritional data service).

**Response structure:**
```json
{
  "success": false,
  "error": {
    "code": "EXTERNAL_SERVICE_ERROR",
    "message": "An external service is temporarily unavailable. Please try again."
  }
}
```

---

### 8. Unknown / Internal Errors

**HTTP Status:** `500 Internal Server Error`  
**Error Code:** `INTERNAL_ERROR`

Catch-all for unexpected errors that don't match any known category.

**Client response:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again later."
  }
}
```

**Frontend behavior:**
- Show generic error toast
- Include a request ID (if available) to assist support

---

## Global Error Handler (Backend)

```typescript
// shared/middleware/errorHandler.ts
export const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // Log everything (internal details)
  logger.error({
    code: err.code || 'INTERNAL_ERROR',
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Map to safe public response
  if (err instanceof ValidationError) {
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: err.message, details: err.details }
    });
  }
  if (err instanceof UnauthorizedError) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: err.message, subCode: err.subCode }
    });
  }
  if (err instanceof ForbiddenError) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' }
    });
  }
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: err.message }
    });
  }
  if (err instanceof BusinessError) {
    return res.status(409).json({
      success: false,
      error: { code: 'BUSINESS_RULE_VIOLATION', message: err.message, subCode: err.subCode }
    });
  }

  // Default — never expose internals
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' }
  });
};
```

---

## Error Class Hierarchy

```
AppError (base)
├── ValidationError       (422) — Zod schema failures
├── UnauthorizedError     (401) — JWT issues
├── ForbiddenError        (403) — Role/ownership violations
├── NotFoundError         (404) — Resource not found
├── BusinessError         (409) — Domain rule violations
├── DatabaseError         (500) — Prisma/DB failures
└── InternalError         (500) — Unknown/unexpected
```

---

## HTTP Status Code Summary

| Code | Meaning | Error Code(s) |
|------|---------|---------------|
| 400 | Bad Request | Malformed JSON |
| 401 | Unauthorized | `UNAUTHORIZED` |
| 403 | Forbidden | `FORBIDDEN` |
| 404 | Not Found | `NOT_FOUND` |
| 409 | Conflict | `BUSINESS_RULE_VIOLATION` |
| 422 | Unprocessable Entity | `VALIDATION_ERROR` |
| 500 | Internal Server Error | `DATABASE_ERROR`, `INTERNAL_ERROR` |
| 502 | Bad Gateway | `EXTERNAL_SERVICE_ERROR` |
| 503 | Service Unavailable | `EXTERNAL_SERVICE_ERROR` |
