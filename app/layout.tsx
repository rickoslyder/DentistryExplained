import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { Providers } from "@/components/providers"
import { ChatProvider } from "@/components/chat/chat-provider"
import { Toaster } from "@/components/ui/toaster"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { GoogleTagManager, GoogleAnalytics, GoogleTagManagerNoscript } from "@/components/analytics/google-tag-manager"
import { ErrorReporterInit } from "@/components/error-reporter-init"
import { URLParameterHandler } from "@/components/url-parameter-handler"

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
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/onboarding"
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <GoogleTagManager />
          <GoogleAnalytics />
          <link rel="manifest" href="/manifest.json" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Dental Emergency" />
          <link rel="apple-touch-icon" href="/icon-192x192.png" />
          <meta name="theme-color" content="#0066CC" />
        </head>
        <body className={inter.className} suppressHydrationWarning>
          <GoogleTagManagerNoscript />
          <Providers>
            <ChatProvider>
              <ErrorReporterInit />
              {/* <URLParameterHandler /> */}
              {children}
              <Toaster />
              <SpeedInsights />
            </ChatProvider>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
