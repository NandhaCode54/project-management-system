import { z } from 'zod';

const dateString = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date format')
  .or(z.literal(''))
  .optional();

const toNull = (v) => (v === '' || v === undefined ? null : v);

export const taskCreateSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  name: z.string().trim().min(1, 'Task name is required').max(120, 'Task name is too long'),
  description: z.string().trim().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).default('PENDING'),
  dueDate: dateString,
});

export const taskUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Task name cannot be empty').max(120, 'Task name is too long').optional(),
  description: z.string().trim().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  dueDate: dateString,
});

export const taskQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  projectId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'name', 'status', 'priority', 'dueDate', 'updatedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export function formatTaskPayload(values) {
  return {
    ...(values.projectId && { projectId: values.projectId }),
    name: values.name,
    description: toNull(values.description),
    priority: values.priority || 'MEDIUM',
    status: values.status || 'PENDING',
    dueDate: toNull(values.dueDate),
  };
}