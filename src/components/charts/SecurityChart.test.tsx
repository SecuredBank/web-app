import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SecurityChart from '../components/charts/SecurityChart'
import { SecurityAlert } from '../types'

describe('SecurityChart', () => {
  const mockData: SecurityAlert[] = [
    {
      id: '1',
      type: 'login_anomaly',
      severity: 'high',
      title: 'Failed Login Attempts',
      description: 'Multiple failed login attempts detected',
      timestamp: new Date(),
      source: 'auth-service',
      status: 'open',
      priority: 1,
      escalationLevel: 1,
      responseActions: [],
      auditTrail: []
    },
    {
      id: '2',
      type: 'data_breach',
      severity: 'critical',
      title: 'Data Breach Detected',
      description: 'Unauthorized data access detected',
      timestamp: new Date(),
      source: 'data-service',
      status: 'investigating',
      priority: 2,
      escalationLevel: 2,
      responseActions: [],
      auditTrail: []
    }
  ]

  it('renders without crashing', () => {
    render(
      <SecurityChart
        data={mockData}
        type="bar"
        title="Security Alerts"
      />
    )

    expect(screen.getByText('Security Alerts')).toBeInTheDocument()
  })

  it('renders bar chart when type is bar', () => {
    const { container } = render(
      <SecurityChart
        data={mockData}
        type="bar"
        title="Security Alerts"
      />
    )

    expect(container.querySelector('.recharts-bar')).toBeInTheDocument()
  })

  it('renders pie chart when type is pie', () => {
    const { container } = render(
      <SecurityChart
        data={mockData}
        type="pie"
        title="Security Alerts"
      />
    )

    expect(container.querySelector('.recharts-pie')).toBeInTheDocument()
  })

  it('shows correct alert count by severity', () => {
    render(
      <SecurityChart
        data={mockData}
        type="bar"
        title="Security Alerts"
      />
    )

    // Find bar chart bars
    const highBar = screen.getByRole('bar', { name: /high/i })
    const criticalBar = screen.getByRole('bar', { name: /critical/i })

    expect(highBar).toHaveAttribute('height', expect.any(String))
    expect(criticalBar).toHaveAttribute('height', expect.any(String))
  })

  it('renders with custom height', () => {
    const { container } = render(
      <SecurityChart
        data={mockData}
        type="bar"
        title="Security Alerts"
        height={500}
      />
    )

    const chartContainer = container.querySelector('.recharts-wrapper')
    expect(chartContainer).toHaveStyle({ height: '500px' })
  })

  it('shows legend when showLegend is true', () => {
    render(
      <SecurityChart
        data={mockData}
        type="bar"
        title="Security Alerts"
        showLegend={true}
      />
    )

    expect(screen.getByRole('legend')).toBeInTheDocument()
  })

  it('hides legend when showLegend is false', () => {
    render(
      <SecurityChart
        data={mockData}
        type="bar"
        title="Security Alerts"
        showLegend={false}
      />
    )

    expect(screen.queryByRole('legend')).not.toBeInTheDocument()
  })

  it('displays subtitle when provided', () => {
    render(
      <SecurityChart
        data={mockData}
        type="bar"
        title="Security Alerts"
        subtitle="Last 7 days"
      />
    )

    expect(screen.getByText('Last 7 days')).toBeInTheDocument()
  })

  it('applies custom className when provided', () => {
    const { container } = render(
      <SecurityChart
        data={mockData}
        type="bar"
        title="Security Alerts"
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles empty data gracefully', () => {
    render(
      <SecurityChart
        data={[]}
        type="bar"
        title="Security Alerts"
      />
    )

    // Should still render the chart container
    expect(screen.getByText('Security Alerts')).toBeInTheDocument()
  })
})
