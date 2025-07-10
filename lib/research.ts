import { z } from 'zod'

const RESEARCH_SERVICE_URL = process.env.RESEARCH_SERVICE_URL || 'http://localhost:8000'
const RESEARCH_SERVICE_AUTH_TOKEN = process.env.RESEARCH_SERVICE_AUTH_TOKEN || 'development-token-change-in-production'

export const ResearchRequestSchema = z.object({
  topic: z.string().min(1).max(500),
  reportType: z.enum(['research_report', 'outline_report', 'detailed_report']).default('research_report'),
  sourcesCount: z.number().int().min(5).max(20).default(10),
  focusMedical: z.boolean().default(true),
  includeCitations: z.boolean().default(true),
})

export const ResearchResponseSchema = z.object({
  topic: z.string(),
  report: z.string(),
  sources: z.array(z.object({
    title: z.string(),
    url: z.string(),
    snippet: z.string(),
  })),
  metadata: z.object({
    report_type: z.string(),
    sources_count: z.number(),
    medical_focus: z.boolean(),
    word_count: z.number(),
  }),
  generated_at: z.string(),
})

export type ResearchRequest = z.infer<typeof ResearchRequestSchema>
export type ResearchResponse = z.infer<typeof ResearchResponseSchema>

export class ResearchService {
  private baseUrl: string
  private authToken: string

  constructor(baseUrl?: string, authToken?: string) {
    this.baseUrl = baseUrl || RESEARCH_SERVICE_URL
    this.authToken = authToken || RESEARCH_SERVICE_AUTH_TOKEN
  }

  async conductResearch(request: ResearchRequest): Promise<ResearchResponse> {
    const response = await fetch(`${this.baseUrl}/research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
      },
      body: JSON.stringify({
        topic: request.topic,
        report_type: request.reportType,
        sources_count: request.sourcesCount,
        focus_medical: request.focusMedical,
        include_citations: request.includeCitations,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Research service error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return ResearchResponseSchema.parse(data)
  }

  async professionalResearch(request: ResearchRequest): Promise<ResearchResponse> {
    const response = await fetch(`${this.baseUrl}/research/professional`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
      },
      body: JSON.stringify({
        topic: request.topic,
        report_type: request.reportType,
        sources_count: request.sourcesCount,
        focus_medical: true,
        include_citations: request.includeCitations,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Research service error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return ResearchResponseSchema.parse(data)
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      return response.ok
    } catch {
      return false
    }
  }
}

export function formatResearchAsMarkdown(research: ResearchResponse): string {
  const header = `---
title: "Draft: ${research.topic}"
excerpt: "An AI-generated research report on ${research.topic}."
category: "dental-problems"
tags: ["AI-generated", "draft", "research"]
status: "draft"
featured: false
reviewed: false
generatedAt: "${research.generated_at}"
---

`

  const content = research.report

  const sourcesSection = `

## Sources

${research.sources.map((source, index) => 
    `${index + 1}. [${source.title}](${source.url})\n   ${source.snippet}`
  ).join('\n\n')}

---

**Note:** This is an AI-generated draft based on web research. It requires professional medical review before publication.
**Generated:** ${new Date(research.generated_at).toLocaleString()}
**Word Count:** ${research.metadata.word_count}
`

  return header + content + sourcesSection
}