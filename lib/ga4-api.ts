import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { google } from '@google-analytics/data/build/protos/protos';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

// Type definitions
type DateRange = google.analytics.data.v1beta.IDateRange;
type Dimension = google.analytics.data.v1beta.IDimension;
type Metric = google.analytics.data.v1beta.IMetric;
type OrderBy = google.analytics.data.v1beta.IOrderBy;
type FilterExpression = google.analytics.data.v1beta.IFilterExpression;

interface GA4Config {
  propertyId: string;
  credentials?: {
    client_email: string;
    private_key: string;
  };
}

interface RealtimeData {
  activeUsers: number;
  usersByPage: Array<{
    page: string;
    users: number;
  }>;
  usersBySource: Array<{
    source: string;
    users: number;
  }>;
  recentEvents: Array<{
    eventName: string;
    count: number;
    page?: string;
  }>;
}

interface ReportData {
  dimensions: string[];
  metrics: string[];
  rows: Array<{
    dimensionValues: string[];
    metricValues: any[];
  }>;
}

class GA4Client {
  private client: BetaAnalyticsDataClient;
  private propertyId: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(config: GA4Config) {
    this.propertyId = config.propertyId;
    
    // Initialize client with credentials if provided
    if (config.credentials) {
      this.client = new BetaAnalyticsDataClient({
        credentials: config.credentials,
      });
    } else {
      // Use default credentials from environment
      this.client = new BetaAnalyticsDataClient();
    }
  }

  // Get real-time data
  async getRealtimeData(): Promise<RealtimeData> {
    const cacheKey = 'realtime';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      console.log('GA4: Attempting to fetch realtime data for property:', this.propertyId);
      
      const [response] = await this.client.runRealtimeReport({
        property: `properties/${this.propertyId}`,
        dimensions: [
          { name: 'eventName' },
          { name: 'unifiedScreenName' },
          { name: 'platform' },  // Changed from invalid dimension
        ],
        metrics: [
          { name: 'activeUsers' },
          { name: 'eventCount' },
        ],
      });

      const data = this.processRealtimeData(response);
      this.setCache(cacheKey, data);
      return data;
    } catch (error: any) {
      console.error('GA4 realtime data error:', error);
      
      // Log more detailed error information
      if (error.code === 7) {
        console.error('GA4 Error Details:');
        console.error('- Code: INVALID_ARGUMENT');
        console.error('- This usually means:');
        console.error('  1. The service account doesn\'t have access to the GA4 property');
        console.error('  2. The Google Analytics Data API is not enabled in Google Cloud Console');
        console.error('  3. The property ID is incorrect');
        console.error('- Property ID used:', this.propertyId);
      }
      
      if (error.details) {
        console.error('- Error details:', error.details);
      }
      
      return {
        activeUsers: 0,
        usersByPage: [],
        usersBySource: [],
        recentEvents: [],
      };
    }
  }

  // Get engagement metrics
  async getEngagementMetrics(days: number = 7): Promise<ReportData> {
    const cacheKey = `engagement_${days}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const [response] = await this.client.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: format(subDays(new Date(), days - 1), 'yyyy-MM-dd'),
            endDate: 'today',
          },
        ],
        dimensions: [
          { name: 'pagePath' },
          { name: 'pageTitle' },
        ],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
          { name: 'engagementRate' },
        ],
        orderBys: [
          {
            metric: { metricName: 'screenPageViews' },
            desc: true,
          },
        ],
        limit: 20,
      });

      const data = this.processReportData(response);
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('GA4 engagement metrics error:', error);
      return { dimensions: [], metrics: [], rows: [] };
    }
  }

  // Get user acquisition data
  async getUserAcquisition(days: number = 7): Promise<ReportData> {
    const cacheKey = `acquisition_${days}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const [response] = await this.client.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: format(subDays(new Date(), days - 1), 'yyyy-MM-dd'),
            endDate: 'today',
          },
        ],
        dimensions: [
          { name: 'sessionDefaultChannelGroup' },
          { name: 'sessionSource' },
        ],
        metrics: [
          { name: 'totalUsers' },
          { name: 'newUsers' },
          { name: 'sessions' },
          { name: 'engagedSessions' },
        ],
        orderBys: [
          {
            metric: { metricName: 'totalUsers' },
            desc: true,
          },
        ],
      });

      const data = this.processReportData(response);
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('GA4 user acquisition error:', error);
      return { dimensions: [], metrics: [], rows: [] };
    }
  }

  // Get conversion events
  async getConversionEvents(days: number = 7): Promise<ReportData> {
    const cacheKey = `conversions_${days}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const [response] = await this.client.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: format(subDays(new Date(), days - 1), 'yyyy-MM-dd'),
            endDate: 'today',
          },
        ],
        dimensions: [
          { name: 'eventName' },
        ],
        metrics: [
          { name: 'eventCount' },
          { name: 'eventValue' },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            inListFilter: {
              values: [
                'sign_up',
                'professional_verification_submitted',
                'professional_verification_success',
                'chat_session_start',
                'article_read_complete',
                'consent_form_download',
              ],
            },
          },
        },
      });

      const data = this.processReportData(response);
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('GA4 conversion events error:', error);
      return { dimensions: [], metrics: [], rows: [] };
    }
  }

  // Get user demographics
  async getUserDemographics(days: number = 7): Promise<ReportData> {
    const cacheKey = `demographics_${days}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const [response] = await this.client.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: format(subDays(new Date(), days - 1), 'yyyy-MM-dd'),
            endDate: 'today',
          },
        ],
        dimensions: [
          { name: 'country' },
          { name: 'city' },
          { name: 'deviceCategory' },
        ],
        metrics: [
          { name: 'totalUsers' },
          { name: 'sessions' },
          { name: 'engagementRate' },
        ],
        orderBys: [
          {
            metric: { metricName: 'totalUsers' },
            desc: true,
          },
        ],
        limit: 20,
      });

      const data = this.processReportData(response);
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('GA4 user demographics error:', error);
      return { dimensions: [], metrics: [], rows: [] };
    }
  }

  // Get custom event tracking data
  async getCustomEvents(eventName: string, days: number = 7): Promise<ReportData> {
    const cacheKey = `custom_${eventName}_${days}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const [response] = await this.client.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: format(subDays(new Date(), days - 1), 'yyyy-MM-dd'),
            endDate: 'today',
          },
        ],
        dimensions: [
          { name: 'eventName' },
          { name: 'customEvent:event_category' },
          { name: 'customEvent:event_label' },
        ],
        metrics: [
          { name: 'eventCount' },
          { name: 'eventValue' },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: {
              value: eventName,
            },
          },
        },
      });

      const data = this.processReportData(response);
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('GA4 custom events error:', error);
      return { dimensions: [], metrics: [], rows: [] };
    }
  }

  // Process real-time data response
  private processRealtimeData(response: any): RealtimeData {
    // Calculate total active users from all rows
    let totalActiveUsers = 0;
    const usersByPage: any[] = [];
    const usersBySource: any[] = [];
    const recentEvents: any[] = [];

    // Process rows to categorize data
    response.rows?.forEach((row: any) => {
      const eventName = row.dimensionValues[0]?.value;
      const page = row.dimensionValues[1]?.value;
      const platform = row.dimensionValues[2]?.value;  // Changed from source to platform
      const users = parseInt(row.metricValues[0]?.value || '0');
      const eventCount = parseInt(row.metricValues[1]?.value || '0');

      // Sum up active users
      totalActiveUsers = Math.max(totalActiveUsers, users);

      if (page && users > 0) {
        const existing = usersByPage.find(p => p.page === page);
        if (existing) {
          existing.users += users;
        } else {
          usersByPage.push({ page, users });
        }
      }

      // Group by platform instead of source
      if (platform && users > 0) {
        const existing = usersBySource.find(s => s.source === platform);
        if (existing) {
          existing.users += users;
        } else {
          usersBySource.push({ source: platform, users });
        }
      }

      if (eventName && eventCount > 0) {
        recentEvents.push({
          eventName,
          count: eventCount,
          page: page || undefined,
        });
      }
    });

    // Sort and limit results
    usersByPage.sort((a, b) => b.users - a.users);
    usersBySource.sort((a, b) => b.users - a.users);
    recentEvents.sort((a, b) => b.count - a.count);

    return {
      activeUsers: totalActiveUsers,
      usersByPage: usersByPage.slice(0, 10),
      usersBySource: usersBySource.slice(0, 5),
      recentEvents: recentEvents.slice(0, 10),
    };
  }

  // Process standard report data
  private processReportData(response: any): ReportData {
    const dimensions = response.dimensionHeaders?.map((h: any) => h.name) || [];
    const metrics = response.metricHeaders?.map((h: any) => h.name) || [];
    
    const rows = response.rows?.map((row: any) => ({
      dimensionValues: row.dimensionValues?.map((v: any) => v.value) || [],
      metricValues: row.metricValues?.map((v: any) => {
        const value = v.value;
        // Try to parse as number if possible
        const numValue = parseFloat(value);
        return isNaN(numValue) ? value : numValue;
      }) || [],
    })) || [];

    return { dimensions, metrics, rows };
  }

  // Cache helpers
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

// Factory function to create GA4 client
export function createGA4Client(): GA4Client | null {
  const propertyId = process.env.GA4_PROPERTY_ID;
  
  if (!propertyId) {
    console.error('GA4_PROPERTY_ID not configured');
    return null;
  }

  // Check if we have service account credentials
  let credentials;
  if (process.env.GA4_SERVICE_ACCOUNT_KEY) {
    try {
      credentials = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_KEY);
      
      // Validate required fields
      const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
      const missingFields = requiredFields.filter(field => !credentials[field]);
      
      if (missingFields.length > 0) {
        console.error('GA4_SERVICE_ACCOUNT_KEY missing required fields:', missingFields);
        return null;
      }
    } catch (error) {
      console.error('Failed to parse GA4_SERVICE_ACCOUNT_KEY:', error);
      return null;
    }
  }

  console.log('Creating GA4 client with:');
  console.log('- Property ID:', propertyId);
  console.log('- Credentials:', credentials ? 'Service Account' : 'Default (ADC)');
  
  return new GA4Client({
    propertyId,
    credentials,
  });
}

export type { GA4Client, RealtimeData, ReportData };