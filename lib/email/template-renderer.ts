interface EmailTemplate {
  subject: string
  body_html: string
  body_text?: string | null
  variables?: any
}

interface RenderedEmail {
  subject: string
  body_html: string
  body_text: string
}

/**
 * Replace template variables with actual values
 * Variables are in the format {{variableName}}
 */
function replaceVariables(template: string, variables: Record<string, any>): string {
  return template.replace(/{{(\w+)}}/g, (match, key) => {
    if (key in variables) {
      const value = variables[key]
      // Handle null/undefined
      if (value === null || value === undefined) {
        return ''
      }
      // Convert to string
      return String(value)
    }
    // Keep the placeholder if variable not found
    return match
  })
}

/**
 * Render an email template with the provided variables
 */
export function renderEmailTemplate(
  template: EmailTemplate,
  variables: Record<string, any> = {}
): RenderedEmail {
  // Replace variables in subject
  const subject = replaceVariables(template.subject, variables)
  
  // Replace variables in HTML body
  const body_html = replaceVariables(template.body_html, variables)
  
  // Replace variables in text body or generate from HTML
  let body_text = ''
  if (template.body_text) {
    body_text = replaceVariables(template.body_text, variables)
  } else {
    // Simple HTML to text conversion
    body_text = body_html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<li>/gi, '- ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }
  
  return {
    subject,
    body_html,
    body_text
  }
}

/**
 * Extract variable names from a template
 */
export function extractVariables(template: string): string[] {
  const matches = template.match(/{{(\w+)}}/g) || []
  const variables = matches.map(match => match.replace(/{{|}}/g, ''))
  return [...new Set(variables)] // Remove duplicates
}

/**
 * Validate that all required variables are provided
 */
export function validateVariables(
  template: EmailTemplate,
  providedVariables: Record<string, any>
): { valid: boolean; missing: string[] } {
  const requiredVariables = (template.variables || [])
    .filter((v: any) => v.required)
    .map((v: any) => v.name)
  
  const missing = requiredVariables.filter(
    name => !(name in providedVariables) || providedVariables[name] === null || providedVariables[name] === undefined
  )
  
  return {
    valid: missing.length === 0,
    missing
  }
}