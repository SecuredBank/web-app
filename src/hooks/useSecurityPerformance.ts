import { useCallback, useRef, useMemo } from 'react'
import { usePerformanceMonitoring } from './usePerformanceMonitoring'

interface SecurityPerformanceOptions {
  componentName: string
  threshold?: number
  enableMemoryMetrics?: boolean
  batchSize?: number
  batchDelay?: number
}

export function useSecurityPerformance({
  componentName,
  threshold = 100,
  enableMemoryMetrics = process.env.NODE_ENV === 'development',
  batchSize = 50,
  batchDelay = 100,
}: SecurityPerformanceOptions) {
  const metrics = usePerformanceMonitoring(componentName, {
    threshold,
    enableMemoryMetrics,
    onThresholdExceeded: metrics => {
      console.warn(
        `[${componentName}] Performance threshold exceeded:`,
        metrics
      )
    },
  })

  const pendingOperations = useRef<Set<() => Promise<void>>>(new Set())
  const batchTimeout = useRef<number>()

  const processBatch = useCallback(async () => {
    metrics.startOperation('processBatch')
    const operations = Array.from(pendingOperations.current).slice(0, batchSize)
    pendingOperations.current = new Set(
      Array.from(pendingOperations.current).slice(batchSize)
    )

    try {
      await Promise.all(operations.map(op => op()))
    } catch (error) {
      console.error(`[${componentName}] Batch operation error:`, error)
    }

    if (pendingOperations.current.size > 0) {
      batchTimeout.current = window.setTimeout(
        () => void processBatch(),
        batchDelay
      )
    }

    metrics.endOperation()
  }, [metrics, batchSize, batchDelay, componentName])

  const queueOperation = useCallback(
    (operation: () => Promise<void>) => {
      pendingOperations.current.add(operation)

      if (batchTimeout.current) {
        window.clearTimeout(batchTimeout.current)
      }

      if (pendingOperations.current.size >= batchSize) {
        void processBatch()
      } else {
        batchTimeout.current = window.setTimeout(
          () => void processBatch(),
          batchDelay
        )
      }
    },
    [processBatch, batchSize, batchDelay]
  )

  const trackOperation = useCallback(
    <T>(name: string, operation: () => Promise<T>) => {
      metrics.startOperation(name)
      return operation().finally(() => {
        metrics.endOperation()
      })
    },
    [metrics]
  )

  const cleanup = useCallback(() => {
    if (batchTimeout.current) {
      window.clearTimeout(batchTimeout.current)
    }
    pendingOperations.current.clear()
  }, [])

  return useMemo(
    () => ({
      metrics,
      queueOperation,
      trackOperation,
      cleanup,
      pendingOperationsCount: () => pendingOperations.current.size,
    }),
    [metrics, queueOperation, trackOperation, cleanup]
  )
}

