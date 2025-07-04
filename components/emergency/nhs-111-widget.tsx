import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Phone, ExternalLink, MessageCircle, Clock } from 'lucide-react'

export function NHS111Widget() {
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-blue-900">NHS 111 Service</CardTitle>
            <CardDescription className="text-blue-700">
              Free medical help and advice 24 hours a day
            </CardDescription>
          </div>
          <div className="text-blue-600">
            <Phone className="w-8 h-8" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-gray-900">When to use NHS 111:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
              <li>You need medical help fast but it's not a 999 emergency</li>
              <li>You think you need to go to A&E or need another NHS urgent care service</li>
              <li>You don't know who to call or you don't have a GP to call</li>
              <li>You need health information or reassurance about what to do next</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              asChild
            >
              <a href="tel:111">
                <Phone className="w-4 h-4 mr-2" />
                Call 111 Free
              </a>
            </Button>
            
            <Button 
              variant="outline"
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
              asChild
            >
              <a 
                href="https://111.nhs.uk" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                111 Online
              </a>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start space-x-2">
              <MessageCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">BSL Video Relay</p>
                <p className="text-gray-600">Available for deaf users</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Clock className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">24/7 Service</p>
                <p className="text-gray-600">Available every day</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-100 rounded-lg p-3 text-sm">
            <p className="font-medium text-blue-900 mb-1">For life-threatening emergencies:</p>
            <div className="flex items-center justify-between">
              <span className="text-blue-800">
                Difficulty breathing, chest pain, or severe bleeding
              </span>
              <Button 
                size="sm"
                variant="destructive"
                asChild
              >
                <a href="tel:999">Call 999</a>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}