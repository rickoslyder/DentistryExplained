import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeRaw from 'rehype-raw'
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import remarkStringify from 'remark-stringify'
import remarkFrontmatter from 'remark-frontmatter'

// List of MDX components we want to preserve
const MDX_COMPONENTS = [
  'Alert',
  'ToothDiagram',
  'Timeline',
  'TimelineItem',
  'CostTable',
  'FAQ',
  'ProcedureSteps',
  'VideoEmbed',
  'MedicationCard',
  'SymptomSeverityScale',
  'TreatmentComparisonTable',
  'BeforeAfterGallery',
  'InteractiveToothChart',
  'AppointmentChecklist',
  'ClinicalCalculator',
  'VideoConsultationCard',
  'InsuranceInfoBox',
  'SmartFAQ'
]

// Note: MDX expressions like {new Date().getFullYear()} are preserved during conversion
// but won't be executed in the editor. They'll be displayed as static text.
// This is intentional for security and to prevent runtime errors in the editor.

/**
 * Convert MDX to HTML for TipTap editor
 */
export async function convertMdxToHtml(mdx: string): Promise<string> {
  // Validate input
  if (!mdx || typeof mdx !== 'string') {
    return ''
  }

  try {
    const processor = unified()
      .use(remarkParse)
      .use(remarkFrontmatter, ['yaml'])
      .use(remarkMdx)
      .use(remarkRehype, {
        allowDangerousHtml: true,
        // Pass through MDX nodes
        passThrough: [
          'mdxjsEsm',
          'mdxFlowExpression',
          'mdxJsxFlowElement',
          'mdxJsxTextElement',
          'mdxTextExpression'
        ]
      })
      .use(rehypeRaw)
      .use(rehypeStringify)

    const result = await processor.process(mdx)
    let html = String(result)

    // Post-process to handle frontmatter
    html = html.replace(/^<hr>\n([\s\S]*?)\n<hr>/m, (match, content) => {
      // Convert frontmatter to a code block for visual editing
      const frontmatterMatch = mdx.match(/^---\n([\s\S]*?)\n---/m)
      if (frontmatterMatch) {
        return `<pre><code class="language-yaml">---\n${frontmatterMatch[1]}\n---</code></pre>`
      }
      return match
    })

    // Ensure MDX components are preserved as custom elements
    MDX_COMPONENTS.forEach(component => {
      // Convert self-closing tags
      html = html.replace(
        new RegExp(`<${component}([^>]*?)\\s*/>`, 'g'),
        `<mdx-${component.toLowerCase()}$1></mdx-${component.toLowerCase()}>`
      )
      // Convert paired tags
      html = html.replace(
        new RegExp(`<${component}([^>]*?)>([\\s\\S]*?)</${component}>`, 'g'),
        `<mdx-${component.toLowerCase()}$1>$2</mdx-${component.toLowerCase()}>`
      )
    })

    return html
  } catch (error: any) {
    console.error('MDX to HTML conversion error:', error)
    // Try to provide more specific error information
    if (error.message?.includes('Unexpected character')) {
      throw new Error(`Invalid MDX syntax: ${error.message}`)
    }
    if (error.message?.includes('Cannot read')) {
      throw new Error(`MDX parsing failed: ${error.message}`)
    }
    // Re-throw with more context
    throw new Error(`Failed to convert MDX to HTML: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Convert HTML back to MDX
 */
export async function convertHtmlToMdx(html: string): Promise<string> {
  // Validate input
  if (!html || typeof html !== 'string') {
    return ''
  }

  try {
    // Pre-process to restore MDX components
    let processedHtml = html
    
    // Convert frontmatter code block back to YAML frontmatter
    processedHtml = processedHtml.replace(
      /<pre><code(?:\s+class="language-yaml")?>\s*---\n([\s\S]*?)\n---\s*<\/code><\/pre>/g,
      '---\n$1\n---'
    )

    // Restore MDX components from custom elements
    MDX_COMPONENTS.forEach(component => {
      const mdxTag = `mdx-${component.toLowerCase()}`
      // Convert back to proper MDX components
      processedHtml = processedHtml.replace(
        new RegExp(`<${mdxTag}([^>]*?)>([\\s\\S]*?)</${mdxTag}>`, 'g'),
        (match, attrs, content) => {
          // Parse attributes and convert back to JSX format
          const cleanAttrs = attrs.trim()
          if (!content.trim()) {
            return `<${component}${cleanAttrs ? ' ' + cleanAttrs : ''} />`
          }
          return `<${component}${cleanAttrs ? ' ' + cleanAttrs : ''}>${content}</${component}>`
        }
      )
    })

    const processor = unified()
      .use(rehypeParse, { fragment: true })
      .use(rehypeRemark, {
        handlers: {
          // Custom handler for preserving MDX components
          mdxJsxFlowElement: (h: any, node: any) => {
            return h(node, 'html', node.value)
          }
        }
      })
      .use(remarkStringify, {
        bullet: '-',
        fence: '`',
        fences: true,
        incrementListMarker: true
      })

    const result = await processor.process(processedHtml)
    let mdx = String(result)

    // Clean up extra newlines
    mdx = mdx.replace(/\n{3,}/g, '\n\n')
    
    // Ensure frontmatter is at the beginning
    const frontmatterMatch = mdx.match(/---\n[\s\S]*?\n---/)
    if (frontmatterMatch && !mdx.startsWith('---')) {
      mdx = mdx.replace(frontmatterMatch[0], '')
      mdx = frontmatterMatch[0] + '\n\n' + mdx.trim()
    }

    return mdx.trim()
  } catch (error: any) {
    console.error('HTML to MDX conversion error:', error)
    // Try to provide more specific error information
    if (error.message?.includes('Unexpected token')) {
      throw new Error(`Invalid HTML syntax: ${error.message}`)
    }
    if (error.message?.includes('Cannot parse')) {
      throw new Error(`HTML parsing failed: ${error.message}`)
    }
    // Re-throw with more context
    throw new Error(`Failed to convert HTML to MDX: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Validate MDX content
 */
export async function validateMdx(mdx: string): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = []
  
  try {
    const processor = unified()
      .use(remarkParse)
      .use(remarkFrontmatter, ['yaml'])
      .use(remarkMdx)

    await processor.parse(mdx)
    
    // Additional validation for balanced tags
    MDX_COMPONENTS.forEach(component => {
      const openTags = (mdx.match(new RegExp(`<${component}[^>]*>`, 'g')) || []).length
      const closeTags = (mdx.match(new RegExp(`</${component}>`, 'g')) || []).length
      const selfClosing = (mdx.match(new RegExp(`<${component}[^>]*/>`, 'g')) || []).length
      
      if (openTags !== closeTags && selfClosing === 0) {
        errors.push(`Unbalanced ${component} tags`)
      }
    })

    return { isValid: errors.length === 0, errors }
  } catch (error: any) {
    errors.push(error.message || 'Invalid MDX syntax')
    return { isValid: false, errors }
  }
}