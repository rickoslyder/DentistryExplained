import { Skeleton } from '@/components/ui/skeleton'

export default function AdminArticlesLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg shadow">
        {/* Table header */}
        <div className="border-b p-4">
          <div className="grid grid-cols-5 gap-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        
        {/* Table rows */}
        {[...Array(10)].map((_, i) => (
          <div key={i} className="border-b p-4">
            <div className="grid grid-cols-5 gap-4 items-center">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-14" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}