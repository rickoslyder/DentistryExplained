import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, ChevronRight, Shield, CheckCircle, Calendar } from "lucide-react"
import Link from "next/link"

export default function PreventionPage() {
  const preventionPillars = [
    {
      title: "Daily Oral Hygiene",
      description: "Proper brushing and flossing techniques",
      icon: "🦷",
      articles: 6,
      color: "bg-green-100 text-green-800",
    },
    {
      title: "Healthy Diet",
      description: "Foods that promote dental health",
      icon: "🥗",
      articles: 4,
      color: "bg-blue-100 text-blue-800",
    },
    {
      title: "Regular Checkups",
      description: "Professional cleanings and examinations",
      icon: "👨‍⚕️",
      articles: 3,
      color: "bg-purple-100 text-purple-800",
    },
    {
      title: "Lifestyle Factors",
      description: "Habits that affect oral health",
      icon: "🚭",
      articles: 5,
      color: "bg-orange-100 text-orange-800",
    },
  ]

  const featuredArticles = [
    {
      title: "Complete Daily Oral Hygiene Routine",
      description: "Step-by-step guide to maintaining excellent oral health at home.",
      href: "/prevention/daily-oral-hygiene",
      readTime: "5 min",
      difficulty: "Basic",
      isEssential: true,
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      title: "Diet and Dental Health",
      description: "How your food choices impact your teeth and gums.",
      href: "/prevention/diet-dental-health",
      readTime: "7 min",
      difficulty: "Basic",
      isEssential: true,
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      title: "Fluoride: Benefits and Safety",
      description: "Understanding fluoride's role in preventing tooth decay.",
      href: "/prevention/fluoride-benefits",
      readTime: "4 min",
      difficulty: "Basic",
      isEssential: false,
      image: "/placeholder.svg?height=200&width=300",
    },
  ]

  const allArticles = [
    {
      title: "Proper Brushing Technique",
      description: "Master the correct way to brush your teeth",
      href: "/prevention/proper-brushing",
      readTime: "4 min",
      category: "Daily Care",
      lastUpdated: "2024-12-14",
    },
    {
      title: "Flossing: Why and How",
      description: "The importance of flossing and proper technique",
      href: "/prevention/flossing-guide",
      readTime: "3 min",
      category: "Daily Care",
      lastUpdated: "2024-12-12",
    },
    {
      title: "Choosing the Right Toothbrush",
      description: "Electric vs manual and what to look for",
      href: "/prevention/choosing-toothbrush",
      readTime: "5 min",
      category: "Tools",
      lastUpdated: "2024-12-10",
    },
    {
      title: "Mouthwash: Do You Need It?",
      description: "Benefits and types of mouthwash",
      href: "/prevention/mouthwash-guide",
      readTime: "4 min",
      category: "Tools",
      lastUpdated: "2024-12-08",
    },
    {
      title: "Dental Sealants for Adults",
      description: "Protective sealants aren't just for children",
      href: "/prevention/dental-sealants-adults",
      readTime: "6 min",
      category: "Professional Care",
      lastUpdated: "2024-12-05",
    },
    {
      title: "Smoking and Oral Health",
      description: "How tobacco affects your teeth and gums",
      href: "/prevention/smoking-oral-health",
      readTime: "8 min",
      category: "Lifestyle",
      lastUpdated: "2024-12-03",
    },
  ]

  const preventionTips = [
    "Brush twice daily with fluoride toothpaste",
    "Floss daily to remove plaque between teeth",
    "Limit sugary and acidic foods and drinks",
    "Visit your dentist every 6 months",
    "Don't use teeth as tools",
    "Quit smoking and limit alcohol",
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
          <span className="text-gray-900">Prevention</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Prevention</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Prevention is the best medicine. Learn how to maintain excellent oral health and prevent dental problems
            before they start.
          </p>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            18 Prevention Guides Available
          </Badge>
        </div>

        {/* Prevention Tips */}
        <Card className="mb-12 bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <CheckCircle className="w-5 h-5 mr-2" />
              Essential Prevention Tips
            </CardTitle>
            <CardDescription className="text-green-700">
              Follow these simple steps to maintain excellent oral health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {preventionTips.map((tip, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-green-700">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Prevention Pillars */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Four Pillars of Prevention</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {preventionPillars.map((pillar, index) => (
              <Card key={index} className="hover-lift hover-glow text-center">
                <CardHeader>
                  <div className="text-4xl mb-4">{pillar.icon}</div>
                  <CardTitle className="text-lg">{pillar.title}</CardTitle>
                  <CardDescription>{pillar.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className={`${pillar.color} mb-4`}>
                    {pillar.articles} articles
                  </Badge>
                  <Button variant="outline" className="w-full bg-transparent">
                    Learn More
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Featured Articles */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Essential Reading</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredArticles.map((article, index) => (
              <Card key={index} className="hover-lift hover-glow overflow-hidden">
                <div className="aspect-video bg-gray-100 relative">
                  <img
                    src={article.image || "/placeholder.svg"}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                  {article.isEssential && (
                    <Badge className="absolute top-3 left-3 bg-green-600 text-white">Essential</Badge>
                  )}
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
            <h2 className="text-2xl font-bold text-gray-900">All Prevention Articles</h2>
            <Button variant="outline" className="bg-transparent">
              Sort by: Category
            </Button>
          </div>
          <div className="space-y-4">
            {allArticles.map((article, index) => (
              <Card key={index} className="hover-lift">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Link href={article.href} className="block">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900 hover:text-primary transition-colors">
                            {article.title}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {article.category}
                          </Badge>
                        </div>
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

        {/* Prevention Schedule CTA */}
        <Card className="mt-12 bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <Calendar className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-900 mb-2">Stay on Track</h3>
              <p className="text-green-700 mb-6 max-w-2xl mx-auto">
                Regular dental checkups are essential for maintaining good oral health. Find a dentist near you and
                schedule your next appointment.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/find-dentist">
                  <Button className="bg-green-600 hover:bg-green-700">Find a Dentist</Button>
                </Link>
                <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-100 bg-transparent">
                  Set Reminders
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
