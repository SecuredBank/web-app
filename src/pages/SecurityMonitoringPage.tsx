import { useState, useEffect } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Filter, 
  Search,
  Clock,
  User,
  MapPin,
  Activity
} from 'lucide-react'
import { SecurityAlert, AlertSeverity, AlertType, AlertStatus } from '@types'
import { cn } from '@utils/cn'
import { useSecurity } from '@contexts/SecurityContext'
import { Card } from '@components/ui/Card'
import { Badge } from '@components/ui/Badge'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Select } from '@components/ui/Select'
import { Table } from '@components/ui/Table'

interface SecurityMetric {
  title: string
  value: number
  change: number
  trend: 'up' | 'down'
}

const convertEventToAlert = (event: any): SecurityAlert => {
  let severity: AlertSeverity = 'low'
  let type: AlertType = 'info'
  let status: AlertStatus = 'open'

  switch (event.type) {
    case 'AUTH_FAILURE':
      severity = 'high'
      type = 'login_anomaly'
      break
    case 'SECURITY_VIOLATION':
      severity = 'critical'
      type = 'security_breach'
      break
    case 'SESSION_EXPIRED':
      severity = 'medium'
      type = 'session_anomaly'
      break
    case 'ACCESS_DENIED':
      severity = 'high'
      type = 'access_violation'
      break
    default:
      break
  }

  return {
    id: event.timestamp.toString(),
    type,
    severity,
    title: event.type.replace('_', ' ').toLowerCase(),
    description: `Security event: ${event.type} - ${JSON.stringify(event.data)}`,
    timestamp: new Date(event.timestamp),
    source: 'Security System',
    status,
    assignedTo: 'Security Team',
    metadata: event.data || {},
  }
}

export default function SecurityMonitoringPage() {
  const { monitoring } = useSecurity()
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [metrics, setMetrics] = useState<SecurityMetric[]>([])
  const [filter, setFilter] = useState({
    severity: 'all',
    type: 'all',
    status: 'all'
  })
  
  // Update metrics and alerts when monitoring data changes
  useEffect(() => {
    const securityMetrics = monitoring.getMetrics()
    
    // Convert security events to alerts
    const newAlerts = securityMetrics.events.map(convertEventToAlert)
    setAlerts(newAlerts)
    
    // Calculate metrics
    const failedLogins = securityMetrics.events.filter(e => e.type === 'AUTH_FAILURE').length
    const securityViolations = securityMetrics.events.filter(e => e.type === 'SECURITY_VIOLATION').length
    const accessDenials = securityMetrics.events.filter(e => e.type === 'ACCESS_DENIED').length
    
    setMetrics([
      {
        title: 'Failed Logins',
        value: failedLogins,
        change: failedLogins - securityMetrics.failedAuths,
        trend: failedLogins > securityMetrics.failedAuths ? 'up' : 'down'
      },
      {
        title: 'Security Violations',
        value: securityViolations,
        change: securityViolations - securityMetrics.violations,
        trend: securityViolations > securityMetrics.violations ? 'up' : 'down'
      },
      {
        title: 'Access Denials',
        value: accessDenials,
        change: accessDenials,
        trend: accessDenials > 0 ? 'up' : 'down'
      },
      {
        title: 'Response Time',
        value: Math.round(securityMetrics.averageResponseTime),
        change: 0,
        trend: securityMetrics.averageResponseTime > 1000 ? 'up' : 'down'
      }
    ])
  }, [monitoring])

  // Filter alerts based on current filter settings
  const filteredAlerts = alerts.filter(alert => {
    if (filter.severity !== 'all' && alert.severity !== filter.severity) return false
    if (filter.type !== 'all' && alert.type !== filter.type) return false
    if (filter.status !== 'all' && alert.status !== filter.status) return false
    return true
  })

  return (
    <div className="p-6 space-y-6">
      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-gray-600">{metric.title}</h3>
              <Activity className={cn(
                "h-4 w-4",
                metric.trend === 'up' ? 'text-red-500' : 'text-green-500'
              )} />
            </div>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold">{metric.value}</p>
              {metric.change !== 0 && (
                <span className={cn(
                  "ml-2 text-sm",
                  metric.trend === 'up' ? 'text-red-500' : 'text-green-500'
                )}>
                  {metric.change > 0 ? '+' : ''}{metric.change}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input 
            type="text"
            placeholder="Search alerts..."
            className="w-64"
          />
        </div>
        
        <Select
          value={filter.severity}
          onValueChange={(value) => setFilter(prev => ({ ...prev, severity: value }))}
          options={[
            { value: 'all', label: 'All Severities' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'critical', label: 'Critical' }
          ]}
        />

        <Select
          value={filter.type}
          onValueChange={(value) => setFilter(prev => ({ ...prev, type: value }))}
          options={[
            { value: 'all', label: 'All Types' },
            { value: 'login_anomaly', label: 'Login Anomaly' },
            { value: 'security_breach', label: 'Security Breach' },
            { value: 'session_anomaly', label: 'Session Anomaly' },
            { value: 'access_violation', label: 'Access Violation' }
          ]}
        />

        <Select
          value={filter.status}
          onValueChange={(value) => setFilter(prev => ({ ...prev, status: value }))}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'open', label: 'Open' },
            { value: 'investigating', label: 'Investigating' },
            { value: 'resolved', label: 'Resolved' }
          ]}
        />
      </div>

      {/* Alerts Table */}
      <Table>
        <thead>
          <tr>
            <th>Severity</th>
            <th>Title</th>
            <th>Source</th>
            <th>Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAlerts.map((alert) => (
            <tr key={alert.id}>
              <td>
                <Badge variant={
                  alert.severity === 'critical' ? 'destructive' :
                  alert.severity === 'high' ? 'error' :
                  alert.severity === 'medium' ? 'warning' :
                  'default'
                }>
                  {alert.severity}
                </Badge>
              </td>
              <td>
                <div>
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-sm text-gray-500">{alert.description}</p>
                </div>
              </td>
              <td>{alert.source}</td>
              <td>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{alert.timestamp.toLocaleString()}</span>
                </div>
              </td>
              <td>
                <Badge variant={
                  alert.status === 'resolved' ? 'success' :
                  alert.status === 'investigating' ? 'warning' :
                  'default'
                }>
                  {alert.status}
                </Badge>
              </td>
              <td>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <AlertTriangle className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
export default function SecurityMonitoringPage() {
  const { monitoring } = useSecurity()
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [metrics, setMetrics] = useState<SecurityMetric[]>([])
  const [filter, setFilter] = useState({
    severity: 'all',
    type: 'all',
    status: 'all'
  })
  
  // Update metrics and alerts when monitoring data changes
  useEffect(() => {
    const securityMetrics = monitoring.getMetrics()
    
    // Convert security events to alerts
    const newAlerts = securityMetrics.events.map(convertEventToAlert)
    setAlerts(newAlerts)
    
    // Calculate metrics
    const failedLogins = securityMetrics.events.filter(e => e.type === 'AUTH_FAILURE').length
    const securityViolations = securityMetrics.events.filter(e => e.type === 'SECURITY_VIOLATION').length
    const accessDenials = securityMetrics.events.filter(e => e.type === 'ACCESS_DENIED').length
    
    setMetrics([
      {
        title: 'Failed Logins',
        value: failedLogins,
        change: failedLogins - securityMetrics.failedAuths,
        trend: failedLogins > securityMetrics.failedAuths ? 'up' : 'down'
      },
      {
        title: 'Security Violations',
        value: securityViolations,
        change: securityViolations - securityMetrics.violations,
        trend: securityViolations > securityMetrics.violations ? 'up' : 'down'
      },
      {
        title: 'Access Denials',
        value: accessDenials,
        change: accessDenials,
        trend: accessDenials > 0 ? 'up' : 'down'
      },
      {
        title: 'Response Time',
        value: Math.round(securityMetrics.averageResponseTime),
        change: 0,
        trend: securityMetrics.averageResponseTime > 1000 ? 'up' : 'down'
      }
    ])
  }, [monitoring])
  high: 'bg-danger-100 text-danger-800 border-danger-200',
  critical: 'bg-danger-200 text-danger-900 border-danger-300',
}

const statusColors = {
  open: 'bg-danger-100 text-danger-800',
  investigating: 'bg-warning-100 text-warning-800',
  resolved: 'bg-success-100 text-success-800',
  false_positive: 'bg-secondary-100 text-secondary-800',
}

function AlertCard({ alert, onViewDetails }: { alert: SecurityAlert; onViewDetails: (alert: SecurityAlert) => void }) {
  return (
    <div className="card p-6 hover:shadow-elevated transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-secondary-900">{alert.title}</h3>
            <span className={cn(
              'px-2 py-1 text-xs font-medium rounded-full border',
              severityColors[alert.severity]
            )}>
              {alert.severity.toUpperCase()}
            </span>
            <span className={cn(
              'px-2 py-1 text-xs font-medium rounded-full',
              statusColors[alert.status]
            )}>
              {alert.status.replace('_', ' ')}
            </span>
          </div>
          
          <p className="text-secondary-600 mb-4">{alert.description}</p>
          
          <div className="flex items-center space-x-6 text-sm text-secondary-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{alert.timestamp.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Activity className="w-4 h-4" />
              <span>{alert.source}</span>
            </div>
            {alert.assignedTo && (
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>{alert.assignedTo}</span>
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={() => onViewDetails(alert)}
          className="btn btn-secondary btn-sm ml-4"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </button>
      </div>
    </div>
  )
}

function AlertFilters({ 
  filters, 
  onFiltersChange 
}: { 
  filters: { severity: AlertSeverity | 'all'; status: AlertStatus | 'all'; type: AlertType | 'all' }
  onFiltersChange: (filters: any) => void 
}) {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-secondary-900 mb-4">Filters</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Severity Filter */}
        <div>
          <label className="label block text-sm font-medium text-secondary-700 mb-2">
            Severity
          </label>
          <select
            value={filters.severity}
            onChange={(e) => onFiltersChange({ ...filters, severity: e.target.value as any })}
            className="input w-full"
          >
            <option value="all">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
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
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="false_positive">False Positive</option>
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label className="label block text-sm font-medium text-secondary-700 mb-2">
            Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => onFiltersChange({ ...filters, type: e.target.value as any })}
            className="input w-full"
          >
            <option value="all">All Types</option>
            <option value="login_anomaly">Login Anomaly</option>
            <option value="suspicious_transaction">Suspicious Transaction</option>
            <option value="malware_detected">Malware Detected</option>
            <option value="data_breach">Data Breach</option>
            <option value="unauthorized_access">Unauthorized Access</option>
            <option value="phishing_attempt">Phishing Attempt</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default function SecurityMonitoringPage() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>(mockAlerts)
  const [filteredAlerts, setFilteredAlerts] = useState<SecurityAlert[]>(mockAlerts)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    severity: 'all' as AlertSeverity | 'all',
    status: 'all' as AlertStatus | 'all',
    type: 'all' as AlertType | 'all',
  })
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null)

  // Filter alerts based on search and filters
  useEffect(() => {
    let filtered = alerts

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(alert =>
        alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.source.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply severity filter
    if (filters.severity !== 'all') {
      filtered = filtered.filter(alert => alert.severity === filters.severity)
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(alert => alert.status === filters.status)
    }

    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(alert => alert.type === filters.type)
    }

    setFilteredAlerts(filtered)
  }, [alerts, searchQuery, filters])

  const handleViewDetails = (alert: SecurityAlert) => {
    setSelectedAlert(alert)
    // In a real app, this would open a modal or navigate to a details page
    console.log('Viewing alert details:', alert)
  }

  const alertStats = {
    total: alerts.length,
    open: alerts.filter(a => a.status === 'open').length,
    investigating: alerts.filter(a => a.status === 'investigating').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    critical: alerts.filter(a => a.severity === 'critical').length,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Security Monitoring</h1>
        <p className="text-secondary-600">Monitor and manage security alerts in real-time</p>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-secondary-900">{alertStats.total}</div>
          <div className="text-sm text-secondary-600">Total Alerts</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-danger-600">{alertStats.open}</div>
          <div className="text-sm text-secondary-600">Open</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-warning-600">{alertStats.investigating}</div>
          <div className="text-sm text-secondary-600">Investigating</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-success-600">{alertStats.resolved}</div>
          <div className="text-sm text-secondary-600">Resolved</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-danger-700">{alertStats.critical}</div>
          <div className="text-sm text-secondary-600">Critical</div>
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
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="lg:col-span-3">
          <AlertFilters filters={filters} onFiltersChange={setFilters} />
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-secondary-900">
            Security Alerts ({filteredAlerts.length})
          </h2>
          <div className="flex items-center space-x-2">
            <button className="btn btn-secondary btn-sm">
              <Filter className="w-4 h-4 mr-2" />
              Export
            </button>
            <button className="btn btn-primary btn-sm">
              <Shield className="w-4 h-4 mr-2" />
              New Alert
            </button>
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="card p-12 text-center">
            <Shield className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">No alerts found</h3>
            <p className="text-secondary-600">Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} onViewDetails={handleViewDetails} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
