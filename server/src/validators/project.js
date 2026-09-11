const { z } = require('zod');

const { isoDateString, optionalDateString } = require('./common');

const projectStatusEnum = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']);

const projectCreateSchema = z
  .object({
    name: z.string().trim().min(1, 'Project name is required').max(120, 'Project name is too long'),
    description: z.string().trim().max(2000, 'Description must be at most 2000 characters').nullable().optional(),
    status: projectStatusEnum.optional(),
    startDate: optionalDateString,
    endDate: optionalDateString,
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'endDate cannot be before startDate',
      });
    }
  });

const projectUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Project name cannot be empty')
      .max(120, 'Project name is too long')
      .optional(),
    description: z.string().trim().max(2000, 'Description must be at most 2000 characters').nullable().optional(),
    status: projectStatusEnum.optional(),
    startDate: isoDateString.nullable().optional(),
    endDate: isoDateString.nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'endDate cannot be before startDate',
      });
    }
  });

const projectQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: projectStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'name', 'status', 'startDate', 'endDate', 'updatedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

module.exports = {
  projectStatusEnum,
  projectCreateSchema,
  projectUpdateSchema,
  projectQuerySchema,
};