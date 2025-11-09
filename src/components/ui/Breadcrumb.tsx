import { ReactNode } from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@utils/cn'

interface BreadcrumbItem {
  label: string
  href?: string
  icon?: ReactNode
  current?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: ReactNode
  showHome?: boolean
  className?: string
}

export default function Breadcrumb({
  items,
  separator = <ChevronRight className="w-4 h-4" />,
  showHome = true,
  className,
}: BreadcrumbProps) {
  const allItems = showHome
    ? [{ label: 'Home', href: '/dashboard', icon: <Home className="w-4 h-4" /> }, ...items]
    : items

  return (
    <nav className={cn('flex', className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {allItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-secondary-400">
                {separator}
              </span>
            )}
            
            {item.href && !item.current ? (
              <a
                href={item.href}
                className="flex items-center text-sm font-medium text-secondary-500 hover:text-secondary-700 transition-colors"
              >
                {item.icon && (
                  <span className="mr-1.5">
                    {item.icon}
                  </span>
                )}
                {item.label}
              </a>
            ) : (
              <span
                className={cn(
                  'flex items-center text-sm font-medium',
                  item.current
                    ? 'text-secondary-900'
                    : 'text-secondary-500'
                )}
                aria-current={item.current ? 'page' : undefined}
              >
                {item.icon && (
                  <span className="mr-1.5">
                    {item.icon}
                  </span>
                )}
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

