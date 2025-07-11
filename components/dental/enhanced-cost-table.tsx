'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  DollarSign, 
  Calculator, 
  Download,
  Info,
  TrendingUp,
  CreditCard,
  Calendar,
  CheckCircle2,
  Globe
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export interface CostItem {
  item: string
  cost: number // numeric for calculations
  nhsCost?: number
  description?: string
  category?: 'preventive' | 'basic' | 'major' | 'cosmetic'
}

interface PaymentPlan {
  months: number
  interestRate: number
  monthlyPayment: number
}

interface EnhancedCostTableProps {
  costs: CostItem[]
  title?: string
  showPaymentCalculator?: boolean
  showInsuranceEstimator?: boolean
  insuranceCoverage?: {
    preventive: number
    basic: number
    major: number
    cosmetic: number
  }
  regionalVariation?: {
    region: string
    factor: number // e.g., 1.2 for 20% higher
  }
  className?: string
}

const defaultInsuranceCoverage = {
  preventive: 100,
  basic: 80,
  major: 50,
  cosmetic: 0
}

const regions = [
  { name: 'London', factor: 1.3 },
  { name: 'South East', factor: 1.15 },
  { name: 'South West', factor: 1.05 },
  { name: 'Midlands', factor: 1.0 },
  { name: 'North', factor: 0.95 },
  { name: 'Scotland', factor: 0.9 },
  { name: 'Wales', factor: 0.9 },
  { name: 'Northern Ireland', factor: 0.85 }
]

export function EnhancedCostTable({ 
  costs, 
  title = "Treatment Costs",
  showPaymentCalculator = true,
  showInsuranceEstimator = true,
  insuranceCoverage = defaultInsuranceCoverage,
  regionalVariation,
  className 
}: EnhancedCostTableProps) {
  const [useNHS, setUseNHS] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState(regionalVariation?.region || 'Midlands')
  const [paymentMonths, setPaymentMonths] = useState([12])
  const [hasInsurance, setHasInsurance] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(costs.map(c => c.item)))

  const regionFactor = regions.find(r => r.name === selectedRegion)?.factor || 1.0

  // Calculate totals
  const calculations = useMemo(() => {
    const selectedCosts = costs.filter(c => selectedItems.has(c.item))
    
    const baseCost = selectedCosts.reduce((sum, item) => {
      const cost = useNHS && item.nhsCost !== undefined ? item.nhsCost : item.cost
      return sum + cost
    }, 0)

    const regionalCost = baseCost * regionFactor

    const insuranceDiscount = hasInsurance ? selectedCosts.reduce((sum, item) => {
      const cost = useNHS && item.nhsCost !== undefined ? item.nhsCost : item.cost
      const coverage = insuranceCoverage[item.category || 'basic'] || 0
      return sum + (cost * coverage / 100)
    }, 0) : 0

    const finalCost = regionalCost - insuranceDiscount

    // Payment plans
    const plans: PaymentPlan[] = [3, 6, 12, 24].map(months => {
      const interestRate = months <= 6 ? 0 : months <= 12 ? 5.9 : 9.9
      const monthlyRate = interestRate / 100 / 12
      const monthlyPayment = interestRate === 0 
        ? finalCost / months
        : (finalCost * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
          (Math.pow(1 + monthlyRate, months) - 1)
      
      return {
        months,
        interestRate,
        monthlyPayment
      }
    })

    return {
      baseCost,
      regionalCost,
      insuranceDiscount,
      finalCost,
      plans,
      selectedPlan: plans.find(p => p.months === paymentMonths[0]) || plans[2]
    }
  }, [costs, selectedItems, useNHS, regionFactor, hasInsurance, insuranceCoverage, paymentMonths])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'preventive':
        return 'text-green-600'
      case 'basic':
        return 'text-blue-600'
      case 'major':
        return 'text-orange-600'
      case 'cosmetic':
        return 'text-purple-600'
      default:
        return 'text-gray-600'
    }
  }

  const handleItemToggle = (item: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(item)) {
      newSelected.delete(item)
    } else {
      newSelected.add(item)
    }
    setSelectedItems(newSelected)
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    
    // Title
    doc.setFontSize(20)
    doc.text('Treatment Cost Estimate', 20, 20)
    
    // Date
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30)
    
    // Cost breakdown table
    const tableData = costs
      .filter(c => selectedItems.has(c.item))
      .map(item => [
        item.item,
        item.category || 'basic',
        formatCurrency(useNHS && item.nhsCost !== undefined ? item.nhsCost : item.cost)
      ])
    
    doc.autoTable({
      startY: 40,
      head: [['Treatment', 'Category', 'Cost']],
      body: tableData,
    })
    
    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(12)
    doc.text('Summary:', 20, finalY)
    doc.setFontSize(10)
    doc.text(`Base Cost: ${formatCurrency(calculations.baseCost)}`, 20, finalY + 10)
    doc.text(`Regional Adjustment (${selectedRegion}): ${formatCurrency(calculations.regionalCost - calculations.baseCost)}`, 20, finalY + 20)
    if (hasInsurance) {
      doc.text(`Insurance Coverage: -${formatCurrency(calculations.insuranceDiscount)}`, 20, finalY + 30)
    }
    doc.setFontSize(14)
    doc.text(`Total Cost: ${formatCurrency(calculations.finalCost)}`, 20, finalY + 45)
    
    // Payment plan
    if (calculations.selectedPlan.interestRate > 0) {
      doc.setFontSize(12)
      doc.text('Payment Plan:', 20, finalY + 60)
      doc.setFontSize(10)
      doc.text(`${calculations.selectedPlan.months} months at ${calculations.selectedPlan.interestRate}% APR`, 20, finalY + 70)
      doc.text(`Monthly Payment: ${formatCurrency(calculations.selectedPlan.monthlyPayment)}`, 20, finalY + 80)
    }
    
    doc.save('treatment-cost-estimate.pdf')
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              Select treatments and customize options for accurate pricing
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Options */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="nhs"
              checked={useNHS}
              onCheckedChange={setUseNHS}
            />
            <Label htmlFor="nhs">NHS Pricing</Label>
          </div>
          
          {showInsuranceEstimator && (
            <div className="flex items-center space-x-2">
              <Switch
                id="insurance"
                checked={hasInsurance}
                onCheckedChange={setHasInsurance}
              />
              <Label htmlFor="insurance">I have dental insurance</Label>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regions.map(region => (
                  <SelectItem key={region.name} value={region.name}>
                    {region.name} ({region.factor > 1 ? '+' : ''}{Math.round((region.factor - 1) * 100)}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Cost Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Select</th>
                <th className="text-left py-2">Treatment</th>
                <th className="text-left py-2">Category</th>
                <th className="text-right py-2">Private Cost</th>
                {costs.some(c => c.nhsCost !== undefined) && (
                  <th className="text-right py-2">NHS Cost</th>
                )}
                {hasInsurance && (
                  <th className="text-right py-2">Insurance Coverage</th>
                )}
              </tr>
            </thead>
            <tbody>
              {costs.map((item, index) => {
                const isSelected = selectedItems.has(item.item)
                const displayCost = useNHS && item.nhsCost !== undefined ? item.nhsCost : item.cost
                const coverage = insuranceCoverage[item.category || 'basic'] || 0
                
                return (
                  <tr key={index} className="border-b">
                    <td className="py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleItemToggle(item.item)}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{item.item}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge variant="outline" className={getCategoryColor(item.category)}>
                        {item.category || 'basic'}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">{formatCurrency(item.cost * regionFactor)}</td>
                    {costs.some(c => c.nhsCost !== undefined) && (
                      <td className="py-3 text-right">
                        {item.nhsCost !== undefined ? formatCurrency(item.nhsCost) : '-'}
                      </td>
                    )}
                    {hasInsurance && (
                      <td className="py-3 text-right text-green-600">
                        {isSelected && coverage > 0 ? `${coverage}% (${formatCurrency(displayCost * coverage / 100)})` : '-'}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <Separator />

        {/* Cost Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(calculations.baseCost)}</span>
          </div>
          
          {regionFactor !== 1 && (
            <div className="flex items-center justify-between text-sm">
              <span>Regional adjustment ({selectedRegion}):</span>
              <span>{formatCurrency(calculations.regionalCost - calculations.baseCost)}</span>
            </div>
          )}
          
          {hasInsurance && calculations.insuranceDiscount > 0 && (
            <div className="flex items-center justify-between text-sm text-green-600">
              <span>Insurance coverage:</span>
              <span>-{formatCurrency(calculations.insuranceDiscount)}</span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total Cost:</span>
            <span>{formatCurrency(calculations.finalCost)}</span>
          </div>
        </div>

        {/* Payment Calculator */}
        {showPaymentCalculator && calculations.finalCost > 0 && (
          <>
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Payment Plan Calculator
              </h4>
              
              <div>
                <Label>Payment Period: {paymentMonths[0]} months</Label>
                <Slider
                  value={paymentMonths}
                  onValueChange={setPaymentMonths}
                  min={3}
                  max={24}
                  step={3}
                  className="mt-2"
                />
              </div>
              
              <div className="grid gap-3">
                {calculations.plans.map(plan => (
                  <div
                    key={plan.months}
                    className={cn(
                      "p-3 border rounded-lg cursor-pointer transition-colors",
                      plan.months === paymentMonths[0] 
                        ? "border-primary bg-primary/5" 
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setPaymentMonths([plan.months])}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{plan.months} months</p>
                        <p className="text-sm text-muted-foreground">
                          {plan.interestRate === 0 ? 'Interest-free' : `${plan.interestRate}% APR`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(plan.monthlyPayment)}/month</p>
                        {plan.interestRate > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Total: {formatCurrency(plan.monthlyPayment * plan.months)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {calculations.selectedPlan.interestRate === 0 && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    This payment plan is interest-free!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}

        {/* Insurance Information */}
        {showInsuranceEstimator && hasInsurance && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Insurance Coverage Rates:</p>
              <ul className="text-sm space-y-1">
                <li>• Preventive: {insuranceCoverage.preventive}%</li>
                <li>• Basic: {insuranceCoverage.basic}%</li>
                <li>• Major: {insuranceCoverage.major}%</li>
                <li>• Cosmetic: {insuranceCoverage.cosmetic}%</li>
              </ul>
              <p className="text-xs mt-2">
                Coverage may vary. Please check with your insurance provider for exact details.
              </p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}