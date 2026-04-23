import { z } from 'zod';

export const shootStatusEnum = z.enum([
  'scheduled',
  'completed',
  'cancelled',
  'rescheduled',
]);

export const createShootSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  scheduled_at: z.string().datetime({ offset: true }).or(z.string().datetime()),
  duration_minutes: z.number().int().min(5).max(24 * 60).default(60),
  location: z.string().max(200).nullable().optional(),
  status: shootStatusEnum.default('scheduled'),
  notes: z.string().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
});

export const updateShootSchema = createShootSchema.partial().extend({
  id: z.string().uuid(),
});

export const listShootsSchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  status: shootStatusEnum.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(500).default(200),
});

export type CreateShootInput = z.input<typeof createShootSchema>;
export type UpdateShootInput = z.input<typeof updateShootSchema>;
export type ListShootsInput = z.input<typeof listShootsSchema>;
