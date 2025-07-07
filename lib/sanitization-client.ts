import DOMPurify from 'dompurify'

// Default allowed tags and attributes for article content
const ARTICLE_ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins', 'mark',
  'ul', 'ol', 'li',
  'blockquote', 'q', 'cite',
  'pre', 'code', 'kbd', 'samp', 'var',
  'a', 'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  'div', 'span',
  'sup', 'sub',
  'details', 'summary'
]

const ARTICLE_ALLOWED_ATTRIBUTES = {
  'a': ['href', 'title', 'target', 'rel'],
  'img': ['src', 'alt', 'title', 'width', 'height'],
  'blockquote': ['cite'],
  'q': ['cite'],
  'code': ['class'], // For syntax highlighting
  'pre': ['class'],
  '*': ['class', 'id'] // Allow classes and IDs on all elements
}

// Stricter config for user-generated content (comments, etc.)
const USER_CONTENT_ALLOWED_TAGS = [
  'p', 'br',
  'strong', 'b', 'em', 'i',
  'ul', 'ol', 'li',
  'blockquote',
  'a', 'code'
]

const USER_CONTENT_ALLOWED_ATTRIBUTES = {
  'a': ['href', 'title'],
  'blockquote': ['cite']
}

// Email template specific config
const EMAIL_ALLOWED_TAGS = [
  ...ARTICLE_ALLOWED_TAGS,
  'style', // Allow inline styles for email compatibility
  'meta',
  'head',
  'body',
  'html'
]

const EMAIL_ALLOWED_ATTRIBUTES = {
  ...ARTICLE_ALLOWED_ATTRIBUTES,
  '*': ['style', 'class', 'id', 'align', 'valign', 'bgcolor', 'color'] // Email client compatibility
}

export interface SanitizeOptions {
  allowedTags?: string[]
  allowedAttributes?: Record<string, string[]>
  allowDataAttributes?: boolean
  allowStyleAttributes?: boolean
  allowClassIdAttributes?: boolean
  stripIgnoreTag?: boolean
  stripIgnoreTagBody?: boolean
}

/**
 * Sanitize HTML content with configurable options
 */
export function sanitizeHtml(
  dirty: string,
  options: SanitizeOptions = {}
): string {
  const config: any = {
    ALLOWED_TAGS: options.allowedTags || ARTICLE_ALLOWED_TAGS,
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: options.allowDataAttributes ?? false,
    KEEP_CONTENT: !options.stripIgnoreTagBody,
    WHOLE_DOCUMENT: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    SANITIZE_DOM: true,
    IN_PLACE: false
  }

  // Build allowed attributes list
  const allowedAttrs = options.allowedAttributes || ARTICLE_ALLOWED_ATTRIBUTES
  const attrList: string[] = []
  
  for (const [tag, attrs] of Object.entries(allowedAttrs)) {
    if (tag === '*') {
      attrList.push(...attrs)
    } else {
      for (const attr of attrs) {
        attrList.push(attr)
      }
    }
  }
  
  config.ALLOWED_ATTR = attrList

  // Configure attribute hooks
  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    // Allow style attributes if specified
    if (!options.allowStyleAttributes && data.attrName === 'style') {
      data.keepAttr = false
      return
    }

    // Allow class/id if specified
    if (!options.allowClassIdAttributes && 
        (data.attrName === 'class' || data.attrName === 'id')) {
      data.keepAttr = false
      return
    }

    // Validate URLs in href and src
    if (data.attrName === 'href' || data.attrName === 'src') {
      const value = data.attrValue
      if (value.startsWith('javascript:') || 
          value.startsWith('data:') && !value.startsWith('data:image/')) {
        data.keepAttr = false
      }
    }

    // Force target="_blank" and rel="noopener noreferrer" on external links
    if (node.nodeName === 'A' && data.attrName === 'href') {
      const href = data.attrValue
      if (href.startsWith('http://') || href.startsWith('https://')) {
        node.setAttribute('target', '_blank')
        node.setAttribute('rel', 'noopener noreferrer')
      }
    }
  })

  const clean = DOMPurify.sanitize(dirty, config)
  
  // Remove hook after use
  DOMPurify.removeAllHooks()
  
  return clean
}

/**
 * Sanitize article content (rich HTML)
 */
export function sanitizeArticleContent(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: ARTICLE_ALLOWED_TAGS,
    allowedAttributes: ARTICLE_ALLOWED_ATTRIBUTES,
    allowClassIdAttributes: true,
    allowDataAttributes: false,
    stripIgnoreTagBody: false
  })
}

/**
 * Sanitize user-generated content (comments, etc.)
 */
export function sanitizeUserContent(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: USER_CONTENT_ALLOWED_TAGS,
    allowedAttributes: USER_CONTENT_ALLOWED_ATTRIBUTES,
    allowClassIdAttributes: false,
    allowDataAttributes: false,
    stripIgnoreTagBody: true
  })
}

/**
 * Sanitize email template HTML
 */
export function sanitizeEmailTemplate(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: EMAIL_ALLOWED_TAGS,
    allowedAttributes: EMAIL_ALLOWED_ATTRIBUTES,
    allowClassIdAttributes: true,
    allowStyleAttributes: true,
    allowDataAttributes: false,
    stripIgnoreTagBody: false
  })
}

/**
 * Sanitize plain text (escape HTML)
 */
export function sanitizePlainText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * Sanitize JSON string content
 */
export function sanitizeJson(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizePlainText(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeJson)
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizePlainText(key)] = sanitizeJson(value)
    }
    return sanitized
  }
  
  return obj
}

/**
 * Extract plain text from HTML
 */
export function htmlToPlainText(html: string): string {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true
  })
  return clean.trim()
}

/**
 * Validate and sanitize file names
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^[._-]+/, '') // Remove leading special chars
    .replace(/[._-]+$/, '') // Remove trailing special chars
    .substring(0, 255) // Limit length
}

/**
 * Validate and sanitize URLs
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    
    // Only allow http(s) protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null
    }
    
    // Prevent localhost and private IPs
    if (parsed.hostname === 'localhost' || 
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname.startsWith('192.168.') ||
        parsed.hostname.startsWith('10.') ||
        parsed.hostname.startsWith('172.')) {
      return null
    }
    
    return parsed.toString()
  } catch {
    return null
  }
}