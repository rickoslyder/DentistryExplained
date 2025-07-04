import { ShieldOff, ArrowLeft, Home, Mail } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldOff className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            You don't have permission to access this page. This area is restricted to authorized personnel only.
          </p>
        </div>

        {/* Explanation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Admin Access Required</CardTitle>
              <CardDescription>
                This page is only accessible to administrators and editors who manage the platform content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                If you believe you should have access to this area, please contact the platform administrators.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Professional Features</CardTitle>
              <CardDescription>
                Looking for professional resources? Verify your GDC registration to access professional features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/professional">
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  Learn About Professional Access
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="bg-transparent">
              <Home className="w-4 h-4 mr-2" />
              Go to Homepage
            </Button>
          </Link>
        </div>

        {/* Contact Section */}
        <Card className="mt-12 bg-gray-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Mail className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-gray-600 mb-4">
                If you're having trouble accessing content or believe this is an error, please get in touch.
              </p>
              <Link href="/support">
                <Button variant="outline" size="sm" className="bg-transparent">
                  Contact Support
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}