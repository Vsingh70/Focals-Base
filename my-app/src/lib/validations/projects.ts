import { z } from 'zod';

export const projectStatusEnum = z.enum([
  'inquiry',
  'booked',
  'in_progress',
  'editing',
  'delivered',
  'completed',
  'cancelled',
]);

export const paymentStatusEnum = z.enum(['unpaid', 'partial', 'paid']);

export const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  client_id: z.string().uuid().nullable().optional(),
  category: z.string().max(60).nullable().optional(),
  status: projectStatusEnum.default('inquiry'),
  // Accepts either a YYYY-MM-DD date or a full ISO timestamp. Postgres handles
  // the cast on its end (date column truncates time; timestamptz column stores
  // both). Once `projects.shoot_date` is migrated to timestamptz, the form
  // sends datetime-local values verbatim.
  shoot_date: z
    .union([z.string().date(), z.string().datetime({ offset: true })])
    .nullable()
    .optional(),
  location: z.string().max(200).nullable().optional(),
  package_price: z.number().nonnegative().nullable().optional(),
  amount_paid: z.number().nonnegative().optional(),
  payment_status: paymentStatusEnum.optional(),
  notes: z.string().nullable().optional(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.string().uuid(),
});

export const listProjectsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: projectStatusEnum.optional(),
  client_id: z.string().uuid().optional(),
});

export type CreateProjectInput = z.input<typeof createProjectSchema>;
export type UpdateProjectInput = z.input<typeof updateProjectSchema>;
export type ListProjectsInput = z.input<typeof listProjectsSchema>;
