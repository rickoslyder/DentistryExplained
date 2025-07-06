'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function updateUserMetadata(metadata: {
  userType?: 'patient' | 'professional'
  role?: 'user' | 'admin' | 'editor'
  onboardingCompleted?: boolean
  interests?: string[]
  location?: string
  gdcNumber?: string
  practiceType?: string
  specializations?: string[]
  verificationStatus?: string
}) {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error('User not authenticated')
    }

    // Update publicMetadata (secure, backend-only)
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: metadata
    })

    // Revalidate paths that depend on user metadata
    revalidatePath('/dashboard')
    revalidatePath('/admin')
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error('Error updating user metadata:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update metadata' 
    }
  }
}

export async function grantAdminAccess(clerkUserId: string) {
  try {
    // Update Clerk publicMetadata
    await clerkClient.users.updateUserMetadata(clerkUserId, {
      publicMetadata: {
        userType: 'professional',
        role: 'admin'
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error granting admin access:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to grant admin access' 
    }
  }
}