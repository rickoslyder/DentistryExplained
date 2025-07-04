import Link from "next/link"
import { ArrowRight, BookOpen, Users, Search, Bot, Shield, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { FindDentistWidget } from "@/components/widgets/find-dentist-widget"
import { HealthAssessmentWidget } from "@/components/widgets/health-assessment-widget"
import { EmergencyGuideWidget } from "@/components/widgets/emergency-guide-widget"
import { NewsletterWidget } from "@/components/widgets/newsletter-widget"
import { OptimizedImage } from "@/components/ui/optimized-image"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 to-blue-50 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Your Trusted Source for
                <span className="text-primary block">Dental Education</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                Evidence-based dental information for patients and professionals. Get expert guidance with our
                AI-powered assistant and comprehensive educational resources.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/topics">
                  <Button size="lg" className="w-full sm:w-auto">
                    Explore Topics
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/find-dentist">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
                    Find a Dentist
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <OptimizedImage
                  src="/images/hero.webp"
                  alt="Happy family smiling showing healthy teeth - dental health concept"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  className="rounded-2xl"
                />
              </div>
              {/* Floating elements for visual interest */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Know About Dental Health
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From basic oral hygiene to complex procedures, we provide comprehensive, easy-to-understand dental
              education.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover-lift hover-glow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Comprehensive Topics</CardTitle>
                <CardDescription>
                  Browse hundreds of articles covering all aspects of dental health, from prevention to advanced
                  treatments.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-lift hover-glow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>AI Dental Assistant</CardTitle>
                <CardDescription>
                  Get instant answers to your dental questions with our AI-powered assistant trained on evidence-based
                  information.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-lift hover-glow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>For Professionals</CardTitle>
                <CardDescription>
                  Access patient education materials, consent forms, and professional resources to enhance your
                  practice.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-lift hover-glow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Smart Search</CardTitle>
                <CardDescription>
                  Find exactly what you're looking for with our intelligent search that understands dental terminology.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-lift hover-glow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Evidence-Based</CardTitle>
                <CardDescription>
                  All content is reviewed by dental professionals and based on the latest clinical evidence and
                  guidelines.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-lift hover-glow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Always Updated</CardTitle>
                <CardDescription>
                  Stay current with the latest developments in dental care and treatment options.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Popular Topics Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Popular Topics</h2>
            <p className="text-xl text-gray-600">Start with these commonly searched dental topics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Tooth Decay",
                description: "Causes, prevention, and treatment",
                href: "/dental-problems/tooth-decay",
                color: "bg-blue-500",
              },
              {
                title: "Gum Disease",
                description: "Symptoms and management",
                href: "/dental-problems/gum-disease",
                color: "bg-green-500",
              },
              {
                title: "Dental Implants",
                description: "Complete guide to implants",
                href: "/treatments/dental-implants",
                color: "bg-purple-500",
              },
              {
                title: "Teeth Whitening",
                description: "Safe whitening options",
                href: "/treatments/teeth-whitening",
                color: "bg-orange-500",
              },
            ].map((topic, index) => (
              <Link key={index} href={topic.href}>
                <Card className="hover-lift hover-glow cursor-pointer h-full">
                  <CardHeader>
                    <div className={`w-12 h-12 ${topic.color} rounded-lg flex items-center justify-center mb-4`}>
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{topic.title}</CardTitle>
                    <CardDescription>{topic.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/topics">
              <Button variant="outline" size="lg">
                View All Topics
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Find a Dentist Widget */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FindDentistWidget />
        </div>
      </section>

      {/* Interactive Tools Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Interactive Health Tools</h2>
            <p className="text-xl text-gray-600">
              Get personalized insights and immediate guidance for your dental health
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <HealthAssessmentWidget />
            <EmergencyGuideWidget />
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <NewsletterWidget />
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted by Professionals</h2>
            <p className="text-gray-600">Our content is reviewed by qualified dental professionals</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">15+</div>
              <div className="text-gray-600">Expert Reviewers</div>
              <div className="text-sm text-gray-500">GDC Registered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">2,000+</div>
              <div className="text-gray-600">Professionals</div>
              <div className="text-sm text-gray-500">Using Our Platform</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">50K+</div>
              <div className="text-gray-600">Monthly Users</div>
              <div className="text-sm text-gray-500">Trust Our Content</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">126</div>
              <div className="text-gray-600">Articles</div>
              <div className="text-sm text-gray-500">Medically Reviewed</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Take Control of Your Dental Health?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of patients and professionals who trust Dentistry Explained for reliable dental information.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
            <Link href="/professional">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary bg-transparent"
              >
                For Professionals
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
