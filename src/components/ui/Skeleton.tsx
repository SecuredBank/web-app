import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@utils/cn'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ 
    className, 
    variant = 'rectangular', 
    width, 
    height, 
    animation = 'pulse',
    ...props 
  }, ref) => {
    const variants = {
      text: 'h-4 w-full',
      circular: 'rounded-full',
      rectangular: 'rounded-md',
    }

    const animations = {
      pulse: 'animate-pulse',
      wave: 'animate-wave',
      none: '',
    }

    const style = {
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
    }

    return (
      <div
        ref={ref}
        className={cn(
          'bg-secondary-200',
          variants[variant],
          animations[animation],
          className
        )}
        style={style}
        {...props}
      />
    )
  }
)

Skeleton.displayName = 'Skeleton'

// Predefined skeleton components
export const SkeletonText = ({ lines = 3, className }: { lines?: number; className?: string }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        height={16}
        width={i === lines - 1 ? '75%' : '100%'}
      />
    ))}
  </div>
)

export const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn('card p-6 space-y-4', className)}>
    <div className="flex items-center space-x-4">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="space-y-2 flex-1">
        <Skeleton height={16} width="60%" />
        <Skeleton height={14} width="40%" />
      </div>
    </div>
    <SkeletonText lines={2} />
    <div className="flex space-x-2">
      <Skeleton height={32} width={80} />
      <Skeleton height={32} width={100} />
    </div>
  </div>
)

export const SkeletonTable = ({ rows = 5, className }: { rows?: number; className?: string }) => (
  <div className={cn('space-y-3', className)}>
    {/* Header */}
    <div className="flex space-x-4">
      <Skeleton height={20} width="20%" />
      <Skeleton height={20} width="30%" />
      <Skeleton height={20} width="25%" />
      <Skeleton height={20} width="25%" />
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-4">
        <Skeleton height={16} width="20%" />
        <Skeleton height={16} width="30%" />
        <Skeleton height={16} width="25%" />
        <Skeleton height={16} width="25%" />
      </div>
    ))}
  </div>
)

export default Skeleton

