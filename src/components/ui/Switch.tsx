import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@utils/cn'

interface SwitchProps extends Omit<HTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ 
    className, 
    label, 
    description, 
    size = 'md',
    variant = 'default',
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'h-4 w-7',
      md: 'h-5 w-9',
      lg: 'h-6 w-11',
    }

    const thumbSizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    }

    const variantClasses = {
      default: 'peer-checked:bg-primary-600',
      success: 'peer-checked:bg-success-600',
      warning: 'peer-checked:bg-warning-600',
      danger: 'peer-checked:bg-danger-600',
    }

    return (
      <div className="flex items-start space-x-3">
        <div className="relative inline-flex items-center">
          <input
            type="checkbox"
            ref={ref}
            className={cn(
              'peer sr-only',
              className
            )}
            {...props}
          />
          <div
            className={cn(
              'relative rounded-full bg-secondary-200 transition-colors duration-200 ease-in-out',
              'peer-checked:bg-primary-600 peer-focus:ring-4 peer-focus:ring-primary-300',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
              sizeClasses[size],
              variantClasses[variant]
            )}
          >
            <div
              className={cn(
                'absolute top-0.5 left-0.5 bg-white rounded-full transition-transform duration-200 ease-in-out',
                'peer-checked:translate-x-4 peer-checked:translate-x-3 peer-checked:translate-x-5',
                thumbSizeClasses[size],
                size === 'sm' && 'peer-checked:translate-x-3',
                size === 'md' && 'peer-checked:translate-x-4',
                size === 'lg' && 'peer-checked:translate-x-5'
              )}
            />
          </div>
        </div>
        
        {(label || description) && (
          <div className="flex-1">
            {label && (
              <label
                htmlFor={props.id}
                className="text-sm font-medium text-secondary-700 cursor-pointer"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-secondary-500 mt-1">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)

Switch.displayName = 'Switch'

export default Switch

