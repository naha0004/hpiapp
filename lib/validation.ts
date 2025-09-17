import { z } from 'zod'

// Common validation patterns
export const patterns = {
  ukRegistration: /^[A-Z]{2}\d{2}\s?[A-Z]{3}$|^[A-Z]\d{3}\s?[A-Z]{3}$|^[A-Z]{3}\s?\d{3}[A-Z]$|^[A-Z]\d{1,3}\s?[A-Z]{1,3}$/i,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  postcode: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
  phone: /^(\+44|0)[0-9]{10,11}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
}

// Base schemas
export const baseSchemas = {
  id: z.string().uuid('Invalid ID format'),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number, and special character'),
  ukRegistration: z.string()
    .regex(patterns.ukRegistration, 'Invalid UK registration format')
    .transform(val => val.toUpperCase().replace(/\s/g, '')),
  postcode: z.string()
    .regex(patterns.postcode, 'Invalid UK postcode format')
    .transform(val => val.toUpperCase()),
  phone: z.string().regex(patterns.phone, 'Invalid UK phone number'),
}

// Auth schemas
export const authSchemas = {
  register: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: baseSchemas.email,
    password: baseSchemas.password,
    confirmPassword: z.string(),
    terms: z.boolean().refine(val => val === true, 'You must accept the terms'),
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
  
  login: z.object({
    email: baseSchemas.email,
    password: z.string().min(1, 'Password is required'),
  }),
  
  resetPassword: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: baseSchemas.password,
    confirmPassword: z.string(),
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
}

// Vehicle schemas
export const vehicleSchemas = {
  search: z.object({
    registration: baseSchemas.ukRegistration,
  }),
  
  add: z.object({
    registration: baseSchemas.ukRegistration,
    make: z.string().min(1).max(50),
    model: z.string().min(1).max(100),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    color: z.string().min(1).max(30).optional(),
    notes: z.string().max(1000).optional(),
  }),
  
  update: z.object({
    id: baseSchemas.id,
    make: z.string().min(1).max(50).optional(),
    model: z.string().min(1).max(100).optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
    color: z.string().min(1).max(30).optional(),
    notes: z.string().max(1000).optional(),
  }),
}

// Appeal schemas
export const appealSchemas = {
  create: z.object({
    vehicleId: baseSchemas.id,
    pcnNumber: z.string().min(5).max(20).regex(/^[A-Z0-9]+$/i, 'Invalid PCN format'),
    issueDate: z.string().datetime('Invalid date format'),
    amount: z.number().positive().max(10000, 'Amount too high'),
    location: z.string().min(10).max(200),
    reason: z.enum(['medical', 'emergency', 'signage', 'meter', 'permit', 'other']),
    description: z.string().min(50).max(2000),
    evidence: z.array(z.string().url()).max(10).optional(),
  }),
  
  update: z.object({
    id: baseSchemas.id,
    status: z.enum(['draft', 'submitted', 'under_review', 'accepted', 'rejected']).optional(),
    notes: z.string().max(1000).optional(),
  }),
}

// Payment schemas
export const paymentSchemas = {
  create: z.object({
    amount: z.number().positive().max(100000, 'Amount too high'),
    currency: z.enum(['gbp', 'eur', 'usd']).default('gbp'),
    description: z.string().min(1).max(200),
    metadata: z.record(z.string()).optional(),
  }),
}

// HPI Check schemas
export const hpiSchemas = {
  request: z.object({
    registration: baseSchemas.ukRegistration,
    checkType: z.enum(['basic', 'full']).default('basic'),
  }),
}

// File upload schemas
export const uploadSchemas = {
  image: z.object({
    file: z.instanceof(File)
      .refine(file => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
      .refine(
        file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
        'Only JPEG, PNG, and WebP images are allowed'
      ),
    category: z.enum(['pcn', 'evidence', 'vehicle', 'document']),
  }),
  
  document: z.object({
    file: z.instanceof(File)
      .refine(file => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
      .refine(
        file => ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type),
        'Only PDF, JPEG, and PNG files are allowed'
      ),
    category: z.enum(['pcn', 'evidence', 'permit', 'insurance', 'v5c', 'other']),
  }),
}

// API response schemas
export const responseSchemas = {
  success: z.object({
    success: z.literal(true),
    data: z.any(),
    message: z.string().optional(),
  }),
  
  error: z.object({
    success: z.literal(false),
    error: z.string(),
    code: z.string().optional(),
    details: z.any().optional(),
  }),
  
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive().max(100),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
}

// Utility function to validate and sanitize input
export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      throw new Error(`Validation error: ${firstError.message}`)
    }
    throw error
  }
}

// Sanitize string input to prevent XSS
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove basic HTML tags
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
    .trim()
}
