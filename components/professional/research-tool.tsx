'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCSRFContext } from '@/components/providers/csrf-provider'
import { toast } from 'sonner'
import { 
  Sparkles, 
  Download, 
  ExternalLink, 
  FileText,
  Search,
  AlertCircle,
  Clock,
  BookOpen
} from 'lucide-react'
import { format } from 'date-fns'

interface ResearchResult {
  report: string
  sources: Array<{
    title: string
    url: string
    snippet: string
  }>
  metadata: {
    report_type: string
    sources_count: number
    medical_focus: boolean
    word_count: number
  }
  generatedAt: string
}

export function ProfessionalResearchTool() {
  const { secureRequest } = useCSRFContext()
  const [topic, setTopic] = useState('')
  const [reportType, setReportType] = useState('research_report')
  const [sourcesCount, setSourcesCount] = useState(10)
  const [readingLevel, setReadingLevel] = useState<'basic' | 'intermediate' | 'advanced'>('intermediate')
  const [isResearching, setIsResearching] = useState(false)
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const handleResearch = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a research topic')
      return
    }

    setIsResearching(true)

    try {
      const response = await secureRequest('/api/professional/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          reportType,
          sourcesCount,
          focusMedical: true,
          includeCitations: true,
          readingLevel,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Research failed')
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        setResult(data.data)
        
        // Add to recent searches
        setRecentSearches(prev => {
          const updated = [topic, ...prev.filter(t => t !== topic)].slice(0, 5)
          return updated
        })
        
        toast.success('Research completed successfully!')
      } else {
        throw new Error('No data returned')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to complete research')
      console.error('Research error:', error)
    } finally {
      setIsResearching(false)
    }
  }

  const downloadReport = () => {
    if (!result) return

    const content = `# Clinical Research Report: ${topic}

Generated: ${format(new Date(result.generatedAt), 'PPP')}
Report Type: ${result.metadata.report_type}
Sources: ${result.metadata.sources_count}
Word Count: ${result.metadata.word_count}

---

${result.report}

---

## Sources

${result.sources.map((source, index) => 
  `${index + 1}. [${source.title}](${source.url})\n   ${source.snippet}`
).join('\n\n')}
`

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `research-${topic.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Clinical Research Assistant
          </CardTitle>
          <CardDescription>
            Generate comprehensive, evidence-based research reports on dental topics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="topic">Research Topic</Label>
              <div className="flex gap-2">
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Efficacy of laser therapy in periodontal treatment"
                  disabled={isResearching}
                  onKeyPress={(e) => e.key === 'Enter' && handleResearch()}
                />
                <Button onClick={handleResearch} disabled={isResearching || !topic.trim()}>
                  <Search className="w-4 h-4 mr-2" />
                  {isResearching ? 'Researching...' : 'Research'}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="reportType">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType} disabled={isResearching}>
                  <SelectTrigger id="reportType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="research_report">Research Report</SelectItem>
                    <SelectItem value="detailed_report">Detailed Analysis</SelectItem>
                    <SelectItem value="outline_report">Quick Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sources">Number of Sources</Label>
                <Select 
                  value={sourcesCount.toString()} 
                  onValueChange={(v) => setSourcesCount(parseInt(v))}
                  disabled={isResearching}
                >
                  <SelectTrigger id="sources">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 sources</SelectItem>
                    <SelectItem value="10">10 sources</SelectItem>
                    <SelectItem value="15">15 sources</SelectItem>
                    <SelectItem value="20">20 sources</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="readingLevel">Complexity Level</Label>
                <Select 
                  value={readingLevel} 
                  onValueChange={(v) => setReadingLevel(v as 'basic' | 'intermediate' | 'advanced')}
                  disabled={isResearching}
                >
                  <SelectTrigger id="readingLevel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">
                      <div className="flex flex-col">
                        <span>Basic</span>
                        <span className="text-xs text-muted-foreground">For students or quick reference</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="intermediate">
                      <div className="flex flex-col">
                        <span>Intermediate</span>
                        <span className="text-xs text-muted-foreground">Standard clinical terminology</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="advanced">
                      <div className="flex flex-col">
                        <span>Advanced</span>
                        <span className="text-xs text-muted-foreground">Detailed mechanisms & research</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {recentSearches.length > 0 && (
              <div>
                <Label>Recent Searches</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {recentSearches.map((search, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => setTopic(search)}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {search}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              This tool searches PubMed, Cochrane, and other medical databases to provide evidence-based research summaries.
              Always verify findings with primary sources before clinical application.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Research Results</CardTitle>
                <CardDescription>
                  Generated {format(new Date(result.generatedAt), 'PPp')}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={downloadReport}>
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="report" className="space-y-4">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="report">
                  <FileText className="w-4 h-4 mr-2" />
                  Report
                </TabsTrigger>
                <TabsTrigger value="sources">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Sources ({result.sources.length})
                </TabsTrigger>
                <TabsTrigger value="metadata">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Details
                </TabsTrigger>
              </TabsList>

              <TabsContent value="report" className="space-y-4">
                <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                  <div className="prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: result.report.replace(/\n/g, '<br />') }} />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="sources" className="space-y-4">
                <ScrollArea className="h-[600px] w-full">
                  <div className="space-y-4">
                    {result.sources.map((source, index) => (
                      <Card key={index} className="p-4">
                        <h4 className="font-medium mb-2">{source.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{source.snippet}</p>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                        >
                          View source
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="metadata" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Report Type</h4>
                    <p className="text-lg font-semibold">{result.metadata.report_type}</p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Sources Used</h4>
                    <p className="text-lg font-semibold">{result.metadata.sources_count}</p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Word Count</h4>
                    <p className="text-lg font-semibold">{result.metadata.word_count.toLocaleString()}</p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Medical Focus</h4>
                    <p className="text-lg font-semibold">{result.metadata.medical_focus ? 'Yes' : 'No'}</p>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}