# ADR-001 — Backend Framework Selection

**Status:** Accepted  
**Date:** 2025-03-10  
**Author:** Student  
**Deciders:** Student (reviewed with AI assistance — see AI Prompt Log entry #3)

---

## Context

PantryPal requires a backend REST API to handle authentication, pantry management, recipe suggestions, and shopping list generation. The backend must be written in TypeScript and must clearly demonstrate layered architecture and separation of concerns — both key grading criteria.

The primary options under consideration were:

1. **Express.js + TypeScript** — minimal, unopinionated framework
2. **NestJS** — full-featured, Angular-inspired, opinionated TypeScript framework
3. **Fastify** — high-performance, schema-driven framework

The decision affects:
- How much architectural structure the framework enforces vs. what must be built manually
- Development speed and learning curve
- How clearly architectural decisions are visible in the codebase

---

## Decision

**Use Express.js with TypeScript**, structured manually into a feature-based layered architecture (routes → controllers → services → repositories).

---

## Rationale

The course grading criteria specifically rewards *conscious* architectural decisions. Using NestJS would obscure many of these decisions behind framework conventions:

- NestJS enforces dependency injection via decorators — the student demonstrates understanding of the pattern, but the framework does the heavy lifting invisibly
- NestJS provides modules, guards, and interceptors — good patterns, but the student has less surface area to document architectural choices

Express, being unopinionated, **requires the student to actively design** the layering, middleware chain, error handling, and module boundaries. This makes the architectural choices explicit and documentable, which directly serves the project's evaluation goals.

**Fastify** was rejected primarily because its schema-based validation using JSON Schema (rather than TypeScript-first Zod schemas) introduces friction when integrating with a Prisma + TypeScript type system. Its performance advantages are irrelevant at this project's scale.

---

## Consequences

### Positive
- Full control over layer boundaries — architectural decisions are explicit and documentable
- Lower learning curve — Express is widely known and documented
- Easy to demonstrate the layered pattern: route → controller → service → repository is visible in the file structure
- Smaller dependency surface area
- Straightforward Zod integration for validation

### Negative
- No built-in dependency injection — services must be instantiated manually or with a lightweight container
- No framework-enforced guards — authentication middleware must be applied explicitly per router (risk of forgetting it on a route)
- More boilerplate compared to NestJS decorators
- No built-in module system — feature boundaries must be enforced by convention

### Mitigations
- Use a consistent barrel export pattern (`index.ts`) per feature to enforce module boundaries
- Centralize middleware application in `app.ts` with a checklist comment
- Use integration tests to verify that auth middleware is applied correctly on protected routes

---

## Alternatives Considered

### NestJS
- **Pro:** Enforces good patterns (DI, modules, guards), reduces structural mistakes
- **Pro:** First-class TypeScript, excellent documentation
- **Con:** High learning curve for the decorator/module system
- **Con:** Framework hides architectural decisions that should be explicit for a university project
- **Con:** Significantly more boilerplate to set up initially
- **Verdict:** Rejected — the framework would demonstrate its own architecture, not the student's

### Fastify
- **Pro:** Extremely fast (though irrelevant here)
- **Pro:** Built-in schema validation
- **Con:** JSON Schema is less ergonomic than Zod for TypeScript projects
- **Con:** Smaller ecosystem than Express
- **Verdict:** Rejected — no meaningful advantage for this use case

---

## AI Assistance Note

Initial comparison table between Express and NestJS was generated with AI assistance (see Prompt Log #3). The final decision to use Express was made by the student after evaluating the course grading criteria — the AI had initially recommended NestJS, which was overridden because NestJS's opinionated structure would make architectural decisions less visible. See AI Evaluation Log entry #3 (MODIFIED).
