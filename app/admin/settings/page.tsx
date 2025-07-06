import { SettingsManagerWrapper } from '@/components/admin/settings-manager-wrapper'

export const dynamic = 'force-dynamic'


export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your platform settings</p>
      </div>
      
      <SettingsManagerWrapper />
    </div>
  )
}