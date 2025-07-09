import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import Link from "next/link"
import { 
  AlertTriangle, 
  HelpCircle, 
  BookOpen, 
  Search, 
  FileText, 
  Phone,
  Clock,
  Info,
  Stethoscope,
  Shield,
  CreditCard,
  Heart
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const resources = [
  {
    category: "Emergency & Urgent Care",
    items: [
      {
        title: "Emergency Dental Guide",
        description: "Immediate help for dental emergencies including severe pain, trauma, and infections.",
        href: "/emergency",
        icon: AlertTriangle,
        badge: "URGENT",
        badgeColor: "destructive" as const,
      },
      {
        title: "NHS 111",
        description: "24/7 NHS urgent care helpline for medical and dental emergencies.",
        href: "tel:111",
        icon: Phone,
        external: true,
      },
    ],
  },
  {
    category: "Educational Resources",
    items: [
      {
        title: "Dental Glossary",
        description: "Comprehensive A-Z guide of dental terms, procedures, and conditions explained in simple language.",
        href: "/glossary",
        icon: BookOpen,
      },
      {
        title: "Topics Overview",
        description: "Browse all dental topics organized by category - from prevention to treatments.",
        href: "/topics",
        icon: FileText,
      },
      {
        title: "Search Articles",
        description: "Find specific information quickly using our powerful search feature.",
        href: "/search",
        icon: Search,
      },
    ],
  },
  {
    category: "Patient Support",
    items: [
      {
        title: "Frequently Asked Questions",
        description: "Answers to common questions about dental health, treatments, and using our platform.",
        href: "/faq",
        icon: HelpCircle,
      },
      {
        title: "Find a Dentist",
        description: "Locate NHS and private dental practices in your area.",
        href: "/find-dentist",
        icon: Stethoscope,
      },
      {
        title: "Treatment Costs Guide",
        description: "Current NHS charges and typical private treatment costs.",
        href: "/treatments#costs",
        icon: CreditCard,
      },
    ],
  },
  {
    category: "Professional Resources",
    items: [
      {
        title: "Consent Forms Library",
        description: "Downloadable patient consent forms for dental professionals.",
        href: "/professional/resources/consent-forms",
        icon: Shield,
        badge: "PRO",
        badgeColor: "secondary" as const,
      },
      {
        title: "Patient Education Materials",
        description: "Printable guides and leaflets for patient education.",
        href: "/professional/resources/patient-education",
        icon: Heart,
        badge: "PRO",
        badgeColor: "secondary" as const,
      },
    ],
  },
  {
    category: "Platform Information",
    items: [
      {
        title: "About Us",
        description: "Learn about our mission to democratize dental education in the UK.",
        href: "/about",
        icon: Info,
      },
      {
        title: "Contact & Support",
        description: "Get help with using the platform or report issues.",
        href: "/support",
        icon: HelpCircle,
      },
      {
        title: "Opening Hours Guide",
        description: "Typical dental practice hours and out-of-hours services.",
        href: "/emergency#out-of-hours",
        icon: Clock,
      },
    ],
  },
]

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Dental Resources Hub
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Access essential tools, guides, and information to help you manage your dental health. 
            From emergency care to educational materials, find everything you need in one place.
          </p>
        </div>

        {/* Quick Access Emergency Banner */}
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <h3 className="font-semibold text-lg">Dental Emergency?</h3>
                  <p className="text-muted-foreground">
                    Get immediate guidance for urgent dental problems
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button asChild variant="outline" className="border-red-300 hover:bg-red-100">
                  <Link href="/emergency">Emergency Guide</Link>
                </Button>
                <Button asChild variant="outline" className="border-red-300 hover:bg-red-100">
                  <a href="tel:111">Call NHS 111</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource Categories */}
        <div className="space-y-12">
          {resources.map((category) => (
            <div key={category.category}>
              <h2 className="text-2xl font-semibold mb-6">{category.category}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {category.items.map((item) => {
                  const Icon = item.icon
                  const isExternal = item.external || item.href.startsWith('http') || item.href.startsWith('tel:')
                  
                  return (
                    <Card key={item.title} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <Icon className="h-6 w-6 text-primary" />
                          {item.badge && (
                            <Badge variant={item.badgeColor || "default"}>
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button asChild variant="outline" className="w-full">
                          {isExternal ? (
                            <a 
                              href={item.href}
                              target={item.href.startsWith('http') ? "_blank" : undefined}
                              rel={item.href.startsWith('http') ? "noopener noreferrer" : undefined}
                            >
                              {item.href.startsWith('tel:') ? 'Call Now' : 'Visit Resource'}
                            </a>
                          ) : (
                            <Link href={item.href}>Visit Resource</Link>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Help Section */}
        <Card className="mt-12 bg-blue-50 border-blue-200">
          <CardHeader className="text-center">
            <CardTitle>Can't find what you're looking for?</CardTitle>
            <CardDescription className="text-base">
              Our AI dental assistant is here to help answer your questions
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Look for the AI Assistant button in the top navigation bar to get instant help with any dental question.
            </p>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}