import { renderHook } from '@testing-library/react-hooks'
import { useMonitoring } from '../hooks/useMonitoring'

describe('useMonitoring', () => {
  it('should return monitoring data', () => {
    const { result } = renderHook(() =>
      useMonitoring({
        componentName: 'TestComponent',
        memoryInterval: 1000,
        securityThreshold: 50,
        enableMemoryMetrics: true,
        securityBatchSize: 10,
        securityBatchDelay: 50,
      })
    )

    expect(result.current).toHaveProperty('performance')
    expect(result.current).toHaveProperty('memory')
    expect(result.current).toHaveProperty('security')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('hasError')
  })

  it('should handle performance monitoring', () => {
    const { result } = renderHook(() =>
      useMonitoring({
        componentName: 'TestComponent',
      })
    )

    expect(result.current.performance).toHaveProperty('metrics')
    expect(result.current.performance).toHaveProperty('isLoading')
    expect(result.current.performance).toHaveProperty('hasError')
  })

  it('should track memory metrics when supported', () => {
    const { result } = renderHook(() =>
      useMonitoring({
        componentName: 'TestComponent',
        enableMemoryMetrics: true,
      })
    )

    expect(result.current.memory).toHaveProperty('metrics')
    expect(result.current.memory).toHaveProperty('memoryUsagePercentage')
    expect(result.current.memory).toHaveProperty('isSupported')
  })

  it('should handle security performance tracking', () => {
    const { result } = renderHook(() =>
      useMonitoring({
        componentName: 'TestComponent',
        securityThreshold: 100,
      })
    )

    expect(result.current.security).toHaveProperty('metrics')
    expect(result.current.security).toHaveProperty('queueOperation')
    expect(result.current.security).toHaveProperty('trackOperation')
    expect(result.current.security).toHaveProperty('cleanup')
    expect(result.current.security).toHaveProperty('pendingOperationsCount')
  })
})
