import { ReactNode, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@utils/cn'
import { useClickOutside } from '@hooks/useClickOutside'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  disabled?: boolean
  className?: string
}

export default function Tooltip({
  content,
  children,
  placement = 'top',
  delay = 200,
  disabled = false,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useClickOutside(tooltipRef, () => {
    if (isVisible) {
      setIsVisible(false)
    }
  })

  const showTooltip = () => {
    if (disabled) return

    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        const tooltipRect = tooltipRef.current?.getBoundingClientRect()
        
        let top = 0
        let left = 0

        switch (placement) {
          case 'top':
            top = rect.top - (tooltipRect?.height || 0) - 8
            left = rect.left + rect.width / 2 - (tooltipRect?.width || 0) / 2
            break
          case 'bottom':
            top = rect.bottom + 8
            left = rect.left + rect.width / 2 - (tooltipRect?.width || 0) / 2
            break
          case 'left':
            top = rect.top + rect.height / 2 - (tooltipRect?.height || 0) / 2
            left = rect.left - (tooltipRect?.width || 0) - 8
            break
          case 'right':
            top = rect.top + rect.height / 2 - (tooltipRect?.height || 0) / 2
            left = rect.right + 8
            break
        }

        setPosition({ top, left })
        setIsVisible(true)
      }
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const placementClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-secondary-900',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-secondary-900',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-secondary-900',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-secondary-900',
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>

      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          className={cn(
            'absolute z-50 px-3 py-2 text-sm text-white bg-secondary-900 rounded-md shadow-lg',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            placementClasses[placement],
            className
          )}
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          {content}
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-0 h-0 border-4 border-transparent',
              arrowClasses[placement]
            )}
          />
        </div>,
        document.body
      )}
    </>
  )
}

