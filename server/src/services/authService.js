const bcrypt = require('bcryptjs');
const { Prisma } = require('@prisma/client');

const db = require('../config/db');
const { signAccessToken } = require('../utils/jwt');
const { conflict, unauthorized } = require('../utils/httpErrors');

const BCRYPT_ROUNDS = 12;

async function createUser({ fullName, email, password }) {
  const normalizedEmail = email.toLowerCase();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    return await db.user.create({
      data: { fullName, email: normalizedEmail, passwordHash },
      select: { id: true, fullName: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw conflict('An account with this email already exists');
    }
    throw error;
  }
}

async function register({ fullName, email, password }) {
  const user = await createUser({ fullName, email, password });
  const token = signAccessToken(user.id);
  return { token, user };
}

async function login({ email, password }) {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, fullName: true, email: true, role: true, passwordHash: true },
  });

  if (!user) {
    throw unauthorized('Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw unauthorized('Invalid email or password');
  }

  const token = signAccessToken(user.id);
  return {
    token,
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
  };
}

module.exports = { register, createUser, login };