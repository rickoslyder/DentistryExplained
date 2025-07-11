'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList,
  CommandSeparator
} from '@/components/ui/command'
import { 
  Bold, 
  Italic, 
  Link2, 
  Code, 
  Quote, 
  List, 
  ListOrdered, 
  Heading1,
  Heading2,
  Heading3,
  Table,
  Image,
  AlertCircle,
  Pill,
  ImageIcon,
  CheckSquare,
  HelpCircle,
  FileText,
  Calculator,
  Video,
  DollarSign,
  Calendar,
  Clock,
  BookOpen
} from 'lucide-react'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCommand: (command: string, value?: any) => void
}

export function MDXCommandPalette({ open, onOpenChange, onCommand }: CommandPaletteProps) {
  const [search, setSearch] = useState('')

  const runCommand = useCallback((command: string, value?: any) => {
    onCommand(command, value)
    onOpenChange(false)
    setSearch('')
  }, [onCommand, onOpenChange])

  const commands = [
    // Text Formatting
    {
      group: 'Text Formatting',
      items: [
        { icon: Bold, label: 'Bold', command: 'bold', shortcut: '⌘B' },
        { icon: Italic, label: 'Italic', command: 'italic', shortcut: '⌘I' },
        { icon: Link2, label: 'Link', command: 'link', shortcut: '⌘K' },
        { icon: Code, label: 'Inline Code', command: 'code', shortcut: '⌘E' },
        { icon: Quote, label: 'Quote', command: 'quote', shortcut: '⌘>' },
      ]
    },
    // Headings
    {
      group: 'Headings',
      items: [
        { icon: Heading1, label: 'Heading 1', command: 'h1', shortcut: '⌘1' },
        { icon: Heading2, label: 'Heading 2', command: 'h2', shortcut: '⌘2' },
        { icon: Heading3, label: 'Heading 3', command: 'h3', shortcut: '⌘3' },
      ]
    },
    // Lists
    {
      group: 'Lists',
      items: [
        { icon: List, label: 'Bullet List', command: 'bullet-list' },
        { icon: ListOrdered, label: 'Numbered List', command: 'numbered-list' },
        { icon: CheckSquare, label: 'Checklist', command: 'checklist' },
      ]
    },
    // Dental Components
    {
      group: 'Dental Components',
      items: [
        { icon: AlertCircle, label: 'Alert Box', command: 'alert' },
        { icon: AlertCircle, label: 'Enhanced Alert (Collapsible)', command: 'alert-enhanced' },
        { icon: Pill, label: 'Medication Card', command: 'medication-card' },
        { icon: ImageIcon, label: 'Before/After Gallery', command: 'before-after' },
        { icon: CheckSquare, label: 'Appointment Checklist', command: 'checklist-appointment' },
        { icon: HelpCircle, label: 'Smart FAQ', command: 'smart-faq' },
        { icon: FileText, label: 'Symptom Scale', command: 'symptom-scale' },
        { icon: Table, label: 'Treatment Comparison', command: 'treatment-comparison' },
        { icon: FileText, label: 'Interactive Tooth Chart', command: 'tooth-chart' },
        { icon: Calendar, label: 'Branching Timeline', command: 'branching-timeline' },
        { icon: DollarSign, label: 'Enhanced Cost Table', command: 'enhanced-cost-table' },
      ]
    },
    // Content Blocks
    {
      group: 'Content Blocks',
      items: [
        { icon: Table, label: 'Table', command: 'table' },
        { icon: DollarSign, label: 'Cost Table', command: 'cost-table' },
        { icon: Calendar, label: 'Timeline', command: 'timeline' },
        { icon: Code, label: 'Code Block', command: 'code-block' },
        { icon: Video, label: 'Video Embed', command: 'video' },
        { icon: HelpCircle, label: 'FAQ', command: 'faq' },
        { icon: BookOpen, label: 'Insert Reference', command: 'reference' },
        { icon: List, label: 'Procedure Steps', command: 'procedure-steps' },
      ]
    },
    // Utility Components
    {
      group: 'Utility Components',
      items: [
        { icon: Calculator, label: 'Clinical Calculator', command: 'calculator' },
        { icon: Video, label: 'Video Consultation Card', command: 'video-consultation' },
        { icon: DollarSign, label: 'Insurance Info Box', command: 'insurance-info' },
      ]
    }
  ]

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Type a command or search..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {commands.map((group, groupIndex) => (
          <div key={groupIndex}>
            <CommandGroup heading={group.group}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.command}
                  onSelect={() => runCommand(item.command)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.shortcut && (
                    <span className="text-xs text-muted-foreground">{item.shortcut}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            {groupIndex < commands.length - 1 && <CommandSeparator />}
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  )
}