"use client"

import { useState } from "react"
import { Download, Search, FileText, Star, Calendar, Eye } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ConsentForm {
  id: string
  title: string
  description: string
  category: string
  downloadCount: number
  rating: number
  lastUpdated: string
  fileSize: string
  pages: number
  language: string[]
  isPopular: boolean
  isNew: boolean
  previewUrl: string
}

export default function ConsentFormsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("popular")

  const categories = [
    { id: "all", name: "All Categories", count: 24 },
    { id: "restorative", name: "Restorative", count: 8 },
    { id: "surgical", name: "Oral Surgery", count: 6 },
    { id: "cosmetic", name: "Cosmetic", count: 4 },
    { id: "orthodontic", name: "Orthodontic", count: 3 },
    { id: "emergency", name: "Emergency", count: 3 },
  ]

  const consentForms: ConsentForm[] = [
    {
      id: "1",
      title: "Root Canal Treatment Consent",
      description: "Comprehensive consent form for endodontic treatment including risks, benefits, and alternatives.",
      category: "restorative",
      downloadCount: 1247,
      rating: 4.9,
      lastUpdated: "2024-12-01",
      fileSize: "245 KB",
      pages: 3,
      language: ["English"],
      isPopular: true,
      isNew: false,
      previewUrl: "/placeholder.svg?height=400&width=300",
    },
    {
      id: "2",
      title: "Dental Implant Surgery Consent",
      description: "Detailed consent form for implant placement surgery with post-operative care instructions.",
      category: "surgical",
      downloadCount: 892,
      rating: 4.8,
      lastUpdated: "2024-11-28",
      fileSize: "312 KB",
      pages: 4,
      language: ["English", "Welsh"],
      isPopular: true,
      isNew: false,
      previewUrl: "/placeholder.svg?height=400&width=300",
    },
    {
      id: "3",
      title: "Teeth Whitening Consent",
      description:
        "Professional teeth whitening consent form covering treatment expectations and potential side effects.",
      category: "cosmetic",
      downloadCount: 634,
      rating: 4.7,
      lastUpdated: "2024-12-10",
      fileSize: "189 KB",
      pages: 2,
      language: ["English"],
      isPopular: false,
      isNew: true,
      previewUrl: "/placeholder.svg?height=400&width=300",
    },
    {
      id: "4",
      title: "Tooth Extraction Consent",
      description: "Standard consent form for simple and surgical tooth extractions.",
      category: "surgical",
      downloadCount: 1156,
      rating: 4.8,
      lastUpdated: "2024-11-15",
      fileSize: "198 KB",
      pages: 2,
      language: ["English", "Welsh", "Urdu"],
      isPopular: true,
      isNew: false,
      previewUrl: "/placeholder.svg?height=400&width=300",
    },
    {
      id: "5",
      title: "Orthodontic Treatment Consent",
      description: "Comprehensive consent for orthodontic treatment including braces and aligners.",
      category: "orthodontic",
      downloadCount: 445,
      rating: 4.6,
      lastUpdated: "2024-11-20",
      fileSize: "267 KB",
      pages: 3,
      language: ["English"],
      isPopular: false,
      isNew: false,
      previewUrl: "/placeholder.svg?height=400&width=300",
    },
    {
      id: "6",
      title: "Dental Crown Preparation Consent",
      description: "Consent form for crown and bridge preparation procedures.",
      category: "restorative",
      downloadCount: 723,
      rating: 4.7,
      lastUpdated: "2024-12-05",
      fileSize: "223 KB",
      pages: 2,
      language: ["English"],
      isPopular: false,
      isNew: true,
      previewUrl: "/placeholder.svg?height=400&width=300",
    },
  ]

  const filteredForms = consentForms.filter((form) => {
    const matchesSearch =
      form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || form.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const sortedForms = [...filteredForms].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.downloadCount - a.downloadCount
      case "newest":
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      case "rating":
        return b.rating - a.rating
      case "alphabetical":
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })

  const handleDownload = async (formId: string, title: string) => {
    try {
      // Get user's practice details from profile
      const response = await fetch(`/api/professional/consent-forms/download?formId=${formId}`)
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      // Create blob from response
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/\s+/g, '_')}_Consent_Form.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      // In production, show toast notification
    }
  }

  const handlePreview = async (formId: string, title: string) => {
    try {
      // Generate PDF and open in new tab
      const response = await fetch(`/api/professional/consent-forms/download?formId=${formId}&preview=true`)
      
      if (!response.ok) {
        throw new Error('Failed to generate preview')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      
      // Clean up after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 60000)
    } catch (error) {
      console.error('Preview error:', error)
      // In production, show toast notification
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Consent Forms Library</h1>
          <p className="text-gray-600 max-w-2xl">
            Download professionally designed consent forms for all dental procedures. All forms are legally compliant
            and regularly updated to reflect current best practices.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search consent forms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name} ({category.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Downloaded</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="alphabetical">A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Tabs defaultValue="grid" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
            <div className="text-sm text-gray-500">
              Showing {sortedForms.length} of {consentForms.length} forms
            </div>
          </div>

          <TabsContent value="grid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedForms.map((form) => (
                <Card key={form.id} className="hover-lift hover-glow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{form.title}</CardTitle>
                        <div className="flex items-center space-x-2 mb-2">
                          {form.isPopular && <Badge className="bg-blue-100 text-blue-800">Popular</Badge>}
                          {form.isNew && <Badge className="bg-green-100 text-green-800">New</Badge>}
                          <Badge variant="outline" className="capitalize">
                            {categories.find((c) => c.id === form.category)?.name}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                            {form.rating}
                          </div>
                          <div className="flex items-center">
                            <Download className="w-4 h-4 mr-1" />
                            {form.downloadCount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-sm">{form.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                        <div>
                          <span className="font-medium">Size:</span> {form.fileSize}
                        </div>
                        <div>
                          <span className="font-medium">Pages:</span> {form.pages}
                        </div>
                        <div>
                          <span className="font-medium">Updated:</span>{" "}
                          {new Date(form.lastUpdated).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Languages:</span> {form.language.length}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" className="flex-1" onClick={() => handleDownload(form.id, form.title)}>
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(form.id, form.title)}
                          className="bg-transparent"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list">
            <div className="space-y-4">
              {sortedForms.map((form) => (
                <Card key={form.id} className="hover-lift">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{form.title}</h3>
                          <div className="flex items-center space-x-2">
                            {form.isPopular && <Badge className="bg-blue-100 text-blue-800">Popular</Badge>}
                            {form.isNew && <Badge className="bg-green-100 text-green-800">New</Badge>}
                            <Badge variant="outline" className="capitalize">
                              {categories.find((c) => c.id === form.category)?.name}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3">{form.description}</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                            {form.rating}
                          </div>
                          <div className="flex items-center">
                            <Download className="w-4 h-4 mr-1" />
                            {form.downloadCount.toLocaleString()} downloads
                          </div>
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-1" />
                            {form.pages} pages
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Updated {new Date(form.lastUpdated).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(form.id, form.title)}
                          className="bg-transparent"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        <Button size="sm" onClick={() => handleDownload(form.id, form.title)}>
                          <Download className="w-4 h-4 mr-1" />
                          Download
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
        <Card className="mt-12 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Usage Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-blue-800">
              <div>
                <h4 className="font-semibold mb-2">Legal Compliance</h4>
                <ul className="text-sm space-y-1">
                  <li>• All forms comply with UK dental regulations</li>
                  <li>• Regular updates reflect current best practices</li>
                  <li>• Reviewed by qualified dental professionals</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Customization</h4>
                <ul className="text-sm space-y-1">
                  <li>• Add your practice details and logo</li>
                  <li>• Modify to suit specific procedures</li>
                  <li>• Available in multiple languages</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}
