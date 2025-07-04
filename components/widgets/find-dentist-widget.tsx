"use client"

import { useState } from "react"
import { MapPin, Search, Star, Phone, Clock, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface DentistPractice {
  id: string
  name: string
  address: string
  distance: number
  rating: number
  reviewCount: number
  services: string[]
  nextAvailable: string
  phone: string
}

export function FindDentistWidget() {
  const [location, setLocation] = useState("")
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  const quickFilters = [
    { id: "nhs", label: "NHS accepting", color: "bg-blue-100 text-blue-800" },
    { id: "emergency", label: "Emergency care", color: "bg-red-100 text-red-800" },
    { id: "family", label: "Family dentist", color: "bg-green-100 text-green-800" },
    { id: "cosmetic", label: "Cosmetic", color: "bg-purple-100 text-purple-800" },
  ]

  // Mock data based on the image
  const practices: DentistPractice[] = [
    {
      id: "1",
      name: "NHS Dental Centre Manchester",
      address: "123 High Street, Manchester, M1 2AB",
      distance: 0.3,
      rating: 4.8,
      reviewCount: 127,
      services: ["NHS", "Emergency", "Family"],
      nextAvailable: "Today 2:30 PM",
      phone: "0161 123 4567",
    },
    {
      id: "2",
      name: "SmileCare Dental Practice",
      address: "45 Church Lane, Manchester, M2 3CD",
      distance: 0.7,
      rating: 4.9,
      reviewCount: 203,
      services: ["Private", "Cosmetic", "Orthodontics"],
      nextAvailable: "Tomorrow 9:00 AM",
      phone: "0161 234 5678",
    },
    {
      id: "3",
      name: "Family Dental Clinic",
      address: "78 Park Road, Manchester, M3 4EF",
      distance: 1.2,
      rating: 4.7,
      reviewCount: 89,
      services: ["NHS", "Private", "Children"],
      nextAvailable: "Friday 11:15 AM",
      phone: "0161 345 6789",
    },
  ]

  const toggleFilter = (filterId: string) => {
    setSelectedFilters((prev) => (prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [...prev, filterId]))
  }

  const getServiceColor = (service: string) => {
    switch (service.toLowerCase()) {
      case "nhs":
        return "bg-blue-100 text-blue-800"
      case "private":
        return "bg-green-100 text-green-800"
      case "emergency":
        return "bg-red-100 text-red-800"
      case "cosmetic":
        return "bg-purple-100 text-purple-800"
      case "orthodontics":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Find a Dentist Near You</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover NHS and private dental practices in your area. View availability, services, and patient reviews.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Enter postcode or area"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <Link href="/find-dentist">
            <Button className="h-12 px-8">
              <Search className="w-4 h-4 mr-2" />
              Search Dentists
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="mb-8">
        <p className="text-sm font-medium text-gray-700 mb-3">Quick filters:</p>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <Button
              key={filter.id}
              variant={selectedFilters.includes(filter.id) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter(filter.id)}
              className={
                selectedFilters.includes(filter.id)
                  ? ""
                  : "bg-transparent hover:bg-gray-50 border-gray-200 text-gray-700"
              }
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Popular Practices */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Popular Practices in Manchester</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {practices.map((practice) => (
            <Card key={practice.id} className="hover-lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{practice.name}</CardTitle>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  {practice.address}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Navigation className="w-4 h-4 mr-1" />
                      {practice.distance} miles
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                      {practice.rating} ({practice.reviewCount})
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-4">
                  {practice.services.map((service, index) => (
                    <Badge key={index} variant="secondary" className={getServiceColor(service)}>
                      {service}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center text-sm text-green-600 font-medium mb-4">
                  <Clock className="w-4 h-4 mr-1" />
                  Next: {practice.nextAvailable}
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 bg-transparent"
                    onClick={() => window.location.href = `tel:${practice.phone}`}
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Call
                  </Button>
                  <Link href={`/find-dentist/${practice.id}`}>
                    <Button size="sm" className="flex-1">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-6">
          <Link href="/find-dentist">
            <Button variant="outline" className="bg-transparent">
              View All Dentists in Your Area
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
