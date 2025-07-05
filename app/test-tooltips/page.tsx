'use client'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useGlossary } from '@/contexts/glossary-provider'
import { processContentForGlossaryTerms } from '@/lib/glossary-processor'
import { GlossaryPreferences } from '@/components/glossary/glossary-preferences'

export default function TestTooltipsPage() {
  const { terms, trackTermView, termsLoaded, preferences } = useGlossary()
  
  const content1 = `This page tests the glossary tooltip functionality. Terms like cavity, crown, and root canal should have interactive tooltips.`
  
  const content2 = `If you have a toothache, you might need to see a dentist for a filling or possibly an extraction.`
  
  const content3 = `Common dental procedures include scaling, prophylaxis, and orthodontics. Your dentist might recommend fluoride treatment to prevent decay.`
  
  const content4 = `For emergency situations like a dental abscess or pulpitis, immediate treatment is necessary. The NHS 111 service can help you find emergency dental care.`
  
  const processContent = (text: string) => {
    if (!termsLoaded || !preferences.enableTooltips) return text
    return processContentForGlossaryTerms(text, terms, trackTermView).content
  }
  
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Test Glossary Tooltips</h1>
          <GlossaryPreferences />
        </div>
        
        <div className="prose prose-lg max-w-none space-y-6">
          <p>{processContent(content1)}</p>
          
          <p>{processContent(content2)}</p>
          
          <p>{processContent(content3)}</p>
          
          <p>{processContent(content4)}</p>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Note</h3>
            <p>
              {preferences.enableTooltips 
                ? "Hover over any underlined dental term to see its definition. These tooltips are automatically generated from our glossary database."
                : "Tooltips are currently disabled. Enable them using the settings button above to see term definitions."
              }
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}