"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, MessageCircle, Trash2, Plus, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ChatSession {
  id: string
  title?: string
  createdAt: Date
  lastActivity: Date
  messageCount: number
}

interface ChatHistorySidebarProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onNewChat: () => void
  onDeleteSession: (sessionId: string) => void
  isExpanded: boolean
  onToggleExpanded: () => void
}

export function ChatHistorySidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isExpanded,
  onToggleExpanded,
}: ChatHistorySidebarProps) {
  const [hoveredSession, setHoveredSession] = useState<string | null>(null)
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null)

  return (
    <div 
      className={cn(
        "fixed top-0 h-screen bg-white border-r border-gray-200 shadow-lg transition-all duration-300 z-[60]",
        isExpanded ? "w-80" : "w-14"
      )}
      style={{
        // Position to the left of chat panel (chat panel is max-w-md = 28rem)
        right: '28rem', // Position directly to the left of the chat panel
      }}
    >
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-white">
          {isExpanded && (
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Chat History</h3>
            </div>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleExpanded}
            className={cn(
              "ml-auto bg-primary/10 hover:bg-primary/20 border-primary/20 transition-all hover:scale-110",
              !isExpanded && "mx-auto animate-pulse"
            )}
            title={isExpanded ? "Collapse history" : "Expand history"}
          >
            {isExpanded ? (
              <ChevronRight className="w-5 h-5 text-primary" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-primary" />
            )}
          </Button>
        </div>

        {/* New Chat Button */}
        <div className={cn("p-2 border-b", !isExpanded && "px-1")}>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onNewChat}
                  variant="default"
                  size={isExpanded ? "sm" : "icon"}
                  className={cn(
                    "w-full font-medium",
                    isExpanded ? "justify-start" : "justify-center px-0"
                  )}
                >
                  <Plus className={cn("w-4 h-4", isExpanded && "mr-2")} />
                  {isExpanded && <span>New Chat</span>}
                </Button>
              </TooltipTrigger>
              {!isExpanded && (
                <TooltipContent side="left">
                  <p>New Chat</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Sessions List */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {sessions.length === 0 ? (
              <div className={cn(
                "text-center text-gray-500",
                !isExpanded && "hidden"
              )}>
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              sessions.map((session) => (
                <TooltipProvider key={session.id} delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "relative group cursor-pointer rounded-lg transition-colors",
                          currentSessionId === session.id
                            ? "bg-primary/10"
                            : "hover:bg-gray-100",
                          !isExpanded && "flex justify-center"
                        )}
                        onClick={async () => {
                          setLoadingSessionId(session.id)
                          await onSelectSession(session.id)
                          setLoadingSessionId(null)
                        }}
                        onMouseEnter={() => setHoveredSession(session.id)}
                        onMouseLeave={() => setHoveredSession(null)}
                      >
                        <div className={cn(
                          "p-2",
                          isExpanded ? "pr-8" : "px-0"
                        )}>
                          {isExpanded ? (
                            <>
                              <h4 className="font-medium text-sm flex items-center">
                                {loadingSessionId === session.id && (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1 flex-shrink-0" />
                                )}
                                <span className="truncate">
                                  {session.title || "New conversation"}
                                </span>
                              </h4>
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDistanceToNow(new Date(session.lastActivity), { 
                                  addSuffix: true 
                                })}
                              </div>
                            </>
                          ) : (
                            loadingSessionId === session.id ? (
                              <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            ) : (
                              <MessageCircle className={cn(
                                "w-5 h-5",
                                currentSessionId === session.id
                                  ? "text-primary"
                                  : "text-gray-600"
                              )} />
                            )
                          )}
                        </div>
                        
                        {/* Delete Button */}
                        {isExpanded && hoveredSession === session.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteSession(session.id)
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TooltipTrigger>
                    {!isExpanded && (
                      <TooltipContent side="left">
                        <p>{session.title || "New conversation"}</p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(session.lastActivity), { 
                            addSuffix: true 
                          })}
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}