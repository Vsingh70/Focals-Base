import { z } from 'zod';

export const inquirySourceEnum = z.enum([
  'website_form',
  'email',
  'instagram',
  'manual',
]);

export const inquiryStatusEnum = z.enum([
  'new',
  'read',
  'replied',
  'converted',
  'archived',
]);

// Used by both the public POST endpoint (which resolves user_id from a token)
// and the manual-entry server action.
export const inquiryPayloadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(60).nullable().optional(),
  shoot_type: z.string().max(100).nullable().optional(),
  preferred_date: z.string().date().nullable().optional(),
  message: z.string().max(5000).nullable().optional(),
});

export const publicInquirySchema = inquiryPayloadSchema.extend({
  source_label: z.string().max(200).optional(),
});

export const manualInquirySchema = inquiryPayloadSchema;

export const updateInquiryStatusSchema = z.object({
  id: z.string().uuid(),
  status: inquiryStatusEnum,
});

export const listInquiriesSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: inquiryStatusEnum.optional(),
  source: inquirySourceEnum.optional(),
});

export const convertInquirySchema = z.object({
  id: z.string().uuid(),
  createProject: z.boolean().default(false),
  projectTitle: z.string().min(1).max(200).optional(),
  /**
   * If set, overrides the inquiry's preferred_date when creating the
   * resulting project. Used by the AI "Suggest a time" affordance — the
   * user picks a slot before clicking Convert and we ship it through.
   */
  shootDateOverride: z.string().nullable().optional(),
});

export type PublicInquiryInput = z.input<typeof publicInquirySchema>;
export type ManualInquiryInput = z.input<typeof manualInquirySchema>;
export type UpdateInquiryStatusInput = z.input<typeof updateInquiryStatusSchema>;
export type ListInquiriesInput = z.input<typeof listInquiriesSchema>;
export type ConvertInquiryInput = z.input<typeof convertInquirySchema>;
