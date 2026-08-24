import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Share2, PlusSquare, ArrowRight, ShieldCheck, Zap, X } from 'lucide-react';

export function PWAInstallOverlay() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 1. Check if running in standalone mode (already installed & opened from home screen)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    const standalone = checkStandalone();

    // 2. Check if iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // 3. Listen for Chrome / Android beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!standalone) {
        setShowModal(true);
      }
    };

    // 4. Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowModal(false);
      setIsStandalone(true);
      console.log('[PWA] 🎉 App was successfully installed on device!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // If not standalone and not installed, show modal after brief 1.2s delay
    if (!standalone) {
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 1200);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          console.log('[PWA] User accepted the install prompt');
          setShowModal(false);
        } else {
          console.log('[PWA] User dismissed the install prompt');
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('[PWA] Error triggering install prompt:', err);
      }
    } else {
      // If browser already consumed prompt, instruct user
      alert('To install the app:\n1. Tap the 3-dots menu (⋮) in Chrome.\n2. Tap "Install App" or "Add to Home screen".');
    }
  };

  // If already running as installed standalone app, render nothing
  if (isStandalone || isInstalled) {
    return null;
  }

  // If user dismissed modal, show a slim persistent light banner
  if (isDismissed) {
    return (
      <div className="fixed bottom-3 left-3 right-3 md:left-auto md:right-4 md:bottom-4 z-[9999] bg-white border border-zinc-200/90 text-zinc-900 rounded-2xl shadow-xl shadow-zinc-900/10 p-3.5 flex items-center justify-between gap-3 animate-fade-in max-w-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-zinc-900 truncate">Install App for Best Experience</p>
            <p className="text-[11px] text-zinc-500 truncate">Instant launch & lock-screen alerts</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition shrink-0"
        >
          Install
        </button>
      </div>
    );
  }

  if (!showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[99999] bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-zinc-200/90 rounded-3xl shadow-2xl shadow-zinc-900/15 overflow-hidden p-6 md:p-8 text-center">
        
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-amber-500" />

        {/* Dismiss Button */}
        <button
          onClick={() => {
            setShowModal(false);
            setIsDismissed(true);
          }}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 p-1.5 rounded-full hover:bg-zinc-100 transition"
          title="Continue in browser"
        >
          <X className="w-5 h-5" />
        </button>

        {/* College Emblem */}
        <div className="relative mx-auto w-20 h-20 mb-3 mt-1 flex items-center justify-center">
          <div className="absolute inset-0 bg-indigo-100 rounded-full blur-lg opacity-70" />
          <img
            src="/logo.png"
            alt="VSBEC Logo"
            className="w-18 h-18 rounded-full border-2 border-amber-500/80 shadow-md object-contain bg-white relative z-10 p-0.5"
          />
        </div>

        {/* Official Tag Badge */}
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-[11px] font-bold tracking-wide uppercase rounded-full mb-3">
          📱 Official App Required
        </span>

        {/* Title & Subtitle */}
        <h2 className="text-2xl font-black text-zinc-900 tracking-tight mb-1">
          Install IT TaskManager
        </h2>
        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">
          Department of Information Technology, VSBEC
        </p>

        <p className="text-xs text-zinc-600 leading-relaxed mb-5 px-2 font-medium">
          To ensure seamless access, real-time push notifications, and fast loading without browser toolbars, please install this portal as an official app on your device.
        </p>

        {/* Features Checklist */}
        <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 mb-6 text-left space-y-2.5">
          <div className="flex items-center gap-3 text-xs text-zinc-700 font-medium">
            <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span><b className="text-zinc-900 font-semibold">Instant Launch:</b> Opens from your Home Screen like a native app</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-700 font-medium">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span><b className="text-zinc-900 font-semibold">Lock-Screen Alerts:</b> Never miss assignment deadlines</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-700 font-medium">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
              <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <span><b className="text-zinc-900 font-semibold">Full Screen:</b> Clean interface with no browser URL bars</span>
          </div>
        </div>

        {/* Instructions for iOS Safari */}
        {isIOS ? (
          <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-4 mb-5 text-left">
            <p className="text-xs font-bold text-indigo-900 mb-2 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-indigo-600" />
              <span>How to Install on iPhone / iPad:</span>
            </p>
            <ol className="text-[12px] text-zinc-700 space-y-1.5 list-decimal list-inside leading-snug">
              <li>Tap the <b>Share button</b> (<Share2 className="w-3.5 h-3.5 inline text-indigo-600" />) at the bottom of Safari.</li>
              <li>Scroll down and tap <b>"Add to Home Screen"</b> (<PlusSquare className="w-3.5 h-3.5 inline text-indigo-600" />).</li>
              <li>Tap <b>"Add"</b> in the top right corner.</li>
            </ol>
          </div>
        ) : (
          /* Primary Install Button for Android / Chrome / PC */
          <button
            onClick={handleInstallClick}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-98 mb-3 cursor-pointer"
          >
            <Download className="w-4 h-4 animate-bounce" />
            <span>INSTALL APP ON THIS DEVICE (1-TAP)</span>
          </button>
        )}

        {/* Secondary Bypass Button */}
        <button
          onClick={() => {
            setShowModal(false);
            setIsDismissed(true);
          }}
          className="text-xs text-zinc-500 hover:text-zinc-800 transition py-1 font-medium flex items-center justify-center gap-1 mx-auto cursor-pointer"
        >
          <span>Continue in Chrome browser for now</span>
          <ArrowRight className="w-3 h-3" />
        </button>

      </div>
    </div>
  );
}

export default PWAInstallOverlay;
