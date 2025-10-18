import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@utils/cn'
import Button from './Button'

interface CalendarProps {
  value?: Date
  onChange?: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  className?: string
}

export default function Calendar({
  value,
  onChange,
  minDate,
  maxDate,
  disabled = false,
  className,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(value || new Date())

  const today = new Date()
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const firstDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const isDateDisabled = (date: Date) => {
    if (disabled) return true
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return false
  }

  const isDateSelected = (date: Date) => {
    if (!value) return false
    return date.toDateString() === value.toDateString()
  }

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  const handleDateClick = (date: Date) => {
    if (!isDateDisabled(date)) {
      onChange?.(date)
    }
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    onChange?.(today)
  }

  const renderDays = () => {
    const days = []
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-10" />
      )
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const isSelected = isDateSelected(date)
      const isTodayDate = isToday(date)
      const isDisabled = isDateDisabled(date)

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          disabled={isDisabled}
          className={cn(
            'h-10 w-10 rounded-md text-sm font-medium transition-colors',
            'hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500',
            isSelected && 'bg-primary-600 text-white hover:bg-primary-700',
            isTodayDate && !isSelected && 'bg-primary-100 text-primary-600',
            isDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent',
            !isSelected && !isTodayDate && !isDisabled && 'text-secondary-700 hover:bg-secondary-100'
          )}
        >
          {day}
        </button>
      )
    }

    return days
  }

  return (
    <div className={cn('w-full max-w-sm', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-secondary-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousMonth}
          disabled={disabled}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-secondary-900">
            {monthNames[month]} {year}
          </h3>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextMonth}
          disabled={disabled}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 p-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-xs font-medium text-secondary-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 p-2">
        {renderDays()}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-secondary-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToToday}
          disabled={disabled}
        >
          Today
        </Button>
      </div>
    </div>
  )
}
