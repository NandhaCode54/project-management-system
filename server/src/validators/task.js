const { z } = require('zod');

const { optionalDateString } = require('./common');

const taskStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);
const taskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);

const taskCreateSchema = z.object({
  projectId: z.string().min(1, 'projectId is required'),
  name: z.string().trim().min(1, 'Task name is required').max(120, 'Task name is too long'),
  description: z.string().trim().max(2000, 'Description must be at most 2000 characters').nullable().optional(),
  priority: taskPriorityEnum.default('MEDIUM'),
  status: taskStatusEnum.default('PENDING'),
  dueDate: optionalDateString,
});

const taskUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Task name cannot be empty').max(120, 'Task name is too long').optional(),
  description: z.string().trim().max(2000, 'Description must be at most 2000 characters').nullable().optional(),
  priority: taskPriorityEnum.optional(),
  status: taskStatusEnum.optional(),
  dueDate: optionalDateString,
});

const taskQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  projectId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'name', 'status', 'priority', 'dueDate', 'updatedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

module.exports = {
  taskStatusEnum,
  taskPriorityEnum,
  taskCreateSchema,
  taskUpdateSchema,
  taskQuerySchema,
};