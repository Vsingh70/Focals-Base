import { z } from 'zod';

export const gearStatusEnum = z.enum(['owned', 'wishlist', 'sold', 'rented']);

export const gearCategoryEnum = z.enum([
  'camera',
  'lens',
  'lighting',
  'audio',
  'bag',
  'misc',
]);

export const createGearSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  category: gearCategoryEnum.nullable().optional(),
  brand: z.string().max(100).nullable().optional(),
  model: z.string().max(100).nullable().optional(),
  serial_number: z.string().max(100).nullable().optional(),
  purchase_price: z.number().nonnegative().nullable().optional(),
  purchase_date: z.string().date().nullable().optional(),
  status: gearStatusEnum.default('owned'),
  notes: z.string().nullable().optional(),
});

export const updateGearSchema = createGearSchema.partial().extend({
  id: z.string().uuid(),
});

export const listGearSchema = z.object({
  status: gearStatusEnum.optional(),
  category: gearCategoryEnum.optional(),
});

export type CreateGearInput = z.input<typeof createGearSchema>;
export type UpdateGearInput = z.input<typeof updateGearSchema>;
export type ListGearInput = z.input<typeof listGearSchema>;
