import { Resend } from 'resend'

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface VerificationApprovedEmailProps {
  to: string
  name: string
  gdcNumber: string
  expiryDate?: string
}

export async function sendVerificationApprovedEmail({
  to,
  name,
  gdcNumber,
  expiryDate
}: VerificationApprovedEmailProps) {
  try {
    if (!resend) {
      console.warn('Email service not configured. Skipping email send.')
      return { success: true, data: { id: 'mock-email-id' } }
    }
    
    const { data, error } = await resend.emails.send({
      from: 'Dentistry Explained <notifications@dentistryexplained.com>',
      to,
      subject: 'Your Professional Verification Has Been Approved',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0f172a; color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Verification Approved ✓</h1>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 32px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 24px;">
              Dear ${name},
            </p>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 24px;">
              We're pleased to inform you that your professional verification has been approved!
            </p>
            
            <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h2 style="font-size: 18px; color: #0f172a; margin-bottom: 16px;">Verification Details</h2>
              <p style="margin: 8px 0;"><strong>GDC Number:</strong> ${gdcNumber}</p>
              <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #10b981;">Verified</span></p>
              ${expiryDate ? `<p style="margin: 8px 0;"><strong>Valid Until:</strong> ${new Date(expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>` : ''}
            </div>
            
            <h3 style="font-size: 16px; color: #0f172a; margin-bottom: 12px;">You now have access to:</h3>
            <ul style="color: #333; line-height: 1.8;">
              <li>Professional consent form templates</li>
              <li>Patient education materials</li>
              <li>Verified professional badge on your profile</li>
              <li>Practice management features</li>
            </ul>
            
            <div style="text-align: center; margin-top: 32px;">
              <a href="https://dentistryexplained.com/professional/dashboard" 
                 style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Access Professional Dashboard
              </a>
            </div>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 24px; text-align: center; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">Dentistry Explained - Professional dental education made simple</p>
          </div>
        </div>
      `
    })

    if (error) {
      console.error('Failed to send verification approved email:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}

interface VerificationRejectedEmailProps {
  to: string
  name: string
  gdcNumber: string
  rejectionReason: string
}

export async function sendVerificationRejectedEmail({
  to,
  name,
  gdcNumber,
  rejectionReason
}: VerificationRejectedEmailProps) {
  try {
    if (!resend) {
      console.warn('Email service not configured. Skipping email send.')
      return { success: true, data: { id: 'mock-email-id' } }
    }
    
    const { data, error } = await resend.emails.send({
      from: 'Dentistry Explained <notifications@dentistryexplained.com>',
      to,
      subject: 'Professional Verification Update',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0f172a; color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Verification Update</h1>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 32px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 24px;">
              Dear ${name},
            </p>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 24px;">
              Thank you for submitting your professional verification request. After reviewing your submission, we need additional information to complete the verification process.
            </p>
            
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h2 style="font-size: 18px; color: #dc2626; margin-bottom: 16px;">Review Feedback</h2>
              <p style="margin: 8px 0;"><strong>GDC Number:</strong> ${gdcNumber}</p>
              <p style="margin: 16px 0; color: #7f1d1d;">${rejectionReason}</p>
            </div>
            
            <h3 style="font-size: 16px; color: #0f172a; margin-bottom: 12px;">Next Steps:</h3>
            <ol style="color: #333; line-height: 1.8;">
              <li>Review the feedback above</li>
              <li>Gather any additional required documents</li>
              <li>Resubmit your verification with the requested information</li>
            </ol>
            
            <div style="text-align: center; margin-top: 32px;">
              <a href="https://dentistryexplained.com/professional/verify" 
                 style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Resubmit Verification
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
              If you have any questions about the verification process, please don't hesitate to contact our support team.
            </p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 24px; text-align: center; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">Dentistry Explained - Professional dental education made simple</p>
          </div>
        </div>
      `
    })

    if (error) {
      console.error('Failed to send verification rejected email:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}