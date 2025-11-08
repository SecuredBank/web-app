import React from 'react'
import { Card } from '../ui/Card'
import { LineChart } from '../charts/LineChart'
import { MetricCard } from '../charts/MetricCard'
import { SecurityChart } from '../charts/SecurityChart'
import { useSecurityManagement } from '../../hooks/useSecurityManagement'
import { Alert } from '../ui/Alert'
import { LoadingSpinner } from '../ui/LoadingSpinner'

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
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="error" title="Error loading security data">
        {error}
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Active Incidents"
          value={activeIncidents}
          trend="up"
          trendValue={5}
          status="warning"
        />
        <MetricCard
          title="Critical Incidents"
          value={criticalIncidents}
          trend="down"
          trendValue={2}
          status="error"
        />
        <MetricCard
          title="Risk Score"
          value={Math.round(totalRiskScore)}
          trend="stable"
          trendValue={0}
          status={totalRiskScore > 75 ? 'error' : totalRiskScore > 50 ? 'warning' : 'success'}
        />
      </div>

      {/* Security Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Security Incidents Trend</Card.Title>
            <Card.Description>
              Historical view of security incidents over time
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <LineChart
              data={incidents.map(incident => ({
                date: incident.createdAt,
                value: 1,
                category: incident.severity
              }))}
              height={300}
            />
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Security Metrics Distribution</Card.Title>
            <Card.Description>
              Distribution of security metrics by category
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <SecurityChart
              data={metrics.map(metric => ({
                name: metric.name,
                value: metric.value,
                category: metric.period
              }))}
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
            Latest security incidents requiring attention
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {incidents.slice(0, 5).map(incident => (
              <div key={incident.id} className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {incident.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {incident.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      incident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      incident.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {incident.severity}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      incident.status === 'open' ? 'bg-blue-100 text-blue-800' :
                      incident.status === 'investigating' ? 'bg-purple-100 text-purple-800' :
                      incident.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {incident.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}

export default SecurityDashboard