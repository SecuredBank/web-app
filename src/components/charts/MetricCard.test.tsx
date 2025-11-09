import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MetricCard from './MetricCard'

describe('MetricCard', () => {
  const mockProps = {
    title: 'Total Alerts',
    value: '150',
    change: '+15%',
    changeType: 'increase' as const,
    description: 'Total security alerts in the last 24 hours',
    icon: 'bell'
  }

  it('renders metric card correctly', () => {
    render(<MetricCard {...mockProps} />)

    expect(screen.getByText(mockProps.title)).toBeInTheDocument()
    expect(screen.getByText(mockProps.value)).toBeInTheDocument()
    expect(screen.getByText(mockProps.change)).toBeInTheDocument()
    expect(screen.getByText(mockProps.description)).toBeInTheDocument()
  })

  it('applies correct color for increase', () => {
    render(<MetricCard {...mockProps} changeType="increase" />)
    
    const changeElement = screen.getByText(mockProps.change)
    expect(changeElement).toHaveClass('text-red-500')
  })

  it('applies correct color for decrease', () => {
    render(
      <MetricCard 
        {...mockProps} 
        change="-15%" 
        changeType="decrease" 
      />
    )
    
    const changeElement = screen.getByText('-15%')
    expect(changeElement).toHaveClass('text-green-500')
  })

  it('applies correct color for neutral change', () => {
    render(
      <MetricCard 
        {...mockProps} 
        change="0%" 
        changeType="neutral" 
      />
    )
    
    const changeElement = screen.getByText('0%')
    expect(changeElement).toHaveClass('text-gray-500')
  })

  it('renders custom icon', () => {
    render(<MetricCard {...mockProps} />)
    
    expect(screen.getByTestId('metric-icon')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<MetricCard {...mockProps} className="custom-class" />)
    
    expect(screen.getByTestId('metric-card')).toHaveClass('custom-class')
  })

  it('handles undefined change value', () => {
    const { change, ...propsWithoutChange } = mockProps
    render(<MetricCard {...propsWithoutChange} />)
    
    expect(screen.queryByTestId('change-indicator')).not.toBeInTheDocument()
  })

  it('handles undefined description', () => {
    const { description, ...propsWithoutDescription } = mockProps
    render(<MetricCard {...propsWithoutDescription} />)
    
    expect(screen.queryByText(mockProps.description)).not.toBeInTheDocument()
  })

  it('handles loading state', () => {
    render(<MetricCard {...mockProps} isLoading />)
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })

  it('formats large numbers correctly', () => {
    render(<MetricCard {...mockProps} value="1000000" />)
    
    expect(screen.getByText('1,000,000')).toBeInTheDocument()
  })

  it('shows tooltip on hover', async () => {
    render(<MetricCard {...mockProps} tooltip="Detailed information" />)
    
    const card = screen.getByTestId('metric-card')
    fireEvent.mouseEnter(card)
    
    await waitFor(() => {
      expect(screen.getByText('Detailed information')).toBeInTheDocument()
    })
  })
})
