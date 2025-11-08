import { usePerformanceMetrics } from './usePerformanceMetrics'
import { useSecurityPerformance } from './useSecurityPerformance'
import { useMemoryMetrics } from './useMemoryMetrics'

export type MonitoringConfig = {
  componentName: string
  memoryInterval?: number
  securityThreshold?: number
  enableMemoryMetrics?: boolean
  securityBatchSize?: number
  securityBatchDelay?: number
}

export const useMonitoring = ({
  componentName,
  memoryInterval = 5000,
  securityThreshold = 100,
  enableMemoryMetrics = process.env.NODE_ENV === 'development',
  securityBatchSize = 50,
  securityBatchDelay = 100,
}: MonitoringConfig) => {
  const performance = usePerformanceMetrics()
  const memory = useMemoryMetrics(memoryInterval)
  const security = useSecurityPerformance({
    componentName,
    threshold: securityThreshold,
    enableMemoryMetrics,
    batchSize: securityBatchSize,
    batchDelay: securityBatchDelay,
  })

  return {
    performance,
    memory,
    security,
    isLoading: performance.isLoading || !memory.isSupported,
    hasError: performance.hasError || security.metrics.hasError,
  }
}
