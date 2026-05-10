# ADR-002 — Frontend State Management Strategy

**Status:** Accepted  
**Date:** 2025-03-18  
**Author:** Student  
**Deciders:** Student

---

## Context

The PantryPal frontend is a React SPA that manages several categories of state:

1. **Authentication state** — current user, JWT tokens, login/logout
2. **Server state** — pantry items, recipes, shopping lists (fetched from the API)
3. **UI state** — modals open/closed, active filters, search query, loading indicators
4. **Notification state** — unread alerts, notification list

These different state categories have different characteristics:
- Auth state is global and long-lived
- Server state is fetched asynchronously, may be stale, and needs error handling
- UI state is local and ephemeral
- Notification state is global but frequently updated

The solution must be learnable quickly and not introduce architectural confusion on top of an already complex project.

---

## Decision

**Use Zustand** for global state management (auth, pantry, notifications, shopping list).  
**Use local React state (`useState`)** for purely local UI state (modal open, form input values).

---

## Rationale

### Why Zustand over Redux Toolkit

Redux Toolkit (RTK) is the industry standard for complex React applications. However:

- RTK requires understanding slices, reducers, actions, thunks, selectors, and RTK Query — a substantial API surface
- For this project's scope (one student, limited timeline), the boilerplate-to-value ratio is unfavorable
- RTK Query would be excellent for server state caching and invalidation, but requires learning an additional paradigm
- Zustand achieves the same global state goals with a fraction of the code

### Why Zustand over React Query

React Query (TanStack Query) is specifically optimized for server state: caching, background refetching, stale-while-revalidate. It would be technically superior for managing API data.

However:
- Combining React Query (server state) + Context/Zustand (auth state) + local state creates three state paradigms to manage simultaneously
- A single-tool approach (Zustand for everything) reduces cognitive overhead
- The application does not have demanding cache requirements (no aggressive real-time updates, no complex cache invalidation scenarios)

### Why not Context API alone

React Context works well for simple, low-frequency global state (e.g., theme, language). It is not suitable as a general state management solution because:
- Every context value change re-renders all consumers, even if they only use an unrelated piece of state
- No built-in way to handle async operations cleanly
- Becomes unwieldy at scale (context hell)

---

## State Architecture

```
Global State (Zustand Stores)
├── authStore       — user, tokens, isAuthenticated, login(), logout()
├── pantryStore     — items[], filters, loading, error, fetchItems(), addItem()...
├── shoppingStore   — lists[], activeListId, fetchLists(), addItem()...
└── notifyStore     — notifications[], unreadCount, markAsRead()...

Local State (useState)
├── Modal open/closed state
├── Form field values (before submission)
├── Accordion/tab selections
└── Temporary UI feedback
```

---

## Consequences

### Positive
- Single global state tool — simple mental model
- Zustand stores are plain TypeScript objects — easy to test, easy to read
- Minimal boilerplate: no actions, no reducers, no action creators
- Works seamlessly with TypeScript
- Zustand DevTools via `devtools` middleware

### Negative
- No automatic cache invalidation — if another client modifies data, the local store is stale until manually refreshed
- No built-in optimistic updates — adding an item requires waiting for the API round-trip before showing it
- No request deduplication — if two components call `fetchItems()` simultaneously, two API calls are made

### Mitigations
- Always call `fetchItems()` on component mount after mutations to keep state fresh (acceptable for this scope)
- Document the server state limitation in the technical documentation as a known trade-off
- Future improvement: migrate server state to React Query while keeping Zustand for auth/UI state

---

## Alternatives Considered

### Redux Toolkit + RTK Query
- **Pro:** Industry standard, excellent DevTools, automatic cache management
- **Con:** High boilerplate, steep learning curve for one semester
- **Verdict:** Rejected for this project scope; documented as the recommended next step if scaling

### React Query (TanStack Query) + Context
- **Pro:** Best-in-class server state management
- **Con:** Two separate systems to manage; Context doesn't scale well
- **Verdict:** Rejected — complexity overhead not justified for current scope

### MobX
- **Pro:** Reactive, minimal boilerplate
- **Con:** Less widely known, "magic" reactivity can obscure data flow
- **Verdict:** Rejected — less transparent, less aligned with course learning goals

---

## AI Assistance Note

This ADR was drafted entirely by the student. AI was consulted to validate the Zustand vs Redux comparison (Prompt Log #7). The AI's comparison was largely accurate but did not weight the learning-curve concern appropriately for a university project timeline — the student adjusted the rationale accordingly. See AI Evaluation Log #7 (MODIFIED).
