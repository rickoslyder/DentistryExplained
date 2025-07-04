"use client"

import { useState, useEffect } from "react"
import { Search, Clock, BookOpen, FileText } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SearchResult {
  id: string
  title: string
  description: string
  category: string
  type: "article" | "procedure" | "glossary"
  url: string
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [recentSearches] = useState(["tooth decay", "dental implants", "gum disease", "teeth whitening"])

  // Mock search function
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Mock results
    const mockResults: SearchResult[] = [
      {
        id: "1",
        title: "Understanding Tooth Decay",
        description: "Learn about the causes, symptoms, and prevention of tooth decay.",
        category: "Dental Problems",
        type: "article",
        url: "/dental-problems/tooth-decay",
      },
      {
        id: "2",
        title: "Dental Filling Procedure",
        description: "What to expect during a dental filling procedure.",
        category: "Treatments",
        type: "procedure",
        url: "/treatments/dental-fillings",
      },
      {
        id: "3",
        title: "Cavity",
        description: "A hole in the tooth caused by decay.",
        category: "Glossary",
        type: "glossary",
        url: "/glossary/cavity",
      },
    ].filter(
      (result) =>
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.description.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    setResults(mockResults)
    setIsSearching(false)
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "article":
        return <BookOpen className="w-4 h-4" />
      case "procedure":
        return <FileText className="w-4 h-4" />
      case "glossary":
        return <Search className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  const handleResultClick = (result: SearchResult) => {
    onOpenChange(false)
    // Navigate to result (would use router in real implementation)
    console.log("Navigate to:", result.url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search dental topics, treatments, and more..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 text-lg h-12"
              autoFocus
            />
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-96 px-6 pb-6">
          {!query && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Recent searches</h3>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setQuery(search)}
                      className="text-xs"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {search}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {query && (
            <div className="space-y-2">
              {isSearching ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Searching...</p>
                </div>
              ) : results.length > 0 ? (
                results.map((result) => (
                  <div
                    key={result.id}
                    className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-gray-400 mt-1">{getTypeIcon(result.type)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{result.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{result.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {result.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {result.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No results found for "{query}"</p>
                  <p className="text-sm text-gray-400 mt-1">Try different keywords or browse our topics</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
