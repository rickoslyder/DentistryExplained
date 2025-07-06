'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Users,
  Settings,
  BarChart,
  Image,
  MessageSquare,
  Shield,
  ArrowLeft,
  ScrollText,
  Search,
  Activity,
  Mail
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Articles', href: '/admin/articles', icon: FileText },
  { name: 'Advanced Search', href: '/admin/search', icon: Search },
  { name: 'Categories', href: '/admin/categories', icon: FolderOpen },
  { name: 'Media', href: '/admin/media', icon: Image },
  { name: 'Comments', href: '/admin/comments', icon: MessageSquare },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Email Templates', href: '/admin/email-templates', icon: Mail },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart },
  { name: 'Activity Logs', href: '/admin/activity', icon: ScrollText },
  { name: 'Monitoring', href: '/admin/monitoring', icon: Activity },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  
  return (
    <div className="w-64 bg-white shadow-sm h-screen sticky top-0">
      <div className="p-4">
        <div className="flex items-center mb-8">
          <Shield className="w-8 h-8 text-primary mr-3" />
          <div>
            <h2 className="text-lg font-semibold">Admin Panel</h2>
            <p className="text-sm text-gray-600">Content Management</p>
          </div>
        </div>
        
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        <div className="mt-8 pt-8 border-t">
          <Link
            href="/dashboard"
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-3" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}