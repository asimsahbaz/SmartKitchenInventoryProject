# Architecture Documentation — PantryPal

> Software Architectures Course | Spring 2025/2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architectural Pattern](#2-architectural-pattern)
3. [Layer Explanations](#3-layer-explanations)
4. [Feature Decomposition](#4-feature-decomposition)
5. [Data Flow](#5-data-flow)
6. [Component Interactions](#6-component-interactions)
7. [Domain Model](#7-domain-model)
8. [Database Schema](#8-database-schema)
9. [State Management Strategy](#9-state-management-strategy)
10. [Technology Stack Justification](#10-technology-stack-justification)
11. [Security Architecture](#11-security-architecture)

---

## 1. System Overview

PantryPal is a **client–server web application** composed of:

- A **React SPA** (Single-Page Application) frontend served by Vite
- A **Node.js + Express** REST API backend
- A **PostgreSQL** relational database
- A **Prisma ORM** layer for type-safe data access

```
┌──────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │               React SPA (Vite + TypeScript)                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │  Pages   │  │Components│  │  Store   │  │ API Layer│  │  │
│  │  │          │  │(UI)      │  │(Zustand) │  │(Axios)   │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └────┬─────┘  │  │
│  └───────────────────────────────────────────────────┼────────┘  │
└──────────────────────────────────────────────────────┼───────────┘
                                                       │ HTTP/REST
                                         JWT Bearer Token
┌──────────────────────────────────────────────────────┼───────────┐
│                       Backend (Node.js)               │           │
│                                                       ▼           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Routers   │→ │ Controllers │→ │       Services          │  │
│  │  (Express)  │  │  (Request/  │  │  (Business Logic)       │  │
│  │             │  │  Response)  │  │                         │  │
│  └─────────────┘  └─────────────┘  └────────────┬────────────┘  │
│                                                  │               │
│  ┌───────────────────────────────────────────────▼────────────┐  │
│  │                  Repositories (Prisma)                     │  │
│  └───────────────────────────────────────────────┬────────────┘  │
└──────────────────────────────────────────────────┼───────────────┘
                                                   │ SQL
┌──────────────────────────────────────────────────▼───────────────┐
│                      PostgreSQL 15                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Architectural Pattern

### Primary Pattern: Layered Architecture (N-Tier)

PantryPal uses a **strict 4-layer architecture** with enforced unidirectional dependencies. Each layer only depends on the layer immediately below it — never the other way around.

```
Layer 1: Presentation     →  depends on →  Application
Layer 2: Application      →  depends on →  Domain / Business Logic
Layer 3: Business Logic   →  depends on →  Data Access
Layer 4: Data Access      →  depends on →  Infrastructure (DB)
```

**Why Layered Architecture?**
- Enforces separation of concerns at the structural level
- Makes each layer independently testable
- Allows swapping implementations (e.g., replace Prisma with TypeORM) without touching business logic
- Mirrors industry practice; directly aligned with course learning objectives

**Alternatives considered:**
- *Hexagonal (Ports & Adapters)*: More flexible but significantly more complex; overkill for a project of this scope
- *Microservices*: Far too complex for a university project; deployment overhead would dominate the timeline
- *MVC only (no service layer)*: Too thin; controllers become bloated ("fat controller" antipattern)

### Secondary Pattern: Feature-Based Modularization

Within each layer, code is organized by **feature/domain**, not by technical role:

```
features/
├── auth/        (authentication domain)
├── pantry/      (inventory management domain)
├── recipes/     (recipe suggestion domain)
├── shopping-list/
├── analytics/
└── notifications/
```

**Why?** Feature-based structure means all code related to `pantry` management is co-located — its router, controller, service, repository, DTOs, and tests. This minimizes cognitive overhead when working on a specific feature and prevents cross-feature coupling.

---

## 3. Layer Explanations

### Layer 1 — Presentation (Frontend React SPA)

**Responsibility:** Render UI, manage user interactions, maintain local UI state.

**What it contains:**
- React page components (`/pages`)
- Reusable UI components (`/components`)
- Route definitions (React Router)
- API call functions (`/api`) using Axios
- Zustand stores for shared client state

**What it must NOT do:**
- Contain business logic (e.g., calculating which recipes match — that belongs on the server)
- Access the database directly
- Make raw SQL queries

---

### Layer 2 — Application Layer (Express Routes + Controllers)

**Responsibility:** Parse HTTP requests, validate incoming data, delegate to services, format responses.

**What it contains:**
- Express routers (`/routes`)
- Controllers (`/controllers`) — thin, no business logic
- DTO schemas (Zod validators)
- Middleware (authentication guard, error handler)
- Response formatters

**What it must NOT do:**
- Contain business rules
- Call the database directly

**Controller contract:**
```typescript
// Controller is THIN — it only orchestrates:
async createPantryItem(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = CreatePantryItemDto.parse(req.body); // validate
    const result = await this.pantryService.create(req.user.id, dto); // delegate
    res.status(201).json({ success: true, data: result }); // respond
  } catch (err) {
    next(err); // delegate errors to global handler
  }
}
```

---

### Layer 3 — Business Logic Layer (Services)

**Responsibility:** Implement domain rules, orchestrate cross-repository operations, enforce invariants.

**What it contains:**
- Service classes (`PantryService`, `RecipeService`, etc.)
- Domain logic (e.g., "an item is expiring soon if its expiry date is within X days of today")
- Cross-feature orchestration (e.g., generating a shopping list requires reading pantry AND recipe data)

**Example domain rule:**
```typescript
// Business rule lives HERE, not in the controller or repository
isExpiringSoon(item: PantryItem): boolean {
  const daysUntilExpiry = differenceInDays(item.expiryDate, new Date());
  return daysUntilExpiry >= 0 && daysUntilExpiry <= this.config.expiryWarningDays;
}
```

---

### Layer 4 — Data Access Layer (Repositories via Prisma)

**Responsibility:** All database interactions. Translate between domain objects and DB records.

**What it contains:**
- Repository classes wrapping Prisma client
- Query logic (filters, joins, aggregations)
- Database error handling and translation

**What it must NOT do:**
- Contain business logic
- Know about HTTP concerns

---

## 4. Feature Decomposition

| Feature | Frontend Modules | Backend Modules | Key Domain Concepts |
|---------|-----------------|-----------------|---------------------|
| **Authentication** | `LoginPage`, `RegisterPage`, `authStore` | `auth/` router, `AuthService`, `UserRepository` | User, Token, Role |
| **Pantry Management** | `PantryPage`, `ItemCard`, `AddItemModal`, `pantryStore` | `pantry/` router, `PantryService`, `PantryRepository` | PantryItem, Category, Unit |
| **Expiry Tracking** | `ExpiryBadge`, `ExpiryFilterBar` | Part of `PantryService` | ExpiryStatus enum |
| **Recipe Suggestions** | `RecipesPage`, `RecipeCard` | `recipes/` router, `RecipeService`, `RecipeRepository` | Recipe, Ingredient, MatchScore |
| **Shopping List** | `ShoppingListPage`, `ShoppingItemRow` | `shopping-list/` router, `ShoppingListService` | ShoppingList, ShoppingItem |
| **Search & Filtering** | `SearchBar`, `FilterPanel` | Query params on `GET /pantry` | Full-text search, filter predicates |
| **Analytics** | `DashboardPage`, `UsageChart`, `WasteChart` | `analytics/` router, `AnalyticsService` | UsageStat, WasteMetric |
| **Notifications** | `NotificationBell`, `NotificationDropdown` | `notifications/` router, `NotificationService` | Notification, NotificationType |

---

## 5. Data Flow

### Typical Read Request Flow

```
User Action (click "View Pantry")
  │
  ▼
React Component (PantryPage.tsx)
  │  calls
  ▼
API function (api/pantry.ts → axios.get('/pantry'))
  │  HTTP GET /api/v1/pantry?category=dairy
  ▼
Express Router (pantry.routes.ts)
  │  → authMiddleware (validates JWT)
  ▼
PantryController.getAll()
  │  → validates query params via Zod
  ▼
PantryService.findAll(userId, filters)
  │  → applies business rules (e.g., enrich with ExpiryStatus)
  ▼
PantryRepository.findMany(userId, prismaWhereClause)
  │  → Prisma SQL query
  ▼
PostgreSQL → returns rows
  │
  ▼  (back up the stack)
Repository → maps DB records to domain objects
Service → enriches with computed fields
Controller → wraps in standard response envelope
  │  JSON response: { success: true, data: [...], meta: { total } }
  ▼
Axios → returns data
API function → returns typed result
Zustand store → updates pantryItems state
React Component → re-renders with new data
```

---

## 6. Component Interactions

### Authentication Flow

```
Client                    Backend                   Database
  │                          │                          │
  │── POST /auth/register ──▶│                          │
  │                          │── find user by email ───▶│
  │                          │◀── null (not found) ─────│
  │                          │── hash password          │
  │                          │── create user ──────────▶│
  │                          │◀── user record ───────────│
  │◀── 201 { accessToken,    │                          │
  │          refreshToken } ─│                          │
  │                          │                          │
  │── POST /auth/login ─────▶│                          │
  │                          │── find user by email ───▶│
  │                          │◀── user record ───────────│
  │                          │── bcrypt.compare()       │
  │◀── 200 { accessToken,    │── sign JWT               │
  │          refreshToken } ─│                          │
  │                          │                          │
  │── GET /pantry ──────────▶│                          │
  │  Authorization: Bearer   │── verify JWT             │
  │                          │── attach user to req     │
  │                          │── query DB ─────────────▶│
  │◀── 200 { data: [...] } ──│◀── items ─────────────────│
```

---

## 7. Domain Model

```
User
  ├── id: UUID
  ├── email: string (unique)
  ├── passwordHash: string
  ├── role: UserRole (REGULAR_USER | ADMIN)
  ├── createdAt: DateTime
  └── PantryItems[] (1:N)
  └── ShoppingLists[] (1:N)
  └── Notifications[] (1:N)

PantryItem
  ├── id: UUID
  ├── userId: UUID (FK → User)
  ├── name: string
  ├── quantity: Decimal
  ├── unit: string (g | kg | ml | l | pcs | ...)
  ├── categoryId: UUID (FK → Category)
  ├── expiryDate: DateTime (nullable)
  ├── addedAt: DateTime
  ├── notes: string (nullable)
  └── [computed] expiryStatus: FRESH | EXPIRING_SOON | EXPIRED

Category
  ├── id: UUID
  ├── name: string (unique)
  └── icon: string (emoji or icon name)

Recipe
  ├── id: UUID
  ├── title: string
  ├── description: string
  ├── instructions: string
  ├── servings: Int
  ├── prepTimeMinutes: Int
  └── RecipeIngredients[] (1:N)

RecipeIngredient
  ├── id: UUID
  ├── recipeId: UUID (FK → Recipe)
  ├── ingredientName: string
  ├── quantity: Decimal
  └── unit: string

ShoppingList
  ├── id: UUID
  ├── userId: UUID (FK → User)
  ├── name: string
  ├── createdAt: DateTime
  └── ShoppingItems[] (1:N)

ShoppingItem
  ├── id: UUID
  ├── shoppingListId: UUID (FK → ShoppingList)
  ├── name: string
  ├── quantity: Decimal
  ├── unit: string
  ├── isPurchased: boolean
  └── recipeId: UUID (nullable, FK → Recipe — traceability)

Notification
  ├── id: UUID
  ├── userId: UUID (FK → User)
  ├── type: NotificationType (EXPIRY_WARNING | ITEM_EXPIRED)
  ├── message: string
  ├── isRead: boolean
  ├── pantryItemId: UUID (nullable)
  └── createdAt: DateTime
```

---

## 8. Database Schema

```sql
-- Users
CREATE TABLE "User" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"        VARCHAR(255) UNIQUE NOT NULL,
  "passwordHash" VARCHAR(255) NOT NULL,
  "role"         VARCHAR(20) NOT NULL DEFAULT 'REGULAR_USER',
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories (seeded, admin-managed)
CREATE TABLE "Category" (
  "id"   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) UNIQUE NOT NULL,
  "icon" VARCHAR(50)
);

-- Pantry Items
CREATE TABLE "PantryItem" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"     UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "categoryId" UUID REFERENCES "Category"("id") ON DELETE SET NULL,
  "name"       VARCHAR(255) NOT NULL,
  "quantity"   DECIMAL(10,2) NOT NULL DEFAULT 1,
  "unit"       VARCHAR(50) NOT NULL DEFAULT 'pcs',
  "expiryDate" DATE,
  "addedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "notes"      TEXT
);
CREATE INDEX "PantryItem_userId_idx" ON "PantryItem"("userId");
CREATE INDEX "PantryItem_expiryDate_idx" ON "PantryItem"("expiryDate");

-- Recipes (shared across users; admin curates, users browse)
CREATE TABLE "Recipe" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title"            VARCHAR(255) NOT NULL,
  "description"      TEXT,
  "instructions"     TEXT NOT NULL,
  "servings"         INT NOT NULL DEFAULT 2,
  "prepTimeMinutes"  INT NOT NULL DEFAULT 30
);

-- Recipe Ingredients
CREATE TABLE "RecipeIngredient" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "recipeId"       UUID NOT NULL REFERENCES "Recipe"("id") ON DELETE CASCADE,
  "ingredientName" VARCHAR(255) NOT NULL,
  "quantity"       DECIMAL(10,2) NOT NULL,
  "unit"           VARCHAR(50) NOT NULL
);

-- Shopping Lists
CREATE TABLE "ShoppingList" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "name"      VARCHAR(255) NOT NULL DEFAULT 'My Shopping List',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shopping Items
CREATE TABLE "ShoppingItem" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "shoppingListId" UUID NOT NULL REFERENCES "ShoppingList"("id") ON DELETE CASCADE,
  "recipeId"       UUID REFERENCES "Recipe"("id") ON DELETE SET NULL,
  "name"           VARCHAR(255) NOT NULL,
  "quantity"       DECIMAL(10,2) NOT NULL,
  "unit"           VARCHAR(50) NOT NULL,
  "isPurchased"    BOOLEAN NOT NULL DEFAULT FALSE
);

-- Notifications
CREATE TABLE "Notification" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"      UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "pantryItemId" UUID REFERENCES "PantryItem"("id") ON DELETE SET NULL,
  "type"        VARCHAR(50) NOT NULL,
  "message"     TEXT NOT NULL,
  "isRead"      BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 9. State Management Strategy

**Chosen solution: Zustand**

### Why Zustand over alternatives?

| Criterion | Redux Toolkit | React Query | Zustand | Context API |
|-----------|---------------|-------------|---------|-------------|
| Boilerplate | Medium | Low | Very Low | Low |
| Learning curve | High | Medium | Low | Low |
| Server state | Manual | Built-in | Manual | Manual |
| DevTools | Excellent | Excellent | Good | Poor |
| Size | Large | Medium | Tiny (1.2kb) | 0 |
| Suitable for this project | ✓ | ✓ | ✓✓ | ✗ (at scale) |

### State Slices

```typescript
// Auth Store
interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login(credentials): Promise<void>;
  logout(): void;
  refreshToken(): Promise<void>;
}

// Pantry Store
interface PantryStore {
  items: PantryItem[];
  filters: PantryFilters;
  isLoading: boolean;
  error: string | null;
  fetchItems(): Promise<void>;
  addItem(dto): Promise<void>;
  updateItem(id, dto): Promise<void>;
  deleteItem(id): Promise<void>;
  setFilters(filters): void;
}

// Notification Store
interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications(): Promise<void>;
  markAsRead(id): Promise<void>;
  markAllAsRead(): Promise<void>;
}
```

**Design decision:** Server state (data from the API) is managed by Zustand with explicit `fetchX()` actions, rather than React Query. This was chosen because:
1. It reduces dependencies and keeps the architecture simple
2. The team is already learning Zustand — one tool for both UI and server state reduces cognitive load
3. The application does not have aggressive real-time update requirements

**Alternative:** React Query would be superior for cache invalidation, optimistic updates, and background refetching. This is documented as a future improvement.

---

## 10. Technology Stack Justification

### Backend: Express vs NestJS vs Fastify

| | Express | NestJS | Fastify |
|---|---------|--------|---------|
| Structure | Manual | Opinionated/Enforced | Manual |
| Learning curve | Low | High | Low |
| TypeScript | Additive | First-class | Good |
| Ecosystem | Massive | Large | Growing |
| Boilerplate | Low | High | Low |
| Suitable for project scope | ✓✓ | ✓ (overkill) | ✓ |

**Decision:** Express + TypeScript. NestJS enforces excellent architecture patterns (dependency injection, decorators) but adds substantial learning overhead. For a university project where architecture must be deliberately designed, Express allows the student to demonstrate architectural decisions explicitly rather than having the framework enforce them invisibly.

### Database: PostgreSQL vs MongoDB vs SQLite

| | PostgreSQL | MongoDB | SQLite |
|---|-----------|---------|--------|
| Data model | Relational | Document | Relational |
| ACID compliance | Full | Partial | Full |
| Joins | Native | Manual ($lookup) | Native |
| JSON support | Native (JSONB) | Native | Limited |
| Production ready | Yes | Yes | Limited |

**Decision:** PostgreSQL. The domain model has clear relational structure (users own pantry items, recipes have ingredients). Relational integrity (foreign keys, constraints) prevents data corruption bugs that are especially hard to debug in a document store.

### ORM: Prisma vs TypeORM vs Knex

**Decision:** Prisma. Generates TypeScript types from the schema, meaning a database schema change immediately surfaces type errors in the service layer. This aligns with the course's emphasis on correctness and architectural discipline.

---

## 11. Security Architecture

See full threat model: [`docs/threat-model.md`](threat-model.md)

### Authentication

- Access tokens: short-lived JWT (15 minutes), signed with HS256
- Refresh tokens: long-lived (7 days), stored in HTTP-only cookie
- Passwords: hashed with bcrypt (12 rounds)

### Authorization

- Middleware guard extracts and verifies JWT on every protected route
- Role-based: `ADMIN` role required for recipe/category management endpoints
- Row-level: all pantry/shopping list queries filter by `userId` from the JWT — users cannot access each other's data even if they guess UUIDs

### Input Validation

- All incoming request bodies validated with Zod schemas at the controller boundary
- Validation errors return structured 422 responses (see Error Taxonomy)
- Prisma's parameterized queries prevent SQL injection at the ORM level

---

## Feature Decomposition

| Feature | User Story | Backend Module | Frontend Page | Key Domain Concept |
|---------|-----------|----------------|---------------|-------------------|
| User Authentication | As a user, I want to register and log in so my pantry is private | features/auth — AuthService, AuthController | LoginPage | User, JWT Token, Role |
| Pantry Management | As a user, I want to add, edit and delete ingredients in my pantry | features/pantry — PantryService, PantryRepository | PantryPage | PantryItem, Category, Unit |
| Expiration Tracking | As a user, I want to see which items are expiring soon so I can use them first | Part of PantryService — enrichWithExpiryStatus() | ExpiryBadge in PantryPage | ExpiryStatus enum |
| Recipe Suggestions | As a user, I want to see recipes I can make with what I have | features/recipes — RecipeService with match algorithm | RecipesPage | Recipe, MatchScore, MissingIngredients |
| Shopping List | As a user, I want to generate a shopping list for missing ingredients | features/shopping-list — ShoppingListService | ShoppingListPage | ShoppingList, ShoppingItem |
| Analytics Dashboard | As a user, I want to see a summary of my pantry health | features/analytics — AnalyticsService | DashboardPage | CategoryCount, ExpiryStats |
| Notifications | As a user, I want to be alerted when items expire | features/notifications — NotificationService | NotificationBell | Notification, NotificationType |

### Feature Dependency Map

- Authentication is the foundation — all other features require a logged-in user
- Pantry data feeds into Expiration Tracking, Recipe Suggestions, and Analytics
- Recipe Suggestions feeds into Shopping List generation
- Notifications are triggered by Expiration Tracking results
