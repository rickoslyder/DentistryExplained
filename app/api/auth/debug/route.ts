import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

export async function GET() {
  try {
    // Get Clerk auth data
    const { userId, sessionClaims } = await auth()
    const user = await currentUser()
    
    // Get Supabase profile
    let supabaseProfile = null
    let supabaseError = null
    
    if (userId) {
      const supabase = await createServerSupabaseClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('clerk_id', userId)
        .single()
      
      supabaseProfile = data
      supabaseError = error
    }
    
    // Get JWT token structure
    let jwtToken = null
    let jwtError = null
    
    if (userId) {
      try {
        const { getToken } = await auth()
        jwtToken = await getToken({ template: 'supabase' })
        
        // Decode the JWT to see its structure (base64 decode the payload)
        if (jwtToken) {
          const parts = jwtToken.split('.')
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
            jwtToken = { raw: jwtToken.substring(0, 20) + '...', decoded: payload }
          }
        }
      } catch (err: any) {
        jwtError = err.message
      }
    }
    
    const debugData = {
      clerk: {
        userId,
        sessionClaims,
        publicMetadata: user?.publicMetadata,
        unsafeMetadata: user?.unsafeMetadata,
      },
      supabase: {
        profile: supabaseProfile,
        error: supabaseError,
      },
      jwt: {
        token: jwtToken,
        error: jwtError,
      },
      checks: {
        hasUserId: !!userId,
        hasSessionClaims: !!sessionClaims,
        hasMetadata: !!sessionClaims?.metadata,
        userTypeFromClaims: sessionClaims?.metadata?.userType,
        roleFromClaims: sessionClaims?.metadata?.role,
        userTypeFromPublicMetadata: user?.publicMetadata?.userType,
        roleFromPublicMetadata: user?.publicMetadata?.role,
        supabaseUserType: supabaseProfile?.user_type,
        supabaseRole: supabaseProfile?.role,
        middlewareWouldAllow: sessionClaims?.metadata?.userType === 'professional' && 
          ['admin', 'editor'].includes(sessionClaims?.metadata?.role || ''),
        layoutWouldAllow: supabaseProfile?.user_type === 'professional' && 
          ['admin', 'editor'].includes(supabaseProfile?.role || ''),
      }
    }
    
    return NextResponse.json(debugData, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to get debug data', 
      message: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}