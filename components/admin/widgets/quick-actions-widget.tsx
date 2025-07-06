'use client'

import { WidgetWrapper } from './widget-wrapper'
import type { WidgetComponentProps } from '@/lib/widgets/types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Upload,
  BarChart,
  Users,
  Settings,
  Download,
  Search,
  FolderOpen,
  MessageSquare
} from 'lucide-react'

interface QuickAction {
  label: string
  icon: any
  href?: string
  onClick?: () => void
  color: string
}

export function QuickActionsWidget({ id, config, isEditing, onRemove }: WidgetComponentProps) {
  const router = useRouter()

  const actions: QuickAction[] = [
    {
      label: 'New Article',
      icon: Plus,
      href: '/admin/articles/new',
      color: 'text-green-600',
    },
    {
      label: 'Import Articles',
      icon: Upload,
      onClick: () => {
        // This would open the import dialog
        // For now, navigate to articles page
        router.push('/admin/articles')
      },
      color: 'text-blue-600',
    },
    {
      label: 'Analytics',
      icon: BarChart,
      href: '/admin/analytics',
      color: 'text-purple-600',
    },
    {
      label: 'Manage Users',
      icon: Users,
      href: '/admin/users',
      color: 'text-orange-600',
    },
    {
      label: 'Categories',
      icon: FolderOpen,
      href: '/admin/categories',
      color: 'text-pink-600',
    },
    {
      label: 'Comments',
      icon: MessageSquare,
      href: '/admin/comments',
      color: 'text-yellow-600',
    },
    {
      label: 'Advanced Search',
      icon: Search,
      href: '/admin/search',
      color: 'text-indigo-600',
    },
    {
      label: 'Settings',
      icon: Settings,
      href: '/admin/settings',
      color: 'text-gray-600',
    },
  ]

  const handleAction = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick()
    } else if (action.href) {
      router.push(action.href)
    }
  }

  return (
    <WidgetWrapper
      title={config.title}
      isEditing={isEditing}
      onRemove={onRemove}
    >
      <div className="grid grid-cols-4 gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon
          const Component = action.href ? Link : 'button'
          
          return (
            <Component
              key={index}
              href={action.href || '#'}
              onClick={action.href ? undefined : () => handleAction(action)}
              className="block"
            >
              <Button
                variant="outline"
                className="w-full h-auto flex-col py-3 px-2 hover:bg-gray-50"
                asChild={!!action.href}
              >
                <div>
                  <Icon className={`h-5 w-5 mb-1 ${action.color}`} />
                  <span className="text-xs font-medium">{action.label}</span>
                </div>
              </Button>
            </Component>
          )
        })}
      </div>
    </WidgetWrapper>
  )
}