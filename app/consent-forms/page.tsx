'use client'

import { useState } from 'react'
import { Download, FileText, Shield, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const consentForms = [
  {
    id: 1,
    title: 'General Dental Treatment Consent',
    description: 'Standard consent form for routine dental procedures including fillings, cleanings, and examinations.',
    category: 'General',
    lastUpdated: 'July 2025',
    downloadUrl: '/forms/general-dental-consent.pdf',
    popular: true,
  },
  {
    id: 2,
    title: 'Tooth Extraction Consent',
    description: 'Detailed consent form for tooth extraction procedures, including risks and post-operative care.',
    category: 'Oral Surgery',
    lastUpdated: 'July 2025',
    downloadUrl: '/forms/extraction-consent.pdf',
    popular: true,
  },
  {
    id: 3,
    title: 'Root Canal Treatment Consent',
    description: 'Comprehensive consent for endodontic treatment with procedure explanation and success rates.',
    category: 'Endodontics',
    lastUpdated: 'June 2025',
    downloadUrl: '/forms/root-canal-consent.pdf',
  },
  {
    id: 4,
    title: 'Dental Implant Consent',
    description: 'Consent form for dental implant placement including bone grafting options.',
    category: 'Implants',
    lastUpdated: 'July 2025',
    downloadUrl: '/forms/implant-consent.pdf',
    popular: true,
  },
  {
    id: 5,
    title: 'Teeth Whitening Consent',
    description: 'Patient consent for professional teeth whitening treatments.',
    category: 'Cosmetic',
    lastUpdated: 'June 2025',
    downloadUrl: '/forms/whitening-consent.pdf',
  },
  {
    id: 6,
    title: 'Orthodontic Treatment Consent',
    description: 'Detailed consent for braces and clear aligner treatments.',
    category: 'Orthodontics',
    lastUpdated: 'July 2025',
    downloadUrl: '/forms/orthodontic-consent.pdf',
  },
  {
    id: 7,
    title: 'Sedation Consent',
    description: 'Consent form for conscious sedation during dental procedures.',
    category: 'Sedation',
    lastUpdated: 'July 2025',
    downloadUrl: '/forms/sedation-consent.pdf',
  },
  {
    id: 8,
    title: 'Pediatric Dental Consent',
    description: 'Parent/guardian consent form for children\'s dental treatment.',
    category: 'Pediatric',
    lastUpdated: 'June 2025',
    downloadUrl: '/forms/pediatric-consent.pdf',
  },
]

const categories = ['All', 'General', 'Oral Surgery', 'Endodontics', 'Implants', 'Cosmetic', 'Orthodontics', 'Sedation', 'Pediatric']

export default function ConsentFormsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredForms = selectedCategory === 'All' 
    ? consentForms 
    : consentForms.filter(form => form.category === selectedCategory)

  const handleDownload = (form: typeof consentForms[0]) => {
    // In production, this would track the download and serve the actual PDF
    console.log(`Downloading: ${form.title}`)
    // For now, just open in new tab (would be actual PDF URLs in production)
    window.open(form.downloadUrl, '_blank')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Dental Consent Forms
        </h1>
        <p className="text-lg text-gray-600">
          Download professional consent forms for various dental procedures. 
          All forms are regularly updated to meet current legal requirements.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-blue-400 mt-0.5 mr-3" />
          <div>
            <p className="text-sm text-blue-700">
              <strong>For Dental Professionals:</strong> Create customized consent forms with our professional tools. 
              <a href="/professional/consent-forms" className="underline ml-1">
                Sign up for professional access
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Consent Forms Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredForms.map((form) => (
          <Card key={form.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <FileText className="w-8 h-8 text-primary" />
                {form.popular && (
                  <Badge variant="secondary">Popular</Badge>
                )}
              </div>
              <CardTitle className="mt-2">{form.title}</CardTitle>
              <CardDescription>{form.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Clock className="w-4 h-4 mr-1" />
                Updated: {form.lastUpdated}
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline">{form.category}</Badge>
                <Button
                  size="sm"
                  onClick={() => handleDownload(form)}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredForms.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No consent forms found in this category.</p>
        </div>
      )}

      {/* Additional Information */}
      <div className="mt-12 grid md:grid-cols-2 gap-8">
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Using These Forms
          </h2>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="block w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 mr-2 flex-shrink-0"></span>
              These are template forms that should be customized for your practice
            </li>
            <li className="flex items-start">
              <span className="block w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 mr-2 flex-shrink-0"></span>
              Ensure forms comply with your local regulations and requirements
            </li>
            <li className="flex items-start">
              <span className="block w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 mr-2 flex-shrink-0"></span>
              Consider having forms reviewed by legal counsel
            </li>
            <li className="flex items-start">
              <span className="block w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 mr-2 flex-shrink-0"></span>
              Update patient information and procedure details before use
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Professional Features
          </h2>
          <p className="text-gray-600 mb-4">
            Dental professionals can access advanced features:
          </p>
          <ul className="space-y-2 text-gray-600 mb-6">
            <li className="flex items-center">
              <Shield className="w-4 h-4 text-primary mr-2" />
              Custom form builder with practice branding
            </li>
            <li className="flex items-center">
              <Shield className="w-4 h-4 text-primary mr-2" />
              Digital signature collection
            </li>
            <li className="flex items-center">
              <Shield className="w-4 h-4 text-primary mr-2" />
              Secure patient record integration
            </li>
            <li className="flex items-center">
              <Shield className="w-4 h-4 text-primary mr-2" />
              Automatic form updates for legal compliance
            </li>
          </ul>
          <Button asChild>
            <a href="/professional/resources/consent-forms">
              Explore Professional Tools
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}