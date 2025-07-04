"use client"
import { Calendar, Clock, User, BookOpen, Share2, Bookmark, ChevronRight } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { useBookmarks } from "@/hooks/use-bookmarks"

export default function ToothDecayPage() {
  const { isBookmarked, toggleBookmark, isLoading } = useBookmarks()
  const articleData = {
    slug: "dental-problems/tooth-decay",
    title: "Understanding Tooth Decay",
    category: "Dental Problems",
    readTime: "5 min",
  }

  const tableOfContents = [
    { id: "what-is-tooth-decay", title: "What is Tooth Decay?" },
    { id: "causes", title: "Causes of Tooth Decay" },
    { id: "symptoms", title: "Signs and Symptoms" },
    { id: "stages", title: "Stages of Tooth Decay" },
    { id: "prevention", title: "Prevention" },
    { id: "treatment", title: "Treatment Options" },
    { id: "when-to-see-dentist", title: "When to See a Dentist" },
  ]

  const relatedArticles = [
    {
      title: "Gum Disease: Causes and Treatment",
      category: "Dental Problems",
      readTime: "7 min",
      href: "/dental-problems/gum-disease",
    },
    {
      title: "Daily Oral Hygiene Routine",
      category: "Prevention",
      readTime: "5 min",
      href: "/prevention/daily-oral-hygiene",
    },
    {
      title: "Dental Fillings: What to Expect",
      category: "Treatments",
      readTime: "8 min",
      href: "/treatments/dental-fillings",
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
          <Link href="/dental-problems" className="hover:text-primary">
            Dental Problems
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Tooth Decay</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Article Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  Dental Problems
                </Badge>
                <Badge variant="outline">Essential Reading</Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Understanding Tooth Decay: Causes, Prevention, and Treatment
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Learn about tooth decay, one of the most common dental problems worldwide. Discover what causes
                cavities, how to prevent them, and what treatment options are available.
              </p>

              {/* Article Meta */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Last updated: December 15, 2024
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />5 min read
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Medically reviewed by Dr. Sarah Johnson, BDS
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4 mb-8">
                <Button variant="outline" size="sm" onClick={() => toggleBookmark(articleData)} disabled={isLoading}>
                  <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked(articleData.slug) ? "fill-current" : ""}`} />
                  {isBookmarked(articleData.slug) ? "Saved" : "Save Article"}
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Reading Level: Basic
                </Button>
              </div>
            </div>

            {/* Article Content */}
            <div className="prose prose-lg max-w-none">
              <section id="what-is-tooth-decay" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">What is Tooth Decay?</h2>
                <p className="text-gray-700 mb-4">
                  Tooth decay, also known as dental caries or cavities, is the breakdown of teeth due to acids made by
                  bacteria. The acid removes minerals from the tooth enamel, allowing the bacteria to get into the
                  tooth. When this happens, areas of the tooth begin to break down, creating small holes called
                  cavities.
                </p>
                <p className="text-gray-700 mb-4">
                  Tooth decay is one of the most common chronic diseases worldwide, affecting people of all ages. If
                  left untreated, cavities can cause pain, infection, and even tooth loss.
                </p>
              </section>

              <section id="causes" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Causes of Tooth Decay</h2>
                <p className="text-gray-700 mb-4">
                  Tooth decay is caused by a combination of factors working together over time:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li>
                    <strong>Bacteria in your mouth:</strong> Your mouth naturally contains bacteria. Some of these
                    bacteria form a sticky film called plaque on your teeth.
                  </li>
                  <li>
                    <strong>Frequent snacking and sugary drinks:</strong> When you eat or drink foods containing sugars
                    and starches, the bacteria in plaque produce acids.
                  </li>
                  <li>
                    <strong>Poor oral hygiene:</strong> Not brushing and flossing regularly allows plaque to build up
                    and attack your tooth enamel.
                  </li>
                  <li>
                    <strong>Lack of fluoride:</strong> Fluoride helps prevent cavities and can even reverse early stages
                    of tooth decay.
                  </li>
                </ul>
              </section>

              <section id="symptoms" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Signs and Symptoms</h2>
                <p className="text-gray-700 mb-4">
                  The signs and symptoms of tooth decay vary depending on the extent and location of the cavity. When a
                  cavity is just beginning, you may not have any symptoms at all. As the decay gets larger, it may
                  cause:
                </p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Toothache or spontaneous pain</li>
                    <li>Tooth sensitivity to sweet, hot, or cold foods and drinks</li>
                    <li>Visible holes or pits in your teeth</li>
                    <li>Brown, black, or white staining on the surface of a tooth</li>
                    <li>Pain when you bite down</li>
                    <li>Bad breath or bad taste in your mouth</li>
                  </ul>
                </div>
              </section>

              <section id="stages" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Stages of Tooth Decay</h2>
                <p className="text-gray-700 mb-4">Tooth decay develops in stages:</p>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-400 pl-4">
                    <h3 className="font-semibold text-gray-900">Stage 1: Initial Demineralization</h3>
                    <p className="text-gray-700">
                      The outer layer of your teeth (enamel) begins to lose minerals due to acid exposure. You may
                      notice white spots on your teeth.
                    </p>
                  </div>
                  <div className="border-l-4 border-yellow-400 pl-4">
                    <h3 className="font-semibold text-gray-900">Stage 2: Enamel Decay</h3>
                    <p className="text-gray-700">
                      The enamel continues to break down, and the white spots may turn brown. Small holes begin to form.
                    </p>
                  </div>
                  <div className="border-l-4 border-orange-400 pl-4">
                    <h3 className="font-semibold text-gray-900">Stage 3: Dentin Decay</h3>
                    <p className="text-gray-700">
                      The decay reaches the dentin (the layer under the enamel). You may experience pain and
                      sensitivity.
                    </p>
                  </div>
                  <div className="border-l-4 border-red-400 pl-4">
                    <h3 className="font-semibold text-gray-900">Stage 4: Pulp Damage</h3>
                    <p className="text-gray-700">
                      The decay reaches the pulp (the innermost layer containing nerves and blood vessels). This often
                      causes severe pain.
                    </p>
                  </div>
                </div>
              </section>

              <section id="prevention" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Prevention</h2>
                <p className="text-gray-700 mb-4">
                  The good news is that tooth decay is largely preventable. Here are the most effective ways to prevent
                  cavities:
                </p>
                <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Daily Oral Hygiene</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Brush your teeth at least twice a day with fluoride toothpaste</li>
                    <li>Floss daily to remove plaque between teeth</li>
                    <li>Use an antimicrobial mouthwash</li>
                  </ul>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Dietary Changes</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Limit sugary and starchy foods and drinks</li>
                    <li>Choose water over sugary drinks</li>
                    <li>Eat tooth-healthy foods like cheese, leafy greens, and almonds</li>
                  </ul>
                </div>
                <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Regular Dental Care</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Visit your dentist regularly for checkups and cleanings</li>
                    <li>Ask about dental sealants for back teeth</li>
                    <li>Consider fluoride treatments if recommended</li>
                  </ul>
                </div>
              </section>

              <section id="treatment" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Treatment Options</h2>
                <p className="text-gray-700 mb-4">
                  Treatment for tooth decay depends on how severe it is and your particular situation. Options include:
                </p>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Fluoride Treatments</h3>
                    <p className="text-gray-700">
                      For early-stage decay, professional fluoride treatments can help restore tooth enamel and reverse
                      very early cavities.
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Fillings</h3>
                    <p className="text-gray-700">
                      When decay has progressed beyond the earliest stage, fillings are the main treatment option.
                      Materials include composite resin, porcelain, or dental amalgam.
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Crowns</h3>
                    <p className="text-gray-700">
                      For extensive decay or weakened teeth, you may need a crown — a custom-fitted covering that
                      replaces your tooth's entire natural crown.
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Root Canal Treatment</h3>
                    <p className="text-gray-700">
                      When decay reaches the inner material of your tooth (pulp), root canal treatment may be needed to
                      repair and save the tooth.
                    </p>
                  </div>
                </div>
              </section>

              <section id="when-to-see-dentist" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">When to See a Dentist</h2>
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">See a dentist immediately if you experience:</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Severe toothache</li>
                    <li>Swelling in your face or gums</li>
                    <li>Fever along with dental pain</li>
                    <li>Difficulty swallowing</li>
                  </ul>
                </div>
                <p className="text-gray-700">
                  Even if you don't have symptoms, regular dental checkups every 6 months can help detect and treat
                  tooth decay early, when treatment is easier and less expensive.
                </p>
              </section>
            </div>

            {/* Medical Review */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
              <h3 className="font-semibold text-gray-900 mb-2">Medical Review</h3>
              <p className="text-sm text-gray-700">
                This article was medically reviewed by Dr. Sarah Johnson, BDS, a practicing dentist with over 15 years
                of experience in general dentistry. Last reviewed on December 15, 2024.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Table of Contents */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Table of Contents</CardTitle>
                </CardHeader>
                <CardContent>
                  <nav className="space-y-2">
                    {tableOfContents.map((item, index) => (
                      <a
                        key={index}
                        href={`#${item.id}`}
                        className="block text-sm text-gray-600 hover:text-primary transition-colors py-1"
                      >
                        {item.title}
                      </a>
                    ))}
                  </nav>
                </CardContent>
              </Card>

              {/* Related Articles */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Related Articles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {relatedArticles.map((article, index) => (
                      <div key={index}>
                        <Link href={article.href} className="block hover:bg-gray-50 p-2 rounded transition-colors">
                          <h3 className="font-medium text-sm text-gray-900 mb-1">{article.title}</h3>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{article.category}</span>
                            <span>{article.readTime}</span>
                          </div>
                        </Link>
                        {index < relatedArticles.length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/find-dentist">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      Find a Dentist Near You
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    Ask Our AI Assistant
                  </Button>
                  <Link href="/emergency">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                    >
                      Dental Emergency?
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
