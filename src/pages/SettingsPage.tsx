import { useState } from 'react'
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Database,
  Key,
  Globe,
  Save,
  Eye,
  EyeOff
} from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { useTheme } from '@contexts/ThemeContext'
import { cn } from '@utils/cn'

interface SettingsSection {
  id: string
  title: string
  icon: any
  description: string
}

const settingsSections: SettingsSection[] = [
  {
    id: 'profile',
    title: 'Profile Settings',
    icon: User,
    description: 'Manage your personal information and preferences',
  },
  {
    id: 'security',
    title: 'Security Settings',
    icon: Shield,
    description: 'Configure security preferences and authentication',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    description: 'Control how you receive alerts and updates',
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: Palette,
    description: 'Customize the look and feel of the application',
  },
  {
    id: 'system',
    title: 'System Settings',
    icon: Database,
    description: 'Configure system-wide settings and preferences',
  },
]

function ProfileSettings() {
  const { user, updateUser } = useAuth()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
  })

  const handleSave = () => {
    if (user) {
      updateUser({ ...user, ...formData })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">Profile Information</h3>
        <p className="text-secondary-600">Update your personal information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label block text-sm font-medium text-secondary-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input w-full"
          />
        </div>

        <div>
          <label className="label block text-sm font-medium text-secondary-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="input w-full"
          />
        </div>

        <div className="md:col-span-2">
          <label className="label block text-sm font-medium text-secondary-700 mb-2">
            Avatar URL
          </label>
          <input
            type="url"
            value={formData.avatar}
            onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
            className="input w-full"
            placeholder="https://example.com/avatar.jpg"
          />
        </div>
      </div>

      <button onClick={handleSave} className="btn btn-primary">
        <Save className="w-4 h-4 mr-2" />
        Save Changes
      </button>
    </div>
  )
}

function SecuritySettings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match')
      return
    }
    // In a real app, this would make an API call
    console.log('Password change requested')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">Security Preferences</h3>
        <p className="text-secondary-600">Manage your account security settings</p>
      </div>

      <div className="space-y-6">
        {/* Password Change */}
        <div className="card p-6">
          <h4 className="text-md font-semibold text-secondary-900 mb-4">Change Password</h4>
          <div className="space-y-4">
            <div>
              <label className="label block text-sm font-medium text-secondary-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="input w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label block text-sm font-medium text-secondary-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="input w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label block text-sm font-medium text-secondary-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="input w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button onClick={handlePasswordChange} className="btn btn-primary">
              <Key className="w-4 h-4 mr-2" />
              Update Password
            </button>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="card p-6">
          <h4 className="text-md font-semibold text-secondary-900 mb-4">Two-Factor Authentication</h4>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-900 font-medium">Enable 2FA</p>
              <p className="text-sm text-secondary-600">Add an extra layer of security to your account</p>
            </div>
            <button className="btn btn-secondary">Configure</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    securityAlerts: true,
    systemUpdates: false,
    weeklyReports: true,
  })

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications({ ...notifications, [key]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">Notification Preferences</h3>
        <p className="text-secondary-600">Choose how you want to receive notifications</p>
      </div>

      <div className="space-y-4">
        {[
          { key: 'emailAlerts', label: 'Email Alerts', description: 'Receive security alerts via email' },
          { key: 'pushNotifications', label: 'Push Notifications', description: 'Get real-time notifications in the app' },
          { key: 'securityAlerts', label: 'Security Alerts', description: 'Critical security notifications' },
          { key: 'systemUpdates', label: 'System Updates', description: 'Notifications about system maintenance' },
          { key: 'weeklyReports', label: 'Weekly Reports', description: 'Summary reports delivered weekly' },
        ].map(({ key, label, description }) => (
          <div key={key} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-900 font-medium">{label}</p>
                <p className="text-sm text-secondary-600">{description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[key as keyof typeof notifications]}
                  onChange={(e) => handleNotificationChange(key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AppearanceSettings() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">Appearance Settings</h3>
        <p className="text-secondary-600">Customize the look and feel of the application</p>
      </div>

      <div className="space-y-6">
        <div className="card p-6">
          <h4 className="text-md font-semibold text-secondary-900 mb-4">Theme</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { value: 'light', label: 'Light', description: 'Clean and bright interface' },
              { value: 'dark', label: 'Dark', description: 'Easy on the eyes in low light' },
              { value: 'system', label: 'System', description: 'Follow system preference' },
            ].map(({ value, label, description }) => (
              <div
                key={value}
                className={cn(
                  'p-4 border-2 rounded-lg cursor-pointer transition-colors',
                  theme === value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-secondary-200 hover:border-secondary-300'
                )}
                onClick={() => setTheme(value as any)}
              >
                <h5 className="font-medium text-secondary-900">{label}</h5>
                <p className="text-sm text-secondary-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SystemSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">System Settings</h3>
        <p className="text-secondary-600">Configure system-wide preferences and settings</p>
      </div>

      <div className="space-y-6">
        <div className="card p-6">
          <h4 className="text-md font-semibold text-secondary-900 mb-4">Data Management</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-900 font-medium">Export Data</p>
                <p className="text-sm text-secondary-600">Download your account data</p>
              </div>
              <button className="btn btn-secondary">Export</button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-900 font-medium">Clear Cache</p>
                <p className="text-sm text-secondary-600">Remove temporary files and data</p>
              </div>
              <button className="btn btn-secondary">Clear</button>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h4 className="text-md font-semibold text-secondary-900 mb-4">API Settings</h4>
          <div className="space-y-4">
            <div>
              <label className="label block text-sm font-medium text-secondary-700 mb-2">
                API Base URL
              </label>
              <input
                type="url"
                defaultValue="https://api.securedbank.com"
                className="input w-full"
              />
            </div>
            <div>
              <label className="label block text-sm font-medium text-secondary-700 mb-2">
                Request Timeout (seconds)
              </label>
              <input
                type="number"
                defaultValue="30"
                className="input w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile')

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSettings />
      case 'security':
        return <SecuritySettings />
      case 'notifications':
        return <NotificationSettings />
      case 'appearance':
        return <AppearanceSettings />
      case 'system':
        return <SystemSettings />
      default:
        return <ProfileSettings />
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Settings</h1>
        <p className="text-secondary-600">Manage your account and application preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Settings</h3>
            <nav className="space-y-2">
              {settingsSections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      'w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors',
                      activeSection === section.id
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                        : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <p className="font-medium">{section.title}</p>
                      <p className="text-xs text-secondary-500">{section.description}</p>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  )
}
