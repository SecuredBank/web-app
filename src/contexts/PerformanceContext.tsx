import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react'

interface PerformanceMetrics {
  // Navigation and loading metrics
  navigationStart: number
  loadComplete: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  firstInputDelay: number
  cumulativeLayoutShift: number
  
  // Resource metrics
  resourceCount: number
  resourceSize: number
  
  // Runtime metrics
  javaScriptTime: number
  renderTime: number
  layoutTime: number
  
  // Memory metrics
  memoryUsage: number
  domNodes: number
}

interface PerformanceContextType {
  metrics: PerformanceMetrics
  isOptimized: boolean
  enableOptimizations: () => void
  disableOptimizations: () => void
  measurePerformance: (name: string) => () => void
  logMetrics: () => void
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined)

export function PerformanceProvider({ children }: { children: ReactNode }) {
  const metricsRef = useRef<PerformanceMetrics>({
    navigationStart: 0,
    loadComplete: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    cumulativeLayoutShift: 0,
    resourceCount: 0,
    resourceSize: 0,
    javaScriptTime: 0,
    renderTime: 0,
    layoutTime: 0,
    memoryUsage: 0,
    domNodes: 0,
  })
  
  const optimizedRef = useRef(true)
  const [isOptimized, setIsOptimized] = useState(true)

  // Initialize performance observers
  useEffect(() => {
    // Performance Observer for Layout Shifts
    const observeCLS = new PerformanceObserver((entries) => {
      entries.getEntries().forEach((entry: any) => {
        metricsRef.current.cumulativeLayoutShift += entry.value
      })
    })
    
    // Performance Observer for Largest Contentful Paint
    const observeLCP = new PerformanceObserver((entries) => {
      entries.getEntries().forEach((entry) => {
        metricsRef.current.largestContentfulPaint = entry.startTime
      })
    })
    
    // Performance Observer for First Input Delay
    const observeFID = new PerformanceObserver((entries) => {
      entries.getEntries().forEach((entry: any) => {
        if (!metricsRef.current.firstInputDelay && entry.processingStart) {
          metricsRef.current.firstInputDelay = entry.processingStart - entry.startTime
        }
      })
    })

    try {
      observeCLS.observe({ entryTypes: ['layout-shift'] })
      observeLCP.observe({ entryTypes: ['largest-contentful-paint'] })
      observeFID.observe({ entryTypes: ['first-input'] })
    } catch (e) {
      console.warn('Performance metrics not fully supported:', e)
    }

    return () => {
      observeCLS.disconnect()
      observeLCP.disconnect()
      observeFID.disconnect()
    }
  }, [])

  // Collect basic metrics on load
  useEffect(() => {
    const collectInitialMetrics = () => {
      const timing = performance.timing
      metricsRef.current.navigationStart = timing.navigationStart
      metricsRef.current.loadComplete = timing.loadEventEnd - timing.navigationStart
      
      // Resource metrics
      const resources = performance.getEntriesByType('resource')
      metricsRef.current.resourceCount = resources.length
      metricsRef.current.resourceSize = resources.reduce(
        (total, resource: any) => total + (resource.encodedBodySize || 0),
        0
      )
      
      // DOM metrics
      metricsRef.current.domNodes = document.getElementsByTagName('*').length
      
      // Memory metrics if available
      try {
        // Try to access memory info (Chrome only)
        const memory = (performance as any).memory
        if (memory) {
          metricsRef.current.memoryUsage = memory.usedJSHeapSize
        }
      } catch {
        // Memory API not available
        metricsRef.current.memoryUsage = 0
      }
    }

    window.addEventListener('load', collectInitialMetrics)
    return () => window.removeEventListener('load', collectInitialMetrics)
  }, [])

  // Performance measurement utility
  const measurePerformance = useCallback((name: string) => {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      performance.mark(`${name}-end`)
      performance.measure(name, {
        start,
        duration,
        detail: { timestamp: new Date().toISOString() }
      })
    }
  }, [])

  // Optimization controls
  const enableOptimizations = useCallback(() => {
    setIsOptimized(true)
    document.documentElement.classList.add('optimized')
  }, [])

  const disableOptimizations = useCallback(() => {
    setIsOptimized(false)
    document.documentElement.classList.remove('optimized')
  }, [])

  // Logging utility
  const logMetrics = useCallback(() => {
    console.table({
      'Navigation Time': `${metricsRef.current.loadComplete}ms`,
      'First Contentful Paint': `${metricsRef.current.firstContentfulPaint}ms`,
      'Largest Contentful Paint': `${metricsRef.current.largestContentfulPaint}ms`,
      'First Input Delay': `${metricsRef.current.firstInputDelay}ms`,
      'Cumulative Layout Shift': metricsRef.current.cumulativeLayoutShift,
      'Resource Count': metricsRef.current.resourceCount,
      'Resource Size': `${Math.round(metricsRef.current.resourceSize / 1024)}KB`,
      'DOM Nodes': metricsRef.current.domNodes,
      'Memory Usage': `${Math.round(metricsRef.current.memoryUsage / 1024 / 1024)}MB`
    })
  }, [])

  const value = {
    metrics: metricsRef.current,
    isOptimized,
    enableOptimizations,
    disableOptimizations,
    measurePerformance,
    logMetrics,
  }

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  )
}

export function usePerformance() {
  const context = useContext(PerformanceContext)
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider')
  }
  return context
}