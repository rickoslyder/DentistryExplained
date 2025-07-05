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
import { ViewCounter } from "@/components/article/view-counter"
import { RealtimePresence } from "@/components/article/realtime-presence"
import { BookmarkButton } from "@/components/article/bookmark-button"
import { useArticleReadingTracker } from "@/hooks/use-reading-history"

export default function DailyOralHygienePage() {
  const { isBookmarked, toggleBookmark, isLoading } = useBookmarks()
  const articleData = {
    slug: "prevention/daily-oral-hygiene",
    title: "Daily Oral Hygiene Routine",
    category: "Prevention",
    readTime: "5 min",
  }

  // Track reading progress
  useArticleReadingTracker({
    slug: articleData.slug,
    title: articleData.title,
    category: articleData.category,
  })

  const tableOfContents = [
    { id: "importance", title: "Why Daily Oral Hygiene Matters" },
    { id: "brushing", title: "Proper Brushing Technique" },
    { id: "flossing", title: "The Right Way to Floss" },
    { id: "mouthwash", title: "Using Mouthwash Effectively" },
    { id: "tools", title: "Essential Dental Tools" },
    { id: "routine", title: "Building Your Routine" },
    { id: "common-mistakes", title: "Common Mistakes to Avoid" },
  ]

  const relatedArticles = [
    {
      title: "Choosing the Right Toothbrush",
      category: "Prevention",
      readTime: "4 min",
      href: "/prevention/choosing-toothbrush",
    },
    {
      title: "Understanding Tooth Decay",
      category: "Dental Problems",
      readTime: "5 min",
      href: "/dental-problems/tooth-decay",
    },
    {
      title: "Professional Dental Cleanings",
      category: "Treatments",
      readTime: "6 min",
      href: "/treatments/dental-cleanings",
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
          <Link href="/prevention" className="hover:text-primary">
            Prevention
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Daily Oral Hygiene</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Article Header */}
            <div className="mb-8">
              <Badge className="mb-4 bg-green-100 text-green-800">Prevention</Badge>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{articleData.title}</h1>
              <p className="text-xl text-gray-600 mb-6">
                Master the fundamentals of daily oral care to maintain healthy teeth and gums for life.
              </p>

              {/* Article Meta */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  <span>Dr. Sarah Johnson</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Updated Dec 15, 2024</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{articleData.readTime} read</span>
                </div>
                <ViewCounter articleSlug={articleData.slug} showCurrentReaders={false} />
                <RealtimePresence articleSlug={articleData.slug} />
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleBookmark(articleData)}
                  disabled={isLoading}
                >
                  <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked(articleData.slug) ? "fill-current" : ""}`} />
                  {isBookmarked(articleData.slug) ? "Bookmarked" : "Bookmark"}
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            <Separator className="mb-8" />

            {/* Article Content */}
            <div className="prose prose-lg max-w-none">
              <section id="importance">
                <h2>Why Daily Oral Hygiene Matters</h2>
                <p>
                  Your daily oral hygiene routine is the foundation of good dental health. It's your first line 
                  of defense against tooth decay, gum disease, and other oral health problems that can affect 
                  your overall wellbeing.
                </p>
                <p>
                  A consistent oral care routine removes plaque—a sticky film of bacteria that forms on your 
                  teeth throughout the day. When plaque isn't removed, it can harden into tartar, leading to 
                  cavities and gum inflammation.
                </p>
              </section>

              <section id="brushing">
                <h2>Proper Brushing Technique</h2>
                <h3>The 2-2-2 Rule</h3>
                <ul>
                  <li><strong>2 times a day:</strong> Brush in the morning and before bed</li>
                  <li><strong>2 minutes each time:</strong> Spend at least 30 seconds on each quadrant</li>
                  <li><strong>2 hours after eating:</strong> Wait if you've consumed acidic foods or drinks</li>
                </ul>

                <h3>Technique Tips</h3>
                <ol>
                  <li>Hold your toothbrush at a 45-degree angle to your gums</li>
                  <li>Use gentle, circular motions—avoid aggressive scrubbing</li>
                  <li>Brush all surfaces: outer, inner, and chewing surfaces</li>
                  <li>Don't forget your tongue to remove bacteria and freshen breath</li>
                  <li>Replace your toothbrush every 3-4 months or when bristles fray</li>
                </ol>
              </section>

              <section id="flossing">
                <h2>The Right Way to Floss</h2>
                <p>
                  Flossing reaches the 40% of tooth surfaces that brushing can't clean. It removes plaque 
                  and food particles from between teeth and below the gumline.
                </p>
                <h3>Flossing Steps</h3>
                <ol>
                  <li>Use about 18 inches of floss, winding most around your middle fingers</li>
                  <li>Hold floss tightly between thumbs and forefingers</li>
                  <li>Guide floss between teeth using a gentle rubbing motion</li>
                  <li>Curve floss into a C-shape against one tooth</li>
                  <li>Slide it into the space between gum and tooth</li>
                  <li>Rub the side of the tooth, moving floss away from the gum</li>
                  <li>Repeat on the adjacent tooth</li>
                </ol>
              </section>

              <section id="common-mistakes">
                <h2>Common Mistakes to Avoid</h2>
                <Card className="mb-6 bg-red-50 border-red-200">
                  <CardContent className="pt-6">
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <span className="text-red-600 mr-2">✗</span>
                        Brushing too hard—this can damage enamel and irritate gums
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-600 mr-2">✗</span>
                        Using a worn toothbrush—ineffective at removing plaque
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-600 mr-2">✗</span>
                        Rushing through your routine—proper cleaning takes time
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-600 mr-2">✗</span>
                        Forgetting to floss—leaves harmful bacteria between teeth
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </section>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            {/* Table of Contents */}
            <Card className="mb-8 sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Table of Contents</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  {tableOfContents.map((item) => (
                    <a
                      key={item.id}
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
                    <Link key={index} href={article.href} className="block group">
                      <h4 className="font-medium text-gray-900 group-hover:text-primary transition-colors mb-1">
                        {article.title}
                      </h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Badge variant="outline" className="text-xs">
                          {article.category}
                        </Badge>
                        <span>•</span>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {article.readTime}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  )
}