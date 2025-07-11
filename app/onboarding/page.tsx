"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { ArrowRight, BookOpen, Bell, Stethoscope } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { analytics } from "@/lib/analytics-enhanced"
import { updateUserMetadata } from "@/app/actions/update-user-metadata"

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const userType = searchParams.get("userType") as "patient" | "professional" | null
  const totalSteps = userType === "professional" ? 4 : 3

  const [formData, setFormData] = useState({
    // Basic info
    firstName: "",
    lastName: "",
    location: "",

    // Preferences
    interests: [] as string[],
    notifications: {
      email: true,
      newArticles: true,
      healthTips: false,
    },

    // Professional info (if applicable)
    gdcNumber: "",
    practiceType: "",
    specializations: [] as string[],
  })

  const dentalInterests = [
    "General Oral Health",
    "Cosmetic Dentistry",
    "Orthodontics",
    "Pediatric Dentistry",
    "Oral Surgery",
    "Preventive Care",
    "Dental Anxiety",
    "Emergency Care",
  ]

  const specializations = [
    "General Dentistry",
    "Orthodontics",
    "Oral Surgery",
    "Endodontics",
    "Periodontics",
    "Prosthodontics",
    "Pediatric Dentistry",
    "Oral Medicine",
  ]

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
      }))
      
      // Track onboarding start
      analytics.track('onboarding_started', {
        user_type: userType,
        user_id: user.id,
      })
    }
  }, [user, userType])

  const handleNext = () => {
    // Track step completion
    analytics.track('onboarding_step_completed', {
      step: currentStep,
      total_steps: totalSteps,
      user_type: userType,
      step_data: {
        ...(currentStep === 1 && {
          has_location: !!formData.location,
        }),
        ...(currentStep === 2 && {
          interests_count: formData.interests.length,
          interests: formData.interests,
        }),
        ...(currentStep === 3 && {
          email_notifications: formData.notifications.email,
          new_articles: formData.notifications.newArticles,
          health_tips: formData.notifications.healthTips,
        }),
        ...(currentStep === 4 && {
          has_gdc_number: !!formData.gdcNumber,
          practice_type: formData.practiceType,
          specializations_count: formData.specializations.length,
        }),
      },
    })
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)

    try {
      // Update user metadata using server action (publicMetadata)
      const result = await updateUserMetadata({
        userType,
        onboardingCompleted: true,
        interests: formData.interests,
        location: formData.location,
        ...(userType === "professional" && {
          gdcNumber: formData.gdcNumber,
          practiceType: formData.practiceType,
          specializations: formData.specializations,
          verificationStatus: "pending",
        }),
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to update user metadata')
      }

      // Track onboarding completion and registration
      analytics.trackRegistration(userType || 'patient', 'email')
      analytics.track('onboarding_completed', {
        user_type: userType,
        total_steps: totalSteps,
        interests_count: formData.interests.length,
        has_location: !!formData.location,
        ...(userType === "professional" && {
          has_gdc_number: !!formData.gdcNumber,
          practice_type: formData.practiceType,
          specializations_count: formData.specializations.length,
        }),
      })

      // Redirect based on user type
      if (userType === "professional") {
        router.push("/professional/verify")
      } else {
        // Check if there was a redirect URL stored
        const redirectUrl = sessionStorage.getItem('post_onboarding_redirect')
        if (redirectUrl) {
          sessionStorage.removeItem('post_onboarding_redirect')
          router.push(redirectUrl)
        } else {
          router.push("/dashboard")
        }
      }
    } catch (error) {
      console.error("Onboarding error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-primary" />
                Welcome to Dentistry Explained
              </CardTitle>
              <CardDescription>Let's personalize your experience with some basic information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., London, Manchester"
                />
                <p className="text-sm text-gray-500 mt-1">This helps us show you relevant local dental practices</p>
              </div>
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-primary" />
                Your Dental Interests
              </CardTitle>
              <CardDescription>Select topics you're most interested in learning about.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {dentalInterests.map((interest) => (
                  <div key={interest} className="flex items-center space-x-2">
                    <Checkbox
                      id={interest}
                      checked={formData.interests.includes(interest)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData((prev) => ({
                            ...prev,
                            interests: [...prev.interests, interest],
                          }))
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            interests: prev.interests.filter((i) => i !== interest),
                          }))
                        }
                      }}
                    />
                    <Label htmlFor={interest} className="text-sm">
                      {interest}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose how you'd like to stay updated with new content.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emailNotifications"
                  checked={formData.notifications.email}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: checked as boolean },
                    }))
                  }
                />
                <Label htmlFor="emailNotifications">Email notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newArticles"
                  checked={formData.notifications.newArticles}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, newArticles: checked as boolean },
                    }))
                  }
                />
                <Label htmlFor="newArticles">New articles and updates</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="healthTips"
                  checked={formData.notifications.healthTips}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, healthTips: checked as boolean },
                    }))
                  }
                />
                <Label htmlFor="healthTips">Weekly dental health tips</Label>
              </div>
            </CardContent>
          </Card>
        )

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Stethoscope className="w-5 h-5 mr-2 text-primary" />
                Professional Information
              </CardTitle>
              <CardDescription>Tell us about your professional background for verification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="gdcNumber">GDC Registration Number</Label>
                <Input
                  id="gdcNumber"
                  value={formData.gdcNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, gdcNumber: e.target.value }))}
                  placeholder="Enter your 7-digit GDC number"
                />
                <p className="text-sm text-gray-500 mt-1">This will be verified against the GDC register</p>
              </div>
              <div>
                <Label htmlFor="practiceType">Practice Type</Label>
                <Select
                  value={formData.practiceType}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, practiceType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select practice type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nhs">NHS Practice</SelectItem>
                    <SelectItem value="private">Private Practice</SelectItem>
                    <SelectItem value="mixed">Mixed NHS/Private</SelectItem>
                    <SelectItem value="hospital">Hospital/Community</SelectItem>
                    <SelectItem value="academic">Academic Institution</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Specializations (Optional)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {specializations.map((spec) => (
                    <div key={spec} className="flex items-center space-x-2">
                      <Checkbox
                        id={spec}
                        checked={formData.specializations.includes(spec)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData((prev) => ({
                              ...prev,
                              specializations: [...prev.specializations, spec],
                            }))
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              specializations: prev.specializations.filter((s) => s !== spec),
                            }))
                          }
                        }}
                      />
                      <Label htmlFor={spec} className="text-sm">
                        {spec}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Account Setup</h1>
            <Badge variant="secondary">
              Step {currentStep} of {totalSteps}
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        {renderStep()}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="bg-transparent"
          >
            Previous
          </Button>
          <Button onClick={handleNext} disabled={isLoading} className="min-w-[120px]">
            {isLoading ? (
              "Setting up..."
            ) : currentStep === totalSteps ? (
              "Complete Setup"
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
