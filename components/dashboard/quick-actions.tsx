"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquareText, MapPin, AlertCircle, BookOpen, Calendar, Zap } from "lucide-react"
import Link from "next/link"

interface QuickActionsProps {
  userType?: "patient" | "professional"
}

export function QuickActions({ userType = "patient" }: QuickActionsProps) {
  const actions = userType === "patient" ? [
    {
      icon: MessageSquareText,
      label: "Ask AI Assistant",
      description: "Get instant answers",
      href: "/?openChat=true",
      color: "text-blue-500"
    },
    {
      icon: MapPin,
      label: "Find a Dentist",
      description: "Near your location",
      href: "/find-dentist",
      color: "text-green-500"
    },
    {
      icon: AlertCircle,
      label: "Emergency Guide",
      description: "Urgent dental help",
      href: "/emergency",
      color: "text-red-500"
    },
    {
      icon: BookOpen,
      label: "Browse Topics",
      description: "Explore dental health",
      href: "/topics",
      color: "text-purple-500"
    }
  ] : [
    {
      icon: MessageSquareText,
      label: "Patient Materials",
      description: "Educational resources",
      href: "/professional/patient-materials",
      color: "text-blue-500"
    },
    {
      icon: Calendar,
      label: "Practice Profile",
      description: "Update your listing",
      href: "/professional/practice",
      color: "text-green-500"
    },
    {
      icon: BookOpen,
      label: "Consent Forms",
      description: "Download templates",
      href: "/professional/consent-forms",
      color: "text-purple-500"
    },
    {
      icon: Zap,
      label: "Resources",
      description: "Professional tools",
      href: "/professional/resources",
      color: "text-orange-500"
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Frequently used features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link key={index} href={action.href}>
                <Button
                  variant="outline"
                  className="w-full h-auto p-4 flex flex-col items-center space-y-2 hover:border-primary/50 hover:bg-gray-50"
                >
                  <Icon className={`w-6 h-6 ${action.color}`} />
                  <div className="text-center">
                    <div className="font-medium text-sm">{action.label}</div>
                    <div className="text-xs text-gray-500">{action.description}</div>
                  </div>
                </Button>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}