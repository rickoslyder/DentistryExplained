"use client"

import { useState } from "react"
import { SignUp } from "@clerk/nextjs"
import { Users, Stethoscope, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function SignUpPage() {
  const [selectedUserType, setSelectedUserType] = useState<"patient" | "professional" | null>(null)
  const [showClerkForm, setShowClerkForm] = useState(false)

  const userTypes = [
    {
      type: "patient" as const,
      title: "Patient",
      description: "I'm looking for dental health information and want to find dentists",
      icon: Users,
      features: [
        "Access to all dental education content",
        "AI-powered dental assistant",
        "Find dentists near you",
        "Save and bookmark articles",
        "Personalized recommendations",
      ],
      color: "border-blue-200 hover:border-blue-400",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      type: "professional" as const,
      title: "Dental Professional",
      description: "I'm a dentist, hygienist, or other dental professional",
      icon: Stethoscope,
      features: [
        "All patient features included",
        "Professional verification badge",
        "Consent form templates",
        "Patient education materials",
        "Practice management tools",
        "Professional resources library",
      ],
      color: "border-green-200 hover:border-green-400",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      badge: "Requires GDC Verification",
    },
  ]

  const handleUserTypeSelect = (type: "patient" | "professional") => {
    setSelectedUserType(type)
    setShowClerkForm(true)
  }

  if (showClerkForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center space-x-2 mb-8">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-primary">Dentistry Explained</span>
            </Link>
            <div className="mb-6">
              <Badge variant="secondary" className="mb-2">
                {selectedUserType === "professional" ? "Professional Account" : "Patient Account"}
              </Badge>
              <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
              <p className="text-gray-600 mt-2">
                {selectedUserType === "professional"
                  ? "You'll be able to verify your professional status after creating your account"
                  : "Start exploring dental health information"}
              </p>
            </div>
          </div>

          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 bg-transparent",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border-gray-200 hover:bg-gray-50",
                formButtonPrimary: "bg-primary hover:bg-primary/90",
                footerActionLink: "text-primary hover:text-primary/80",
              },
            }}
            redirectUrl={`/onboarding?userType=${selectedUserType}`}
          />

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => {
                setShowClerkForm(false)
                setSelectedUserType(null)
              }}
              className="text-sm"
            >
              ← Back to user type selection
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-primary">Dentistry Explained</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Join Dentistry Explained</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your account type to get started with personalized dental health information and tools.
          </p>
        </div>

        {/* User Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {userTypes.map((userType) => (
            <Card
              key={userType.type}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${userType.color}`}
              onClick={() => handleUserTypeSelect(userType.type)}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${userType.iconBg} rounded-lg flex items-center justify-center`}>
                    <userType.icon className={`w-6 h-6 ${userType.iconColor}`} />
                  </div>
                  {userType.badge && (
                    <Badge variant="outline" className="text-xs">
                      {userType.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{userType.title}</CardTitle>
                <CardDescription className="text-base">{userType.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {userType.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full">
                  Continue as {userType.title}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary hover:text-primary/80 font-medium">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  )
}
