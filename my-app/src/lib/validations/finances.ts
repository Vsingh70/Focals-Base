import { z } from 'zod';

export const TRANSACTION_TYPES = ['income', 'expense'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const FINANCE_CATEGORIES = [
  'session_fee',
  'print_sale',
  'gear',
  'software',
  'travel',
  'misc',
] as const;

export const PAYMENT_METHODS = ['venmo', 'zelle', 'check', 'cash', 'stripe'] as const;

export const createTransactionSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  amount: z.number().positive('Amount must be greater than 0'),
  date: z.string().date(),
  category: z.string().max(60).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  payment_method: z.string().max(60).nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateTransactionInput = z.input<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.input<typeof updateTransactionSchema>;
