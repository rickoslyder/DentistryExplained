'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageWithCitations } from '@/components/chat/message-with-citations'
import { Citation } from '@/lib/citation-processor'
import { SearchResult } from '@/lib/web-search'

// Mock data for testing
const mockSearchResults: SearchResult[] = [
  {
    title: "NHS Dental Charges 2025 - Official Rates",
    url: "https://www.nhs.uk/nhs-services/dentists/dental-costs/",
    snippet: "NHS dental charges for 2025: Band 1 £26.80, Band 2 £73.50, Band 3 £319.10. These charges apply to all NHS dental treatments in England.",
    publishedDate: "2025-01-01",
    relevanceScore: 0.95
  },
  {
    title: "Understanding Dental Implant Costs in the UK",
    url: "https://www.dentalhealth.org/dental-implant-costs",
    snippet: "Dental implants in the UK typically cost between £2,000 and £3,500 per tooth. The price varies based on the complexity of the procedure and location.",
    publishedDate: "2024-12-15",
    relevanceScore: 0.88
  },
  {
    title: "Latest Research on Gum Disease Prevention",
    url: "https://www.nature.com/articles/dental-research-2025",
    snippet: "New research from King's College London shows that regular interdental cleaning reduces gum disease risk by 40%. The study followed 5,000 participants over 3 years.",
    publishedDate: "2025-01-10",
    relevanceScore: 0.82
  }
]

const mockContent = `Based on the latest information from NHS and dental research sources, here's what you need to know about dental costs in the UK:

The current NHS dental charges [1] for 2025 are structured in three bands:
- Band 1: £26.80 (covers examination, diagnosis, and preventive care)
- Band 2: £73.50 (includes fillings, extractions, and root canal treatment)
- Band 3: £319.10 (covers crowns, dentures, and bridges)

For private dental treatments, costs vary significantly. According to the Dental Health Organisation [2], dental implants typically range from £2,000 to £3,500 per tooth. The final cost depends on factors such as the complexity of your case and the location of the dental practice.

Recent research [3] has also highlighted the importance of preventive care. A comprehensive study from King's College London found that regular interdental cleaning (using floss or interdental brushes) can reduce your risk of gum disease by 40%.

When considering dental treatment options, it's important to discuss both NHS and private options with your dentist to find the most suitable solution for your needs and budget.`

const mockCitations: Citation[] = [
  {
    number: 1,
    source: mockSearchResults[0],
    usedInResponse: true
  },
  {
    number: 2,
    source: mockSearchResults[1],
    usedInResponse: true
  },
  {
    number: 3,
    source: mockSearchResults[2],
    usedInResponse: true
  }
]

export default function TestCitationsPage() {
  const [showCitations, setShowCitations] = useState(true)

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Citation System Test</h1>
      
      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Controls</h2>
          <Button
            onClick={() => setShowCitations(!showCitations)}
            variant="outline"
          >
            {showCitations ? 'Hide' : 'Show'} Citations
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Message with Citations</h2>
          <div className="bg-gray-100 rounded-lg p-4">
            {showCitations ? (
              <MessageWithCitations
                content={mockContent}
                citations={mockCitations}
              />
            ) : (
              <div className="whitespace-pre-wrap">{mockContent}</div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Search Results Used</h2>
          <div className="space-y-3">
            {mockSearchResults.map((result, index) => (
              <div key={index} className="border rounded p-3">
                <h3 className="font-medium text-sm">{result.title}</h3>
                <p className="text-xs text-gray-600 mt-1">{result.url}</p>
                <p className="text-sm text-gray-700 mt-2">{result.snippet}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}