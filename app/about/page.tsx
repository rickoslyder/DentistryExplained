'use client'

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, Shield, Award, Heart, Target, CheckCircle, Mail } from "lucide-react"
import Link from "next/link"
import { OptimizedImage } from "@/components/ui/optimized-image"

export default function AboutPage() {
  const teamMembers = [
    {
      name: "Dr. Sarah Johnson",
      role: "Chief Dental Officer",
      qualifications: "BDS, MFDS RCS(Ed)",
      bio: "With over 15 years in general dentistry, Dr. Johnson leads our clinical content review process.",
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      name: "Dr. Michael Chen",
      role: "Specialist Advisor",
      qualifications: "BDS, MClinDent (Perio)",
      bio: "Specialist in periodontics, ensuring our gum disease content meets the highest standards.",
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      name: "Dr. Emma Williams",
      role: "Pediatric Consultant",
      qualifications: "BDS, MSc Paediatric Dentistry",
      bio: "Specialist in children's dentistry, reviewing all pediatric dental content.",
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      name: "James Mitchell",
      role: "Content Director",
      qualifications: "MSc Health Communication",
      bio: "Ensures all content is accessible and easy to understand for patients.",
      image: "/placeholder.svg?height=200&width=200",
    },
  ]

  const values = [
    {
      icon: Shield,
      title: "Evidence-Based",
      description: "All content is based on current clinical evidence and best practices.",
    },
    {
      icon: Heart,
      title: "Patient-Centered",
      description: "We prioritize patient understanding and empowerment in dental health decisions.",
    },
    {
      icon: Users,
      title: "Professional Excellence",
      description: "Supporting dental professionals with high-quality resources and tools.",
    },
    {
      icon: Target,
      title: "Accessibility",
      description: "Making dental education accessible to everyone, regardless of background.",
    },
  ]

  const achievements = [
    {
      number: "50,000+",
      label: "Monthly Users",
      description: "Patients and professionals trust our platform",
    },
    {
      number: "126",
      label: "Articles Published",
      description: "Comprehensive coverage of dental topics",
    },
    {
      number: "15",
      label: "Expert Reviewers",
      description: "Qualified dental professionals ensure accuracy",
    },
    {
      number: "2,000+",
      label: "Professionals",
      description: "Verified dental professionals use our platform",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">About Dentistry Explained</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            We're on a mission to make dental health information accessible, accurate, and easy to understand for
            everyone in the UK.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Established 2025
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              UK-Based
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Evidence-Based
            </Badge>
          </div>
        </div>

        {/* Mission Statement */}
        <Card className="mb-16 bg-primary/5 border-primary/20">
          <CardContent className="pt-8">
            <div className="text-center">
              <BookOpen className="w-12 h-12 text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-lg text-gray-700 max-w-4xl mx-auto">
                To bridge the gap between dental professionals and patients by providing comprehensive, evidence-based
                dental education that empowers informed decision-making and promotes better oral health outcomes across
                the UK.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Values */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover-lift">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Achievements */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-primary mb-2">{achievement.number}</div>
                  <div className="font-semibold text-gray-900 mb-1">{achievement.label}</div>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Our Expert Team</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Our content is reviewed by qualified dental professionals to ensure accuracy and clinical relevance.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="text-center hover-lift">
                <CardHeader>
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                    <OptimizedImage
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      width={96}
                      height={96}
                      className="rounded-full"
                    />
                  </div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <CardDescription className="font-medium text-primary">{member.role}</CardDescription>
                  <Badge variant="outline" className="mt-2">
                    {member.qualifications}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Quality Assurance */}
        <Card className="mb-16 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <Award className="w-6 h-6 mr-3" />
              Quality Assurance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-blue-900 mb-3">Content Review Process</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-blue-800">All content reviewed by qualified dental professionals</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-blue-800">Regular updates based on latest clinical evidence</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-blue-800">Fact-checking against authoritative sources</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-3">Professional Standards</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-blue-800">Compliance with GDC guidelines</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-blue-800">Adherence to NHS clinical standards</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-blue-800">Regular content audits and updates</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <Card className="text-center">
          <CardContent className="pt-8">
            <Mail className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Have questions about our content, want to contribute, or need support? We'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button>
                  Contact Us
                  <Mail className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/professional">
                <Button variant="outline" className="bg-transparent">
                  Join as Professional
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}
