import { createContext, useContext, useState, ReactNode } from 'react'

export type ErrorSeverity = 'error' | 'warning' | 'info'

export interface ErrorDetails {
  id: string
  message: string
  severity: ErrorSeverity
  timestamp: number
  code?: string
  context?: Record<string, unknown>
  stack?: string
}

interface ErrorContextType {
  errors: ErrorDetails[]
  addError: (error: Omit<ErrorDetails, 'id' | 'timestamp'>) => void
  removeError: (id: string) => void
  clearErrors: () => void
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<ErrorDetails[]>([])

  const addError = (error: Omit<ErrorDetails, 'id' | 'timestamp'>) => {
    const newError: ErrorDetails = {
      ...error,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }

    setErrors(prev => {
      // Remove duplicate errors (same message and code within last 5 seconds)
      const recentDuplicates = prev.filter(
        e =>
          e.message === error.message &&
          e.code === error.code &&
          Date.now() - e.timestamp < 5000
      )

      if (recentDuplicates.length > 0) {
        return prev
      }

      // Keep only last 10 errors
      const newErrors = [newError, ...prev]
      if (newErrors.length > 10) {
        newErrors.pop()
      }

      // Log error to monitoring system in production
      if (process.env.NODE_ENV === 'production') {
        logErrorToMonitoring(newError)
      }

      return newErrors
    })

    // Automatically remove error after 5 seconds if it's not critical
    if (error.severity !== 'error') {
      setTimeout(() => {
        removeError(newError.id)
      }, 5000)
    }
  }

  const removeError = (id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id))
  }

  const clearErrors = () => {
    setErrors([])
  }

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors }}>
      {children}
    </ErrorContext.Provider>
  )
}

export function useError() {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}

// Helper function to handle async errors
export async function handleAsyncError<T>(
  promise: Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await promise
  } catch (error) {
    const context = useError()
    context.addError({
      message: errorMessage,
      severity: 'error',
      context: { error },
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw error
  }
}

// Helper function to log errors to monitoring system
function logErrorToMonitoring(error: ErrorDetails) {
  // TODO: Implement error logging to your monitoring system
  console.error('Error logged to monitoring:', error)
}
