import { registerWidgets } from '@/lib/widgets/registry'
import { StatsWidget } from './stats-widget'
import { RecentActivityWidget } from './recent-activity-widget'
import { QuickActionsWidget } from './quick-actions-widget'
import { ContentStatusWidget } from './content-status-widget'
import { UserGrowthWidget } from './user-growth-widget'
import { 
  BarChart3, 
  Activity, 
  Zap, 
  PieChart, 
  TrendingUp 
} from 'lucide-react'

// Register all available widgets
export function registerCoreWidgets() {
  registerWidgets([
    {
      type: 'stats',
      name: 'Stats Overview',
      description: 'Display key platform metrics',
      icon: BarChart3,
      component: StatsWidget,
      defaultConfig: {
        title: 'Platform Stats',
        w: 6,
        h: 4,
        minW: 4,
        minH: 3,
      },
    },
    {
      type: 'recent-activity',
      name: 'Recent Activity',
      description: 'Show latest platform activity',
      icon: Activity,
      component: RecentActivityWidget,
      defaultConfig: {
        title: 'Recent Activity',
        w: 6,
        h: 6,
        minW: 4,
        minH: 4,
      },
    },
    {
      type: 'quick-actions',
      name: 'Quick Actions',
      description: 'Common admin task shortcuts',
      icon: Zap,
      component: QuickActionsWidget,
      defaultConfig: {
        title: 'Quick Actions',
        w: 4,
        h: 4,
        minW: 3,
        minH: 3,
      },
    },
    {
      type: 'content-status',
      name: 'Content Status',
      description: 'Article status breakdown',
      icon: PieChart,
      component: ContentStatusWidget,
      defaultConfig: {
        title: 'Content Status',
        w: 4,
        h: 6,
        minW: 3,
        minH: 5,
      },
    },
    {
      type: 'user-growth',
      name: 'User Growth',
      description: 'User registration trends',
      icon: TrendingUp,
      component: UserGrowthWidget,
      defaultConfig: {
        title: 'User Growth',
        w: 8,
        h: 7,
        minW: 6,
        minH: 5,
      },
    },
  ])
}

// Export all widgets for direct import if needed
export { StatsWidget } from './stats-widget'
export { RecentActivityWidget } from './recent-activity-widget'
export { QuickActionsWidget } from './quick-actions-widget'
export { ContentStatusWidget } from './content-status-widget'
export { UserGrowthWidget } from './user-growth-widget'