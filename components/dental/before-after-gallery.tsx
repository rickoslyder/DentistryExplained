'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { 
  ArrowLeftRight, 
  Eye, 
  EyeOff,
  ZoomIn,
  Info,
  Calendar,
  User
} from 'lucide-react'

export interface BeforeAfterImage {
  id: string
  beforeUrl: string
  afterUrl: string
  caption?: string
  procedure?: string
  duration?: string
  dentist?: string
  date?: string
  isPrivate?: boolean
}

interface BeforeAfterGalleryProps {
  images: BeforeAfterImage[]
  title?: string
  description?: string
  className?: string
  defaultBlurred?: boolean
  showPrivacyToggle?: boolean
}

export function BeforeAfterGallery({ 
  images, 
  title = "Treatment Results",
  description,
  className,
  defaultBlurred = true,
  showPrivacyToggle = true
}: BeforeAfterGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number>(0)
  const [viewMode, setViewMode] = useState<'side-by-side' | 'slider'>('side-by-side')
  const [sliderPosition, setSliderPosition] = useState([50])
  const [isBlurred, setIsBlurred] = useState(defaultBlurred)
  const [isZoomed, setIsZoomed] = useState(false)

  const currentImage = images[selectedImage]

  if (!currentImage) return null

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          
          {showPrivacyToggle && (
            <div className="flex items-center gap-2">
              <Switch
                id="privacy-mode"
                checked={!isBlurred}
                onCheckedChange={(checked) => setIsBlurred(!checked)}
              />
              <Label htmlFor="privacy-mode" className="text-sm">
                {isBlurred ? (
                  <span className="flex items-center gap-1">
                    <EyeOff className="h-3 w-3" />
                    Privacy mode
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Show details
                  </span>
                )}
              </Label>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* View Mode Toggle */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant={viewMode === 'side-by-side' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('side-by-side')}
          >
            Side by Side
          </Button>
          <Button
            variant={viewMode === 'slider' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('slider')}
          >
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Slider
          </Button>
        </div>

        {/* Image Display */}
        <div className="relative">
          {viewMode === 'side-by-side' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={currentImage.beforeUrl}
                    alt="Before treatment"
                    fill
                    className={cn(
                      "object-cover transition-all duration-300",
                      isBlurred && "blur-xl",
                      isZoomed && "scale-125"
                    )}
                  />
                  <Badge className="absolute top-2 left-2">Before</Badge>
                </div>
              </div>
              
              <div>
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={currentImage.afterUrl}
                    alt="After treatment"
                    fill
                    className={cn(
                      "object-cover transition-all duration-300",
                      isBlurred && "blur-xl",
                      isZoomed && "scale-125"
                    )}
                  />
                  <Badge className="absolute top-2 left-2" variant="default">After</Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
              <div className="relative w-full h-full">
                {/* Before Image */}
                <Image
                  src={currentImage.beforeUrl}
                  alt="Before treatment"
                  fill
                  className={cn(
                    "object-cover",
                    isBlurred && "blur-xl"
                  )}
                />
                
                {/* After Image with Clip */}
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - sliderPosition[0]}% 0 0)` }}
                >
                  <Image
                    src={currentImage.afterUrl}
                    alt="After treatment"
                    fill
                    className={cn(
                      "object-cover",
                      isBlurred && "blur-xl"
                    )}
                  />
                </div>
                
                {/* Slider Line */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                  style={{ left: `${sliderPosition[0]}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg">
                    <ArrowLeftRight className="h-4 w-4" />
                  </div>
                </div>
                
                {/* Labels */}
                <Badge className="absolute top-2 left-2">Before</Badge>
                <Badge className="absolute top-2 right-2" variant="default">After</Badge>
              </div>
              
              {/* Slider Control */}
              <div className="absolute bottom-4 left-4 right-4">
                <Slider
                  value={sliderPosition}
                  onValueChange={setSliderPosition}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          )}
          
          {/* Zoom Button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-2 right-2"
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {/* Image Details */}
        {currentImage.caption || currentImage.procedure || currentImage.duration || currentImage.dentist || currentImage.date ? (
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            {currentImage.procedure && (
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Procedure:</span>
                <span>{currentImage.procedure}</span>
              </div>
            )}
            
            {currentImage.duration && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Treatment Duration:</span>
                <span>{currentImage.duration}</span>
              </div>
            )}
            
            {currentImage.dentist && !isBlurred && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Dentist:</span>
                <span>{currentImage.dentist}</span>
              </div>
            )}
            
            {currentImage.date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Date:</span>
                <span>{currentImage.date}</span>
              </div>
            )}
            
            {currentImage.caption && (
              <p className="text-sm text-muted-foreground mt-2">{currentImage.caption}</p>
            )}
          </div>
        ) : null}

        {/* Gallery Navigation */}
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-2">
            {images.map((_, index) => (
              <Button
                key={index}
                variant={index === selectedImage ? 'default' : 'outline'}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setSelectedImage(index)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        )}

        {/* Privacy Notice */}
        {currentImage.isPrivate && (
          <p className="text-xs text-muted-foreground text-center">
            Patient privacy protected. Toggle privacy mode to view details.
          </p>
        )}
      </CardContent>
    </Card>
  )
}