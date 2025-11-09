import { useState } from 'react'
import { User, Mail, Phone, MapPin, Calendar, Shield, Edit, Save, X } from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Avatar from '@components/ui/Avatar'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Card } from '@components/ui/Card'
import { CardContent, CardHeader, CardTitle } from '@components/ui/Card'
import { formatDate } from '@utils/format'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      location: '',
      bio: '',
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (user) {
        updateUser({
          ...user,
          name: data.name,
          email: data.email,
        })
      }
      
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    reset()
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Profile</h1>
          <p className="text-secondary-600">Manage your account information and preferences</p>
        </div>
        <Button
          variant={isEditing ? 'secondary' : 'primary'}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? (
            <>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar
                  src={user?.avatar}
                  name={user?.name}
                  size="xl"
                  status="online"
                  showStatus
                />
              </div>
              <CardTitle className="text-xl">{user?.name}</CardTitle>
              <p className="text-secondary-600 capitalize">
                {user?.role?.replace('_', ' ')}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-secondary-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Joined {formatDate(new Date(), 'MMMM yyyy')}</span>
                </div>
                <div className="flex items-center text-sm text-secondary-600">
                  <Shield className="w-4 h-4 mr-2" />
                  <span>{user?.permissions.length} permissions</span>
                </div>
                <div className="flex items-center text-sm text-secondary-600">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>Last login: {user?.lastLogin ? formatDate(user.lastLogin) : 'Never'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Full Name
                    </label>
                    <Input
                      {...register('name')}
                      disabled={!isEditing}
                      error={!!errors.name}
                      leftIcon={<User className="w-4 h-4" />}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-danger-600">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Email Address
                    </label>
                    <Input
                      {...register('email')}
                      type="email"
                      disabled={!isEditing}
                      error={!!errors.email}
                      leftIcon={<Mail className="w-4 h-4" />}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Phone Number
                    </label>
                    <Input
                      {...register('phone')}
                      type="tel"
                      disabled={!isEditing}
                      error={!!errors.phone}
                      leftIcon={<Phone className="w-4 h-4" />}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-danger-600">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Location
                    </label>
                    <Input
                      {...register('location')}
                      disabled={!isEditing}
                      error={!!errors.location}
                      leftIcon={<MapPin className="w-4 h-4" />}
                    />
                    {errors.location && (
                      <p className="mt-1 text-sm text-danger-600">{errors.location.message}</p>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    {...register('bio')}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50 disabled:text-secondary-500"
                    placeholder="Tell us about yourself..."
                  />
                  {errors.bio && (
                    <p className="mt-1 text-sm text-danger-600">{errors.bio.message}</p>
                  )}
                </div>

                {/* Form Actions */}
                {isEditing && (
                  <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCancel}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      isLoading={isLoading}
                      disabled={isLoading}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

