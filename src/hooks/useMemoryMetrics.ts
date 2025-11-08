import { useEffect, useState } from 'react'

export interface MemoryMetrics {
  usedJSHeapSize: number | null
  totalJSHeapSize: number | null
  jsHeapSizeLimit: number | null
}

export const useMemoryMetrics = (interval = 5000) => {
  const [metrics, setMetrics] = useState<MemoryMetrics>({
    usedJSHeapSize: null,
    totalJSHeapSize: null,
    jsHeapSizeLimit: null,
  })

  useEffect(() => {
    const updateMemoryMetrics = () => {
      if ('performance' in window && 'memory' in (performance as any)) {
        const memory = (performance as any).memory
        setMetrics({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        })
      }
    }

    // Initial update
    updateMemoryMetrics()

    // Set up periodic updates
    const intervalId = setInterval(updateMemoryMetrics, interval)

    return () => {
      clearInterval(intervalId)
    }
  }, [interval])

  const memoryUsagePercentage =
    metrics.usedJSHeapSize && metrics.totalJSHeapSize
      ? (metrics.usedJSHeapSize / metrics.totalJSHeapSize) * 100
      : null

  return {
    metrics,
    memoryUsagePercentage,
    isSupported: 'performance' in window && 'memory' in (performance as any),
  }
}
