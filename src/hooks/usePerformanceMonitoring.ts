import { useRef, useEffect } from 'react'

interface PerformanceMetrics {
  operationStart: number
  operationDuration: number
  memoryUsage: number | null
  renderCount: number
  lastOperation: string
}

interface UsePerformanceMonitoringOptions {
  threshold?: number
  enableMemoryMetrics?: boolean
  onThresholdExceeded?: (metrics: PerformanceMetrics) => void
}

export function usePerformanceMonitoring(
  componentName: string,
  options: UsePerformanceMonitoringOptions = {}
) {
  const {
    threshold = 16.67, // ~60fps
    enableMemoryMetrics = false,
    onThresholdExceeded,
  } = options

  const metrics = useRef<PerformanceMetrics>({
    operationStart: 0,
    operationDuration: 0,
    memoryUsage: null,
    renderCount: 0,
    lastOperation: '',
  })

  const startOperation = (operationName: string) => {
    metrics.current.operationStart = performance.now()
    metrics.current.lastOperation = operationName

    // Track memory if available and enabled
    if (enableMemoryMetrics && (performance as any).memory) {
      metrics.current.memoryUsage = (performance as any).memory.usedJSHeapSize
    }
  }

  const endOperation = () => {
    const endTime = performance.now()
    const duration = endTime - metrics.current.operationStart
    metrics.current.operationDuration = duration
    metrics.current.renderCount++

    if (duration > threshold && onThresholdExceeded) {
      onThresholdExceeded(metrics.current)
    }

    // Log performance data
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Performance Metrics:`, {
        operation: metrics.current.lastOperation,
        duration: `${duration.toFixed(2)}ms`,
        renderCount: metrics.current.renderCount,
        memoryUsage: metrics.current.memoryUsage
          ? `${(metrics.current.memoryUsage / 1048576).toFixed(2)}MB`
          : 'Not available',
      })
    }
  }

  // Reset metrics when component unmounts
  useEffect(() => {
    return () => {
      metrics.current = {
        operationStart: 0,
        operationDuration: 0,
        memoryUsage: null,
        renderCount: 0,
        lastOperation: '',
      }
    }
  }, [])

  return {
    startOperation,
    endOperation,
    getMetrics: () => ({ ...metrics.current }),
  }
}

