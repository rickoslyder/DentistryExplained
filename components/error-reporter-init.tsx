'use client'

import { useEffect } from 'react'
import { errorReporter } from '@/lib/error-reporter'

export function ErrorReporterInit() {
  useEffect(() => {
    errorReporter.install()
  }, [])

  return null
}