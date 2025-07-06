'use client'

import { ReactNode } from 'react'
import { CSRFProvider } from '@/components/providers/csrf-provider'

export function AdminClientLayout({ children }: { children: ReactNode }) {
  return (
    <CSRFProvider>
      {children}
    </CSRFProvider>
  )
}