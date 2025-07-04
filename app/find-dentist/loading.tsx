import { FindDentistSkeleton } from '@/components/loading/dentist-skeleton'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FindDentistSkeleton />
      </div>
      <Footer />
    </div>
  )
}
