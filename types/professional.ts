export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired'

export interface ProfessionalVerification {
  id: string
  user_id: string
  gdc_number: string
  full_name: string
  practice_name?: string
  practice_address?: string
  verification_status: VerificationStatus
  verification_date?: string
  expiry_date?: string
  verified_by?: string
  rejection_reason?: string
  additional_notes?: string
  created_at: string
  updated_at: string
}

export interface VerificationDocument {
  id: string
  verification_id: string
  document_type: string
  file_name: string
  file_url: string
  file_size?: number
  mime_type?: string
  uploaded_at: string
}

export interface VerificationActivityLog {
  id: string
  verification_id: string
  action: string
  performed_by: string
  details?: Record<string, any>
  created_at: string
}

export interface VerificationFormData {
  gdc_number: string
  full_name: string
  practice_name?: string
  practice_address?: string
  additional_notes?: string
}

export interface VerificationStats {
  total: number
  pending: number
  verified: number
  rejected: number
  expired: number
}

export interface GDCValidationResult {
  isValid: boolean
  formatted: string
  error?: string
}

// GDC number validation
export function validateGDCNumber(input: string): GDCValidationResult {
  // Remove any non-numeric characters
  const cleaned = input.replace(/\D/g, '')
  
  // GDC numbers are 6 or 7 digits
  if (cleaned.length < 6 || cleaned.length > 7) {
    return {
      isValid: false,
      formatted: cleaned,
      error: 'GDC number must be 6 or 7 digits'
    }
  }
  
  // Pad with leading zeros if 6 digits
  const formatted = cleaned.padStart(7, '0')
  
  return {
    isValid: true,
    formatted
  }
}

// Document type options
export const DOCUMENT_TYPES = [
  { value: 'gdc_certificate', label: 'GDC Certificate' },
  { value: 'insurance', label: 'Professional Indemnity Insurance' },
  { value: 'qualification', label: 'Qualification Certificate' },
  { value: 'other', label: 'Other Supporting Document' }
] as const

// Professional titles
export const PROFESSIONAL_TITLES = [
  { value: 'dentist', label: 'Dentist' },
  { value: 'dental_therapist', label: 'Dental Therapist' },
  { value: 'dental_hygienist', label: 'Dental Hygienist' },
  { value: 'dental_nurse', label: 'Dental Nurse' },
  { value: 'orthodontist', label: 'Orthodontist' },
  { value: 'dental_technician', label: 'Dental Technician' },
  { value: 'clinical_dental_technician', label: 'Clinical Dental Technician' }
] as const