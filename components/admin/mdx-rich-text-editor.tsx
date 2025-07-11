'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import { MDXComponent, Frontmatter } from '@/lib/tiptap-mdx-extension'
import { convertMdxToHtml, convertHtmlToMdx } from '@/lib/mdx-html-converter'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  RemoveFormatting
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Toggle } from '@/components/ui/toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCallback, useEffect, useState } from 'react'
import { 
  Stethoscope,
  AlertCircle,
  Activity,
  DollarSign,
  HelpCircle,
  Calendar,
  ClipboardList,
  FileVideo,
  Package,
  Component
} from 'lucide-react'
import { FallbackMDXEditor } from './fallback-mdx-editor'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

// Fallback converter - Convert MDX to HTML for initial editor content
function convertMdxToHtmlFallback(mdx: string): string {
  let html = ''
  const lines = mdx.split('\n')
  let inFrontmatter = false
  let frontmatterContent = ''
  let i = 0
  
  // Process line by line
  while (i < lines.length) {
    const line = lines[i]
    
    // Handle frontmatter
    if (line === '---' && i === 0) {
      inFrontmatter = true
      frontmatterContent = '---\n'
      i++
      continue
    }
    
    if (inFrontmatter && line === '---') {
      inFrontmatter = false
      frontmatterContent += '---'
      html += `<pre><code>${frontmatterContent}</code></pre>\n\n`
      i++
      continue
    }
    
    if (inFrontmatter) {
      frontmatterContent += line + '\n'
      i++
      continue
    }
    
    // Skip empty lines but preserve them in output
    if (line.trim() === '') {
      html += '<p><br></p>\n'
      i++
      continue
    }
    
    // Convert headings - must be at start of line
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = headingMatch[2]
      html += `<h${level}>${text}</h${level}>\n`
      i++
      continue
    }
    
    // Convert lists
    if (line.match(/^[-*]\s/)) {
      const items = []
      while (i < lines.length && lines[i].match(/^[-*]\s/)) {
        items.push(`<li>${lines[i].replace(/^[-*]\s+/, '')}</li>`)
        i++
      }
      html += `<ul>\n${items.join('\n')}\n</ul>\n`
      continue
    }
    
    if (line.match(/^\d+\.\s/)) {
      const items = []
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(`<li>${lines[i].replace(/^\d+\.\s+/, '')}</li>`)
        i++
      }
      html += `<ol>\n${items.join('\n')}\n</ol>\n`
      continue
    }
    
    // Convert blockquotes
    if (line.match(/^>/)) {
      html += `<blockquote>${line.replace(/^>\s?/, '')}</blockquote>\n`
      i++
      continue
    }
    
    // Check if it's an MDX component
    if (line.trim().match(/^<[A-Z]/)) {
      html += line + '\n'
      i++
      continue
    }
    
    // Process inline elements in the line
    let processedLine = line
    
    // Convert bold
    processedLine = processedLine.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    
    // Convert italic  
    processedLine = processedLine.replace(/\*([^*]+)\*/g, '<em>$1</em>')
    
    // Convert code
    processedLine = processedLine.replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // Convert links
    processedLine = processedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    
    // Convert images
    processedLine = processedLine.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    
    // Wrap in paragraph
    html += `<p>${processedLine}</p>\n`
    i++
  }
  
  return html.trim()
}

export function MDXRichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  className
}: RichTextEditorProps) {
  const [isConverting, setIsConverting] = useState(false)
  const [initialContent, setInitialContent] = useState<string>('')
  const [criticalError, setCriticalError] = useState<string | null>(null)

  // Convert MDX to HTML on mount and value changes
  useEffect(() => {
    const performConversion = async () => {
      if (!value) {
        setInitialContent('')
        setIsConverting(false)
        return
      }

      setIsConverting(true)
      setCriticalError(null)
      try {
        const html = await convertMdxToHtml(value)
        setInitialContent(html)
      } catch (err: any) {
        console.error('Failed to convert MDX to HTML:', err)
        // Fallback to the local converter for basic MDX
        try {
          const fallbackHtml = convertMdxToHtmlFallback(value)
          setInitialContent(fallbackHtml)
        } catch (fallbackErr: any) {
          console.error('Fallback conversion also failed:', fallbackErr)
          // Set critical error to show fallback editor
          setCriticalError(
            `The rich text editor encountered an error: ${err.message || 'Unknown error'}. ` +
            `Using plain text editor as fallback.`
          )
        }
      } finally {
        setIsConverting(false)
      }
    }

    performConversion()
  }, [value])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        codeBlock: false // We'll use Frontmatter for YAML
      }),
      Frontmatter,
      MDXComponent,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer'
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg'
        }
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Highlight.configure({
        multicolor: true
      }),
      Typography,
      Placeholder.configure({
        placeholder
      })
    ],
    content: initialContent,
    onUpdate: async ({ editor }) => {
      // Convert to MDX format
      const html = editor.getHTML()
      try {
        const mdx = await convertHtmlToMdx(html)
        onChange(mdx)
      } catch (err) {
        console.error('Failed to convert HTML to MDX:', err)
        // Fallback to local converter
        try {
          const fallbackMdx = convertHtmlToMdxFallback(html)
          onChange(fallbackMdx)
        } catch (fallbackErr) {
          console.error('Fallback HTML to MDX conversion failed:', fallbackErr)
          // Last resort: preserve the HTML as-is
          onChange(html)
        }
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4'
      }
    }
  })

  const setLink = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) return

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return

    const url = window.prompt('Image URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addTable = useCallback(() => {
    if (!editor) return

    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  const insertMDXComponent = useCallback((componentType: string) => {
    if (!editor) return

    const componentMap: Record<string, { type: string; props: Record<string, any> }> = {
      'alert': {
        type: 'Alert',
        props: { type: 'info' }
      },
      'tooth-diagram': {
        type: 'ToothDiagram',
        props: { teeth: [{ number: 11, status: "healthy" }] }
      },
      'timeline': {
        type: 'Timeline',
        props: {}
      },
      'cost-table': {
        type: 'CostTable',
        props: { costs: [{ item: "Treatment", cost: "£100", nhs: true }] }
      },
      'faq': {
        type: 'FAQ',
        props: { question: "Your question here?" }
      },
      'procedure-steps': {
        type: 'ProcedureSteps',
        props: { steps: [{ title: "Step 1", description: "Description" }] }
      },
      'video-embed': {
        type: 'VideoEmbed',
        props: { url: "https://youtube.com/watch?v=...", title: "Video Title" }
      },
      'medication-card': {
        type: 'MedicationCard',
        props: { name: "Medication Name", dosage: "Dosage", frequency: "Frequency", duration: "Duration" }
      },
      'symptom-scale': {
        type: 'SymptomSeverityScale',
        props: { title: "Pain Level" }
      },
      'treatment-comparison': {
        type: 'TreatmentComparisonTable',
        props: {
          option1: { name: "Option 1", pros: ["Pro 1"], cons: ["Con 1"] },
          option2: { name: "Option 2", pros: ["Pro 2"], cons: ["Con 2"] }
        }
      }
    }

    try {
      const component = componentMap[componentType]
      if (component) {
        // Insert as an MDX component node
        editor.chain().focus().insertMDXComponent(component.type, component.props).run()
      } else {
        console.warn(`Unknown component type: ${componentType}`)
      }
    } catch (err) {
      console.error(`Failed to insert MDX component ${componentType}:`, err)
      // Fallback: insert as plain text
      const component = componentMap[componentType]
      if (component) {
        const mdxText = `<${component.type} ${Object.entries(component.props)
          .map(([key, value]) => `${key}={${JSON.stringify(value)}}`)
          .join(' ')} />`
        editor.chain().focus().insertContent(mdxText).run()
      }
    }
  }, [editor])

  // Update editor content when initialContent changes
  useEffect(() => {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent)
    }
  }, [initialContent, editor])

  // Show fallback editor if there's a critical error
  if (criticalError) {
    return (
      <FallbackMDXEditor
        value={value}
        onChange={onChange}
        error={criticalError}
        className={className}
      />
    )
  }

  if (!editor || isConverting) {
    return (
      <div className={cn('border rounded-lg overflow-hidden bg-gray-50 animate-pulse', className)}>
        <div className="h-96 flex items-center justify-center text-muted-foreground">
          Loading editor...
        </div>
      </div>
    )
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="border-b bg-muted/50 p-1 flex items-center gap-1 flex-wrap">
        {/* Text formatting */}
        <div className="flex items-center gap-1">
          <Toggle
            size="sm"
            pressed={editor.isActive('bold')}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            aria-label="Toggle bold"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('italic')}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Toggle italic"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('strike')}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            aria-label="Toggle strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('code')}
            onPressedChange={() => editor.chain().focus().toggleCode().run()}
            aria-label="Toggle code"
          >
            <Code className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('highlight')}
            onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
            aria-label="Toggle highlight"
          >
            <Highlighter className="h-4 w-4" />
          </Toggle>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Headings */}
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Pilcrow className="h-4 w-4 mr-1" />
                Paragraph
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
                <Pilcrow className="h-4 w-4 mr-2" />
                Paragraph
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                <Heading1 className="h-4 w-4 mr-2" />
                Heading 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <Heading2 className="h-4 w-4 mr-2" />
                Heading 2
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                <Heading3 className="h-4 w-4 mr-2" />
                Heading 3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Lists */}
        <div className="flex items-center gap-1">
          <Toggle
            size="sm"
            pressed={editor.isActive('bulletList')}
            onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Toggle bullet list"
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('orderedList')}
            onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="Toggle ordered list"
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('blockquote')}
            onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
            aria-label="Toggle blockquote"
          >
            <Quote className="h-4 w-4" />
          </Toggle>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Insert */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={setLink}
            className={cn(editor.isActive('link') && 'bg-muted')}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={addImage}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={addTable}
          >
            <TableIcon className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* MDX Components */}
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Component className="h-4 w-4 mr-1" />
                Components
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => insertMDXComponent('alert')}>
                <AlertCircle className="mr-2 h-4 w-4" />
                <span>Alert</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertMDXComponent('tooth-diagram')}>
                <Stethoscope className="mr-2 h-4 w-4" />
                <span>Tooth Diagram</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertMDXComponent('timeline')}>
                <Calendar className="mr-2 h-4 w-4" />
                <span>Timeline</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertMDXComponent('cost-table')}>
                <DollarSign className="mr-2 h-4 w-4" />
                <span>Cost Table</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertMDXComponent('faq')}>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>FAQ</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertMDXComponent('procedure-steps')}>
                <ClipboardList className="mr-2 h-4 w-4" />
                <span>Procedure Steps</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertMDXComponent('video-embed')}>
                <FileVideo className="mr-2 h-4 w-4" />
                <span>Video Embed</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertMDXComponent('medication-card')}>
                <Package className="mr-2 h-4 w-4" />
                <span>Medication Card</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertMDXComponent('symptom-scale')}>
                <Activity className="mr-2 h-4 w-4" />
                <span>Symptom Scale</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertMDXComponent('treatment-comparison')}>
                <TableIcon className="mr-2 h-4 w-4" />
                <span>Treatment Comparison</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* History */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Clear formatting */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
        >
          <RemoveFormatting className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div className="bg-background">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

// Fallback HTML to MDX converter
function convertHtmlToMdxFallback(html: string): string {
  // This is a simplified converter. In production, you'd want a more robust solution
  let mdx = html
  
  // Convert code blocks with frontmatter back to YAML frontmatter
  mdx = mdx.replace(/<pre><code>---\n([\s\S]*?)---<\/code><\/pre>/g, (match, content) => {
    return `---\n${content}---`
  })
  
  // Preserve MDX components (don't convert them)
  const mdxComponentRegex = /<(Alert|ToothDiagram|Timeline|TimelineItem|CostTable|FAQ|ProcedureSteps|VideoEmbed|MedicationCard|SymptomSeverityScale|TreatmentComparisonTable)[^>]*>[\s\S]*?<\/\1>|<(Alert|ToothDiagram|Timeline|TimelineItem|CostTable|FAQ|ProcedureSteps|VideoEmbed|MedicationCard|SymptomSeverityScale|TreatmentComparisonTable)[^>]*\/>/g
  const mdxComponents: string[] = []
  let componentIndex = 0
  
  // Extract MDX components and replace with placeholders
  mdx = mdx.replace(mdxComponentRegex, (match) => {
    const placeholder = `__MDX_COMPONENT_${componentIndex}__`
    mdxComponents[componentIndex] = match
    componentIndex++
    return placeholder
  })
  
  // Convert headings
  mdx = mdx.replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1\n')
  mdx = mdx.replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n')
  mdx = mdx.replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n')
  
  // Convert paragraphs
  mdx = mdx.replace(/<p[^>]*>(.*?)<\/p>/g, (match, content) => {
    // Handle empty paragraphs or those with just <br>
    if (content === '<br>' || content === '<br/>' || content === '<br />') {
      return '\n'
    }
    return content ? `${content}\n\n` : '\n'
  })
  
  // Convert bold and italic
  mdx = mdx.replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
  mdx = mdx.replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*')
  
  // Convert code
  mdx = mdx.replace(/<code[^>]*>(.*?)<\/code>/g, '`$1`')
  
  // Convert links
  mdx = mdx.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
  
  // Convert images
  mdx = mdx.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g, '![$2]($1)')
  
  // Convert lists
  mdx = mdx.replace(/<ul[^>]*>(.*?)<\/ul>/gs, (match, content) => {
    return content.replace(/<li[^>]*>(.*?)<\/li>/g, '- $1\n')
  })
  
  mdx = mdx.replace(/<ol[^>]*>(.*?)<\/ol>/gs, (match, content) => {
    let counter = 1
    return content.replace(/<li[^>]*>(.*?)<\/li>/g, () => {
      return `${counter++}. $1\n`
    })
  })
  
  // Convert blockquotes
  mdx = mdx.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gs, (match, content) => {
    return content.trim().split('\n').map((line: string) => `> ${line}`).join('\n') + '\n\n'
  })
  
  // Convert strikethrough
  mdx = mdx.replace(/<s[^>]*>(.*?)<\/s>/g, '~~$1~~')
  mdx = mdx.replace(/<del[^>]*>(.*?)<\/del>/g, '~~$1~~')
  
  // Convert highlights
  mdx = mdx.replace(/<mark[^>]*>(.*?)<\/mark>/g, '==$1==')
  
  // Remove remaining HTML tags (but not MDX placeholders)
  mdx = mdx.replace(/<(?!__MDX_COMPONENT_)[^>]+>/g, '')
  
  // Restore MDX components
  mdxComponents.forEach((component, index) => {
    mdx = mdx.replace(`__MDX_COMPONENT_${index}__`, component)
  })
  
  // Clean up extra whitespace
  mdx = mdx.replace(/\n{3,}/g, '\n\n')
  mdx = mdx.trim()
  
  return mdx
}