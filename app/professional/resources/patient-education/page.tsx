"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  BookOpen, Download, Search, Filter, Calendar, Clock, 
  Shield, Star, TrendingUp, Info, Eye, FileText
} from "lucide-react"
import { toast } from "sonner"

interface EducationMaterial {
  id: string
  title: string
  description: string
  category: string
  type: "leaflet" | "guide" | "poster" | "infographic"
  lastUpdated: string
  downloadCount: number
  fileSize: string
  readingLevel: string
  languages: string[]
  tags: string[]
}

const educationMaterials: EducationMaterial[] = [
  {
    id: "oral-hygiene-basics",
    title: "Daily Oral Hygiene Guide",
    description: "Comprehensive guide on proper brushing, flossing, and mouthwash use with visual instructions",
    category: "prevention",
    type: "guide",
    lastUpdated: "2025-07-02",
    downloadCount: 892,
    fileSize: "3.2 MB",
    readingLevel: "Easy",
    languages: ["English", "Welsh"],
    tags: ["hygiene", "prevention", "daily care"],
  },
  {
    id: "post-extraction-care",
    title: "After Your Tooth Extraction",
    description: "Step-by-step aftercare instructions for patients following tooth extraction",
    category: "post-operative",
    type: "leaflet",
    lastUpdated: "2025-07-01",
    downloadCount: 756,
    fileSize: "1.8 MB",
    readingLevel: "Easy",
    languages: ["English", "Polish", "Urdu"],
    tags: ["extraction", "aftercare", "healing"],
  },
  {
    id: "children-dental-health",
    title: "Your Child's Dental Health",
    description: "Parent's guide to children's oral health from birth to teens, including teething and first visits",
    category: "pediatric",
    type: "guide",
    lastUpdated: "2025-06-30",
    downloadCount: 634,
    fileSize: "4.1 MB",
    readingLevel: "Easy",
    languages: ["English"],
    tags: ["children", "pediatric", "parents"],
  },
  {
    id: "gum-disease-prevention",
    title: "Understanding Gum Disease",
    description: "Visual guide explaining gingivitis and periodontitis with prevention strategies",
    category: "periodontal",
    type: "infographic",
    lastUpdated: "2025-06-28",
    downloadCount: 523,
    fileSize: "2.4 MB",
    readingLevel: "Moderate",
    languages: ["English"],
    tags: ["gum disease", "periodontal", "prevention"],
  },
  {
    id: "root-canal-explained",
    title: "Root Canal Treatment Explained",
    description: "Patient-friendly explanation of root canal procedures with FAQs and recovery timeline",
    category: "endodontic",
    type: "guide",
    lastUpdated: "2025-06-29",
    downloadCount: 445,
    fileSize: "2.8 MB",
    readingLevel: "Moderate",
    languages: ["English", "Spanish"],
    tags: ["root canal", "endodontic", "treatment"],
  },
  {
    id: "dental-anxiety-management",
    title: "Managing Dental Anxiety",
    description: "Techniques and tips for patients with dental phobia, including relaxation exercises",
    category: "anxiety",
    type: "leaflet",
    lastUpdated: "2025-06-27",
    downloadCount: 567,
    fileSize: "1.5 MB",
    readingLevel: "Easy",
    languages: ["English"],
    tags: ["anxiety", "fear", "relaxation"],
  },
  {
    id: "nutrition-dental-health",
    title: "Diet and Your Teeth",
    description: "How food choices affect oral health, including sugar awareness and tooth-friendly snacks",
    category: "prevention",
    type: "poster",
    lastUpdated: "2025-07-03",
    downloadCount: 423,
    fileSize: "3.8 MB",
    readingLevel: "Easy",
    languages: ["English"],
    tags: ["diet", "nutrition", "prevention"],
  },
  {
    id: "denture-care-guide",
    title: "Caring for Your Dentures",
    description: "Complete guide on denture maintenance, cleaning, and when to see your dentist",
    category: "prosthodontic",
    type: "guide",
    lastUpdated: "2025-06-26",
    downloadCount: 334,
    fileSize: "2.1 MB",
    readingLevel: "Easy",
    languages: ["English", "Bengali"],
    tags: ["dentures", "cleaning", "care"],
  },
  {
    id: "smoking-oral-health",
    title: "Smoking and Oral Health",
    description: "Impact of smoking on teeth and gums with cessation resources and support",
    category: "prevention",
    type: "leaflet",
    lastUpdated: "2025-06-25",
    downloadCount: 389,
    fileSize: "1.9 MB",
    readingLevel: "Moderate",
    languages: ["English"],
    tags: ["smoking", "cessation", "health risks"],
  },
  {
    id: "pregnancy-dental-care",
    title: "Dental Care During Pregnancy",
    description: "Safe dental treatments during pregnancy and importance of oral health for mother and baby",
    category: "special-needs",
    type: "guide",
    lastUpdated: "2025-07-01",
    downloadCount: 412,
    fileSize: "2.6 MB",
    readingLevel: "Easy",
    languages: ["English"],
    tags: ["pregnancy", "maternal health", "safety"],
  },
  {
    id: "diabetes-dental-connection",
    title: "Diabetes and Dental Health",
    description: "Understanding the two-way relationship between diabetes and gum disease",
    category: "medical",
    type: "infographic",
    lastUpdated: "2025-06-30",
    downloadCount: 298,
    fileSize: "1.7 MB",
    readingLevel: "Moderate",
    languages: ["English"],
    tags: ["diabetes", "medical conditions", "gum disease"],
  },
  {
    id: "orthodontic-care-teens",
    title: "Braces Care for Teenagers",
    description: "Fun, engaging guide for teens on caring for braces, including food guides and cleaning tips",
    category: "orthodontic",
    type: "poster",
    lastUpdated: "2025-06-28",
    downloadCount: 456,
    fileSize: "4.2 MB",
    readingLevel: "Easy",
    languages: ["English"],
    tags: ["braces", "teenagers", "orthodontic"],
  }
]

const categories = [
  { value: "all", label: "All Materials" },
  { value: "prevention", label: "Prevention" },
  { value: "post-operative", label: "Post-Operative" },
  { value: "pediatric", label: "Pediatric" },
  { value: "periodontal", label: "Periodontal" },
  { value: "endodontic", label: "Endodontic" },
  { value: "anxiety", label: "Anxiety" },
  { value: "prosthodontic", label: "Prosthodontic" },
  { value: "medical", label: "Medical" },
  { value: "orthodontic", label: "Orthodontic" },
  { value: "special-needs", label: "Special Needs" },
]

const materialTypes = [
  { value: "all", label: "All Types" },
  { value: "leaflet", label: "Leaflets" },
  { value: "guide", label: "Guides" },
  { value: "poster", label: "Posters" },
  { value: "infographic", label: "Infographics" },
]

export default function PatientEducationPage() {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [sortBy, setSortBy] = useState<"popular" | "recent">("popular")

  useEffect(() => {
    checkVerificationStatus()
  }, [user])

  const checkVerificationStatus = async () => {
    if (!user) {
      router.push('/sign-in')
      return
    }

    try {
      const response = await fetch('/api/professional/verification')
      const data = await response.json()

      if (data.verification?.verification_status === 'verified') {
        setIsVerified(true)
      } else {
        router.push('/professional/verify')
      }
    } catch (error) {
      console.error('Error checking verification:', error)
      router.push('/professional/verify')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (material: EducationMaterial) => {
    try {
      // Track download
      await fetch('/api/professional/resources/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: material.id,
          resourceType: 'patient-education',
          title: material.title
        })
      })

      // Generate and download PDF
      const response = await fetch(`/api/professional/resources/patient-education/${material.id}`)
      if (!response.ok) throw new Error('Failed to generate material')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${material.id}-patient-education.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Material downloaded successfully')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download material')
    }
  }

  const filteredMaterials = educationMaterials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === "all" || material.category === selectedCategory
    const matchesType = selectedType === "all" || material.type === selectedType
    
    return matchesSearch && matchesCategory && matchesType
  })

  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    if (sortBy === "popular") {
      return b.downloadCount - a.downloadCount
    } else {
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    }
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading education materials...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Patient Education Materials</h1>
              <p className="text-gray-600 mt-2">
                Professional handouts and guides to educate your patients
              </p>
            </div>
            <Badge className="bg-green-100 text-green-800">
              <Shield className="w-4 h-4 mr-1" />
              Verified Access
            </Badge>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              All materials are designed for easy patient understanding and can be customized with your practice branding. 
              Multiple language options available where indicated.
            </AlertDescription>
          </Alert>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Search education materials..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={sortBy === "popular" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("popular")}
                  >
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Popular
                  </Button>
                  <Button
                    variant={sortBy === "recent" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("recent")}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Recent
                  </Button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1">
                  <TabsList className="grid grid-cols-3 md:flex">
                    {categories.slice(0, 6).map(cat => (
                      <TabsTrigger key={cat.value} value={cat.value}>
                        {cat.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                <Tabs value={selectedType} onValueChange={setSelectedType}>
                  <TabsList>
                    {materialTypes.map(type => (
                      <TabsTrigger key={type.value} value={type.value}>
                        {type.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMaterials.map((material) => (
            <Card key={material.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <BookOpen className="w-8 h-8 text-primary" />
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {material.type}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {material.readingLevel}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg">{material.title}</CardTitle>
                <CardDescription>{material.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {material.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {material.languages.length > 1 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Languages:</span> {material.languages.join(", ")}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(material.lastUpdated).toLocaleDateString('en-GB', { 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </span>
                    <span className="flex items-center">
                      <Download className="w-4 h-4 mr-1" />
                      {material.downloadCount}
                    </span>
                    <span>{material.fileSize}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => handleDownload(material)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        // TODO: Implement preview
                        toast.info('Preview feature coming soon')
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {sortedMaterials.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No education materials found matching your criteria</p>
            </CardContent>
          </Card>
        )}

        {/* Additional Categories */}
        {categories.length > 6 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>More Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categories.slice(6).map(cat => (
                  <Button
                    key={cat.value}
                    variant={selectedCategory === cat.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.value)}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Usage Tips */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Usage Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">Personalize Materials</h3>
                  <p className="text-sm text-gray-600">
                    Add your practice logo and contact details before printing
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Print Quality</h3>
                  <p className="text-sm text-gray-600">
                    All materials are designed for high-quality color printing
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}