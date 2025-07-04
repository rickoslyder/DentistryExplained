import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, ChevronRight, AlertTriangle, TrendingUp } from "lucide-react"
import Link from "next/link"
import { OptimizedImage } from "@/components/ui/optimized-image"

export default function DentalProblemsPage() {
  const featuredArticles = [
    {
      title: "Understanding Tooth Decay",
      description:
        "Learn about the causes, symptoms, and prevention of tooth decay - one of the most common dental problems.",
      href: "/dental-problems/tooth-decay",
      readTime: "5 min",
      difficulty: "Basic",
      isPopular: true,
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      title: "Gum Disease: Signs and Treatment",
      description: "Recognize the early signs of gum disease and learn about effective treatment options.",
      href: "/dental-problems/gum-disease",
      readTime: "7 min",
      difficulty: "Basic",
      isPopular: true,
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      title: "Managing Tooth Sensitivity",
      description: "Discover what causes tooth sensitivity and how to manage this common dental problem.",
      href: "/dental-problems/tooth-sensitivity",
      readTime: "4 min",
      difficulty: "Basic",
      isPopular: false,
      image: "/placeholder.svg?height=200&width=300",
    },
  ]

  const allArticles = [
    {
      title: "Bad Breath (Halitosis)",
      description: "Causes and solutions for persistent bad breath",
      href: "/dental-problems/bad-breath",
      readTime: "6 min",
      lastUpdated: "2024-12-10",
    },
    {
      title: "Tooth Abscess",
      description: "Understanding dental abscesses and when to seek emergency care",
      href: "/dental-problems/tooth-abscess",
      readTime: "8 min",
      lastUpdated: "2024-12-08",
    },
    {
      title: "Cracked or Broken Teeth",
      description: "What to do when you have a damaged tooth",
      href: "/dental-problems/cracked-teeth",
      readTime: "5 min",
      lastUpdated: "2024-12-05",
    },
    {
      title: "Dry Mouth (Xerostomia)",
      description: "Causes and management of dry mouth condition",
      href: "/dental-problems/dry-mouth",
      readTime: "7 min",
      lastUpdated: "2024-12-03",
    },
    {
      title: "Teeth Grinding (Bruxism)",
      description: "Understanding and treating teeth grinding habits",
      href: "/dental-problems/teeth-grinding",
      readTime: "6 min",
      lastUpdated: "2024-12-01",
    },
    {
      title: "Oral Thrush",
      description: "Recognizing and treating oral fungal infections",
      href: "/dental-problems/oral-thrush",
      readTime: "5 min",
      lastUpdated: "2024-11-28",
    },
  ]

  const quickFacts = [
    "Tooth decay affects 92% of adults aged 20-64",
    "Gum disease is the leading cause of tooth loss in adults",
    "Early detection can prevent most dental problems from becoming serious",
    "Regular checkups can catch problems before symptoms appear",
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
          <span className="text-gray-900">Dental Problems</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Dental Problems</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Learn about common dental problems, their causes, symptoms, and treatment options. Early recognition and
            proper care can prevent minor issues from becoming major problems.
          </p>
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            24 Articles Available
          </Badge>
        </div>

        {/* Quick Facts */}
        <Card className="mb-12 bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <TrendingUp className="w-5 h-5 mr-2" />
              Quick Facts About Dental Problems
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickFacts.map((fact, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-red-700">{fact}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Featured Articles */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredArticles.map((article, index) => (
              <Card key={index} className="hover-lift hover-glow overflow-hidden">
                <div className="aspect-video bg-gray-100 relative">
                  <OptimizedImage
                    src={article.image || "/placeholder.svg"}
                    alt={article.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="rounded-t-lg"
                  />
                  {article.isPopular && <Badge className="absolute top-3 left-3 bg-red-600 text-white z-10">Popular</Badge>}
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{article.difficulty}</Badge>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {article.readTime}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{article.title}</CardTitle>
                  <CardDescription>{article.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={article.href}>
                    <Button className="w-full">
                      Read Article
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* All Articles */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">All Dental Problems</h2>
            <Button variant="outline" className="bg-transparent">
              Sort by: Most Recent
            </Button>
          </div>
          <div className="space-y-4">
            {allArticles.map((article, index) => (
              <Card key={index} className="hover-lift">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Link href={article.href} className="block">
                        <h3 className="font-semibold text-gray-900 hover:text-primary transition-colors mb-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 mb-3">{article.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {article.readTime}
                          </div>
                          <span>Updated {new Date(article.lastUpdated).toLocaleDateString()}</span>
                        </div>
                      </Link>
                    </div>
                    <Link href={article.href}>
                      <Button variant="outline" size="sm" className="ml-4 bg-transparent">
                        Read
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Emergency Notice */}
        <Card className="mt-12 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mr-4" />
              <div>
                <h3 className="font-semibold text-red-800 mb-2">Dental Emergency?</h3>
                <p className="text-red-700 mb-4">
                  If you're experiencing severe pain, swelling, or trauma, seek immediate dental care.
                </p>
                <div className="flex space-x-4">
                  <Link href="/emergency">
                    <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100 bg-transparent">
                      Emergency Guide
                    </Button>
                  </Link>
                  <Link href="/find-dentist">
                    <Button className="bg-red-600 hover:bg-red-700">Find Emergency Dentist</Button>
                  </Link>
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
