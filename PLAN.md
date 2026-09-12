# Project Management System â€” Implementation Plan

Full-stack application: React + Vite + Tailwind frontend, Node.js + Express + Prisma + PostgreSQL backend.

Target: a clean, secure, maintainable, testable system suitable for a technical assessment or interview.

---

## 1. Goals & Scope

- Complete **registration / login / logout** with JWT (HttpOnly cookie based where practical).
- Scoped, secure **Projects** and **Tasks** CRUD â€” a user can only ever see/touch their own data.
- **Dashboard** statistics + visualizations (Recharts) computed from the authenticated user's data.
- No superficial CRUD: layered architecture, validation, error handling, security middleware, logging, tests, docs.

## 2. Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 18, Vite, JavaScript (JSX), React Router 6, Axios, Tailwind CSS 3, React Hook Form, Zod, Recharts, Lucide React |
| Backend   | Node.js, Express 4, JWT (jose), bcryptjs, Prisma ORM, PostgreSQL, zod, express-rate-limit, helmet, cors, morgan (pino-http), pino |
| Tooling   | Docker Compose (Postgres), Vitest, Supertest, ESLint, Prettier |

## 3. Architecture

Monorepo:

```
project-management-system/
â”œâ”€â”€ client/                     # React + Vite + Tailwind
â”œâ”€â”€ server/                     # Express + Prisma
â”‚   â””â”€â”€ src/
â”‚       â”œâ”€â”€ config/             # env, db singleton, logger
â”‚       â”œâ”€â”€ controllers/        # request/response handling only
â”‚       â”œâ”€â”€ middleware/         # auth, validate, errorHandler, rate limit, 404
â”‚       â”œâ”€â”€ routes/             # wiring controllers -> middlewares
â”‚       â”œâ”€â”€ services/           # business logic -> Prisma
â”‚       â”œâ”€â”€ validators/         # zod schemas
â”‚       â”œâ”€â”€ utils/              # ApiError, asyncHandler, jwt helpers, prisma toDto
â”‚       â”œâ”€â”€ app.js              # express app (no listen)
â”‚       â””â”€â”€ server.js           # bootstrap + listen
â”œâ”€â”€ docs/                       # API.md, ER-Diagram.md
â”œâ”€â”€ docker-compose.yml
â””â”€â”€ .gitignore
```

Backend layering (strict): **Routes â†’ Controllers â†’ Services â†’ Prisma**. Controllers never call Prisma; services never touch `req`/`res`.

## 4. Data Model

**User** â€” id (cuid), fullName, email (unique), passwordHash, createdAt, updatedAt.
**Project** â€” id, userId (FKâ†’User, cascade), name, description, status enum (NOT_STARTED | IN_PROGRESS | COMPLETED), startDate, endDate, createdAt, updatedAt.
**Task** â€” id, projectId (FKâ†’Project, cascade => deleting a project cascades its tasks), name, description, priority enum (LOW | MEDIUM | HIGH), status enum (PENDING | IN_PROGRESS | COMPLETED), dueDate, createdAt, updatedAt.

Indexes: User.email (unique), Project.userId, Project.status, Project.userId + status (composite), Task.projectId, Task.status, Task.priority.

```
User 1 â”€â”€â”€â”€ * Project 1 â”€â”€â”€â”€ * Task
```

## 5. Security Design

- bcryptjs hashing (cost 12); passwordHash never returned.
- JWT (HS256) with `sub` = user id, typed `AT` claim; expiry from `JWT_EXPIRES_IN` (default 1d).
- Cookie strategy: `token` HttpOnly, `Secure` (prod), `SameSite=Lax`. Logout clears the cookie. The frontend also keeps nothing sensitive in localStorage (only a non-sensitive `pms_user` convenience mirror â€” documented trade-off; token is cookie-only).

  **Note:** if cross-origin browser testing is needed (e.g. Vite dev on `:5173`, API on `:5000`) we set `cors.multipleOrigins` in dev and use a short-lived dev token storage fallback via `Authorization: Bearer` when cookies are unavailable. This is documented in `docs/API.md`.

- Authorization: every project/task query carries owner scoping in the Prisma `where` (`userId: req.user.id`); cross-user access returns **404** (never 403/other-user existence).
- express-rate-limit on `/api/auth` and `/api` (configurable, generous defaults for assessment).
- helmet (security headers), CORS restricted to configured origins, morgan/pino request logging, centralized error handler (single zod error mapping â†’ 400, known errors â†’ mapped codes, Prisma P2002 â†’ 409, fallback â†’ 500, no stack leaks to client).

## 6. API Surface

| Method | Endpoint                   | Auth | Purpose |
|--------|----------------------------|------|---------|
| POST   | /api/auth/register         | No   | Create user, return user + token (cookie) |
| POST   | /api/auth/login            | No   | Validate creds, set cookie + return user |
| POST   | /api/auth/logout           | Yes  | Clear auth cookie |
| GET    | /api/auth/me               | Yes  | Current user |
| GET    | /api/projects              | Yes  | List (search/status/pagination/sort) |
| GET    | /api/projects/:id          | Yes  | Detail + tasks (owner only) |
| POST   | /api/projects              | Yes  | Create |
| PUT    | /api/projects/:id          | Yes  | Update (owner only) |
| DELETE | /api/projects/:id          | Yes  | Delete + cascade tasks |
| GET    | /api/tasks                 | Yes  | List (search/status/priority/project/pagination/sort) |
| GET    | /api/tasks/:id             | Yes  | Detail (owner only) |
| POST   | /api/tasks                 | Yes  | Create (project must be owned) |
| PUT    | /api/tasks/:id             | Yes  | Update (owner only), supports status=COMPLETED |
| PATCH  | /api/tasks/:id/complete    | Yes  | Convenience complete |
| DELETE | /api/tasks/:id             | Yes  | Delete (owner only) |
| GET    | /api/dashboard/stats       | Yes  | Counters + status/priority distributions |

Unified response envelope: `{ success, message, data }`; errors: `{ success: false, error: { message, code } }`.

## 7. Implementation Phases

### Phase 1 â€” Monorepo scaffolding
- Root `package.json` (root scripts dev/build via npm workspaces), `.gitignore`, `docker-compose.yml` (postgres 16 + healthcheck + volume), `.env.example` files for server and client.
- Verify: compose config renders (`docker compose config` optional).

### Phase 2 â€” Database
- `server/prisma/schema.prisma` (User, Project, Task, enums, indexes, cascades), `prisma/seed.js`, first migration.
- Server `.env`: DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, JWT_COOKIE_MAX_AGE, PORT, CLIENT_ORIGINS, NODE_ENV.
- Verify: `prisma migrate dev` against local Postgres, seed runs.

### Phase 3 â€” Backend core
- `config/env.js` (zod-validated env), `config/logger.js` (pino + pino-http), `config/db.js`.
- `utils/ApiError.js`, `utils/asyncHandler.js`, `utils/httpStatus.js`, `utils/jwt.js`, `utils/prisma.js` (serialize/clean helpers).
- `middleware/auth.js` (extract cookie or Bearer, verify, attach `req.user`), `middleware/validate.js`, `middleware/errorHandler.js`, `middleware/notFound.js`, app-level rate limiter.
- `app.js` assembling everything; `server.js` bootstraps.
- Verify: app boots, `GET /api/health` returns ok, unknown routes â†’ 404 json, zod errors â†’ 400.

### Phase 4 â€” Backend Auth
- Services: `authService` (register/login/logout), `userService`.
- Controllers + routes for register, login, logout, me.
- 409 on duplicate email; uniform 401 message on bad credentials (no user enumeration).
- Tests (Vitest + Supertest): register success, duplicate email 409, validation 400, login success/wrong password, logout clears cookie, protected route 401 without token, me returns user without hash. DB via real Postgres test database with truncation between tests.
- Verify: full test suite green.

### Phase 5 â€” Projects / Tasks / Dashboard
- Services: `projectService`, `taskService`, `dashboardService`; all owner-scoped Prisma queries.
- Controllers + routes implementing the full API surface above (pagination helper `utils/pagination.js`).
- Tests: cross-user isolation (404), cascade delete, query filters/pagination/sorting, ownership checks on create/update/delete, PATCH complete, dashboard counts.
- Verify: `npm test` green; manual curl smoke tests.

### Phase 6 â€” Frontend base
- Vite + React (JSX) scaffold, Tailwind config (content paths, small design tokens), `api` base URL via env.
- `services/api.js` axios instance (withCredentials + Bearer fallback), refresh-safe error normalization.
- `context/AuthContext.jsx` (register/login/logout/me, user state, token availability check).
- `routes/` definitions, `layouts/AuthLayout.jsx` + `layouts/MainLayout.jsx` (sidebar + topbar), `components/PrivateRoute.jsx` & `PublicOnlyRoute` guards, small UI kit (Button, Input, Card, Badge, Modal, Spinner, EmptyState, Pagination, Toast).
- Verify: `npm run dev`, login/logout flow works against backend.

### Phase 7 â€” Frontend pages
- `pages/LoginPage`, `pages/RegisterPage` (React Hook Form + zodResolver).
- `pages/DashboardPage` â€” stat cards + Recharts (task status pie, project status pie, task priority bar).
- `pages/ProjectsPage` (list + filters/search/pagination), `pages/ProjectDetailsPage` (detail + tasks), `pages/ProjectForm` (create/edit as modal or page).
- `pages/TasksPage` (list + filters), reuse task form/detail modal; quick "Complete" toggle.
- Refresh triggers: dashboard refetches on route focus + after mutations (data invalidation via a lightweight `useRefreshKey` on mutations).
- Verify: manual E2E against local backend.

### Phase 8 â€” Docs & polish
- `docs/API.md` (auth & endpoints, cURL examples, cookie/Bearer design note, error codes).
- `docs/ER-Diagram.md` (Mermaid ER + field/constraint tables).
- Root `README.md` (setup: docker up, db migrate+seed, run server & client, test, lint; project structure; feature list; security notes).
- Final: lint, typecheck-ish (eslint), full backend test run, dev build of client.

## 8. Testing Strategy

- Backend: Vitest + Supertest against real Postgres (isolated test schema), covering auth, authorization isolation (the critical guarantee), CRUD, validation, pagination, cascade, dashboard.
- Frontend: ESLint + production build check; manual smoke; no heavy test harness (kept achievable).
- Lint: ESLint (flat config) both packages.

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Postgres not installed locally | docker-compose provides Postgres 16 with healthcheck |
| Cookie/same-site issues across dev origins | SameSite=Lax + localhost treated as same-site; Bearer fallback documented |
| Prisma client engine downloads | Ensure `prisma generate` run; engine cached in node_modules |
| Time | Phases are ordered to keep app runnable at each milestone |

## 10. Definition of Done

- All Phase 1â€“8 completed.
- Backend test suite green; client production build green; lint clean.
- Auth + authorization guarantees verified by tests.
- README + API + ER docs complete and accurate.
- Landscape verified with a manual smoke run (register â†’ create project â†’ create task â†’ dashboard counts â†’ logout).
