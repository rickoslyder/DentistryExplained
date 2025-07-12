"use client"

import { useState, useEffect } from "react"
import { Search, MapPin, Phone, Globe, Clock, Star, Filter, Loader2 } from "lucide-react"
import { PracticeMap } from "@/components/find-dentist/practice-map"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { usePracticeSearch, useUserLocation, type Practice } from '@/hooks/use-practice-search'
import { toast } from 'sonner'

interface DentistPractice extends Practice {
  postcode?: string
  rating?: number
  reviewCount?: number
  openingHours?: {
    today?: string
    isOpen?: boolean
    [key: string]: any
  }
  nextAvailable?: string
  image?: string
}

export default function FindDentistPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRadius, setSelectedRadius] = useState("10")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    nhsOnly: false,
    privateOnly: false,
    emergencyServices: false,
    wheelchairAccess: false,
    services: [] as string[],
  })
  const [selectedPractice, setSelectedPractice] = useState<DentistPractice | null>(null)
  
  const { location, loading: locationLoading, error: locationError, requestLocation } = useUserLocation()
  
  const { data, loading, error } = usePracticeSearch({
    query: searchQuery,
    latitude: location?.latitude,
    longitude: location?.longitude,
    radius: parseFloat(selectedRadius),
    nhsOnly: filters.nhsOnly,
    privateOnly: filters.privateOnly,
    services: filters.services,
    wheelchairAccess: filters.wheelchairAccess,
    emergencyAppointments: filters.emergencyServices,
  })
  
  useEffect(() => {
    if (locationError) {
      toast.error('Unable to get your location. You can still search by postcode.')
    }
  }, [locationError])
  
  // Format practices from API or use mock data
  const formattedPractices: DentistPractice[] = data?.practices.map(p => ({
    ...p,
    postcode: p.address?.postcode || '',
    address: `${p.address?.line1 || ''}${p.address?.line2 ? ', ' + p.address.line2 : ''}${p.address?.city ? ', ' + p.address.city : ''}`,
    rating: p.rating || 4.5,
    reviewCount: p.reviewCount || 0,
    openingHours: p.openingHours || { today: '9:00 AM - 5:00 PM', isOpen: true },
    nextAvailable: p.nextAvailable || 'Contact for availability',
  })) || []

  // Mock data as fallback for demo
  const mockPractices: DentistPractice[] = [
    {
      id: "1",
      name: "Smile Dental Practice",
      address: "123 High Street, London",
      postcode: "SW1A 1AA",
      phone: "020 7123 4567",
      website: "www.smiledental.co.uk",
      distance: 0.8,
      rating: 4.8,
      reviewCount: 127,
      services: ["General Dentistry", "Cosmetic Dentistry", "Orthodontics"],
      nhsAccepted: true,
      privateAccepted: true,
      openingHours: {
        today: "9:00 AM - 6:00 PM",
        isOpen: true,
      },
      nextAvailable: "Tomorrow 2:00 PM",
    },
    {
      id: "2",
      name: "Central London Dental Clinic",
      address: "456 Oxford Street, London",
      postcode: "W1C 1DE",
      phone: "020 7987 6543",
      website: "www.centrallondondental.com",
      distance: 1.2,
      rating: 4.6,
      reviewCount: 89,
      services: ["General Dentistry", "Implants", "Emergency Care"],
      nhsAccepted: false,
      privateAccepted: true,
      openingHours: {
        today: "8:00 AM - 8:00 PM",
        isOpen: true,
      },
      nextAvailable: "Today 4:30 PM",
    },
    {
      id: "3",
      name: "Family Dental Care",
      address: "789 Baker Street, London",
      postcode: "NW1 6XE",
      phone: "020 7456 7890",
      distance: 2.1,
      rating: 4.9,
      reviewCount: 203,
      services: ["General Dentistry", "Pediatric Dentistry", "Preventive Care"],
      nhsAccepted: true,
      privateAccepted: false,
      openingHours: {
        today: "9:00 AM - 5:00 PM",
        isOpen: false,
      },
      nextAvailable: "Monday 9:00 AM",
    },
  ]

  const serviceOptions = [
    "General Dentistry",
    "Cosmetic Dentistry",
    "Orthodontics",
    "Implants",
    "Emergency Care",
    "Pediatric Dentistry",
    "Oral Surgery",
    "Teeth Whitening",
  ]
  
  // Use API data if available, otherwise use mock data
  const practices = formattedPractices.length > 0 ? formattedPractices : mockPractices

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Find a Dentist Near You</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Search for dental practices in your area. Find NHS and private dentists, read reviews, and book
            appointments.
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Enter postcode, city, or practice name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>
            <div className="flex gap-4">
              {!location && (
                <Button 
                  onClick={requestLocation}
                  disabled={locationLoading}
                  className="h-12"
                  variant="outline"
                >
                  {locationLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting location...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-2" />
                      Use my location
                    </>
                  )}
                </Button>
              )}
              <Select value={selectedRadius} onValueChange={setSelectedRadius}>
                <SelectTrigger className="w-32 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 miles</SelectItem>
                  <SelectItem value="10">10 miles</SelectItem>
                  <SelectItem value="25">25 miles</SelectItem>
                  <SelectItem value="50">50 miles</SelectItem>
                </SelectContent>
              </Select>
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="h-12 bg-transparent">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filter Results</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                    <div>
                      <h3 className="font-medium mb-3">Payment Options</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="nhs"
                            checked={filters.nhsOnly}
                            onCheckedChange={(checked) =>
                              setFilters((prev) => ({ ...prev, nhsOnly: checked as boolean }))
                            }
                          />
                          <label htmlFor="nhs" className="text-sm">
                            NHS patients accepted
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="private"
                            checked={filters.privateOnly}
                            onCheckedChange={(checked) =>
                              setFilters((prev) => ({ ...prev, privateOnly: checked as boolean }))
                            }
                          />
                          <label htmlFor="private" className="text-sm">
                            Private patients only
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Services</h3>
                      <div className="space-y-2">
                        {serviceOptions.map((service) => (
                          <div key={service} className="flex items-center space-x-2">
                            <Checkbox
                              id={service}
                              checked={filters.services.includes(service)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters((prev) => ({
                                    ...prev,
                                    services: [...prev.services, service],
                                  }))
                                } else {
                                  setFilters((prev) => ({
                                    ...prev,
                                    services: prev.services.filter((s) => s !== service),
                                  }))
                                }
                              }}
                            />
                            <label htmlFor={service} className="text-sm">
                              {service}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Accessibility</h3>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="wheelchair"
                          checked={filters.wheelchairAccess}
                          onCheckedChange={(checked) =>
                            setFilters((prev) => ({ ...prev, wheelchairAccess: checked as boolean }))
                          }
                        />
                        <label htmlFor="wheelchair" className="text-sm">
                          Wheelchair accessible
                        </label>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <Button className="h-12">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Placeholder */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-0">
                <div className="h-96">
                  <PracticeMap 
                    practices={practices.map(p => ({
                      id: p.id,
                      name: p.name,
                      address: p.address,
                      // Generate mock coordinates based on distance (for demo)
                      latitude: 51.5074 + (Math.random() - 0.5) * 0.1,
                      longitude: -0.1278 + (Math.random() - 0.5) * 0.1,
                      acceptsNHS: p.nhsAccepted,
                    }))}
                    selectedPracticeId={selectedPractice?.id}
                    onPracticeSelect={(id) => {
                      const practice = practices.find(p => p.id === id)
                      setSelectedPractice(practice || null)
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Practice List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">{practices.length} practices found near "London"</h2>
              <Select defaultValue="distance">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Sort by distance</SelectItem>
                  <SelectItem value="rating">Sort by rating</SelectItem>
                  <SelectItem value="availability">Sort by availability</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : practices.length === 0 ? (
              <Card className="p-8 text-center">
                <CardContent>
                  <p className="text-gray-600 mb-4">No practices found in this area.</p>
                  <p className="text-sm text-gray-500">Try adjusting your search or expanding the search radius.</p>
                </CardContent>
              </Card>
            ) : (
              practices.map((practice) => (
              <Card 
                key={practice.id} 
                className={`hover-lift hover-glow cursor-pointer transition-all ${
                  selectedPractice?.id === practice.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedPractice(practice)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{practice.name}</CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {practice.distance} miles away
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                          {practice.rating} ({practice.reviewCount} reviews)
                        </div>
                      </div>
                      <p className="text-gray-600 mb-2">{practice.address}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {practice.nhsAccepted && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            NHS
                          </Badge>
                        )}
                        {practice.privateAccepted && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Private
                          </Badge>
                        )}
                        {practice.services.slice(0, 2).map((service) => (
                          <Badge key={service} variant="outline">
                            {service}
                          </Badge>
                        ))}
                        {practice.services.length > 2 && (
                          <Badge variant="outline">+{practice.services.length - 2} more</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          practice.openingHours.isOpen ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {practice.openingHours.isOpen ? "Open" : "Closed"}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{practice.openingHours.today}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {practice.phone}
                      </div>
                      {practice.website && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Globe className="w-4 h-4 mr-2" />
                          {practice.website}
                        </div>
                      )}
                      <p className="text-sm font-medium text-green-600">Next available: {practice.nextAvailable}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button size="sm">Book Appointment</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
