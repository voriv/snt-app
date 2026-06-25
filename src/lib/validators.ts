import { z } from 'zod';

// User validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and number',
      ),
    confirmPassword: z.string(),
    surname: z.string().min(2, 'Surname must be at least 2 characters'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    phone: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional().or(z.literal('')),
});

// Plot validation schemas
export const plotSchema = z.object({
  number: z.string().min(1, 'Plot number is required'),
  area: z.number().positive('Area must be positive'),
  address: z.string().optional().or(z.literal('')),
  cadastralNum: z.string().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ABANDONED']).default('ACTIVE'),
});

// Member validation schemas
export const memberSchema = z.object({
  surname: z.string().min(2, 'Surname is required'),
  firstName: z.string().min(2, 'First name is required'),
  patronymic: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  snn: z.string().optional().or(z.literal('')),
});

// Document validation schemas
export const documentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().or(z.literal('')),
  category: z.enum([
    'CHARTER',
    'PROTOCOL',
    'RULE',
    'REPORT',
    'CONTRACT',
    'INVOICE',
    'OTHER',
  ]),
});

// Announcement validation schemas
export const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  isPinned: z.boolean().default(false),
  isPublic: z.boolean().default(false),
});

// Vote validation schemas
export const voteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().or(z.literal('')),
  type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE']).default('SINGLE_CHOICE'),
  isAnonymous: z.boolean().default(false),
  startedAt: z.date().optional(),
  endedAt: z.date().optional(),
  options: z.array(
    z.object({
      text: z.string().min(1, 'Option text is required'),
    }),
  ).min(2, 'At least 2 options required'),
});

// Charge validation schemas
export const chargeSchema = z.object({
  plotId: z.string().min(1, 'Plot is required'),
  type: z.enum([
    'MEMBERSHIP_FEE',
    'TARGET_FEE',
    'ELECTRICITY',
    'WATER',
    'LAND_TAX',
    'OTHER',
  ]),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional().or(z.literal('')),
  period: z.string().min(1, 'Period is required'),
  dueDate: z.date().optional(),
  status: z.enum(['PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED']).default('PENDING'),
});

// Payment validation schemas
export const paymentSchema = z.object({
  memberId: z.string().min(1, 'Member is required'),
  chargeId: z.string().optional().or(z.literal('')),
  amount: z.number().positive('Amount must be positive'),
  method: z.enum(['CASH', 'CARD', 'TRANSFER', 'SBERPAY', 'OTHER']),
  receiptNum: z.string().optional().or(z.literal('')),
  receiptUrl: z.string().url('Invalid receipt URL').optional().or(z.literal('')),
  note: z.string().optional().or(z.literal('')),
});

// Forum validation schemas
export const forumTopicSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  isPinned: z.boolean().default(false),
  isLocked: z.boolean().default(false),
});

export const forumPostSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  parentId: z.string().optional().or(z.literal('')),
});

// Chat validation schemas
export const chatMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
});

// General validation schemas
export const paginateSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const searchSchema = z.object({
  query: z.string().optional(),
  filters: z.record(z.string(), z.any()).optional(),
});
