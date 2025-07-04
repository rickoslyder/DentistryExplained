'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Download, FileText, Shield, Clock, Lock, Eye } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  const [previewForm, setPreviewForm] = useState<typeof consentForms[0] | null>(null)
  const { user, isSignedIn } = useUser()
  const router = useRouter()
  
  const isProfessional = user?.unsafeMetadata?.userType === 'professional'
  const isVerified = user?.unsafeMetadata?.verificationStatus === 'approved'

  const filteredForms = selectedCategory === 'All' 
    ? consentForms 
    : consentForms.filter(form => form.category === selectedCategory)

  const handleDownload = (form: typeof consentForms[0]) => {
    if (!isSignedIn) {
      router.push('/sign-in?redirect_url=' + encodeURIComponent(window.location.pathname))
      return
    }
    
    if (!isProfessional || !isVerified) {
      router.push('/professional/upgrade?from=' + encodeURIComponent(window.location.pathname))
      return
    }
    
    // In production, this would track the download and serve the actual PDF
    console.log(`Downloading: ${form.title}`)
    window.open(form.downloadUrl, '_blank')
  }
  
  const handlePreview = (form: typeof consentForms[0]) => {
    setPreviewForm(form)
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
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
          {!isProfessional && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-blue-400 mt-0.5 mr-3" />
            <div>
              <p className="text-sm text-blue-700">
                <strong>For Dental Professionals:</strong> Download and customize consent forms with your practice details. 
                <a href="/professional/upgrade" className="underline ml-1">
                  Get professional access
                </a>
              </p>
            </div>
          </div>
        </div>
          )}
          
          {isProfessional && !isVerified && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex items-start">
            <Clock className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" />
            <div>
              <p className="text-sm text-yellow-700">
                <strong>Verification Pending:</strong> Complete your professional verification to download consent forms. 
                <a href="/professional/verify" className="underline ml-1">
                  Complete verification
                </a>
              </p>
            </div>
          </div>
        </div>
          )}

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
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreview(form)}
                    className="gap-2 bg-transparent"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </Button>
                  {isProfessional && isVerified ? (
                    <Button
                      size="sm"
                      onClick={() => handleDownload(form)}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDownload(form)}
                      className="gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      Pro
                    </Button>
                  )}
                </div>
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
          
          {/* Preview Dialog */}
          <Dialog open={!!previewForm} onOpenChange={() => setPreviewForm(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewForm?.title}</DialogTitle>
            <DialogDescription>
              Preview of the consent form template
            </DialogDescription>
          </DialogHeader>
          
          {previewForm && (
            <div className="mt-4 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Form Information</h3>
                <p className="text-sm text-gray-600 mb-2">{previewForm.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="outline">{previewForm.category}</Badge>
                  <span className="text-gray-500">Last updated: {previewForm.lastUpdated}</span>
                </div>
              </div>
              
              <div className="border rounded-lg p-6">
                <h3 className="text-center text-xl font-semibold mb-4">
                  [Your Practice Name]<br />
                  <span className="text-base font-normal">{previewForm.title}</span>
                </h3>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-semibold mb-2">Patient Information:</p>
                    <div className="border rounded p-3 bg-gray-50">
                      <p>Name: _______________________________________</p>
                      <p className="mt-2">Date of Birth: _____________ Today's Date: _____________</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-semibold mb-2">Treatment Information:</p>
                    <p className="text-gray-600">
                      I understand that I will be receiving the following treatment:
                      {previewForm.category === 'General' && ' routine dental care including examinations, cleanings, and minor restorative work.'}
                      {previewForm.category === 'Oral Surgery' && ' tooth extraction(s) as discussed with my dentist.'}
                      {previewForm.category === 'Endodontics' && ' root canal treatment on tooth/teeth as identified.'}
                      {previewForm.category === 'Implants' && ' dental implant placement and restoration.'}
                      {previewForm.category === 'Cosmetic' && ' cosmetic dental procedures to improve appearance.'}
                      {previewForm.category === 'Orthodontics' && ' orthodontic treatment to align teeth and improve bite.'}
                      {previewForm.category === 'Sedation' && ' sedation to help manage anxiety during treatment.'}
                      {previewForm.category === 'Pediatric' && ' age-appropriate dental care for my child.'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-semibold mb-2">Risks and Benefits:</p>
                    <p className="text-gray-600 mb-2">
                      The risks, benefits, and alternatives have been explained to me. I understand that no guarantee 
                      can be made regarding the outcome of treatment.
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-semibold mb-2">Consent:</p>
                    <p className="text-gray-600 mb-3">
                      I consent to the treatment described above. I have had the opportunity to ask questions, 
                      and all my questions have been answered to my satisfaction.
                    </p>
                    <div className="border rounded p-3 bg-gray-50">
                      <p>Patient/Guardian Signature: _______________________________</p>
                      <p className="mt-2">Date: _____________</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> This is a template preview. The actual form will include more detailed 
                  information specific to the procedure and your practice requirements.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
          </Dialog>
        </div>
      </main>
      <Footer />
    </>
  )
}