import React from 'react'
import { useSecurityMonitoring } from '../hooks/useSecurityMonitoring'
import { SecuritySeverity } from '../types/security'

interface SecurityBadgeProps {
  severity: SecuritySeverity
  score: number
}

const SecurityBadge: React.FC<SecurityBadgeProps> = ({ severity, score }) => {
  const bgColor = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  }[severity]

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
      Security Score: {score}
    </span>
  )
}

export const SecurityIndicator: React.FC = () => {
  const { securityStatus } = useSecurityMonitoring()

  return (
    <div className="flex items-center space-x-4">
      <SecurityBadge 
        severity={securityStatus.threatLevel} 
        score={securityStatus.score} 
      />
      {securityStatus.threatLevel !== 'low' && (
        <div className="text-sm text-red-600">
          {securityStatus.recentEvents[0]?.message}
        </div>
      )}
    </div>
  )
}

export const SecurityEventsList: React.FC = () => {
  const { securityStatus } = useSecurityMonitoring()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Security Events</h3>
      <div className="space-y-2">
        {securityStatus.recentEvents.map((event, index) => (
          <div 
            key={index}
            className={`p-4 rounded-lg ${
              event.severity === 'critical' ? 'bg-red-50 text-red-700' :
              event.severity === 'high' ? 'bg-orange-50 text-orange-700' :
              event.severity === 'medium' ? 'bg-yellow-50 text-yellow-700' :
              'bg-green-50 text-green-700'
            }`}
          >
            <div className="flex justify-between">
              <span className="font-medium">{event.type}</span>
              <span className="text-sm">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="mt-1 text-sm">{event.message}</p>
          </div>
        ))}
      </div>
    </div>
  )
}