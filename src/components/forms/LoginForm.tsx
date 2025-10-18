import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { LoginForm as LoginFormType } from '@types'
import Input from '@components/ui/Input'
import Button from '@components/ui/Button'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().default(false),
})

interface LoginFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading, error } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@securedbank.com',
      password: 'admin123',
      rememberMe: false,
    },
  })

  const onSubmit = async (data: LoginFormType) => {
    try {
      await login(data)
      onSuccess?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      onError?.(errorMessage)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
        />
        {errors.email && (
          <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
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
              className="text-secondary-400 hover:text-secondary-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          error={!!errors.password}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-danger-600">{errors.password.message}</p>
        )}
      </div>

      {/* Remember Me */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            {...register('rememberMe')}
            type="checkbox"
            id="rememberMe"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
          />
          <label htmlFor="rememberMe" className="ml-2 block text-sm text-secondary-700">
            Remember me
          </label>
        </div>
        <a href="#" className="text-sm text-primary-600 hover:text-primary-500">
          Forgot password?
        </a>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
          <p className="text-sm text-danger-600">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        isLoading={isLoading}
        className="w-full"
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  )
}
