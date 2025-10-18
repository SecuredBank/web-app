import { useState, useEffect } from 'react'
import { 
  Shield, 
  User, 
  Clock, 
  Search, 
  Filter, 
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useDebounce } from '@hooks/useDebounce'
import { formatDateTime } from '@utils/format'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/Table'
import Button from '@components/ui/Button'
import Input from '@components/ui/Input'
import Badge from '@components/ui/Badge'
import Card from '@components/ui/Card'
import { CardContent, CardHeader, CardTitle } from '@components/ui/Card'

interface AuditLogEntry {
  id: string
  timestamp: Date
  user: string
  action: string
  resource: string
  status: 'success' | 'failed' | 'warning'
  ipAddress: string
  userAgent: string
  details?: string
}

// Mock audit log data
const mockAuditLogs: AuditLogEntry[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    user: 'admin@securedbank.com',
    action: 'LOGIN',
    resource: 'Authentication',
    status: 'success',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    user: 'john.doe@securedbank.com',
    action: 'CREATE_USER',
    resource: 'User Management',
    status: 'success',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    user: 'jane.smith@securedbank.com',
    action: 'DELETE_ALERT',
    resource: 'Security Alerts',
    status: 'failed',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    details: 'Insufficient permissions',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    user: 'mike.johnson@securedbank.com',
    action: 'EXPORT_REPORT',
    resource: 'Reports',
    status: 'success',
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    user: 'admin@securedbank.com',
    action: 'UPDATE_SETTINGS',
    resource: 'System Settings',
    status: 'warning',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    details: 'Configuration change detected',
  },
]

const statusIcons = {
  success: <CheckCircle className="w-4 h-4" />,
  failed: <XCircle className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
}

const statusColors = {
  success: 'success',
  failed: 'danger',
  warning: 'warning',
}

export default function AuditLogPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(mockAuditLogs)
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>(mockAuditLogs)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Filter logs based on search and filters
  useEffect(() => {
    let filtered = auditLogs

    // Apply search filter
    if (debouncedSearchQuery) {
      filtered = filtered.filter(log =>
        log.user.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        log.resource.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        log.ipAddress.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.status === statusFilter)
    }

    // Apply action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter)
    }

    setFilteredLogs(filtered)
  }, [auditLogs, debouncedSearchQuery, statusFilter, actionFilter])

  const handleViewDetails = (log: AuditLogEntry) => {
    console.log('Viewing audit log details:', log)
    // In a real app, this would open a modal or navigate to a details page
  }

  const handleExport = () => {
    console.log('Exporting audit logs')
    // In a real app, this would trigger an export
  }

  const logStats = {
    total: auditLogs.length,
    success: auditLogs.filter(log => log.status === 'success').length,
    failed: auditLogs.filter(log => log.status === 'failed').length,
    warning: auditLogs.filter(log => log.status === 'warning').length,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Audit Log</h1>
        <p className="text-secondary-600">Monitor system activities and user actions</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-secondary-900">{logStats.total}</div>
            <div className="text-sm text-secondary-600">Total Events</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success-600">{logStats.success}</div>
            <div className="text-sm text-secondary-600">Successful</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-danger-600">{logStats.failed}</div>
            <div className="text-sm text-secondary-600">Failed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning-600">{logStats.warning}</div>
            <div className="text-sm text-secondary-600">Warnings</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Search
              </label>
              <Input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-full"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="warning">Warning</option>
              </select>
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Action
              </label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="input w-full"
              >
                <option value="all">All Actions</option>
                <option value="LOGIN">Login</option>
                <option value="CREATE_USER">Create User</option>
                <option value="DELETE_ALERT">Delete Alert</option>
                <option value="EXPORT_REPORT">Export Report</option>
                <option value="UPDATE_SETTINGS">Update Settings</option>
              </select>
            </div>

            {/* Export Button */}
            <div className="flex items-end">
              <Button onClick={handleExport} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-secondary-400" />
                        <span className="text-sm">
                          {formatDateTime(log.timestamp)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-secondary-400" />
                        <span className="text-sm">{log.user}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-secondary-900">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-secondary-600">
                        {log.resource}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusColors[log.status] as any}
                        className="flex items-center space-x-1"
                      >
                        {statusIcons[log.status]}
                        <span className="capitalize">{log.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm text-secondary-600">
                        {log.ipAddress}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(log)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
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
