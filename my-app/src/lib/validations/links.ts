import { z } from 'zod';

export const LINK_CATEGORIES = [
  'Inspiration',
  'Client',
  'Reference',
  'Tool',
  'Tutorial',
  'Other',
] as const;

export const createLinkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  url: z.string().url('Must be a valid URL').max(2000),
  category: z.string().max(60).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
});

export const updateLinkSchema = createLinkSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateLinkInput = z.input<typeof createLinkSchema>;
export type UpdateLinkInput = z.input<typeof updateLinkSchema>;
