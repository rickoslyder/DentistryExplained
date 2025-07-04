import Link from "next/link"
import { Shield, FileText, Users, BookOpen, Download, Star, CheckCircle, ArrowRight } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ProfessionalPage() {
  const features = [
    {
      icon: FileText,
      title: "Consent Form Templates",
      description: "Access professionally designed consent forms for all common procedures",
      color: "bg-blue-500",
    },
    {
      icon: BookOpen,
      title: "Patient Education Materials",
      description: "Downloadable handouts and educational resources for your patients",
      color: "bg-green-500",
    },
    {
      icon: Users,
      title: "Practice Management",
      description: "Manage your practice listing and connect with potential patients",
      color: "bg-purple-500",
    },
    {
      icon: Shield,
      title: "Professional Verification",
      description: "Get verified with your GDC number for enhanced credibility",
      color: "bg-orange-500",
    },
  ]

  const resources = [
    {
      title: "Treatment Consent Forms",
      description: "Comprehensive consent forms for all dental procedures",
      items: ["Root Canal Treatment", "Dental Implants", "Tooth Extraction", "Orthodontic Treatment"],
      downloadCount: "2.3k downloads",
    },
    {
      title: "Patient Information Leaflets",
      description: "Educational materials to help patients understand their treatment",
      items: ["Post-Operative Care", "Oral Hygiene Instructions", "Diet Advice", "Emergency Procedures"],
      downloadCount: "1.8k downloads",
    },
    {
      title: "Clinical Guidelines",
      description: "Evidence-based guidelines and best practices",
      items: ["Infection Control", "Radiography Guidelines", "Pain Management", "Medical Emergencies"],
      downloadCount: "1.2k downloads",
    },
  ]

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      practice: "Smile Dental Practice",
      quote:
        "The patient education materials have transformed how I communicate with my patients. They're much more informed and engaged in their treatment.",
      rating: 5,
    },
    {
      name: "Dr. Michael Chen",
      practice: "Central London Dental",
      quote:
        "Having access to professionally designed consent forms saves me hours each week. The templates are comprehensive and legally sound.",
      rating: 5,
    },
    {
      name: "Dr. Emma Williams",
      practice: "Family Dental Care",
      quote:
        "The practice management tools have helped me connect with new patients and grow my practice significantly.",
      rating: 5,
    },
  ]

  const pricingTiers = [
    {
      name: "Professional",
      price: "£9.99",
      period: "per month",
      description: "Perfect for individual practitioners",
      features: [
        "Unlimited consent form downloads",
        "Patient education materials",
        "Professional verification badge",
        "Priority support",
        "Monthly clinical updates",
      ],
      popular: false,
    },
    {
      name: "Practice",
      price: "£29.99",
      period: "per month",
      description: "Ideal for dental practices",
      features: [
        "Everything in Professional",
        "Up to 5 team members",
        "Practice listing management",
        "Custom branding options",
        "Analytics dashboard",
        "API access",
      ],
      popular: true,
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">For Dental Professionals</Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Enhance Your Practice with
              <span className="text-primary block">Professional Resources</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Access comprehensive patient education materials, consent forms, and practice management tools designed
              specifically for UK dental professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Practice
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Streamline your workflow with our comprehensive suite of professional tools and resources.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover-lift hover-glow">
                <CardHeader>
                  <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Professional Resources</h2>
            <p className="text-xl text-gray-600">
              Comprehensive materials trusted by thousands of dental professionals across the UK
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {resources.map((resource, index) => (
              <Card key={index} className="hover-lift hover-glow">
                <CardHeader>
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {resource.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{resource.downloadCount}</span>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Trusted by Professionals</h2>
            <p className="text-xl text-gray-600">See what dental professionals are saying about our platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover-lift">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 mb-4">"{testimonial.quote}"</blockquote>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.practice}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
            <p className="text-xl text-gray-600">Start with a 14-day free trial. No credit card required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {pricingTiers.map((tier, index) => (
              <Card key={index} className={`hover-lift ${tier.popular ? "ring-2 ring-primary" : ""}`}>
                <CardHeader>
                  {tier.popular && <Badge className="w-fit mb-2 bg-primary text-white">Most Popular</Badge>}
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="flex items-baseline mt-4">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-gray-500 ml-2">{tier.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={tier.popular ? "default" : "outline"}>
                    Start Free Trial
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Practice?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join over 2,000 dental professionals who trust Dentistry Explained for their practice needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Start Free Trial
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary bg-transparent"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
