import { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClientWithClerkAuth } from '@/lib/supabase-auth'
import { ProfessionalResearchTool } from '@/components/professional/research-tool'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Clinical Research Tool | Dentistry Explained',
  description: 'Generate evidence-based research reports on dental topics',
}

export default async function ProfessionalResearchPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const supabase = await createClientWithClerkAuth()
  
  // Check if user is a professional or admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profile?.role !== 'professional' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Check professional verification status
  let isVerified = true
  if (profile?.role === 'professional') {
    const { data: verification } = await supabase
      .from('professional_verifications')
      .select('status')
      .eq('user_id', userId)
      .single()

    isVerified = verification?.status === 'approved'
  }

  if (!isVerified) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Your professional verification is pending. You'll have access to this feature once your verification is approved.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Clinical Research Tool</h1>
        <p className="text-muted-foreground">
          Access comprehensive, evidence-based research on dental topics from trusted medical sources.
        </p>
      </div>

      <ProfessionalResearchTool />
    </div>
  )
}