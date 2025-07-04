'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search, ArrowLeft } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-primary opacity-20">404</h1>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Page not found
          </h2>
          
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. It might have been moved, 
            deleted, or you may have typed the wrong URL.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link href="/">
              <Button className="inline-flex items-center w-full sm:w-auto">
                <Home className="w-4 h-4 mr-2" />
                Go home
              </Button>
            </Link>
            
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="inline-flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go back
            </Button>
          </div>
          
          <div className="border-t pt-8">
            <p className="text-sm text-gray-600 mb-4">
              Here are some helpful links instead:
            </p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Link href="/topics" className="text-primary hover:underline">
                Browse Topics
              </Link>
              <Link href="/find-dentist" className="text-primary hover:underline">
                Find a Dentist
              </Link>
              <Link href="/emergency" className="text-primary hover:underline">
                Emergency Guide
              </Link>
              <Link href="/about" className="text-primary hover:underline">
                About Us
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}