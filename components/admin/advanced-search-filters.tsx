'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon, Search, X, Filter, RotateCcw } from 'lucide-react'

interface SearchFilters {
  status?: string[]
  categories?: string[]
  authors?: string[]
  tags?: string[]
  dateRange?: {
    start?: string
    end?: string
  }
  readingLevel?: string[]
  contentType?: string[]
  hasImages?: boolean
  wordCountRange?: {
    min?: number
    max?: number
  }
}

interface AdvancedSearchFiltersProps {
  onSearch: (query: string, filters: SearchFilters, sort: { field: string; order: string }) => void
  aggregations?: {
    categories: Array<{ id: string; name: string; slug: string; count: number }>
    authors: Array<{ id: string; name: string; count: number }>
    readingLevels: Record<string, number>
    totalResults: number
  }
  isLoading?: boolean
}

export function AdvancedSearchFilters({ onSearch, aggregations, isLoading }: AdvancedSearchFiltersProps) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({})
  const [sortField, setSortField] = useState('relevance')
  const [sortOrder, setSortOrder] = useState('desc')
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)
  
  // Calculate active filters count
  useEffect(() => {
    let count = 0
    if (filters.status?.length) count += filters.status.length
    if (filters.categories?.length) count += filters.categories.length
    if (filters.authors?.length) count += filters.authors.length
    if (filters.tags?.length) count += filters.tags.length
    if (filters.dateRange?.start || filters.dateRange?.end) count++
    if (filters.readingLevel?.length) count += filters.readingLevel.length
    if (filters.contentType?.length) count += filters.contentType.length
    if (filters.hasImages !== undefined) count++
    if (filters.wordCountRange?.min || filters.wordCountRange?.max) count++
    setActiveFiltersCount(count)
  }, [filters])
  
  const handleSearch = () => {
    onSearch(query, filters, { field: sortField, order: sortOrder })
  }
  
  const handleReset = () => {
    setQuery('')
    setFilters({})
    setSortField('relevance')
    setSortOrder('desc')
    onSearch('', {}, { field: 'relevance', order: 'desc' })
  }
  
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }
  
  const toggleArrayFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => {
      const currentArray = (prev[key] as string[]) || []
      const newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value]
      return { ...prev, [key]: newArray.length > 0 ? newArray : undefined }
    })
  }
  
  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search articles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={isLoading}>
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
        {activeFiltersCount > 0 && (
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        )}
      </div>
      
      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">Active filters:</span>
          {filters.status?.map(status => (
            <Badge key={status} variant="secondary">
              Status: {status}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => toggleArrayFilter('status', status)}
              />
            </Badge>
          ))}
          {filters.categories?.map(category => {
            const cat = aggregations?.categories.find(c => c.slug === category)
            return (
              <Badge key={category} variant="secondary">
                Category: {cat?.name || category}
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer" 
                  onClick={() => toggleArrayFilter('categories', category)}
                />
              </Badge>
            )
          })}
          {(filters.dateRange?.start || filters.dateRange?.end) && (
            <Badge variant="secondary">
              Date: {filters.dateRange.start && format(new Date(filters.dateRange.start), 'MMM d')}
              {filters.dateRange.start && filters.dateRange.end && ' - '}
              {filters.dateRange.end && format(new Date(filters.dateRange.end), 'MMM d')}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => updateFilter('dateRange', undefined)}
              />
            </Badge>
          )}
        </div>
      )}
      
      {/* Filter Accordion */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="filters">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Advanced Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              {/* Status Filter */}
              <div>
                <Label className="mb-2 block">Status</Label>
                <div className="space-y-2">
                  {['draft', 'published', 'archived'].map(status => (
                    <label key={status} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={filters.status?.includes(status) || false}
                        onCheckedChange={() => toggleArrayFilter('status', status)}
                      />
                      <span className="text-sm capitalize">{status}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Categories Filter */}
              <div>
                <Label className="mb-2 block">Categories</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {aggregations?.categories.map(category => (
                    <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={filters.categories?.includes(category.slug) || false}
                        onCheckedChange={() => toggleArrayFilter('categories', category.slug)}
                      />
                      <span className="text-sm">{category.name}</span>
                      <span className="text-xs text-gray-500">({category.count})</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Date Range Filter */}
              <div>
                <Label className="mb-2 block">Date Range</Label>
                <div className="space-y-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateRange?.start && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange?.start ? (
                          format(new Date(filters.dateRange.start), 'PPP')
                        ) : (
                          <span>Start date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange?.start ? new Date(filters.dateRange.start) : undefined}
                        onSelect={(date) => 
                          updateFilter('dateRange', {
                            ...filters.dateRange,
                            start: date?.toISOString()
                          })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateRange?.end && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange?.end ? (
                          format(new Date(filters.dateRange.end), 'PPP')
                        ) : (
                          <span>End date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange?.end ? new Date(filters.dateRange.end) : undefined}
                        onSelect={(date) => 
                          updateFilter('dateRange', {
                            ...filters.dateRange,
                            end: date?.toISOString()
                          })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {/* Reading Level Filter */}
              <div>
                <Label className="mb-2 block">Reading Level</Label>
                <div className="space-y-2">
                  {['basic', 'intermediate', 'advanced'].map(level => (
                    <label key={level} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={filters.readingLevel?.includes(level) || false}
                        onCheckedChange={() => toggleArrayFilter('readingLevel', level)}
                      />
                      <span className="text-sm capitalize">{level}</span>
                      {aggregations?.readingLevels[level] && (
                        <span className="text-xs text-gray-500">
                          ({aggregations.readingLevels[level]})
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Content Type Filter */}
              <div>
                <Label className="mb-2 block">Content Type</Label>
                <div className="space-y-2">
                  {['article', 'guide', 'news', 'research'].map(type => (
                    <label key={type} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={filters.contentType?.includes(type) || false}
                        onCheckedChange={() => toggleArrayFilter('contentType', type)}
                      />
                      <span className="text-sm capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Has Images Filter */}
              <div>
                <Label className="mb-2 block">Media</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={filters.hasImages === true}
                      onCheckedChange={(checked) => 
                        updateFilter('hasImages', checked === true ? true : undefined)
                      }
                    />
                    <span className="text-sm">Has images</span>
                  </label>
                </div>
              </div>
              
              {/* Word Count Range */}
              <div className="col-span-full">
                <Label className="mb-2 block">Word Count Range</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.wordCountRange?.min || ''}
                    onChange={(e) => updateFilter('wordCountRange', {
                      ...filters.wordCountRange,
                      min: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-500">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.wordCountRange?.max || ''}
                    onChange={(e) => updateFilter('wordCountRange', {
                      ...filters.wordCountRange,
                      max: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-500">words</span>
                </div>
              </div>
              
              {/* Sort Options */}
              <div className="col-span-full">
                <Label className="mb-2 block">Sort By</Label>
                <div className="flex gap-2">
                  <Select value={sortField} onValueChange={setSortField}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="views">Views</SelectItem>
                      <SelectItem value="readTime">Read Time</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}