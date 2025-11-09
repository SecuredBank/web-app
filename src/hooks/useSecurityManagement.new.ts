import { useState, useCallback, useEffect } from 'react'
import { SecurityIncident, SecurityMetric } from '../types/security'
import { createSecureHeaders } from '../utils/security'
import { calculateRiskScore, prioritizeIncidents } from '../utils/security'
import { useAuth } from '../contexts/AuthContext'

interface UseSecurityManagement {
  incidents: SecurityIncident[]
  metrics: SecurityMetric[]
  isLoading: boolean
  error: string | null
  activeIncidents: number
  criticalIncidents: number
  totalRiskScore: number
  createIncident: (incident: Omit<SecurityIncident, 'id'>) => Promise<void>
  updateIncident: (
    id: string,
    updates: Partial<SecurityIncident>
  ) => Promise<void>
  deleteIncident: (id: string) => Promise<void>
  refreshData: () => Promise<void>
}

export const useSecurityManagement = (): UseSecurityManagement => {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([])
  const [metrics, setMetrics] = useState<SecurityMetric[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { token } = useAuth()

  const fetchData = useCallback(async () => {
    if (!token) {
      setError('Authentication required')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const headers = createSecureHeaders(token)

      const [incidentsRes, metricsRes] = await Promise.all([
        fetch('/api/security/incidents', { headers }),
        fetch('/api/security/metrics', { headers }),
      ])

      if (!incidentsRes.ok || !metricsRes.ok) {
        throw new Error('Failed to fetch security data')
      }

      const [incidentsData, metricsData] = await Promise.all([
        incidentsRes.json(),
        metricsRes.json(),
      ])

      setIncidents(prioritizeIncidents(incidentsData))
      setMetrics(metricsData)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch security data'
      )
    } finally {
      setIsLoading(false)
    }
  }, [token])

  // Fetch data on mount and token change
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Computed values
  const activeIncidents = incidents.filter(
    i => i.status === 'open' || i.status === 'investigating'
  ).length

  const criticalIncidents = incidents.filter(
    i => i.severity === 'critical' && i.status !== 'closed'
  ).length

  const totalRiskScore = incidents.reduce(
    (total, incident) => total + calculateRiskScore(incident),
    0
  )

  // CRUD operations
  const createIncident = async (incident: Omit<SecurityIncident, 'id'>) => {
    if (!token) {
      throw new Error('Authentication required')
    }

    try {
      const response = await fetch('/api/security/incidents', {
        method: 'POST',
        headers: createSecureHeaders(token),
        body: JSON.stringify(incident),
      })

      if (!response.ok) {
        throw new Error('Failed to create incident')
      }

      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create incident')
      throw err
    }
  }

  const updateIncident = async (
    id: string,
    updates: Partial<SecurityIncident>
  ) => {
    if (!token) {
      throw new Error('Authentication required')
    }

    try {
      const response = await fetch(`/api/security/incidents/${id}`, {
        method: 'PATCH',
        headers: createSecureHeaders(token),
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update incident')
      }

      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update incident')
      throw err
    }
  }

  const deleteIncident = async (id: string) => {
    if (!token) {
      throw new Error('Authentication required')
    }

    try {
      const response = await fetch(`/api/security/incidents/${id}`, {
        method: 'DELETE',
        headers: createSecureHeaders(token),
      })

      if (!response.ok) {
        throw new Error('Failed to delete incident')
      }

      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete incident')
      throw err
    }
  }

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
    refreshData: fetchData,
  }
}
