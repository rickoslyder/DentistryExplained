import React from 'react'
import { GlossaryTooltip } from '@/components/glossary/glossary-tooltip'

interface ProcessedContent {
  content: React.ReactNode
  termsFound: Set<string>
}

interface GlossaryTerm {
  id: string
  term: string
  definition: string
  pronunciation?: string | null
  difficulty?: string | null
}

export function processContentForGlossaryTerms(
  content: string,
  terms: Map<string, GlossaryTerm>,
  trackTermView: (term: string) => void,
  options: {
    maxTooltipsPerParagraph?: number
    skipHeadings?: boolean
    caseSensitive?: boolean
  } = {}
): ProcessedContent {
  const {
    maxTooltipsPerParagraph = 3,
    skipHeadings = true,
    caseSensitive = false
  } = options

  const termsFound = new Set<string>()
  const processedTermsInParagraph = new Set<string>()

  // Create regex pattern for all terms (sorted by length to match longer terms first)
  const termsList = Array.from(terms.keys()).sort((a, b) => b.length - a.length)
  const flags = caseSensitive ? 'g' : 'gi'
  
  // Escape special regex characters and create boundary pattern
  const termsPattern = termsList
    .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  
  const regex = new RegExp(`\\b(${termsPattern})\\b`, flags)

  // Process content line by line
  const lines = content.split('\n')
  const processedLines = lines.map((line, lineIndex) => {
    // Skip headings if requested
    if (skipHeadings && line.match(/^#{1,6}\s/)) {
      return line
    }

    // Reset processed terms for new paragraph
    if (line.trim() === '') {
      processedTermsInParagraph.clear()
    }

    let processedLine = line
    let matches: RegExpExecArray | null
    const replacements: Array<{ start: number; end: number; replacement: React.ReactNode }> = []

    // Find all matches in the line
    regex.lastIndex = 0 // Reset regex state
    while ((matches = regex.exec(line)) !== null && processedTermsInParagraph.size < maxTooltipsPerParagraph) {
      const matchedText = matches[0]
      const termKey = matchedText.toLowerCase()
      const term = terms.get(termKey)

      if (term && !processedTermsInParagraph.has(termKey)) {
        termsFound.add(term.term)
        processedTermsInParagraph.add(termKey)

        replacements.push({
          start: matches.index,
          end: matches.index + matchedText.length,
          replacement: (
            <GlossaryTooltip
              key={`${lineIndex}-${matches.index}`}
              term={term.term}
              definition={term.definition}
              pronunciation={term.pronunciation || undefined}
              trackInteraction={() => trackTermView(term.term)}
            >
              {matchedText}
            </GlossaryTooltip>
          )
        })
      }
    }

    // Apply replacements in reverse order to maintain indices
    if (replacements.length > 0) {
      const elements: React.ReactNode[] = []
      let lastIndex = 0

      replacements
        .sort((a, b) => a.start - b.start)
        .forEach((replacement, i) => {
          // Add text before replacement
          if (replacement.start > lastIndex) {
            elements.push(line.substring(lastIndex, replacement.start))
          }
          // Add replacement
          elements.push(replacement.replacement)
          lastIndex = replacement.end
        })

      // Add remaining text
      if (lastIndex < line.length) {
        elements.push(line.substring(lastIndex))
      }

      return <React.Fragment key={lineIndex}>{elements}</React.Fragment>
    }

    return line
  })

  return {
    content: (
      <>
        {processedLines.map((line, index) => (
          <React.Fragment key={index}>
            {line}
            {index < processedLines.length - 1 && '\n'}
          </React.Fragment>
        ))}
      </>
    ),
    termsFound
  }
}

// Utility function to process React children recursively
export function processReactContent(
  children: React.ReactNode,
  terms: Map<string, GlossaryTerm>,
  trackTermView: (term: string) => void,
  options?: Parameters<typeof processContentForGlossaryTerms>[3]
): React.ReactNode {
  return React.Children.map(children, (child) => {
    // Process text nodes
    if (typeof child === 'string') {
      const { content } = processContentForGlossaryTerms(child, terms, trackTermView, options)
      return content
    }

    // Process React elements recursively
    if (React.isValidElement(child)) {
      // Skip certain elements
      const skipTags = ['code', 'pre', 'script', 'style', 'a', 'button']
      if (typeof child.type === 'string' && skipTags.includes(child.type)) {
        return child
      }

      // Process children of the element
      const processedChildren = processReactContent(
        child.props.children,
        terms,
        trackTermView,
        options
      )

      return React.cloneElement(child, {
        ...child.props,
        children: processedChildren
      })
    }

    return child
  })
}