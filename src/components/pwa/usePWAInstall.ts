'use client';

import { useState, useEffect, useCallback } from 'react';

// Extended type for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running in standalone mode (already installed as PWA)
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };

    checkStandalone();

    // Check if dismissed from localStorage
    const dismissed = localStorage.getItem('lapis_lada_pwa_dismissed') === 'true';
    setIsDismissed(dismissed);

    // Detect iOS (Safari / WebKit)
    const ua = window.navigator.userAgent;
    const isIosDevice =
      /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream && !('BeforeInstallPromptEvent' in window);
    setIsIOS(isIosDevice);

    // Capture beforeinstallprompt event on Android / Chromium
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Capture appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    if (isInstalled) return;

    // If on iOS, open the step-by-step visual instruction modal
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    // If deferredPrompt is available (Chromium/Android)
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('[PWA] Prompt error:', err);
      }
      return;
    }

    // Fallback if neither (e.g. desktop Chrome where prompt already fired or desktop Safari)
    setShowIOSModal(true);
  }, [deferredPrompt, isIOS, isInstalled]);

  const dismissBanner = useCallback(() => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lapis_lada_pwa_dismissed', 'true');
    }
  }, []);

  return {
    isInstalled,
    isIOS,
    showIOSModal,
    setShowIOSModal,
    isDismissed,
    canInstall: !isInstalled,
    hasNativePrompt: !!deferredPrompt,
    triggerInstall,
    dismissBanner,
  };
}
