'use client'

import { useState, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Search, 
  ChevronDown, 
  ChevronUp,
  Eye,
  TrendingUp,
  BookOpen,
  HelpCircle
} from 'lucide-react'

export interface FAQItem {
  id: string
  question: string
  answer: string
  category?: string
  tags?: string[]
  viewCount?: number
  relatedArticles?: { title: string; href: string }[]
}

interface SmartFAQProps {
  items: FAQItem[]
  title?: string
  description?: string
  className?: string
  showViewCounts?: boolean
  showRelatedArticles?: boolean
  trackViews?: boolean
  storageKey?: string
}

export function SmartFAQ({ 
  items,
  title = "Frequently Asked Questions",
  description,
  className,
  showViewCounts = true,
  showRelatedArticles = true,
  trackViews = true,
  storageKey = 'faq-views'
}: SmartFAQProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({})
  const [mounted, setMounted] = useState(false)

  // Load view counts from localStorage
  useEffect(() => {
    setMounted(true)
    if (trackViews && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          setViewCounts(JSON.parse(saved))
        } catch (e) {
          console.error('Failed to load FAQ view counts:', e)
        }
      }
    }
  }, [trackViews, storageKey])

  // Save view counts to localStorage
  useEffect(() => {
    if (mounted && trackViews && typeof window !== 'undefined' && Object.keys(viewCounts).length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(viewCounts))
    }
  }, [viewCounts, trackViews, storageKey, mounted])

  // Filter and sort FAQs
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = items.filter(item => 
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        item.category?.toLowerCase().includes(query)
      )
    }

    // Sort by view count (most viewed first)
    if (showViewCounts && trackViews) {
      filtered = [...filtered].sort((a, b) => {
        const countA = viewCounts[a.id] || 0
        const countB = viewCounts[b.id] || 0
        return countB - countA
      })
    }

    return filtered
  }, [items, searchQuery, viewCounts, showViewCounts, trackViews])

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, FAQItem[]> = {}
    
    filteredAndSortedItems.forEach(item => {
      const category = item.category || 'General'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(item)
    })
    
    return groups
  }, [filteredAndSortedItems])

  const handleToggle = (itemId: string) => {
    const newOpenItems = new Set(openItems)
    
    if (newOpenItems.has(itemId)) {
      newOpenItems.delete(itemId)
    } else {
      newOpenItems.add(itemId)
      
      // Track view
      if (trackViews) {
        setViewCounts(prev => ({
          ...prev,
          [itemId]: (prev[itemId] || 0) + 1
        }))
      }
    }
    
    setOpenItems(newOpenItems)
  }

  const handleExpandAll = () => {
    setOpenItems(new Set(filteredAndSortedItems.map(item => item.id)))
  }

  const handleCollapseAll = () => {
    setOpenItems(new Set())
  }

  const getMostViewedItems = () => {
    return items
      .filter(item => viewCounts[item.id] > 0)
      .sort((a, b) => (viewCounts[b.id] || 0) - (viewCounts[a.id] || 0))
      .slice(0, 5)
  }

  const mostViewed = getMostViewedItems()

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredAndSortedItems.length} of {items.length} questions
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExpandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={handleCollapseAll}>
              Collapse All
            </Button>
          </div>
        </div>

        {/* Most Viewed Section */}
        {showViewCounts && trackViews && mostViewed.length > 0 && !searchQuery && (
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Popular Questions
            </div>
            <div className="space-y-2">
              {mostViewed.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleToggle(item.id)}
                  className="text-sm text-left hover:text-primary transition-colors"
                >
                  {item.question}
                  <span className="text-muted-foreground ml-2">
                    ({viewCounts[item.id]} views)
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FAQ Items by Category */}
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category} className="space-y-3">
            <h3 className="font-medium text-lg flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              {category}
            </h3>
            
            <div className="space-y-2">
              {categoryItems.map((item) => (
                <Collapsible
                  key={item.id}
                  open={openItems.has(item.id)}
                  onOpenChange={() => handleToggle(item.id)}
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3 text-left">
                      <ChevronDown className={cn(
                        "h-5 w-5 transition-transform mt-0.5",
                        openItems.has(item.id) && "rotate-180"
                      )} />
                      <div className="space-y-1">
                        <p className="font-medium leading-relaxed">{item.question}</p>
                        <div className="flex items-center gap-2">
                          {item.tags && item.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {showViewCounts && trackViews && viewCounts[item.id] > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {viewCounts[item.id]} views
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="px-4 pb-4">
                    <div className="pl-8 pt-2 space-y-3">
                      <div className="prose prose-sm max-w-none text-muted-foreground">
                        {item.answer}
                      </div>
                      
                      {showRelatedArticles && item.relatedArticles && item.relatedArticles.length > 0 && (
                        <div className="pt-3 border-t">
                          <p className="text-sm font-medium mb-2 flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Related Articles
                          </p>
                          <div className="space-y-1">
                            {item.relatedArticles.map((article, index) => (
                              <a
                                key={index}
                                href={article.href}
                                className="text-sm text-primary hover:underline block"
                              >
                                {article.title}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        ))}

        {/* No Results */}
        {filteredAndSortedItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No questions found matching your search.</p>
            <Button
              variant="link"
              onClick={() => setSearchQuery('')}
              className="mt-2"
            >
              Clear search
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}