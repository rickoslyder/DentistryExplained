'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Globe, Sparkles, Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface ChatSearchToggleProps {
  webSearchEnabled: boolean
  onToggle: (enabled: boolean) => void
  searchType: 'smart' | 'news' | 'research' | 'nhs'
  onSearchTypeChange: (type: 'smart' | 'news' | 'research' | 'nhs') => void
}

export function ChatSearchToggle({
  webSearchEnabled,
  onToggle,
  searchType,
  onSearchTypeChange
}: ChatSearchToggleProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2 flex-1">
        <Globe className={`h-4 w-4 ${webSearchEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
        <Label htmlFor="web-search" className="text-sm font-medium cursor-pointer">
          Search Web for Latest Info
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">
                Enable to search the web for current prices, NHS information, latest research, and news. 
                Uses Perplexity and Exa APIs for accurate, cited results.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Switch
        id="web-search"
        checked={webSearchEnabled}
        onCheckedChange={onToggle}
      />
      
      {webSearchEnabled && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Sparkles className="h-3 w-3" />
              {searchType === 'smart' && 'Smart Search'}
              {searchType === 'news' && 'News'}
              {searchType === 'research' && 'Research'}
              {searchType === 'nhs' && 'NHS Info'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Search Focus</h4>
              <div className="space-y-2">
                <Button
                  variant={searchType === 'smart' ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onSearchTypeChange('smart')}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Smart Search
                  <span className="text-xs text-muted-foreground ml-auto">Auto-detect</span>
                </Button>
                <Button
                  variant={searchType === 'news' ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onSearchTypeChange('news')}
                >
                  Latest News
                  <span className="text-xs text-muted-foreground ml-auto">Recent updates</span>
                </Button>
                <Button
                  variant={searchType === 'research' ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onSearchTypeChange('research')}
                >
                  Research Papers
                  <span className="text-xs text-muted-foreground ml-auto">Academic</span>
                </Button>
                <Button
                  variant={searchType === 'nhs' ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onSearchTypeChange('nhs')}
                >
                  NHS Information
                  <span className="text-xs text-muted-foreground ml-auto">Official UK</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Choose a search focus for more relevant results, or use Smart Search to auto-detect.
              </p>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}