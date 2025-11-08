import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { loginSchema } from '@utils/validation'
import type { LoginForm as LoginFormType } from '@utils/validation'
import Input from '@components/ui/Input'
import Button from '@components/ui/Button'
import Alert from '@components/ui/Alert'

interface LoginFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const { login, isLoading, error } = useAuth()

  const MAX_ATTEMPTS = 5
  const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<LoginFormType>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange'
  })

  const onSubmit = async (data: LoginFormType) => {
    try {
      if (failedAttempts >= MAX_ATTEMPTS) {
        const remainingTime = LOCKOUT_DURATION - (Date.now() - Number(localStorage.getItem('lastFailedAttempt')))
        if (remainingTime > 0) {
          const minutes = Math.ceil(remainingTime / 60000)
          setError('root', {
            type: 'manual',
            message: `Too many failed attempts. Please try again in ${minutes} minutes.`
          })
          return
        } else {
          setFailedAttempts(0)
          localStorage.removeItem('lastFailedAttempt')
        }
      }

      clearErrors('root')
      await login(data)
      setFailedAttempts(0)
      localStorage.removeItem('lastFailedAttempt')
      onSuccess?.()
    } catch (err) {
      const newAttempts = failedAttempts + 1
      setFailedAttempts(newAttempts)

      if (newAttempts >= MAX_ATTEMPTS) {
        localStorage.setItem('lastFailedAttempt', Date.now().toString())
      }

      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError('root', {
        type: 'manual',
        message: errorMessage
      })
      onError?.(errorMessage)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error Messages */}
      {(errors.root || error) && (
        <Alert 
          variant="error" 
          title="Error" 
          description={errors.root?.message || error}
          className="mb-4"
        />
      )}

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
          Email Address
        </label>
        <Input
          {...register('email')}
          type="email"
          id="email"
          placeholder="Enter your email"
          leftIcon={<Mail className="w-4 h-4" />}
          error={!!errors.email}
          disabled={isLoading || isSubmitting || failedAttempts >= MAX_ATTEMPTS}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-danger-600">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
          Password
        </label>
        <Input
          {...register('password')}
          type={showPassword ? 'text' : 'password'}
          id="password"
          placeholder="Enter your password"
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-secondary-400 hover:text-secondary-600 disabled:opacity-50"
              disabled={isLoading || isSubmitting || failedAttempts >= MAX_ATTEMPTS}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          error={!!errors.password}
          disabled={isLoading || isSubmitting || failedAttempts >= MAX_ATTEMPTS}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <p id="password-error" className="mt-1 text-sm text-danger-600">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Remember Me and Forgot Password */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            {...register('rememberMe')}
            type="checkbox"
            id="rememberMe"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
            disabled={isLoading || isSubmitting || failedAttempts >= MAX_ATTEMPTS}
          />
          <label htmlFor="rememberMe" className="ml-2 block text-sm text-secondary-700">
            Remember me
          </label>
        </div>
        <div className="text-sm">
          <a 
            href="#" 
            className="font-medium text-primary-600 hover:text-primary-500"
            onClick={(e) => {
              e.preventDefault()
              // TODO: Implement forgot password functionality
            }}
          >
            Forgot password?
          </a>
        </div>
      </div>

      {/* Submit Button */}
      <div>
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={isLoading || isSubmitting}
          disabled={isLoading || isSubmitting || failedAttempts >= MAX_ATTEMPTS}
        >
          {isLoading || isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </div>

      {/* Failed Attempts Message */}
      {failedAttempts > 0 && failedAttempts < MAX_ATTEMPTS && (
        <p className="text-sm text-warning-600 text-center mt-2">
          Failed attempts: {failedAttempts} of {MAX_ATTEMPTS}
        </p>
      )}
    </form>
  )
}
