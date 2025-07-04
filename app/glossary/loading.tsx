import { Skeleton } from '@/components/ui/skeleton'

export default function GlossaryLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-6 w-96" />
      </div>

      {/* Search skeleton */}
      <div className="mb-8">
        <Skeleton className="h-12 w-full max-w-md" />
      </div>

      {/* Alphabet filter skeleton */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[...Array(26)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-10" />
        ))}
      </div>

      {/* Terms grid skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  )
}