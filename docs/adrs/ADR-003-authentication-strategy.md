# ADR-003 — Authentication Strategy

**Status:** Accepted  
**Date:** 2025-03-25  
**Author:** Student  
**Deciders:** Student

---

## Context

PantryPal requires a working authentication system to protect user data. Each user's pantry, shopping list, and notifications are private. The system must:

1. Allow users to register and log in
2. Identify the current user on every protected API request
3. Be secure against common attacks (token theft, session fixation)
4. Be simple enough to implement correctly within a university project timeline

The primary strategies considered:

1. **JWT (stateless, access + refresh token pair)**
2. **Session-based authentication (server-side session store)**
3. **Third-party OAuth / Passport.js (GitHub, Google)**

---

## Decision

**Use JWT-based authentication** with:
- Short-lived **access tokens** (15 minutes, sent as `Authorization: Bearer` header)
- Long-lived **refresh tokens** (7 days, sent as HTTP-only cookie)
- Passwords hashed with **bcrypt** (12 salt rounds)

---

## Rationale

### Why JWT over Sessions

Session-based authentication stores session data server-side (in memory or a database/Redis). This introduces:
- Statefulness — the server must maintain session state, which conflicts with the stateless REST API design
- An additional infrastructure dependency (Redis or a session table) that complicates local setup
- More complex horizontal scaling (sessions must be shared across instances)

JWT is self-contained: the server can verify a token by checking its signature — no database lookup required on every request. This aligns with the REST API's stateless design and simplifies the infrastructure.

### Why Not OAuth / Passport.js

Third-party OAuth would require registering a developer application with GitHub or Google, managing callback URLs, and handling the OAuth flow complexity. This is unnecessary infrastructure overhead for a project where demonstrating authentication architecture (rather than integrating third-party services) is the goal.

### Access + Refresh Token Pattern

A single long-lived JWT would be simpler but insecure: if stolen, it grants access until expiry (potentially days). The access/refresh split limits the exposure window:

- **Access token (15 min):** Used on every API request. Short lifespan limits damage if intercepted.
- **Refresh token (7 days, HTTP-only cookie):** Used only to get new access tokens. Stored in HTTP-only cookie, so it's inaccessible to JavaScript — mitigates XSS theft.

This is the industry-standard pattern and demonstrates awareness of security trade-offs.

### bcrypt Salt Rounds: 12

- 10 rounds: ~100ms per hash (common default)
- 12 rounds: ~400ms per hash (chosen)
- 14 rounds: ~1.6s per hash (too slow for UX)

12 rounds provides a good balance between security (computationally expensive for attackers) and UX (acceptable registration/login latency).

---

## Implementation Details

```
POST /api/v1/auth/register
  → validate email + password (Zod)
  → check email uniqueness
  → bcrypt.hash(password, 12)
  → prisma.user.create(...)
  → sign accessToken (JWT, 15m, userId + role in payload)
  → sign refreshToken (JWT, 7d)
  → set refreshToken as HTTP-only cookie
  → return { accessToken, user }

POST /api/v1/auth/login
  → find user by email
  → bcrypt.compare(password, hash)
  → sign new tokens
  → set cookie, return accessToken

POST /api/v1/auth/refresh
  → read refreshToken from cookie
  → verify signature + expiry
  → sign new accessToken
  → return { accessToken }

POST /api/v1/auth/logout
  → clear cookie
  → return 204
```

**Auth Middleware:**
```typescript
export const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new UnauthorizedError();
  const token = header.split(' ')[1];
  const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  req.user = payload; // attach to request for downstream use
  next();
};
```

---

## Consequences

### Positive
- Stateless — no server-side session store needed
- Access token in memory (not localStorage) reduces XSS exposure for the main credential
- Refresh token in HTTP-only cookie prevents JavaScript access
- Standard pattern — well-documented, well-understood by the security community
- No additional infrastructure (no Redis, no session table)

### Negative
- Access tokens cannot be revoked before expiry — a logged-out user's access token is valid for up to 15 minutes
- Refresh token revocation requires a denylist (not implemented; documented as a limitation)
- Token storage on the frontend (access token in memory) is lost on page refresh — requires a `/auth/refresh` call on load
- Implementing the refresh flow correctly (intercepting 401 responses, queuing requests) adds frontend complexity

### Known Limitations (Accepted for this project scope)
- No refresh token rotation (each refresh generates a new access token but reuses the same refresh token)
- No token denylist — logout does not invalidate the access token server-side
- These limitations are documented in the threat model with their mitigations

---

## Alternatives Considered

### Session-based (express-session + connect-pg-simple)
- **Pro:** Easier revocation (delete session from DB), well-understood
- **Con:** Stateful — requires session storage infrastructure; more complex setup
- **Verdict:** Rejected — adds infrastructure dependency; conflicts with stateless REST design

### Firebase Authentication / Auth0
- **Pro:** Handles token management, refresh, revocation — battle-tested
- **Con:** External dependency; masks the authentication architecture the course intends students to implement
- **Verdict:** Rejected — the course requires understanding the auth implementation, not outsourcing it

### Passport.js (local strategy)
- **Pro:** Handles login flow boilerplate
- **Con:** Adds abstraction layer; the manual JWT implementation is not significantly more complex and is more educational
- **Verdict:** Rejected — Passport adds a layer that obscures the authentication mechanism being demonstrated

---

## AI Assistance Note

The access/refresh token architecture was suggested by AI (Prompt Log #5). The student validated the suggestion against OWASP authentication guidelines before accepting it. The bcrypt round count rationale was researched independently; the AI had suggested 10 rounds without justification, and the student updated to 12 with documented reasoning. See AI Evaluation Log #5 (MODIFIED).
