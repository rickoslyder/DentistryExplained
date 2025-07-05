import { cn } from '@/lib/utils'
import { AlertTriangle, AlertCircle, Info, Siren } from 'lucide-react'

interface SeverityBadgeProps {
  severity: 'critical' | 'high' | 'medium' | 'low'
  className?: string
  showPulse?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function SeverityBadge({ 
  severity, 
  className,
  showPulse = true,
  size = 'md' 
}: SeverityBadgeProps) {
  const config = {
    critical: {
      icon: Siren,
      label: 'Seek Immediate Care',
      bgColor: 'bg-red-100',
      textColor: 'text-red-900',
      borderColor: 'border-red-500',
      iconColor: 'text-red-600',
      pulseColor: 'animate-pulse-red',
    },
    high: {
      icon: AlertTriangle,
      label: 'Urgent',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-900',
      borderColor: 'border-orange-500',
      iconColor: 'text-orange-600',
      pulseColor: 'animate-pulse-orange',
    },
    medium: {
      icon: AlertCircle,
      label: 'Soon',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-900',
      borderColor: 'border-yellow-500',
      iconColor: 'text-yellow-600',
      pulseColor: '',
    },
    low: {
      icon: Info,
      label: 'When Possible',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-900',
      borderColor: 'border-blue-500',
      iconColor: 'text-blue-600',
      pulseColor: '',
    },
  }

  const {
    icon: Icon,
    label,
    bgColor,
    textColor,
    borderColor,
    iconColor,
    pulseColor,
  } = config[severity]

  const sizeClasses = {
    sm: {
      badge: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
    },
    md: {
      badge: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
    },
    lg: {
      badge: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
    },
  }

  const { badge: badgeSize, icon: iconSize } = sizeClasses[size]

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-full font-semibold border-2',
          bgColor,
          textColor,
          borderColor,
          badgeSize,
          showPulse && pulseColor && severity === 'critical' && 'animate-pulse',
          className
        )}
      >
        <Icon className={cn(iconSize, iconColor)} />
        <span>{label}</span>
      </div>
      
      {/* Pulsing ring for critical severity */}
      {showPulse && severity === 'critical' && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-75" />
          <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping animation-delay-200 opacity-50" />
        </>
      )}
    </div>
  )
}

// Add custom animation keyframes to your global CSS
export const severityAnimations = `
  @keyframes pulse-red {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.05);
    }
  }

  @keyframes pulse-orange {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  .animate-pulse-red {
    animation: pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .animate-pulse-orange {
    animation: pulse-orange 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .animation-delay-200 {
    animation-delay: 200ms;
  }
`