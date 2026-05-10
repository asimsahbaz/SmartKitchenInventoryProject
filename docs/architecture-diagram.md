# Architecture Diagram — PantryPal

## High-Level System Overview

```mermaid
graph TB
    subgraph Browser["Browser (Client) — localhost:5173"]
        UI[React SPA]
        Store[Zustand Stores]
        API_Client[Axios API Client]
    end

    subgraph Backend["Backend — Express + Node.js — localhost:4000"]
        Router[Express Router + Auth Middleware]
        Controller[Controllers — Zod Validation]
        Service[Services — Business Logic]
        Repository[Repositories — Prisma ORM]
    end

    subgraph DB["PostgreSQL 15"]
        Database[(pantrypal database)]
    end

    UI --> Store
    Store --> API_Client
    API_Client -->|HTTP REST + JWT Bearer| Router
    Router --> Controller
    Controller --> Service
    Service --> Repository
    Repository -->|SQL queries| Database
    Database -->|rows| Repository
    Repository --> Service
    Service --> Controller
    Controller -->|JSON response| API_Client
```

## Layered Architecture — Dependency Flow

```mermaid
graph LR
    A[Presentation Layer\nReact + Zustand] -->|HTTP calls| B[Application Layer\nExpress Controllers]
    B --> C[Business Logic Layer\nServices]
    C --> D[Data Access Layer\nPrisma Repositories]
    D --> E[(PostgreSQL)]
```

Each layer only depends on the layer directly below it. The presentation layer never touches the database. The data access layer never knows about HTTP.

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as PostgreSQL

    U->>F: Enter email + password
    F->>B: POST /api/v1/auth/login
    B->>DB: Find user by email
    DB-->>B: User record
    B->>B: bcrypt.compare(password, hash)
    B-->>F: accessToken + refreshToken cookie
    F->>F: Store accessToken in Zustand
    F->>B: GET /api/v1/pantry (Authorization: Bearer token)
    B->>B: Verify JWT signature
    B->>DB: SELECT WHERE userId = ?
    DB-->>B: PantryItems
    B-->>F: JSON response with data
```

## Request-Response Flow — Adding a Pantry Item

```mermaid
flowchart TD
    A[User clicks Add Item] --> B[PantryPage.tsx]
    B --> C[pantryStore.addItem]
    C --> D[axios POST /pantry]
    D --> E[authMiddleware — verify JWT]
    E --> F[PantryController — Zod validate]
    F --> G[PantryService — check business rules]
    G --> H[PantryRepository — prisma.create]
    H --> I[(PostgreSQL INSERT)]
    I --> J[Row returned]
    J --> K[Service adds expiryStatus]
    K --> L[Controller wraps in JSON envelope]
    L --> M[Frontend store updates]
    M --> N[React re-renders with new item]
```
