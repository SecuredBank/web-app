import { ReactNode, forwardRef, useState, useRef } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@utils/cn'
import { useClickOutside } from '@hooks/useClickOutside'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  options: SelectOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  className?: string
}

const Select = forwardRef<HTMLDivElement, SelectProps>(
  ({ options, value, onChange, placeholder, disabled, error, className }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const selectRef = useRef<HTMLDivElement>(null)

    useClickOutside(selectRef, () => {
      setIsOpen(false)
    })

    const selectedOption = options.find(option => option.value === value)

    const handleSelect = (option: SelectOption) => {
      if (!option.disabled) {
        onChange(option.value)
        setIsOpen(false)
      }
    }

    return (
      <div ref={ref} className={cn('relative', className)}>
        <div
          ref={selectRef}
          className={cn(
            'relative w-full cursor-pointer rounded-md border border-secondary-300 bg-white px-3 py-2 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            disabled && 'cursor-not-allowed bg-secondary-50 text-secondary-500',
            error && 'border-danger-500 focus:ring-danger-500'
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <span className={cn(
            'block truncate',
            !selectedOption && 'text-secondary-500'
          )}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown className={cn(
              'h-4 w-4 text-secondary-400 transition-transform',
              isOpen && 'rotate-180'
            )} />
          </span>
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1 max-h-60 overflow-auto">
              {options.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    'relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-secondary-50',
                    option.disabled && 'cursor-not-allowed opacity-50',
                    option.value === value && 'bg-primary-50 text-primary-700'
                  )}
                  onClick={() => handleSelect(option)}
                >
                  <span className="block truncate font-normal">
                    {option.label}
                  </span>
                  {option.value === value && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary-600">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
