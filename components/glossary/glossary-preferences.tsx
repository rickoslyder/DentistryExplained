'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Settings2, BookOpen, Highlighter, GraduationCap } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useGlossaryPreferences } from '@/hooks/use-glossary-preferences'

export function GlossaryPreferences() {
  const { preferences, toggleTooltips, toggleBasicOnly, toggleHighlight, isLoaded } = useGlossaryPreferences()

  if (!isLoaded) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Glossary Settings</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Glossary Preferences</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="tooltips" className="flex items-center gap-2 cursor-pointer">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Enable Tooltips</div>
                  <div className="text-xs text-muted-foreground">Show definitions on hover</div>
                </div>
              </Label>
              <Switch
                id="tooltips"
                checked={preferences.enableTooltips}
                onCheckedChange={toggleTooltips}
              />
            </div>
            
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="highlight" className="flex items-center gap-2 cursor-pointer">
                <Highlighter className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Highlight Terms</div>
                  <div className="text-xs text-muted-foreground">Underline glossary terms</div>
                </div>
              </Label>
              <Switch
                id="highlight"
                checked={preferences.highlightTerms}
                onCheckedChange={toggleHighlight}
              />
            </div>
            
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="basic" className="flex items-center gap-2 cursor-pointer">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Basic Terms Only</div>
                  <div className="text-xs text-muted-foreground">Hide advanced terminology</div>
                </div>
              </Label>
              <Switch
                id="basic"
                checked={preferences.showOnlyBasicTerms}
                onCheckedChange={toggleBasicOnly}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}