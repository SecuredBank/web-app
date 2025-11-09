import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, UserRole } from '@/types'
import { Input } from '@components/ui/Input'
import { Button } from '@components/ui/Button'
import { Mail, User as UserIcon } from 'lucide-react'

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'security_officer', 'analyst', 'viewer']),
  isActive: z.boolean().default(true),
})

interface UserFormProps {
  user?: User
  onSubmit: (data: User) => void
  onCancel: () => void
  isLoading?: boolean
}

export default function UserForm({ user, onSubmit, onCancel, isLoading }: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<User>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'viewer',
      isActive: user?.isActive ?? true,
    },
  })

  const handleFormSubmit = (data: User) => {
    onSubmit({
      ...data,
      id: user?.id || '',
      avatar: user?.avatar || '',
      lastLogin: user?.lastLogin,
      permissions: user?.permissions || [],
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-2">
          Full Name
        </label>
        <Input
          {...register('name')}
          type="text"
          id="name"
          placeholder="Enter full name"
          leftIcon={<UserIcon className="w-4 h-4" />}
          error={!!errors.name}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-danger-600">{errors.name.message}</p>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
          Email Address
        </label>
        <Input
          {...register('email')}
          type="email"
          id="email"
          placeholder="Enter email address"
          leftIcon={<Mail className="w-4 h-4" />}
          error={!!errors.email}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
        )}
      </div>

      {/* Role Field */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-secondary-700 mb-2">
          Role
        </label>
        <select
          {...register('role')}
          id="role"
          className="input w-full"
        >
          <option value="viewer">Viewer</option>
          <option value="analyst">Analyst</option>
          <option value="security_officer">Security Officer</option>
          <option value="admin">Admin</option>
        </select>
        {errors.role && (
          <p className="mt-1 text-sm text-danger-600">{errors.role.message}</p>
        )}
      </div>

      {/* Active Status */}
      <div className="flex items-center">
        <input
          {...register('isActive')}
          type="checkbox"
          id="isActive"
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
        />
        <label htmlFor="isActive" className="ml-2 block text-sm text-secondary-700">
          Active user
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {user ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  )
}

