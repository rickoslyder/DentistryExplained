import { DentistSkeleton } from '@/components/loading/dentist-skeleton'

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <DentistSkeleton.Title />
      </div>

      {/* Search skeleton */}
      <div className="mb-8">
        <DentistSkeleton.Search />
      </div>

      {/* Results skeleton */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <DentistSkeleton.Card key={i} />
        ))}
      </div>
    </div>
  )
}
