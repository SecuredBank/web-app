import { useState, useEffect } from 'react'
import { 
  Server, 
  Database, 
  Globe, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  Activity,
  Clock
} from 'lucide-react'
import { formatDateTime } from '@utils/format'
import Card from '@components/ui/Card'
import { CardContent, CardHeader, CardTitle } from '@components/ui/Card'
import Button from '@components/ui/Button'
import Badge from '@components/ui/Badge'
import Progress from '@components/ui/Progress'

interface SystemComponent {
  id: string
  name: string
  status: 'operational' | 'degraded' | 'outage'
  uptime: number
  responseTime: number
  lastChecked: Date
  description: string
  icon: React.ReactNode
}

// Mock system status data
const mockComponents: SystemComponent[] = [
  {
    id: '1',
    name: 'Web Server',
    status: 'operational',
    uptime: 99.9,
    responseTime: 120,
    lastChecked: new Date(),
    description: 'Main web application server',
    icon: <Server className="w-5 h-5" />,
  },
  {
    id: '2',
    name: 'Database',
    status: 'operational',
    uptime: 99.8,
    responseTime: 45,
    lastChecked: new Date(),
    description: 'Primary database server',
    icon: <Database className="w-5 h-5" />,
  },
  {
    id: '3',
    name: 'API Gateway',
    status: 'degraded',
    uptime: 98.5,
    responseTime: 250,
    lastChecked: new Date(),
    description: 'API routing and load balancing',
    icon: <Globe className="w-5 h-5" />,
  },
  {
    id: '4',
    name: 'Security Scanner',
    status: 'operational',
    uptime: 99.7,
    responseTime: 80,
    lastChecked: new Date(),
    description: 'Real-time security monitoring',
    icon: <Shield className="w-5 h-5" />,
  },
]

const statusIcons = {
  operational: <CheckCircle className="w-5 h-5 text-success-600" />,
  degraded: <AlertTriangle className="w-5 h-5 text-warning-600" />,
  outage: <XCircle className="w-5 h-5 text-danger-600" />,
}

const statusColors = {
  operational: 'success',
  degraded: 'warning',
  outage: 'danger',
}

export default function SystemStatusPage() {
  const [components, setComponents] = useState<SystemComponent[]>(mockComponents)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update components with new data
      setComponents(prev => prev.map(comp => ({
        ...comp,
        lastChecked: new Date(),
        responseTime: Math.floor(Math.random() * 200) + 50,
      })))
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error refreshing system status:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const overallStatus = components.every(c => c.status === 'operational')
    ? 'operational'
    : components.some(c => c.status === 'outage')
    ? 'outage'
    : 'degraded'

  const averageUptime = components.reduce((acc, comp) => acc + comp.uptime, 0) / components.length
  const averageResponseTime = components.reduce((acc, comp) => acc + comp.responseTime, 0) / components.length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">System Status</h1>
          <p className="text-secondary-600">Monitor system health and performance</p>
        </div>
        <Button
          onClick={handleRefresh}
          isLoading={isRefreshing}
          disabled={isRefreshing}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {statusIcons[overallStatus]}
            <span>Overall System Status</span>
            <Badge variant={statusColors[overallStatus] as any}>
              {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-2xl font-bold text-secondary-900">
                {averageUptime.toFixed(1)}%
              </div>
              <div className="text-sm text-secondary-600">Average Uptime</div>
              <Progress value={averageUptime} className="mt-2" />
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary-900">
                {averageResponseTime.toFixed(0)}ms
              </div>
              <div className="text-sm text-secondary-600">Average Response Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary-900">
                {components.length}
              </div>
              <div className="text-sm text-secondary-600">Active Components</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {components.map((component) => (
          <Card key={component.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-secondary-600">
                    {component.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{component.name}</CardTitle>
                    <p className="text-sm text-secondary-600">
                      {component.description}
                    </p>
                  </div>
                </div>
                <Badge variant={statusColors[component.status] as any}>
                  {component.status.charAt(0).toUpperCase() + component.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Uptime */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-secondary-700">
                      Uptime
                    </span>
                    <span className="text-sm text-secondary-600">
                      {component.uptime}%
                    </span>
                  </div>
                  <Progress value={component.uptime} />
                </div>

                {/* Response Time */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-secondary-700">
                      Response Time
                    </span>
                    <span className="text-sm text-secondary-600">
                      {component.responseTime}ms
                    </span>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        component.responseTime < 100
                          ? 'bg-success-600'
                          : component.responseTime < 200
                          ? 'bg-warning-600'
                          : 'bg-danger-600'
                      }`}
                      style={{
                        width: `${Math.min((component.responseTime / 500) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Last Checked */}
                <div className="flex items-center space-x-2 text-sm text-secondary-500">
                  <Clock className="w-4 h-4" />
                  <span>Last checked: {formatDateTime(component.lastChecked)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>System Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-success-600">
                {components.filter(c => c.status === 'operational').length}
              </div>
              <div className="text-sm text-secondary-600">Operational</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning-600">
                {components.filter(c => c.status === 'degraded').length}
              </div>
              <div className="text-sm text-secondary-600">Degraded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-danger-600">
                {components.filter(c => c.status === 'outage').length}
              </div>
              <div className="text-sm text-secondary-600">Outage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-900">
                {formatDateTime(lastUpdated)}
              </div>
              <div className="text-sm text-secondary-600">Last Updated</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
