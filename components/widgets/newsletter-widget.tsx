"use client"

import type React from "react"

import { useState } from "react"
import { Mail, CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function NewsletterWidget() {
  const [email, setEmail] = useState("")
  const [preferences, setPreferences] = useState({
    weeklyTips: true,
    newArticles: true,
    professionalUpdates: false,
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSubmitted(true)
    setIsLoading(false)
  }

  if (isSubmitted) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">Welcome to our community!</h3>
          <p className="text-green-700 mb-4">
            You'll receive your first dental health tip within 24 hours. Check your email to confirm your subscription.
          </p>
          <Button
            variant="outline"
            onClick={() => setIsSubmitted(false)}
            className="border-green-300 text-green-700 hover:bg-green-100 bg-transparent"
          >
            Subscribe Another Email
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-blue-50 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center text-primary">
          <Mail className="w-6 h-6 mr-3" />
          Stay Informed About Your Dental Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-gray-600 mb-4">
              Get evidence-based dental health tips, new article notifications, and expert advice delivered to your
              inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading} className="sm:w-auto">
                {isLoading ? (
                  "Subscribing..."
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">What would you like to receive?</p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="weeklyTips"
                  checked={preferences.weeklyTips}
                  onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, weeklyTips: checked as boolean }))}
                />
                <Label htmlFor="weeklyTips" className="text-sm">
                  Weekly dental health tips
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newArticles"
                  checked={preferences.newArticles}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, newArticles: checked as boolean }))
                  }
                />
                <Label htmlFor="newArticles" className="text-sm">
                  New articles and guides
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="professionalUpdates"
                  checked={preferences.professionalUpdates}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, professionalUpdates: checked as boolean }))
                  }
                />
                <Label htmlFor="professionalUpdates" className="text-sm">
                  Professional updates (for dental professionals)
                </Label>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            By subscribing, you agree to our privacy policy. Unsubscribe at any time.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
