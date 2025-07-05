"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Eye, AlertCircle } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Alert } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface VisualGuide {
  condition: string
  description: string
  visualSigns: string[]
  illustration: React.ReactNode
  severity: 'critical' | 'high' | 'medium'
}

const visualGuides: VisualGuide[] = [
  {
    condition: "Dental Abscess",
    description: "A pocket of pus caused by bacterial infection, appearing as a swollen bump on the gums",
    visualSigns: [
      "Visible swelling on gums (like a pimple)",
      "Facial swelling on affected side",
      "Tooth may appear darker/discolored",
      "Pus may be draining from area"
    ],
    severity: 'critical',
    illustration: (
      <svg viewBox="0 0 400 300" className="w-full h-auto" aria-label="Dental abscess visual identification guide">
        <defs>
          <linearGradient id="abscessGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fee2e2" />
            <stop offset="100%" stopColor="#fecaca" />
          </linearGradient>
          <filter id="swellingGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <rect width="400" height="300" fill="#f0f9ff"/>
        
        {/* Face outline showing swelling */}
        <g transform="translate(50, 50)">
          {/* Normal side */}
          <path d="M50 50 Q50 20 80 20 L120 20 Q150 20 150 50 L150 150 Q150 180 120 180 L80 180 Q50 180 50 150 Z" 
                fill="#fecaca" stroke="#f87171" strokeWidth="2"/>
          <text x="100" y="10" textAnchor="middle" fontSize="12" fill="#065f46" fontWeight="bold">NORMAL</text>
          
          {/* Swollen side */}
          <path d="M200 50 Q200 20 230 20 L270 20 Q300 20 300 50 L300 150 Q300 200 250 200 Q200 200 200 150 Z" 
                fill="#fee2e2" stroke="#dc2626" strokeWidth="2" filter="url(#swellingGlow)"/>
          <text x="250" y="10" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="bold">SWOLLEN</text>
          
          {/* Arrow pointing to swelling */}
          <path d="M320 100 L300 100" stroke="#dc2626" strokeWidth="3" markerEnd="url(#arrowRed)"/>
          <text x="340" y="105" fontSize="12" fill="#dc2626" fontWeight="bold">Facial</text>
          <text x="340" y="120" fontSize="12" fill="#dc2626" fontWeight="bold">swelling</text>
        </g>
        
        {/* Tooth and gum detail */}
        <g transform="translate(50, 200)">
          {/* Healthy tooth and gum */}
          <rect x="0" y="0" width="30" height="40" fill="white" stroke="#6b7280" strokeWidth="2" rx="5"/>
          <rect x="0" y="35" width="30" height="15" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1"/>
          <path d="M-10 50 L40 50" stroke="#fecaca" strokeWidth="10" strokeLinecap="round"/>
          <text x="15" y="70" textAnchor="middle" fontSize="10" fill="#065f46">Healthy</text>
          
          {/* Abscessed tooth */}
          <g transform="translate(100, 0)">
            {/* Darker/discolored tooth */}
            <rect x="0" y="0" width="30" height="40" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" rx="5"/>
            <rect x="0" y="35" width="30" height="15" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1"/>
            {/* Swollen gum with abscess */}
            <path d="M-10 50 L40 50" stroke="#fecaca" strokeWidth="10" strokeLinecap="round"/>
            {/* Abscess bump */}
            <circle cx="35" cy="45" r="12" fill="#dc2626" stroke="#991b1b" strokeWidth="2" filter="url(#swellingGlow)"/>
            <circle cx="37" cy="43" r="3" fill="#fee2e2" opacity="0.8"/>
            <text x="15" y="70" textAnchor="middle" fontSize="10" fill="#dc2626">Abscess</text>
            
            {/* Pus indicator */}
            <circle cx="35" cy="55" r="2" fill="#fef3c7"/>
            <circle cx="37" cy="58" r="1.5" fill="#fef3c7"/>
            <text x="50" y="50" fontSize="10" fill="#dc2626">Pus</text>
          </g>
          
          {/* Comparison arrow */}
          <path d="M50 25 L80 25" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowGray)"/>
        </g>
        
        {/* Warning signs */}
        <g transform="translate(250, 220)">
          <rect x="0" y="0" width="120" height="60" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" rx="10"/>
          <text x="60" y="20" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="bold">⚠️ DANGER SIGNS</text>
          <text x="60" y="35" textAnchor="middle" fontSize="10" fill="#7f1d1d">• Difficulty swallowing</text>
          <text x="60" y="48" textAnchor="middle" fontSize="10" fill="#7f1d1d">• High fever</text>
        </g>
        
        <defs>
          <marker id="arrowRed" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#dc2626"/>
          </marker>
          <marker id="arrowGray" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#374151"/>
          </marker>
        </defs>
      </svg>
    )
  },
  {
    condition: "Knocked-Out Tooth",
    description: "Complete displacement of tooth from its socket",
    visualSigns: [
      "Empty, bleeding socket",
      "Entire tooth including root is out",
      "Significant bleeding from socket",
      "May see tooth on ground/in hand"
    ],
    severity: 'critical',
    illustration: (
      <svg viewBox="0 0 400 300" className="w-full h-auto" aria-label="Knocked-out tooth visual identification">
        <rect width="400" height="300" fill="#fef2f2"/>
        
        {/* Mouth with missing tooth */}
        <g transform="translate(50, 50)">
          {/* Upper teeth */}
          <rect x="40" y="20" width="25" height="35" fill="white" stroke="#6b7280" strokeWidth="2" rx="5"/>
          <rect x="70" y="20" width="25" height="35" fill="white" stroke="#6b7280" strokeWidth="2" rx="5"/>
          {/* Missing tooth socket */}
          <rect x="100" y="20" width="25" height="35" fill="#dc2626" stroke="#991b1b" strokeWidth="2" rx="5" strokeDasharray="3,3"/>
          <text x="112" y="40" textAnchor="middle" fontSize="20" fill="#fee2e2">✕</text>
          <rect x="130" y="20" width="25" height="35" fill="white" stroke="#6b7280" strokeWidth="2" rx="5"/>
          <rect x="160" y="20" width="25" height="35" fill="white" stroke="#6b7280" strokeWidth="2" rx="5"/>
          
          {/* Bleeding indicator */}
          <circle cx="112" cy="60" r="3" fill="#dc2626" opacity="0.8"/>
          <circle cx="115" cy="65" r="2" fill="#dc2626" opacity="0.6"/>
          <circle cx="109" cy="64" r="2.5" fill="#dc2626" opacity="0.7"/>
          <text x="112" y="85" textAnchor="middle" fontSize="10" fill="#dc2626" fontWeight="bold">BLEEDING</text>
        </g>
        
        {/* The knocked-out tooth */}
        <g transform="translate(250, 50)">
          <text x="50" y="10" textAnchor="middle" fontSize="12" fill="#dc2626" fontWeight="bold">KNOCKED-OUT TOOTH</text>
          {/* Crown */}
          <rect x="35" y="30" width="30" height="35" fill="white" stroke="#2563eb" strokeWidth="3" rx="5"/>
          <text x="50" y="25" textAnchor="middle" fontSize="10" fill="#2563eb" fontWeight="bold">CROWN</text>
          {/* Root */}
          <path d="M40 65 L45 90 L50 100 L55 90 L60 65" fill="#ffedd5" stroke="#dc2626" strokeWidth="3"/>
          <text x="50" y="115" textAnchor="middle" fontSize="10" fill="#dc2626" fontWeight="bold">ROOT</text>
          
          {/* Don't touch indicator */}
          <circle cx="80" cy="85" r="15" fill="#dc2626" fillOpacity="0.2"/>
          <path d="M70 75 L90 95 M90 75 L70 95" stroke="#dc2626" strokeWidth="3" strokeLinecap="round"/>
        </g>
        
        {/* Time critical warning */}
        <g transform="translate(150, 180)">
          <rect x="-50" y="0" width="200" height="80" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" rx="15"/>
          <circle cx="50" cy="25" r="20" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2"/>
          <text x="50" y="30" textAnchor="middle" fontSize="16" fill="#78350f" fontWeight="bold">30 MIN</text>
          <text x="50" y="55" textAnchor="middle" fontSize="12" fill="#92400e" fontWeight="bold">TO SAVE TOOTH!</text>
        </g>
      </svg>
    )
  },
  {
    condition: "Broken or Chipped Tooth",
    description: "Visible damage to tooth structure from minor chip to major fracture",
    visualSigns: [
      "Visible missing piece of tooth",
      "Sharp or rough edge",
      "May see exposed inner tooth",
      "Possible bleeding from gums"
    ],
    severity: 'high',
    illustration: (
      <svg viewBox="0 0 400 300" className="w-full h-auto" aria-label="Broken tooth visual identification">
        <rect width="400" height="300" fill="#eff6ff"/>
        
        <text x="200" y="25" textAnchor="middle" fontSize="16" fill="#1e3a8a" fontWeight="bold">TYPES OF TOOTH FRACTURES</text>
        
        {/* Minor chip */}
        <g transform="translate(50, 50)">
          <text x="40" y="0" textAnchor="middle" fontSize="12" fill="#059669" fontWeight="bold">MINOR CHIP</text>
          <rect x="20" y="10" width="40" height="50" fill="white" stroke="#6b7280" strokeWidth="2" rx="5"/>
          {/* Chip */}
          <path d="M50 10 L60 10 L60 20 L55 15 Z" fill="#e5e7eb" stroke="#dc2626" strokeWidth="2"/>
          <circle cx="57" cy="15" r="8" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="2,2"/>
          <text x="40" y="80" textAnchor="middle" fontSize="10" fill="#059669">Often painless</text>
        </g>
        
        {/* Moderate break */}
        <g transform="translate(180, 50)">
          <text x="40" y="0" textAnchor="middle" fontSize="12" fill="#f59e0b" fontWeight="bold">MODERATE BREAK</text>
          <rect x="20" y="10" width="40" height="50" fill="white" stroke="#6b7280" strokeWidth="2" rx="5"/>
          {/* Break showing inner layers */}
          <path d="M45 10 L60 10 L60 35 L50 30 L45 35 Z" fill="#fef3c7" stroke="#dc2626" strokeWidth="2"/>
          <path d="M50 25 L55 25 L55 30 L50 30 Z" fill="#fed7aa" stroke="#ea580c" strokeWidth="1"/>
          <text x="70" y="25" fontSize="10" fill="#ea580c">Inner</text>
          <text x="70" y="37" fontSize="10" fill="#ea580c">layer</text>
          <text x="40" y="80" textAnchor="middle" fontSize="10" fill="#f59e0b">Sensitive/painful</text>
        </g>
        
        {/* Severe fracture */}
        <g transform="translate(290, 50)">
          <text x="40" y="0" textAnchor="middle" fontSize="12" fill="#dc2626" fontWeight="bold">SEVERE FRACTURE</text>
          <rect x="20" y="10" width="40" height="50" fill="white" stroke="#6b7280" strokeWidth="2" rx="5"/>
          {/* Major break with exposed pulp */}
          <path d="M40 10 L60 10 L60 40 L40 35 Z" fill="#fee2e2" stroke="#dc2626" strokeWidth="2"/>
          <circle cx="50" cy="30" r="5" fill="#dc2626" stroke="#991b1b" strokeWidth="1"/>
          <text x="70" y="25" fontSize="10" fill="#dc2626">Exposed</text>
          <text x="70" y="37" fontSize="10" fill="#dc2626">nerve</text>
          {/* Pain indicators */}
          <path d="M45 45 Q40 50 35 45" stroke="#dc2626" strokeWidth="2" fill="none"/>
          <path d="M50 45 Q45 50 40 45" stroke="#dc2626" strokeWidth="2" fill="none"/>
          <path d="M55 45 Q50 50 45 45" stroke="#dc2626" strokeWidth="2" fill="none"/>
          <text x="40" y="80" textAnchor="middle" fontSize="10" fill="#dc2626">Severe pain!</text>
        </g>
        
        {/* Warning about sharp edges */}
        <g transform="translate(100, 180)">
          <rect x="0" y="0" width="200" height="60" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" rx="10"/>
          <path d="M20 30 L40 20 L45 25 L50 15 L55 20 L60 10" stroke="#dc2626" strokeWidth="2" fill="none"/>
          <text x="100" y="25" textAnchor="middle" fontSize="12" fill="#92400e" fontWeight="bold">⚠️ SHARP EDGES</text>
          <text x="100" y="40" textAnchor="middle" fontSize="10" fill="#78350f">Can cut tongue/cheek</text>
          <text x="100" y="52" textAnchor="middle" fontSize="10" fill="#78350f">Cover with dental wax</text>
        </g>
      </svg>
    )
  },
  {
    condition: "Lost Filling or Crown",
    description: "Dental restoration has fallen out leaving exposed tooth",
    visualSigns: [
      "Visible hole in tooth",
      "Missing crown (tooth looks filed down)",
      "Rough surface felt with tongue",
      "Sensitivity to hot/cold"
    ],
    severity: 'medium',
    illustration: (
      <svg viewBox="0 0 400 300" className="w-full h-auto" aria-label="Lost filling or crown visual identification">
        <rect width="400" height="300" fill="#f0fdf4"/>
        
        {/* Lost filling */}
        <g transform="translate(50, 50)">
          <text x="75" y="0" textAnchor="middle" fontSize="14" fill="#166534" fontWeight="bold">LOST FILLING</text>
          
          {/* Before */}
          <g transform="translate(0, 20)">
            <text x="40" y="-5" textAnchor="middle" fontSize="10" fill="#059669">Before</text>
            <rect x="20" y="0" width="40" height="50" fill="white" stroke="#6b7280" strokeWidth="2" rx="5"/>
            <rect x="30" y="10" width="20" height="20" fill="#9ca3af" stroke="#6b7280" strokeWidth="1" rx="2"/>
            <text x="40" y="25" textAnchor="middle" fontSize="8" fill="white">FILLING</text>
          </g>
          
          {/* Arrow */}
          <path d="M80 50 L100 50" stroke="#374151" strokeWidth="2" markerEnd="url(#arrow)"/>
          
          {/* After */}
          <g transform="translate(110, 20)">
            <text x="40" y="-5" textAnchor="middle" fontSize="10" fill="#dc2626">After</text>
            <rect x="20" y="0" width="40" height="50" fill="white" stroke="#6b7280" strokeWidth="2" rx="5"/>
            <rect x="30" y="10" width="20" height="20" fill="#1f2937" stroke="#dc2626" strokeWidth="2" rx="2" strokeDasharray="3,3"/>
            <text x="40" y="25" textAnchor="middle" fontSize="8" fill="#fef3c7">HOLE</text>
            {/* Sensitivity indicators */}
            <path d="M25 35 L25 40" stroke="#3b82f6" strokeWidth="2"/>
            <path d="M35 35 L35 40" stroke="#dc2626" strokeWidth="2"/>
            <path d="M45 35 L45 40" stroke="#3b82f6" strokeWidth="2"/>
            <path d="M55 35 L55 40" stroke="#dc2626" strokeWidth="2"/>
            <text x="40" y="55" textAnchor="middle" fontSize="8" fill="#6b7280">Hot/Cold sensitive</text>
          </g>
        </g>
        
        {/* Lost crown */}
        <g transform="translate(50, 150)">
          <text x="75" y="0" textAnchor="middle" fontSize="14" fill="#166534" fontWeight="bold">LOST CROWN</text>
          
          {/* Before */}
          <g transform="translate(0, 20)">
            <text x="40" y="-5" textAnchor="middle" fontSize="10" fill="#059669">Before</text>
            <rect x="20" y="0" width="40" height="50" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" rx="5"/>
            <text x="40" y="30" textAnchor="middle" fontSize="8" fill="#374151">CROWN</text>
          </g>
          
          {/* Arrow */}
          <path d="M80 50 L100 50" stroke="#374151" strokeWidth="2" markerEnd="url(#arrow)"/>
          
          {/* After */}
          <g transform="translate(110, 20)">
            <text x="40" y="-5" textAnchor="middle" fontSize="10" fill="#dc2626">After</text>
            {/* Prepared tooth stub */}
            <rect x="25" y="15" width="30" height="35" fill="#fef3c7" stroke="#dc2626" strokeWidth="2" rx="3"/>
            <text x="40" y="35" textAnchor="middle" fontSize="8" fill="#92400e">STUB</text>
            {/* The fallen crown */}
            <g transform="translate(70, 10)">
              <rect x="0" y="0" width="35" height="40" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" rx="5"/>
              <text x="17" y="25" textAnchor="middle" fontSize="8" fill="#374151">Crown</text>
              <path d="M-10 20 L0 20" stroke="#dc2626" strokeWidth="2" markerEnd="url(#arrowRed)"/>
            </g>
          </g>
        </g>
        
        {/* Save the crown reminder */}
        <g transform="translate(250, 180)">
          <rect x="0" y="0" width="120" height="80" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" rx="10"/>
          <text x="60" y="20" textAnchor="middle" fontSize="12" fill="#1e40af" fontWeight="bold">💡 SAVE IT!</text>
          <text x="60" y="35" textAnchor="middle" fontSize="10" fill="#1e3a8a">Keep crown/filling</text>
          <text x="60" y="48" textAnchor="middle" fontSize="10" fill="#1e3a8a">in safe container</text>
          <text x="60" y="61" textAnchor="middle" fontSize="10" fill="#1e3a8a">Dentist may reuse</text>
        </g>
        
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#374151"/>
          </marker>
          <marker id="arrowRed" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#dc2626"/>
          </marker>
        </defs>
      </svg>
    )
  },
  {
    condition: "Severe Toothache",
    description: "Intense, throbbing pain that won't go away",
    visualSigns: [
      "Swelling around affected tooth",
      "Tooth may look darker",
      "Visible decay/cavity",
      "Gum redness and inflammation"
    ],
    severity: 'high',
    illustration: (
      <svg viewBox="0 0 400 300" className="w-full h-auto" aria-label="Severe toothache visual identification">
        <rect width="400" height="300" fill="#fef2f2"/>
        
        <text x="200" y="25" textAnchor="middle" fontSize="16" fill="#991b1b" fontWeight="bold">SEVERE TOOTHACHE SIGNS</text>
        
        {/* Pain radiation diagram */}
        <g transform="translate(50, 50)">
          <text x="75" y="0" textAnchor="middle" fontSize="12" fill="#dc2626" fontWeight="bold">PAIN RADIATION</text>
          {/* Head outline */}
          <ellipse cx="75" cy="80" rx="50" ry="60" fill="#fecaca" stroke="#f87171" strokeWidth="2"/>
          {/* Affected tooth area */}
          <circle cx="60" cy="90" r="8" fill="#dc2626" stroke="#991b1b" strokeWidth="2"/>
          {/* Pain radiation lines */}
          <path d="M60 90 Q40 70 30 80" stroke="#dc2626" strokeWidth="2" fill="none" opacity="0.6" strokeDasharray="3,3"/>
          <path d="M60 90 Q70 60 80 50" stroke="#dc2626" strokeWidth="2" fill="none" opacity="0.6" strokeDasharray="3,3"/>
          <path d="M60 90 Q80 100 95 95" stroke="#dc2626" strokeWidth="2" fill="none" opacity="0.6" strokeDasharray="3,3"/>
          <path d="M60 90 Q50 110 45 130" stroke="#dc2626" strokeWidth="2" fill="none" opacity="0.6" strokeDasharray="3,3"/>
          
          <text x="75" y="160" textAnchor="middle" fontSize="10" fill="#dc2626">Pain spreads to:</text>
          <text x="75" y="173" textAnchor="middle" fontSize="10" fill="#dc2626">• Ear • Jaw • Head</text>
        </g>
        
        {/* Tooth appearance */}
        <g transform="translate(220, 50)">
          <text x="60" y="0" textAnchor="middle" fontSize="12" fill="#dc2626" fontWeight="bold">TOOTH APPEARANCE</text>
          
          {/* Healthy tooth */}
          <g transform="translate(0, 20)">
            <text x="30" y="-5" textAnchor="middle" fontSize="10" fill="#059669">Healthy</text>
            <rect x="10" y="0" width="40" height="50" fill="white" stroke="#6b7280" strokeWidth="2" rx="5"/>
          </g>
          
          {/* Affected tooth */}
          <g transform="translate(80, 20)">
            <text x="30" y="-5" textAnchor="middle" fontSize="10" fill="#dc2626">Affected</text>
            <rect x="10" y="0" width="40" height="50" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" rx="5"/>
            {/* Cavity */}
            <circle cx="30" cy="20" r="8" fill="#1f2937" stroke="#dc2626" strokeWidth="2"/>
            {/* Swollen gum */}
            <path d="M0 50 L60 50" stroke="#dc2626" strokeWidth="12" strokeLinecap="round"/>
            <text x="30" y="70" textAnchor="middle" fontSize="9" fill="#dc2626">Swollen gum</text>
          </g>
        </g>
        
        {/* Throbbing indicator */}
        <g transform="translate(150, 200)">
          <rect x="-50" y="0" width="200" height="60" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" rx="10">
            <animate attributeName="stroke-width" values="2;4;2" dur="1s" repeatCount="indefinite"/>
          </rect>
          <text x="50" y="25" textAnchor="middle" fontSize="14" fill="#dc2626" fontWeight="bold">THROBBING PAIN</text>
          <text x="50" y="40" textAnchor="middle" fontSize="10" fill="#991b1b">Constant • Intense • Worsening</text>
          <text x="50" y="52" textAnchor="middle" fontSize="10" fill="#991b1b">Keeps you awake at night</text>
        </g>
      </svg>
    )
  },
  {
    condition: "Bleeding Gums",
    description: "Persistent bleeding from gum tissue",
    visualSigns: [
      "Blood when brushing/flossing",
      "Red, swollen gums (not pink)",
      "Gums pulling away from teeth",
      "Blood on pillow in morning"
    ],
    severity: 'medium',
    illustration: (
      <svg viewBox="0 0 400 300" className="w-full h-auto" aria-label="Bleeding gums visual identification">
        <rect width="400" height="300" fill="#fff7ed"/>
        
        <text x="200" y="25" textAnchor="middle" fontSize="16" fill="#9a3412" fontWeight="bold">HEALTHY vs BLEEDING GUMS</text>
        
        {/* Healthy gums */}
        <g transform="translate(50, 50)">
          <text x="75" y="0" textAnchor="middle" fontSize="14" fill="#059669" fontWeight="bold">HEALTHY GUMS</text>
          {/* Teeth */}
          <rect x="30" y="30" width="25" height="35" fill="white" stroke="#6b7280" strokeWidth="2" rx="5"/>
          <rect x="60" y="30" width="25" height="35" fill="white" stroke="#6b7280" strokeWidth="2" rx="5"/>
          <rect x="90" y="30" width="25" height="35" fill="white" stroke="#6b7280" strokeWidth="2" rx="5"/>
          {/* Healthy pink gums */}
          <path d="M20 65 Q30 60 40 65 Q50 60 65 65 Q75 60 85 65 Q95 60 105 65 Q115 60 125 65" 
                stroke="#fbbf24" strokeWidth="15" fill="none" strokeLinecap="round"/>
          <text x="75" y="90" textAnchor="middle" fontSize="10" fill="#059669">• Firm & pink</text>
          <text x="75" y="103" textAnchor="middle" fontSize="10" fill="#059669">• No bleeding</text>
          <text x="75" y="116" textAnchor="middle" fontSize="10" fill="#059669">• Fits tightly</text>
        </g>
        
        {/* Bleeding gums */}
        <g transform="translate(220, 50)">
          <text x="75" y="0" textAnchor="middle" fontSize="14" fill="#dc2626" fontWeight="bold">BLEEDING GUMS</text>
          {/* Teeth */}
          <rect x="30" y="30" width="25" height="35" fill="white" stroke="#6b7280" strokeWidth="2" rx="5"/>
          <rect x="60" y="30" width="25" height="35" fill="white" stroke="#6b7280" strokeWidth="2" rx="5"/>
          <rect x="90" y="30" width="25" height="35" fill="white" stroke="#6b7280" strokeWidth="2" rx="5"/>
          {/* Inflamed red gums */}
          <path d="M20 65 Q30 58 40 65 Q50 58 65 65 Q75 58 85 65 Q95 58 105 65 Q115 58 125 65" 
                stroke="#dc2626" strokeWidth="18" fill="none" strokeLinecap="round"/>
          {/* Blood droplets */}
          <circle cx="45" cy="70" r="3" fill="#dc2626" opacity="0.8"/>
          <circle cx="75" cy="72" r="2.5" fill="#dc2626" opacity="0.7"/>
          <circle cx="95" cy="69" r="3" fill="#dc2626" opacity="0.8"/>
          
          <text x="75" y="90" textAnchor="middle" fontSize="10" fill="#dc2626">• Red & swollen</text>
          <text x="75" y="103" textAnchor="middle" fontSize="10" fill="#dc2626">• Bleeds easily</text>
          <text x="75" y="116" textAnchor="middle" fontSize="10" fill="#dc2626">• Pulling away</text>
        </g>
        
        {/* Common triggers */}
        <g transform="translate(100, 180)">
          <rect x="0" y="0" width="200" height="80" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" rx="10"/>
          <text x="100" y="20" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="bold">BLEEDING TRIGGERS</text>
          <text x="100" y="35" textAnchor="middle" fontSize="10" fill="#7f1d1d">• Brushing teeth</text>
          <text x="100" y="48" textAnchor="middle" fontSize="10" fill="#7f1d1d">• Flossing</text>
          <text x="100" y="61" textAnchor="middle" fontSize="10" fill="#7f1d1d">• Eating hard foods</text>
        </g>
      </svg>
    )
  }
]

export function EmergencyVisualIdentification() {
  const [expandedConditions, setExpandedConditions] = useState<string[]>([])

  const toggleCondition = (condition: string) => {
    setExpandedConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Visual Identification Guide
          </CardTitle>
          <CardDescription>
            Learn what dental emergencies look like so you can identify them quickly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <div className="ml-2">
              <p className="text-sm">
                These visual guides help identify common dental emergencies. 
                If you're experiencing severe pain, facial swelling, or difficulty swallowing, 
                seek immediate medical attention.
              </p>
            </div>
          </Alert>

          <div className="space-y-4">
            {visualGuides.map((guide) => (
              <Collapsible
                key={guide.condition}
                open={expandedConditions.includes(guide.condition)}
                onOpenChange={() => toggleCondition(guide.condition)}
              >
                <Card className={cn(
                  "transition-all duration-200",
                  expandedConditions.includes(guide.condition) && "ring-2 ring-primary"
                )}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">{guide.condition}</CardTitle>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-semibold",
                            guide.severity === 'critical' && "bg-red-100 text-red-700",
                            guide.severity === 'high' && "bg-orange-100 text-orange-700",
                            guide.severity === 'medium' && "bg-yellow-100 text-yellow-700"
                          )}>
                            {guide.severity.toUpperCase()}
                          </span>
                        </div>
                        <Button variant="ghost" size="sm">
                          {expandedConditions.includes(guide.condition) ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Show
                            </>
                          )}
                        </Button>
                      </div>
                      <CardDescription>{guide.description}</CardDescription>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">What to Look For:</h4>
                          <ul className="space-y-2">
                            {guide.visualSigns.map((sign, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span className="text-sm">{sign}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold mb-3 text-center">Visual Guide:</h4>
                          {guide.illustration}
                        </div>
                      </div>
                      
                      {guide.severity === 'critical' && (
                        <Alert className="mt-4" variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <div className="ml-2">
                            <p className="text-sm font-semibold">
                              This is a critical emergency requiring immediate attention!
                            </p>
                          </div>
                        </Alert>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}