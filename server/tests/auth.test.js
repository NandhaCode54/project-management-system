const { app, request, bearer, register, resetDatabase } = require('./helpers');

describe('POST /api/auth/register', () => {
  beforeEach(resetDatabase);

  it('registers a user and returns a token, never the passwordHash', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'Secret123',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
    });
    expect(res.body.data.user.id).toBeDefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.token).toBeTruthy();
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('rejects a duplicate email with 409', async () => {
    const payload = { fullName: 'Jane Doe', email: 'jane@example.com', password: 'Secret123' };
    await request(app).post('/api/auth/register').send(payload);

    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects invalid payloads with 400', async () => {
    const cases = [
      { fullName: '', email: 'a@b.com', password: 'Secret123' },
      { fullName: 'Jane', email: 'not-an-email', password: 'Secret123' },
      { fullName: 'Jane', email: 'a@b.com', password: 'short' },
      { fullName: 'Jane', email: 'a@b.com', password: 'abcdefgh' },
      { fullName: 'Jane', email: 'a@b.com', password: '12345678' },
      {},
    ];

    for (const body of cases) {
      const res = await request(app).post('/api/auth/register').send(body);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.error.details)).toBe(true);
    }
  });

  it('stores only a bcrypt hash, not the plaintext password', async () => {
    await register('Jane Doe', 'jane@example.com', 'Secret123');

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({ where: { email: 'jane@example.com' } });
    await prisma.$disconnect();

    expect(user.passwordHash).not.toBe('Secret123');
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(resetDatabase);

  it('logs in with valid credentials', async () => {
    await register('Jane Doe', 'jane@example.com', 'Secret123');

    const res = await request(app).post('/api/auth/login').send({
      email: 'jane@example.com',
      password: 'Secret123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('jane@example.com');
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.token).toBeTruthy();
  });

  it('rejects a wrong password with 401', async () => {
    await register('Jane Doe', 'jane@example.com', 'Secret123');

    const res = await request(app).post('/api/auth/login').send({
      email: 'jane@example.com',
      password: 'WrongPass1',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('does not reveal whether an email exists', async () => {
    await register('Jane Doe', 'jane@example.com', 'Secret123');

    const knownEmail = await request(app).post('/api/auth/login').send({
      email: 'jane@example.com',
      password: 'WrongPass1',
    });
    const unknownEmail = await request(app).post('/api/auth/login').send({
      email: 'ghost@example.com',
      password: 'WrongPass1',
    });

    expect(knownEmail.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(knownEmail.body.message).toBe(unknownEmail.body.message);
  });
});

describe('POST /api/auth/logout & GET /api/auth/me', () => {
  beforeEach(resetDatabase);

  it('returns the current user for a valid token', async () => {
    const { token } = await register('Jane Doe', 'jane@example.com', 'Secret123');

    const res = await request(app).get('/api/auth/me').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('jane@example.com');
  });

  it('rejects /me without a token with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects /me with a tampered token with 401', async () => {
    await register('Jane Doe', 'jane@example.com', 'Secret123');

    const res = await request(app).get('/api/auth/me').set(bearer('not.a.jwt'));
    expect(res.status).toBe(401);
  });

  it('logout returns success for an authenticated user', async () => {
    const { token } = await register('Jane Doe', 'jane@example.com', 'Secret123');

    const res = await request(app).post('/api/auth/logout').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('logout clears the auth cookie', async () => {
    const { token } = await register('Jane Doe', 'jane@example.com', 'Secret123');

    const res = await request(app).post('/api/auth/logout').set(bearer(token));
    expect(res.status).toBe(200);
    const setCookie = res.headers['set-cookie'] || [];
    expect(setCookie.some((c) => c.startsWith('pms_token=;') || c.startsWith('pms_token=;'))).toBe(true);
  });
});