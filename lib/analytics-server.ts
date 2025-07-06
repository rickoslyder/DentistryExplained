import crypto from 'crypto';

/**
 * Server-side analytics tracking using GA4 Measurement Protocol
 * This complements client-side tracking for server events
 */

interface ServerEventParameters {
  [key: string]: string | number | boolean | undefined;
}

interface ServerUserProperties {
  app_user_id?: string; // Changed from user_id to avoid GA4 reserved property
  user_type?: 'patient' | 'professional' | 'admin';
  is_verified?: boolean;
  email_hash?: string;
  [key: string]: string | number | boolean | undefined;
}

interface GA4ServerConfig {
  measurementId: string;
  apiSecret: string;
  debug?: boolean;
}

class ServerAnalytics {
  private config: GA4ServerConfig | null = null;
  private endpoint: string = 'https://www.google-analytics.com/mp/collect';
  private debugEndpoint: string = 'https://www.google-analytics.com/debug/mp/collect';
  private eventQueue: Array<any> = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private maxBatchSize: number = 25; // GA4 limit
  private batchDelay: number = 1000; // 1 second

  constructor() {
    // Initialize from environment variables
    const measurementId = process.env.GA4_MEASUREMENT_ID;
    const apiSecret = process.env.GA4_API_SECRET;

    if (measurementId && apiSecret) {
      this.config = {
        measurementId,
        apiSecret,
        debug: process.env.NODE_ENV === 'development',
      };
    }
  }

  /**
   * Initialize with custom config (useful for testing)
   */
  initialize(config: GA4ServerConfig) {
    this.config = config;
  }

  /**
   * Check if analytics is configured
   */
  isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * Generate a client ID for server-side tracking
   * Uses a combination of user ID and session data
   */
  generateClientId(userId?: string, sessionId?: string): string {
    const baseString = userId || sessionId || crypto.randomUUID();
    return crypto
      .createHash('sha256')
      .update(baseString)
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Hash sensitive data before sending
   */
  private hashValue(value: string): string {
    return crypto
      .createHash('sha256')
      .update(value.toLowerCase().trim())
      .digest('hex');
  }

  /**
   * Track a server-side event
   */
  async trackEvent(
    eventName: string,
    parameters?: ServerEventParameters,
    userProperties?: ServerUserProperties,
    clientId?: string,
    userId?: string
  ): Promise<void> {
    if (!this.isConfigured()) {
      console.warn('Server analytics not configured');
      return;
    }

    // Generate client ID if not provided
    const cid = clientId || this.generateClientId(userId);

    // Build event payload
    const event = {
      name: eventName,
      params: {
        ...parameters,
        // Add server-side tracking identifier
        tracking_source: 'server',
        server_timestamp: Date.now(),
        // Add environment context
        environment: process.env.NODE_ENV || 'production',
      },
    };

    // Build user properties
    const user_properties: any = {};
    if (userProperties) {
      Object.entries(userProperties).forEach(([key, value]) => {
        if (value !== undefined) {
          user_properties[key] = { value };
        }
      });
    }

    // Build complete payload
    const payload = {
      client_id: cid,
      user_id: userId,
      timestamp_micros: Date.now() * 1000, // Convert to microseconds
      events: [event],
      ...(Object.keys(user_properties).length > 0 && { user_properties }),
    };

    // Add to batch queue
    this.addToBatch(payload);
  }

  /**
   * Add event to batch queue
   */
  private addToBatch(payload: any) {
    this.eventQueue.push(payload);

    // Send immediately if batch is full
    if (this.eventQueue.length >= this.maxBatchSize) {
      this.flushBatch();
    } else {
      // Schedule batch send
      this.scheduleBatchSend();
    }
  }

  /**
   * Schedule batch send with debouncing
   */
  private scheduleBatchSend() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.flushBatch();
    }, this.batchDelay);
  }

  /**
   * Send batched events to GA4
   */
  private async flushBatch() {
    if (this.eventQueue.length === 0 || !this.config) {
      return;
    }

    // Get events to send
    const eventsToSend = this.eventQueue.splice(0, this.maxBatchSize);

    try {
      const endpoint = this.config.debug ? this.debugEndpoint : this.endpoint;
      const url = `${endpoint}?measurement_id=${this.config.measurementId}&api_secret=${this.config.apiSecret}`;

      // Send each event (GA4 doesn't support true batching yet)
      const promises = eventsToSend.map(async (payload) => {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          console.error('GA4 Measurement Protocol error:', response.status);
        }

        // In debug mode, log the validation response
        if (this.config!.debug) {
          const debugResponse = await response.json();
          if (debugResponse.validationMessages?.length > 0) {
            console.warn('GA4 validation messages:', debugResponse.validationMessages);
          }
        }
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      // Re-add failed events to queue for retry
      this.eventQueue.unshift(...eventsToSend);
    }
  }

  /**
   * Track API endpoint usage
   */
  async trackApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    userId?: string,
    error?: string
  ) {
    await this.trackEvent(
      'api_call',
      {
        api_endpoint: endpoint,
        api_method: method,
        api_status_code: statusCode,
        api_duration_ms: duration,
        api_success: statusCode < 400,
        ...(error && { api_error: error }),
      },
      userId ? { app_user_id: userId } : undefined,
      undefined,
      userId
    );
  }

  /**
   * Track professional verification events
   */
  async trackProfessionalVerification(
    action: 'started' | 'submitted' | 'approved' | 'rejected',
    userId: string,
    gdcNumber?: string,
    verificationId?: string
  ) {
    await this.trackEvent(
      'professional_verification',
      {
        verification_action: action,
        ...(verificationId && { verification_id: verificationId }),
        ...(gdcNumber && { gdc_number_hash: this.hashValue(gdcNumber) }),
      },
      {
        app_user_id: userId,
        user_type: 'professional',
      },
      undefined,
      userId
    );
  }

  /**
   * Track chat session events
   */
  async trackChatSession(
    action: 'created' | 'message_sent' | 'exported' | 'deleted',
    sessionId: string,
    userId?: string,
    messageCount?: number
  ) {
    await this.trackEvent(
      'chat_session',
      {
        chat_action: action,
        chat_session_id: sessionId,
        ...(messageCount !== undefined && { message_count: messageCount }),
      },
      userId ? { app_user_id: userId } : undefined,
      undefined,
      userId
    );
  }

  /**
   * Track content versioning events
   */
  async trackContentVersion(
    action: 'created' | 'restored' | 'compared',
    articleId: string,
    versionId: string,
    userId: string
  ) {
    await this.trackEvent(
      'content_version',
      {
        version_action: action,
        article_id: articleId,
        version_id: versionId,
      },
      {
        app_user_id: userId,
        user_type: 'admin',
      },
      undefined,
      userId
    );
  }

  /**
   * Track search queries (server-side)
   */
  async trackSearch(
    query: string,
    resultCount: number,
    searchType: 'article' | 'glossary' | 'web',
    userId?: string
  ) {
    await this.trackEvent(
      'search',
      {
        search_term: query,
        search_results_count: resultCount,
        search_type: searchType,
        search_location: 'server',
      },
      userId ? { app_user_id: userId } : undefined,
      undefined,
      userId
    );
  }

  /**
   * Track email events
   */
  async trackEmail(
    action: 'sent' | 'opened' | 'clicked' | 'bounced',
    emailType: string,
    recipientId?: string,
    emailId?: string
  ) {
    await this.trackEvent(
      'email_event',
      {
        email_action: action,
        email_type: emailType,
        ...(emailId && { email_id: emailId }),
      },
      recipientId ? { user_id: recipientId } : undefined,
      undefined,
      recipientId
    );
  }

  /**
   * Track scheduled job execution
   */
  async trackScheduledJob(
    jobName: string,
    status: 'started' | 'completed' | 'failed',
    duration?: number,
    error?: string
  ) {
    await this.trackEvent(
      'scheduled_job',
      {
        job_name: jobName,
        job_status: status,
        ...(duration !== undefined && { job_duration_ms: duration }),
        ...(error && { job_error: error }),
      }
    );
  }

  /**
   * Force flush all pending events
   */
  async flush() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    await this.flushBatch();
  }
}

// Create singleton instance
export const serverAnalytics = new ServerAnalytics();

// Middleware for tracking API calls
export function createAnalyticsMiddleware() {
  return async (req: Request, context: any) => {
    const startTime = Date.now();
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Skip analytics endpoints to avoid loops
    if (pathname.includes('/api/analytics')) {
      return;
    }

    try {
      // Get the response
      const response = await context.next();
      const duration = Date.now() - startTime;

      // Track the API call
      await serverAnalytics.trackApiCall(
        pathname,
        req.method,
        response.status,
        duration,
        context.userId // Assuming userId is added by auth middleware
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track the error
      await serverAnalytics.trackApiCall(
        pathname,
        req.method,
        500,
        duration,
        context.userId,
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw error;
    }
  };
}