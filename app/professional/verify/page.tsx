"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Shield, Upload, CheckCircle, AlertCircle, Clock, FileText } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"

interface VerificationData {
  gdcNumber: string
  verificationStatus: "pending" | "approved" | "rejected" | "not_started"
  submittedAt?: string
  documents?: string[]
  rejectionReason?: string
}

export default function ProfessionalVerifyPage() {
  const { user } = useUser()
  const [verificationData, setVerificationData] = useState<VerificationData>({
    gdcNumber: "",
    verificationStatus: "not_started",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    gdcNumber: "",
    fullName: "",
    practiceAddress: "",
    additionalInfo: "",
  })

  useEffect(() => {
    if (user?.unsafeMetadata) {
      const metadata = user.unsafeMetadata as any
      setVerificationData({
        gdcNumber: metadata.gdcNumber || "",
        verificationStatus: metadata.verificationStatus || "not_started",
        submittedAt: metadata.verificationSubmittedAt,
        documents: metadata.verificationDocuments || [],
        rejectionReason: metadata.verificationRejectionReason,
      })
      setFormData((prev) => ({
        ...prev,
        gdcNumber: metadata.gdcNumber || "",
        fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      }))
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call for verification
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update user metadata
      await user?.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          gdcNumber: formData.gdcNumber,
          verificationStatus: "pending",
          verificationSubmittedAt: new Date().toISOString(),
          verificationData: formData,
        },
      })

      setVerificationData((prev) => ({
        ...prev,
        verificationStatus: "pending",
        submittedAt: new Date().toISOString(),
      }))
    } catch (error) {
      console.error("Verification submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusIcon = () => {
    switch (verificationData.verificationStatus) {
      case "approved":
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case "rejected":
        return <AlertCircle className="w-6 h-6 text-red-600" />
      case "pending":
        return <Clock className="w-6 h-6 text-yellow-600" />
      default:
        return <Shield className="w-6 h-6 text-gray-400" />
    }
  }

  const getStatusBadge = () => {
    switch (verificationData.verificationStatus) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">✓ Verified</Badge>
      case "rejected":
        return <Badge variant="destructive">❌ Rejected</Badge>
      case "pending":
        return <Badge variant="secondary">⏳ Under Review</Badge>
      default:
        return <Badge variant="outline">Not Started</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">{getStatusIcon()}</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Professional Verification</h1>
          <p className="text-gray-600 mb-4">
            Verify your professional status to access exclusive resources and features
          </p>
          {getStatusBadge()}
        </div>

        {/* Status-specific content */}
        {verificationData.verificationStatus === "approved" && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600 mr-4" />
                <div>
                  <h3 className="font-semibold text-green-800">Verification Approved!</h3>
                  <p className="text-green-700">
                    Your professional status has been verified. You now have access to all professional features.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {verificationData.verificationStatus === "pending" && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-600 mr-4" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Verification Under Review</h3>
                  <p className="text-yellow-700">
                    We're reviewing your submission. This usually takes 1-2 business days. We'll email you once
                    complete.
                  </p>
                  {verificationData.submittedAt && (
                    <p className="text-sm text-yellow-600 mt-1">
                      Submitted: {new Date(verificationData.submittedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {verificationData.verificationStatus === "rejected" && (
          <Alert className="mb-8 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <strong>Verification Rejected:</strong>{" "}
              {verificationData.rejectionReason || "Please check your information and try again."}
            </AlertDescription>
          </Alert>
        )}

        {/* Verification Form */}
        {(verificationData.verificationStatus === "not_started" ||
          verificationData.verificationStatus === "rejected") && (
          <Card>
            <CardHeader>
              <CardTitle>GDC Verification</CardTitle>
              <CardDescription>
                We'll verify your registration with the General Dental Council (GDC) to confirm your professional
                status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="gdcNumber">GDC Registration Number *</Label>
                    <Input
                      id="gdcNumber"
                      value={formData.gdcNumber}
                      onChange={(e) => setFormData((prev) => ({ ...prev, gdcNumber: e.target.value }))}
                      placeholder="Enter your 7-digit GDC number"
                      required
                      pattern="[0-9]{7}"
                      title="Please enter a valid 7-digit GDC number"
                    />
                    <p className="text-sm text-gray-500 mt-1">This will be verified against the GDC register</p>
                  </div>
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter your full name as registered"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">Must match your GDC registration</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="practiceAddress">Practice Address</Label>
                  <Textarea
                    id="practiceAddress"
                    value={formData.practiceAddress}
                    onChange={(e) => setFormData((prev) => ({ ...prev, practiceAddress: e.target.value }))}
                    placeholder="Enter your practice address (optional)"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="additionalInfo">Additional Information</Label>
                  <Textarea
                    id="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, additionalInfo: e.target.value }))}
                    placeholder="Any additional information that might help with verification (optional)"
                    rows={3}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• We'll verify your GDC registration number against the official register</li>
                    <li>• Our team will review your submission within 1-2 business days</li>
                    <li>• You'll receive an email notification once verification is complete</li>
                    <li>• Once approved, you'll have access to all professional features</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.gdcNumber || !formData.fullName}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Submitting Verification...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Submit for Verification
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Professional Features Preview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Professional Features</CardTitle>
            <CardDescription>What you'll get access to once verified</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Consent Form Templates</h3>
                    <p className="text-sm text-gray-600">
                      Access to professionally designed consent forms for all procedures
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Upload className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Patient Education Materials</h3>
                    <p className="text-sm text-gray-600">Downloadable handouts and educational resources</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Professional Badge</h3>
                    <p className="text-sm text-gray-600">
                      Verified professional badge on your profile and contributions
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Practice Management</h3>
                    <p className="text-sm text-gray-600">Manage your practice listing and connect with patients</p>
                  </div>
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
