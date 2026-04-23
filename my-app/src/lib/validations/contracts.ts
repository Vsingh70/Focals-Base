import { z } from 'zod';

export const contractStatusEnum = z.enum(['draft', 'sent', 'signed', 'void']);

// Templates
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  body: z.string().min(1, 'Body is required'),
});

export const updateTemplateSchema = createTemplateSchema.partial().extend({
  id: z.string().uuid(),
});

// Contracts
export const customFieldsSchema = z.record(z.string().max(64), z.string().max(2000));

export const createContractSchema = z.object({
  title: z.string().min(1).max(200),
  template_id: z.string().uuid(),
  project_id: z.string().uuid(),
  client_id: z.string().uuid(),
  custom_fields: customFieldsSchema.default({}),
});

export const updateContractStatusSchema = z.object({
  id: z.string().uuid(),
  status: contractStatusEnum,
});

export const listContractsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
  status: contractStatusEnum.optional(),
});

export type CreateTemplateInput = z.input<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.input<typeof updateTemplateSchema>;
export type CreateContractInput = z.input<typeof createContractSchema>;
export type UpdateContractStatusInput = z.input<typeof updateContractStatusSchema>;
export type ListContractsInput = z.input<typeof listContractsSchema>;
export type CustomFields = z.infer<typeof customFieldsSchema>;
