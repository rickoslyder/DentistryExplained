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
  FileText, Download, Search, Filter, Calendar, Clock, 
  Shield, Star, TrendingUp, Info, Eye
} from "lucide-react"
import { toast } from "sonner"

interface ConsentForm {
  id: string
  title: string
  description: string
  category: string
  lastUpdated: string
  downloadCount: number
  fileSize: string
  preview?: string
  tags: string[]
}

const consentForms: ConsentForm[] = [
  {
    id: "extraction-simple",
    title: "Simple Tooth Extraction Consent Form",
    description: "Standard consent form for routine tooth extractions, including risks and post-operative care instructions",
    category: "oral-surgery",
    lastUpdated: "2025-07-01",
    downloadCount: 342,
    fileSize: "245 KB",
    tags: ["extraction", "oral surgery", "routine"],
  },
  {
    id: "extraction-surgical",
    title: "Surgical Extraction & Wisdom Tooth Removal",
    description: "Comprehensive consent for surgical extractions, including impacted wisdom teeth with sedation options",
    category: "oral-surgery",
    lastUpdated: "2025-07-01",
    downloadCount: 289,
    fileSize: "312 KB",
    tags: ["extraction", "wisdom teeth", "surgery", "sedation"],
  },
  {
    id: "root-canal",
    title: "Root Canal Treatment (Endodontic Therapy)",
    description: "Detailed consent form for root canal procedures, including risks, success rates, and alternative treatments",
    category: "endodontics",
    lastUpdated: "2025-06-28",
    downloadCount: 456,
    fileSize: "298 KB",
    tags: ["endodontics", "root canal", "restorative"],
  },
  {
    id: "crown-bridge",
    title: "Crown and Bridge Work Consent",
    description: "Consent for fixed prosthodontic treatments including single crowns and multi-unit bridges",
    category: "prosthodontics",
    lastUpdated: "2025-06-25",
    downloadCount: 378,
    fileSize: "276 KB",
    tags: ["crown", "bridge", "prosthodontics", "restorative"],
  },
  {
    id: "implant-placement",
    title: "Dental Implant Placement",
    description: "Comprehensive implant consent covering surgical placement, healing times, and success rates",
    category: "implants",
    lastUpdated: "2025-06-30",
    downloadCount: 267,
    fileSize: "385 KB",
    tags: ["implants", "surgery", "prosthodontics"],
  },
  {
    id: "periodontal-surgery",
    title: "Periodontal (Gum) Surgery",
    description: "Consent for various periodontal procedures including scaling, root planing, and gum grafts",
    category: "periodontics",
    lastUpdated: "2025-06-27",
    downloadCount: 198,
    fileSize: "264 KB",
    tags: ["periodontics", "gum disease", "surgery"],
  },
  {
    id: "orthodontic-treatment",
    title: "Orthodontic Treatment (Braces/Aligners)",
    description: "Comprehensive orthodontic consent covering treatment duration, compliance, and retention",
    category: "orthodontics",
    lastUpdated: "2025-06-29",
    downloadCount: 423,
    fileSize: "356 KB",
    tags: ["orthodontics", "braces", "aligners"],
  },
  {
    id: "composite-filling",
    title: "Composite Filling Restoration",
    description: "Consent for tooth-colored composite fillings, including material choices and longevity",
    category: "restorative",
    lastUpdated: "2025-07-02",
    downloadCount: 512,
    fileSize: "198 KB",
    tags: ["fillings", "restorative", "composite"],
  },
  {
    id: "teeth-whitening",
    title: "Professional Teeth Whitening",
    description: "Consent for in-office and take-home whitening treatments with sensitivity warnings",
    category: "cosmetic",
    lastUpdated: "2025-06-26",
    downloadCount: 334,
    fileSize: "212 KB",
    tags: ["whitening", "cosmetic", "bleaching"],
  },
  {
    id: "veneer-placement",
    title: "Porcelain Veneers",
    description: "Detailed consent for veneer preparation and placement including irreversible tooth preparation",
    category: "cosmetic",
    lastUpdated: "2025-06-24",
    downloadCount: 245,
    fileSize: "289 KB",
    tags: ["veneers", "cosmetic", "prosthodontics"],
  },
  {
    id: "pediatric-treatment",
    title: "Pediatric Dental Treatment",
    description: "Parent/guardian consent for various pediatric procedures with behavior management options",
    category: "pediatric",
    lastUpdated: "2025-07-03",
    downloadCount: 367,
    fileSize: "324 KB",
    tags: ["pediatric", "children", "behavior management"],
  },
  {
    id: "sedation-consent",
    title: "Conscious Sedation",
    description: "Specific consent for IV sedation or oral sedation during dental procedures",
    category: "sedation",
    lastUpdated: "2025-06-30",
    downloadCount: 289,
    fileSize: "367 KB",
    tags: ["sedation", "anxiety", "IV sedation"],
  }
]

const categories = [
  { value: "all", label: "All Forms" },
  { value: "oral-surgery", label: "Oral Surgery" },
  { value: "endodontics", label: "Endodontics" },
  { value: "prosthodontics", label: "Prosthodontics" },
  { value: "implants", label: "Implants" },
  { value: "periodontics", label: "Periodontics" },
  { value: "orthodontics", label: "Orthodontics" },
  { value: "restorative", label: "Restorative" },
  { value: "cosmetic", label: "Cosmetic" },
  { value: "pediatric", label: "Pediatric" },
  { value: "sedation", label: "Sedation" },
]

export default function ConsentFormsPage() {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
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

  const handleDownload = async (form: ConsentForm) => {
    try {
      // Track download
      await fetch('/api/professional/resources/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: form.id,
          resourceType: 'consent-form',
          title: form.title
        })
      })

      // Generate and download PDF
      const response = await fetch(`/api/professional/resources/consent-forms/${form.id}`)
      if (!response.ok) throw new Error('Failed to generate form')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${form.id}-consent-form.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Form downloaded successfully')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download form')
    }
  }

  const filteredForms = consentForms.filter(form => {
    const matchesSearch = form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         form.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         form.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === "all" || form.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const sortedForms = [...filteredForms].sort((a, b) => {
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
            <p className="text-gray-500 mt-4">Loading consent forms...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Consent Form Templates</h1>
              <p className="text-gray-600 mt-2">
                Professional consent forms updated for 2025 NHS guidelines
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
              All forms are fully customizable and include the latest informed consent requirements. 
              Remember to personalize each form with your practice details before use.
            </AlertDescription>
          </Alert>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search consent forms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full md:w-auto">
                <TabsList className="grid grid-cols-4 md:flex">
                  {categories.slice(0, 5).map(cat => (
                    <TabsTrigger key={cat.value} value={cat.value}>
                      {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

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
          </CardContent>
        </Card>

        {/* Forms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedForms.map((form) => (
            <Card key={form.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <FileText className="w-8 h-8 text-primary" />
                  <Badge variant="outline" className="text-xs">
                    {categories.find(cat => cat.value === form.category)?.label}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{form.title}</CardTitle>
                <CardDescription>{form.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {form.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(form.lastUpdated).toLocaleDateString('en-GB', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </span>
                  <span className="flex items-center">
                    <Download className="w-4 h-4 mr-1" />
                    {form.downloadCount} downloads
                  </span>
                  <span>{form.fileSize}</span>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => handleDownload(form)}
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
              </CardContent>
            </Card>
          ))}
        </div>

        {sortedForms.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No consent forms found matching your criteria</p>
            </CardContent>
          </Card>
        )}

        {/* Additional Categories */}
        {categories.length > 5 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>More Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categories.slice(5).map(cat => (
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
      </div>

      <Footer />
    </div>
  )
}