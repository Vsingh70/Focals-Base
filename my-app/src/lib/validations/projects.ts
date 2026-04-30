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
  // Accepts either a YYYY-MM-DD date or a full ISO timestamp. Bare dates
  // are normalized to noon UTC so they render as the intended calendar
  // day in any user timezone — Postgres would otherwise cast a bare date
  // to 00:00:00 UTC, which renders as the previous day for any client
  // west of UTC (e.g. EDT shows 20:00 the day before).
  shoot_date: z
    .union([z.string().date(), z.string().datetime({ offset: true })])
    .transform((value) => {
      // YYYY-MM-DD only — promote to noon UTC.
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return `${value}T12:00:00.000Z`;
      }
      return value;
    })
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
