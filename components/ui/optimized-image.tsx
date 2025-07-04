'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoad?: () => void
  aspectRatio?: string // For responsive images (e.g., "16/9", "4/3", "1/1")
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  aspectRatio
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Default fallback image
  const fallbackSrc = '/placeholder.svg'

  // Calculate sizes for responsive images
  const defaultSizes = fill 
    ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
    : sizes

  if (hasError) {
    return (
      <div 
        className={cn(
          'bg-gray-100 flex items-center justify-center',
          fill && 'h-full w-full',
          className
        )}
        style={{
          ...(aspectRatio && { aspectRatio }),
          ...(!aspectRatio && !fill && width && height && { width, height })
        }}
      >
        <img 
          src={fallbackSrc} 
          alt={alt}
          className="w-1/2 h-1/2 object-contain opacity-50"
        />
      </div>
    )
  }

  const containerClasses = cn(
    'relative overflow-hidden',
    isLoading && 'animate-pulse bg-gray-200',
    className
  )

  if (fill || aspectRatio) {
    return (
      <div 
        className={cn(containerClasses, fill && 'h-full w-full')}
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={defaultSizes}
          quality={quality}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          className={cn(
            'object-cover',
            isLoading && 'opacity-0',
            !isLoading && 'opacity-100 transition-opacity duration-300'
          )}
          onLoad={() => {
            setIsLoading(false)
            onLoad?.()
          }}
          onError={() => {
            setHasError(true)
            setIsLoading(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className={containerClasses} style={{ width, height }}>
      <Image
        src={src}
        alt={alt}
        width={width || 400}
        height={height || 300}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        className={cn(
          isLoading && 'opacity-0',
          !isLoading && 'opacity-100 transition-opacity duration-300'
        )}
        onLoad={() => {
          setIsLoading(false)
          onLoad?.()
        }}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
        }}
      />
    </div>
  )
}

// Avatar component for user images
interface AvatarImageProps {
  src?: string | null
  alt: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64
}

export function AvatarImage({ 
  src, 
  alt, 
  size = 'md',
  className 
}: AvatarImageProps) {
  const dimension = sizeMap[size]
  
  if (!src) {
    return (
      <div 
        className={cn(
          'rounded-full bg-gray-200 flex items-center justify-center',
          className
        )}
        style={{ width: dimension, height: dimension }}
      >
        <img 
          src="/placeholder-user.svg" 
          alt={alt}
          className="w-full h-full object-cover rounded-full"
        />
      </div>
    )
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={dimension}
      height={dimension}
      className={cn('rounded-full', className)}
      quality={90}
    />
  )
}