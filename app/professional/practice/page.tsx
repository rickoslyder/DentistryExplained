export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MapPin, 
  Phone, 
  Clock, 
  Globe, 
  Star,
  Users,
  Calendar,
  Shield,
  Edit,
  Eye,
  TrendingUp,
  CheckCircle
} from 'lucide-react'

export const metadata = {
  title: 'Practice Management | Dentistry Explained',
  description: 'Manage your dental practice listing and profile.',
}

async function getPracticeData(userId: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_id', userId)
    .single()
  
  if (!profile || profile.user_type !== 'professional') {
    redirect('/professional')
  }
  
  // Placeholder practice data - will be replaced with database
  const practiceData = {
    basicInfo: {
      practiceName: '[PLACEHOLDER] Smile Dental Practice',
      practiceType: 'general',
      nhsAccepted: true,
      privateAccepted: true,
      registrationNumber: 'PLACEHOLDER-123',
      website: 'www.example.com',
      email: 'practice@example.com',
    },
    location: {
      address: '123 High Street',
      city: 'London',
      postcode: 'SW1A 1AA',
      phone: '020 1234 5678',
      emergencyPhone: '07900 123456',
    },
    hours: {
      monday: { open: '09:00', close: '17:30' },
      tuesday: { open: '09:00', close: '17:30' },
      wednesday: { open: '09:00', close: '17:30' },
      thursday: { open: '09:00', close: '19:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '09:00', close: '13:00' },
      sunday: { open: 'Closed', close: 'Closed' },
    },
    services: [
      'General Dentistry',
      'Cosmetic Dentistry',
      'Orthodontics',
      'Dental Implants',
      'Emergency Care',
    ],
    stats: {
      profileViews: 1234,
      patientInquiries: 56,
      rating: 4.8,
      reviewCount: 123,
    },
  }
  
  return { profile, practiceData }
}

export default async function PracticePage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  const { profile, practiceData } = await getPracticeData(userId)
  
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Practice Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your practice listing and attract new patients
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-transparent">
              <Eye className="w-4 h-4 mr-2" />
              View Public Profile
            </Button>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit Details
            </Button>
          </div>
        </div>
        
        {/* Verification Status */}
        {profile.role === 'admin' || profile.role === 'editor' ? (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your practice is verified and visible in search results
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-6">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Complete your practice verification to appear in search results
            </AlertDescription>
          </Alert>
        )}
        
        {/* Practice Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Profile Views</p>
                  <p className="text-2xl font-bold">{practiceData.stats.profileViews}</p>
                </div>
                <Eye className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-xs text-green-600 mt-2">+12% this month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Patient Inquiries</p>
                  <p className="text-2xl font-bold">{practiceData.stats.patientInquiries}</p>
                </div>
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-xs text-green-600 mt-2">+8% this month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold">{practiceData.stats.rating}</p>
                    <Star className="w-5 h-5 text-yellow-400 fill-current ml-1" />
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-2">{practiceData.stats.reviewCount} reviews</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Appointments</p>
                  <p className="text-2xl font-bold">View</p>
                </div>
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-xs text-blue-600 mt-2">Manage bookings →</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Practice Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Core details about your practice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Practice Name</Label>
                <Input value={practiceData.basicInfo.practiceName} disabled />
              </div>
              
              <div>
                <Label>Practice Type</Label>
                <Select value={practiceData.basicInfo.practiceType} disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Practice</SelectItem>
                    <SelectItem value="specialist">Specialist Practice</SelectItem>
                    <SelectItem value="hospital">Hospital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="nhs" 
                    checked={practiceData.basicInfo.nhsAccepted}
                    disabled
                  />
                  <Label htmlFor="nhs">NHS Patients</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="private" 
                    checked={practiceData.basicInfo.privateAccepted}
                    disabled
                  />
                  <Label htmlFor="private">Private Patients</Label>
                </div>
              </div>
              
              <div>
                <Label>Website</Label>
                <Input value={practiceData.basicInfo.website} disabled />
              </div>
            </CardContent>
          </Card>
          
          {/* Location & Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Location & Contact</CardTitle>
              <CardDescription>
                Where patients can find you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Address</Label>
                <Textarea 
                  value={`${practiceData.location.address}\n${practiceData.location.city}\n${practiceData.location.postcode}`}
                  rows={3}
                  disabled
                />
              </div>
              
              <div>
                <Label>Phone Number</Label>
                <Input value={practiceData.location.phone} disabled />
              </div>
              
              <div>
                <Label>Emergency Phone</Label>
                <Input value={practiceData.location.emergencyPhone} disabled />
              </div>
              
              <div className="pt-2">
                <Button variant="outline" size="sm" className="bg-transparent">
                  <MapPin className="w-4 h-4 mr-2" />
                  Update Map Location
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Opening Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Opening Hours</CardTitle>
              <CardDescription>
                When patients can visit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(practiceData.hours).map(([day, hours]) => (
                  <div key={day} className="flex items-center justify-between">
                    <span className="capitalize text-sm font-medium">
                      {day}
                    </span>
                    <span className="text-sm text-gray-600">
                      {hours.open === 'Closed' ? 'Closed' : `${hours.open} - ${hours.close}`}
                    </span>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-4 bg-transparent">
                <Clock className="w-4 h-4 mr-2" />
                Edit Hours
              </Button>
            </CardContent>
          </Card>
          
          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>Services Offered</CardTitle>
              <CardDescription>
                Treatments available at your practice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {practiceData.services.map((service) => (
                  <Badge key={service} variant="secondary">
                    {service}
                  </Badge>
                ))}
              </div>
              <Button variant="outline" size="sm" className="bg-transparent">
                <Edit className="w-4 h-4 mr-2" />
                Edit Services
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Notice */}
        <Alert className="mt-8">
          <Globe className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> This is placeholder data. Full practice management features 
            will be available once your practice details are verified and integrated with our system.
          </AlertDescription>
        </Alert>
      </div>
      
      <Footer />
    </div>
  )
}