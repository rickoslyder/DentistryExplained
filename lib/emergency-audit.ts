export interface EmergencyAuditLog {
  user_id?: string
  session_id: string
  event_type: 'page_view' | 'symptom_check' | 'service_search' | 'emergency_contact' | 'guidance_viewed'
  event_data: Record<string, any>
  timestamp: string
  ip_address?: string
  user_agent?: string
}

// Generate a session ID for anonymous tracking
export function generateSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  // Check if we already have a session ID
  let sessionId = sessionStorage.getItem('emergencySessionId')
  
  if (!sessionId) {
    sessionId = `emergency_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    sessionStorage.setItem('emergencySessionId', sessionId)
  }
  
  return sessionId
}

// Log emergency events (anonymously by default)
export async function logEmergencyEvent(
  eventType: EmergencyAuditLog['event_type'],
  eventData: Record<string, any>,
  userId?: string
) {
  try {
    const sessionId = generateSessionId()
    
    // Store in localStorage for offline access
    const localLog: EmergencyAuditLog = {
      session_id: sessionId,
      event_type: eventType,
      event_data: eventData,
      timestamp: new Date().toISOString(),
      user_id: userId,
    }
    
    // Store locally first (in case of network issues)
    const localLogs = JSON.parse(localStorage.getItem('emergencyAuditLogs') || '[]')
    localLogs.push(localLog)
    
    // Keep only last 100 logs locally
    if (localLogs.length > 100) {
      localLogs.splice(0, localLogs.length - 100)
    }
    
    localStorage.setItem('emergencyAuditLogs', JSON.stringify(localLogs))
    
    // Try to send to server via API route (fire and forget)
    if (process.env.NEXT_PUBLIC_ENABLE_EMERGENCY_AUDIT === 'true') {
      try {
        await fetch('/api/emergency/audit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...localLog,
            user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
          }),
        })
      } catch {
        // Silently fail - audit logging should not interrupt emergency services
      }
    }
    
  } catch (error) {
    // Silently fail - we don't want to interrupt emergency services
    console.error('Failed to log emergency event:', error)
  }
}

// Get emergency session summary for user
export function getEmergencySessionSummary(): {
  sessionId: string
  events: EmergencyAuditLog[]
  startTime?: string
  endTime?: string
} {
  const sessionId = generateSessionId()
  const logs = JSON.parse(localStorage.getItem('emergencyAuditLogs') || '[]') as EmergencyAuditLog[]
  
  const sessionLogs = logs.filter(log => log.session_id === sessionId)
  
  return {
    sessionId,
    events: sessionLogs,
    startTime: sessionLogs[0]?.timestamp,
    endTime: sessionLogs[sessionLogs.length - 1]?.timestamp,
  }
}

// Export session data for user (GDPR compliance)
export function exportEmergencySessionData(): string {
  const summary = getEmergencySessionSummary()
  
  const exportData = {
    exportDate: new Date().toISOString(),
    sessionSummary: summary,
    disclaimer: 'This data was collected to improve emergency dental services and ensure appropriate guidance was provided.',
  }
  
  return JSON.stringify(exportData, null, 2)
}

// Clear emergency session data
export function clearEmergencySessionData(): void {
  sessionStorage.removeItem('emergencySessionId')
  localStorage.removeItem('emergencyAuditLogs')
}

// Helper to log specific emergency actions
export const EmergencyLogger = {
  pageView: (page: string, additionalData?: Record<string, any>) => {
    logEmergencyEvent('page_view', {
      page,
      ...additionalData,
    })
  },
  
  symptomCheck: (symptoms: string[], severity: string, recommendation: string) => {
    logEmergencyEvent('symptom_check', {
      symptoms,
      severity,
      recommendation,
      timestamp: new Date().toISOString(),
    })
  },
  
  serviceSearch: (location: { lat?: number; lng?: number; postcode?: string }, servicesFound: number) => {
    logEmergencyEvent('service_search', {
      location: location.postcode || 'coordinates',
      servicesFound,
      timestamp: new Date().toISOString(),
    })
  },
  
  emergencyContact: (contactType: '999' | '111' | 'dentist', reason?: string) => {
    logEmergencyEvent('emergency_contact', {
      contactType,
      reason,
      timestamp: new Date().toISOString(),
    })
  },
  
  guidanceViewed: (guidanceType: string, condition: string) => {
    logEmergencyEvent('guidance_viewed', {
      guidanceType,
      condition,
      timestamp: new Date().toISOString(),
    })
  },
}