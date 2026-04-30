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
  // shoot_date is wall-clock — the value the photographer typed, not a
  // moment in absolute time. We accept three shapes from the client:
  //   "YYYY-MM-DD"             → bare date, server defaults to noon
  //   "YYYY-MM-DDTHH:mm"       → datetime-local input value
  //   "YYYY-MM-DDTHH:mm:ss(.fff)?Z|±HH:mm"  → ISO with zone (legacy form)
  // All three are normalized to "YYYY-MM-DDTHH:mm:00.000Z" with the original
  // wall-clock digits preserved. Postgres stores it as a timestamptz at +00,
  // and every renderer formats with timeZone: 'UTC' so the same digits come
  // back out regardless of the viewer's locale.
  shoot_date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:?\d{2})?)?$/,
      'Invalid date format'
    )
    .transform((value) => {
      // Bare date: default to noon so the day shows correctly in every TZ
      // when somebody slips and renders without timeZone: 'UTC'.
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return `${value}T12:00:00.000Z`;
      }
      // Pull off the wall-clock digits (the leading 16 chars: YYYY-MM-DDTHH:mm)
      // and re-anchor at +00 so the stored timestamp's UTC components ARE
      // the wall-clock value. Drops any zone suffix the client sent.
      const naive = value.slice(0, 16);
      return `${naive}:00.000Z`;
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
