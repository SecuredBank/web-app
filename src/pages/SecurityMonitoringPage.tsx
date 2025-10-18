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

// Mock data for security alerts
const mockAlerts: SecurityAlert[] = [
  {
    id: '1',
    type: 'login_anomaly',
    severity: 'high',
    title: 'Multiple Failed Login Attempts',
    description: 'Unusual login pattern detected from IP 192.168.1.100 with 15 failed attempts in 5 minutes',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    source: 'Authentication System',
    status: 'open',
    assignedTo: 'John Doe',
    metadata: {
      ip: '192.168.1.100',
      attempts: 15,
      timeWindow: '5 minutes',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  },
  {
    id: '2',
    type: 'suspicious_transaction',
    severity: 'medium',
    title: 'Large Transaction Detected',
    description: 'Transaction of $50,000 flagged for review - exceeds normal user patterns',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    source: 'Transaction Monitor',
    status: 'investigating',
    assignedTo: 'Jane Smith',
    metadata: {
      amount: 50000,
      currency: 'USD',
      account: 'ACC-123456',
      recipient: 'Unknown Entity'
    }
  },
  {
    id: '3',
    type: 'malware_detected',
    severity: 'critical',
    title: 'Malware Signature Detected',
    description: 'Known malware pattern identified in network traffic from external source',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    source: 'Network Security',
    status: 'open',
    metadata: {
      malwareType: 'Trojan',
      signature: 'MAL-2024-001',
      affectedSystems: ['Web Server', 'Database Server']
    }
  },
  {
    id: '4',
    type: 'data_breach',
    severity: 'critical',
    title: 'Potential Data Breach Attempt',
    description: 'Unauthorized access attempt to customer database detected',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    source: 'Database Monitor',
    status: 'investigating',
    assignedTo: 'Mike Johnson',
    metadata: {
      database: 'CustomerDB',
      accessType: 'SQL Injection',
      affectedRecords: 0
    }
  },
  {
    id: '5',
    type: 'phishing_attempt',
    severity: 'medium',
    title: 'Phishing Email Detected',
    description: 'Suspicious email with malicious links sent to multiple employees',
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    source: 'Email Security',
    status: 'resolved',
    resolvedAt: new Date(Date.now() - 1000 * 60 * 30),
    metadata: {
      sender: 'fake@bank-security.com',
      recipients: 25,
      linksBlocked: 3
    }
  }
]

const severityColors = {
  low: 'bg-success-100 text-success-800 border-success-200',
  medium: 'bg-warning-100 text-warning-800 border-warning-200',
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
