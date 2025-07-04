"use client"

import { useState } from "react"
import { Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatPanel } from "./chat-panel"

export function AIAssistantButton() {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsChatOpen(true)}
        className="relative bg-primary hover:bg-primary/90 text-white"
        size="icon"
      >
        <Bot className="w-5 h-5" />
        <span className="sr-only">Open AI Assistant</span>

        {/* Pulse animation */}
        <span className="absolute -inset-1 rounded-full bg-primary/20 pulse-ring"></span>
      </Button>

      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  )
}
