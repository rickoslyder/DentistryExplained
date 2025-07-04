import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemoteSerializeResult } from 'next-mdx-remote'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import matter from 'gray-matter'

export interface MDXFrontmatter {
  title: string
  excerpt?: string
  category?: string
  author?: string
  date?: string
  tags?: string[]
  featuredImage?: string
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string[]
}

export interface ProcessedMDX {
  frontmatter: MDXFrontmatter
  content: MDXRemoteSerializeResult
  readTime: number
  wordCount: number
}

// Custom components for MDX rendering
export const mdxComponents = {
  // Dental-specific components
  ToothDiagram: ({ teeth }: { teeth: number[] }) => (
    <div className="tooth-diagram p-4 bg-gray-50 rounded-lg">
      <div className="grid grid-cols-8 gap-2">
        {Array.from({ length: 32 }, (_, i) => (
          <div
            key={i + 1}
            className={`tooth ${teeth.includes(i + 1) ? 'bg-red-500' : 'bg-gray-300'} w-8 h-8 rounded text-center text-white text-xs flex items-center justify-center`}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  ),
  
  // Treatment timeline component
  Timeline: ({ children }: { children: React.ReactNode }) => (
    <div className="timeline border-l-2 border-primary ml-4 pl-8 space-y-6">
      {children}
    </div>
  ),
  
  TimelineItem: ({ date, title, children }: { date: string; title: string; children: React.ReactNode }) => (
    <div className="relative">
      <div className="absolute -left-10 w-4 h-4 bg-primary rounded-full"></div>
      <div className="text-sm text-gray-500 mb-1">{date}</div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <div className="text-gray-700">{children}</div>
    </div>
  ),
  
  // Warning/Info boxes
  Alert: ({ type = 'info', children }: { type?: 'info' | 'warning' | 'success' | 'error'; children: React.ReactNode }) => {
    const styles = {
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
    }
    
    return (
      <div className={`alert p-4 mb-6 rounded-lg border ${styles[type]}`}>
        {children}
      </div>
    )
  },
  
  // Procedure steps
  ProcedureSteps: ({ children }: { children: React.ReactNode }) => (
    <ol className="procedure-steps space-y-4 list-decimal list-inside">
      {children}
    </ol>
  ),
  
  // Cost breakdown table
  CostTable: ({ costs }: { costs: Array<{ item: string; cost: string; nhs?: boolean }> }) => (
    <div className="overflow-x-auto mb-6">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Treatment
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cost
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              NHS Available
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {costs.map((item, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {item.item}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.cost}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.nhs ? '✓' : '✗'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
  
  // FAQ component
  FAQ: ({ question, children }: { question: string; children: React.ReactNode }) => (
    <div className="faq mb-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-semibold mb-2">Q: {question}</h4>
      <div className="text-gray-700">A: {children}</div>
    </div>
  ),
  
  // Video embed
  VideoEmbed: ({ url, title }: { url: string; title?: string }) => (
    <div className="video-embed mb-6">
      <div className="aspect-w-16 aspect-h-9">
        <iframe
          src={url}
          title={title || 'Video'}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-lg"
        />
      </div>
      {title && <p className="text-sm text-gray-600 mt-2 text-center">{title}</p>}
    </div>
  ),
}

// Process MDX content with frontmatter
export async function processMDX(source: string): Promise<ProcessedMDX> {
  // Parse frontmatter
  const { content: rawContent, data } = matter(source)
  
  // Calculate reading metrics
  const wordCount = rawContent.split(/\s+/g).length
  const readTime = Math.ceil(wordCount / 225) // Average reading speed
  
  // Serialize MDX
  const content = await serialize(rawContent, {
    parseFrontmatter: false, // We already parsed it
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeHighlight],
    },
  })
  
  return {
    frontmatter: data as MDXFrontmatter,
    content,
    readTime,
    wordCount,
  }
}

// Process MDX for preview (without full serialization)
export function processMDXPreview(source: string): {
  frontmatter: MDXFrontmatter
  excerpt: string
  readTime: number
} {
  const { content: rawContent, data } = matter(source)
  
  // Extract excerpt (first paragraph or custom excerpt)
  const excerptMatch = rawContent.match(/^(.+?)(\n\n|$)/s)
  const excerpt = data.excerpt || (excerptMatch ? excerptMatch[1] : '')
  
  // Calculate reading time
  const wordCount = rawContent.split(/\s+/g).length
  const readTime = Math.ceil(wordCount / 225)
  
  return {
    frontmatter: data as MDXFrontmatter,
    excerpt,
    readTime,
  }
}

// Validate MDX content
export function validateMDX(source: string): { 
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  try {
    const { data } = matter(source)
    
    // Check required frontmatter fields
    if (!data.title) {
      errors.push('Missing required frontmatter field: title')
    }
    
    // Check if content has actual MDX
    const { content } = matter(source)
    if (!content.trim()) {
      errors.push('Content cannot be empty')
    }
    
    // Basic MDX syntax validation (you could add more complex validation)
    const mdxPatterns = [
      { pattern: /<[A-Z]\w*/, name: 'component' },
      { pattern: /\{[^}]+\}/, name: 'expression' },
    ]
    
    // This is a simple check - in production you might want to use a proper MDX parser
    
  } catch (error) {
    errors.push(`Invalid frontmatter: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Generate table of contents from MDX content
export function generateTOC(content: string): Array<{
  id: string
  title: string
  level: number
}> {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const toc: Array<{ id: string; title: string; level: number }> = []
  
  let match
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const title = match[2]
    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    
    toc.push({ id, title, level })
  }
  
  return toc
}