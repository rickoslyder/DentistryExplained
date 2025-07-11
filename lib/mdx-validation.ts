export interface ValidationError {
  line: number
  column: number
  message: string
  severity: 'error' | 'warning' | 'info'
  suggestion?: string
  quickFix?: {
    text: string
    range: { start: number; end: number }
  }
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

// Known MDX components and their required props
const componentSchemas: Record<string, {
  required?: string[]
  optional?: string[]
  children?: boolean
}> = {
  Alert: { required: [], optional: ['type', 'title'], children: true },
  AlertEnhanced: { required: [], optional: ['variant', 'collapsible', 'timestamp'], children: true },
  MedicationCard: { required: ['medication'], children: false },
  BeforeAfterGallery: { required: ['images'], optional: ['title', 'defaultBlurred'], children: false },
  SmartFAQ: { required: ['items'], optional: ['title', 'showViewCounts'], children: false },
  CostTable: { required: ['costs'], children: false },
  EnhancedCostTable: { required: ['costs'], optional: ['showPaymentCalculator', 'showInsuranceEstimator'], children: false },
  Timeline: { required: [], children: true },
  BranchingTimeline: { required: ['items'], optional: ['title', 'currentStep'], children: false },
  ClinicalCalculator: { required: [], optional: ['showHistory'], children: false },
  VideoConsultationCard: { required: ['consultation'], optional: ['showChecklist'], children: false },
  InsuranceInfoBox: { required: ['insurance'], optional: ['showClaimGuide'], children: false }
}

export function validateMDX(content: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  const lines = content.split('\n')
  
  // Track open tags
  const tagStack: { tag: string; line: number; selfClosing: boolean }[] = []
  
  lines.forEach((line, lineIndex) => {
    const lineNumber = lineIndex + 1
    
    // Check for MDX component usage
    const componentPattern = /<(\/?)?([A-Z][a-zA-Z]*)(.*?)(\/?)?>/g
    let match
    
    while ((match = componentPattern.exec(line)) !== null) {
      const [fullMatch, closingSlash, componentName, attributes, selfClosingSlash] = match
      const column = match.index + 1
      
      if (closingSlash) {
        // Closing tag
        const lastOpen = tagStack.findIndex(t => t.tag === componentName)
        if (lastOpen === -1) {
          errors.push({
            line: lineNumber,
            column,
            message: `Closing tag </${componentName}> has no matching opening tag`,
            severity: 'error'
          })
        } else {
          tagStack.splice(lastOpen, 1)
        }
      } else {
        // Opening or self-closing tag
        const isSelfClosing = selfClosingSlash || attributes.endsWith('/')
        
        // Validate component exists
        if (!componentSchemas[componentName] && !isHTMLElement(componentName)) {
          warnings.push({
            line: lineNumber,
            column,
            message: `Unknown component: ${componentName}`,
            severity: 'warning',
            suggestion: `Make sure ${componentName} is imported and registered`
          })
        } else if (componentSchemas[componentName]) {
          // Validate props
          const schema = componentSchemas[componentName]
          const props = parseProps(attributes)
          
          // Check required props
          schema.required?.forEach(reqProp => {
            if (!props[reqProp]) {
              errors.push({
                line: lineNumber,
                column,
                message: `Component ${componentName} is missing required prop: ${reqProp}`,
                severity: 'error',
                suggestion: `Add ${reqProp}={...} to the component`,
                quickFix: {
                  text: ` ${reqProp}={}`,
                  range: { start: match.index + fullMatch.length - 1, end: match.index + fullMatch.length - 1 }
                }
              })
            }
          })
          
          // Check if children are required
          if (schema.children && isSelfClosing) {
            warnings.push({
              line: lineNumber,
              column,
              message: `Component ${componentName} expects children but is self-closing`,
              severity: 'warning'
            })
          }
        }
        
        if (!isSelfClosing) {
          tagStack.push({ tag: componentName, line: lineNumber, selfClosing: false })
        }
      }
    }
    
    // Check for common MDX errors
    checkCommonErrors(line, lineNumber, errors, warnings)
  })
  
  // Check for unclosed tags
  tagStack.forEach(tag => {
    errors.push({
      line: tag.line,
      column: 1,
      message: `Unclosed tag: <${tag.tag}>`,
      severity: 'error',
      suggestion: `Add </${tag.tag}> to close this tag`
    })
  })
  
  // Check for syntax issues
  checkSyntaxIssues(content, errors, warnings)
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

function parseProps(attributeString: string): Record<string, string> {
  const props: Record<string, string> = {}
  const propPattern = /(\w+)=(?:{([^}]*)}|"([^"]*)")/g
  let match
  
  while ((match = propPattern.exec(attributeString)) !== null) {
    const [, propName, jsValue, stringValue] = match
    props[propName] = jsValue || stringValue || ''
  }
  
  return props
}

function isHTMLElement(tagName: string): boolean {
  const htmlElements = [
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
    'img', 'a', 'button', 'input', 'textarea', 'select', 'option',
    'header', 'footer', 'main', 'nav', 'section', 'article', 'aside'
  ]
  return htmlElements.includes(tagName.toLowerCase())
}

function checkCommonErrors(line: string, lineNumber: number, errors: ValidationError[], warnings: ValidationError[]) {
  // Check for unclosed curly braces in JSX expressions
  const openBraces = (line.match(/{/g) || []).length
  const closeBraces = (line.match(/}/g) || []).length
  if (openBraces !== closeBraces) {
    errors.push({
      line: lineNumber,
      column: 1,
      message: 'Mismatched curly braces',
      severity: 'error',
      suggestion: 'Check that all { have matching }'
    })
  }
  
  // Check for invalid attribute syntax
  if (line.includes('=""')) {
    warnings.push({
      line: lineNumber,
      column: line.indexOf('=""') + 1,
      message: 'Empty attribute value',
      severity: 'warning',
      suggestion: 'Consider removing the attribute or providing a value'
    })
  }
  
  // Check for common typos in props
  const commonTypos: Record<string, string> = {
    'classname': 'className',
    'onclick': 'onClick',
    'onchange': 'onChange',
    'htmlfor': 'htmlFor'
  }
  
  Object.entries(commonTypos).forEach(([typo, correct]) => {
    if (line.toLowerCase().includes(`${typo}=`)) {
      const column = line.toLowerCase().indexOf(`${typo}=`) + 1
      errors.push({
        line: lineNumber,
        column,
        message: `Invalid prop name: ${typo}`,
        severity: 'error',
        suggestion: `Use ${correct} instead`,
        quickFix: {
          text: correct,
          range: { start: column - 1, end: column + typo.length - 1 }
        }
      })
    }
  })
}

function checkSyntaxIssues(content: string, errors: ValidationError[], warnings: ValidationError[]) {
  // Check for frontmatter
  if (content.startsWith('---')) {
    const frontmatterEnd = content.indexOf('---', 3)
    if (frontmatterEnd === -1) {
      errors.push({
        line: 1,
        column: 1,
        message: 'Unclosed frontmatter block',
        severity: 'error',
        suggestion: 'Add closing --- to end the frontmatter'
      })
    }
  }
  
  // Check for code blocks
  const codeBlockPattern = /```(\w*)\n/g
  const codeBlocks: { start: number; lang: string }[] = []
  let match
  
  while ((match = codeBlockPattern.exec(content)) !== null) {
    const line = content.substring(0, match.index).split('\n').length
    codeBlocks.push({ start: line, lang: match[1] })
  }
  
  // Check if code blocks are closed
  const closingPattern = /```\n/g
  const closings: number[] = []
  while ((match = closingPattern.exec(content)) !== null) {
    const line = content.substring(0, match.index).split('\n').length
    closings.push(line)
  }
  
  if (codeBlocks.length !== closings.length) {
    warnings.push({
      line: 1,
      column: 1,
      message: 'Mismatched code block delimiters',
      severity: 'warning',
      suggestion: 'Check that all ``` have matching closing ```'
    })
  }
}

// Real-time validation provider
export class MDXValidator {
  private validationTimer: NodeJS.Timeout | null = null
  private lastContent: string = ''
  private lastResult: ValidationResult = { valid: true, errors: [], warnings: [] }
  
  constructor(
    private onValidationUpdate: (result: ValidationResult) => void
  ) {}
  
  updateContent(content: string) {
    // Clear existing timer
    if (this.validationTimer) {
      clearTimeout(this.validationTimer)
    }
    
    // Don't re-validate if content hasn't changed
    if (content === this.lastContent) {
      return
    }
    
    // Debounce validation
    this.validationTimer = setTimeout(() => {
      this.lastContent = content
      this.lastResult = validateMDX(content)
      this.onValidationUpdate(this.lastResult)
    }, 500) // Validate 500ms after typing stops
  }
  
  getLastResult(): ValidationResult {
    return this.lastResult
  }
  
  destroy() {
    if (this.validationTimer) {
      clearTimeout(this.validationTimer)
    }
  }
}

// Helper to get line and column from string position
export function getLineAndColumn(content: string, position: number): { line: number; column: number } {
  const lines = content.substring(0, position).split('\n')
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  }
}

// Helper to apply quick fixes
export function applyQuickFix(
  content: string, 
  quickFix: { text: string; range: { start: number; end: number } }
): string {
  return content.substring(0, quickFix.range.start) + 
         quickFix.text + 
         content.substring(quickFix.range.end)
}