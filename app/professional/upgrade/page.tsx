"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { ArrowRight, Check, X, Stethoscope, FileText, Users, Shield, ChevronLeft } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

export default function ProfessionalUpgradePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isSignedIn } = useUser()
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

  useEffect(() => {
    const from = searchParams.get("from")
    if (from) {
      setRedirectUrl(from)
    }
  }, [searchParams])

  const features = [
    {
      title: "Access Professional Resources",
      description: "Download consent forms, patient education materials, and clinical guidelines",
      icon: FileText,
      included: true,
    },
    {
      title: "Verified Professional Badge",
      description: "Display your GDC verification status to build patient trust",
      icon: Shield,
      included: true,
    },
    {
      title: "Practice Management Tools",
      description: "Manage your practice listing and connect with potential patients",
      icon: Users,
      included: true,
    },
    {
      title: "Priority Support",
      description: "Get dedicated support for your professional needs",
      icon: Stethoscope,
      included: true,
    },
  ]

  const comparisonFeatures = [
    { feature: "Access to all dental articles", patient: true, professional: true },
    { feature: "AI dental assistant", patient: true, professional: true },
    { feature: "Bookmark articles", patient: true, professional: true },
    { feature: "Search functionality", patient: true, professional: true },
    { feature: "Consent form downloads", patient: false, professional: true },
    { feature: "Patient education materials", patient: false, professional: true },
    { feature: "Professional verification badge", patient: false, professional: true },
    { feature: "Practice listing management", patient: false, professional: true },
    { feature: "Clinical guidelines access", patient: false, professional: true },
    { feature: "Priority support", patient: false, professional: true },
  ]

  const handleUpgrade = () => {
    if (!isSignedIn) {
      // Redirect to sign up with professional pre-selected
      router.push("/sign-up?userType=professional")
    } else {
      // Redirect to professional verification
      router.push("/professional/verify")
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        {redirectUrl && (
          <Button
            variant="ghost"
            onClick={() => router.push(redirectUrl)}
            className="mb-6"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to previous page
          </Button>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Professional Access Required
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upgrade to Professional Account
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access exclusive resources and tools designed specifically for UK dental professionals.
            Verify your GDC registration to unlock all professional features.
          </p>
        </div>

        {/* Alert for logged-in patients */}
        {isSignedIn && user?.unsafeMetadata?.userType === "patient" && (
          <Alert className="mb-8 border-blue-200 bg-blue-50">
            <Stethoscope className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">You're currently registered as a patient</AlertTitle>
            <AlertDescription className="text-blue-700">
              To access professional features, you'll need to verify your GDC registration. 
              Your existing account data will be preserved.
            </AlertDescription>
          </Alert>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="hover-lift">
              <CardHeader>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Account Comparison</CardTitle>
            <CardDescription>
              See what's included with each account type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Feature</th>
                    <th className="text-center py-3 px-4">Patient Account</th>
                    <th className="text-center py-3 px-4">Professional Account</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-4">{item.feature}</td>
                      <td className="text-center py-3 px-4">
                        {item.patient ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="text-center py-3 px-4">
                        {item.professional ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-br from-primary/5 to-blue-50 rounded-2xl p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Ready to Access Professional Features?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Verify your GDC registration to unlock all professional resources and tools.
              The verification process typically takes 1-2 business days.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleUpgrade}>
                {isSignedIn ? "Start Verification Process" : "Sign Up as Professional"}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Link href="/professional">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
                  Learn More
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              Already verified? <Link href="/sign-in" className="text-primary hover:underline">Sign in here</Link>
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                What documents do I need for verification?
              </h4>
              <p className="text-gray-600">
                You'll need your GDC registration number and a supporting document such as your GDC certificate
                or a recent annual retention certificate.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                How long does verification take?
              </h4>
              <p className="text-gray-600">
                Most verifications are completed within 1-2 business days. You'll receive an email
                notification once your verification is approved.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Can I switch from a patient to professional account?
              </h4>
              <p className="text-gray-600">
                Yes! Your existing account data, bookmarks, and reading history will be preserved.
                You'll simply gain access to additional professional features once verified.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}