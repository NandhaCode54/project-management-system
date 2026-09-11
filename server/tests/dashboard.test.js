const { app, request, bearer, register, resetDatabase } = require('./helpers');

async function makeUser(fullName, email) {
  const { token, user } = await register(fullName, email, 'Password123');
  return { token, user };
}

describe('GET /api/dashboard/stats', () => {
  beforeEach(resetDatabase);

  it('returns aggregated stats scoped to the caller', async () => {
    const { token: aliceToken } = await makeUser('Alice', 'alice@example.com');
    const { token: bobToken } = await makeUser('Bob', 'bob@example.com');

    const aliceProject = await request(app)
      .post('/api/projects')
      .set(bearer(aliceToken))
      .send({ name: 'A1', status: 'IN_PROGRESS' });
    const bobProject = await request(app)
      .post('/api/projects')
      .set(bearer(bobToken))
      .send({ name: 'B1', status: 'COMPLETED' });

    await request(app).post('/api/tasks').set(bearer(aliceToken)).send({ projectId: aliceProject.body.data.id, name: 't1', status: 'COMPLETED' });
    await request(app).post('/api/tasks').set(bearer(aliceToken)).send({ projectId: aliceProject.body.data.id, name: 't2', status: 'IN_PROGRESS' });
    await request(app).post('/api/tasks').set(bearer(aliceToken)).send({ projectId: aliceProject.body.data.id, name: 't3', priority: 'HIGH' });
    await request(app).post('/api/tasks').set(bearer(bobToken)).send({ projectId: bobProject.body.data.id, name: 'bt1', status: 'COMPLETED' });

    const res = await request(app).get('/api/dashboard/stats').set(bearer(aliceToken));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      totalProjects: 1,
      totalTasks: 3,
      completedTasks: 1,
      pendingTasks: 2,
      projectsInProgress: 1,
    });

    expect(res.body.data.distributions.taskStatus).toEqual({
      PENDING: 1,
      IN_PROGRESS: 1,
      COMPLETED: 1,
    });
    expect(res.body.data.distributions.taskPriority.LOW).toBe(0);
    expect(res.body.data.distributions.taskPriority.HIGH).toBe(1);

    const bobStats = await request(app).get('/api/dashboard/stats').set(bearer(bobToken));
    expect(bobStats.body.data.totalTasks).toBe(1);
    expect(bobStats.body.data.totalProjects).toBe(1);
    expect(bobStats.body.data.completedTasks).toBe(1);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.status).toBe(401);
  });
});