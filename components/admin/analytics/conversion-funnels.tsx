'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, TrendingDown, Users, Target, Filter, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell } from 'recharts';
import { format } from 'date-fns';

interface FunnelStep {
  name: string;
  value: number;
  percentage: number;
  dropoff?: number;
}

interface ConversionFunnel {
  name: string;
  steps: FunnelStep[];
  totalConversions: number;
  conversionRate: number;
  avgTimeToConvert: number;
  change: number;
}

const COLORS = ['#0066CC', '#0052A3', '#003D7A', '#002952', '#001429'];

export function ConversionFunnels() {
  const [selectedFunnel, setSelectedFunnel] = useState<string>('professional_signup');
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [funnels, setFunnels] = useState<Record<string, ConversionFunnel>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchFunnelData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analytics/funnel?funnel=${selectedFunnel}&range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setFunnels(prev => ({
          ...prev,
          [selectedFunnel]: data.funnel
        }));
      }
    } catch (error) {
      console.error('Failed to fetch funnel data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFunnelData();
  }, [selectedFunnel, timeRange]);

  // Mock data for demonstration
  const mockFunnels: Record<string, ConversionFunnel> = {
    professional_signup: {
      name: 'Professional Signup',
      totalConversions: 127,
      conversionRate: 24.3,
      avgTimeToConvert: 2.8,
      change: 15.2,
      steps: [
        { name: 'Landing Page Visit', value: 523, percentage: 100 },
        { name: 'Clicked Get Started', value: 342, percentage: 65.4, dropoff: 34.6 },
        { name: 'Created Account', value: 198, percentage: 37.9, dropoff: 42.1 },
        { name: 'Started Verification', value: 156, percentage: 29.8, dropoff: 21.2 },
        { name: 'Submitted Documents', value: 142, percentage: 27.2, dropoff: 9.0 },
        { name: 'Verified & Active', value: 127, percentage: 24.3, dropoff: 10.6 },
      ]
    },
    patient_engagement: {
      name: 'Patient Engagement',
      totalConversions: 892,
      conversionRate: 42.1,
      avgTimeToConvert: 0.5,
      change: 8.3,
      steps: [
        { name: 'Article View', value: 2118, percentage: 100 },
        { name: 'Scrolled 50%+', value: 1694, percentage: 80.0, dropoff: 20.0 },
        { name: 'Clicked CTA', value: 1059, percentage: 50.0, dropoff: 37.5 },
        { name: 'Started Chat', value: 892, percentage: 42.1, dropoff: 15.8 },
      ]
    },
    content_creation: {
      name: 'Content Creation',
      totalConversions: 45,
      conversionRate: 15.0,
      avgTimeToConvert: 4.2,
      change: -5.2,
      steps: [
        { name: 'Admin Dashboard', value: 300, percentage: 100 },
        { name: 'Clicked New Article', value: 180, percentage: 60.0, dropoff: 40.0 },
        { name: 'Started Writing', value: 120, percentage: 40.0, dropoff: 33.3 },
        { name: 'Saved Draft', value: 87, percentage: 29.0, dropoff: 27.5 },
        { name: 'Published', value: 45, percentage: 15.0, dropoff: 48.3 },
      ]
    },
    emergency_guide: {
      name: 'Emergency Guide',
      totalConversions: 234,
      conversionRate: 78.0,
      avgTimeToConvert: 0.1,
      change: 22.4,
      steps: [
        { name: 'Emergency Page', value: 300, percentage: 100 },
        { name: 'Selected Symptom', value: 276, percentage: 92.0, dropoff: 8.0 },
        { name: 'Viewed Guide', value: 258, percentage: 86.0, dropoff: 6.5 },
        { name: 'Found Dentist', value: 234, percentage: 78.0, dropoff: 9.3 },
      ]
    }
  };

  const currentFunnel = funnels[selectedFunnel] || mockFunnels[selectedFunnel];

  const exportFunnelData = () => {
    const csvContent = [
      ['Step', 'Visitors', 'Percentage', 'Dropoff Rate'],
      ...currentFunnel.steps.map(step => [
        step.name,
        step.value,
        `${step.percentage}%`,
        step.dropoff ? `${step.dropoff}%` : 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFunnel}_funnel_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4">
          <Select value={selectedFunnel} onValueChange={setSelectedFunnel}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select funnel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional_signup">Professional Signup</SelectItem>
              <SelectItem value="patient_engagement">Patient Engagement</SelectItem>
              <SelectItem value="content_creation">Content Creation</SelectItem>
              <SelectItem value="emergency_guide">Emergency Guide</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" onClick={exportFunnelData}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentFunnel.totalConversions}</div>
            <div className="flex items-center mt-1">
              {currentFunnel.change >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm ${currentFunnel.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(currentFunnel.change)}%
              </span>
              <span className="text-sm text-muted-foreground ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentFunnel.conversionRate}%</div>
            <Progress value={currentFunnel.conversionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time to Convert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentFunnel.avgTimeToConvert}</div>
            <p className="text-sm text-muted-foreground mt-1">days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Biggest Drop-off</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...currentFunnel.steps.filter(s => s.dropoff).map(s => s.dropoff || 0)).toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {currentFunnel.steps.find(s => s.dropoff === Math.max(...currentFunnel.steps.filter(s => s.dropoff).map(s => s.dropoff || 0)))?.name.split(' ').slice(0, 2).join(' ')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>
            Step-by-step conversion analysis for {currentFunnel.name.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={currentFunnel.steps}
                layout="horizontal"
                margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip 
                  formatter={(value: any) => [`${value} users`, 'Users']}
                  labelFormatter={(label) => `Step: ${label}`}
                />
                <Bar dataKey="value" fill="#0066CC">
                  <LabelList dataKey="percentage" position="right" formatter={(value: any) => `${value}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Step Details */}
          <div className="mt-6 space-y-3">
            {currentFunnel.steps.map((step, index) => (
              <div key={step.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 h-8 p-0 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">{step.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {step.value} users ({step.percentage}%)
                    </p>
                  </div>
                </div>
                {step.dropoff && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">-{step.dropoff}%</p>
                    <p className="text-xs text-muted-foreground">drop-off</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Opportunities</CardTitle>
          <CardDescription>AI-powered suggestions to improve conversion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentFunnel.steps
              .filter(s => s.dropoff && s.dropoff > 20)
              .map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-yellow-200 bg-yellow-50">
                  <Target className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">High drop-off at "{step.name}"</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.dropoff}% of users are leaving at this step. Consider:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {getOptimizationSuggestions(step.name).map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-yellow-600">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getOptimizationSuggestions(stepName: string): string[] {
  const suggestions: Record<string, string[]> = {
    'Clicked Get Started': [
      'Make CTA button more prominent',
      'Add trust signals near the button',
      'A/B test button copy and color'
    ],
    'Created Account': [
      'Simplify the registration form',
      'Add social login options',
      'Show value proposition during signup'
    ],
    'Started Verification': [
      'Clarify verification requirements upfront',
      'Add progress indicators',
      'Provide help tooltips'
    ],
    'Submitted Documents': [
      'Simplify document upload process',
      'Accept more file formats',
      'Add example documents'
    ],
    'Started Writing': [
      'Provide content templates',
      'Add AI writing assistance',
      'Show successful examples'
    ],
    'Saved Draft': [
      'Add auto-save functionality',
      'Send reminder emails for drafts',
      'Simplify publishing requirements'
    ]
  };

  return suggestions[stepName] || [
    'Analyze user behavior at this step',
    'Conduct user interviews',
    'Run A/B tests on this step'
  ];
}