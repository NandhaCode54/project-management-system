import { z } from 'zod';

const dateString = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date format')
  .or(z.literal(''))
  .optional();

const toNull = (v) => (v === '' || v === undefined ? null : v);

export const projectCreateSchema = z
  .object({
    name: z.string().trim().min(1, 'Project name is required').max(120, 'Project name is too long'),
    description: z.string().trim().max(2000).optional(),
    status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']).optional(),
    startDate: dateString,
    endDate: dateString,
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date cannot be before start date',
      });
    }
  });

export const projectUpdateSchema = projectCreateSchema;

export const projectQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'name', 'status', 'startDate', 'updatedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export function formatProjectPayload(values) {
  return {
    name: values.name,
    description: toNull(values.description),
    status: values.status || 'NOT_STARTED',
    startDate: toNull(values.startDate),
    endDate: toNull(values.endDate),
  };
}