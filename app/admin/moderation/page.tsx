import { Metadata } from 'next'
import { ModerationDashboard } from '@/components/admin/moderation/moderation-dashboard'

export const metadata: Metadata = {
  title: 'Content Moderation | Admin',
  description: 'Moderate user-generated content'
}

export default function ModerationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Content Moderation</h1>
      <ModerationDashboard />
    </div>
  )
}