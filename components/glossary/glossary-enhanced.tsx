'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, Volume2, BookOpen, Heart, AlertCircle, 
  Sparkles, TrendingUp, ChevronRight, X, Info,
  Stethoscope, Pill, Wrench, Brain, DollarSign, Baby,
  HelpCircle, ChevronLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface GlossaryTerm {
  term: string
  definition: string
  pronunciation?: string
  also_known_as?: string[]
  related_terms?: string[]
  category?: string
  difficulty?: 'basic' | 'advanced'
  example?: string
}

// Category configuration with icons and colors
const categoryConfig = {
  anatomy: { 
    icon: Stethoscope, 
    label: 'Anatomy', 
    color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    bgGradient: 'from-blue-50 to-blue-100'
  },
  conditions: { 
    icon: AlertCircle, 
    label: 'Conditions', 
    color: 'bg-red-100 text-red-700 hover:bg-red-200',
    bgGradient: 'from-red-50 to-red-100'
  },
  procedures: { 
    icon: Wrench, 
    label: 'Procedures', 
    color: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    bgGradient: 'from-purple-50 to-purple-100'
  },
  materials: { 
    icon: Pill, 
    label: 'Materials', 
    color: 'bg-green-100 text-green-700 hover:bg-green-200',
    bgGradient: 'from-green-50 to-green-100'
  },
  orthodontics: { 
    icon: Brain, 
    label: 'Orthodontics', 
    color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    bgGradient: 'from-yellow-50 to-yellow-100'
  },
  pediatric: { 
    icon: Baby, 
    label: 'Pediatric', 
    color: 'bg-pink-100 text-pink-700 hover:bg-pink-200',
    bgGradient: 'from-pink-50 to-pink-100'
  },
  costs: { 
    icon: DollarSign, 
    label: 'Costs & Insurance', 
    color: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    bgGradient: 'from-gray-50 to-gray-100'
  },
  prosthetics: { 
    icon: Wrench, 
    label: 'Prosthetics', 
    color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
    bgGradient: 'from-indigo-50 to-indigo-100'
  },
  specialties: { 
    icon: BookOpen, 
    label: 'Specialties', 
    color: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
    bgGradient: 'from-orange-50 to-orange-100'
  }
}

// Featured terms for "Term of the Day"
const featuredTerms = [
  'Abscess',
  'Root Canal',
  'Wisdom Teeth',
  'Gingivitis',
  'Fluoride',
  'Bruxism'
]

// Common questions for quick access
const commonQuestions = [
  { question: "What is a root canal?", term: "Root Canal" },
  { question: "What causes tooth decay?", term: "Caries" },
  { question: "What are wisdom teeth?", term: "Wisdom Teeth" },
  { question: "What is gum disease?", term: "Gum Disease" },
  { question: "What is a dental crown?", term: "Crown" },
  { question: "What is teeth whitening?", term: "Bleaching" }
]

interface GlossaryEnhancedProps {
  terms: GlossaryTerm[]
}

export function GlossaryEnhanced({ terms }: GlossaryEnhancedProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<'all' | 'basic' | 'advanced'>('all')
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null)
  const [bookmarkedTerms, setBookmarkedTerms] = useState<Set<string>>(new Set())
  const [pronouncing, setPronouncing] = useState<string | null>(null)

  // Get term of the day (changes daily)
  const termOfTheDay = useMemo(() => {
    const today = new Date().toDateString()
    const index = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % featuredTerms.length
    const termName = featuredTerms[index]
    return terms.find(t => t.term === termName) || terms[0]
  }, [terms])

  // Filter terms
  const filteredTerms = useMemo(() => {
    return terms.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.also_known_as?.some(aka => aka.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesCategory = !selectedCategory || item.category === selectedCategory
      const matchesLetter = !selectedLetter || item.term.charAt(0).toUpperCase() === selectedLetter
      const matchesDifficulty = difficulty === 'all' || item.difficulty === difficulty
      
      return matchesSearch && matchesCategory && matchesLetter && matchesDifficulty
    })
  }, [terms, searchTerm, selectedCategory, selectedLetter, difficulty])

  // Get available letters
  const availableLetters = useMemo(() => {
    return [...new Set(terms.map(item => item.term.charAt(0).toUpperCase()))].sort()
  }, [terms])

  // Group terms by category for visual browser
  const termsByCategory = useMemo(() => {
    const grouped: Record<string, GlossaryTerm[]> = {}
    terms.forEach(term => {
      const cat = term.category || 'general'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(term)
    })
    return grouped
  }, [terms])

  // Get trending/popular terms (mock data - in real app would be from analytics)
  const trendingTerms = ['Dry Socket', 'Abscess', 'Crown', 'Veneer', 'Root Canal']

  const pronounceTerm = (term: string, pronunciation?: string) => {
    if (!pronunciation) return
    
    setPronouncing(term)
    const utterance = new SpeechSynthesisUtterance(pronunciation)
    utterance.rate = 0.8
    utterance.onend = () => setPronouncing(null)
    speechSynthesis.speak(utterance)
  }

  const toggleBookmark = (term: string) => {
    const newBookmarks = new Set(bookmarkedTerms)
    if (newBookmarks.has(term)) {
      newBookmarks.delete(term)
    } else {
      newBookmarks.add(term)
    }
    setBookmarkedTerms(newBookmarks)
    // In real app, save to localStorage or user profile
  }

  return (
    <div className="space-y-8">
      {/* Hero Section with Term of the Day */}
      <Card className="overflow-hidden bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
        <CardContent className="p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-600">Term of the Day</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{termOfTheDay.term}</h2>
              {termOfTheDay.pronunciation && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => pronounceTerm(termOfTheDay.term, termOfTheDay.pronunciation)}
                  className="mb-3 -ml-2"
                >
                  <Volume2 className={cn(
                    "h-4 w-4 mr-1",
                    pronouncing === termOfTheDay.term && "animate-pulse"
                  )} />
                  {termOfTheDay.pronunciation}
                </Button>
              )}
              <p className="text-gray-700 mb-4">{termOfTheDay.definition}</p>
              {termOfTheDay.example && (
                <div className="p-3 bg-white/50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Example:</span> {termOfTheDay.example}
                  </p>
                </div>
              )}
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20" />
                <BookOpen className="relative h-48 w-48 mx-auto text-indigo-600/20" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Questions */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600" />
          Common Questions
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {commonQuestions.map((q, index) => (
            <Button
              key={index}
              variant="outline"
              className="justify-start text-left h-auto py-3 hover:bg-blue-50 hover:border-blue-300"
              onClick={() => {
                setSearchTerm(q.term)
                setExpandedTerm(q.term)
              }}
            >
              <HelpCircle className="h-4 w-4 mr-2 flex-shrink-0 text-blue-600" />
              <span className="text-sm">{q.question}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="search"
            placeholder="Search terms, definitions, or ask a question..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 h-12 text-base"
          />
          {searchTerm && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Difficulty Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Reading level:</span>
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            <Button
              size="sm"
              variant={difficulty === 'all' ? 'default' : 'ghost'}
              onClick={() => setDifficulty('all')}
              className="px-3 py-1 h-auto"
            >
              All
            </Button>
            <Button
              size="sm"
              variant={difficulty === 'basic' ? 'default' : 'ghost'}
              onClick={() => setDifficulty('basic')}
              className="px-3 py-1 h-auto"
            >
              Basic
            </Button>
            <Button
              size="sm"
              variant={difficulty === 'advanced' ? 'default' : 'ghost'}
              onClick={() => setDifficulty('advanced')}
              className="px-3 py-1 h-auto"
            >
              Advanced
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="bookmarks">
            Bookmarks {bookmarkedTerms.size > 0 && `(${bookmarkedTerms.size})`}
          </TabsTrigger>
        </TabsList>

        {/* Browse Tab */}
        <TabsContent value="browse" className="space-y-4">
          {/* Alphabet Navigation */}
          <div className="flex flex-wrap gap-1">
            <Button
              size="sm"
              variant={!selectedLetter ? 'default' : 'outline'}
              onClick={() => setSelectedLetter(null)}
              className="h-8 px-3"
            >
              All
            </Button>
            {availableLetters.map(letter => (
              <Button
                key={letter}
                size="sm"
                variant={selectedLetter === letter ? 'default' : 'outline'}
                onClick={() => setSelectedLetter(letter)}
                className="h-8 w-8 p-0"
              >
                {letter}
              </Button>
            ))}
          </div>

          {/* Terms List */}
          <div className="space-y-2">
            {filteredTerms.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No terms found matching your search.</p>
                  <Button 
                    variant="link" 
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory(null)
                      setSelectedLetter(null)
                    }}
                    className="mt-2"
                  >
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredTerms.map((item) => (
                <GlossaryTermCard
                  key={item.term}
                  term={item}
                  isExpanded={expandedTerm === item.term}
                  onToggle={() => setExpandedTerm(expandedTerm === item.term ? null : item.term)}
                  onPronounce={pronounceTerm}
                  isPronouncing={pronouncing === item.term}
                  isBookmarked={bookmarkedTerms.has(item.term)}
                  onToggleBookmark={() => toggleBookmark(item.term)}
                  categoryConfig={categoryConfig}
                />
              ))
            )}
          </div>

          {/* Results Count */}
          {searchTerm && (
            <p className="text-sm text-gray-500 text-center">
              Showing {filteredTerms.length} of {terms.length} terms
            </p>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          {Object.entries(termsByCategory).map(([category, categoryTerms]) => {
            const config = categoryConfig[category as keyof typeof categoryConfig] || {
              icon: BookOpen,
              label: category,
              color: 'bg-gray-100 text-gray-700',
              bgGradient: 'from-gray-50 to-gray-100'
            }
            const Icon = config.icon

            return (
              <Card key={category} className="overflow-hidden">
                <CardHeader className={cn("bg-gradient-to-r", config.bgGradient)}>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {config.label}
                  </CardTitle>
                  <CardDescription>
                    {categoryTerms.length} terms
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoryTerms.slice(0, 6).map(term => (
                      <Button
                        key={term.term}
                        variant="outline"
                        className="justify-start text-left h-auto py-2"
                        onClick={() => {
                          setSelectedCategory(category)
                          setSearchTerm(term.term)
                          setExpandedTerm(term.term)
                        }}
                      >
                        <span className="truncate">{term.term}</span>
                      </Button>
                    ))}
                  </div>
                  {categoryTerms.length > 6 && (
                    <Button
                      variant="link"
                      className="mt-4 p-0 h-auto"
                      onClick={() => {
                        setSelectedCategory(category)
                        setSelectedLetter(null)
                      }}
                    >
                      View all {categoryTerms.length} {config.label.toLowerCase()} terms
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        {/* Trending Tab */}
        <TabsContent value="trending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Most Searched Terms
              </CardTitle>
              <CardDescription>
                Popular terms other users are looking up
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trendingTerms.map((termName, index) => {
                  const term = terms.find(t => t.term === termName)
                  if (!term) return null

                  return (
                    <div
                      key={termName}
                      className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSearchTerm(termName)
                        setExpandedTerm(termName)
                      }}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{term.term}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{term.definition}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 mt-0.5" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bookmarks Tab */}
        <TabsContent value="bookmarks" className="space-y-4">
          {bookmarkedTerms.size === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No bookmarked terms yet</p>
                <p className="text-sm text-gray-400">
                  Click the heart icon on any term to bookmark it for quick access
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {Array.from(bookmarkedTerms).map(termName => {
                const term = terms.find(t => t.term === termName)
                if (!term) return null

                return (
                  <GlossaryTermCard
                    key={term.term}
                    term={term}
                    isExpanded={expandedTerm === term.term}
                    onToggle={() => setExpandedTerm(expandedTerm === term.term ? null : term.term)}
                    onPronounce={pronounceTerm}
                    isPronouncing={pronouncing === term.term}
                    isBookmarked={true}
                    onToggleBookmark={() => toggleBookmark(term.term)}
                    categoryConfig={categoryConfig}
                  />
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Separate component for term cards
function GlossaryTermCard({
  term,
  isExpanded,
  onToggle,
  onPronounce,
  isPronouncing,
  isBookmarked,
  onToggleBookmark,
  categoryConfig
}: {
  term: GlossaryTerm
  isExpanded: boolean
  onToggle: () => void
  onPronounce: (term: string, pronunciation?: string) => void
  isPronouncing: boolean
  isBookmarked: boolean
  onToggleBookmark: () => void
  categoryConfig: typeof categoryConfig
}) {
  const config = term.category ? categoryConfig[term.category as keyof typeof categoryConfig] || {
    icon: BookOpen,
    label: term.category,
    color: 'bg-gray-100 text-gray-700',
    bgGradient: 'from-gray-50 to-gray-100'
  } : null

  return (
    <Card className={cn(
      "transition-all duration-200",
      isExpanded && "shadow-md"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3">
              {config && (
                <config.icon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 
                  className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={onToggle}
                >
                  {term.term}
                  {term.pronunciation && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        onPronounce(term.term, term.pronunciation)
                      }}
                      className="ml-2 h-6 px-2"
                    >
                      <Volume2 className={cn(
                        "h-3 w-3 mr-1",
                        isPronouncing && "animate-pulse"
                      )} />
                      <span className="text-xs">{term.pronunciation}</span>
                    </Button>
                  )}
                </h3>
                
                <p className={cn(
                  "text-gray-600 mt-1",
                  !isExpanded && "line-clamp-2"
                )}>
                  {term.definition}
                </p>

                {isExpanded && (
                  <div className="mt-4 space-y-3">
                    {term.example && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm">
                          <span className="font-medium text-blue-900">Example:</span>
                          <span className="text-blue-800 ml-1">{term.example}</span>
                        </p>
                      </div>
                    )}

                    {term.also_known_as && term.also_known_as.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-500">Also known as:</span>
                        {term.also_known_as.map((aka, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {aka}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {term.related_terms && term.related_terms.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-500">Related:</span>
                        {term.related_terms.map((related, idx) => (
                          <Badge 
                            key={idx} 
                            variant="outline" 
                            className="text-xs cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              // In real app, would search for this term
                              console.log('Search for:', related)
                            }}
                          >
                            {related}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {config && (
              <Badge className={cn("text-xs", config.color)}>
                {config.label}
              </Badge>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onToggleBookmark()
              }}
              className="h-8 w-8 p-0"
            >
              <Heart className={cn(
                "h-4 w-4",
                isBookmarked ? "fill-red-500 text-red-500" : "text-gray-400"
              )} />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-90"
              )} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}