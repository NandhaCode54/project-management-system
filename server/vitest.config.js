const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: './tests/globalSetup.js',
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 120_000,
  },
});