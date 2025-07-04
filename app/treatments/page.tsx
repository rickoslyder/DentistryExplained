import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, ChevronRight, Wrench, Star, Filter } from "lucide-react"
import Link from "next/link"
import { OptimizedImage } from "@/components/ui/optimized-image"

export default function TreatmentsPage() {
  const treatmentCategories = [
    {
      name: "Restorative",
      description: "Treatments to restore damaged teeth",
      count: 8,
      color: "bg-blue-100 text-blue-800",
      articles: ["Dental Fillings", "Crowns", "Bridges", "Inlays & Onlays"],
    },
    {
      name: "Cosmetic",
      description: "Treatments to improve smile appearance",
      count: 6,
      color: "bg-purple-100 text-purple-800",
      articles: ["Teeth Whitening", "Veneers", "Bonding", "Smile Makeover"],
    },
    {
      name: "Surgical",
      description: "Surgical dental procedures",
      count: 5,
      color: "bg-red-100 text-red-800",
      articles: ["Tooth Extraction", "Implants", "Wisdom Teeth", "Gum Surgery"],
    },
    {
      name: "Orthodontic",
      description: "Treatments to straighten teeth",
      count: 4,
      color: "bg-green-100 text-green-800",
      articles: ["Braces", "Invisalign", "Retainers", "Clear Aligners"],
    },
  ]

  const featuredTreatments = [
    {
      title: "Dental Implants: Complete Guide",
      description: "Everything you need to know about dental implants, from consultation to recovery.",
      href: "/treatments/dental-implants",
      readTime: "12 min",
      difficulty: "Advanced",
      rating: 4.9,
      isPopular: true,
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      title: "Teeth Whitening Options",
      description: "Compare professional and at-home teeth whitening treatments.",
      href: "/treatments/teeth-whitening",
      readTime: "6 min",
      difficulty: "Basic",
      rating: 4.7,
      isPopular: true,
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      title: "Root Canal Treatment",
      description: "Understanding root canal procedures and what to expect.",
      href: "/treatments/root-canal",
      readTime: "10 min",
      difficulty: "Intermediate",
      rating: 4.8,
      isPopular: false,
      image: "/placeholder.svg?height=200&width=300",
    },
  ]

  const allTreatments = [
    {
      title: "Dental Fillings",
      description: "Types of fillings and what to expect during the procedure",
      href: "/treatments/dental-fillings",
      readTime: "8 min",
      category: "Restorative",
      lastUpdated: "2024-12-12",
    },
    {
      title: "Dental Crowns",
      description: "When you need a crown and the treatment process",
      href: "/treatments/dental-crowns",
      readTime: "9 min",
      category: "Restorative",
      lastUpdated: "2024-12-10",
    },
    {
      title: "Porcelain Veneers",
      description: "Transform your smile with custom porcelain veneers",
      href: "/treatments/porcelain-veneers",
      readTime: "11 min",
      category: "Cosmetic",
      lastUpdated: "2024-12-08",
    },
    {
      title: "Tooth Extraction",
      description: "Simple and surgical tooth extraction procedures",
      href: "/treatments/tooth-extraction",
      readTime: "7 min",
      category: "Surgical",
      lastUpdated: "2024-12-05",
    },
    {
      title: "Orthodontic Braces",
      description: "Traditional braces for straightening teeth",
      href: "/treatments/orthodontic-braces",
      readTime: "10 min",
      category: "Orthodontic",
      lastUpdated: "2024-12-03",
    },
    {
      title: "Dental Bridges",
      description: "Replace missing teeth with dental bridges",
      href: "/treatments/dental-bridges",
      readTime: "8 min",
      category: "Restorative",
      lastUpdated: "2024-12-01",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/topics" className="hover:text-primary">
            Topics
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Treatments</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Dental Treatments</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Comprehensive guides to dental treatments and procedures. Learn what to expect, how to prepare, and
            understand your treatment options.
          </p>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            32 Treatment Guides Available
          </Badge>
        </div>

        {/* Treatment Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Treatment Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {treatmentCategories.map((category, index) => (
              <Card key={index} className="hover-lift hover-glow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <Badge variant="secondary" className={category.color}>
                      {category.count}
                    </Badge>
                  </div>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-gray-600 mb-4">
                    {category.articles.map((article, articleIndex) => (
                      <li key={articleIndex}>• {article}</li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full bg-transparent">
                    View All
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Featured Treatments */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Treatment Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredTreatments.map((treatment, index) => (
              <Card key={index} className="hover-lift hover-glow overflow-hidden">
                <div className="aspect-video bg-gray-100 relative">
                  <OptimizedImage
                    src={treatment.image || "/placeholder.svg"}
                    alt={treatment.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="rounded-t-lg"
                  />
                  {treatment.isPopular && (
                    <Badge className="absolute top-3 left-3 bg-blue-600 text-white">Popular</Badge>
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{treatment.difficulty}</Badge>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        {treatment.rating}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {treatment.readTime}
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{treatment.title}</CardTitle>
                  <CardDescription>{treatment.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={treatment.href}>
                    <Button className="w-full">
                      Read Guide
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* All Treatments */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">All Treatment Guides</h2>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="bg-transparent">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="bg-transparent">
                Sort by: Most Recent
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            {allTreatments.map((treatment, index) => (
              <Card key={index} className="hover-lift">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Link href={treatment.href} className="block">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900 hover:text-primary transition-colors">
                            {treatment.title}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {treatment.category}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{treatment.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {treatment.readTime}
                          </div>
                          <span>Updated {new Date(treatment.lastUpdated).toLocaleDateString()}</span>
                        </div>
                      </Link>
                    </div>
                    <Link href={treatment.href}>
                      <Button variant="outline" size="sm" className="ml-4 bg-transparent">
                        Read Guide
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Treatment Planning CTA */}
        <Card className="mt-12 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <Wrench className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Need Treatment?</h3>
              <p className="text-blue-700 mb-6 max-w-2xl mx-auto">
                Find qualified dental professionals in your area who can provide the treatment you need.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/find-dentist">
                  <Button className="bg-blue-600 hover:bg-blue-700">Find a Dentist</Button>
                </Link>
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100 bg-transparent">
                  Get Second Opinion
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}
