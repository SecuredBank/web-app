import { useState } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { useDebounce } from '@hooks/useDebounce'
import Input from '@components/ui/Input'
import Button from '@components/ui/Button'

interface SearchFormProps {
  onSearch: (query: string) => void
  onFilterChange?: (filters: Record<string, any>) => void
  placeholder?: string
  showFilters?: boolean
  filters?: Record<string, any>
  filterOptions?: {
    key: string
    label: string
    options: { value: string; label: string }[]
  }[]
}

export default function SearchForm({
  onSearch,
  onFilterChange,
  placeholder = 'Search...',
  showFilters = false,
  filters = {},
  filterOptions = [],
}: SearchFormProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Trigger search when debounced query changes
  React.useEffect(() => {
    onSearch(debouncedSearchQuery)
  }, [debouncedSearchQuery, onSearch])

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {}
    setLocalFilters(clearedFilters)
    onFilterChange?.(clearedFilters)
  }

  const hasActiveFilters = Object.values(localFilters).some(value => 
    value && value !== 'all' && value !== ''
  )

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        
        {showFilters && (
          <Button
            type="button"
            variant={hasActiveFilters ? 'primary' : 'secondary'}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 bg-white text-primary-600 rounded-full px-2 py-1 text-xs">
                {Object.values(localFilters).filter(v => v && v !== 'all' && v !== '').length}
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && showFilterPanel && (
        <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-secondary-900">Filters</h3>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowFilterPanel(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterOptions.map(({ key, label, options }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  {label}
                </label>
                <select
                  value={localFilters[key] || 'all'}
                  onChange={(e) => handleFilterChange(key, e.target.value)}
                  className="input w-full"
                >
                  <option value="all">All {label}</option>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
