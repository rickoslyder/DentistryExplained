// Utility functions for tracking glossary interactions

export type InteractionType = 'view' | 'search' | 'copy' | 'youtube' | 'bookmark' | 'quiz_attempt'

interface TrackingOptions {
  term: string
  interaction_type: InteractionType
  metadata?: Record<string, any>
}

// Debounce tracking calls to avoid spamming
const trackingQueue: Map<string, NodeJS.Timeout> = new Map()

export async function trackGlossaryInteraction({
  term,
  interaction_type,
  metadata = {}
}: TrackingOptions): Promise<void> {
  try {
    // For search, debounce to avoid tracking every keystroke
    if (interaction_type === 'search') {
      const key = `search-${term}`
      
      // Clear existing timeout
      const existingTimeout = trackingQueue.get(key)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }
      
      // Set new timeout
      const timeout = setTimeout(async () => {
        await sendTrackingRequest({ term, interaction_type, metadata })
        trackingQueue.delete(key)
      }, 500) // 500ms debounce
      
      trackingQueue.set(key, timeout)
    } else {
      // For other interactions, track immediately
      await sendTrackingRequest({ term, interaction_type, metadata })
    }
  } catch (error) {
    // Fail silently - don't break UX for tracking
    console.error('Tracking error:', error)
  }
}

async function sendTrackingRequest(options: TrackingOptions): Promise<void> {
  const response = await fetch('/api/glossary/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  })
  
  if (!response.ok) {
    console.error('Failed to track interaction:', await response.text())
  }
}

// Batch tracking for performance
export class BatchTracker {
  private queue: TrackingOptions[] = []
  private timer: NodeJS.Timeout | null = null
  private readonly batchSize = 10
  private readonly flushDelay = 2000 // 2 seconds
  
  track(options: TrackingOptions) {
    this.queue.push(options)
    
    if (this.queue.length >= this.batchSize) {
      this.flush()
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushDelay)
    }
  }
  
  private async flush() {
    if (this.queue.length === 0) return
    
    const items = [...this.queue]
    this.queue = []
    
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    
    // Send all at once
    for (const item of items) {
      await sendTrackingRequest(item)
    }
  }
}

// Global batch tracker instance
export const glossaryTracker = new BatchTracker()