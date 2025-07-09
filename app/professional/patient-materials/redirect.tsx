"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PatientMaterialsRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/professional/resources/patient-education')
  }, [router])
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Redirecting...</h2>
        <p className="text-gray-600">Taking you to Patient Education Materials</p>
      </div>
    </div>
  )
}