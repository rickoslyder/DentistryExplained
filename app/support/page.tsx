import { Metadata } from 'next'
import { Mail, MessageCircle, FileQuestion, Clock, Phone, MapPin } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Support | Dentistry Explained',
  description: 'Get help with using Dentistry Explained. Contact our support team or browse our help resources.',
}

export default function SupportPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Support Center
        </h1>
        <p className="text-lg text-gray-600">
          We're here to help you get the most out of Dentistry Explained.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/faq'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-primary" />
              FAQ
            </CardTitle>
            <CardDescription>
              Find answers to frequently asked questions
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/emergency'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-600" />
              Emergency Guide
            </CardTitle>
            <CardDescription>
              Get help with dental emergencies
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/glossary'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Dental Glossary
            </CardTitle>
            <CardDescription>
              Look up dental terms and procedures
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Contact Options */}
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Contact Us
          </h2>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Mail className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Email Support</h3>
                    <p className="text-gray-600 mt-1">
                      For general inquiries and support
                    </p>
                    <a 
                      href="mailto:support@dentistryexplained.co.uk" 
                      className="text-primary hover:underline mt-2 inline-block"
                    >
                      support@dentistryexplained.co.uk
                    </a>
                    <p className="text-sm text-gray-500 mt-2">
                      Response time: Within 24-48 hours
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Phone className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Phone Support</h3>
                    <p className="text-gray-600 mt-1">
                      For urgent matters and professional inquiries
                    </p>
                    <p className="text-primary font-semibold mt-2">
                      0800 123 4567
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Monday - Friday: 9:00 AM - 5:00 PM GMT
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Office Address</h3>
                    <p className="text-gray-600 mt-1">
                      Dentistry Explained Ltd<br />
                      123 Dental House<br />
                      London, UK<br />
                      W1A 1AA
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Common Issues
          </h2>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Account & Login Issues
              </h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• Forgot password? Use the password reset option on the login page</li>
                <li>• Can't access your account? Check your email for verification</li>
                <li>• Need to update profile information? Go to Dashboard → Settings</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Professional Verification
              </h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• GDC number not recognized? Ensure it's entered correctly</li>
                <li>• Verification pending? Allow 2-3 business days for review</li>
                <li>• Documents rejected? Check file format and quality requirements</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Technical Issues
              </h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• Site not loading? Clear browser cache and cookies</li>
                <li>• Features not working? Try a different browser or device</li>
                <li>• Error messages? Take a screenshot and contact support</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Content & Information
              </h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• Found an error? Report it via the feedback form</li>
                <li>• Need more information? Use the AI assistant for questions</li>
                <li>• Want to contribute? Contact us about professional authoring</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Support */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          For Dental Professionals
        </h2>
        <p className="text-gray-600 mb-6">
          Get dedicated support for professional features, verification, and practice listings.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="/professional/verify"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Verify Your Account
          </a>
          <a
            href="mailto:professional@dentistryexplained.co.uk"
            className="inline-flex items-center justify-center rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            Professional Support
          </a>
        </div>
      </div>
    </div>
  )
}