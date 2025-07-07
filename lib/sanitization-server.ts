import 'server-only'
import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

// Create DOMPurify instance for server-side use
const window = new JSDOM('').window
const purify = DOMPurify(window as unknown as Window)

// Re-export all functions from client sanitization
export * from './sanitization-client'

// Override sanitizeHtml for server-side with jsdom
import { SanitizeOptions } from './sanitization-client'

/**
 * Server-side HTML sanitization using jsdom
 */
export function sanitizeHtml(
  dirty: string,
  options: SanitizeOptions = {}
): string {
  const config: any = {
    ALLOWED_TAGS: options.allowedTags || [],
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
  const allowedAttrs = options.allowedAttributes || {}
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
  purify.addHook('uponSanitizeAttribute', (node, data) => {
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

  const clean = purify.sanitize(dirty, config)
  
  // Remove hook after use
  purify.removeAllHooks()
  
  return clean
}