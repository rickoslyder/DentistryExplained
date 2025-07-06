'use client'

import { useMemo } from 'react'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import Image from 'next/image'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  XCircle,
  ChevronRight
} from 'lucide-react'

// Custom MDX components
const components = {
  // Headings
  h1: ({ children, ...props }: any) => (
    <h1 className="text-3xl font-bold mt-8 mb-4" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-2xl font-semibold mt-6 mb-3" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-xl font-medium mt-4 mb-2" {...props}>{children}</h3>
  ),
  
  // Paragraphs and text
  p: ({ children, ...props }: any) => (
    <p className="mb-4 leading-7" {...props}>{children}</p>
  ),
  strong: ({ children, ...props }: any) => (
    <strong className="font-semibold" {...props}>{children}</strong>
  ),
  em: ({ children, ...props }: any) => (
    <em className="italic" {...props}>{children}</em>
  ),
  
  // Links
  a: ({ href, children, ...props }: any) => {
    const isInternal = href?.startsWith('/') || href?.startsWith('#')
    return isInternal ? (
      <Link href={href} className="text-primary underline-offset-4 hover:underline" {...props}>
        {children}
      </Link>
    ) : (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-primary underline-offset-4 hover:underline"
        {...props}
      >
        {children}
      </a>
    )
  },
  
  // Lists
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc list-inside mb-4 space-y-1" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal list-inside mb-4 space-y-1" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="ml-4" {...props}>{children}</li>
  ),
  
  // Code
  code: ({ children, ...props }: any) => (
    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
      {children}
    </code>
  ),
  pre: ({ children, ...props }: any) => (
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4" {...props}>
      {children}
    </pre>
  ),
  
  // Blockquote
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-4 border-primary pl-4 my-4 italic" {...props}>
      {children}
    </blockquote>
  ),
  
  // Tables
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full divide-y divide-border" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }: any) => (
    <th className="px-4 py-2 text-left font-medium" {...props}>{children}</th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="px-4 py-2 border-t" {...props}>{children}</td>
  ),
  
  // Images
  img: ({ src, alt, ...props }: any) => (
    <div className="my-4">
      <Image
        src={src}
        alt={alt || ''}
        width={800}
        height={400}
        className="rounded-lg w-full h-auto"
        {...props}
      />
    </div>
  ),
  
  // Horizontal rule
  hr: (props: any) => <Separator className="my-8" {...props} />,
  
  // Custom components
  Alert: ({ type = 'info', title, children, ...props }: any) => {
    const icons = {
      info: <Info className="h-4 w-4" />,
      warning: <AlertCircle className="h-4 w-4" />,
      success: <CheckCircle2 className="h-4 w-4" />,
      error: <XCircle className="h-4 w-4" />
    }
    
    const variants = {
      info: 'default',
      warning: 'destructive',
      success: 'default',
      error: 'destructive'
    }
    
    return (
      <Alert variant={variants[type as keyof typeof variants] as any} className="my-4" {...props}>
        {icons[type as keyof typeof icons]}
        {title && <AlertTitle>{title}</AlertTitle>}
        <AlertDescription>{children}</AlertDescription>
      </Alert>
    )
  },
  
  Card: ({ title, description, children, ...props }: any) => (
    <Card className="my-4" {...props}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  ),
  
  Badge,
  Button,
  ChevronRight
}

interface MDXContentProps {
  content: string | MDXRemoteSerializeResult
  components?: Record<string, any>
}

export default function MDXContent({ content, components: customComponents }: MDXContentProps) {
  // If content is already serialized MDX, render it directly
  if (typeof content === 'object' && 'compiledSource' in content) {
    return (
      <MDXRemote 
        {...content}
        components={{ ...components, ...customComponents }} 
      />
    )
  }
  
  // Otherwise, render as plain HTML (for preview purposes)
  // Note: In production, you should serialize MDX on the server
  return (
    <div 
      className="mdx-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}