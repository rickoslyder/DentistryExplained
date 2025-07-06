import matter from 'gray-matter'

export interface ProcessedMDX {
  content: string
  frontmatter: Record<string, any>
  excerpt: string
  readTime: number
}

export function processMDXContent(content: string): ProcessedMDX {
  // Parse frontmatter
  const { content: mdxContent, data: frontmatter } = matter(content)
  
  // Extract excerpt (first paragraph or first 160 chars)
  const excerptMatch = mdxContent.match(/^[^#\n].*$/m)
  const excerpt = excerptMatch 
    ? excerptMatch[0].substring(0, 160).trim() + '...'
    : ''
  
  // Calculate read time (rough estimate: 200 words per minute)
  const wordCount = mdxContent.split(/\s+/).length
  const readTime = Math.max(1, Math.round(wordCount / 200))
  
  // Remove frontmatter from content for display
  const contentWithoutFrontmatter = mdxContent.trim()
  
  return {
    content: contentWithoutFrontmatter,
    frontmatter,
    excerpt,
    readTime
  }
}

export function processMDXPreview(content: string) {
  const { content: mdxContent, data: frontmatter } = matter(content)
  
  // Extract excerpt
  const paragraphMatch = mdxContent.match(/^[^#\n].+$/m)
  const excerpt = paragraphMatch 
    ? paragraphMatch[0].substring(0, 160).trim() + '...'
    : ''
    
  // Calculate read time
  const wordCount = mdxContent.split(/\s+/).length
  const readTime = Math.max(1, Math.round(wordCount / 200))
  
  return {
    frontmatter,
    excerpt,
    readTime
  }
}