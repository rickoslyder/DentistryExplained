export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Download, 
  Search, 
  Filter,
  Printer,
  Share2,
  Clock,
  Eye,
  Star,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Patient Education Materials | Dentistry Explained',
  description: 'Downloadable patient education materials for dental professionals.',
}

// Placeholder materials data - will be replaced with database content
const materials = {
  leaflets: [
    {
      id: 1,
      title: '[PLACEHOLDER] Daily Oral Hygiene Guide',
      description: 'Comprehensive guide on proper brushing and flossing techniques',
      category: 'Prevention',
      format: 'PDF',
      size: '2.3 MB',
      downloads: 1234,
      rating: 4.8,
      languages: ['English', 'Welsh', 'Polish'],
      lastUpdated: '2024-12-01',
      preview: '/placeholder.pdf',
    },
    {
      id: 2,
      title: '[PLACEHOLDER] Understanding Tooth Decay',
      description: 'Patient-friendly explanation of cavity formation and prevention',
      category: 'Conditions',
      format: 'PDF',
      size: '1.8 MB',
      downloads: 987,
      rating: 4.7,
      languages: ['English'],
      lastUpdated: '2024-11-28',
      preview: '/placeholder.pdf',
    },
    {
      id: 3,
      title: '[PLACEHOLDER] Post-Extraction Care',
      description: 'Aftercare instructions for tooth extraction patients',
      category: 'Post-Op Care',
      format: 'PDF',
      size: '1.2 MB',
      downloads: 2341,
      rating: 4.9,
      languages: ['English', 'Welsh'],
      lastUpdated: '2024-11-25',
      preview: '/placeholder.pdf',
    },
  ],
  posters: [
    {
      id: 4,
      title: '[PLACEHOLDER] Healthy Smile Poster',
      description: 'Colorful poster showing steps to maintain oral health',
      category: 'Prevention',
      format: 'PDF',
      size: '5.4 MB',
      downloads: 567,
      rating: 4.6,
      dimensions: 'A3',
      lastUpdated: '2024-11-20',
    },
    {
      id: 5,
      title: '[PLACEHOLDER] Sugar and Your Teeth',
      description: 'Visual guide showing sugar\'s impact on dental health',
      category: 'Prevention',
      format: 'PDF',
      size: '4.2 MB',
      downloads: 432,
      rating: 4.5,
      dimensions: 'A2',
      lastUpdated: '2024-11-15',
    },
  ],
  videos: [
    {
      id: 6,
      title: '[PLACEHOLDER] Proper Brushing Technique',
      description: 'Demonstration video for patient education',
      category: 'Prevention',
      format: 'MP4',
      duration: '3:45',
      views: 8934,
      rating: 4.8,
      subtitles: ['English', 'Welsh'],
      lastUpdated: '2024-11-10',
    },
  ],
}

async function checkProfessionalAccess() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  const supabase = await createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type, role')
    .eq('clerk_id', userId)
    .single()
  
  if (!profile || profile.user_type !== 'professional') {
    redirect('/professional')
  }
  
  return profile
}

export default async function PatientMaterialsPage() {
  await checkProfessionalAccess()
  
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Patient Education Materials</h1>
          <p className="text-gray-600 mt-2">
            Professional-quality materials to educate and inform your patients
          </p>
        </div>
        
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search materials..."
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="bg-transparent">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
        
        {/* Notice */}
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Professional Materials</h3>
                <p className="text-blue-800 mt-1">
                  All materials are reviewed by dental professionals and comply with UK dental standards. 
                  Feel free to customize with your practice details.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Materials Tabs */}
        <Tabs defaultValue="leaflets" className="space-y-6">
          <TabsList>
            <TabsTrigger value="leaflets">
              <FileText className="w-4 h-4 mr-2" />
              Leaflets
            </TabsTrigger>
            <TabsTrigger value="posters">
              <Printer className="w-4 h-4 mr-2" />
              Posters
            </TabsTrigger>
            <TabsTrigger value="videos">
              <Eye className="w-4 h-4 mr-2" />
              Videos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="leaflets">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.leaflets.map((material) => (
                <Card key={material.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Badge variant="secondary">{material.category}</Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        {material.rating}
                      </div>
                    </div>
                    <CardTitle className="text-lg mt-2">{material.title}</CardTitle>
                    <CardDescription>{material.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{material.format} • {material.size}</span>
                        <span>{material.downloads} downloads</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {material.languages.map((lang) => (
                          <Badge key={lang} variant="outline" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline" className="bg-transparent">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="bg-transparent">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <p className="text-xs text-gray-500 text-center">
                        Updated {new Date(material.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="posters">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {materials.posters.map((poster) => (
                <Card key={poster.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Badge variant="secondary">{poster.category}</Badge>
                      <Badge variant="outline">{poster.dimensions}</Badge>
                    </div>
                    <CardTitle className="text-lg mt-2">{poster.title}</CardTitle>
                    <CardDescription>{poster.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{poster.format} • {poster.size}</span>
                        <span>{poster.downloads} downloads</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        {poster.rating}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline" className="bg-transparent">
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="videos">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {materials.videos.map((video) => (
                <Card key={video.id} className="hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gray-100 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Eye className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Video Preview</p>
                      </div>
                    </div>
                    <Badge className="absolute top-3 right-3 bg-black/70 text-white">
                      <Clock className="w-3 h-3 mr-1" />
                      {video.duration}
                    </Badge>
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Badge variant="secondary">{video.category}</Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Eye className="w-4 h-4 mr-1" />
                        {video.views}
                      </div>
                    </div>
                    <CardTitle className="text-lg mt-2">{video.title}</CardTitle>
                    <CardDescription>{video.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        <span className="text-sm text-gray-500">Subtitles:</span>
                        {video.subtitles.map((lang) => (
                          <Badge key={lang} variant="outline" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          <Eye className="w-4 h-4 mr-2" />
                          Watch
                        </Button>
                        <Button size="sm" variant="outline" className="bg-transparent">
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Usage Guidelines */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Usage Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              • All materials are free to use and distribute to your patients
            </p>
            <p className="text-sm text-gray-600">
              • You may add your practice details to the materials
            </p>
            <p className="text-sm text-gray-600">
              • Please do not alter the medical content without professional review
            </p>
            <p className="text-sm text-gray-600">
              • Materials are updated regularly - check for new versions monthly
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  )
}