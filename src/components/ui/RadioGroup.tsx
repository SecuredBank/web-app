import { ReactNode, forwardRef } from 'react'
import { cn } from '@utils/cn'

interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface RadioGroupProps {
  options: RadioOption[]
  value?: string
  onChange: (value: string) => void
  name: string
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ options, value, onChange, name, orientation = 'vertical', className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'space-y-3',
          orientation === 'horizontal' && 'flex flex-wrap gap-6',
          className
        )}
      >
        {options.map((option) => (
          <div
            key={option.value}
            className={cn(
              'flex items-start space-x-3',
              orientation === 'horizontal' && 'flex-col space-x-0 space-y-2'
            )}
          >
            <div className="flex items-center">
              <input
                type="radio"
                id={`${name}-${option.value}`}
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => !option.disabled && onChange(option.value)}
                disabled={option.disabled}
                className={cn(
                  'h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300',
                  option.disabled && 'opacity-50 cursor-not-allowed'
                )}
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor={`${name}-${option.value}`}
                className={cn(
                  'text-sm font-medium text-secondary-700 cursor-pointer',
                  option.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {option.label}
              </label>
              {option.description && (
                <p className="text-sm text-secondary-500 mt-1">
                  {option.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }
)

RadioGroup.displayName = 'RadioGroup'

export default RadioGroup

