'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Calculator, 
  AlertCircle, 
  Info,
  RotateCcw,
  Save
} from 'lucide-react'

interface CalculationResult {
  value: number
  unit: string
  interpretation?: string
  category?: 'normal' | 'warning' | 'danger'
}

interface CalculationHistory {
  id: string
  type: string
  inputs: Record<string, any>
  result: CalculationResult
  timestamp: Date
}

interface ClinicalCalculatorProps {
  className?: string
  showHistory?: boolean
  onSaveResult?: (result: CalculationHistory) => void
}

export function ClinicalCalculator({ 
  className, 
  showHistory = true,
  onSaveResult 
}: ClinicalCalculatorProps) {
  const [history, setHistory] = useState<CalculationHistory[]>([])
  
  // BMI Calculator State
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  const [heightUnit, setHeightUnit] = useState<'cm' | 'inches'>('cm')
  const [bmiResult, setBmiResult] = useState<CalculationResult | null>(null)
  
  // Dosage Calculator State
  const [patientWeight, setPatientWeight] = useState('')
  const [dosagePerKg, setDosagePerKg] = useState('')
  const [frequency, setFrequency] = useState('1')
  const [maxDailyDose, setMaxDailyDose] = useState('')
  const [dosageResult, setDosageResult] = useState<CalculationResult | null>(null)

  // BMI Calculation
  const calculateBMI = () => {
    const w = parseFloat(weight)
    const h = parseFloat(height)
    
    if (!w || !h) {
      setBmiResult(null)
      return
    }
    
    // Convert to metric if needed
    const weightInKg = weightUnit === 'lbs' ? w * 0.453592 : w
    const heightInM = heightUnit === 'inches' ? h * 0.0254 : h / 100
    
    const bmi = weightInKg / (heightInM * heightInM)
    
    let interpretation = ''
    let category: CalculationResult['category'] = 'normal'
    
    if (bmi < 18.5) {
      interpretation = 'Underweight'
      category = 'warning'
    } else if (bmi < 25) {
      interpretation = 'Normal weight'
      category = 'normal'
    } else if (bmi < 30) {
      interpretation = 'Overweight'
      category = 'warning'
    } else {
      interpretation = 'Obese'
      category = 'danger'
    }
    
    const result: CalculationResult = {
      value: Math.round(bmi * 10) / 10,
      unit: 'kg/m²',
      interpretation,
      category
    }
    
    setBmiResult(result)
    
    // Add to history
    const historyItem: CalculationHistory = {
      id: Date.now().toString(),
      type: 'BMI',
      inputs: { weight: w, weightUnit, height: h, heightUnit },
      result,
      timestamp: new Date()
    }
    
    setHistory(prev => [historyItem, ...prev].slice(0, 10))
  }
  
  // Dosage Calculation
  const calculateDosage = () => {
    const weight = parseFloat(patientWeight)
    const dosage = parseFloat(dosagePerKg)
    const freq = parseInt(frequency)
    const maxDaily = parseFloat(maxDailyDose)
    
    if (!weight || !dosage || !freq) {
      setDosageResult(null)
      return
    }
    
    const singleDose = weight * dosage
    const dailyDose = singleDose * freq
    
    let interpretation = ''
    let category: CalculationResult['category'] = 'normal'
    
    if (maxDaily && dailyDose > maxDaily) {
      interpretation = `Exceeds maximum daily dose of ${maxDaily}mg`
      category = 'danger'
    } else if (dailyDose > 3000) {
      interpretation = 'High daily dose - verify prescription'
      category = 'warning'
    } else {
      interpretation = 'Within normal range'
      category = 'normal'
    }
    
    const result: CalculationResult = {
      value: Math.round(singleDose * 10) / 10,
      unit: 'mg per dose',
      interpretation: `${Math.round(dailyDose * 10) / 10}mg daily. ${interpretation}`,
      category
    }
    
    setDosageResult(result)
    
    // Add to history
    const historyItem: CalculationHistory = {
      id: Date.now().toString(),
      type: 'Dosage',
      inputs: { patientWeight: weight, dosagePerKg: dosage, frequency: freq, maxDailyDose: maxDaily },
      result,
      timestamp: new Date()
    }
    
    setHistory(prev => [historyItem, ...prev].slice(0, 10))
  }
  
  const resetBMI = () => {
    setWeight('')
    setHeight('')
    setBmiResult(null)
  }
  
  const resetDosage = () => {
    setPatientWeight('')
    setDosagePerKg('')
    setFrequency('1')
    setMaxDailyDose('')
    setDosageResult(null)
  }
  
  const getResultColor = (category?: CalculationResult['category']) => {
    switch (category) {
      case 'normal':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'danger':
        return 'text-red-600'
      default:
        return ''
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Clinical Calculator
        </CardTitle>
        <CardDescription>
          Medical calculations for dental practice
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="bmi" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bmi">BMI Calculator</TabsTrigger>
            <TabsTrigger value="dosage">Dosage Calculator</TabsTrigger>
          </TabsList>
          
          {/* BMI Calculator */}
          <TabsContent value="bmi" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Weight</Label>
                  <div className="flex gap-2">
                    <Input
                      id="weight"
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="Enter weight"
                    />
                    <Select value={weightUnit} onValueChange={(v) => setWeightUnit(v as 'kg' | 'lbs')}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="height">Height</Label>
                  <div className="flex gap-2">
                    <Input
                      id="height"
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="Enter height"
                    />
                    <Select value={heightUnit} onValueChange={(v) => setHeightUnit(v as 'cm' | 'inches')}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="inches">in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={calculateBMI} className="flex-1">
                  Calculate BMI
                </Button>
                <Button variant="outline" size="icon" onClick={resetBMI}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
              
              {bmiResult && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>BMI:</span>
                        <span className={cn("font-bold text-lg", getResultColor(bmiResult.category))}>
                          {bmiResult.value} {bmiResult.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Category:</span>
                        <Badge variant={bmiResult.category === 'normal' ? 'default' : 'destructive'}>
                          {bmiResult.interpretation}
                        </Badge>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <p className="text-sm">BMI Categories:</p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>• Underweight: BMI &lt; 18.5</li>
                    <li>• Normal: BMI 18.5-24.9</li>
                    <li>• Overweight: BMI 25-29.9</li>
                    <li>• Obese: BMI ≥ 30</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
          
          {/* Dosage Calculator */}
          <TabsContent value="dosage" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="patient-weight">Patient Weight (kg)</Label>
                <Input
                  id="patient-weight"
                  type="number"
                  value={patientWeight}
                  onChange={(e) => setPatientWeight(e.target.value)}
                  placeholder="Enter patient weight in kg"
                />
              </div>
              
              <div>
                <Label htmlFor="dosage">Dosage (mg/kg)</Label>
                <Input
                  id="dosage"
                  type="number"
                  value={dosagePerKg}
                  onChange={(e) => setDosagePerKg(e.target.value)}
                  placeholder="Enter dosage per kg"
                />
              </div>
              
              <div>
                <Label htmlFor="frequency">Frequency (times per day)</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Once daily</SelectItem>
                    <SelectItem value="2">Twice daily</SelectItem>
                    <SelectItem value="3">Three times daily</SelectItem>
                    <SelectItem value="4">Four times daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="max-dose">Maximum Daily Dose (mg) - Optional</Label>
                <Input
                  id="max-dose"
                  type="number"
                  value={maxDailyDose}
                  onChange={(e) => setMaxDailyDose(e.target.value)}
                  placeholder="Enter maximum daily dose"
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={calculateDosage} className="flex-1">
                  Calculate Dosage
                </Button>
                <Button variant="outline" size="icon" onClick={resetDosage}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
              
              {dosageResult && (
                <Alert variant={dosageResult.category === 'danger' ? 'destructive' : 'default'}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Single Dose:</span>
                        <span className={cn("font-bold text-lg", getResultColor(dosageResult.category))}>
                          {dosageResult.value} {dosageResult.unit}
                        </span>
                      </div>
                      <p className="text-sm">{dosageResult.interpretation}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <p className="text-sm font-medium">Important:</p>
                  <ul className="text-sm mt-1 space-y-1">
                    <li>• Always verify calculations with prescribing guidelines</li>
                    <li>• Consider patient age, condition, and other medications</li>
                    <li>• Round doses to practical amounts</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Calculation History */}
        {showHistory && history.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-3">Recent Calculations</h4>
            <div className="space-y-2">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                  <div>
                    <span className="font-medium">{item.type}:</span>{' '}
                    <span className={getResultColor(item.result.category)}>
                      {item.result.value} {item.result.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {item.timestamp.toLocaleTimeString()}
                    </span>
                    {onSaveResult && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onSaveResult(item)}
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}