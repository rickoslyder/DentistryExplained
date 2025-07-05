import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { GoogleTagManager, GoogleAnalytics, GoogleTagManagerNoscript } from "@/components/analytics/google-tag-manager"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Dentistry Explained - UK Dental Education Platform",
  description:
    "Comprehensive dental education platform providing evidence-based dental information to patients and professionals.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <GoogleTagManager />
          <GoogleAnalytics />
        </head>
        <body className={inter.className} suppressHydrationWarning>
          <GoogleTagManagerNoscript />
          <Providers>
            {children}
            <Toaster />
            <SpeedInsights />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
