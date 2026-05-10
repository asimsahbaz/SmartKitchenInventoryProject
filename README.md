# 🥦 PantryPal — Smart Kitchen Inventory

> A full-stack web application for managing kitchen ingredients, tracking expiration dates, discovering recipes, and generating smart shopping lists.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Installation & Local Setup](#installation--local-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Folder Structure](#folder-structure)
- [Scripts](#scripts)
- [Testing](#testing)
- [Future Improvements](#future-improvements)

---

## Project Overview

PantryPal is a **Smart Kitchen Inventory** application built as a semester project for the Software Architectures course (Spring 2025/2026). The application demonstrates conscious architectural decision-making, clear separation of concerns, and deliberate AI-assisted development.

The system allows users to:
- Track what ingredients they have and when they expire
- Get recipe suggestions based on currently available pantry items
- Automatically generate shopping lists for missing ingredients
- Receive notifications before items expire
- Analyze their pantry usage over time via a dashboard

---

## Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **User Authentication** | JWT-based registration, login, and role management |
| 2 | **Pantry Management** | Add, edit, delete, and search ingredients with quantities and units |
| 3 | **Expiration Tracking** | Track expiry dates; color-coded urgency indicators |
| 4 | **Recipe Suggestions** | Engine that matches recipes to available pantry ingredients |
| 5 | **Shopping List Generation** | Automatically fills missing ingredients for chosen recipes |
| 6 | **Ingredient Search & Filtering** | Full-text search with filters (category, status, expiry window) |
| 7 | **Analytics Dashboard** | Usage trends, waste metrics, expiry timeline chart |
| 8 | **Expiry Notifications** | In-app alerts for items expiring within a configurable window |

**User Roles:** `REGULAR_USER` · `ADMIN`

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 18 + TypeScript | Component model, type safety, ecosystem maturity |
| Styling | TailwindCSS | Utility-first, rapid consistent design |
| State Management | Zustand | Lightweight, boilerplate-free, scalable |
| Backend | Node.js + Express + TypeScript | Familiar ecosystem, fast iteration, strong typing |
| Database | PostgreSQL 15 | Relational integrity, JSON support, proven reliability |
| ORM | Prisma | Type-safe queries, auto-generated migrations |
| Authentication | JWT (access + refresh tokens) | Stateless, scalable, standard |
| API Docs | OpenAPI 3.0 / Swagger UI | Machine-readable contracts |
| Validation | Zod | Schema-first, runtime + compile-time safety |
| Testing | Vitest + Supertest | Fast unit tests + integration coverage |

Full justification and alternatives considered: see [`docs/architecture.md`](docs/architecture.md) and [`docs/adrs/`](docs/adrs/).

---

## Architecture Overview

PantryPal follows a **Layered Architecture** with strict unidirectional dependency flow:

```
┌─────────────────────────────────────┐
│           Presentation Layer        │  React components, pages, UI state
├─────────────────────────────────────┤
│           Application Layer         │  Express routes, controllers, DTOs
├─────────────────────────────────────┤
│           Business Logic Layer      │  Services, domain rules, validation
├─────────────────────────────────────┤
│           Data Access Layer         │  Prisma repositories, DB queries
├─────────────────────────────────────┤
│           Infrastructure            │  PostgreSQL, JWT, email, logging
└─────────────────────────────────────┘
```

Full architecture documentation: [`docs/architecture.md`](docs/architecture.md)

---

## Prerequisites

- **Node.js** ≥ 20.x
- **npm** ≥ 10.x
- **PostgreSQL** ≥ 15 (running locally or via Docker)
- **Git**

Optional but recommended:
- **Docker** (for PostgreSQL only): `docker run --name pantrypal-db -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=pantrypal -p 5432:5432 -d postgres:15`

---

## Installation & Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/pantrypal.git
cd pantrypal
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Configure environment variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your values (see Environment Variables section)

# Frontend
cp frontend/.env.example frontend/.env
```

### 5. Set up the database

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

This creates all tables and seeds the database with sample ingredient categories and a demo admin user.

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL="postgresql://postgres:secret@localhost:5432/pantrypal"

# JWT
JWT_ACCESS_SECRET="your-access-secret-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=4000
NODE_ENV=development

# Notifications
EXPIRY_WARNING_DAYS=3
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

> ⚠️ Never commit `.env` files. They are gitignored by default.

---

## Running the Application

### Backend (development mode)

```bash
cd backend
npm run dev
# Server starts at http://localhost:4000
# Swagger UI at http://localhost:4000/api-docs
```

### Frontend (development mode)

```bash
cd frontend
npm run dev
# App starts at http://localhost:5173
```

### Run both concurrently (from project root)

```bash
npm run dev
```

---

## API Documentation

Interactive Swagger UI is available at:

```
http://localhost:4000/api-docs
```

Full OpenAPI 3.0 specification: [`docs/openapi/openapi.yaml`](docs/openapi/openapi.yaml)

### Base URL

```
http://localhost:4000/api/v1
```

### Authentication

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

---

## Folder Structure

```
pantrypal/
├── backend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── pantry/
│   │   │   ├── recipes/
│   │   │   ├── shopping-list/
│   │   │   ├── analytics/
│   │   │   └── notifications/
│   │   ├── shared/
│   │   │   ├── middleware/
│   │   │   ├── errors/
│   │   │   ├── utils/
│   │   │   └── types/
│   │   ├── config/
│   │   ├── prisma/
│   │   └── app.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── utils/
│   └── tests/
├── docs/
│   ├── architecture.md
│   ├── error-taxonomy.md
│   ├── threat-model.md
│   ├── ai-prompt-log.md
│   ├── adrs/
│   │   ├── ADR-001-backend-framework.md
│   │   ├── ADR-002-state-management.md
│   │   └── ADR-003-authentication-strategy.md
│   └── openapi/
│       └── openapi.yaml
└── README.md
```

---

## Scripts

### Backend

| Script | Command | Description |
|--------|---------|-------------|
| Start dev | `npm run dev` | Nodemon + ts-node watch mode |
| Build | `npm run build` | Compile TypeScript to `dist/` |
| Start prod | `npm start` | Run compiled build |
| Test | `npm test` | Vitest unit + integration |
| Lint | `npm run lint` | ESLint |
| DB migrate | `npm run db:migrate` | Apply Prisma migrations |
| DB seed | `npm run db:seed` | Seed initial data |
| DB studio | `npm run db:studio` | Open Prisma Studio |

### Frontend

| Script | Command | Description |
|--------|---------|-------------|
| Start dev | `npm run dev` | Vite dev server |
| Build | `npm run build` | Production bundle |
| Preview | `npm run preview` | Preview production build |
| Test | `npm test` | Vitest component tests |
| Lint | `npm run lint` | ESLint |

---

## Testing

### Run all tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

### Test coverage

```bash
cd backend && npm run test:coverage
```

Key test areas:
- **Unit tests**: Service layer business logic (pantry, recipes, shopping list)
- **Integration tests**: API endpoint contracts via Supertest
- **Component tests**: Critical UI components with Vitest + React Testing Library

---

## Future Improvements

| Priority | Improvement |
|----------|------------|
| High | Barcode scanning for ingredient entry |
| High | Email/push notification delivery |
| Medium | Third-party recipe API integration (Spoonacular) |
| Medium | Nutritional information per ingredient |
| Medium | Household/family sharing (multi-user pantries) |
| Low | Mobile app (React Native) |
| Low | AI-powered meal planning suggestions |
| Low | Voice input for quick item entry |

---

## Architecture Decision Records

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](docs/adrs/ADR-001-backend-framework.md) | Backend Framework Selection | Accepted |
| [ADR-002](docs/adrs/ADR-002-state-management.md) | Frontend State Management | Accepted |
| [ADR-003](docs/adrs/ADR-003-authentication-strategy.md) | Authentication Strategy | Accepted |

---

## License

MIT — for academic use.
