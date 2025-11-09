import React from 'react'
import { Card } from '../ui/Card'
import LineChart from '../charts/LineChart'
import MetricCard from '../charts/MetricCard'
import SecurityChart from '../charts/SecurityChart'
import { useSecurityManagement } from '../../hooks/useSecurityManagement'
import { Alert } from '../ui/Alert'
import LoadingSpinner from '../ui/LoadingSpinner'
import type { SecuritySeverity } from '../../types/security'

interface MetricCardData {
  title: string
  value: number
  description: string
  trend: 'up' | 'down' | 'stable'
}

const SecurityDashboard: React.FC = () => {
  const {
    incidents,
    metrics,
    isLoading,
    error,
    activeIncidents,
    criticalIncidents,
    totalRiskScore,
  } = useSecurityManagement()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="danger" title="Error Loading Security Data">
          {error}
        </Alert>
      </div>
    )
  }

  const metricCards: MetricCardData[] = [
    {
      title: 'Active Incidents',
      value: activeIncidents,
      description: 'Current open and investigating incidents',
      trend: activeIncidents > 5 ? 'up' : 'down'
    },
    {
      title: 'Critical Incidents',
      value: criticalIncidents,
      description: 'High priority security incidents',
      trend: criticalIncidents > 0 ? 'up' : 'stable'
    },
    {
      title: 'Risk Score',
      value: totalRiskScore,
      description: 'Overall security risk assessment',
      trend: totalRiskScore > 75 ? 'up' : 'down'
    }
  ]

  const incidentChartData = incidents.map(incident => ({
    date: incident.createdAt,
    value: 1,
    category: incident.category
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metricCards.map((card) => (
          <MetricCard
            key={card.title}
            {...card}
          />
        ))}
      </div>

      {/* Security Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[400px]">
          <Card variant="default">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">Security Incidents Trend</h3>
              <p className="text-sm text-secondary-600">
                Timeline of security incidents by severity
              </p>
              <div className="mt-4">
                <LineChart
                  data={incidentChartData}
                  showLegend
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="h-[400px]">
          <Card variant="default">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">Security Overview</h3>
              <p className="text-sm text-secondary-600">
                Distribution of security metrics and incidents
              </p>
              <div className="mt-4">
                <SecurityChart
                  type="overview"
                  title="Security Metrics"
                  data={metrics.map(m => ({
                    name: m.name,
                    value: m.value,
                    trend: m.trend
                  }))}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Incidents */}
      <Card variant="default">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">Recent Security Incidents</h3>
          <p className="text-sm text-secondary-600 mb-4">
            Latest reported security events and their status
          </p>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Severity</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {incidents.slice(0, 5).map(incident => (
                  <tr
                    key={incident.id}
                    className="border-b dark:border-gray-700"
                  >
                    <td className="px-6 py-4">{incident.title}</td>
                    <td className="px-6 py-4">
                      <SeverityBadge severity={incident.severity} />
                    </td>
                    <td className="px-6 py-4">{incident.category}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={incident.status} />
                    </td>
                    <td className="px-6 py-4">
                      {new Date(incident.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}

const SeverityBadge: React.FC<{ severity: SecuritySeverity }> = ({ severity }) => {
  const classes = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  }

  return (
    <span className={`px-2 py-1 rounded text-xs ${classes[severity]}`}>
      {severity}
    </span>
  )
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const classes = {
    open: 'bg-blue-100 text-blue-800',
    investigating: 'bg-purple-100 text-purple-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800'
  }

  return (
    <span className={`px-2 py-1 rounded text-xs ${classes[status] || classes.closed}`}>
      {status}
    </span>
  )
}

export default SecurityDashboard