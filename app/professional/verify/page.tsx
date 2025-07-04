"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Shield, Upload, CheckCircle, AlertCircle, Clock, FileText, Trash2, ExternalLink, Info } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { 
  ProfessionalVerification, 
  VerificationDocument,
  VerificationFormData,
  validateGDCNumber,
  DOCUMENT_TYPES,
  PROFESSIONAL_TITLES
} from "@/types/professional"

export default function ProfessionalVerifyPage() {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verification, setVerification] = useState<ProfessionalVerification | null>(null)
  const [documents, setDocuments] = useState<VerificationDocument[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedDocumentType, setSelectedDocumentType] = useState('gdc_certificate')
  
  const [formData, setFormData] = useState<VerificationFormData>({
    gdc_number: "",
    full_name: "",
    practice_name: "",
    practice_address: "",
    additional_notes: "",
  })

  const [gdcValidation, setGdcValidation] = useState({
    isValid: true,
    error: ""
  })

  useEffect(() => {
    if (user) {
      loadVerificationData()
    }
  }, [user])

  const loadVerificationData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/professional/verification')
      
      if (response.ok) {
        const data = await response.json()
        if (data.verification) {
          setVerification(data.verification)
          setDocuments(data.documents || [])
          
          // Pre-fill form if editing
          if (data.verification.verification_status === 'pending' || data.verification.verification_status === 'rejected') {
            setFormData({
              gdc_number: data.verification.gdc_number,
              full_name: data.verification.full_name,
              practice_name: data.verification.practice_name || "",
              practice_address: data.verification.practice_address || "",
              additional_notes: data.verification.additional_notes || "",
            })
          }
        }
      }
    } catch (error) {
      console.error('Error loading verification data:', error)
      toast.error('Failed to load verification data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGDCNumberChange = (value: string) => {
    const validation = validateGDCNumber(value)
    setGdcValidation({
      isValid: validation.isValid,
      error: validation.error || ""
    })
    setFormData(prev => ({ ...prev, gdc_number: validation.formatted }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!gdcValidation.isValid) {
      toast.error('Please enter a valid GDC number')
      return
    }

    if (documents.length === 0) {
      toast.error('Please upload at least one supporting document')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/professional/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setVerification(data.verification)
        toast.success('Verification submitted successfully')
        
        // Refresh the page to show updated status
        loadVerificationData()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to submit verification')
      }
    } catch (error) {
      console.error('Verification submission error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload PDF or image files only')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', selectedDocumentType)

    try {
      setUploadProgress(10)
      
      const response = await fetch('/api/professional/verification/upload', {
        method: 'POST',
        body: formData,
      })

      setUploadProgress(90)

      if (response.ok) {
        const data = await response.json()
        setDocuments(prev => [...prev, data.document])
        toast.success('Document uploaded successfully')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to upload document')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload document')
    } finally {
      setUploadProgress(0)
    }
  }

  const deleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/professional/verification/document/${documentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId))
        toast.success('Document deleted')
      } else {
        toast.error('Failed to delete document')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete document')
    }
  }

  const getStatusIcon = () => {
    if (!verification) return <Shield className="w-6 h-6 text-gray-400" />
    
    switch (verification.verification_status) {
      case "verified":
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case "rejected":
        return <AlertCircle className="w-6 h-6 text-red-600" />
      case "pending":
        return <Clock className="w-6 h-6 text-yellow-600" />
      default:
        return <Shield className="w-6 h-6 text-gray-400" />
    }
  }

  const getStatusBadge = () => {
    if (!verification) return <Badge variant="outline">Not Started</Badge>
    
    switch (verification.verification_status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800">✓ Verified</Badge>
      case "rejected":
        return <Badge variant="destructive">❌ Rejected</Badge>
      case "pending":
        return <Badge variant="secondary">⏳ Under Review</Badge>
      default:
        return <Badge variant="outline">Not Started</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading verification status...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">{getStatusIcon()}</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Professional Verification</h1>
          <p className="text-gray-600 mb-4">
            Verify your GDC registration to access exclusive professional features
          </p>
          {getStatusBadge()}
        </div>

        {/* Status-specific content */}
        {verification?.verification_status === "verified" && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600 mr-4" />
                <div>
                  <h3 className="font-semibold text-green-800">Verification Approved!</h3>
                  <p className="text-green-700">
                    Your professional status has been verified. GDC Number: {verification.gdc_number}
                  </p>
                  {verification.expiry_date && (
                    <p className="text-sm text-green-600 mt-1">
                      Valid until: {new Date(verification.expiry_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {verification?.verification_status === "pending" && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-600 mr-4" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Verification Under Review</h3>
                  <p className="text-yellow-700">
                    We're reviewing your submission. This usually takes 1-2 business days.
                  </p>
                  {verification.created_at && (
                    <p className="text-sm text-yellow-600 mt-1">
                      Submitted: {new Date(verification.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {verification?.verification_status === "rejected" && (
          <Alert className="mb-8 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Verification Rejected</AlertTitle>
            <AlertDescription className="text-red-700">
              {verification.rejection_reason || "Please check your information and try again."}
            </AlertDescription>
          </Alert>
        )}

        {/* GDC Register Link */}
        <Alert className="mb-8">
          <Info className="h-4 w-4" />
          <AlertTitle>Verify Your GDC Number</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>Before submitting, please verify your details on the official GDC register:</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              asChild
            >
              <a 
                href="https://olr.gdc-uk.org/searchregister" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Check GDC Register
              </a>
            </Button>
          </AlertDescription>
        </Alert>

        {/* Verification Form */}
        {(!verification || verification.verification_status === "rejected") && (
          <Card>
            <CardHeader>
              <CardTitle>Submit Verification</CardTitle>
              <CardDescription>
                Please provide your professional details and supporting documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="gdcNumber">GDC Registration Number *</Label>
                    <Input
                      id="gdcNumber"
                      value={formData.gdc_number}
                      onChange={(e) => handleGDCNumberChange(e.target.value)}
                      placeholder="Enter your 6 or 7 digit GDC number"
                      required
                      className={!gdcValidation.isValid ? 'border-red-500' : ''}
                    />
                    {!gdcValidation.isValid && (
                      <p className="text-sm text-red-500 mt-1">{gdcValidation.error}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">This will be verified against the GDC register</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="As registered with GDC"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="practiceTitle">Professional Title</Label>
                    <Select 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, professional_title: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your title" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROFESSIONAL_TITLES.map((title) => (
                          <SelectItem key={title.value} value={title.value}>
                            {title.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="practiceName">Practice Name</Label>
                    <Input
                      id="practiceName"
                      value={formData.practice_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, practice_name: e.target.value }))}
                      placeholder="Your current practice (optional)"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="practiceAddress">Practice Address</Label>
                  <Textarea
                    id="practiceAddress"
                    value={formData.practice_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, practice_address: e.target.value }))}
                    placeholder="Enter your practice address (optional)"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="additionalNotes">Additional Information</Label>
                  <Textarea
                    id="additionalNotes"
                    value={formData.additional_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
                    placeholder="Any additional information that might help with verification (optional)"
                    rows={3}
                  />
                </div>

                {/* Document Upload Section */}
                <div className="space-y-4">
                  <div>
                    <Label>Supporting Documents *</Label>
                    <p className="text-sm text-gray-500 mb-3">
                      Please upload your GDC certificate or other supporting documents
                    </p>

                    <div className="mb-4">
                      <Label htmlFor="documentType">Document Type</Label>
                      <Select 
                        value={selectedDocumentType}
                        onValueChange={setSelectedDocumentType}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        id="document-upload"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        disabled={!verification || verification.verification_status === 'pending'}
                      />
                      <label 
                        htmlFor="document-upload"
                        className="cursor-pointer"
                      >
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-700">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PDF, JPG, PNG up to 10MB
                        </p>
                      </label>
                    </div>

                    {uploadProgress > 0 && (
                      <Progress value={uploadProgress} className="mt-3" />
                    )}
                  </div>

                  {/* Uploaded Documents */}
                  {documents.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Uploaded Documents</h4>
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium">{doc.file_name}</p>
                              <p className="text-xs text-gray-500">
                                {DOCUMENT_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type}
                              </p>
                            </div>
                          </div>
                          {(!verification || verification.verification_status !== 'pending') && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteDocument(doc.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• We'll verify your GDC registration number</li>
                    <li>• Our team will review your submission within 1-2 business days</li>
                    <li>• You'll receive an email notification once verification is complete</li>
                    <li>• Once approved, you'll have access to all professional features</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.gdc_number || !formData.full_name || documents.length === 0}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Submitting Verification...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Submit for Verification
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Professional Features Preview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Professional Features</CardTitle>
            <CardDescription>What you'll get access to once verified</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Consent Form Templates</h3>
                    <p className="text-sm text-gray-600">
                      Access to professionally designed consent forms for all procedures
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Upload className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Patient Education Materials</h3>
                    <p className="text-sm text-gray-600">Downloadable handouts and educational resources</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Professional Badge</h3>
                    <p className="text-sm text-gray-600">
                      Verified professional badge on your profile and contributions
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Practice Management</h3>
                    <p className="text-sm text-gray-600">Manage your practice listing and connect with patients</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}