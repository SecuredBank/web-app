import { z } from 'zod'

// Common validation schemas
export const emailSchema = z.string().email('Please enter a valid email address')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')

export const urlSchema = z.string().url('Please enter a valid URL')

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')

// Form validation schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
})

export const userSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  role: z.enum(['admin', 'security_officer', 'analyst', 'viewer']),
  isActive: z.boolean(),
})

export const alertSchema = z.object({
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
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  source: z.string().min(2, 'Source must be at least 2 characters'),
})

export const reportSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  type: z.enum([
    'security_summary',
    'user_activity',
    'transaction_analysis',
    'threat_intelligence',
    'compliance_report',
  ]),
  format: z.enum(['pdf', 'csv', 'json']),
  period: z.object({
    start: z.date(),
    end: z.date(),
  }),
})

// Validation helper functions
export const validateEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success
}

export const validatePassword = (password: string): boolean => {
  return passwordSchema.safeParse(password).success
}

export const validatePhone = (phone: string): boolean => {
  return phoneSchema.safeParse(phone).success
}

export const validateUrl = (url: string): boolean => {
  return urlSchema.safeParse(url).success
}

// Custom validation rules
export const createCustomValidator = <T>(
  schema: z.ZodSchema<T>,
  customRules?: Array<(value: T) => string | null>
) => {
  return (value: T): string[] => {
    const errors: string[] = []
    
    // Zod validation
    const result = schema.safeParse(value)
    if (!result.success) {
      errors.push(...result.error.errors.map(err => err.message))
    }
    
    // Custom validation rules
    if (customRules) {
      customRules.forEach(rule => {
        const error = rule(value)
        if (error) {
          errors.push(error)
        }
      })
    }
    
    return errors
  }
}

// File validation
export const validateFileSize = (file: File, maxSize: number): boolean => {
  return file.size <= maxSize
}

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type)
}

// Date validation
export const validateDateRange = (startDate: Date, endDate: Date): boolean => {
  return startDate <= endDate
}

export const validateFutureDate = (date: Date): boolean => {
  return date > new Date()
}

export const validatePastDate = (date: Date): boolean => {
  return date < new Date()
}
