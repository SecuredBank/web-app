import { SecurityIncident, SecurityMetric, ComplianceReport } from '../types/security'

export const calculateRiskScore = (incident: SecurityIncident): number => {
  const severityWeights = {
    critical: 1.0,
    high: 0.8,
    medium: 0.5,
    low: 0.2
  }

  const statusMultipliers = {
    open: 1.0,
    investigating: 0.8,
    resolved: 0.2,
    closed: 0.1
  }

  const baseScore = severityWeights[incident.severity] * 100
  const timeWeight = calculateTimeWeight(incident.createdAt)
  const statusMultiplier = statusMultipliers[incident.status]
  const impactMultiplier = calculateImpactMultiplier(incident)

  return baseScore * timeWeight * statusMultiplier * impactMultiplier
}

const calculateTimeWeight = (createdAt: Date): number => {
  const now = new Date()
  const ageInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  return Math.max(0.1, Math.min(1, 1 - (ageInDays / 30)))
}

const calculateImpactMultiplier = (incident: SecurityIncident): number => {
  const systemsImpact = Math.min(1, incident.impactedSystems.length / 10)
  const userImpact = Math.min(1, incident.affectedUsers / 1000)
  return (systemsImpact + userImpact) / 2
}

export const aggregateSecurityMetrics = (metrics: SecurityMetric[]): Record<string, number> => {
  return metrics.reduce((acc, metric) => {
    acc[metric.name] = metric.value
    return acc
  }, {} as Record<string, number>)
}

export const calculateComplianceScore = (reports: ComplianceReport[]): number => {
  if (reports.length === 0) return 0

  const weights = {
    pci: 0.4,
    gdpr: 0.3,
    sox: 0.2,
    hipaa: 0.1
  }

  const weightedScores = reports.map(report => {
    const weight = weights[report.type] || 0.1
    return report.score * weight
  })

  return weightedScores.reduce((sum, score) => sum + score, 0)
}

export const categorizeIncidents = (incidents: SecurityIncident[]): Record<string, SecurityIncident[]> => {
  return incidents.reduce((acc, incident) => {
    if (!acc[incident.category]) {
      acc[incident.category] = []
    }
    acc[incident.category].push(incident)
    return acc
  }, {} as Record<string, SecurityIncident[]>)
}

export const prioritizeIncidents = (incidents: SecurityIncident[]): SecurityIncident[] => {
  return [...incidents].sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    const statusOrder = { open: 4, investigating: 3, resolved: 2, closed: 1 }
    
    // Compare severity first
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[b.severity] - severityOrder[a.severity]
    }
    
    // Then compare status
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[b.status] - statusOrder[a.status]
    }
    
    // Finally compare by date
    return b.createdAt.getTime() - a.createdAt.getTime()
  })
}

export const validateIncidentData = (incident: Partial<SecurityIncident>): string[] => {
  const errors: string[] = []

  if (!incident.title?.trim()) {
    errors.push('Title is required')
  }

  if (!incident.description?.trim()) {
    errors.push('Description is required')
  }

  if (!incident.severity || !['critical', 'high', 'medium', 'low'].includes(incident.severity)) {
    errors.push('Valid severity level is required')
  }

  if (!incident.category) {
    errors.push('Incident category is required')
  }

  if (!Array.isArray(incident.impactedSystems) || incident.impactedSystems.length === 0) {
    errors.push('At least one impacted system must be specified')
  }

  return errors
}