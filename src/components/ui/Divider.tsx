import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@utils/cn'

interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  variant?: 'solid' | 'dashed' | 'dotted'
  thickness?: 'thin' | 'medium' | 'thick'
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  label?: string
  labelPosition?: 'left' | 'center' | 'right'
}

const Divider = forwardRef<HTMLDivElement, DividerProps>(
  ({ 
    className, 
    orientation = 'horizontal',
    variant = 'solid',
    thickness = 'thin',
    color = 'default',
    label,
    labelPosition = 'center',
    ...props 
  }, ref) => {
    const orientationClasses = {
      horizontal: 'w-full',
      vertical: 'h-full w-px',
    }

    const variantClasses = {
      solid: 'border-solid',
      dashed: 'border-dashed',
      dotted: 'border-dotted',
    }

    const thicknessClasses = {
      thin: 'border-t',
      medium: 'border-t-2',
      thick: 'border-t-4',
    }

    const colorClasses = {
      default: 'border-secondary-200',
      primary: 'border-primary-200',
      secondary: 'border-secondary-300',
      success: 'border-success-200',
      warning: 'border-warning-200',
      danger: 'border-danger-200',
    }

    const labelPositionClasses = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
    }

    if (orientation === 'vertical') {
      return (
        <div
          ref={ref}
          className={cn(
            'border-l border-secondary-200',
            variantClasses[variant],
            colorClasses[color],
            className
          )}
          {...props}
        />
      )
    }

    if (label) {
      return (
        <div
          ref={ref}
          className={cn(
            'relative flex items-center',
            labelPositionClasses[labelPosition],
            className
          )}
          {...props}
        >
          <div className="flex-grow">
            <div
              className={cn(
                'border-t',
                variantClasses[variant],
                thicknessClasses[thickness],
                colorClasses[color]
              )}
            />
          </div>
          <div className="px-3 text-sm text-secondary-500 bg-white">
            {label}
          </div>
          <div className="flex-grow">
            <div
              className={cn(
                'border-t',
                variantClasses[variant],
                thicknessClasses[thickness],
                colorClasses[color]
              )}
            />
          </div>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          'border-t',
          variantClasses[variant],
          thicknessClasses[thickness],
          colorClasses[color],
          className
        )}
        {...props}
      />
    )
  }
)

Divider.displayName = 'Divider'

export default Divider
