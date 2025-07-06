"use client"

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'

export function useIsAdmin() {
  const { user, isLoaded } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkAdminStatus() {
      if (!isLoaded || !user) {
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      try {
        // Check user's public metadata first (faster)
        const userType = user.publicMetadata?.userType
        const userRole = user.publicMetadata?.role
        
        if (userType === 'professional' && (userRole === 'admin' || userRole === 'editor')) {
          setIsAdmin(true)
          setIsLoading(false)
          return
        }

        // If not in metadata, check database
        const response = await fetch('/api/admin/check')
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.isAdmin === true)
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [user, isLoaded])

  return { isAdmin, isLoading }
}