import { Node, mergeAttributes } from '@tiptap/core'
import { Node as PMNode } from '@tiptap/pm/model'

export interface MDXComponentOptions {
  HTMLAttributes: Record<string, any>
  componentTypes: string[]
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mdxComponent: {
      /**
       * Insert an MDX component
       */
      insertMDXComponent: (componentType: string, attrs?: Record<string, any>) => ReturnType
    }
  }
}

/**
 * Extension to handle MDX components in TipTap
 */
export const MDXComponent = Node.create<MDXComponentOptions>({
  name: 'mdxComponent',

  addOptions() {
    return {
      HTMLAttributes: {},
      componentTypes: [
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
    }
  },

  group: 'block',

  content: 'inline*',

  addAttributes() {
    return {
      componentType: {
        default: 'Alert',
        parseHTML: element => element.getAttribute('data-component-type'),
        renderHTML: attributes => {
          if (!attributes.componentType) {
            return {}
          }
          return {
            'data-component-type': attributes.componentType,
          }
        },
      },
      componentProps: {
        default: {},
        parseHTML: element => {
          const props = element.getAttribute('data-component-props')
          if (props) {
            try {
              return JSON.parse(props)
            } catch {
              return {}
            }
          }
          return {}
        },
        renderHTML: attributes => {
          if (!attributes.componentProps || Object.keys(attributes.componentProps).length === 0) {
            return {}
          }
          return {
            'data-component-props': JSON.stringify(attributes.componentProps),
          }
        },
      },
    }
  },

  parseHTML() {
    return this.options.componentTypes.map(type => ({
      tag: `mdx-${type.toLowerCase()}`,
      attrs: { componentType: type }
    }))
  },

  renderHTML({ node, HTMLAttributes }) {
    const componentType = node.attrs.componentType || 'Alert'
    return [
      `mdx-${componentType.toLowerCase()}`,
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0
    ]
  },

  addCommands() {
    return {
      insertMDXComponent: (componentType: string, attrs?: Record<string, any>) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            componentType,
            componentProps: attrs || {}
          },
          content: []
        })
      }
    }
  }
})

/**
 * Extension for YAML frontmatter
 */
export const Frontmatter = Node.create({
  name: 'frontmatter',

  group: 'block',

  content: 'text*',

  marks: '',

  defining: true,

  isolating: true,

  addAttributes() {
    return {
      content: {
        default: '',
        parseHTML: element => element.textContent,
        renderHTML: attributes => {
          return {}
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'pre.frontmatter',
        preserveWhitespace: 'full',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'pre',
      mergeAttributes({ class: 'frontmatter' }, HTMLAttributes),
      ['code', { class: 'language-yaml' }, 0]
    ]
  },

  addKeyboardShortcuts() {
    return {
      // Prevent Enter from breaking out of frontmatter
      'Enter': () => {
        const { selection, doc } = this.editor.state
        const node = doc.nodeAt(selection.from - 1)
        
        if (node && node.type.name === 'frontmatter') {
          return this.editor.commands.insertContent('\n')
        }
        
        return false
      },
    }
  },
})