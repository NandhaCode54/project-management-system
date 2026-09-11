const { app, request, bearer, register, resetDatabase } = require('./helpers');

async function createUser(fullName, email) {
  const { token, user } = await register(fullName, email, 'Password123');
  return { token, user };
}

describe('Projects API', () => {
  beforeEach(resetDatabase);

  it('creates a project with default status', async () => {
    const { token } = await createUser('Alice', 'alice@example.com');

    const res = await request(app)
      .post('/api/projects')
      .set(bearer(token))
      .send({ name: 'Website Redesign', description: 'Redesign', startDate: '2026-09-15', endDate: '2026-10-15' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Website Redesign');
    expect(res.body.data.status).toBe('NOT_STARTED');
    expect(res.body.data.taskCount).toBe(0);
  });

  it('rejects endDate before startDate', async () => {
    const { token } = await createUser('Alice', 'alice@example.com');

    const res = await request(app)
      .post('/api/projects')
      .set(bearer(token))
      .send({ name: 'Bad', startDate: '2026-10-15', endDate: '2026-09-15' });

    expect(res.status).toBe(400);
  });

  it('rejects empty project name', async () => {
    const { token } = await createUser('Alice', 'alice@example.com');

    const res = await request(app).post('/api/projects').set(bearer(token)).send({ name: '   ' });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid status value', async () => {
    const { token } = await createUser('Alice', 'alice@example.com');

    const res = await request(app).post('/api/projects').set(bearer(token)).send({ name: 'X', status: 'SHIPPED' });
    expect(res.status).toBe(400);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });

  it('only lists projects owned by the caller', async () => {
    const { token: aliceToken } = await createUser('Alice', 'alice@example.com');
    const { token: bobToken } = await createUser('Bob', 'bob@example.com');

    await request(app).post('/api/projects').set(bearer(aliceToken)).send({ name: 'Alice Secret' });
    await request(app).post('/api/projects').set(bearer(bobToken)).send({ name: 'Bob Secret' });

    const aliceList = await request(app).get('/api/projects').set(bearer(aliceToken));
    const bobList = await request(app).get('/api/projects').set(bearer(bobToken));

    expect(aliceList.body.data.items).toHaveLength(1);
    expect(aliceList.body.data.items[0].name).toBe('Alice Secret');
    expect(bobList.body.data.items).toHaveLength(1);
    expect(bobList.body.data.items[0].name).toBe('Bob Secret');
  });

  it('supports search, status filter, pagination and sorting', async () => {
    const { token, user } = await createUser('Alice', 'alice@example.com');

    await request(app).post('/api/projects').set(bearer(token)).send({ name: 'Website Redesign', status: 'IN_PROGRESS' });
    await request(app).post('/api/projects').set(bearer(token)).send({ name: 'Website Analytics', status: 'NOT_STARTED' });
    await request(app).post('/api/projects').set(bearer(token)).send({ name: 'Mobile App', status: 'COMPLETED' });

    const search = await request(app).get('/api/projects?search=website').set(bearer(token));
    expect(search.body.data.pagination.total).toBe(2);

    const status = await request(app).get('/api/projects?status=COMPLETED').set(bearer(token));
    expect(status.body.data.items).toHaveLength(1);
    expect(status.body.data.items[0].name).toBe('Mobile App');

    const paged = await request(app).get('/api/projects?page=1&limit=2').set(bearer(token));
    expect(paged.body.data.items).toHaveLength(2);
    expect(paged.body.data.pagination.totalPages).toBe(2);

    const sortedAsc = await request(app).get('/api/projects?sortBy=name&order=asc').set(bearer(token));
    expect(sortedAsc.body.data.items[0].name).toBe('Mobile App');

    expect(user).toBeDefined();
  });

  it('returns a project with its tasks to the owner', async () => {
    const { token } = await createUser('Alice', 'alice@example.com');

    const created = await request(app)
      .post('/api/projects')
      .set(bearer(token))
      .send({ name: 'Website Redesign' });
    const projectId = created.body.data.id;

    await request(app).post('/api/tasks').set(bearer(token)).send({
      projectId,
      name: 'Design homepage',
      priority: 'HIGH',
    });

    const res = await request(app).get(`/api/projects/${projectId}`).set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Website Redesign');
    expect(res.body.data.tasks).toHaveLength(1);
    expect(res.body.data.tasks[0].name).toBe('Design homepage');
  });

  it('returns 404 when viewing another users project', async () => {
    const { token: aliceToken } = await createUser('Alice', 'alice@example.com');
    const { token: bobToken } = await createUser('Bob', 'bob@example.com');

    const created = await request(app).post('/api/projects').set(bearer(aliceToken)).send({ name: 'Alice Secret' });
    const projectId = created.body.data.id;

    const res = await request(app).get(`/api/projects/${projectId}`).set(bearer(bobToken));
    expect(res.status).toBe(404);
  });

  it('returns 404 when updating or deleting another users project', async () => {
    const { token: aliceToken } = await createUser('Alice', 'alice@example.com');
    const { token: bobToken } = await createUser('Bob', 'bob@example.com');

    const created = await request(app).post('/api/projects').set(bearer(aliceToken)).send({ name: 'Alice Secret' });
    const projectId = created.body.data.id;

    const update = await request(app).put(`/api/projects/${projectId}`).set(bearer(bobToken)).send({ name: 'Hacked' });
    expect(update.status).toBe(404);

    const del = await request(app).delete(`/api/projects/${projectId}`).set(bearer(bobToken));
    expect(del.status).toBe(404);

    const stillThere = await request(app).get(`/api/projects/${projectId}`).set(bearer(aliceToken));
    expect(stillThere.status).toBe(200);
  });

  it('deleting a project cascades its tasks', async () => {
    const { token } = await createUser('Alice', 'alice@example.com');

    const project = await request(app).post('/api/projects').set(bearer(token)).send({ name: 'To Delete' });
    const projectId = project.body.data.id;
    await request(app).post('/api/tasks').set(bearer(token)).send({ projectId, name: 'Task 1' });
    await request(app).post('/api/tasks').set(bearer(token)).send({ projectId, name: 'Task 2' });

    const before = await request(app).get('/api/tasks?search=Task').set(bearer(token));
    expect(before.body.data.pagination.total).toBeGreaterThanOrEqual(2);

    const del = await request(app).delete(`/api/projects/${projectId}`).set(bearer(token));
    expect(del.status).toBe(200);
    expect(del.body.data.taskCount).toBe(2);

    const after = await request(app).get('/api/tasks?search=Task').set(bearer(token));
    expect(after.body.data.pagination.total).toBe(0);
  });

  it('updates a project', async () => {
    const { token } = await createUser('Alice', 'alice@example.com');

    const created = await request(app).post('/api/projects').set(bearer(token)).send({ name: 'Old Name' });
    const projectId = created.body.data.id;

    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set(bearer(token))
      .send({ name: 'New Name', status: 'COMPLETED' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('New Name');
    expect(res.body.data.status).toBe('COMPLETED');
  });
});