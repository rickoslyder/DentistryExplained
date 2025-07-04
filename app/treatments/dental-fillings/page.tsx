"use client"
import { Calendar, Clock, User, BookOpen, Share2, Bookmark, ChevronRight, AlertCircle } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useBookmarks } from "@/hooks/use-bookmarks"

export default function DentalFillingsPage() {
  const { isBookmarked, toggleBookmark, isLoading } = useBookmarks()
  const articleData = {
    slug: "treatments/dental-fillings",
    title: "Dental Fillings: What to Expect",
    category: "Treatments",
    readTime: "8 min",
  }

  const tableOfContents = [
    { id: "what-are-fillings", title: "What Are Dental Fillings?" },
    { id: "when-needed", title: "When Are Fillings Needed?" },
    { id: "types", title: "Types of Filling Materials" },
    { id: "procedure", title: "The Filling Procedure" },
    { id: "aftercare", title: "Aftercare Instructions" },
    { id: "longevity", title: "How Long Do Fillings Last?" },
    { id: "complications", title: "Potential Complications" },
  ]

  const relatedArticles = [
    {
      title: "Understanding Tooth Decay",
      category: "Dental Problems",
      readTime: "5 min",
      href: "/dental-problems/tooth-decay",
    },
    {
      title: "Root Canal Treatment",
      category: "Treatments",
      readTime: "10 min",
      href: "/treatments/root-canal",
    },
    {
      title: "Dental Crown Procedure",
      category: "Treatments",
      readTime: "9 min",
      href: "/treatments/dental-crowns",
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
          <Link href="/treatments" className="hover:text-primary">
            Treatments
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Dental Fillings</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Article Header */}
            <div className="mb-8">
              <Badge className="mb-4 bg-blue-100 text-blue-800">Treatments</Badge>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{articleData.title}</h1>
              <p className="text-xl text-gray-600 mb-6">
                Learn about the dental filling procedure, different types of materials, and what to expect during and after treatment.
              </p>

              {/* Article Meta */}
              <div className="flex items-center space-x-6 text-sm text-gray-500 mb-6">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  <span>Dr. Michael Chen</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Updated Dec 10, 2024</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{articleData.readTime} read</span>
                </div>
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
              <section id="what-are-fillings">
                <h2>What Are Dental Fillings?</h2>
                <p>
                  Dental fillings are restorative materials used to repair teeth damaged by decay, cracks, or 
                  fractures. They restore the tooth's function, integrity, and morphology while preventing 
                  further decay.
                </p>
                <p>
                  The filling procedure involves removing the decayed portion of the tooth, cleaning the affected 
                  area, and filling the cavity with a suitable material. This seals off spaces where bacteria 
                  can enter and helps prevent further decay.
                </p>
              </section>

              <section id="when-needed">
                <h2>When Are Fillings Needed?</h2>
                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Regular dental check-ups can detect cavities early when they're smaller and easier to treat.
                  </AlertDescription>
                </Alert>
                
                <h3>Signs You May Need a Filling:</h3>
                <ul>
                  <li>Visible holes or pits in your teeth</li>
                  <li>Tooth sensitivity to hot, cold, or sweet foods</li>
                  <li>Pain when biting down</li>
                  <li>Dark spots or staining on tooth surface</li>
                  <li>Food getting stuck in certain areas</li>
                  <li>Rough or chipped tooth surfaces</li>
                </ul>
              </section>

              <section id="types">
                <h2>Types of Filling Materials</h2>
                
                <div className="space-y-4 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Composite Resin (White Fillings)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2">Tooth-colored material that blends naturally with your teeth.</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong className="text-green-600">Pros:</strong>
                          <ul className="mt-1 space-y-1">
                            <li>• Aesthetically pleasing</li>
                            <li>• Bonds directly to tooth</li>
                            <li>• Less tooth removal needed</li>
                          </ul>
                        </div>
                        <div>
                          <strong className="text-red-600">Cons:</strong>
                          <ul className="mt-1 space-y-1">
                            <li>• More expensive than amalgam</li>
                            <li>• May not last as long</li>
                            <li>• Can stain over time</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Amalgam (Silver Fillings)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2">Traditional filling material made from a mixture of metals.</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong className="text-green-600">Pros:</strong>
                          <ul className="mt-1 space-y-1">
                            <li>• Very durable (10-15 years)</li>
                            <li>• Less expensive</li>
                            <li>• Strong for back teeth</li>
                          </ul>
                        </div>
                        <div>
                          <strong className="text-red-600">Cons:</strong>
                          <ul className="mt-1 space-y-1">
                            <li>• Noticeable appearance</li>
                            <li>• More tooth removal</li>
                            <li>• Can expand/contract</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section id="procedure">
                <h2>The Filling Procedure</h2>
                <h3>What to Expect During Your Appointment:</h3>
                <ol>
                  <li>
                    <strong>Numbing:</strong> Local anesthetic is applied to numb the area around the tooth
                  </li>
                  <li>
                    <strong>Decay Removal:</strong> The dentist uses a drill or laser to remove the decayed area
                  </li>
                  <li>
                    <strong>Cleaning:</strong> The cavity is thoroughly cleaned to remove bacteria and debris
                  </li>
                  <li>
                    <strong>Etching (for composite):</strong> The tooth is prepared with an acid gel for better bonding
                  </li>
                  <li>
                    <strong>Filling Placement:</strong> The material is placed in layers and shaped
                  </li>
                  <li>
                    <strong>Curing:</strong> A special light hardens composite fillings
                  </li>
                  <li>
                    <strong>Polishing:</strong> The filling is polished to match your bite
                  </li>
                </ol>
              </section>

              <section id="aftercare">
                <h2>Aftercare Instructions</h2>
                <Card className="mb-6 bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg">First 24 Hours After Filling</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li>• Wait until numbness wears off before eating</li>
                      <li>• Avoid very hot or cold foods initially</li>
                      <li>• Chew on the opposite side if possible</li>
                      <li>• Take over-the-counter pain relievers if needed</li>
                      <li>• Contact your dentist if bite feels uneven</li>
                    </ul>
                  </CardContent>
                </Card>

                <h3>Long-term Care:</h3>
                <ul>
                  <li>Maintain good oral hygiene with regular brushing and flossing</li>
                  <li>Use fluoride toothpaste to strengthen surrounding enamel</li>
                  <li>Avoid extremely hard foods that could crack the filling</li>
                  <li>Attend regular dental check-ups</li>
                  <li>Watch for signs of filling wear or damage</li>
                </ul>
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