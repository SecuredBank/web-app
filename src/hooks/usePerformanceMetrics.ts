import { useEffect, useState } from 'react'
import { onCLS, onFID, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals'

export type PerformanceMetrics = {
  cls: number | null // Cumulative Layout Shift
  fid: number | null // First Input Delay
  fcp: number | null // First Contentful Paint
  lcp: number | null // Largest Contentful Paint
  ttfb: number | null // Time to First Byte
}

export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cls: null,
    fid: null,
    fcp: null,
    lcp: null,
    ttfb: null,
  })

  useEffect(() => {
    // Helper function to update metrics
    const updateMetric =
      (metricName: keyof PerformanceMetrics) => (metric: Metric) => {
        setMetrics(prev => ({
          ...prev,
          [metricName]: metric.value,
        }))
      }

    // Register web vitals metrics
    onCLS(updateMetric('cls'))
    onFID(updateMetric('fid'))
    onFCP(updateMetric('fcp'))
    onLCP(updateMetric('lcp'))
    onTTFB(updateMetric('ttfb'))
  }, [])

  return {
    metrics,
    isLoading: Object.values(metrics).every(m => m === null),
    hasError: Object.values(metrics).some(m => m === undefined),
  }
}
