const path = require('node:path');
const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });


const envVarsSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1),
  TEST_DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  JWT_COOKIE_MAX_AGE: z.coerce.number().int().positive().default(86_400_000),
  AUTH_COOKIE_NAME: z.string().default('pms_token'),
  CLIENT_ORIGINS: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
});

const parsed = envVarsSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  parsed.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

const isTest = parsed.data.NODE_ENV === 'test';
const isProduction = parsed.data.NODE_ENV === 'production';

const env = Object.freeze({
  nodeEnv: parsed.data.NODE_ENV,
  isTest,
  isProduction,
  port: parsed.data.PORT,
  databaseUrl: isTest && parsed.data.TEST_DATABASE_URL
    ? parsed.data.TEST_DATABASE_URL
    : parsed.data.DATABASE_URL,
  jwt: {
    secret: parsed.data.JWT_SECRET,
    expiresIn: parsed.data.JWT_EXPIRES_IN,
    cookieMaxAge: parsed.data.JWT_COOKIE_MAX_AGE,
    cookieName: parsed.data.AUTH_COOKIE_NAME,
  },
  clientOrigins: parsed.data.CLIENT_ORIGINS.split(',').map((o) => o.trim()),
  rateLimit: {
    windowMs: parsed.data.RATE_LIMIT_WINDOW_MS,
    max: parsed.data.RATE_LIMIT_MAX,
  },
});

module.exports = env;