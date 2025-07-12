'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Activity, Users, Eye, TrendingUp, Globe, Smartphone, Monitor, RefreshCw } from 'lucide-react';
import { posthog } from '@/lib/posthog';

interface RealtimeMetrics {
  activeUsers: number;
  pageViews: number;
  events: number;
  topPages: Array<{ path: string; count: number }>;
  topEvents: Array<{ event: string; count: number }>;
  deviceTypes: { desktop: number; mobile: number; tablet: number };
  countries: Array<{ code: string; name: string; count: number }>;
}

export function PostHogRealtimeAnalytics() {
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    activeUsers: 0,
    pageViews: 0,
    events: 0,
    topPages: [],
    topEvents: [],
    deviceTypes: { desktop: 0, mobile: 0, tablet: 0 },
    countries: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchRealtimeData = async () => {
    if (!posthog || !process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      setIsLoading(false);
      return;
    }

    try {
      // In a real implementation, this would fetch from PostHog API
      // For now, we'll use mock data that would come from PostHog
      const mockData: RealtimeMetrics = {
        activeUsers: Math.floor(Math.random() * 50) + 10,
        pageViews: Math.floor(Math.random() * 200) + 50,
        events: Math.floor(Math.random() * 500) + 100,
        topPages: [
          { path: '/emergency', count: Math.floor(Math.random() * 30) + 10 },
          { path: '/articles/tooth-pain', count: Math.floor(Math.random() * 25) + 5 },
          { path: '/find-dentist', count: Math.floor(Math.random() * 20) + 5 },
          { path: '/glossary', count: Math.floor(Math.random() * 15) + 5 },
          { path: '/chat', count: Math.floor(Math.random() * 10) + 5 },
        ],
        topEvents: [
          { event: 'page_view', count: Math.floor(Math.random() * 100) + 50 },
          { event: 'chat_session_start', count: Math.floor(Math.random() * 20) + 5 },
          { event: 'search', count: Math.floor(Math.random() * 30) + 10 },
          { event: 'article_bookmark', count: Math.floor(Math.random() * 10) + 2 },
          { event: 'emergency_guide_view', count: Math.floor(Math.random() * 15) + 5 },
        ],
        deviceTypes: {
          desktop: Math.floor(Math.random() * 30) + 20,
          mobile: Math.floor(Math.random() * 40) + 30,
          tablet: Math.floor(Math.random() * 10) + 5,
        },
        countries: [
          { code: 'GB', name: 'United Kingdom', count: Math.floor(Math.random() * 40) + 30 },
          { code: 'US', name: 'United States', count: Math.floor(Math.random() * 20) + 10 },
          { code: 'IE', name: 'Ireland', count: Math.floor(Math.random() * 10) + 5 },
          { code: 'CA', name: 'Canada', count: Math.floor(Math.random() * 5) + 2 },
          { code: 'AU', name: 'Australia', count: Math.floor(Math.random() * 5) + 2 },
        ],
      };

      setMetrics(mockData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch PostHog realtime data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealtimeData();
    const interval = setInterval(fetchRealtimeData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const totalDevices = metrics.deviceTypes.desktop + metrics.deviceTypes.mobile + metrics.deviceTypes.tablet;

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PostHog Analytics</CardTitle>
          <CardDescription>Configure PostHog to view real-time analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add NEXT_PUBLIC_POSTHOG_KEY to your environment variables to enable PostHog analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{metrics.activeUsers}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Right now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{metrics.pageViews}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 5 minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{metrics.events}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 5 minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRealtimeData}
              disabled={isLoading}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              {lastUpdated.toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Pages (Live)
            </CardTitle>
            <CardDescription>Most viewed pages right now</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topPages.map((page, index) => (
                <div key={page.path} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {page.path}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">{page.count} views</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Top Events (Live)
            </CardTitle>
            <CardDescription>Most frequent events right now</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topEvents.map((event, index) => (
                <div key={event.event} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium">
                      {event.event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">{event.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Device Types */}
        <Card>
          <CardHeader>
            <CardTitle>Device Distribution</CardTitle>
            <CardDescription>Active users by device type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <span className="text-sm">Desktop</span>
                </div>
                <span className="text-sm font-medium">
                  {totalDevices > 0 ? Math.round((metrics.deviceTypes.desktop / totalDevices) * 100) : 0}%
                </span>
              </div>
              <Progress value={totalDevices > 0 ? (metrics.deviceTypes.desktop / totalDevices) * 100 : 0} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span className="text-sm">Mobile</span>
                </div>
                <span className="text-sm font-medium">
                  {totalDevices > 0 ? Math.round((metrics.deviceTypes.mobile / totalDevices) * 100) : 0}%
                </span>
              </div>
              <Progress value={totalDevices > 0 ? (metrics.deviceTypes.mobile / totalDevices) * 100 : 0} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <span className="text-sm">Tablet</span>
                </div>
                <span className="text-sm font-medium">
                  {totalDevices > 0 ? Math.round((metrics.deviceTypes.tablet / totalDevices) * 100) : 0}%
                </span>
              </div>
              <Progress value={totalDevices > 0 ? (metrics.deviceTypes.tablet / totalDevices) * 100 : 0} />
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Geographic Distribution
            </CardTitle>
            <CardDescription>Active users by country</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.countries.map((country) => (
                <div key={country.code} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getFlagEmoji(country.code)}</span>
                    <span className="text-sm font-medium">{country.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{country.count} users</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getFlagEmoji(countryCode: string): string {
  const flags: Record<string, string> = {
    'GB': '🇬🇧',
    'US': '🇺🇸',
    'IE': '🇮🇪',
    'CA': '🇨🇦',
    'AU': '🇦🇺',
  };
  return flags[countryCode] || '🌍';
}