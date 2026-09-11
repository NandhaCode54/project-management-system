const env = require('./config/env');
const logger = require('./config/logger');
const app = require('./app');
const db = require('./config/db');

const server = app.listen(env.port, () => {
  logger.info(`API server listening on http://localhost:${env.port} (${env.nodeEnv})`);
});

async function shutdown(signal) {
  logger.info(`Received ${signal} — shutting down gracefully...`);
  server.close(async () => {
    await db.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = server;