const { app, request, bearer, register, resetDatabase } = require('./helpers');

async function makeUser(fullName, email) {
  const { token, user } = await register(fullName, email, 'Password123');
  return { token, user };
}

async function makeProject(token, name = 'Project') {
  const res = await request(app).post('/api/projects').set(bearer(token)).send({ name });
  return res.body.data.id;
}

describe('Tasks API', () => {
  beforeEach(resetDatabase);

  it('creates a task in an owned project', async () => {
    const { token } = await makeUser('Alice', 'alice@example.com');
    const projectId = await makeProject(token, 'Website');

    const res = await request(app)
      .post('/api/tasks')
      .set(bearer(token))
      .send({ projectId, name: 'Create homepage', priority: 'HIGH', status: 'PENDING', dueDate: '2026-09-20' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ name: 'Create homepage', priority: 'HIGH', status: 'PENDING', projectId });
    expect(res.body.data.projectId).toBe(projectId);
    expect(res.body.data.project.name).toBe('Website');
  });

  it('allows omitted optional fields with sensible defaults', async () => {
    const { token } = await makeUser('Alice', 'alice@example.com');
    const projectId = await makeProject(token);

    const res = await request(app).post('/api/tasks').set(bearer(token)).send({ projectId, name: 'T' });
    expect(res.status).toBe(201);
    expect(res.body.data.priority).toBe('MEDIUM');
    expect(res.body.data.status).toBe('PENDING');
  });

  it('returns 404 when creating a task in another users project', async () => {
    const { token: aliceToken } = await makeUser('Alice', 'alice@example.com');
    const { token: bobToken } = await makeUser('Bob', 'bob@example.com');
    const projectId = await makeProject(aliceToken, 'Alice Project');

    const res = await request(app).post('/api/tasks').set(bearer(bobToken)).send({ projectId, name: 'Sneaky' });
    expect(res.status).toBe(404);
  });

  it('rejects invalid task payloads', async () => {
    const { token } = await makeUser('Alice', 'alice@example.com');
    const projectId = await makeProject(token);

    const badDate = await request(app)
      .post('/api/tasks')
      .set(bearer(token))
      .send({ projectId, name: 'T', dueDate: 'not-a-date' });
    expect(badDate.status).toBe(400);

    const emptyName = await request(app).post('/api/tasks').set(bearer(token)).send({ projectId, name: '' });
    expect(emptyName.status).toBe(400);
  });

  it('only lists tasks belonging to the caller owned projects', async () => {
    const { token: aliceToken } = await makeUser('Alice', 'alice@example.com');
    const { token: bobToken } = await makeUser('Bob', 'bob@example.com');

    const aliceProject = await makeProject(aliceToken, 'Alice Project');
    await makeProject(bobToken, 'Bob Project');

    await request(app).post('/api/tasks').set(bearer(aliceToken)).send({ projectId: aliceProject, name: 'Alice Task' });

    const aliceList = await request(app).get('/api/tasks').set(bearer(aliceToken));
    const bobList = await request(app).get('/api/tasks').set(bearer(bobToken));

    expect(aliceList.body.data.pagination.total).toBe(1);
    expect(bobList.body.data.pagination.total).toBe(0);
  });

  it('filters tasks by project, status, priority and search', async () => {
    const { token } = await makeUser('Alice', 'alice@example.com');
    const p1 = await makeProject(token, 'One');
    const p2 = await makeProject(token, 'Two');

    await request(app).post('/api/tasks').set(bearer(token)).send({ projectId: p1, name: 'Design hero', priority: 'HIGH', status: 'PENDING' });
    await request(app).post('/api/tasks').set(bearer(token)).send({ projectId: p1, name: 'Design footer', priority: 'LOW', status: 'COMPLETED' });
    await request(app).post('/api/tasks').set(bearer(token)).send({ projectId: p2, name: 'Write docs', priority: 'MEDIUM', status: 'IN_PROGRESS' });

    const byProject = await request(app).get(`/api/tasks?projectId=${p1}`).set(bearer(token));
    expect(byProject.body.data.pagination.total).toBe(2);

    const byStatus = await request(app).get('/api/tasks?status=COMPLETED').set(bearer(token));
    expect(byStatus.body.data.pagination.total).toBe(1);
    expect(byStatus.body.data.items[0].name).toBe('Design footer');

    const byPriority = await request(app).get('/api/tasks?priority=HIGH').set(bearer(token));
    expect(byPriority.body.data.pagination.total).toBe(1);

    const bySearch = await request(app).get('/api/tasks?search=docs').set(bearer(token));
    expect(bySearch.body.data.pagination.total).toBe(1);

    const byAll = await request(app).get(`/api/tasks?projectId=${p1}&status=PENDING&priority=HIGH&search=hero`).set(bearer(token));
    expect(byAll.body.data.pagination.total).toBe(1);
  });

  it('returns 404 when fetching another users task', async () => {
    const { token: aliceToken } = await makeUser('Alice', 'alice@example.com');
    const { token: bobToken } = await makeUser('Bob', 'bob@example.com');
    const projectId = await makeProject(aliceToken);

    const task = await request(app).post('/api/tasks').set(bearer(aliceToken)).send({ projectId, name: 'Alice Task' });
    const taskId = task.body.data.id;

    const res = await request(app).get(`/api/tasks/${taskId}`).set(bearer(bobToken));
    expect(res.status).toBe(404);
  });

  it('updates a task including status to COMPLETED', async () => {
    const { token } = await makeUser('Alice', 'alice@example.com');
    const projectId = await makeProject(token);
    const task = await request(app).post('/api/tasks').set(bearer(token)).send({ projectId, name: 'Task' });
    const taskId = task.body.data.id;

    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set(bearer(token))
      .send({ name: 'Renamed', priority: 'HIGH', status: 'COMPLETED' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Renamed');
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.data.priority).toBe('HIGH');
  });

  it('returns 404 when updating another users task', async () => {
    const { token: aliceToken } = await makeUser('Alice', 'alice@example.com');
    const { token: bobToken } = await makeUser('Bob', 'bob@example.com');
    const projectId = await makeProject(aliceToken);
    const task = await request(app).post('/api/tasks').set(bearer(aliceToken)).send({ projectId, name: 'Alice Task' });
    const taskId = task.body.data.id;

    const res = await request(app).put(`/api/tasks/${taskId}`).set(bearer(bobToken)).send({ name: 'Hacked' });
    expect(res.status).toBe(404);
  });

  it('PATCH /complete marks only the owners task as completed', async () => {
    const { token: aliceToken } = await makeUser('Alice', 'alice@example.com');
    const { token: bobToken } = await makeUser('Bob', 'bob@example.com');
    const projectId = await makeProject(aliceToken);

    const mine = await request(app).post('/api/tasks').set(bearer(aliceToken)).send({ projectId, name: 'Mine' });
    const mineId = mine.body.data.id;

    const theirs = await request(app).post('/api/tasks').set(bearer(bobToken)).send({ projectId: await makeProject(bobToken), name: 'Theirs' });
    const theirsId = theirs.body.data.id;

    const ok = await request(app).patch(`/api/tasks/${mineId}/complete`).set(bearer(aliceToken));
    expect(ok.status).toBe(200);
    expect(ok.body.data.status).toBe('COMPLETED');

    const denied = await request(app).patch(`/api/tasks/${theirsId}/complete`).set(bearer(aliceToken));
    expect(denied.status).toBe(404);
  });

  it('deletes a task owned by the caller', async () => {
    const { token } = await makeUser('Alice', 'alice@example.com');
    const projectId = await makeProject(token);
    const task = await request(app).post('/api/tasks').set(bearer(token)).send({ projectId, name: 'Doomed' });
    const taskId = task.body.data.id;

    const res = await request(app).delete(`/api/tasks/${taskId}`).set(bearer(token));
    expect(res.status).toBe(200);

    const gone = await request(app).get(`/api/tasks/${taskId}`).set(bearer(token));
    expect(gone.status).toBe(404);
  });

  it('returns 404 when deleting another users task', async () => {
    const { token: aliceToken } = await makeUser('Alice', 'alice@example.com');
    const { token: bobToken } = await makeUser('Bob', 'bob@example.com');
    const projectId = await makeProject(aliceToken);
    const task = await request(app).post('/api/tasks').set(bearer(aliceToken)).send({ projectId, name: 'Alice Task' });
    const taskId = task.body.data.id;

    const res = await request(app).delete(`/api/tasks/${taskId}`).set(bearer(bobToken));
    expect(res.status).toBe(404);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });
});