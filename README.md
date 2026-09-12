# Project Management System

A full-stack project & task management application built for a technical assessment — proper architecture, authentication, owner-scoped authorization, validation, security, tests and a polished responsive UI.

- **Frontend:** React 18 + Vite + Tailwind CSS, React Router, Axios, React Hook Form + Zod, Recharts, Lucide
- **Backend:** Node.js + Express, JWT (HttpOnly cookie), bcryptjs, Prisma ORM, PostgreSQL, Zod validation, express-rate-limit, Helmet, CORS, pino logging
- **Tests:** Vitest + Supertest against a real Postgres test database (43 tests)

---

## Features

- Full auth: register / login / logout / me (JWT in HttpOnly cookie; Bearer fallback; uniform 401 on bad credentials — no user enumeration)
- **Owner-scoped data:** a user can never read, update or delete another user's projects or tasks (cross-user access → 404)
- Projects: create / list (search, status filter, sort, pagination) / detail with tasks / update / delete (cascades tasks)
- Tasks: create / list (search, status, priority, project filters, sort, pagination) / detail / update / quick-complete / delete
- Dashboard: totals + task/project status & priority distributions (live refresh after any mutation)
- Layered backend: **Routes → Controllers → Services → Prisma**
- Security: Helmet headers, restricted CORS, rate limiting on auth & API, centralized error mapping (no stack leaks), schema-level validation everywhere
- Responsive UI with sidebar layout, themed forms, toasts, confirm dialogs

## Monorepo Layout

```
project-management-system/
├── client/                     # React + Vite + Tailwind SPA
│   └── src/
│       ├── components/         # UI kit (Button, Input, Modal, Toast, ...) + ProjectForm/TaskForm
│       ├── pages/              # Login, Register, Dashboard, Projects, ProjectDetails, Tasks, NotFound
│       ├── layouts/            # AuthLayout, MainLayout (responsive sidebar + topbar)
│       ├── hooks/              # useAsync, useDebouncedValue
│       ├── services/           # axios instance (cookie + Bearer fallback)
│       ├── context/            # AuthContext
│       ├── utils/              # constants, formatting, data-change events
│       ├── schemas/            # zod schemas + payload formatters
│       ├── routes/             # router + auth guards
│       ├── App.jsx
│       └── main.jsx
├── server/
│   └── src/
│       ├── config/             # env (zod), db singleton, logger (pino)
│       ├── controllers/        # request/response handling
│       ├── middleware/         # auth, validate, errorHandler, notFound, rate limit
│       ├── routes/             # auth, projects, tasks, dashboard
│       ├── services/           # business logic
│       ├── validators/         # zod schemas (body/query/params)
│       └── utils/              # ApiError, asyncHandler, http errors, jwt, serializers
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── tests/                  # Vitest + Supertest suites (43 tests)
├── docs/
│   ├── API.md                  # complete REST API reference
│   └── ER-Diagram.md           # Mermaid ER + field/constraint/index tables
├── docker-compose.yml          # PostgreSQL 16
├── package.json                # npm workspaces + root scripts
└── .gitignore
```

## Quick Start

### 1. Database

**Option A — Docker (recommended):**

```bash
docker compose up -d
```

**Option B — local PostgreSQL:**

Create the app role and databases on your local Postgres (see `server/.env.example` for connection strings):

```sql
CREATE ROLE pms WITH LOGIN PASSWORD 'pms_password' CREATEDB;
CREATE DATABASE pms    OWNER pms;
CREATE DATABASE pms_test OWNER pms;
```

> `CREATEDB` is required for Prisma migrations (shadow database).

### 2. Install

```bash
npm install          # installs server + client (npm workspaces)
```

### 3. Configure environment

```bash
cp server/.env.example server/.env     # then fill in real values (JWT_SECRET, DATABASE_URL, ...)
cp client/.env.example client/.env.local
```

`server/.env` defaults point at `postgresql://pms:pms_password@localhost:5432/pms`. Set a strong `JWT_SECRET` (≥16 chars) before production.

### 4. Migrate & seed

```bash
npm run db:migrate    # applies migrations
npm run db:seed       # creates the demo user
```

### 5. Run

```bash
npm run dev           # API on :5000 + client dev server on :5173 (proxy → /api)
```

Open http://localhost:5173 and log in with the seeded demo account:

```
Email:    demo@example.com
Password: password123
```

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Run API + client dev servers together |
| `npm run test:server` | Backend test suite (Vitest + Supertest, isolated test DB) |
| `npm run build:client` | Production build of the client |
| `npm run lint` | ESLint for both packages |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio |

## Documentation

- **[docs/API.md](docs/API.md)** — full API reference (endpoints, params, response shapes, error codes, cURL examples, auth design notes).
- **[docs/ER-Diagram.md](docs/ER-Diagram.md)** — entity-relationship diagram with columns, constraints, enums and indexes.

## Security Notes

- **Passwords** are hashed with bcrypt (cost 12); `passwordHash` is never returned by any endpoint.
- **JWT** (HS256, `sub` = user id, expiry from `JWT_EXPIRES_IN`) is stored in an **HttpOnly, SameSite=Lax** cookie (`Secure` in production). The frontend keeps no secret in localStorage. `Authorization: Bearer` is also supported for non-browser clients; see docs/API.md for the logout trade-off.
- **Authorization is enforced in the database query** — every project/task lookup includes the owner id in the Prisma `where`. Resources you don't own are indistinguishable from nonexistent ones (404).
- **Validation** happens at the boundary via Zod (body/query/params) before services run.
- **Rate limiting** on auth routes and the API generally (configurable via env).
- **Error handler** maps known failures (Zod → 400, P2002 → 409, missing row → 404) and never leaks internals.

## Running the Tests

Backend tests boot a real Postgres, run `prisma migrate deploy` against it, and truncate between tests. They cover auth, the authorization-isolation guarantee (the critical one), validation, filters/pagination, cascade delete, quick-complete and dashboard stats.

```bash
npm run test:server
```

Expected output:

```
Test Files  5 passed (5)
     Tests  43 passed (43)
```

## License

Private / assessment project.