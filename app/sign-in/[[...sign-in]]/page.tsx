"use client"

import { SignIn } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Users, ArrowLeft, Shield, Clock, BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect_url') || '/dashboard'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 group">
            <ArrowLeft className="w-4 h-4 text-gray-600 group-hover:text-gray-900 transition-colors" />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Back to home</span>
          </Link>
          <Link href="/sign-up">
            <span className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Don't have an account? <span className="text-primary font-medium">Sign up</span>
            </span>
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo and Title */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-2xl text-primary">Dentistry Explained</span>
            </Link>
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome back
            </h2>
            <p className="mt-2 text-gray-600">
              Sign in to continue your dental health journey
            </p>
          </div>

          {/* Benefits Card */}
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-primary" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900">Secure & Private</p>
                  <p className="text-gray-600">Your health data is protected</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                GDPR Compliant
              </Badge>
            </div>
          </Card>

          {/* Sign In Component */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <SignIn 
              appearance={{
                elements: {
                  formButtonPrimary: 
                    'bg-primary hover:bg-primary/90 text-white text-sm normal-case shadow-sm transition-all duration-200',
                  card: 'shadow-none border-0',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  socialButtonsBlockButton:
                    'border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200',
                  socialButtonsBlockButtonText: 'text-gray-700 font-normal',
                  dividerLine: 'bg-gray-200',
                  dividerText: 'text-gray-500 text-sm',
                  formFieldLabel: 'text-gray-700 font-medium text-sm',
                  formFieldInput:
                    'rounded-md border-gray-300 focus:border-primary focus:ring-primary',
                  formFieldInputShowPasswordButton: 'text-gray-500 hover:text-gray-700',
                  footerActionLink:
                    'text-primary hover:text-primary/80 font-medium transition-colors',
                  identityPreviewText: 'text-gray-700',
                  identityPreviewEditButton: 'text-primary hover:text-primary/80',
                  formResendCodeLink: 'text-primary hover:text-primary/80',
                  alert: 'rounded-md',
                  alertText: 'text-sm'
                },
                layout: {
                  socialButtonsPlacement: 'top',
                  showOptionalFields: true,
                },
                variables: {
                  colorPrimary: '#3b82f6',
                  borderRadius: '0.5rem',
                }
              }}
              routing="path"
              path="/sign-in"
              signUpUrl="/sign-up"
              afterSignInUrl={redirectUrl}
            />
            
            {/* Forgot Password Link */}
            <div className="mt-4 text-center">
              <Link href="/forgot-password" className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                Forgot your password?
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-xs text-gray-600">Expert Content</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-xs text-gray-600">Verified Info</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-xs text-gray-600">24/7 Access</p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:text-primary/80">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:text-primary/80">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}