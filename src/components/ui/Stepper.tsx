import { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@utils/cn'

interface StepperStep {
  id: string
  title: string
  description?: string
  icon?: ReactNode
  completed?: boolean
  current?: boolean
  disabled?: boolean
}

interface StepperProps {
  steps: StepperStep[]
  orientation?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Stepper({
  steps,
  orientation = 'horizontal',
  size = 'md',
  className,
}: StepperProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  }

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  if (orientation === 'vertical') {
    return (
      <div className={cn('space-y-4', className)}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start space-x-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex items-center justify-center rounded-full border-2 transition-colors',
                  sizeClasses[size],
                  step.completed
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : step.current
                    ? 'border-primary-600 text-primary-600 bg-white'
                    : step.disabled
                    ? 'border-secondary-300 text-secondary-400 bg-white'
                    : 'border-secondary-300 text-secondary-600 bg-white'
                )}
              >
                {step.completed ? (
                  <Check className={iconSizeClasses[size]} />
                ) : step.icon ? (
                  step.icon
                ) : (
                  <span className="font-medium">{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 h-8 mt-2',
                    step.completed ? 'bg-primary-600' : 'bg-secondary-300'
                  )}
                />
              )}
            </div>
            <div className="flex-1 pb-8">
              <h3
                className={cn(
                  'font-medium',
                  step.disabled
                    ? 'text-secondary-400'
                    : step.current || step.completed
                    ? 'text-secondary-900'
                    : 'text-secondary-600'
                )}
              >
                {step.title}
              </h3>
              {step.description && (
                <p className="text-sm text-secondary-500 mt-1">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex items-center justify-center rounded-full border-2 transition-colors',
                  sizeClasses[size],
                  step.completed
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : step.current
                    ? 'border-primary-600 text-primary-600 bg-white'
                    : step.disabled
                    ? 'border-secondary-300 text-secondary-400 bg-white'
                    : 'border-secondary-300 text-secondary-600 bg-white'
                )}
              >
                {step.completed ? (
                  <Check className={iconSizeClasses[size]} />
                ) : step.icon ? (
                  step.icon
                ) : (
                  <span className="font-medium">{index + 1}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <h3
                  className={cn(
                    'text-sm font-medium',
                    step.disabled
                      ? 'text-secondary-400'
                      : step.current || step.completed
                      ? 'text-secondary-900'
                      : 'text-secondary-600'
                  )}
                >
                  {step.title}
                </h3>
                {step.description && (
                  <p className="text-xs text-secondary-500 mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-4',
                  step.completed ? 'bg-primary-600' : 'bg-secondary-300'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
