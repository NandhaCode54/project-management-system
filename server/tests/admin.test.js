const { app, request, bearer, register, db, resetDatabase } = require('./helpers');

async function makeUser(fullName, email) {
  const { token, user } = await register(fullName, email, 'Password123');
  return { token, user };
}

async function makeAdmin(email = 'boss@example.com') {
  const { token, user } = await makeUser('Boss', email);
  await db.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } });
  return { token, user };
}

describe('RBAC — roles', () => {
  beforeEach(resetDatabase);

  it('registers every user with the MEMBER role by default', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'Secret123',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('MEMBER');
  });

  it('returns the role from GET /auth/me', async () => {
    const { token } = await makeUser('Jane', 'jane@example.com');
    const res = await request(app).get('/api/auth/me').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('MEMBER');
  });

  it('refuses role escalation through the payload', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Hacker',
      email: 'hack@example.com',
      password: 'Secret123',
      role: 'ADMIN',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('MEMBER');
  });
});

describe('RBAC — admin endpoints', () => {
  beforeEach(resetDatabase);

  it('blocks unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('blocks MEMBERs with 403', async () => {
    const { token } = await makeUser('Jane', 'jane@example.com');

    const users = await request(app).get('/api/admin/users').set(bearer(token));
    expect(users.status).toBe(403);

    const logs = await request(app).get('/api/admin/audit-logs').set(bearer(token));
    expect(logs.status).toBe(403);
  });

  it('lets an ADMIN list all users', async () => {
    await makeUser('Jane', 'jane@example.com');
    await makeUser('John', 'john@example.com');
    const { token } = await makeAdmin();

    const res = await request(app).get('/api/admin/users').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.data.pagination.total).toBe(3);
    expect(res.body.data.items.find((u) => u.email === 'jane@example.com').role).toBe('MEMBER');
    expect(res.body.data.items.find((u) => u.email === 'boss@example.com').role).toBe('ADMIN');
  });

  it('lets an ADMIN change another users role', async () => {
    const { user: jane } = await makeUser('Jane', 'jane@example.com');
    const { token } = await makeAdmin();

    const res = await request(app)
      .patch(`/api/admin/users/${jane.id}/role`)
      .set(bearer(token))
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('ADMIN');

    const listing = await request(app).get('/api/admin/users').set(bearer(token));
    expect(listing.body.data.items.find((u) => u.id === jane.id).role).toBe('ADMIN');
  });

  it('grants admin access to a newly promoted user immediately', async () => {
    const { token: janeToken, user: jane } = await makeUser('Jane', 'jane@example.com');
    const { token: bossToken } = await makeAdmin();

    const denied = await request(app).get('/api/admin/users').set(bearer(janeToken));
    expect(denied.status).toBe(403);

    await request(app).patch(`/api/admin/users/${jane.id}/role`).set(bearer(bossToken)).send({ role: 'ADMIN' });

    const allowed = await request(app).get('/api/admin/users').set(bearer(janeToken));
    expect(allowed.status).toBe(200);
  });

  it('prevents an ADMIN from changing their own role', async () => {
    const { token, user } = await makeAdmin();

    const res = await request(app)
      .patch(`/api/admin/users/${user.id}/role`)
      .set(bearer(token))
      .send({ role: 'MEMBER' });

    expect(res.status).toBe(400);
  });

  it('returns 404 when changing a role of a missing user', async () => {
    const { token } = await makeAdmin();
    const res = await request(app).patch('/api/admin/users/nope/role').set(bearer(token)).send({ role: 'ADMIN' });
    expect(res.status).toBe(404);
  });

  it('rejects an invalid role value with 400', async () => {
    const { user: jane } = await makeUser('Jane', 'jane@example.com');
    const { token } = await makeAdmin();

    const res = await request(app)
      .patch(`/api/admin/users/${jane.id}/role`)
      .set(bearer(token))
      .send({ role: 'GOD' });

    expect(res.status).toBe(400);
  });
});

describe('Audit logs', () => {
  beforeEach(resetDatabase);

  async function expectAudit(token, action, options = {}) {
    const query = new URLSearchParams({ action, limit: '100' });
    if (options.resourceId) query.set('resourceId', options.resourceId);
    const res = await request(app).get(`/api/admin/audit-logs?${query}`).set(bearer(token));
    expect(res.status).toBe(200);
    return res.body.data.items;
  }

  it('authorizes admin-only audit log access', async () => {
    const { token } = await makeUser('Jane', 'jane@example.com');
    const res = await request(app).get('/api/admin/audit-logs').set(bearer(token));
    expect(res.status).toBe(403);
  });

  it('records successful registrations and logins', async () => {
    const { user, token } = await makeUser('Jane', 'jane@example.com');
    await request(app).post('/api/auth/login').send({ email: 'jane@example.com', password: 'Password123' });

    const { token: bossToken } = await makeAdmin('boss@example.com');

    expect((await expectAudit(bossToken, 'AUTH_REGISTER')).length).toBeGreaterThanOrEqual(1);
    expect((await expectAudit(bossToken, 'AUTH_LOGIN')).length).toBe(1);
    expect((await expectAudit(bossToken, 'AUTH_LOGIN')).some((l) => l.userId === user.id)).toBe(true);
  });

  it('records failed login attempts', async () => {
    await makeUser('Jane', 'jane@example.com');
    await request(app).post('/api/auth/login').send({ email: 'jane@example.com', password: 'WrongPass1' });

    const { token: bossToken } = await makeAdmin('boss@example.com');

    const items = await expectAudit(bossToken, 'AUTH_LOGIN_FAILED');
    expect(items).toHaveLength(1);
    expect(items[0].meta.email).toBe('jane@example.com');
  });

  it('records project lifecycle events with the actor and IP', async () => {
    const { token } = await makeUser('Jane', 'jane@example.com');

    const created = await request(app).post('/api/projects').set(bearer(token)).send({ name: 'Website Redesign' });
    const projectId = created.body.data.id;

    await request(app).put(`/api/projects/${projectId}`).set(bearer(token)).send({ status: 'IN_PROGRESS' });
    await request(app).delete(`/api/projects/${projectId}`).set(bearer(token));

    const { token: bossToken } = await makeAdmin('boss@example.com');

    const createLogs = await expectAudit(bossToken, 'PROJECT_CREATE');
    expect(createLogs).toHaveLength(1);
    expect(createLogs[0].resourceId).toBe(projectId);
    expect(createLogs[0].resource).toBe('PROJECT');
    expect(createLogs[0].meta.name).toBe('Website Redesign');
    expect(createLogs[0].ip).toBeTruthy();

    expect((await expectAudit(bossToken, 'PROJECT_UPDATE')).length).toBe(1);
    expect((await expectAudit(bossToken, 'PROJECT_DELETE')).length).toBe(1);
  });

  it('records task creation and completion', async () => {
    const { token } = await makeUser('Jane', 'jane@example.com');
    const project = await request(app)
      .post('/api/projects')
      .set(bearer(token))
      .send({ name: 'Website Redesign' });

    const task = await request(app)
      .post('/api/tasks')
      .set(bearer(token))
      .send({ projectId: project.body.data.id, name: 'Design homepage' });

    await request(app).patch(`/api/tasks/${task.body.data.id}/complete`).set(bearer(token));

    const { token: bossToken } = await makeAdmin('boss@example.com');

    expect((await expectAudit(bossToken, 'TASK_CREATE')).length).toBe(1);
    expect((await expectAudit(bossToken, 'TASK_COMPLETE')).length).toBe(1);
  });

  it('records a role change in the audit trail', async () => {
    const { user: jane } = await makeUser('Jane', 'jane@example.com');
    const { token } = await makeAdmin('boss@example.com');

    await request(app).patch(`/api/admin/users/${jane.id}/role`).set(bearer(token)).send({ role: 'ADMIN' });

    const items = await expectAudit(token, 'USER_ROLE_CHANGED');
    expect(items).toHaveLength(1);
    expect(items[0].resourceId).toBe(jane.id);
    expect(items[0].meta.role).toBe('ADMIN');
  });

  it('paginates and filters audit logs by resource', async () => {
    const { token } = await makeUser('Jane', 'jane@example.com');
    const project = await request(app).post('/api/projects').set(bearer(token)).send({ name: 'A' });
    await request(app).post('/api/tasks').set(bearer(token)).send({ projectId: project.body.data.id, name: 't1' });

    const { token: bossToken } = await makeAdmin('boss@example.com');

    const filtered = await request(app)
      .get('/api/admin/audit-logs?resource=TASK&limit=100')
      .set(bearer(bossToken));
    expect(filtered.body.data.items.every((l) => l.resource === 'TASK')).toBe(true);

    const paged = await request(app).get('/api/admin/audit-logs?page=1&limit=1').set(bearer(bossToken));
    expect(paged.body.data.items).toHaveLength(1);
    expect(paged.body.data.pagination.total).toBeGreaterThan(1);
  });
});