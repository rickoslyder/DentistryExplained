/**
 * Convert HTML from clipboard (Word, Google Docs, etc) to MDX format
 */

export function htmlToMdx(html: string): string {
  // Create a temporary DOM element to parse HTML
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  
  // Convert the body content
  return convertNode(doc.body).trim()
}

function convertNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || ''
  }
  
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return ''
  }
  
  const element = node as Element
  const tag = element.tagName.toLowerCase()
  const children = Array.from(node.childNodes)
    .map(child => convertNode(child))
    .join('')
  
  // Handle different HTML elements
  switch (tag) {
    // Headings
    case 'h1':
      return `# ${children}\n\n`
    case 'h2':
      return `## ${children}\n\n`
    case 'h3':
      return `### ${children}\n\n`
    case 'h4':
      return `#### ${children}\n\n`
    case 'h5':
      return `##### ${children}\n\n`
    case 'h6':
      return `###### ${children}\n\n`
    
    // Paragraphs and breaks
    case 'p':
      return children ? `${children}\n\n` : ''
    case 'br':
      return '\n'
    
    // Text formatting
    case 'strong':
    case 'b':
      return `**${children}**`
    case 'em':
    case 'i':
      return `*${children}*`
    case 'u':
      return `<u>${children}</u>`
    case 's':
    case 'strike':
    case 'del':
      return `~~${children}~~`
    case 'code':
      return `\`${children}\``
    case 'pre':
      return `\`\`\`\n${children}\n\`\`\`\n\n`
    
    // Links
    case 'a':
      const href = element.getAttribute('href') || '#'
      return `[${children}](${href})`
    
    // Images
    case 'img':
      const src = element.getAttribute('src') || ''
      const alt = element.getAttribute('alt') || ''
      return `![${alt}](${src})\n\n`
    
    // Lists
    case 'ul':
      return convertList(element, false) + '\n'
    case 'ol':
      return convertList(element, true) + '\n'
    case 'li':
      // Handled by convertList
      return children
    
    // Tables
    case 'table':
      return convertTable(element) + '\n'
    
    // Blockquotes
    case 'blockquote':
      return children.split('\n')
        .map(line => `> ${line}`)
        .join('\n') + '\n\n'
    
    // Divs and spans - just pass through content
    case 'div':
    case 'span':
    case 'section':
    case 'article':
      return children
    
    // Horizontal rule
    case 'hr':
      return '---\n\n'
    
    // Skip these elements
    case 'style':
    case 'script':
    case 'meta':
    case 'link':
      return ''
    
    // Default: just return children
    default:
      return children
  }
}

function convertList(element: Element, ordered: boolean): string {
  const items = Array.from(element.querySelectorAll(':scope > li'))
  return items.map((item, index) => {
    const prefix = ordered ? `${index + 1}. ` : '- '
    const content = Array.from(item.childNodes)
      .map(child => convertNode(child))
      .join('')
      .trim()
    
    // Handle nested lists
    const nestedLists = Array.from(item.querySelectorAll(':scope > ul, :scope > ol'))
    const nestedContent = nestedLists
      .map(list => convertNode(list))
      .join('')
      .split('\n')
      .map(line => line ? '  ' + line : '')
      .join('\n')
    
    return prefix + content + (nestedContent ? '\n' + nestedContent : '')
  }).join('\n')
}

function convertTable(table: Element): string {
  const rows = Array.from(table.querySelectorAll('tr'))
  if (rows.length === 0) return ''
  
  const tableData = rows.map(row => {
    const cells = Array.from(row.querySelectorAll('td, th'))
    return cells.map(cell => {
      const content = Array.from(cell.childNodes)
        .map(child => convertNode(child))
        .join('')
        .trim()
        .replace(/\n/g, ' ')
      return content
    })
  })
  
  if (tableData.length === 0) return ''
  
  // Build markdown table
  let markdown = ''
  
  // Header row
  markdown += '| ' + tableData[0].join(' | ') + ' |\n'
  
  // Separator row
  markdown += '|' + tableData[0].map(() => ' --- ').join('|') + '|\n'
  
  // Data rows
  for (let i = 1; i < tableData.length; i++) {
    markdown += '| ' + tableData[i].join(' | ') + ' |\n'
  }
  
  return markdown
}

/**
 * Extract plain text from HTML, useful for detecting content type
 */
export function extractTextFromHtml(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}