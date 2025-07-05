"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Shield, Download, FileText, Users, BookOpen, Settings, 
  ChevronRight, Star, TrendingUp, Calendar, CheckCircle 
} from "lucide-react"
import Link from "next/link"

interface ProfessionalStats {
  downloadsThisMonth: number
  totalDownloads: number
  verificationStatus: string
  verifiedSince: string | null
  expiryDate?: string | null
  practiceViews: number
  recentDownloads: Array<{
    name: string
    type: string
    downloadedAt: string
    timeAgo: string
  }>
  hasPracticeListing: boolean
  practiceName?: string | null
}

export default function ProfessionalDashboard() {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [stats, setStats] = useState<ProfessionalStats | null>(null)

  useEffect(() => {
    checkVerificationStatus()
  }, [user])

  const checkVerificationStatus = async () => {
    if (!user) {
      router.push('/sign-in')
      return
    }

    try {
      // First check verification status
      const verifyResponse = await fetch('/api/professional/verification')
      const verifyData = await verifyResponse.json()

      if (verifyData.verification?.verification_status === 'verified') {
        setIsVerified(true)
        
        // Fetch professional stats
        const statsResponse = await fetch('/api/professional/stats')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        } else {
          // Use basic stats if stats API fails
          setStats({
            downloadsThisMonth: 0,
            totalDownloads: 0,
            verificationStatus: verifyData.verification.verification_status,
            verifiedSince: verifyData.verification.verification_date,
            expiryDate: verifyData.verification.expiry_date,
            practiceViews: 0,
            recentDownloads: [],
            hasPracticeListing: false,
            practiceName: null
          })
        }
      } else {
        router.push('/professional/verify')
      }
    } catch (error) {
      console.error('Error checking verification:', error)
      router.push('/professional/verify')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading professional dashboard...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Professional Dashboard</h1>
              <p className="text-gray-600 mt-2">Access exclusive resources and tools for dental professionals</p>
            </div>
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="w-4 h-4 mr-1" />
              Verified Professional
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Downloads This Month</p>
                  <p className="text-2xl font-bold">{stats?.downloadsThisMonth || 0}</p>
                </div>
                <Download className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Downloads</p>
                  <p className="text-2xl font-bold">{stats?.totalDownloads || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Verified Since</p>
                  <p className="text-lg font-semibold">
                    {stats?.verifiedSince ? new Date(stats.verifiedSince).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '-'}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className="bg-green-100 text-green-800 mt-1">Active</Badge>
                </div>
                <Shield className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Verification Expiry Alert */}
        {stats?.expiryDate && (
          <Alert className="mb-8 border-yellow-200 bg-yellow-50">
            <Calendar className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Your verification expires on {new Date(stats.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. 
              Remember to renew before this date to maintain access to professional resources.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/professional/resources/consent-forms">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="w-8 h-8 text-primary" />
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <CardTitle className="mt-4">Consent Forms</CardTitle>
                <CardDescription>
                  Access and download professional consent form templates for all procedures
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/professional/resources/patient-education">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <BookOpen className="w-8 h-8 text-primary" />
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <CardTitle className="mt-4">Patient Education</CardTitle>
                <CardDescription>
                  Download patient handouts and educational materials for your practice
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/professional/practice">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Users className="w-8 h-8 text-primary" />
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <CardTitle className="mt-4">Practice Profile</CardTitle>
                <CardDescription>
                  Manage your practice listing and connect with potential patients
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>

        {/* Featured Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Featured Resources</CardTitle>
            <CardDescription>Popular downloads this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <FileText className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="font-medium">Tooth Extraction Consent Form</p>
                    <p className="text-sm text-gray-500">Updated for 2025 NHS guidelines</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <FileText className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="font-medium">Post-Operative Care Instructions</p>
                    <p className="text-sm text-gray-500">Patient handout template</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <FileText className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="font-medium">Root Canal Treatment Guide</p>
                    <p className="text-sm text-gray-500">Comprehensive patient information</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            <div className="text-center mt-6">
              <Button variant="outline" asChild>
                <Link href="/professional/resources">
                  View All Resources
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Professional Benefits */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Professional Benefits</CardTitle>
            <CardDescription>Exclusive features available to verified professionals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">Unlimited Downloads</h3>
                  <p className="text-sm text-gray-600">
                    Access all professional resources without restrictions
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Verified Badge</h3>
                  <p className="text-sm text-gray-600">
                    Display your professional status on all contributions
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Settings className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Practice Management</h3>
                  <p className="text-sm text-gray-600">
                    Tools to manage your practice profile and patient connections
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <BookOpen className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Educational Materials</h3>
                  <p className="text-sm text-gray-600">
                    Professional-grade patient education resources
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}