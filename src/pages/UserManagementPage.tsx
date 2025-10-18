import { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Shield, 
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  UserCheck,
  UserX
} from 'lucide-react'
import { User, UserRole } from '@types'
import { cn } from '@utils/cn'

// Mock user data
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@securedbank.com',
    name: 'Security Admin',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
    lastLogin: new Date(Date.now() - 1000 * 60 * 30),
    isActive: true,
    permissions: [
      { id: '1', name: 'View Dashboard', resource: 'dashboard', action: 'read' },
      { id: '2', name: 'Manage Users', resource: 'users', action: 'write' },
    ],
  },
  {
    id: '2',
    email: 'john.doe@securedbank.com',
    name: 'John Doe',
    role: 'security_officer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isActive: true,
    permissions: [
      { id: '1', name: 'View Dashboard', resource: 'dashboard', action: 'read' },
      { id: '3', name: 'View Security Alerts', resource: 'security', action: 'read' },
    ],
  },
  {
    id: '3',
    email: 'jane.smith@securedbank.com',
    name: 'Jane Smith',
    role: 'analyst',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 4),
    isActive: true,
    permissions: [
      { id: '1', name: 'View Dashboard', resource: 'dashboard', action: 'read' },
    ],
  },
  {
    id: '4',
    email: 'mike.johnson@securedbank.com',
    name: 'Mike Johnson',
    role: 'viewer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face',
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24),
    isActive: false,
    permissions: [
      { id: '1', name: 'View Dashboard', resource: 'dashboard', action: 'read' },
    ],
  },
]

const roleColors = {
  admin: 'bg-danger-100 text-danger-800',
  security_officer: 'bg-warning-100 text-warning-800',
  analyst: 'bg-primary-100 text-primary-800',
  viewer: 'bg-secondary-100 text-secondary-800',
}

function UserCard({ user, onEdit, onDelete, onToggleStatus }: {
  user: User
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onToggleStatus: (user: User) => void
}) {
  return (
    <div className="card p-6 hover:shadow-elevated transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className={cn(
              'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white',
              user.isActive ? 'bg-success-500' : 'bg-secondary-400'
            )} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-secondary-900">{user.name}</h3>
              <span className={cn(
                'px-2 py-1 text-xs font-medium rounded-full',
                roleColors[user.role]
              )}>
                {user.role.replace('_', ' ')}
              </span>
            </div>
            
            <div className="space-y-1 text-sm text-secondary-600">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Last login: {user.lastLogin?.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>{user.permissions.length} permissions</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onToggleStatus(user)}
            className={cn(
              'btn btn-sm',
              user.isActive ? 'btn-secondary' : 'btn-success'
            )}
          >
            {user.isActive ? (
              <>
                <UserX className="w-4 h-4 mr-1" />
                Deactivate
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 mr-1" />
                Activate
              </>
            )}
          </button>
          
          <div className="relative">
            <button className="btn btn-secondary btn-sm">
              <MoreVertical className="w-4 h-4" />
            </button>
            {/* Dropdown menu would go here */}
          </div>
        </div>
      </div>
    </div>
  )
}

function UserFilters({ 
  filters, 
  onFiltersChange 
}: { 
  filters: { role: UserRole | 'all'; status: 'all' | 'active' | 'inactive' }
  onFiltersChange: (filters: any) => void 
}) {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-secondary-900 mb-4">Filters</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Role Filter */}
        <div>
          <label className="label block text-sm font-medium text-secondary-700 mb-2">
            Role
          </label>
          <select
            value={filters.role}
            onChange={(e) => onFiltersChange({ ...filters, role: e.target.value as any })}
            className="input w-full"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="security_officer">Security Officer</option>
            <option value="analyst">Analyst</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="label block text-sm font-medium text-secondary-700 mb-2">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as any })}
            className="input w-full"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [filteredUsers, setFilteredUsers] = useState<User[]>(mockUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    role: 'all' as UserRole | 'all',
    status: 'all' as 'all' | 'active' | 'inactive',
  })

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply role filter
    if (filters.role !== 'all') {
      filtered = filtered.filter(user => user.role === filters.role)
    }

    // Apply status filter
    if (filters.status !== 'all') {
      const isActive = filters.status === 'active'
      filtered = filtered.filter(user => user.isActive === isActive)
    }

    setFilteredUsers(filtered)
  }, [users, searchQuery, filters])

  const handleEditUser = (user: User) => {
    console.log('Edit user:', user)
    // In a real app, this would open an edit modal
  }

  const handleDeleteUser = (user: User) => {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      setUsers(prev => prev.filter(u => u.id !== user.id))
    }
  }

  const handleToggleStatus = (user: User) => {
    setUsers(prev => prev.map(u => 
      u.id === user.id ? { ...u, isActive: !u.isActive } : u
    ))
  }

  const userStats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    admins: users.filter(u => u.role === 'admin').length,
    securityOfficers: users.filter(u => u.role === 'security_officer').length,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">User Management</h1>
          <p className="text-secondary-600">Manage user accounts and permissions</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-secondary-900">{userStats.total}</div>
          <div className="text-sm text-secondary-600">Total Users</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-success-600">{userStats.active}</div>
          <div className="text-sm text-secondary-600">Active</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-secondary-600">{userStats.inactive}</div>
          <div className="text-sm text-secondary-600">Inactive</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-danger-600">{userStats.admins}</div>
          <div className="text-sm text-secondary-600">Admins</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-warning-600">{userStats.securityOfficers}</div>
          <div className="text-sm text-secondary-600">Security Officers</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Search</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="lg:col-span-3">
          <UserFilters filters={filters} onFiltersChange={setFilters} />
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-secondary-900">
            Users ({filteredUsers.length})
          </h2>
          <div className="flex items-center space-x-2">
            <button className="btn btn-secondary btn-sm">
              <Filter className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">No users found</h3>
            <p className="text-secondary-600">Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
