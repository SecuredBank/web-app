import React, { useMemo } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts'
import { SecurityAlert, AlertSeverity, BaseProps, ChartTooltipProps } from '../../types/charts'

interface SecurityChartProps extends BaseProps {
  data: SecurityAlert[]
  type: 'bar' | 'pie' | 'stacked'
  title: string
  subtitle?: string
  height?: number
  width?: number
  showLegend?: boolean
  showValues?: boolean
  animate?: boolean
}

const severityColors = {
  low: '#22c55e',      // green-500
  medium: '#f59e0b',   // amber-500
  high: '#ef4444',     // red-500
  critical: '#dc2626', // red-600
}

const severityOrder = ['critical', 'high', 'medium', 'low']

export default function SecurityChart({ 
  data, 
  type = 'bar', 
  title,
  subtitle,
  height = 400,
  width = '100%',
  showLegend = true,
  showValues = true,
  animate = true,
  className
}: SecurityChartProps) {
  const chartData = useMemo(() => {
    // Process data for charts
    const severityCounts = data.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1
      return acc
    }, {} as Record<AlertSeverity, number>)

    // Sort data by severity order
    return severityOrder
      .map(severity => ({
        name: severity.charAt(0).toUpperCase() + severity.slice(1),
        value: severityCounts[severity as AlertSeverity] || 0,
        color: severityColors[severity as AlertSeverity],
      }))
      .filter(item => item.value > 0)
  }, [data])

  const CustomTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null

    return (
      <div className="bg-white/90 backdrop-blur-sm p-3 border border-secondary-200 rounded-lg shadow-lg dark:bg-secondary-800 dark:border-secondary-700">
        <p className="font-medium text-secondary-900 dark:text-secondary-100">
          {label}
        </p>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Count: <span className="font-medium">{payload[0].value}</span>
        </p>
      </div>
    )
  }

  // Common chart props
  const commonChartProps = {
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    className: "w-full",
  }

  const commonAxisProps = {
    stroke: '#64748b',
    fontSize: 12,
    tickLine: false,
  }

  return (
    <div className={`card p-6 ${className ?? ''}`}>
      <div className="flex flex-col space-y-2 mb-6">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            {subtitle}
          </p>
        )}
      </div>
      
      <div style={{ height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={chartData} {...commonChartProps}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e2e8f0" 
                opacity={0.5}
              />
              <XAxis 
                dataKey="name" 
                {...commonAxisProps}
              />
              <YAxis 
                {...commonAxisProps}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ fill: 'rgb(224 231 255 / 0.2)' }}
              />
              {showLegend && <Legend />}
              <Bar 
                dataKey="value" 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                label={showValues ? {
                  position: 'top',
                  fill: '#64748b',
                  fontSize: 12
                } : false}
                animationDuration={animate ? 1000 : 0}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          ) : type === 'pie' ? (
            <PieChart {...commonChartProps}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={showValues ? ({ name, percent }) => 
                  `${name} ${(percent * 100).toFixed(0)}%`
                : false}
                outerRadius={height / 3}
                innerRadius={type === 'donut' ? height / 6 : 0}
                fill="#8884d8"
                dataKey="value"
                animationDuration={animate ? 1000 : 0}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
            </PieChart>
          ) : (
            <BarChart data={chartData} {...commonChartProps}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e2e8f0" 
                opacity={0.5}
              />
              <XAxis 
                dataKey="name" 
                {...commonAxisProps}
              />
              <YAxis 
                {...commonAxisProps}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ fill: 'rgb(224 231 255 / 0.2)' }}
              />
              {showLegend && <Legend />}
              {severityOrder.map((severity, index) => (
                <Bar
                  key={severity}
                  dataKey={severity}
                  stackId="severity"
                  fill={severityColors[severity as AlertSeverity]}
                  radius={index === 0 ? [4, 4, 0, 0] : 0}
                  animationDuration={animate ? 1000 : 0}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

