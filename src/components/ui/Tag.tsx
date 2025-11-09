import { HTMLAttributes, forwardRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@utils/cn'

interface TagProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  closable?: boolean
  onClose?: () => void
  children: React.ReactNode
}

const Tag = forwardRef<HTMLDivElement, TagProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md', 
    closable = false,
    onClose,
    children,
    ...props 
  }, ref) => {
    const variants = {
      default: 'bg-secondary-100 text-secondary-800 border-secondary-200',
      primary: 'bg-primary-100 text-primary-800 border-primary-200',
      secondary: 'bg-secondary-200 text-secondary-800 border-secondary-300',
      success: 'bg-success-100 text-success-800 border-success-200',
      warning: 'bg-warning-100 text-warning-800 border-warning-200',
      danger: 'bg-danger-100 text-danger-800 border-danger-200',
    }
    
    const sizes = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-2.5 py-1.5 text-sm',
      lg: 'px-3 py-2 text-base',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border font-medium',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        <span>{children}</span>
        {closable && (
          <button
            type="button"
            onClick={onClose}
            className="ml-1.5 inline-flex items-center justify-center rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    )
  }
)

Tag.displayName = 'Tag'

export default Tag

