# AI Prompt Log — PantryPal

> A record of significant AI interactions during development, with evaluation decisions and reasoning.
> This document satisfies the "Awareness of AI Use" grading criterion (15 points).

---

## Format

Each entry follows this structure:
- **Context:** What was I trying to accomplish?
- **Prompt:** What did I ask?
- **AI Response Summary:** What did the AI output?
- **Decision:** ACCEPTED / MODIFIED / REJECTED
- **Reasoning:** Why was this decision made?
- **AI Limitation noted:** What did the AI get wrong, miss, or oversimplify?

---

## Entry #1 — Project Architecture Overview

**Date:** 2025-03-08  
**Tool:** Claude (claude.ai)  
**Decision:** MODIFIED

**Context:**  
Starting the project. Needed to decide on an overall architectural pattern before writing any code.

**Prompt:**
> "I'm building a web application called PantryPal — smart kitchen inventory. It needs user auth, pantry tracking, recipe suggestions, shopping list generation, and analytics. What architectural pattern should I use and why? Compare at least 2 options."

**AI Response Summary:**  
The AI recommended Layered Architecture as the primary pattern and provided a comparison with Hexagonal Architecture and Microservices. It explained that Layered Architecture is appropriate for a project of this scope due to its simplicity and clear separation of concerns. It generated a 5-layer diagram: Presentation → Application → Business Logic → Data Access → Infrastructure.

**Decision:** MODIFIED

**Reasoning:**  
The AI's recommendation was sound. I accepted Layered Architecture. However, the AI's diagram showed 5 layers including a separate "Infrastructure" layer, which I simplified to 4 layers (collapsing Infrastructure into Data Access) because the distinction added conceptual overhead without practical benefit for this project size. I also added the Feature-Based Modularization pattern (organizing by domain feature, not technical role) which the AI didn't suggest initially.

**AI Limitation:**  
The AI didn't consider the grading criteria when recommending architecture. It recommended NestJS (which enforces patterns automatically) rather than recognizing that for a university project, manually implementing the patterns makes architectural decisions more visible and documentable.

---

## Entry #2 — Database Schema Design

**Date:** 2025-03-12  
**Tool:** Claude  
**Decision:** MODIFIED

**Context:**  
Needed to design the PostgreSQL schema for all domain entities.

**Prompt:**
> "Design a PostgreSQL database schema for PantryPal. Entities needed: User, PantryItem, Category, Recipe, RecipeIngredient, ShoppingList, ShoppingItem, Notification. Include indexes and foreign key constraints."

**AI Response Summary:**  
The AI generated a complete schema with all requested tables. It used UUIDs as primary keys, included appropriate foreign key cascades, and suggested indexes on `userId` for pantry items and `expiryDate` for filtering.

**Decision:** MODIFIED

**Reasoning:**  
The schema was largely correct. I made two modifications:
1. The AI initially used `TEXT` for `quantity` fields. I changed these to `DECIMAL(10,2)` because quantity is a numeric value that may need arithmetic operations (summing shopping list quantities), and storing it as text would require casting.
2. The AI put `instructions` as a TEXT array (PostgreSQL `TEXT[]`) on the Recipe table. I changed it to a single `TEXT` field (storing structured instructions as a formatted string) to avoid unnecessary complexity for a project where step-by-step parsing wasn't required.

**AI Limitation:**  
The AI defaulted to TEXT for numeric values — a common mistake when the AI doesn't think carefully about how the data will be used. Always verify data types against actual use cases.

---

## Entry #3 — Backend Framework Comparison

**Date:** 2025-03-10  
**Tool:** Claude  
**Decision:** MODIFIED (see also ADR-001)

**Context:**  
Needed to choose between Express, NestJS, and Fastify.

**Prompt:**
> "Compare Express.js, NestJS, and Fastify for a TypeScript REST API backend. Consider: learning curve, architectural clarity, boilerplate, ecosystem, and suitability for a university project where architectural decisions must be explicit and documentable."

**AI Response Summary:**  
The AI produced a detailed comparison table and recommended **NestJS** as the best choice, citing its first-class TypeScript support, built-in dependency injection, and enforced architectural patterns.

**Decision:** MODIFIED (rejected the recommendation, accepted the comparison data)

**Reasoning:**  
The AI's recommendation of NestJS was technically defensible but wrong for this specific context. The AI didn't account for the fact that the course grading rewards **explicit, student-made architectural decisions**. NestJS enforces good patterns automatically, which means the framework would make the decisions rather than the student. I used the comparison data the AI generated but overrode the final recommendation, choosing Express instead. This is documented in ADR-001.

**AI Limitation:**  
The AI optimizes for "best technical outcome" without considering the academic/educational context of the project. It cannot understand grading criteria nuances without being explicitly told.

---

## Entry #4 — Prisma Schema Generation

**Date:** 2025-03-20  
**Tool:** Claude  
**Decision:** ACCEPTED (with minor edits)

**Context:**  
Needed to convert the SQL schema design into a Prisma schema file.

**Prompt:**
> "Convert this PostgreSQL schema to a Prisma schema file. [pasted SQL schema]. Use proper Prisma types, add @map and @@map directives for snake_case DB columns, and add relevant indexes."

**AI Response Summary:**  
The AI generated a complete `schema.prisma` file with all models, relations, and indexes. It correctly used `@db.Uuid` for UUID fields, added `@@index` directives for the identified indexes, and used proper `@relation` syntax for all foreign keys.

**Decision:** ACCEPTED

**Reasoning:**  
The output was correct and directly usable. Verified against Prisma documentation that the syntax was current (the AI's training data for Prisma v5 syntax appeared accurate). Minor edit: removed `@map("created_at")` directives as I decided to keep camelCase column names in the DB for simplicity.

**AI Limitation:**  
None identified for this task. Prisma schema generation is a well-defined, mechanical transformation where AI performs well.

---

## Entry #5 — Authentication Architecture

**Date:** 2025-03-25  
**Tool:** Claude  
**Decision:** MODIFIED (see also ADR-003)

**Context:**  
Designing the JWT authentication flow including token storage strategy.

**Prompt:**
> "Design a secure JWT authentication flow for a React + Express app. Should I use localStorage, sessionStorage, or memory for the access token? Where should the refresh token go? Explain the security trade-offs."

**AI Response Summary:**  
The AI correctly recommended storing the access token in memory (JavaScript variable/Zustand store) and the refresh token in an HTTP-only cookie with `SameSite=Strict`. It explained the XSS and CSRF trade-offs clearly and recommended bcrypt with 10 rounds.

**Decision:** MODIFIED

**Reasoning:**  
The memory/cookie token storage recommendation was accepted — this matches OWASP guidance. The bcrypt round recommendation (10) was changed to 12 after independently researching the current computational cost. 10 rounds is from older guidance; 12 rounds is now the recommended baseline for production bcrypt usage with modern hardware.

**AI Limitation:**  
The AI's bcrypt recommendation was slightly outdated. The AI uses training data that may reflect older security guidelines. Security recommendations change over time, and AI responses should always be validated against current authoritative sources (OWASP, NIST).

---

## Entry #6 — OpenAPI Specification

**Date:** 2025-04-02  
**Tool:** Claude  
**Decision:** MODIFIED

**Context:**  
Needed to generate the OpenAPI 3.0 specification for all API endpoints.

**Prompt:**
> "Generate an OpenAPI 3.0 YAML specification for the PantryPal REST API. Endpoints: auth (register, login, refresh, logout), pantry items (CRUD + filtering), recipes (list, detail), shopping lists (CRUD), analytics (summary), notifications (list, mark read). Include request/response schemas, authentication requirements, and error responses."

**AI Response Summary:**  
The AI generated a ~400-line OpenAPI YAML file covering all requested endpoints with request schemas, response schemas, and JWT bearer security scheme.

**Decision:** MODIFIED

**Reasoning:**  
The generated spec was mostly correct but had several issues:
1. The AI used `type: integer` for `quantity` fields throughout — changed to `type: number` (OpenAPI 3.0 uses `number` for decimals)
2. The AI generated inconsistent error response structures — some used `{ error: string }` and others used `{ message: string }`. Standardized all to the project's error envelope format.
3. The AI didn't include the `meta` field (pagination metadata) in list response schemas. Added manually.

**AI Limitation:**  
AI-generated OpenAPI specs often have internal inconsistencies — different endpoints handle errors differently, or response schemas don't match what the code actually returns. Always audit AI-generated specs for consistency against the actual error taxonomy and response format.

---

## Entry #7 — State Management Comparison

**Date:** 2025-03-18  
**Tool:** Claude  
**Decision:** MODIFIED (see also ADR-002)

**Context:**  
Choosing between Redux Toolkit, Zustand, and React Query for frontend state management.

**Prompt:**
> "Compare Redux Toolkit, Zustand, and React Query for state management in a React TypeScript app. The app has authentication state, server data (pantry items, recipes), and UI state. Which is best for a project built by one developer in 2 months?"

**AI Response Summary:**  
The AI produced a comparison and recommended a **combination of React Query (for server state) + Zustand (for auth/UI state)**. It correctly identified that React Query is specialized for server state and Zustand for client state.

**Decision:** MODIFIED

**Reasoning:**  
The AI's recommendation was technically correct but I rejected the dual-tool approach. Managing two state solutions simultaneously introduces cognitive overhead that isn't justified for this project's scope. I chose Zustand for everything, accepting the trade-off of no automatic cache invalidation. This is documented in ADR-002 with the trade-off acknowledged.

**AI Limitation:**  
The AI recommended the "most technically correct" solution without considering that using two state management tools doubles the conceptual surface area for a one-developer project. The AI often recommends best-in-class tools without weighing team/project constraints.

---

## Entry #8 — React Component Structure

**Date:** 2025-04-10  
**Tool:** Claude  
**Decision:** ACCEPTED

**Context:**  
Needed to design the React component hierarchy for the pantry feature.

**Prompt:**
> "Design the React component hierarchy for a pantry management feature. Users can view, add, edit, and delete pantry items. Items have name, quantity, unit, category, expiry date, and notes. Include search and filter functionality. Show which components hold state vs. are presentational."

**AI Response Summary:**  
The AI produced a component tree distinguishing container components (state-aware) from presentational components (props-only). It correctly identified that `PantryPage` should hold filter state and connect to the Zustand store, while `PantryItemCard` should be purely presentational.

**Decision:** ACCEPTED

**Reasoning:**  
The component decomposition was sensible and followed the container/presentational pattern correctly. No significant issues identified.

**AI Limitation:**  
None identified for this task. Component hierarchy design is well within AI capabilities for standard CRUD features.

---

## Entry #9 — Error Handling Middleware

**Date:** 2025-04-05  
**Tool:** Claude  
**Decision:** MODIFIED

**Context:**  
Implementing the global Express error handler.

**Prompt:**
> "Write a TypeScript Express global error handler middleware that: maps custom error classes to HTTP status codes, always returns a consistent JSON envelope, never exposes internal details to clients, and logs full details server-side."

**AI Response Summary:**  
The AI generated a working error handler with a custom error class hierarchy and `instanceof` checks for routing.

**Decision:** MODIFIED

**Reasoning:**  
The AI's error handler was functionally correct but had two issues:
1. It used `console.error()` for logging — replaced with a structured logger (a simple wrapper around `console` with timestamp and request ID injection) for better observability
2. The AI forgot to handle Prisma-specific errors (`PrismaClientKnownRequestError`) — added handling for Prisma error code `P2002` (unique constraint violation → 409) and `P2025` (record not found → 404)

**AI Limitation:**  
The AI often generates generic middleware without considering ORM-specific error codes. When using Prisma, you must explicitly handle Prisma error codes or they fall through to the catch-all 500 handler, making debugging difficult.

---

## Entry #10 — Recipe Matching Algorithm

**Date:** 2025-04-18  
**Tool:** Claude  
**Decision:** MODIFIED

**Context:**  
Implementing the recipe suggestion engine — matching recipes to available pantry ingredients.

**Prompt:**
> "Write a TypeScript function that takes a list of pantry items and a list of recipes (each with required ingredients), and returns recipes sorted by 'match score' (percentage of required ingredients available in the pantry). Also flag which ingredients are missing."

**AI Response Summary:**  
The AI generated a matching function that normalized ingredient names to lowercase and calculated a match percentage. It returned recipes sorted descending by match score with a `missingIngredients` array.

**Decision:** MODIFIED

**Reasoning:**  
The function worked but had a significant flaw: ingredient matching was exact string equality after lowercasing. This meant "Tomatoes" wouldn't match "tomato". I added basic singular/plural normalization and a simple stemming approach (stripping trailing 's'). This isn't perfect but significantly improves match quality. A production system would use an NLP library — documented as future improvement.

**AI Limitation:**  
AI-generated matching algorithms often use naive exact-match strategies that fail on real-world data variations (plurals, abbreviations, brand names). Domain-specific edge cases require human review and testing with real data.

---

## Summary Statistics

| Decision | Count | Percentage |
|----------|-------|-----------|
| ACCEPTED | 2 | 20% |
| MODIFIED | 8 | 80% |
| REJECTED | 0 | 0% |

**Overall assessment:**  
AI was consistently useful for generating initial structure, comparison tables, and boilerplate code. Every output required review and most required modification — either to correct technical mistakes, adapt to the project's specific context, or account for factors the AI didn't consider (grading criteria, project scope, real-world data variations).

The most common AI failure mode was **optimizing for technical correctness without considering project constraints** (learning curve, timeline, explicit architectural visibility for grading). This required deliberate student judgment to override AI recommendations.

---

## AI Tools Used

| Tool | Primary Use |
|------|------------|
| Claude (claude.ai) | Architecture design, code generation, documentation |
| GitHub Copilot | Inline code completion (not logged individually) |
