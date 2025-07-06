'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useCSRF } from '@/hooks/use-csrf'

interface CSRFContextType {
  csrfToken: string | null
  loading: boolean
  getHeaders: (additionalHeaders?: HeadersInit) => HeadersInit
  secureRequest: (url: string, options?: RequestInit) => Promise<Response>
  refreshToken: () => Promise<void>
}

const CSRFContext = createContext<CSRFContextType | null>(null)

export function CSRFProvider({ children }: { children: ReactNode }) {
  const csrf = useCSRF()

  return (
    <CSRFContext.Provider value={csrf}>
      {children}
    </CSRFContext.Provider>
  )
}

export function useCSRFContext() {
  const context = useContext(CSRFContext)
  if (!context) {
    throw new Error('useCSRFContext must be used within a CSRFProvider')
  }
  return context
}