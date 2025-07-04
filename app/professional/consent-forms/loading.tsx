import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-6 w-96" />
      </div>

      {/* Actions skeleton */}
      <div className="flex gap-4 mb-8">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Table header */}
        <div className="border-b p-4">
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        
        {/* Table rows */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-b p-4">
            <div className="grid grid-cols-4 gap-4 items-center">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
