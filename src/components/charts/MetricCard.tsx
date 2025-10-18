import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@utils/cn'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'stable'
  icon?: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'danger'
  description?: string
}

export default function MetricCard({
  title,
  value,
  change,
  trend,
  icon,
  color = 'primary',
  description,
}: MetricCardProps) {
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
    <div className="card p-6 hover:shadow-elevated transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-secondary-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-secondary-900">{value}</p>
          {description && (
            <p className="text-xs text-secondary-500 mt-1">{description}</p>
          )}
        </div>
        {icon && (
          <div className={cn('p-3 rounded-lg', colorClasses[color])}>
            {icon}
          </div>
        )}
      </div>
      
      {change !== undefined && trend && (
        <div className="mt-4 flex items-center">
          {trendIcons[trend]}
          <span className={cn(
            'ml-2 text-sm font-medium',
            trend === 'up' ? 'text-success-600' : 
            trend === 'down' ? 'text-danger-600' : 'text-secondary-600'
          )}>
            {change > 0 ? '+' : ''}{change}%
          </span>
          <span className="ml-1 text-sm text-secondary-500">vs last period</span>
        </div>
      )}
    </div>
  )
}
