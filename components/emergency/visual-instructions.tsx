"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Eye, Printer } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface InstructionStep {
  title: string
  description: string
  illustration: React.ReactNode
  tips?: string[]
}

interface VisualInstructionsProps {
  emergencyType: 'knocked-out-tooth' | 'bleeding-control' | 'cold-compress'
  className?: string
}

const instructionSets: Record<string, InstructionStep[]> = {
  'knocked-out-tooth': [
    {
      title: "Step 1: Find and Handle the Tooth",
      description: "Pick up the tooth by the crown (top part) only. Never touch the root.",
      illustration: (
        <svg viewBox="0 0 300 300" className="w-full h-auto" aria-label="Illustration showing proper tooth handling technique">
          {/* Background with gradient */}
          <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f0f9ff" />
              <stop offset="100%" stopColor="#e0f2fe" />
            </linearGradient>
            <filter id="dropShadow">
              <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.1"/>
            </filter>
          </defs>
          <rect width="300" height="300" fill="url(#bgGradient)"/>
          
          {/* Cartoon hand with proper grip indicators */}
          <g filter="url(#dropShadow)">
            {/* Palm */}
            <ellipse cx="100" cy="150" rx="50" ry="60" fill="#fdbcb4" stroke="#e0a899" strokeWidth="2"/>
            {/* Thumb */}
            <ellipse cx="65" cy="130" rx="15" ry="25" fill="#fdbcb4" stroke="#e0a899" strokeWidth="2" transform="rotate(-30 65 130)"/>
            {/* Index finger */}
            <rect x="85" y="90" width="20" height="40" fill="#fdbcb4" stroke="#e0a899" strokeWidth="2" rx="10"/>
            {/* Middle finger */}
            <rect x="110" y="85" width="20" height="45" fill="#fdbcb4" stroke="#e0a899" strokeWidth="2" rx="10"/>
          </g>
          
          {/* Simplified tooth with clear sections */}
          <g filter="url(#dropShadow)">
            {/* Crown - made larger and more visible */}
            <path d="M90 50 Q90 20 110 20 Q130 20 130 50 L125 80 L95 80 Z" fill="#ffffff" stroke="#2563eb" strokeWidth="3"/>
            {/* Root - clearly distinguished */}
            <path d="M95 80 L125 80 L120 130 L115 150 L105 150 L100 130 Z" fill="#ffedd5" stroke="#dc2626" strokeWidth="3" strokeDasharray="5,3"/>
          </g>
          
          {/* Visual indicators */}
          {/* Green checkmark on crown */}
          <circle cx="110" cy="50" r="20" fill="#10b981" fillOpacity="0.2"/>
          <path d="M100 50 L105 55 L120 40" stroke="#10b981" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          
          {/* Red X on root */}
          <circle cx="110" cy="115" r="20" fill="#dc2626" fillOpacity="0.2"/>
          <path d="M100 105 L120 125 M120 105 L100 125" stroke="#dc2626" strokeWidth="4" strokeLinecap="round"/>
          
          {/* Clear labels with backgrounds */}
          <rect x="150" y="40" width="80" height="25" fill="#10b981" rx="12"/>
          <text x="190" y="57" textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">HOLD HERE</text>
          
          <rect x="150" y="105" width="100" height="25" fill="#dc2626" rx="12"/>
          <text x="200" y="122" textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">DON'T TOUCH</text>
          
          {/* Timer reminder */}
          <g transform="translate(220, 200)">
            <circle cx="0" cy="0" r="35" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2"/>
            <text x="0" y="-5" textAnchor="middle" fontSize="20" fill="#7c2d12" fontWeight="bold">30</text>
            <text x="0" y="10" textAnchor="middle" fontSize="12" fill="#7c2d12">minutes</text>
          </g>
        </svg>
      ),
      tips: [
        "⚡ Act within 30 minutes for best chance of saving the tooth",
        "🧤 Use clean hands or gloves if available",
        "⚠️ Never touch the root - it contains delicate cells needed for reattachment"
      ]
    },
    {
      title: "Step 2: Rinse if Necessary",
      description: "If the tooth is dirty, rinse it gently with milk or saline solution for 10 seconds.",
      illustration: (
        <svg viewBox="0 0 300 300" className="w-full h-auto" aria-label="Illustration showing proper tooth rinsing technique">
          <defs>
            <linearGradient id="milkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f3f4f6" />
            </linearGradient>
            <filter id="milkShadow">
              <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.15"/>
            </filter>
          </defs>
          <rect width="300" height="300" fill="#f0f9ff"/>
          
          {/* Milk carton - more realistic */}
          <g filter="url(#milkShadow)">
            <path d="M80 100 L80 220 L140 220 L140 100 L120 80 L100 80 Z" fill="url(#milkGradient)" stroke="#3b82f6" strokeWidth="2"/>
            <path d="M100 80 L100 100 L120 100" fill="none" stroke="#3b82f6" strokeWidth="2"/>
            <rect x="95" y="130" width="30" height="40" fill="#3b82f6" rx="5"/>
            <text x="110" y="155" textAnchor="middle" fontSize="16" fill="white" fontWeight="bold">MILK</text>
          </g>
          
          {/* Tooth being rinsed - animated feel */}
          <g transform="translate(110, 50)">
            <path d="M-10 0 Q-10 -20 10 -20 Q30 -20 30 0 L25 20 L-5 20 Z" fill="#ffffff" stroke="#2563eb" strokeWidth="3"/>
            <path d="M-5 20 L25 20 L20 40 L15 50 L5 50 L0 40 Z" fill="#ffedd5" stroke="#2563eb" strokeWidth="3"/>
          </g>
          
          {/* Milk drops with motion */}
          <g>
            <ellipse cx="105" cy="85" rx="8" ry="12" fill="#60a5fa" opacity="0.6" transform="rotate(15 105 85)"/>
            <ellipse cx="115" cy="95" rx="6" ry="10" fill="#60a5fa" opacity="0.5" transform="rotate(-10 115 95)"/>
            <ellipse cx="110" cy="105" rx="7" ry="11" fill="#60a5fa" opacity="0.4" transform="rotate(5 110 105)"/>
          </g>
          
          {/* Visual guide for gentleness */}
          <g transform="translate(200, 80)">
            <rect x="-40" y="-20" width="80" height="40" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" rx="20"/>
            <text x="0" y="5" textAnchor="middle" fontSize="14" fill="#78350f" fontWeight="bold">GENTLY</text>
          </g>
          
          {/* Timer */}
          <g transform="translate(50, 50)">
            <circle cx="0" cy="0" r="25" fill="#e0e7ff" stroke="#6366f1" strokeWidth="2"/>
            <text x="0" y="5" textAnchor="middle" fontSize="16" fill="#4338ca" fontWeight="bold">10 sec</text>
          </g>
          
          {/* DO NOT section */}
          <g transform="translate(150, 240)">
            <rect x="-70" y="-15" width="140" height="30" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" rx="15"/>
            <path d="M-60 0 L-40 0 M-50 -10 L-50 10" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" transform="rotate(45 -50 0)"/>
            <text x="0" y="5" textAnchor="middle" fontSize="12" fill="#7f1d1d" fontWeight="bold">NO TAP WATER</text>
          </g>
        </svg>
      ),
      tips: [
        "🥛 Milk preserves the tooth's root cells best",
        "⏱️ Rinse for exactly 10 seconds - no more, no less",
        "❌ Tap water damages the delicate root cells",
        "💧 If no milk: use saline solution or saliva"
      ]
    },
    {
      title: "Step 3: Try to Reinsert",
      description: "Gently push the tooth back into its socket if possible. Have the person bite on gauze to hold it.",
      illustration: (
        <svg viewBox="0 0 300 300" className="w-full h-auto" aria-label="Illustration showing tooth reinsertion technique">
          <defs>
            <radialGradient id="socketGradient" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#ef4444" />
            </radialGradient>
          </defs>
          <rect width="300" height="300" fill="#fef2f2"/>
          
          {/* Jaw cross-section with gums */}
          <g filter="url(#dropShadow)">
            {/* Gum tissue */}
            <path d="M50 120 Q50 80 150 80 Q250 80 250 120 L250 180 Q250 220 150 220 Q50 220 50 180 Z" 
                  fill="#fecaca" stroke="#f87171" strokeWidth="2"/>
            {/* Teeth outline */}
            <rect x="80" y="100" width="25" height="40" fill="white" stroke="#d1d5db" strokeWidth="1" rx="5"/>
            <rect x="115" y="100" width="25" height="40" fill="white" stroke="#d1d5db" strokeWidth="1" rx="5"/>
            {/* Empty socket - highlighted */}
            <ellipse cx="150" cy="120" rx="15" ry="20" fill="url(#socketGradient)" stroke="#b91c1c" strokeWidth="2"/>
            <rect x="165" y="100" width="25" height="40" fill="white" stroke="#d1d5db" strokeWidth="1" rx="5"/>
            <rect x="200" y="100" width="25" height="40" fill="white" stroke="#d1d5db" strokeWidth="1" rx="5"/>
          </g>
          
          {/* Tooth with proper positioning guide */}
          <g transform="translate(150, 40)">
            <path d="M-15 0 Q-15 -20 0 -20 Q15 -20 15 0 L10 20 L-10 20 Z" 
                  fill="#ffffff" stroke="#2563eb" strokeWidth="3"/>
            <path d="M-10 20 L10 20 L7 40 L0 45 L-7 40 Z" 
                  fill="#ffedd5" stroke="#2563eb" strokeWidth="3"/>
          </g>
          
          {/* Animated arrow showing gentle pressure */}
          <g>
            <path d="M150 65 L150 95" stroke="#2563eb" strokeWidth="4" strokeLinecap="round"/>
            <polygon points="140,90 150,100 160,90" fill="#2563eb"/>
            {/* Gentle indicator */}
            <text x="180" y="80" fontSize="14" fill="#1e40af" fontWeight="bold">GENTLE</text>
          </g>
          
          {/* Gauze placement indicator */}
          <g transform="translate(80, 180)">
            <rect x="0" y="0" width="140" height="20" fill="white" stroke="#6b7280" strokeWidth="2" rx="5" strokeDasharray="3,3"/>
            <line x1="20" y1="10" x2="120" y2="10" stroke="#d1d5db" strokeWidth="1"/>
            <line x1="35" y1="5" x2="35" y2="15" stroke="#d1d5db" strokeWidth="1"/>
            <line x1="70" y1="5" x2="70" y2="15" stroke="#d1d5db" strokeWidth="1"/>
            <line x1="105" y1="5" x2="105" y2="15" stroke="#d1d5db" strokeWidth="1"/>
            <text x="70" y="35" textAnchor="middle" fontSize="12" fill="#374151">Clean Gauze</text>
          </g>
          
          {/* Success indicator */}
          <g transform="translate(240, 160)">
            <circle cx="0" cy="0" r="20" fill="#10b981" fillOpacity="0.2"/>
            <path d="M-10 0 L-3 7 L10 -6" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
          
          {/* Warning */}
          <g transform="translate(150, 250)">
            <rect x="-80" y="-15" width="160" height="30" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" rx="15"/>
            <text x="0" y="5" textAnchor="middle" fontSize="12" fill="#78350f" fontWeight="bold">Don't force if resistant!</text>
          </g>
        </svg>
      ),
      tips: [
        "👐 Use steady, gentle pressure - never force",
        "🦷 Make sure tooth is facing the right direction",
        "🩹 Bite down on gauze to stabilize",
        "🚨 Get to dentist immediately after reinsertion"
      ]
    },
    {
      title: "Step 4: Store if Reinsertion Fails",
      description: "If you can't reinsert, store the tooth in milk or between cheek and gum.",
      illustration: (
        <svg viewBox="0 0 300 300" className="w-full h-auto" aria-label="Illustration showing tooth storage options">
          <rect width="300" height="300" fill="#f0fdf4"/>
          
          {/* Option 1: Milk storage - Best option */}
          <g transform="translate(75, 50)">
            {/* Best option badge */}
            <rect x="-20" y="-5" width="80" height="25" fill="#10b981" rx="12"/>
            <text x="20" y="10" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">BEST OPTION</text>
            
            {/* Glass of milk */}
            <g filter="url(#milkShadow)">
              <path d="M0 40 L0 120 Q0 130 10 130 L30 130 Q40 130 40 120 L40 40 Z" 
                    fill="url(#milkGradient)" stroke="#3b82f6" strokeWidth="2"/>
              <ellipse cx="20" cy="40" rx="20" ry="5" fill="#e0e7ff" stroke="#3b82f6" strokeWidth="2"/>
            </g>
            
            {/* Tooth floating in milk */}
            <g transform="translate(20, 70)">
              <path d="M-5 0 Q-5 -8 0 -8 Q5 -8 5 0 L3 8 L-3 8 Z" fill="white" stroke="#2563eb" strokeWidth="2"/>
              <circle cx="0" cy="-10" r="2" fill="#60a5fa" opacity="0.6"/>
              <circle cx="-5" cy="-5" r="1.5" fill="#60a5fa" opacity="0.5"/>
              <circle cx="5" cy="-7" r="1" fill="#60a5fa" opacity="0.4"/>
            </g>
          </g>
          
          {/* Central OR divider */}
          <g transform="translate(150, 100)">
            <circle cx="0" cy="0" r="25" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2"/>
            <text x="0" y="5" textAnchor="middle" fontSize="16" fill="#78350f" fontWeight="bold">OR</text>
          </g>
          
          {/* Option 2: Cheek storage */}
          <g transform="translate(180, 50)">
            {/* Second best badge */}
            <rect x="-10" y="-5" width="80" height="25" fill="#f59e0b" rx="12"/>
            <text x="30" y="10" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">2ND CHOICE</text>
            
            {/* Mouth cross-section */}
            <g transform="translate(0, 40)">
              <ellipse cx="40" cy="40" rx="50" ry="35" fill="#fecaca" stroke="#f87171" strokeWidth="2"/>
              {/* Lips */}
              <path d="M-10 40 Q40 30 90 40" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round"/>
              {/* Cheek area highlighted */}
              <ellipse cx="15" cy="50" rx="20" ry="15" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,3"/>
              {/* Tooth placement */}
              <ellipse cx="15" cy="50" rx="6" ry="8" fill="white" stroke="#2563eb" strokeWidth="2"/>
              {/* Arrow pointing to correct spot */}
              <path d="M15 25 L15 35" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrowOrange)"/>
              <text x="15" y="20" textAnchor="middle" fontSize="10" fill="#92400e">Between cheek & gum</text>
            </g>
          </g>
          
          {/* Timer reminder - Critical! */}
          <g transform="translate(150, 200)">
            <rect x="-80" y="-25" width="160" height="50" fill="#fee2e2" stroke="#dc2626" strokeWidth="3" rx="25"/>
            <text x="0" y="-5" textAnchor="middle" fontSize="18" fill="#dc2626" fontWeight="bold">⏰ 30 MINUTES</text>
            <text x="0" y="15" textAnchor="middle" fontSize="12" fill="#7f1d1d">to save the tooth!</text>
          </g>
          
          {/* DON'T section */}
          <g transform="translate(150, 260)">
            <rect x="-60" y="-15" width="120" height="30" fill="#1f2937" rx="15"/>
            <path d="M-45 0 L-30 0 M-37.5 -7.5 L-37.5 7.5" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" transform="rotate(45 -37.5 0)"/>
            <text x="5" y="5" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">NO WATER!</text>
          </g>
          
          <defs>
            <marker id="arrowOrange" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b"/>
            </marker>
          </defs>
        </svg>
      ),
      tips: [
        "🥛 Milk is best - keeps root cells alive",
        "👄 If no milk: place between cheek and gum (adult only)",
        "⏰ Every minute counts - get to dentist NOW",
        "💧 NEVER use water - it kills the root cells",
        "🧊 Don't freeze or put on ice"
      ]
    }
  ],
  'bleeding-control': [
    {
      title: "Step 1: Apply Direct Pressure",
      description: "Use clean gauze or cloth and apply firm, continuous pressure to the bleeding area.",
      illustration: (
        <svg viewBox="0 0 300 300" className="w-full h-auto" aria-label="Illustration showing how to apply pressure to stop bleeding">
          <rect width="300" height="300" fill="#fef2f2"/>
          
          {/* Face profile with clear mouth area */}
          <g filter="url(#dropShadow)">
            <ellipse cx="150" cy="150" rx="80" ry="90" fill="#fecaca" stroke="#f87171" strokeWidth="2"/>
            {/* Eye */}
            <circle cx="120" cy="120" r="8" fill="#1f2937"/>
            <circle cx="122" cy="118" r="2" fill="white"/>
            {/* Nose */}
            <path d="M100 150 Q90 160 95 165" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
            {/* Mouth area - highlighted */}
            <ellipse cx="130" cy="180" rx="35" ry="25" fill="#fee2e2" stroke="#dc2626" strokeWidth="2"/>
          </g>
          
          {/* Bleeding spot indicator */}
          <g>
            <circle cx="130" cy="180" r="20" fill="#dc2626" opacity="0.3">
              <animate attributeName="r" values="20;25;20" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="130" cy="180" r="10" fill="#dc2626" opacity="0.6"/>
          </g>
          
          {/* Hand with proper positioning */}
          <g filter="url(#dropShadow)" transform="translate(100, 140)">
            {/* Thumb */}
            <ellipse cx="10" cy="30" rx="12" ry="20" fill="#fdbcb4" stroke="#e0a899" strokeWidth="2" transform="rotate(-45 10 30)"/>
            {/* Index finger applying pressure */}
            <rect x="20" y="10" width="25" height="50" fill="#fdbcb4" stroke="#e0a899" strokeWidth="2" rx="12"/>
            {/* Pressure point indicator */}
            <circle cx="32" cy="40" r="8" fill="#2563eb" fillOpacity="0.3"/>
            <circle cx="32" cy="40" r="4" fill="#2563eb"/>
          </g>
          
          {/* Gauze pad - detailed */}
          <g transform="translate(115, 165)">
            <rect x="0" y="0" width="30" height="30" fill="white" stroke="#6b7280" strokeWidth="2" rx="3"/>
            {/* Gauze texture */}
            <line x1="5" y1="15" x2="25" y2="15" stroke="#e5e7eb" strokeWidth="1"/>
            <line x1="15" y1="5" x2="15" y2="25" stroke="#e5e7eb" strokeWidth="1"/>
            <line x1="8" y1="8" x2="22" y2="22" stroke="#e5e7eb" strokeWidth="0.5"/>
            <line x1="22" y1="8" x2="8" y2="22" stroke="#e5e7eb" strokeWidth="0.5"/>
          </g>
          
          {/* Pressure direction arrows */}
          <g>
            <path d="M130 120 L130 150" stroke="#2563eb" strokeWidth="4" markerEnd="url(#pressureArrow)"/>
            <text x="150" y="135" fontSize="14" fill="#1e40af" fontWeight="bold">FIRM</text>
          </g>
          
          {/* Timer */}
          <g transform="translate(240, 80)">
            <circle cx="0" cy="0" r="30" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2"/>
            <text x="0" y="-5" textAnchor="middle" fontSize="16" fill="#1e40af" fontWeight="bold">10-15</text>
            <text x="0" y="10" textAnchor="middle" fontSize="12" fill="#1e40af">minutes</text>
          </g>
          
          {/* DO NOT peek reminder */}
          <g transform="translate(150, 250)">
            <rect x="-70" y="-15" width="140" height="30" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" rx="15"/>
            <text x="0" y="5" textAnchor="middle" fontSize="12" fill="#78350f" fontWeight="bold">Don't keep checking!</text>
          </g>
          
          <defs>
            <marker id="pressureArrow" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#2563eb"/>
            </marker>
          </defs>
        </svg>
      ),
      tips: [
        "⏱️ Hold for full 10-15 minutes without peeking",
        "✋ Apply firm, steady pressure - not too hard",
        "🧻 Use clean gauze, tissue, or cloth",
        "🩸 Some oozing is normal - don't panic"
      ]
    },
    {
      title: "Step 2: Bite Down on Gauze",
      description: "Fold gauze into a thick pad and bite down firmly to maintain pressure.",
      illustration: (
        <svg viewBox="0 0 300 300" className="w-full h-auto" aria-label="Illustration showing proper gauze biting technique">
          <rect width="300" height="300" fill="#fef2f2"/>
          
          {/* Side profile of jaw */}
          <g filter="url(#dropShadow)">
            {/* Upper jaw with teeth */}
            <path d="M50 100 Q50 70 150 70 Q250 70 250 100 L250 120 L50 120 Z" 
                  fill="#fecaca" stroke="#f87171" strokeWidth="2"/>
            {/* Individual teeth - upper */}
            <rect x="80" y="95" width="20" height="25" fill="white" stroke="#d1d5db" strokeWidth="1" rx="3"/>
            <rect x="105" y="95" width="20" height="25" fill="white" stroke="#d1d5db" strokeWidth="1" rx="3"/>
            <rect x="130" y="95" width="20" height="25" fill="white" stroke="#d1d5db" strokeWidth="1" rx="3"/>
            <rect x="155" y="95" width="20" height="25" fill="white" stroke="#d1d5db" strokeWidth="1" rx="3"/>
            <rect x="180" y="95" width="20" height="25" fill="white" stroke="#d1d5db" strokeWidth="1" rx="3"/>
            
            {/* Lower jaw with teeth */}
            <path d="M50 180 L250 180 L250 200 Q250 230 150 230 Q50 230 50 200 Z" 
                  fill="#fecaca" stroke="#f87171" strokeWidth="2"/>
            {/* Individual teeth - lower */}
            <rect x="80" y="155" width="20" height="25" fill="white" stroke="#d1d5db" strokeWidth="1" rx="3"/>
            <rect x="105" y="155" width="20" height="25" fill="white" stroke="#d1d5db" strokeWidth="1" rx="3"/>
            <rect x="130" y="155" width="20" height="25" fill="white" stroke="#d1d5db" strokeWidth="1" rx="3"/>
            <rect x="155" y="155" width="20" height="25" fill="white" stroke="#d1d5db" strokeWidth="1" rx="3"/>
            <rect x="180" y="155" width="20" height="25" fill="white" stroke="#d1d5db" strokeWidth="1" rx="3"/>
          </g>
          
          {/* Folded gauze pad - emphasized */}
          <g transform="translate(90, 120)">
            <rect x="0" y="0" width="100" height="35" fill="white" stroke="#3b82f6" strokeWidth="3" rx="5"/>
            {/* Fold lines to show thickness */}
            <line x1="0" y1="12" x2="100" y2="12" stroke="#dbeafe" strokeWidth="2"/>
            <line x1="0" y1="23" x2="100" y2="23" stroke="#dbeafe" strokeWidth="2"/>
            {/* Texture */}
            <line x1="20" y1="5" x2="20" y2="30" stroke="#e0e7ff" strokeWidth="1"/>
            <line x1="40" y1="5" x2="40" y2="30" stroke="#e0e7ff" strokeWidth="1"/>
            <line x1="60" y1="5" x2="60" y2="30" stroke="#e0e7ff" strokeWidth="1"/>
            <line x1="80" y1="5" x2="80" y2="30" stroke="#e0e7ff" strokeWidth="1"/>
            <text x="50" y="-10" textAnchor="middle" fontSize="12" fill="#1e40af" fontWeight="bold">THICK PAD</text>
          </g>
          
          {/* Bite force indicators - animated feel */}
          <g>
            {/* Upper arrow */}
            <path d="M140 70 L140 95" stroke="#2563eb" strokeWidth="5" markerEnd="url(#biteArrow)"/>
            <text x="160" y="85" fontSize="14" fill="#1e40af" fontWeight="bold">BITE</text>
            {/* Lower arrow */}
            <path d="M140 210 L140 185" stroke="#2563eb" strokeWidth="5" markerEnd="url(#biteArrow)"/>
            <text x="160" y="200" fontSize="14" fill="#1e40af" fontWeight="bold">FIRMLY</text>
          </g>
          
          {/* Pressure indicator */}
          <g transform="translate(240, 150)">
            <circle cx="0" cy="0" r="25" fill="#e0e7ff" stroke="#6366f1" strokeWidth="2"/>
            <text x="0" y="0" textAnchor="middle" fontSize="12" fill="#4338ca" fontWeight="bold">Hold</text>
            <text x="0" y="15" textAnchor="middle" fontSize="10" fill="#4338ca">steady</text>
          </g>
          
          {/* Head position reminder */}
          <g transform="translate(150, 260)">
            <rect x="-70" y="-15" width="140" height="30" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" rx="15"/>
            <text x="0" y="5" textAnchor="middle" fontSize="12" fill="#14532d" fontWeight="bold">Keep head elevated</text>
          </g>
          
          <defs>
            <marker id="biteArrow" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#2563eb"/>
            </marker>
          </defs>
        </svg>
      ),
      tips: [
        "😬 Bite firmly but don't grind teeth",
        "🔄 Replace gauze every 20-30 min if soaked",
        "📐 Sit upright or recline slightly",
        "🚫 Don't lie flat - increases bleeding"
      ]
    }
  ],
  'cold-compress': [
    {
      title: "Step 1: Prepare Cold Compress",
      description: "Wrap ice or frozen vegetables in a thin towel. Never apply ice directly to skin.",
      illustration: (
        <svg viewBox="0 0 300 300" className="w-full h-auto" aria-label="Illustration showing how to prepare a cold compress">
          <rect width="300" height="300" fill="#eff6ff"/>
          
          {/* Ice cubes - crystalline appearance */}
          <g filter="url(#dropShadow)" transform="translate(100, 60)">
            <rect x="0" y="0" width="30" height="30" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" rx="3">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite"/>
            </rect>
            <rect x="20" y="-5" width="30" height="30" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="2" rx="3">
              <animate attributeName="opacity" values="1;0.8;1" dur="3s" repeatCount="indefinite"/>
            </rect>
            <rect x="10" y="20" width="30" height="30" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" rx="3">
              <animate attributeName="opacity" values="0.9;1;0.9" dur="3s" repeatCount="indefinite"/>
            </rect>
            <rect x="30" y="15" width="30" height="30" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="2" rx="3">
              <animate attributeName="opacity" values="1;0.9;1" dur="3s" repeatCount="indefinite"/>
            </rect>
            {/* Ice sparkles */}
            <circle cx="15" cy="15" r="2" fill="white" opacity="0.8"/>
            <circle cx="35" cy="10" r="1.5" fill="white" opacity="0.7"/>
            <circle cx="25" cy="35" r="1" fill="white" opacity="0.6"/>
          </g>
          
          {/* Towel wrapping - visual emphasis */}
          <g transform="translate(50, 40)">
            <path d="M20 20 Q20 10 30 10 L170 10 Q180 10 180 20 L180 100 Q180 110 170 110 L30 110 Q20 110 20 100 Z" 
                  fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="8,4"/>
            <path d="M25 25 Q25 15 35 15 L165 15 Q175 15 175 25 L175 95 Q175 105 165 105 L35 105 Q25 105 25 95 Z" 
                  fill="#d1fae5" fillOpacity="0.3"/>
            <text x="100" y="130" textAnchor="middle" fontSize="14" fill="#065f46" fontWeight="bold">THIN TOWEL BARRIER</text>
          </g>
          
          {/* Warning sign - prominent */}
          <g transform="translate(220, 80)">
            <g filter="url(#dropShadow)">
              <rect x="-30" y="-40" width="60" height="80" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" rx="10"/>
              <circle cx="0" cy="-15" r="18" fill="#dc2626"/>
              <text x="0" y="-10" textAnchor="middle" fontSize="24" fill="white" fontWeight="bold">!</text>
              <text x="0" y="10" textAnchor="middle" fontSize="11" fill="#7c2d12" fontWeight="bold">NEVER</text>
              <text x="0" y="25" textAnchor="middle" fontSize="11" fill="#7c2d12" fontWeight="bold">DIRECT</text>
              <text x="0" y="40" textAnchor="middle" fontSize="11" fill="#7c2d12" fontWeight="bold">ON SKIN</text>
            </g>
          </g>
          
          {/* Alternative option */}
          <g transform="translate(70, 180)">
            <rect x="-20" y="-10" width="40" height="40" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" rx="5"/>
            <circle cx="0" cy="10" r="12" fill="#86efac"/>
            <text x="0" y="15" textAnchor="middle" fontSize="10" fill="#14532d" fontWeight="bold">PEAS</text>
            <text x="50" y="15" fontSize="12" fill="#15803d">Frozen veggies work too!</text>
          </g>
          
          {/* Timer reminder */}
          <g transform="translate(150, 250)">
            <rect x="-70" y="-15" width="140" height="30" fill="#e0e7ff" stroke="#6366f1" strokeWidth="2" rx="15"/>
            <text x="0" y="5" textAnchor="middle" fontSize="12" fill="#312e81" fontWeight="bold">15-20 minutes max</text>
          </g>
        </svg>
      ),
      tips: [
        "🧊 Ice wrapped in thin towel or cloth",
        "🥦 Frozen peas/corn work great too",
        "⏰ Maximum 20 minutes at a time",
        "🔍 Check skin every 5 minutes for redness"
      ]
    },
    {
      title: "Step 2: Apply to Affected Area",
      description: "Hold compress gently against the outside of your cheek over the painful area.",
      illustration: (
        <svg viewBox="0 0 300 300" className="w-full h-auto" aria-label="Illustration showing proper cold compress application">
          <rect width="300" height="300" fill="#eff6ff"/>
          
          {/* Face profile - detailed */}
          <g filter="url(#dropShadow)">
            <ellipse cx="130" cy="150" rx="70" ry="80" fill="#fecaca" stroke="#f87171" strokeWidth="2"/>
            {/* Eye with detail */}
            <ellipse cx="100" cy="130" rx="12" ry="10" fill="white" stroke="#374151" strokeWidth="2"/>
            <circle cx="100" cy="130" r="6" fill="#1f2937"/>
            <circle cx="102" cy="128" r="2" fill="white"/>
            {/* Eyebrow */}
            <path d="M88 120 Q100 115 112 120" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
            {/* Nose */}
            <path d="M85 160 Q80 170 85 175" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
            {/* Mouth showing discomfort */}
            <path d="M90 190 Q100 185 110 190" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
          </g>
          
          {/* Swollen area - animated */}
          <g>
            <circle cx="160" cy="170" r="25" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" strokeDasharray="4,4">
              <animate attributeName="r" values="25;28;25" dur="2s" repeatCount="indefinite"/>
            </circle>
            <text x="160" y="175" textAnchor="middle" fontSize="10" fill="#991b1b">SWELLING</text>
          </g>
          
          {/* Cold compress with proper positioning */}
          <g transform="translate(180, 155)">
            <rect x="0" y="0" width="50" height="35" fill="#dbeafe" stroke="#3b82f6" strokeWidth="3" rx="8"/>
            {/* Ice texture */}
            <circle cx="10" cy="10" r="3" fill="#bfdbfe"/>
            <circle cx="25" cy="8" r="2.5" fill="#bfdbfe"/>
            <circle cx="15" cy="20" r="3.5" fill="#bfdbfe"/>
            <circle cx="35" cy="15" r="3" fill="#bfdbfe"/>
            <circle cx="40" cy="25" r="2" fill="#bfdbfe"/>
            {/* Cold waves */}
            <path d="M55 10 Q60 12 65 10 Q70 8 75 10" fill="none" stroke="#60a5fa" strokeWidth="2" opacity="0.6"/>
            <path d="M55 17 Q60 19 65 17 Q70 15 75 17" fill="none" stroke="#60a5fa" strokeWidth="2" opacity="0.5"/>
            <path d="M55 24 Q60 26 65 24 Q70 22 75 24" fill="none" stroke="#60a5fa" strokeWidth="2" opacity="0.4"/>
          </g>
          
          {/* Hand holding compress */}
          <g transform="translate(200, 140)" opacity="0.8">
            <ellipse cx="15" cy="30" rx="20" ry="30" fill="#fdbcb4" stroke="#e0a899" strokeWidth="2"/>
            <text x="-20" y="-10" fontSize="12" fill="#1e40af" fontWeight="bold">GENTLE</text>
          </g>
          
          {/* Timer with visual countdown */}
          <g transform="translate(60, 220)">
            <circle cx="0" cy="0" r="35" fill="white" stroke="#6366f1" strokeWidth="3"/>
            <path d="M0 -35 A35 35 0 0 1 25 -25" fill="none" stroke="#a78bfa" strokeWidth="6" strokeLinecap="round"/>
            <text x="0" y="0" textAnchor="middle" fontSize="18" fill="#4338ca" fontWeight="bold">15-20</text>
            <text x="0" y="18" textAnchor="middle" fontSize="12" fill="#4338ca">minutes</text>
          </g>
          
          {/* Rotation reminder */}
          <g transform="translate(220, 240)">
            <rect x="-50" y="-15" width="100" height="30" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" rx="15"/>
            <text x="0" y="5" textAnchor="middle" fontSize="11" fill="#14532d" fontWeight="bold">Rest 20 min</text>
          </g>
          
          {/* Pain relief indicator */}
          <g transform="translate(150, 110)">
            <path d="M0 0 Q-10 -20 -20 0" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round"/>
            <path d="M-5 -5 Q-15 -25 -25 -5" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
            <text x="-10" y="-30" textAnchor="middle" fontSize="12" fill="#059669" fontWeight="bold">Relief</text>
          </g>
        </svg>
      ),
      tips: [
        "🤚 Hold gently - no heavy pressure",
        "⏸️ 20 minutes on, 20 minutes off",
        "🔴 Stop if skin gets too red or numb",
        "📍 Apply to outside of cheek, not inside mouth"
      ]
    }
  ]
}

export function VisualInstructions({ emergencyType, className }: VisualInstructionsProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showEnlarged, setShowEnlarged] = useState(false)
  
  const steps = instructionSets[emergencyType] || []
  const currentInstruction = steps[currentStep]

  const titleMap: Record<string, string> = {
    'knocked-out-tooth': 'Knocked-Out Tooth First Aid',
    'bleeding-control': 'Dental Bleeding Control',
    'cold-compress': 'Cold Compress Application'
  }

  const descriptionMap: Record<string, string> = {
    'knocked-out-tooth': 'How to preserve and handle a knocked-out tooth',
    'bleeding-control': 'Steps to control bleeding from dental injuries',
    'cold-compress': 'Proper technique for reducing pain and swelling'
  }

  const handlePrint = () => {
    window.print()
  }

  if (!currentInstruction) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{titleMap[emergencyType] || 'Visual First Aid Guide'}</CardTitle>
            <CardDescription>
              {descriptionMap[emergencyType] || 'Step-by-step illustrated instructions'}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-primary'
                    : index < currentStep
                    ? 'bg-primary/50'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Current step */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{currentInstruction.title}</h3>
            <p className="text-gray-600">{currentInstruction.description}</p>

            {/* Illustration */}
            <div 
              className="relative bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setShowEnlarged(true)}
            >
              <div className="max-w-sm mx-auto">
                {currentInstruction.illustration}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
              >
                <Eye className="h-4 w-4 mr-1" />
                Enlarge
              </Button>
            </div>

            {/* Tips */}
            {currentInstruction.tips && currentInstruction.tips.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Important Tips:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {currentInstruction.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-blue-800">{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </span>
            
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={currentStep === steps.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Enlarged view dialog */}
      <Dialog open={showEnlarged} onOpenChange={setShowEnlarged}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{currentInstruction.title}</DialogTitle>
          </DialogHeader>
          <div className="p-8">
            {currentInstruction.illustration}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}