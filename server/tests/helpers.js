const request = require('supertest');

const app = require('../src/app');
const db = require('../src/config/db');

async function resetDatabase() {
  await db.auditLog.deleteMany();
  await db.task.deleteMany();
  await db.project.deleteMany();
  await db.user.deleteMany();
}

function bearer(token) {
  return { Authorization: `Bearer ${token}` };
}

async function register(fullName, email, password) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ fullName, email, password });
  return res.body.data;
}

async function createUser(fullName, email, password = 'Password123') {
  const { token, user } = await register(fullName, email, password);
  return { token, user };
}

module.exports = { app, db, request, bearer, register, createUser, resetDatabase };