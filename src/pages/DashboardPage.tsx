import { useState, useEffect } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Activity,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { DashboardStats, SecurityMetric, SecurityAlert } from '@types'
import { cn } from '@utils/cn'

// Mock data for development
const mockStats: DashboardStats = {
  totalAlerts: 24,
  criticalAlerts: 3,
  resolvedToday: 8,
  activeUsers: 156,
  systemHealth: 98,
  threatLevel: 'medium',
}

const mockMetrics: SecurityMetric[] = [
  {
    id: '1',
    name: 'Failed Login Attempts',
    value: 12,
    unit: 'attempts',
    trend: 'down',
    change: -15,
    timestamp: new Date(),
  },
  {
    id: '2',
    name: 'Suspicious Transactions',
    value: 3,
    unit: 'transactions',
    trend: 'up',
    change: 25,
    timestamp: new Date(),
  },
  {
    id: '3',
    name: 'System Uptime',
    value: 99.9,
    unit: '%',
    trend: 'stable',
    change: 0,
    timestamp: new Date(),
  },
  {
    id: '4',
    name: 'Data Breach Attempts',
    value: 0,
    unit: 'attempts',
    trend: 'stable',
    change: 0,
    timestamp: new Date(),
  },
]

const mockRecentAlerts: SecurityAlert[] = [
  {
    id: '1',
    type: 'login_anomaly',
    severity: 'high',
    title: 'Multiple Failed Login Attempts',
    description: 'Unusual login pattern detected from IP 192.168.1.100',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    source: 'Authentication System',
    status: 'open',
  },
  {
    id: '2',
    type: 'suspicious_transaction',
    severity: 'medium',
    title: 'Large Transaction Detected',
    description: 'Transaction of $50,000 flagged for review',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    source: 'Transaction Monitor',
    status: 'investigating',
  },
  {
    id: '3',
    type: 'malware_detected',
    severity: 'critical',
    title: 'Malware Signature Detected',
    description: 'Known malware pattern identified in network traffic',
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    source: 'Network Security',
    status: 'open',
  },
]

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  change, 
  color = 'primary' 
}: {
  title: string
  value: string | number
  icon: any
  trend?: 'up' | 'down' | 'stable'
  change?: number
  color?: 'primary' | 'success' | 'warning' | 'danger'
}) {
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-50',
    success: 'text-success-600 bg-success-50',
    warning: 'text-warning-600 bg-warning-50',
    danger: 'text-danger-600 bg-danger-50',
  }

  const trendIcons = {
    up: <TrendingUp className="w-4 h-4 text-success-600" />,
    down: <TrendingDown className="w-4 h-4 text-danger-600" />,
    stable: <Minus className="w-4 h-4 text-secondary-600" />,
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-secondary-600">{title}</p>
          <p className="text-2xl font-bold text-secondary-900">{value}</p>
        </div>
        <div className={cn('p-3 rounded-lg', colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {trend && change !== undefined && (
        <div className="mt-4 flex items-center">
          {trendIcons[trend]}
          <span className={cn(
            'ml-2 text-sm font-medium',
            trend === 'up' ? 'text-success-600' : 
            trend === 'down' ? 'text-danger-600' : 'text-secondary-600'
          )}>
            {change > 0 ? '+' : ''}{change}%
          </span>
          <span className="ml-1 text-sm text-secondary-500">vs last hour</span>
        </div>
      )}
    </div>
  )
}

function AlertCard({ alert }: { alert: SecurityAlert }) {
  const severityColors = {
    low: 'border-l-success-500 bg-success-50',
    medium: 'border-l-warning-500 bg-warning-50',
    high: 'border-l-danger-500 bg-danger-50',
    critical: 'border-l-danger-700 bg-danger-100',
  }

  const statusColors = {
    open: 'bg-danger-100 text-danger-800',
    investigating: 'bg-warning-100 text-warning-800',
    resolved: 'bg-success-100 text-success-800',
    false_positive: 'bg-secondary-100 text-secondary-800',
  }

  return (
    <div className={cn('card p-4 border-l-4', severityColors[alert.severity])}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-medium text-secondary-900">{alert.title}</h4>
            <span className={cn(
              'px-2 py-1 text-xs font-medium rounded-full',
              statusColors[alert.status]
            )}>
              {alert.status.replace('_', ' ')}
            </span>
          </div>
          <p className="mt-1 text-sm text-secondary-600">{alert.description}</p>
          <div className="mt-2 flex items-center text-xs text-secondary-500">
            <span>{alert.source}</span>
            <span className="mx-2">•</span>
            <span>{alert.timestamp.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(mockStats)
  const [metrics, setMetrics] = useState<SecurityMetric[]>(mockMetrics)
  const [recentAlerts, setRecentAlerts] = useState<SecurityAlert[]>(mockRecentAlerts)

  useEffect(() => {
    // In a real app, this would fetch data from an API
    // Simulate real-time updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalAlerts: prev.totalAlerts + Math.floor(Math.random() * 3),
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 5) - 2,
      }))
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Security Dashboard</h1>
        <p className="text-secondary-600">Monitor your bank's security status in real-time</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Alerts"
          value={stats.totalAlerts}
          icon={AlertTriangle}
          color="warning"
          trend="up"
          change={12}
        />
        <StatCard
          title="Critical Alerts"
          value={stats.criticalAlerts}
          icon={Shield}
          color="danger"
          trend="down"
          change={-8}
        />
        <StatCard
          title="Resolved Today"
          value={stats.resolvedToday}
          icon={CheckCircle}
          color="success"
          trend="up"
          change={25}
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={Users}
          color="primary"
          trend="stable"
          change={2}
        />
      </div>

      {/* System Health and Threat Level */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">System Health</h3>
            <Activity className="w-5 h-5 text-success-600" />
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-3xl font-bold text-success-600">{stats.systemHealth}%</div>
            <div className="flex-1">
              <div className="w-full bg-secondary-200 rounded-full h-2">
                <div 
                  className="bg-success-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.systemHealth}%` }}
                />
              </div>
            </div>
          </div>
          <p className="mt-2 text-sm text-secondary-600">All systems operational</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">Threat Level</h3>
            <Shield className="w-5 h-5 text-warning-600" />
          </div>
          <div className="flex items-center space-x-4">
            <div className={cn(
              'text-3xl font-bold capitalize',
              stats.threatLevel === 'low' ? 'text-success-600' :
              stats.threatLevel === 'medium' ? 'text-warning-600' :
              stats.threatLevel === 'high' ? 'text-danger-600' : 'text-danger-700'
            )}>
              {stats.threatLevel}
            </div>
            <div className="flex-1">
              <div className="w-full bg-secondary-200 rounded-full h-2">
                <div className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  stats.threatLevel === 'low' ? 'bg-success-600 w-1/4' :
                  stats.threatLevel === 'medium' ? 'bg-warning-600 w-1/2' :
                  stats.threatLevel === 'high' ? 'bg-danger-600 w-3/4' : 'bg-danger-700 w-full'
                )} />
              </div>
            </div>
          </div>
          <p className="mt-2 text-sm text-secondary-600">Enhanced monitoring active</p>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-secondary-900">Recent Security Alerts</h3>
          <button className="btn btn-secondary btn-sm">View All</button>
        </div>
        <div className="space-y-4">
          {recentAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </div>
    </div>
  )
}
