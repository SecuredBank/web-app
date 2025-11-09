import React from 'react'
import Card from '../ui/Card'
import LineChart from '../charts/LineChart'
import MetricCard from '../charts/MetricCard'
import SecurityChart from '../charts/SecurityChart'
import { useSecurityManagement } from '../../hooks/useSecurityManagement'
import Alert from '../ui/Alert'
import LoadingSpinner from '../ui/LoadingSpinner'

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
        <Alert variant="error" title="Error Loading Security Data">
          {error}
        </Alert>
      </div>
    )
  }

  const metricCards = [
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
      trend: criticalIncidents > 0 ? 'up' : 'down'
    },
    {
      title: 'Risk Score',
      value: totalRiskScore,
      description: 'Overall security risk assessment',
      trend: totalRiskScore > 75 ? 'up' : 'down'
    }
  ]

  const incidentChartData = incidents.map(incident => ({
    timestamp: incident.createdAt,
    type: incident.category,
    severity: incident.severity
  }))

  const metricChartData = metrics.map(metric => ({
    label: metric.name,
    value: metric.value,
    trend: metric.trend,
    period: metric.period
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metricCards.map(({ title, value, description, trend }) => (
          <MetricCard
            key={title}
            title={title}
            value={value}
            description={description}
            trend={trend}
          />
        ))}
      </div>

      {/* Security Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Security Incidents Trend</Card.Title>
            <Card.Description>
              Timeline of security incidents by severity
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <LineChart
              data={incidentChartData}
              height={300}
              showLegend
            />
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Security Metrics Distribution</Card.Title>
            <Card.Description>
              Overview of key security metrics
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <SecurityChart
              data={metricChartData}
              height={300}
            />
          </Card.Content>
        </Card>
      </div>

      {/* Recent Incidents */}
      <Card>
        <Card.Header>
          <Card.Title>Recent Security Incidents</Card.Title>
          <Card.Description>
            Latest reported security events and their status
          </Card.Description>
        </Card.Header>
        <Card.Content>
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
                      <span className={`px-2 py-1 rounded text-xs ${
                        incident.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : incident.severity === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : incident.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">{incident.category}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        incident.status === 'open'
                          ? 'bg-blue-100 text-blue-800'
                          : incident.status === 'investigating'
                          ? 'bg-purple-100 text-purple-800'
                          : incident.status === 'resolved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(incident.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}

export default SecurityDashboard
