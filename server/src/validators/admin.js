const { z } = require('zod');

const userRoleEnum = z.enum(['ADMIN', 'MEMBER']);

const updateRoleSchema = z.object({
  role: userRoleEnum,
});

const adminQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const auditLogQuerySchema = z.object({
  action: z.string().trim().max(50).optional(),
  resource: z.string().trim().max(50).optional(),
  userId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

module.exports = { userRoleEnum, updateRoleSchema, adminQuerySchema, auditLogQuerySchema };