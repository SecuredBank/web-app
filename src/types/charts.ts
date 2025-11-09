export interface TimeSeriesData {
  timestamp: number
  value: number
  label?: string
}

export interface SecurityAlert {
  id: string
  severity: AlertSeverity
  type: string
  description: string
  timestamp: number
  status: AlertStatus
  source: string
}

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'
export type AlertStatus = 'open' | 'investigating' | 'resolved' | 'dismissed'

export interface BaseProps {
  className?: string
}

export interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    name: string
    color: string
  }>
  label?: string | number
}

