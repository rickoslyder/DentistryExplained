"use client"

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion, Clock, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function QuickLinks() {
  const router = useRouter()

  return (
    <div className="grid md:grid-cols-3 gap-6 mb-12">
      <Card 
        className="hover:shadow-lg transition-shadow cursor-pointer" 
        onClick={() => router.push('/faq')}
      >
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

      <Card 
        className="hover:shadow-lg transition-shadow cursor-pointer" 
        onClick={() => router.push('/emergency')}
      >
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

      <Card 
        className="hover:shadow-lg transition-shadow cursor-pointer" 
        onClick={() => router.push('/glossary')}
      >
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
  )
}