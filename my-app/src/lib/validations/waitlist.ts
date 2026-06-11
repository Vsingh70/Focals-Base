import { z } from 'zod';

export const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  source: z.string().trim().max(64).optional(),
  ts: z.string().datetime().optional(),
  // Honeypot — hidden input a real user never fills; non-empty means bot.
  hp: z.string().max(200).optional(),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
