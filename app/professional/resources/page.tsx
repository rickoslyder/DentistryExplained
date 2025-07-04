"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, BookOpen, Download, Shield, ChevronRight, 
  Star, TrendingUp, Clock, Users
} from "lucide-react"
import Link from "next/link"

interface ResourceStats {
  totalDownloads: number
  consentFormsCount: number
  educationMaterialsCount: number
  lastUpdated: string
}

export default function ProfessionalResourcesPage() {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [stats] = useState<ResourceStats>({
    totalDownloads: 0,
    consentFormsCount: 12,
    educationMaterialsCount: 12,
    lastUpdated: "2025-07-03"
  })

  useEffect(() => {
    checkVerificationStatus()
  }, [user])

  const checkVerificationStatus = async () => {
    if (!user) {
      router.push('/sign-in')
      return
    }

    try {
      const response = await fetch('/api/professional/verification')
      const data = await response.json()

      if (data.verification?.verification_status === 'verified') {
        setIsVerified(true)
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
            <p className="text-gray-500 mt-4">Loading resources...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Professional Resources</h1>
              <p className="text-gray-600 mt-2">
                Exclusive materials and tools for verified dental professionals
              </p>
            </div>
            <Badge className="bg-green-100 text-green-800">
              <Shield className="w-4 h-4 mr-1" />
              Verified Access
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Resources</p>
                  <p className="text-2xl font-bold">
                    {stats.consentFormsCount + stats.educationMaterialsCount}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Your Downloads</p>
                  <p className="text-2xl font-bold">{stats.totalDownloads}</p>
                </div>
                <Download className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-lg font-semibold">
                    {new Date(stats.lastUpdated).toLocaleDateString('en-GB', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold">1,247</p>
                </div>
                <Users className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Resource Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <Link href="/professional/resources/consent-forms">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="w-12 h-12 text-primary" />
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <CardTitle className="mt-4">Consent Form Templates</CardTitle>
                <CardDescription>
                  {stats.consentFormsCount} professionally designed consent forms for all procedures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="w-4 h-4 mr-2 text-yellow-500" />
                    Updated for 2025 NHS guidelines
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FileText className="w-4 h-4 mr-2 text-gray-400" />
                    Fully customizable with practice details
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Download className="w-4 h-4 mr-2 text-gray-400" />
                    Download as PDF
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <Link href="/professional/resources/patient-education">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <BookOpen className="w-12 h-12 text-primary" />
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <CardTitle className="mt-4">Patient Education Materials</CardTitle>
                <CardDescription>
                  {stats.educationMaterialsCount} handouts and guides for patient education
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="w-4 h-4 mr-2 text-yellow-500" />
                    Easy-to-understand language
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <BookOpen className="w-4 h-4 mr-2 text-gray-400" />
                    Multiple languages available
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Download className="w-4 h-4 mr-2 text-gray-400" />
                    Print-ready formats
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Popular Resources */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Most Downloaded This Month</CardTitle>
                <CardDescription>Popular resources among professionals</CardDescription>
              </div>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 p-2 rounded">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Simple Tooth Extraction Consent</p>
                    <p className="text-sm text-gray-500">Consent Forms</p>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Download className="w-4 h-4 mr-1" />
                  342 downloads
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 p-2 rounded">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Daily Oral Hygiene Guide</p>
                    <p className="text-sm text-gray-500">Patient Education</p>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Download className="w-4 h-4 mr-1" />
                  892 downloads
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 p-2 rounded">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Root Canal Treatment Consent</p>
                    <p className="text-sm text-gray-500">Consent Forms</p>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Download className="w-4 h-4 mr-1" />
                  456 downloads
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>New resources in development</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-1">Clinical Guidelines</h3>
                <p className="text-sm text-gray-600">Evidence-based treatment protocols</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-1">Practice Management</h3>
                <p className="text-sm text-gray-600">Templates for practice operations</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-1">CPD Resources</h3>
                <p className="text-sm text-gray-600">Continuing education materials</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}