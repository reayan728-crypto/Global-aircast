import { useState, useEffect } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
      setIsInstalled(isStandaloneMode);
    };

    checkStandalone();

    // Check pre-captured prompt on window
    const win = window as unknown as { __deferredPWAInstallPrompt?: BeforeInstallPromptEvent };
    if (win.__deferredPWAInstallPrompt) {
      setDeferredPrompt(win.__deferredPWAInstallPrompt);
    }

    // Detect iOS devices
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      (window as unknown as { __deferredPWAInstallPrompt?: BeforeInstallPromptEvent }).__deferredPWAInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      (window as unknown as { __deferredPWAInstallPrompt?: BeforeInstallPromptEvent | null }).__deferredPWAInstallPrompt = null;
    };

    const handlePromptReady = () => {
      const p = (window as unknown as { __deferredPWAInstallPrompt?: BeforeInstallPromptEvent }).__deferredPWAInstallPrompt;
      if (p) {
        setDeferredPrompt(p);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-prompt-ready', handlePromptReady);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
    };
  }, []);

  const install = async (): Promise<'accepted' | 'dismissed' | 'unsupported'> => {
    const promptEvent = deferredPrompt || (window as unknown as { __deferredPWAInstallPrompt?: BeforeInstallPromptEvent }).__deferredPWAInstallPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          (window as unknown as { __deferredPWAInstallPrompt?: BeforeInstallPromptEvent | null }).__deferredPWAInstallPrompt = null;
        }
        return choice.outcome;
      } catch (err) {
        console.warn('PWA install error:', err);
      }
    }

    // If inside an iframe (like AI Studio Build preview), the browser disables beforeinstallprompt.
    // Opening the URL directly in a window allows the browser's install prompt to fire immediately with 1 click.
    if (window.self !== window.top) {
      window.open(window.location.href, '_blank');
      return 'accepted';
    }

    return 'unsupported';
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isStandalone,
    isIOS,
    install,
    deferredPrompt
  };
}
