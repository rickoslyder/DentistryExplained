"use client"

import type React from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { GlossaryProvider } from "@/contexts/glossary-provider"
import { ConsentProvider } from "@/components/consent/consent-provider"
import { AnalyticsProvider } from "@/components/analytics/analytics-provider"
import { PostHogProvider } from "@/components/analytics/posthog-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => 
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="light" 
        enableSystem={false}
        disableTransitionOnChange
        storageKey="dentistry-theme"
      >
        <ConsentProvider>
          <AnalyticsProvider>
            <PostHogProvider>
              <GlossaryProvider>
                {children}
              </GlossaryProvider>
            </PostHogProvider>
          </AnalyticsProvider>
        </ConsentProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
