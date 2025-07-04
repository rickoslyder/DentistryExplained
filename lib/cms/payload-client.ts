// Client-side functions to interact with Payload CMS through our API

export interface PayloadArticle {
  id: string
  title: string
  slug: string
  summary: string
  content: any // Rich text content
  category: {
    id: string
    name: string
    slug: string
  }
  author: {
    id: string
    name: string
  }
  medicalReviewer?: {
    id: string
    name: string
  }
  status: string
  difficultyLevel: 'basic' | 'advanced'
  readTime?: number
  featuredImage?: {
    url: string
    alt: string
  }
  references?: Array<{
    id: string
    title: string
    authors: Array<{ name: string }>
    year: number
  }>
  relatedArticles?: Array<{
    id: string
    title: string
    slug: string
  }>
  lastMedicalReview?: string
  createdAt: string
  updatedAt: string
}

export interface PayloadCategory {
  id: string
  name: string
  slug: string
  description?: string
  parent?: string
  order: number
  icon?: string
}

const PAYLOAD_API_BASE = '/api/payload'

export async function fetchArticles(): Promise<PayloadArticle[]> {
  try {
    const response = await fetch(`${PAYLOAD_API_BASE}/articles`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch articles')
    }
    
    const data = await response.json()
    return data.docs || []
  } catch (error) {
    console.error('Error fetching articles:', error)
    return []
  }
}

export async function fetchArticleBySlug(slug: string): Promise<PayloadArticle | null> {
  try {
    const response = await fetch(`${PAYLOAD_API_BASE}/articles/${slug}`, {
      next: { revalidate: 300 },
    })
    
    if (!response.ok) {
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching article:', error)
    return null
  }
}

export async function fetchCategories(): Promise<PayloadCategory[]> {
  try {
    const response = await fetch(`${PAYLOAD_API_BASE}/categories`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories')
    }
    
    const data = await response.json()
    return data.docs || []
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

export async function fetchArticlesByCategory(categorySlug: string): Promise<PayloadArticle[]> {
  try {
    const response = await fetch(`${PAYLOAD_API_BASE}/articles?category=${categorySlug}`, {
      next: { revalidate: 300 },
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch articles by category')
    }
    
    const data = await response.json()
    return data.docs || []
  } catch (error) {
    console.error('Error fetching articles by category:', error)
    return []
  }
}

// Function to render rich text content from Payload
export function renderRichText(content: any): string {
  // This is a simplified renderer - in production, you'd use a proper Lexical renderer
  if (!content || !content.root) return ''
  
  let html = ''
  
  const renderNode = (node: any): string => {
    if (!node) return ''
    
    switch (node.type) {
      case 'paragraph':
        return `<p>${node.children?.map(renderNode).join('') || ''}</p>`
      
      case 'heading':
        const tag = `h${node.tag}`
        return `<${tag}>${node.children?.map(renderNode).join('') || ''}</${tag}>`
      
      case 'list':
        const listTag = node.listType === 'number' ? 'ol' : 'ul'
        return `<${listTag}>${node.children?.map(renderNode).join('') || ''}</${listTag}>`
      
      case 'listitem':
        return `<li>${node.children?.map(renderNode).join('') || ''}</li>`
      
      case 'text':
        let text = node.text || ''
        if (node.format & 1) text = `<strong>${text}</strong>` // Bold
        if (node.format & 2) text = `<em>${text}</em>` // Italic
        if (node.format & 8) text = `<u>${text}</u>` // Underline
        return text
      
      case 'link':
        return `<a href="${node.fields?.url || '#'}" ${node.fields?.newTab ? 'target="_blank"' : ''}>${node.children?.map(renderNode).join('') || ''}</a>`
      
      case 'block':
        // Handle custom blocks
        if (node.fields?.blockType === 'warning') {
          return `<div class="warning-block ${node.fields.type}">${node.fields.content}</div>`
        }
        if (node.fields?.blockType === 'procedure-step') {
          return `<div class="procedure-step">
            <span class="step-number">${node.fields.stepNumber}</span>
            <h4>${node.fields.title}</h4>
            <p>${node.fields.description}</p>
            ${node.fields.duration ? `<span class="duration">${node.fields.duration}</span>` : ''}
          </div>`
        }
        return ''
      
      default:
        return node.children?.map(renderNode).join('') || ''
    }
  }
  
  if (content.root.children) {
    html = content.root.children.map(renderNode).join('')
  }
  
  return html
}