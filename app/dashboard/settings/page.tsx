'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User, 
  Bell, 
  Lock, 
  Stethoscope, 
  MapPin,
  Save,
  Phone,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface UserSettings {
  notifications: {
    emailNewsletter: boolean
    emailAppointmentReminders: boolean
    emailEducationalContent: boolean
    smsReminders: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'professionals' | 'private'
    shareDataForResearch: boolean
  }
  professional?: {
    gdcNumber: string
    practiceAddress: string
    practicePhone: string
    acceptingPatients: boolean
    specialties: string[]
  }
  emergency: {
    dentistName: string
    dentistPhone: string
    preferredHospital: string
  }
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser()
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Initialize settings from user metadata or defaults
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      emailNewsletter: true,
      emailAppointmentReminders: true,
      emailEducationalContent: false,
      smsReminders: false,
    },
    privacy: {
      profileVisibility: 'private',
      shareDataForResearch: false,
    },
    professional: {
      gdcNumber: '',
      practiceAddress: '',
      practicePhone: '',
      acceptingPatients: false,
      specialties: [],
    },
    emergency: {
      dentistName: '',
      dentistPhone: '',
      preferredHospital: '',
    },
  })
  
  const isProfessional = user?.unsafeMetadata?.userType === 'professional'
  
  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      // Save settings to user metadata
      await user?.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          settings,
        },
      })
      
      toast.success('Settings saved successfully')
      setHasChanges(false)
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }
  
  const updateSetting = (category: keyof UserSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }))
    setHasChanges(true)
  }
  
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-1">Manage your preferences and account information</p>
        </div>
        
        {hasChanges && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have unsaved changes. Don't forget to save before leaving.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Lock className="w-4 h-4 mr-2" />
              Privacy
            </TabsTrigger>
            {isProfessional && (
              <TabsTrigger value="professional">
                <Stethoscope className="w-4 h-4 mr-2" />
                Professional
              </TabsTrigger>
            )}
            <TabsTrigger value="emergency">
              <Phone className="w-4 h-4 mr-2" />
              Emergency
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your basic account information from Clerk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input value={user?.primaryEmailAddress?.emailAddress || ''} disabled />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input value={user?.firstName || ''} disabled />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input value={user?.lastName || ''} disabled />
                  </div>
                </div>
                <div>
                  <Label>Account Type</Label>
                  <div className="mt-2">
                    <Badge variant={isProfessional ? 'default' : 'secondary'}>
                      {isProfessional ? 'Professional' : 'Patient'}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  To update your profile information, please use the Clerk user button in the header.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to receive updates and reminders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Email Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="newsletter">Newsletter</Label>
                        <p className="text-sm text-gray-500">Weekly dental health tips and news</p>
                      </div>
                      <Switch
                        id="newsletter"
                        checked={settings.notifications.emailNewsletter}
                        onCheckedChange={(checked) => 
                          updateSetting('notifications', 'emailNewsletter', checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="reminders">Appointment Reminders</Label>
                        <p className="text-sm text-gray-500">Get reminded about dental check-ups</p>
                      </div>
                      <Switch
                        id="reminders"
                        checked={settings.notifications.emailAppointmentReminders}
                        onCheckedChange={(checked) => 
                          updateSetting('notifications', 'emailAppointmentReminders', checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="educational">Educational Content</Label>
                        <p className="text-sm text-gray-500">New articles and guides</p>
                      </div>
                      <Switch
                        id="educational"
                        checked={settings.notifications.emailEducationalContent}
                        onCheckedChange={(checked) => 
                          updateSetting('notifications', 'emailEducationalContent', checked)
                        }
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">SMS Notifications</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms">SMS Reminders</Label>
                      <p className="text-sm text-gray-500">Urgent reminders via text message</p>
                    </div>
                    <Switch
                      id="sms"
                      checked={settings.notifications.smsReminders}
                      onCheckedChange={(checked) => 
                        updateSetting('notifications', 'smsReminders', checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>
                  Control your data and profile visibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="visibility">Profile Visibility</Label>
                  <Select
                    value={settings.privacy.profileVisibility}
                    onValueChange={(value) => 
                      updateSetting('privacy', 'profileVisibility', value)
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private (Only you)</SelectItem>
                      <SelectItem value="professionals">Dental Professionals Only</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-2">
                    Choose who can see your profile information
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="research">Share Data for Research</Label>
                    <p className="text-sm text-gray-500">
                      Help improve dental care by sharing anonymous data
                    </p>
                  </div>
                  <Switch
                    id="research"
                    checked={settings.privacy.shareDataForResearch}
                    onCheckedChange={(checked) => 
                      updateSetting('privacy', 'shareDataForResearch', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {isProfessional && (
            <TabsContent value="professional">
              <Card>
                <CardHeader>
                  <CardTitle>Professional Information</CardTitle>
                  <CardDescription>
                    Manage your professional profile and practice details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="gdc">GDC Number</Label>
                    <Input
                      id="gdc"
                      value={settings.professional?.gdcNumber || ''}
                      onChange={(e) => 
                        updateSetting('professional', 'gdcNumber', e.target.value)
                      }
                      placeholder="Enter your GDC number"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Practice Address</Label>
                    <Textarea
                      id="address"
                      value={settings.professional?.practiceAddress || ''}
                      onChange={(e) => 
                        updateSetting('professional', 'practiceAddress', e.target.value)
                      }
                      placeholder="Enter your practice address"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Practice Phone</Label>
                    <Input
                      id="phone"
                      value={settings.professional?.practicePhone || ''}
                      onChange={(e) => 
                        updateSetting('professional', 'practicePhone', e.target.value)
                      }
                      placeholder="Enter practice phone number"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="accepting">Accepting New Patients</Label>
                      <p className="text-sm text-gray-500">
                        Show your practice as accepting new patients
                      </p>
                    </div>
                    <Switch
                      id="accepting"
                      checked={settings.professional?.acceptingPatients || false}
                      onCheckedChange={(checked) => 
                        updateSetting('professional', 'acceptingPatients', checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          <TabsContent value="emergency">
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contacts</CardTitle>
                <CardDescription>
                  Save important contact information for dental emergencies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="dentist-name">Your Dentist's Name</Label>
                  <Input
                    id="dentist-name"
                    value={settings.emergency.dentistName}
                    onChange={(e) => 
                      updateSetting('emergency', 'dentistName', e.target.value)
                    }
                    placeholder="Dr. Smith"
                  />
                </div>
                
                <div>
                  <Label htmlFor="dentist-phone">Dentist's Emergency Number</Label>
                  <Input
                    id="dentist-phone"
                    value={settings.emergency.dentistPhone}
                    onChange={(e) => 
                      updateSetting('emergency', 'dentistPhone', e.target.value)
                    }
                    placeholder="0123 456 7890"
                  />
                </div>
                
                <div>
                  <Label htmlFor="hospital">Preferred Hospital/A&E</Label>
                  <Input
                    id="hospital"
                    value={settings.emergency.preferredHospital}
                    onChange={(e) => 
                      updateSetting('emergency', 'preferredHospital', e.target.value)
                    }
                    placeholder="Local Hospital Name"
                  />
                </div>
                
                <Alert>
                  <MapPin className="h-4 w-4" />
                  <AlertDescription>
                    This information is stored locally and can be quickly accessed during emergencies
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}