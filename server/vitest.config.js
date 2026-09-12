const path = require('node:path');
const dotenv = require('dotenv');
const { defineConfig } = require('vitest/config');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

module.exports = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: './tests/globalSetup.js',
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 120_000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: testDatabaseUrl,
      TEST_DATABASE_URL: testDatabaseUrl,
    },
  },
});