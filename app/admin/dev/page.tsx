import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Code2, 
  TestTube, 
  BarChart3, 
  FileText,
  ArrowRight,
  AlertTriangle,
  Wrench
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dev Tools | Admin',
  description: 'Development and testing tools for admin panel',
}

const devTools = [
  {
    title: 'MDX Editor Test Suite',
    description: 'Test the MDX rich text editor with various edge cases and expressions',
    href: '/admin/dev/mdx-editor',
    icon: FileText,
    status: 'stable',
    features: [
      'Edge case testing',
      'MDX expression validation',
      'Error boundary testing',
      'Performance testing'
    ]
  },
  {
    title: 'Analytics Test',
    description: 'Real-time GA4 analytics testing and debugging',
    href: '/admin/dev/analytics-test',
    icon: TestTube,
    status: 'experimental',
    features: [
      'Real-time event tracking',
      'Custom event testing',
      'GA4 debug mode',
      'Event validation'
    ]
  },
  {
    title: 'Analytics Dashboard Test',
    description: 'Test analytics dashboard components and data visualization',
    href: '/admin/dev/analytics-dashboard',
    icon: BarChart3,
    status: 'experimental',
    features: [
      'Chart rendering tests',
      'Data aggregation testing',
      'Performance monitoring',
      'Widget interaction tests'
    ]
  }
]

export default function DevToolsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Development Tools</h1>
          <p className="text-gray-600 mt-1">Testing and debugging tools for admin features</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Development Only
        </Badge>
      </div>

      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg">Development Environment</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-orange-800">
            These tools are for development and testing purposes only. 
            They may modify data or trigger unexpected behaviors. 
            Use with caution in production environments.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {devTools.map((tool) => {
          const Icon = tool.icon
          return (
            <Card key={tool.href} className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-primary/10 rounded-lg w-fit">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge 
                    variant={tool.status === 'stable' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {tool.status}
                  </Badge>
                </div>
                <CardTitle className="mt-4">{tool.title}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Features:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {tool.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="h-1 w-1 bg-gray-400 rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href={tool.href}>
                    <Button className="w-full group">
                      Open Tool
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="bg-gray-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg">Adding New Dev Tools</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">
            To add a new development tool:
          </p>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Create a new directory under <code className="bg-gray-200 px-1 rounded">/app/admin/dev/your-tool</code></li>
            <li>Add your tool's page.tsx file</li>
            <li>Update this page to include your tool in the devTools array</li>
            <li>Consider adding appropriate warnings if the tool modifies data</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}