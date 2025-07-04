import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function DentistCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center">
            <Skeleton className="w-4 h-4 mr-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center">
            <Skeleton className="w-4 h-4 mr-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center">
            <Skeleton className="w-4 h-4 mr-2" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="flex gap-4 mt-4 pt-4 border-t">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </CardContent>
    </Card>
  )
}

export function DentistListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <DentistCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function FindDentistSkeleton() {
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Search sidebar skeleton */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results skeleton */}
      <div className="lg:col-span-2">
        <div className="mb-4 flex justify-between items-center">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <DentistListSkeleton />
      </div>
    </div>
  )
}