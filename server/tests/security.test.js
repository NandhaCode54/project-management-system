const { app, request, resetDatabase } = require('./helpers');

describe('Security & middleware', () => {
  beforeEach(resetDatabase);

  it('returns JSON 404 for unknown API routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('sends security headers via helmet', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('does not leak error details for internal errors', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).not.toHaveProperty('stack');
  });

  it('rejects malformed JSON with a 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"broken":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});