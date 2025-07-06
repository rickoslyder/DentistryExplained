import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { MediaManager } from '@/components/admin/media-manager'

export const dynamic = 'force-dynamic'

interface SearchParams {
  page?: string
  search?: string
  type?: string
}

interface PageProps {
  searchParams: SearchParams
}

async function getMediaFiles(page: number = 1, search?: string, type?: string) {
  const supabase = await createServerSupabaseClient()
  const ITEMS_PER_PAGE = 20
  const offset = (page - 1) * ITEMS_PER_PAGE
  
  // First ensure the media bucket exists
  const { data: buckets } = await supabase.storage.listBuckets()
  const mediaBucketExists = buckets?.some(b => b.name === 'media')
  
  if (!mediaBucketExists) {
    // Create the media bucket if it doesn't exist
    const { error: createError } = await supabase.storage.createBucket('media', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    })
    
    if (createError) {
      console.error('Error creating media bucket:', createError)
    }
  }
  
  // Get media files from the bucket
  const { data: files, error } = await supabase.storage
    .from('media')
    .list('', {
      limit: ITEMS_PER_PAGE,
      offset,
      sortBy: { column: 'created_at', order: 'desc' }
    })
  
  if (error) {
    console.error('Error fetching media files:', error)
    return { files: [], totalCount: 0 }
  }
  
  // Filter files based on search and type
  let filteredFiles = files || []
  
  if (search) {
    filteredFiles = filteredFiles.filter(file => 
      file.name.toLowerCase().includes(search.toLowerCase())
    )
  }
  
  if (type && type !== 'all') {
    const typeMap: Record<string, string[]> = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      document: ['application/pdf'],
    }
    
    const allowedTypes = typeMap[type] || []
    filteredFiles = filteredFiles.filter(file => {
      const mimeType = file.metadata?.mimetype || ''
      return allowedTypes.some(t => mimeType.includes(t))
    })
  }
  
  // Get public URLs for files
  const filesWithUrls = filteredFiles.map(file => {
    const { data } = supabase.storage
      .from('media')
      .getPublicUrl(file.name)
    
    return {
      ...file,
      url: data.publicUrl,
      type: file.metadata?.mimetype || 'unknown',
      size: file.metadata?.size || 0
    }
  })
  
  return {
    files: filesWithUrls,
    totalCount: filesWithUrls.length
  }
}

export default async function MediaPage({ searchParams }: PageProps) {
  const currentPage = parseInt(searchParams.page || '1')
  const { files, totalCount } = await getMediaFiles(
    currentPage,
    searchParams.search,
    searchParams.type
  )
  const totalPages = Math.ceil(totalCount / 20)
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
        <p className="text-gray-600 mt-1">Manage images and documents</p>
      </div>
      
      <MediaManager 
        files={files}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
      />
    </div>
  )
}