"use client"

import type React from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { GlossaryProvider } from "@/contexts/glossary-provider"

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
        <GlossaryProvider>
          {children}
        </GlossaryProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
