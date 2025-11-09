import { useState, useCallback, useEffect } from 'react'
import { SecurityIncident, SecurityMetric } from '../types/security'
import { useApi } from './useApi'
import { calculateRiskScore, prioritizeIncidents } from '../utils/security'

interface UseSecurityManagement {
  incidents: SecurityIncident[]
  metrics: SecurityMetric[]
  isLoading: boolean
  error: string | null
  activeIncidents: number
  criticalIncidents: number
  totalRiskScore: number
  createIncident: (incident: Omit<SecurityIncident, 'id'>) => Promise<void>
  updateIncident: (id: string, updates: Partial<SecurityIncident>) => Promise<void>
  deleteIncident: (id: string) => Promise<void>
  refreshData: () => Promise<void>
}

export const useSecurityManagement = (): UseSecurityManagement => {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([])
  const [metrics, setMetrics] = useState<SecurityMetric[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const api = useApi()

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [incidentsData, metricsData] = await Promise.all([
        api.get<SecurityIncident[]>('/api/security/incidents'),
        api.get<SecurityMetric[]>('/api/security/metrics')
      ])

      setIncidents(prioritizeIncidents(incidentsData))
      setMetrics(metricsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch security data')
    } finally {
      setIsLoading(false)
    }
  }, [api])

  useEffect(() => {
    fetchData()

    // Set up real-time updates if available
    const eventSource = new EventSource('/api/security/events')
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'incident_update') {
        fetchData()
      }
    }

    return () => {
      eventSource.close()
    }
  }, [fetchData])

  const createIncident = async (incident: Omit<SecurityIncident, 'id'>) => {
    try {
      const response = await api.post<SecurityIncident>('/api/security/incidents', incident)
      setIncidents(prev => prioritizeIncidents([...prev, response]))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create incident')
      throw err
    }
  }

  const updateIncident = async (id: string, updates: Partial<SecurityIncident>) => {
    try {
      const response = await api.patch<SecurityIncident>(`/api/security/incidents/${id}`, updates)
      setIncidents(prev =>
        prioritizeIncidents(prev.map(incident =>
          incident.id === id ? { ...incident, ...response } : incident
        ))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update incident')
      throw err
    }
  }

  const deleteIncident = async (id: string) => {
    try {
      await api.delete(`/api/security/incidents/${id}`)
      setIncidents(prev => prev.filter(incident => incident.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete incident')
      throw err
    }
  }

  const activeIncidents = incidents.filter(i => i.status !== 'closed').length
  const criticalIncidents = incidents.filter(i => i.severity === 'critical' && i.status !== 'closed').length
  const totalRiskScore = incidents.reduce((total, incident) => total + calculateRiskScore(incident), 0)

  return {
    incidents,
    metrics,
    isLoading,
    error,
    activeIncidents,
    criticalIncidents,
    totalRiskScore,
    createIncident,
    updateIncident,
    deleteIncident,
    refreshData: fetchData
  }
}
