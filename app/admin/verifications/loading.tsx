import { Skeleton } from '@/components/ui/skeleton'

export default function AdminVerificationsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <Skeleton className="h-8 w-48" />

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-10 w-16" />
          </div>
        ))}
      </div>

      {/* Verifications list skeleton */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}