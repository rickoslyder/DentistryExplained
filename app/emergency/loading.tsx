import { Skeleton } from '@/components/ui/skeleton'

export default function EmergencyLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Emergency banner skeleton */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-3/4" />
      </div>

      {/* Emergency scenarios skeleton */}
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>

      {/* Contact info skeleton */}
      <div className="bg-gray-50 rounded-lg p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-56" />
        </div>
      </div>
    </div>
  )
}