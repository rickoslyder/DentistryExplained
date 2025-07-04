import { Skeleton } from '@/components/ui/skeleton'

export default function TopicsLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-lg border">
              {/* Color bar */}
              <Skeleton className="h-2 w-full" />
              
              <div className="p-6">
                {/* Header */}
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-5 w-full mb-4" />
                
                {/* Article count */}
                <Skeleton className="h-4 w-24 mb-6" />
                
                {/* Articles list */}
                <div className="space-y-3">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="p-3">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* View all link */}
                <Skeleton className="h-10 w-full mt-4" />
              </div>
            </div>
          ))}
        </div>

        {/* Stats section skeleton */}
        <div className="mt-16 bg-gray-50 rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-8 w-16 mx-auto mb-2" />
                <Skeleton className="h-5 w-24 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}