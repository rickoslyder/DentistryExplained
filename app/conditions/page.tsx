import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Search } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Dental Conditions | Dentistry Explained',
  description: 'Learn about common dental conditions, their symptoms, causes, and treatment options.',
}

async function getConditionsData() {
  const supabase = await createServerSupabaseClient()
  
  // First get the dental problems category
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'dental-problems')
    .single()
  
  if (!category) {
    return { articles: [] }
  }
  
  // Then get articles for that category
  const { data: articles } = await supabase
    .from('articles')
    .select('id, slug, title, excerpt, read_time, tags, views')
    .eq('category_id', category.id)
    .eq('status', 'published')
    .order('views', { ascending: false })
  
  return {
    articles: articles || [],
  }
}

export const dynamic = 'force-dynamic'

export default async function ConditionsPage() {
  const { articles } = await getConditionsData()
  
  // Group conditions by type
  const commonConditions = articles.filter(a => 
    a.tags?.some(tag => ['common', 'cavity', 'gum disease'].includes(tag))
  )
  
  const urgentConditions = articles.filter(a => 
    a.tags?.some(tag => ['emergency', 'urgent', 'pain'].includes(tag))
  )
  
  const otherConditions = articles.filter(a => 
    !commonConditions.includes(a) && !urgentConditions.includes(a)
  )
  
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Dental Conditions</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Understanding dental conditions is the first step to better oral health. 
            Learn about symptoms, causes, and treatment options.
          </p>
          
          <Link href="/search" className="inline-flex items-center mt-6 text-primary hover:underline">
            <Search className="w-4 h-4 mr-2" />
            Search for a specific condition
          </Link>
        </div>
        
        {/* Urgent Conditions Alert */}
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-900">
              <AlertCircle className="w-5 h-5 mr-2" />
              Dental Emergencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800 mb-4">
              If you're experiencing severe pain, swelling, or trauma, seek immediate dental care.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {urgentConditions.map((condition) => (
                <Link 
                  key={condition.id} 
                  href={`/dental-problems/${condition.slug}`}
                  className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
                >
                  <span className="font-medium text-gray-900">{condition.title}</span>
                  <Badge variant="destructive" className="ml-2">Urgent</Badge>
                </Link>
              ))}
              <Link 
                href="/emergency"
                className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
              >
                <span className="font-medium text-gray-900">Emergency Care Guide</span>
                <Badge variant="destructive" className="ml-2">Emergency</Badge>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Common Conditions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Conditions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {commonConditions.map((condition) => (
              <Link key={condition.id} href={`/dental-problems/${condition.slug}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">{condition.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4 line-clamp-2">
                      {condition.excerpt}
                    </CardDescription>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{condition.read_time} min read</span>
                      <span>{condition.views} views</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
        
        {/* Other Conditions */}
        {otherConditions.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Other Conditions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {otherConditions.map((condition) => (
                <Link 
                  key={condition.id} 
                  href={`/dental-problems/${condition.slug}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{condition.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{condition.read_time} min read</p>
                  </div>
                  <span className="text-sm text-gray-500">{condition.views} views</span>
                </Link>
              ))}
            </div>
          </section>
        )}
        
        {/* Educational Note */}
        <Card className="mt-12 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Professional Diagnosis Important</h3>
                <p className="text-blue-800">
                  While this information can help you understand dental conditions, it's not a substitute 
                  for professional diagnosis. Always consult with a qualified dentist for proper evaluation 
                  and treatment of any dental concerns.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  )
}