const { z } = require('zod');

const idParamSchema = z.object({
  id: z.string().min(1, 'Resource id is required'),
});

const isoDateString = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date format');

const optionalDateString = isoDateString.nullable().optional();

module.exports = { idParamSchema, isoDateString, optionalDateString };