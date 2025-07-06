'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Cookie, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { analytics } from '@/lib/analytics-enhanced';

export interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  necessary: boolean; // Always true
}

declare global {
  interface Window {
    consentManager?: {
      hasConsent: (type: string) => boolean;
      updateConsent: (state: ConsentState) => void;
    };
    gtag?: (...args: any[]) => void;
  }
}

export function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check for existing consent
    const storedConsent = localStorage.getItem('consent_preferences');
    
    if (storedConsent) {
      const parsedConsent = JSON.parse(storedConsent);
      setConsent(parsedConsent);
      applyConsent(parsedConsent);
    } else {
      // Show banner if no consent stored
      setShowBanner(true);
      
      // Set default denied state for GTM
      if (window.gtag) {
        window.gtag('consent', 'default', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          wait_for_update: 2000, // Wait 2 seconds for user choice
        });
      }
    }

    // Set up consent manager
    window.consentManager = {
      hasConsent: (type: string) => {
        const currentConsent = JSON.parse(localStorage.getItem('consent_preferences') || '{}');
        return currentConsent[type] || false;
      },
      updateConsent: (state: ConsentState) => {
        setConsent(state);
        applyConsent(state);
      },
    };
  }, []);

  const applyConsent = (consentState: ConsentState) => {
    // Update GTM consent mode
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: consentState.analytics ? 'granted' : 'denied',
        ad_storage: consentState.marketing ? 'granted' : 'denied',
        ad_user_data: consentState.marketing ? 'granted' : 'denied',
        ad_personalization: consentState.marketing ? 'granted' : 'denied',
      });
    }

    // Store consent
    localStorage.setItem('consent_preferences', JSON.stringify(consentState));
    
    // Track consent update
    if (analytics) {
      analytics.track('consent_updated', {
        analytics_consent: consentState.analytics,
        marketing_consent: consentState.marketing,
        consent_method: 'banner',
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleAcceptAll = () => {
    const fullConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    setConsent(fullConsent);
    applyConsent(fullConsent);
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const minimalConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    setConsent(minimalConsent);
    applyConsent(minimalConsent);
    setShowBanner(false);
  };

  const handleSaveSettings = () => {
    applyConsent(consent);
    setShowSettings(false);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Consent Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <Card className="max-w-6xl mx-auto p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Cookie className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Cookie Consent</h3>
                <p className="text-sm text-muted-foreground">
                  We use cookies to enhance your experience on Dentistry Explained. We use necessary cookies
                  to make our site work. We'd also like to set analytics cookies to help us improve it and
                  marketing cookies to provide relevant content.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleAcceptAll}
                  >
                    Accept All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRejectAll}
                  >
                    Reject All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Settings
                  </Button>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              onClick={() => setShowBanner(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cookie Settings</DialogTitle>
            <DialogDescription>
              Manage your cookie preferences. You can enable or disable different types of cookies below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Necessary Cookies */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="font-medium">Necessary Cookies</Label>
                  <p className="text-sm text-muted-foreground">
                    These cookies are essential for the website to function properly.
                  </p>
                </div>
                <Switch checked={true} disabled />
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="font-medium">Analytics Cookies</Label>
                  <p className="text-sm text-muted-foreground">
                    Help us understand how visitors interact with our website to improve user experience.
                  </p>
                </div>
                <Switch
                  checked={consent.analytics}
                  onCheckedChange={(checked) =>
                    setConsent({ ...consent, analytics: checked })
                  }
                />
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="font-medium">Marketing Cookies</Label>
                  <p className="text-sm text-muted-foreground">
                    Used to provide relevant content and measure the effectiveness of our content.
                  </p>
                </div>
                <Switch
                  checked={consent.marketing}
                  onCheckedChange={(checked) =>
                    setConsent({ ...consent, marketing: checked })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}