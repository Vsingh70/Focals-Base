import { z } from 'zod';

export const FIELD_TYPES = ['text', 'date', 'currency', 'contact', 'checkbox'] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

// System fields are always present and cannot be removed.
export const SYSTEM_FIELDS = [
  { id: 'sys_name', label: 'Name', type: 'text', required: true, system: true },
  { id: 'sys_date', label: 'Date', type: 'date', required: true, system: true },
  { id: 'sys_category', label: 'Category', type: 'text', required: true, system: true },
  { id: 'sys_pay', label: 'Pay', type: 'currency', required: false, system: true },
  { id: 'sys_expenses', label: 'Expenses', type: 'currency', required: false, system: true },
] as const;

// Custom fields are user-defined.
export const customFieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(100),
  type: z.enum(FIELD_TYPES),
  required: z.boolean().default(false),
  hover_preview: z.boolean().default(false),
});

export const formFieldsSchema = z.array(customFieldSchema).max(10, 'Maximum 10 custom fields');

export const createFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  fields: formFieldsSchema.default([]),
});

export const updateFormSchema = createFormSchema.partial().extend({
  id: z.string().uuid(),
});

export type CustomField = z.infer<typeof customFieldSchema>;
export type CreateFormInput = z.input<typeof createFormSchema>;
export type UpdateFormInput = z.input<typeof updateFormSchema>;

export const MAX_HOVER_PREVIEWS = 3;
