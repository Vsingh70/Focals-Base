import { z } from 'zod';

export const updateProfileSchema = z.object({
  full_name: z.string().max(200).nullable().optional(),
  business_name: z.string().max(200).nullable().optional(),
  website: z.string().url().max(500).or(z.literal('')).nullable().optional(),
  instagram_handle: z.string().max(60).nullable().optional(),
});

export type UpdateProfileInput = z.input<typeof updateProfileSchema>;
