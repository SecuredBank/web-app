import { useState, useEffect } from 'react'
import { 
  Bell, 
  Check, 
  X, 
  Trash2, 
  Filter, 
  Search,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react'
import { formatDateTime, formatRelativeTime } from '@utils/format'
import { useDebounce } from '@hooks/useDebounce'
import Card from '@components/ui/Card'
import { CardContent, CardHeader, CardTitle } from '@components/ui/Card'
import Button from '@components/ui/Button'
import Input from '@components/ui/Input'
import Badge from '@components/ui/Badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/Table'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  timestamp: Date
  category: 'security' | 'system' | 'user' | 'transaction'
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

// Mock notification data
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Security Alert',
    message: 'Multiple failed login attempts detected from IP 192.168.1.100',
    type: 'error',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    category: 'security',
    priority: 'high',
  },
  {
    id: '2',
    title: 'System Update',
    message: 'System maintenance completed successfully',
    type: 'success',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    category: 'system',
    priority: 'medium',
  },
  {
    id: '3',
    title: 'User Activity',
    message: 'New user account created: john.doe@securedbank.com',
    type: 'info',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    category: 'user',
    priority: 'low',
  },
  {
    id: '4',
    title: 'Transaction Alert',
    message: 'Large transaction of $50,000 flagged for review',
    type: 'warning',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    category: 'transaction',
    priority: 'urgent',
  },
  {
    id: '5',
    title: 'Backup Complete',
    message: 'Daily backup completed successfully',
    type: 'success',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    category: 'system',
    priority: 'low',
  },
]

const typeIcons = {
  info: <Info className="w-4 h-4" />,
  success: <CheckCircle className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
  error: <AlertTriangle className="w-4 h-4" />,
}

const typeColors = {
  info: 'primary',
  success: 'success',
  warning: 'warning',
  error: 'danger',
}

const priorityColors = {
  low: 'secondary',
  medium: 'primary',
  high: 'warning',
  urgent: 'danger',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>(mockNotifications)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [readFilter, setReadFilter] = useState<string>('all')
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Filter notifications based on search and filters
  useEffect(() => {
    let filtered = notifications

    // Apply search filter
    if (debouncedSearchQuery) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        notification.message.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(notification => notification.type === typeFilter)
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(notification => notification.category === categoryFilter)
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(notification => notification.priority === priorityFilter)
    }

    // Apply read filter
    if (readFilter !== 'all') {
      const isRead = readFilter === 'read'
      filtered = filtered.filter(notification => notification.read === isRead)
    }

    setFilteredNotifications(filtered)
  }, [notifications, debouncedSearchQuery, typeFilter, categoryFilter, priorityFilter, readFilter])

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    ))
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })))
  }

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const handleDeleteAll = () => {
    setNotifications([])
  }

  const notificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    urgent: notifications.filter(n => n.priority === 'urgent').length,
    security: notifications.filter(n => n.category === 'security').length,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Notifications</h1>
          <p className="text-secondary-600">Manage your system notifications and alerts</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="secondary" onClick={handleMarkAllAsRead}>
            <Check className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="danger" onClick={handleDeleteAll}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete All
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-secondary-900">{notificationStats.total}</div>
            <div className="text-sm text-secondary-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary-600">{notificationStats.unread}</div>
            <div className="text-sm text-secondary-600">Unread</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-danger-600">{notificationStats.urgent}</div>
            <div className="text-sm text-secondary-600">Urgent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning-600">{notificationStats.security}</div>
            <div className="text-sm text-secondary-600">Security</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Search
              </label>
              <Input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input w-full"
              >
                <option value="all">All Types</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input w-full"
              >
                <option value="all">All Categories</option>
                <option value="security">Security</option>
                <option value="system">System</option>
                <option value="user">User</option>
                <option value="transaction">Transaction</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="input w-full"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Read Filter */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Status
              </label>
              <select
                value={readFilter}
                onChange={(e) => setReadFilter(e.target.value)}
                className="input w-full"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchQuery('')
                  setTypeFilter('all')
                  setCategoryFilter('all')
                  setPriorityFilter('all')
                  setReadFilter('all')
                }}
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications ({filteredNotifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.map((notification) => (
                  <TableRow key={notification.id} className={!notification.read ? 'bg-primary-50' : ''}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={`text-${typeColors[notification.type]}-600`}>
                          {typeIcons[notification.type]}
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary-600 rounded-full" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-secondary-900">
                        {notification.title}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-secondary-600">
                        {notification.message}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {notification.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityColors[notification.priority] as any}>
                        {notification.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 text-sm text-secondary-500">
                        <Clock className="w-4 h-4" />
                        <span>{formatRelativeTime(notification.timestamp)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
