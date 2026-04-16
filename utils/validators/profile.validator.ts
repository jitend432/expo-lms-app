import { z } from 'zod';

// Profile update schema
export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .transform((val) => val.trim())
    .optional(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(100, 'Email must be less than 100 characters')
    .transform((val) => val.toLowerCase().trim())
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[\d\s-]{10,}$/, 'Please enter a valid phone number')
    .optional()
    .nullable(),
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional()
    .nullable(),
  location: z
    .string()
    .max(100, 'Location must be less than 100 characters')
    .optional()
    .nullable(),
  website: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .nullable(),
  avatar: z
    .string()
    .optional()
    .nullable(),
});

// Preferences schema
export const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.enum(['en', 'es', 'fr', 'de', 'zh']).default('en'),
  fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
  notifications: z.object({
    enabled: z.boolean().default(true),
    courseUpdates: z.boolean().default(true),
    reminders: z.boolean().default(true),
    promotions: z.boolean().default(false),
  }),
  privacy: z.object({
    shareProgress: z.boolean().default(false),
    allowAnalytics: z.boolean().default(true),
    allowCrashReports: z.boolean().default(true),
  }),
  download: z.object({
    wifiOnly: z.boolean().default(true),
    maxConcurrent: z.number().min(1).max(5).default(2),
    quality: z.enum(['low', 'medium', 'high']).default('high'),
  }),
  playback: z.object({
    autoPlay: z.boolean().default(true),
    playbackSpeed: z.number().min(0.5).max(2.0).default(1.0),
    quality: z.enum(['auto', 'low', 'medium', 'high']).default('auto'),
  }),
});

// Course review schema
export const courseReviewSchema = z.object({
  rating: z
    .number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  title: z
    .string()
    .min(1, 'Review title is required')
    .max(100, 'Title must be less than 100 characters'),
  content: z
    .string()
    .min(10, 'Review must be at least 10 characters')
    .max(1000, 'Review must be less than 1000 characters'),
  isAnonymous: z.boolean().default(false),
});

// Search filters schema
export const searchFiltersSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  price: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
  }).optional(),
  rating: z.number().min(0).max(5).optional(),
  sortBy: z.enum(['popular', 'newest', 'rating', 'price-low', 'price-high']).optional(),
});

// Export types
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type PreferencesData = z.infer<typeof preferencesSchema>;
export type CourseReviewData = z.infer<typeof courseReviewSchema>;
export type SearchFiltersData = z.infer<typeof searchFiltersSchema>;

// Helper function to validate phone number
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
};

// Helper function to validate URL
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};