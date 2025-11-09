import { ReactNode, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@utils/cn'

interface AccordionItem {
  id: string
  title: string
  content: ReactNode
  disabled?: boolean
}

interface AccordionProps {
  items: AccordionItem[]
  allowMultiple?: boolean
  defaultOpen?: string[]
  className?: string
}

export default function Accordion({
  items,
  allowMultiple = false,
  defaultOpen = [],
  className,
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>(defaultOpen)

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => {
      if (allowMultiple) {
        return prev.includes(itemId)
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId]
      } else {
        return prev.includes(itemId) ? [] : [itemId]
      }
    })
  }

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item) => {
        const isOpen = openItems.includes(item.id)
        
        return (
          <div
            key={item.id}
            className="border border-secondary-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => !item.disabled && toggleItem(item.id)}
              disabled={item.disabled}
              className={cn(
                'w-full px-4 py-3 text-left flex items-center justify-between',
                'hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-primary-500',
                'transition-colors duration-200',
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="font-medium text-secondary-900">
                {item.title}
              </span>
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-secondary-500 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </button>
            
            {isOpen && (
              <div className="px-4 pb-3 border-t border-secondary-200">
                <div className="pt-3">
                  {item.content}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

