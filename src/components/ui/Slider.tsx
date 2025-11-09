import { HTMLAttributes, forwardRef, useState } from 'react'
import { cn } from '@utils/cn'

interface SliderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  onChange?: (value: number) => void
  showValue?: boolean
  marks?: { value: number; label: string }[]
  orientation?: 'horizontal' | 'vertical'
}

const Slider = forwardRef<HTMLDivElement, SliderProps>(
  ({
    className,
    value = 0,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    onChange,
    showValue = false,
    marks = [],
    orientation = 'horizontal',
    ...props
  }, ref) => {
    const [isDragging, setIsDragging] = useState(false)
    const [internalValue, setInternalValue] = useState(value)

    const currentValue = isDragging ? internalValue : value

    const handleMouseDown = (e: React.MouseEvent) => {
      if (disabled) return
      setIsDragging(true)
      handleValueChange(e)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || disabled) return
      handleValueChange(e)
    }

    const handleMouseUp = () => {
      if (disabled) return
      setIsDragging(false)
      onChange?.(internalValue)
    }

    const handleValueChange = (e: React.MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const percentage = orientation === 'horizontal'
        ? (e.clientX - rect.left) / rect.width
        : 1 - (e.clientY - rect.top) / rect.height
      
      const newValue = Math.round(
        (min + (max - min) * Math.max(0, Math.min(1, percentage))) / step
      ) * step

      setInternalValue(newValue)
    }

    const percentage = ((currentValue - min) / (max - min)) * 100

    return (
      <div
        ref={ref}
        className={cn(
          'relative',
          orientation === 'vertical' && 'h-64 w-6',
          className
        )}
        {...props}
      >
        {/* Track */}
        <div
          className={cn(
            'relative rounded-full bg-secondary-200',
            orientation === 'horizontal' ? 'h-2 w-full' : 'w-2 h-full',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Progress */}
          <div
            className={cn(
              'absolute rounded-full bg-primary-600 transition-all duration-200',
              orientation === 'horizontal'
                ? 'h-full'
                : 'w-full bottom-0'
            )}
            style={{
              [orientation === 'horizontal' ? 'width' : 'height']: `${percentage}%`,
            }}
          />

          {/* Thumb */}
          <div
            className={cn(
              'absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2',
              'w-4 h-4 bg-white border-2 border-primary-600 rounded-full',
              'shadow-md transition-all duration-200',
              'hover:scale-110 focus:scale-110',
              disabled && 'cursor-not-allowed',
              orientation === 'vertical' && 'top-auto bottom-0 translate-y-1/2 translate-x-1/2'
            )}
            style={{
              [orientation === 'horizontal' ? 'left' : 'bottom']: `${percentage}%`,
            }}
          />

          {/* Marks */}
          {marks.map((mark) => {
            const markPercentage = ((mark.value - min) / (max - min)) * 100
            return (
              <div
                key={mark.value}
                className={cn(
                  'absolute transform -translate-x-1/2',
                  orientation === 'horizontal' ? 'top-6' : 'left-6'
                )}
                style={{
                  [orientation === 'horizontal' ? 'left' : 'bottom']: `${markPercentage}%`,
                }}
              >
                <div className="text-xs text-secondary-500 text-center">
                  {mark.label}
                </div>
              </div>
            )
          })}
        </div>

        {/* Value Display */}
        {showValue && (
          <div className="mt-2 text-center">
            <span className="text-sm font-medium text-secondary-700">
              {currentValue}
            </span>
          </div>
        )}
      </div>
    )
  }
)

Slider.displayName = 'Slider'

export default Slider

