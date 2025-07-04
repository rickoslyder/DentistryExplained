"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  Star,
  Calendar,
  Award,
  ChevronRight,
  Navigation,
  Accessibility,
  Shield,
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

interface TeamMember {
  name: string
  role: string
  qualifications: string[]
  bio: string
  image: string
}

interface Review {
  id: string
  author: string
  rating: number
  date: string
  comment: string
  treatment: string
}

interface PracticeProfile {
  id: string
  name: string
  description: string
  address: string
  postcode: string
  phone: string
  email: string
  website?: string
  rating: number
  reviewCount: number
  services: string[]
  specialties: string[]
  nhsAccepted: boolean
  privateAccepted: boolean
  emergencyServices: boolean
  wheelchairAccess: boolean
  parkingAvailable: boolean
  openingHours: {
    [key: string]: { open: string; close: string; isOpen: boolean }
  }
  teamMembers: TeamMember[]
  images: string[]
  priceRange: string
  languages: string[]
  established: string
  gdcRegistered: boolean
}

export default function DentistProfilePage() {
  const params = useParams()
  const [selectedImage, setSelectedImage] = useState(0)

  // Mock data - in real app, this would be fetched based on params.id
  const practice: PracticeProfile = {
    id: params.id as string,
    name: "Smile Dental Practice",
    description:
      "A modern, patient-focused dental practice offering comprehensive dental care in a comfortable, welcoming environment. We pride ourselves on using the latest technology and techniques to provide the highest quality dental treatment.",
    address: "123 High Street, Manchester",
    postcode: "M1 2AB",
    phone: "0161 123 4567",
    email: "info@smiledental.co.uk",
    website: "www.smiledental.co.uk",
    rating: 4.8,
    reviewCount: 127,
    services: [
      "General Dentistry",
      "Cosmetic Dentistry",
      "Orthodontics",
      "Dental Implants",
      "Teeth Whitening",
      "Emergency Care",
      "Hygienist Services",
      "Root Canal Treatment",
    ],
    specialties: ["Cosmetic Dentistry", "Orthodontics", "Implant Dentistry"],
    nhsAccepted: true,
    privateAccepted: true,
    emergencyServices: true,
    wheelchairAccess: true,
    parkingAvailable: true,
    openingHours: {
      Monday: { open: "9:00", close: "17:30", isOpen: true },
      Tuesday: { open: "9:00", close: "17:30", isOpen: true },
      Wednesday: { open: "9:00", close: "17:30", isOpen: true },
      Thursday: { open: "9:00", close: "19:00", isOpen: true },
      Friday: { open: "9:00", close: "17:00", isOpen: true },
      Saturday: { open: "9:00", close: "13:00", isOpen: true },
      Sunday: { open: "", close: "", isOpen: false },
    },
    teamMembers: [
      {
        name: "Dr. Sarah Johnson",
        role: "Principal Dentist",
        qualifications: ["BDS", "MFDS RCS(Ed)", "MSc Cosmetic Dentistry"],
        bio: "Dr. Johnson has over 15 years of experience in general and cosmetic dentistry. She is passionate about creating beautiful, healthy smiles and ensuring patient comfort.",
        image: "/placeholder.svg?height=200&width=200",
      },
      {
        name: "Dr. Michael Chen",
        role: "Associate Dentist",
        qualifications: ["BDS", "PgCert Orthodontics"],
        bio: "Specializing in orthodontics and preventive dentistry, Dr. Chen is dedicated to helping patients achieve optimal oral health.",
        image: "/placeholder.svg?height=200&width=200",
      },
      {
        name: "Emma Williams",
        role: "Dental Hygienist",
        qualifications: ["Dip DH", "NEBDN"],
        bio: "Emma provides comprehensive hygiene treatments and patient education to help maintain excellent oral health.",
        image: "/placeholder.svg?height=200&width=200",
      },
    ],
    images: [
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
    ],
    priceRange: "££",
    languages: ["English", "Spanish", "Mandarin"],
    established: "2008",
    gdcRegistered: true,
  }

  const reviews: Review[] = [
    {
      id: "1",
      author: "Sarah M.",
      rating: 5,
      date: "2024-12-10",
      comment:
        "Excellent service from Dr. Johnson. Very professional and made me feel at ease. The practice is modern and clean.",
      treatment: "Dental Cleaning",
    },
    {
      id: "2",
      author: "James R.",
      rating: 5,
      date: "2024-12-05",
      comment:
        "Had my teeth whitened here and the results are amazing! Staff were friendly and explained everything clearly.",
      treatment: "Teeth Whitening",
    },
    {
      id: "3",
      author: "Lisa K.",
      rating: 4,
      date: "2024-11-28",
      comment:
        "Great experience with Dr. Chen for my orthodontic consultation. Very knowledgeable and patient with my questions.",
      treatment: "Orthodontic Consultation",
    },
  ]

  const getCurrentStatus = () => {
    const now = new Date()
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" })
    const currentTime = now.getHours() * 100 + now.getMinutes()

    const todayHours = practice.openingHours[currentDay]
    if (!todayHours.isOpen) return { status: "Closed", message: "Closed today" }

    const openTime = Number.parseInt(todayHours.open.replace(":", ""))
    const closeTime = Number.parseInt(todayHours.close.replace(":", ""))

    if (currentTime >= openTime && currentTime <= closeTime) {
      return { status: "Open", message: `Open until ${todayHours.close}` }
    }
    return { status: "Closed", message: `Opens at ${todayHours.open}` }
  }

  const status = getCurrentStatus()

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
          <Link href="/find-dentist" className="hover:text-primary">
            Find a Dentist
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">{practice.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{practice.name}</h1>
                  <div className="flex items-center space-x-4 text-gray-600 mb-2">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {practice.address}, {practice.postcode}
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                      {practice.rating} ({practice.reviewCount} reviews)
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={status.status === "Open" ? "default" : "secondary"}
                      className={status.status === "Open" ? "bg-green-600" : ""}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {status.message}
                    </Badge>
                    {practice.gdcRegistered && (
                      <Badge variant="outline" className="border-blue-200 text-blue-700">
                        <Shield className="w-3 h-3 mr-1" />
                        GDC Registered
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Options */}
              <div className="flex flex-wrap gap-2 mb-4">
                {practice.nhsAccepted && <Badge className="bg-blue-100 text-blue-800">NHS Patients</Badge>}
                {practice.privateAccepted && <Badge className="bg-green-100 text-green-800">Private Patients</Badge>}
                {practice.emergencyServices && <Badge className="bg-red-100 text-red-800">Emergency Care</Badge>}
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden">
                <img
                  src={practice.images[selectedImage] || "/placeholder.svg"}
                  alt={`${practice.name} - Image ${selectedImage + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {practice.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-video rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? "border-primary" : "border-gray-200"
                    }`}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About This Practice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{practice.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Established:</span> {practice.established}
                      </div>
                      <div>
                        <span className="font-medium">Price Range:</span> {practice.priceRange}
                      </div>
                      <div>
                        <span className="font-medium">Languages:</span> {practice.languages.join(", ")}
                      </div>
                      <div>
                        <span className="font-medium">Specialties:</span> {practice.specialties.join(", ")}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Facilities & Accessibility</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <Accessibility className="w-5 h-5 mr-2 text-green-600" />
                        <span className={practice.wheelchairAccess ? "text-green-700" : "text-gray-500"}>
                          {practice.wheelchairAccess ? "Wheelchair Accessible" : "Not Wheelchair Accessible"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-green-600" />
                        <span className={practice.parkingAvailable ? "text-green-700" : "text-gray-500"}>
                          {practice.parkingAvailable ? "Parking Available" : "No Parking"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="services" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Services Offered</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {practice.services.map((service, index) => (
                        <div key={index} className="flex items-center p-3 border rounded-lg">
                          <Award className="w-5 h-5 mr-3 text-primary" />
                          <span>{service}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="team" className="space-y-6">
                {practice.teamMembers.map((member, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-4">
                        <img
                          src={member.image || "/placeholder.svg"}
                          alt={member.name}
                          className="w-20 h-20 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{member.name}</h3>
                          <p className="text-primary font-medium mb-2">{member.role}</p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {member.qualifications.map((qual, qualIndex) => (
                              <Badge key={qualIndex} variant="outline" className="text-xs">
                                {qual}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-gray-600 text-sm">{member.bio}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Patient Reviews</h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="ml-1 font-medium">{practice.rating}</span>
                      </div>
                      <span className="text-gray-500">({practice.reviewCount} reviews)</span>
                    </div>
                  </div>
                  <Button variant="outline" className="bg-transparent">
                    Write a Review
                  </Button>
                </div>

                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium">{review.author}</span>
                              <Badge variant="outline" className="text-xs">
                                {review.treatment}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(review.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact & Booking */}
            <Card>
              <CardHeader>
                <CardTitle>Contact & Book</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" size="lg">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  <Phone className="w-4 h-4 mr-2" />
                  Call {practice.phone}
                </Button>
                {practice.website && (
                  <Button variant="outline" className="w-full bg-transparent">
                    <Globe className="w-4 h-4 mr-2" />
                    Visit Website
                  </Button>
                )}
                <div className="text-sm text-gray-600">
                  <div className="flex items-center mb-1">
                    <Phone className="w-4 h-4 mr-2" />
                    {practice.phone}
                  </div>
                  <div className="flex items-center mb-1">
                    <MapPin className="w-4 h-4 mr-2" />
                    {practice.address}
                  </div>
                  {practice.email && (
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      {practice.email}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Opening Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Opening Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(practice.openingHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="font-medium">{day}</span>
                      <span className={hours.isOpen ? "text-gray-700" : "text-gray-500"}>
                        {hours.isOpen ? `${hours.open} - ${hours.close}` : "Closed"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Interactive map would appear here</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full bg-transparent">
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
