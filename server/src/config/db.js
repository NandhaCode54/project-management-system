const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient({
  log: [
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
  ],
});

db.$on('warn', (event) => {
  // Surface Prisma warnings through pino as debug in non-test runs.
  db.$useWarning || console.warn(`[prisma] ${JSON.stringify(event)}`);
});

db.$on('error', (event) => {
  console.error(`[prisma] ${JSON.stringify(event)}`);
});

module.exports = db;