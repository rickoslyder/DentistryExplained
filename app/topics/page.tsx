import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Clock } from "lucide-react"
import Link from "next/link"

export default function TopicsPage() {
  const categories = [
    {
      id: "dental-problems",
      title: "Dental Problems",
      description: "Common dental issues, symptoms, and causes",
      articleCount: 24,
      color: "bg-red-500",
      articles: [
        { title: "Tooth Decay", slug: "tooth-decay", readTime: "5 min" },
        { title: "Gum Disease", slug: "gum-disease", readTime: "7 min" },
        { title: "Tooth Sensitivity", slug: "tooth-sensitivity", readTime: "4 min" },
        { title: "Bad Breath", slug: "bad-breath", readTime: "6 min" },
      ],
    },
    {
      id: "treatments",
      title: "Treatments",
      description: "Dental procedures and treatment options",
      articleCount: 32,
      color: "bg-blue-500",
      articles: [
        { title: "Dental Fillings", slug: "dental-fillings", readTime: "8 min" },
        { title: "Root Canal Treatment", slug: "root-canal", readTime: "10 min" },
        { title: "Dental Implants", slug: "dental-implants", readTime: "12 min" },
        { title: "Teeth Whitening", slug: "teeth-whitening", readTime: "6 min" },
      ],
    },
    {
      id: "prevention",
      title: "Prevention",
      description: "Maintaining good oral health and preventing problems",
      articleCount: 18,
      color: "bg-green-500",
      articles: [
        { title: "Daily Oral Hygiene", slug: "daily-oral-hygiene", readTime: "5 min" },
        { title: "Diet and Dental Health", slug: "diet-dental-health", readTime: "7 min" },
        { title: "Fluoride Benefits", slug: "fluoride-benefits", readTime: "4 min" },
        { title: "Regular Checkups", slug: "regular-checkups", readTime: "5 min" },
      ],
    },
    {
      id: "oral-surgery",
      title: "Oral Surgery",
      description: "Surgical procedures and what to expect",
      articleCount: 15,
      color: "bg-purple-500",
      articles: [
        { title: "Tooth Extraction", slug: "tooth-extraction", readTime: "9 min" },
        { title: "Wisdom Teeth Removal", slug: "wisdom-teeth", readTime: "11 min" },
        { title: "Dental Bone Grafts", slug: "bone-grafts", readTime: "8 min" },
        { title: "Gum Surgery", slug: "gum-surgery", readTime: "10 min" },
      ],
    },
    {
      id: "cosmetic-dentistry",
      title: "Cosmetic Dentistry",
      description: "Improving the appearance of your smile",
      articleCount: 21,
      color: "bg-pink-500",
      articles: [
        { title: "Veneers", slug: "veneers", readTime: "8 min" },
        { title: "Dental Bonding", slug: "dental-bonding", readTime: "6 min" },
        { title: "Smile Makeover", slug: "smile-makeover", readTime: "12 min" },
        { title: "Invisalign", slug: "invisalign", readTime: "9 min" },
      ],
    },
    {
      id: "pediatric-dentistry",
      title: "Pediatric Dentistry",
      description: "Dental care for children and adolescents",
      articleCount: 16,
      color: "bg-yellow-500",
      articles: [
        { title: "First Dental Visit", slug: "first-dental-visit", readTime: "6 min" },
        { title: "Baby Teeth Care", slug: "baby-teeth-care", readTime: "5 min" },
        { title: "Dental Sealants", slug: "dental-sealants", readTime: "4 min" },
        { title: "Orthodontics for Kids", slug: "orthodontics-kids", readTime: "8 min" },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Dental Topics</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our comprehensive collection of dental health topics. From basic oral care to advanced treatments,
            find the information you need.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {categories.map((category) => (
            <Card key={category.id} className="hover-lift hover-glow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center`}>
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{category.title}</CardTitle>
                      <CardDescription className="mt-1">{category.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">{category.articleCount} articles</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.articles.map((article, index) => (
                    <Link
                      key={index}
                      href={`/${category.id}/${article.slug}`}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{article.title}</h3>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{article.readTime}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <Link
                    href={`/categories/${category.id}`}
                    className="block text-center p-3 text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    View all {category.title.toLowerCase()} →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-16 bg-gray-50 rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">126</div>
              <div className="text-gray-600">Total Articles</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">15</div>
              <div className="text-gray-600">Expert Reviewers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">50K+</div>
              <div className="text-gray-600">Monthly Readers</div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
