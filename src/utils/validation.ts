import { z } from 'zod'

// Common validation schemas
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must be less than 255 characters')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
  .max(72, 'Password must be less than 72 characters')

export const phoneSchema = z
  .string()
  .regex(
    /^\+?[1-9]\d{1,14}$/,
    'Invalid phone number format. Please use international format (e.g., +1234567890)'
  )

export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL is too long')

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(
    /^[a-zA-Z\s-']+$/,
    'Name can only contain letters, spaces, hyphens, and apostrophes'
  )

// Form validation schemas
export const loginSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    rememberMe: z.boolean().optional(),
  })
  .strict()

export const userSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    role: z.enum(['admin', 'security_officer', 'analyst', 'viewer']),
    isActive: z.boolean(),
    phone: phoneSchema.optional(),
    lastLogin: z.date().optional(),
    permissions: z.array(z.string()).optional(),
  })
  .strict()

export const alertSchema = z
  .object({
    type: z.enum([
      'login_anomaly',
      'suspicious_transaction',
      'data_breach',
      'malware_detected',
      'unauthorized_access',
      'system_intrusion',
      'phishing_attempt',
      'ddos_attack',
    ]),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    title: z
      .string()
      .min(5, 'Title must be at least 5 characters')
      .max(200, 'Title is too long'),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(2000, 'Description is too long'),
    source: z.string().min(2, 'Source must be at least 2 characters'),
    timestamp: z.date(),
    metadata: z.record(z.string()).optional(),
  })
  .strict()

export const reportSchema = z
  .object({
    title: z
      .string()
      .min(5, 'Title must be at least 5 characters')
      .max(200, 'Title is too long'),
    type: z.enum([
      'security_summary',
      'user_activity',
      'transaction_analysis',
      'threat_intelligence',
      'compliance_report',
    ]),
    format: z.enum(['pdf', 'csv', 'json']),
    period: z
      .object({
        start: z.date(),
        end: z.date(),
      })
      .refine(data => data.start <= data.end, {
        message: 'End date must be after start date',
        path: ['end'],
      }),
    filters: z.record(z.unknown()).optional(),
    scheduledDelivery: z.boolean().optional(),
    recipients: z.array(emailSchema).optional(),
  })
  .strict()

// Organization schema
export const organizationSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Organization name is too short')
      .max(100, 'Organization name is too long'),
    type: z.enum(['bank', 'creditUnion', 'fintech', 'other']),
    size: z.enum(['small', 'medium', 'large', 'enterprise']),
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      country: z.string(),
    }),
    contact: z.object({
      name: z.string(),
      email: emailSchema,
      phone: phoneSchema,
    }),
  })
  .strict()

// Security settings schema
export const securitySettingsSchema = z
  .object({
    enableTwoFactor: z.boolean(),
    allowBiometric: z.boolean(),
    sessionTimeout: z.number().min(5).max(60),
    ipWhitelist: z.array(z.string().ip()).optional(),
    notifyOnNewLogin: z.boolean(),
    passwordExpiryDays: z.number().min(30).max(365).optional(),
    maxLoginAttempts: z.number().min(3).max(10).optional(),
  })
  .strict()

// Type inference helpers
export type LoginForm = z.infer<typeof loginSchema>
export type UserForm = z.infer<typeof userSchema>
export type AlertForm = z.infer<typeof alertSchema>
export type ReportForm = z.infer<typeof reportSchema>
export type Organization = z.infer<typeof organizationSchema>
export type SecuritySettings = z.infer<typeof securitySettingsSchema>

// Validation result type
export type ValidationResult<T> = {
  success: boolean
  data?: T
  errors?: Record<string, string[]>
}

// Enhanced validation helper functions
export const validateForm = async <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<ValidationResult<T>> => {
  try {
    const validData = await schema.parseAsync(data)
    return {
      success: true,
      data: validData,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}
      error.errors.forEach(err => {
        const path = err.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(err.message)
      })
      return {
        success: false,
        errors,
      }
    }
    throw error
  }
}

// Utility validation functions with error messages
export const validateWithMessage = <T>(
  schema: z.ZodSchema<T>,
  value: unknown
): { isValid: boolean; error?: string } => {
  const result = schema.safeParse(value)
  if (!result.success) {
    return {
      isValid: false,
      error: result.error.errors[0]?.message,
    }
  }
  return { isValid: true }
}

// File validation
export const validateFile = (
  file: File,
  options: {
    maxSize?: number
    allowedTypes?: string[]
    maxNameLength?: number
  }
): ValidationResult<File> => {
  const errors: string[] = []

  if (options.maxSize && file.size > options.maxSize) {
    errors.push(
      `File size must be less than ${options.maxSize / 1024 / 1024}MB`
    )
  }

  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    errors.push(`File type must be one of: ${options.allowedTypes.join(', ')}`)
  }

  if (options.maxNameLength && file.name.length > options.maxNameLength) {
    errors.push(
      `File name must be less than ${options.maxNameLength} characters`
    )
  }

  return {
    success: errors.length === 0,
    data: errors.length === 0 ? file : undefined,
    errors: errors.length > 0 ? { file: errors } : undefined,
  }
}

// Date validation with specific business rules
export const validateDateRange = (
  startDate: Date,
  endDate: Date,
  options?: {
    maxRange?: number // in days
    allowFuture?: boolean
    allowPast?: boolean
  }
): ValidationResult<[Date, Date]> => {
  const errors: string[] = []

  if (startDate > endDate) {
    errors.push('Start date must be before end date')
  }

  if (options?.maxRange) {
    const diffDays = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (diffDays > options.maxRange) {
      errors.push(`Date range cannot exceed ${options.maxRange} days`)
    }
  }

  if (options?.allowFuture === false) {
    if (endDate > new Date()) {
      errors.push('Future dates are not allowed')
    }
  }

  if (options?.allowPast === false) {
    if (startDate < new Date()) {
      errors.push('Past dates are not allowed')
    }
  }

  return {
    success: errors.length === 0,
    data: errors.length === 0 ? [startDate, endDate] : undefined,
    errors: errors.length > 0 ? { dateRange: errors } : undefined,
  }
}
