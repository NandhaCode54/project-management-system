# REST API Documentation

Base URL (dev): `http://localhost:5000/api`

All JSON. Dates are ISO date strings (`YYYY-MM-DD`); timestamps are ISO 8601.

---

## 1. Response Envelope

Every endpoint returns a uniform envelope.

Success:

```json
{
  "success": true,
  "message": "Human readable message",
  "data": { }
}
```

Error:

```json
{
  "success": false,
  "message": "Human readable message",
  "error": {
    "code": "UNAUTHORIZED",
    "details": [ { "path": ["email"], "message": "..." } ]
  }
}
```

`details` is only present on request-validation errors (Zod issues).

## 2. Error Codes

| HTTP | Code | Meaning |
|------|------|---------|
| 400 | `BAD_REQUEST` | Invalid request body/query/params (validation) |
| 401 | `UNAUTHORIZED` | Missing/invalid/expired token, or bad credentials |
| 403 | `FORBIDDEN` | Authenticated but not permitted (role-based access control) |
| 404 | `NOT_FOUND` | Route not found, or resource that is not yours (identical message) |
| 409 | `CONFLICT` | Duplicate email / unique violation |
| 429 | `RATE_LIMITED` | Too many requests (`Retry-After` header set) |
| 500 | `INTERNAL` | Unhandled error (no stack leaked to client) |

> **Ownership rule** — any read/update/delete of another user's project or task returns the same `404 NOT_FOUND` as a non-existent id. This never reveals whether another user's resource exists.

## 3. Authentication

JWT (HS256, `sub` = user id, `exp` from `JWT_EXPIRES_IN`). Signed with `JWT_SECRET`.

**Preferred transport: HttpOnly cookie** `pms_token` (`SameSite=Lax`, `Secure` in production; `path=/`). With cookies you do not need to store the token anywhere — Axios `withCredentials` handles it, and `POST /auth/logout` clears it server-side.

**Fallback: `Authorization: Bearer <token>`** header is also accepted. The login/register responses include `data.token` for this mode. With Bearer, logout is client-side token disposal (documented trade-off).

Set one of:

```
Cookie: pms_token=eyJhbGciOi...       # cookie mode
Authorization: Bearer eyJhbGciOi...   # bearer mode
```

---

### POST /api/auth/register

Create a user. Returns the public user plus a JWT, and sets the auth cookie.

Body:

```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "Str0ng!Pass"
}
```

Rules: `fullName` required (non-empty, ≤100); `email` valid format, unique; `password` ≥ 8 chars with letters + numbers.

`201 Created`:

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { "id": "...", "fullName": "Jane Doe", "email": "jane@example.com", "role": "MEMBER", "createdAt": "...", "updatedAt": "..." },
    "token": "eyJhbGciOi..."
  }
}
```

New users always get `role: "MEMBER"` — the API never accepts a role from the client (no privilege escalation).

Conflict → `409 CONFLICT` "Email is already registered".

```bash
curl -s -c cookies.txt -X POST http://localhost:5000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Jane Doe","email":"jane@example.com","password":"Str0ng!Pass"}'
```

### POST /api/auth/login

```json
{ "email": "jane@example.com", "password": "Str0ng!Pass" }
```

`200` → same shape as register, plus auth cookie set.

Invalid credentials → `401 UNAUTHORIZED` with the **same** message for both unknown email and wrong password (no user enumeration). `passwordHash` is never returned.

```bash
curl -s -c cookies.txt -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"jane@example.com","password":"Str0ng!Pass"}'
```

### POST /api/auth/logout

Clear the auth cookie. Requires authentication.

`200` → `{ "success": true, "message": "Logout successful" }`.

### GET /api/auth/me

Current authenticated user.

```json
{ "success": true, "message": "Current user retrieved", "data": { "user": { "id": "...", "fullName": "Jane Doe", "email": "jane@example.com", "role": "MEMBER" } } }
```

---

## 5. Admin (RBAC)

Every endpoint under `/api/admin` requires authentication **and** the `ADMIN` role. Non-admins get `403 FORBIDDEN`.

Roles: `ADMIN` (platform access) and `MEMBER` (default; owns their own projects/tasks). Applies to all admin endpoints below and rejected via `requireRole('ADMIN')` middleware.

### GET /api/admin/users

List all users (admin only). Useful for user administration.

| Param | Type | Notes |
|-------|------|-------|
| `search` | string | case-insensitive match on `fullName` or `email` |
| `page`, `limit` | int | pagination (`limit` max 100) |

```bash
curl -s -b cookies.txt "http://localhost:5000/api/admin/users?search=jane&page=1&limit=10"
```

`200` envelope with `{ items: [{ id, fullName, email, role, createdAt, updatedAt }], pagination: {...} }`.

### PATCH /api/admin/users/:id/role

Change a user's role (admin only).

```json
{ "role": "ADMIN" }
```

`200` → the updated user. `400` if you try to change your own role; `404` if the user does not exist; `400` on an invalid role value.

```bash
curl -s -b cookies.txt -X PATCH http://localhost:5000/api/admin/users/<id>/role \
  -H 'Content-Type: application/json' -d '{"role":"ADMIN"}'
```

### GET /api/admin/audit-logs

Browse the audit trail (admin only). Logs record `AUTH_REGISTER`, `AUTH_LOGIN`, `AUTH_LOGIN_FAILED`, `AUTH_LOGOUT`, `PROJECT_CREATE/UPDATE/DELETE`, `TASK_CREATE/UPDATE/DELETE/COMPLETE`, `USER_ROLE_CHANGED` events with actor, IP, user-agent and metadata.

| Param | Type | Notes |
|-------|------|-------|
| `action` | string | exact action name to filter by |
| `resource` | string | `USER` \| `PROJECT` \| `TASK` |
| `userId` | string | filter to a single actor |
| `page`, `limit` | int | pagination (`limit` max 100) |

```bash
curl -s -b cookies.txt "http://localhost:5000/api/admin/audit-logs?resource=PROJECT&page=1&limit=20"
```

`200` envelope with `{ items: [{ id, userId, action, resource, resourceId, meta, ip, userAgent, createdAt, user }], pagination: {...} }`.

---

## 4. Projects

All endpoints require authentication and are scoped to the authenticated user.

### GET /api/projects

List the current user's projects.

Query params:

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `search` | string | — | case-insensitive `name` contains |
| `status` | enum | — | `NOT_STARTED` \| `IN_PROGRESS` \| `COMPLETED` |
| `page` | int ≥ 1 | `1` | |
| `limit` | int 1–100 | `10` | |
| `sortBy` | enum | `createdAt` | `createdAt` \| `updatedAt` \| `name` \| `status` \| `startDate` \| `endDate` |
| `order` | enum | `desc` | `asc` \| `desc` |

```bash
curl -s -b cookies.txt "http://localhost:5000/api/projects?search=website&status=IN_PROGRESS&page=1&limit=10&sortBy=createdAt&order=desc"
```

`200`:

```json
{
  "success": true,
  "message": "Projects retrieved",
  "data": {
    "items": [
      { "id": "...", "name": "Website Redesign", "description": "...", "status": "IN_PROGRESS", "startDate": "2026-09-15T00:00:00.000Z", "endDate": null, "createdAt": "...", "updatedAt": "..." }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 5, "totalPages": 1 }
  }
}
```

### GET /api/projects/:id

Project detail **including its tasks** (owner only).

`200`:

```json
{
  "success": true,
  "data": {
    "project": { "id": "...", "name": "Website Redesign", "status": "IN_PROGRESS",
      "tasks": [ { "id": "...", "projectId": "...", "name": "Create homepage", "priority": "HIGH", "status": "PENDING", "dueDate": "...", "createdAt": "...", "updatedAt": "..." } ] }
  }
}
```

Not the owner / not found → `404`.

### POST /api/projects

Create a project.

```json
{
  "name": "Website Redesign",
  "description": "Redesign company website",
  "status": "NOT_STARTED",
  "startDate": "2026-09-15",
  "endDate": "2026-10-15"
}
```

`name` required (non-empty, ≤120); `status` optional (default applied by client schema, server treats it optional → `NOT_STARTED`); `startDate`/`endDate` optional; `endDate` must not be before `startDate` (`400`).

`201` → the new project (same shape as a list item).

### PUT /api/projects/:id

Partial update. Any subset of `name`, `description`, `status`, `startDate`, `endDate`. Same validation rules. Owner only; else `404`.

### DELETE /api/projects/:id

Delete the project. **Tasks are cascade-deleted** (`onDelete: Cascade`, enforced in the schema). Owner only; else `404`.

`200` → `{ "success": true, "message": "Project deleted" }` with the deleted project in `data`.

---

## 6. Tasks

All endpoints require authentication. Tasks always belong to a project owned by the current user.

### GET /api/tasks

Query params:

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `search` | string | — | case-insensitive `name` contains |
| `status` | enum | — | `PENDING` \| `IN_PROGRESS` \| `COMPLETED` |
| `priority` | enum | — | `LOW` \| `MEDIUM` \| `HIGH` |
| `projectId` | string | — | restrict to a project |
| `page`, `limit` | int | `1`, `10` | `limit` max 100 |
| `sortBy` | enum | `createdAt` | `createdAt` \| `updatedAt` \| `name` \| `status` \| `priority` \| `dueDate` |
| `order` | enum | `desc` | `asc` \| `desc` |

```bash
curl -s -b cookies.txt "http://localhost:5000/api/tasks?search=design&status=PENDING&priority=HIGH&page=1&limit=10"
```

`200` envelope with `{ items: [...] , pagination: {...} }`. Each item includes a compact `project` object (`id`, `name`, `status`).

### GET /api/tasks/:id

Single task (owner only). `200` → `{ "data": { "task": {...} } }`. Not owner → `404`.

### POST /api/tasks

```json
{
  "projectId": "...",
  "name": "Create homepage",
  "description": "Implement homepage UI",
  "priority": "HIGH",
  "status": "PENDING",
  "dueDate": "2026-09-20"
}
```

`projectId` required and must belong to the authenticated user (else `404`). `priority` default `MEDIUM`, `status` default `PENDING`.

`201` → the new task.

### PUT /api/tasks/:id

Partial update of `name`, `description`, `priority`, `status`, `dueDate`. Setting `status: "COMPLETED"` is supported here. Owner only; else `404`.

### PATCH /api/tasks/:id/complete

Convenience endpoint that sets the task `status` to `COMPLETED`. Owner only; else `404`.

`200` → the updated task.

### DELETE /api/tasks/:id

Owner only; else `404`. `200` → `{ "success": true, "message": "Task deleted" }`.

---

## 7. Dashboard

### GET /api/dashboard/stats

All statistics computed **only** from the authenticated user's data.

```json
{
  "success": true,
  "message": "Dashboard stats retrieved",
  "data": {
    "totalProjects": 5,
    "totalTasks": 24,
    "completedTasks": 12,
    "pendingTasks": 8,
    "projectsInProgress": 3,
    "distributions": {
      "projectStatus":   { "NOT_STARTED": 1, "IN_PROGRESS": 3, "COMPLETED": 1 },
      "taskStatus":      { "PENDING": 8, "IN_PROGRESS": 4, "COMPLETED": 12 },
      "taskPriority":    { "LOW": 6, "MEDIUM": 10, "HIGH": 8 }
    }
  }
}
```

`pendingTasks` = tasks with status `PENDING` or `IN_PROGRESS`.

## 8. Rate Limiting

- `POST /api/auth/*` → stricter limiter (defaults generous, relaxed to 1000/15 min in test mode).
- Other `/api/*` routes → global limiter (`RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX`).

Exceeded → `429 RATE_LIMITED` with `Retry-After`.

## 9. Design Notes

- **Cookie vs Bearer** — the frontend uses the HttpOnly cookie (`withCredentials`). The Bearer fallback exists for pure-HTTP clients / cross-origin scenarios; with it, "logout" means the client discards the token.
- **Ownership scoping in the DB** — every query carries the owner in the Prisma `where` (`{ id, userId }` and `{ project: { userId } }`), so cross-user data can never be resolved.
- **Duplicates** → `409`. **Validation** → `400` with Zod issue details. **Unknown route** → `404`.
- **Headers** — `helmet` security headers; CORS restricted to `CLIENT_ORIGINS`; `pino-http` request logging.
- **Audit trail** — every auth, project, task and role mutation writes an `AuditLog` row (actor, action, resource, IP, user-agent, metadata). Audit writes are fire-and-forget: a logging failure never fails the request it accompanies.
- **Live role checks** — role changes take effect immediately because the auth middleware reads the current role from the DB on every request (the JWT only carries the user id).