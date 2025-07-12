import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { subDays } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_id', userId)
      .single()
    
    if (!profile || profile.role !== 'admin') {
      return new NextResponse('Forbidden', { status: 403 })
    }
    
    // For now, return empty backup history since backup functionality isn't implemented
    // In a real implementation, this would fetch from a backups table
    const mockBackups = []
    
    // Calculate stats
    const thirtyDaysAgo = subDays(new Date(), 30)
    const recentBackups = mockBackups.filter((b: any) => 
      new Date(b.created_at) >= thirtyDaysAgo
    )
    const successfulBackups = recentBackups.filter((b: any) => b.status === 'success')
    const successRate = recentBackups.length > 0 
      ? Math.round((successfulBackups.length / recentBackups.length) * 100)
      : 100
    
    return NextResponse.json({
      backups: mockBackups,
      lastBackup: mockBackups.length > 0 ? mockBackups[0].created_at : null,
      totalSize: 0,
      backupCount: mockBackups.length,
      successRate
    })
  } catch (error) {
    console.error('Error fetching backup history:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  })
}