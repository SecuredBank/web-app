import { HTMLAttributes, forwardRef } from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@utils/cn'
import Button from './Button'

interface PaginationProps extends HTMLAttributes<HTMLDivElement> {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  showPrevNext?: boolean
  maxVisiblePages?: number
  size?: 'sm' | 'md' | 'lg'
}

const Pagination = forwardRef<HTMLDivElement, PaginationProps>(
  ({
    currentPage,
    totalPages,
    onPageChange,
    showFirstLast = true,
    showPrevNext = true,
    maxVisiblePages = 5,
    size = 'md',
    className,
    ...props
  }, ref) => {
    const sizeClasses = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
    }

    const getVisiblePages = () => {
      const pages: (number | string)[] = []
      const half = Math.floor(maxVisiblePages / 2)
      
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        let start = Math.max(1, currentPage - half)
        let end = Math.min(totalPages, start + maxVisiblePages - 1)
        
        if (end - start + 1 < maxVisiblePages) {
          start = Math.max(1, end - maxVisiblePages + 1)
        }
        
        if (start > 1) {
          pages.push(1)
          if (start > 2) {
            pages.push('...')
          }
        }
        
        for (let i = start; i <= end; i++) {
          pages.push(i)
        }
        
        if (end < totalPages) {
          if (end < totalPages - 1) {
            pages.push('...')
          }
          pages.push(totalPages)
        }
      }
      
      return pages
    }

    const visiblePages = getVisiblePages()

    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-center space-x-1', className)}
        {...props}
      >
        {/* First Page */}
        {showFirstLast && currentPage > 1 && (
          <Button
            variant="ghost"
            size={size}
            onClick={() => onPageChange(1)}
            className="hidden sm:flex"
          >
            First
          </Button>
        )}

        {/* Previous Page */}
        {showPrevNext && currentPage > 1 && (
          <Button
            variant="ghost"
            size={size}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}

        {/* Page Numbers */}
        {visiblePages.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex items-center justify-center px-2"
              >
                <MoreHorizontal className="w-4 h-4 text-secondary-400" />
              </span>
            )
          }

          const pageNumber = page as number
          const isCurrentPage = pageNumber === currentPage

          return (
            <Button
              key={pageNumber}
              variant={isCurrentPage ? 'primary' : 'ghost'}
              size={size}
              onClick={() => onPageChange(pageNumber)}
              className={cn(
                sizeClasses[size],
                isCurrentPage && 'pointer-events-none'
              )}
            >
              {pageNumber}
            </Button>
          )
        })}

        {/* Next Page */}
        {showPrevNext && currentPage < totalPages && (
          <Button
            variant="ghost"
            size={size}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}

        {/* Last Page */}
        {showFirstLast && currentPage < totalPages && (
          <Button
            variant="ghost"
            size={size}
            onClick={() => onPageChange(totalPages)}
            className="hidden sm:flex"
          >
            Last
          </Button>
        )}
      </div>
    )
  }
)

Pagination.displayName = 'Pagination'

export default Pagination
