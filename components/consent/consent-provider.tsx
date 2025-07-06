'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ConsentBanner, ConsentState } from './consent-banner';

interface ConsentContextType {
  consent: ConsentState;
  hasConsent: (type: keyof ConsentState) => boolean;
  updateConsent: (consent: ConsentState) => void;
  showConsentSettings: () => void;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>({
    necessary: true,
    analytics: false,
    marketing: false,
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Load consent from localStorage
    const storedConsent = localStorage.getItem('consent_preferences');
    if (storedConsent) {
      setConsent(JSON.parse(storedConsent));
    }
  }, []);

  const hasConsent = (type: keyof ConsentState) => {
    return consent[type] || false;
  };

  const updateConsent = (newConsent: ConsentState) => {
    setConsent(newConsent);
    localStorage.setItem('consent_preferences', JSON.stringify(newConsent));
  };

  const showConsentSettings = () => {
    setShowSettings(true);
  };

  return (
    <ConsentContext.Provider
      value={{ consent, hasConsent, updateConsent, showConsentSettings }}
    >
      {children}
      <ConsentBanner />
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
}