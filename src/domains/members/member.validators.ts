import { z } from 'zod';

export const createMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  birthDate: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable(),
  note: z.string().optional().nullable(),
});

export const updateMemberSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  birthDate: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable(),
  isActive: z.boolean().optional(),
  note: z.string().optional().nullable(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
