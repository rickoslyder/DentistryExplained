'use client'

import React from 'react'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import { useGlossary } from '@/contexts/glossary-provider'
import { processReactContent } from '@/lib/glossary-processor'
import { mdxComponents } from '@/lib/mdx'

interface MDXWithGlossaryProps {
  content: MDXRemoteSerializeResult
  components?: Record<string, React.ComponentType>
}

export function MDXWithGlossary({ content, components = {} }: MDXWithGlossaryProps) {
  const { terms, getTermByName, trackTermView, termsLoaded, preferences } = useGlossary()

  // Create enhanced components that process their children for glossary terms
  const enhancedComponents = React.useMemo(() => {
    if (!termsLoaded || !preferences.enableTooltips) return { ...mdxComponents, ...components }

    const processedComponents: Record<string, React.ComponentType> = {}

    // List of components to enhance with glossary processing
    const componentsToProcess = ['p', 'li', 'td', 'dd', 'blockquote', 'Alert', 'FAQ']

    componentsToProcess.forEach(componentName => {
      const OriginalComponent = components[componentName] || mdxComponents[componentName as keyof typeof mdxComponents] || componentName

      processedComponents[componentName] = ({ children, ...props }: any) => {
        const processedChildren = processReactContent(children, terms, trackTermView)

        if (typeof OriginalComponent === 'string') {
          return React.createElement(OriginalComponent, props, processedChildren)
        }

        return <OriginalComponent {...props}>{processedChildren}</OriginalComponent>
      }
    })

    return {
      ...mdxComponents,
      ...components,
      ...processedComponents
    }
  }, [components, terms, trackTermView, termsLoaded, preferences.enableTooltips])

  return <MDXRemote {...content} components={enhancedComponents} />
}