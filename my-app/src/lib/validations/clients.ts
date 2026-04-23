import { z } from 'zod';

export const clientSourceEnum = z.enum([
  'inquiry',
  'referral',
  'instagram',
  'website',
  'manual',
]);

export const createClientSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(60).nullable().optional(),
  notes: z.string().nullable().optional(),
  source: clientSourceEnum.nullable().optional(),
});

export const updateClientSchema = createClientSchema.partial().extend({
  id: z.string().uuid(),
});

export const listClientsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
});

export type CreateClientInput = z.input<typeof createClientSchema>;
export type UpdateClientInput = z.input<typeof updateClientSchema>;
export type ListClientsInput = z.input<typeof listClientsSchema>;
