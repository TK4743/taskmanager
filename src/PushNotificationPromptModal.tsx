import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Sparkles, CheckCircle2, X, Smartphone, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  isPushSupported,
  checkIsPushSubscribed,
  subscribeToPushNotifications,
  getNotificationPermissionState
} from './pushNotificationClient';

interface PushNotificationPromptModalProps {
  token: string | null;
  apiUrl?: string;
  addToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  onSubscribed?: () => void;
}

export const PushNotificationPromptModal: React.FC<PushNotificationPromptModalProps> = ({
  token,
  apiUrl = '',
  addToast,
  onSubscribed
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isStandaloneApp, setIsStandaloneApp] = useState(false);

  useEffect(() => {
    // Only prompt logged-in users with a valid token
    if (!token) return;

    // Check if push notifications are supported on this browser/device
    if (!isPushSupported()) return;

    // If permission already granted or explicitly denied by user settings, don't show prompt
    const perm = getNotificationPermissionState();
    if (perm === 'granted' || perm === 'denied') return;

    // Detect if running as installed standalone PWA app or browser
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandaloneApp(isStandalone);

    // Check if user dismissed prompt recently (within last 3 days)
    const dismissedAt = localStorage.getItem('push_prompt_dismissed_at');
    if (dismissedAt) {
      const diffMs = Date.now() - parseInt(dismissedAt, 10);
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      if (diffMs < threeDaysMs) return;
    }

    // Verify current subscription status with ServiceWorker
    checkIsPushSubscribed().then((isSubscribed) => {
      if (!isSubscribed) {
        // Show prompt with a short delay for smooth UI entrance
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, isStandalone ? 1200 : 2500);
        return () => clearTimeout(timer);
      }
    });
  }, [token]);

  const handleEnablePush = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await subscribeToPushNotifications(token, apiUrl);
      if (res.success) {
        setIsOpen(false);
        addToast?.(res.message || 'Lock-screen notifications enabled!', 'success');
        onSubscribed?.();
      } else {
        addToast?.(res.message || 'Notification permission was not enabled', 'info');
        setIsOpen(false);
        localStorage.setItem('push_prompt_dismissed_at', Date.now().toString());
      }
    } catch (err: any) {
      console.error('[Push Modal] Enable error:', err);
      addToast?.('Could not activate push notifications', 'error');
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem('push_prompt_dismissed_at', Date.now().toString());
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-3 sm:p-4 pointer-events-none">
        {/* Backdrop for mobile */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs pointer-events-auto sm:hidden"
        />

        {/* Modal / Card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white border border-zinc-200/90 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 pointer-events-auto text-left"
        >
          {/* Top subtle gradient line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-500" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
            aria-label="Dismiss notification prompt"
          >
            <X size={18} />
          </button>

          {/* Header with Icon and Badge */}
          <div className="flex items-start gap-3.5 mb-3.5">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <BellRing size={22} className="animate-bounce" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white ring-2 ring-amber-400/40 animate-pulse" />
            </div>

            <div className="min-w-0 pr-6">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80 uppercase tracking-wider mb-1">
                {isStandaloneApp ? (
                  <>
                    <Smartphone size={11} className="text-indigo-600" /> App Installed
                  </>
                ) : (
                  <>
                    <Zap size={11} className="text-amber-600" /> Instant Alerts
                  </>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight leading-snug">
                Enable Lock-Screen Notifications
              </h3>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-4">
            Get instant lock-screen alerts for new academic tasks, deadline extensions, verification results, and notice board announcements directly on your device.
          </p>

          {/* Features Pills */}
          <div className="grid grid-cols-3 gap-2 p-2.5 bg-zinc-50 border border-zinc-100 rounded-2xl mb-5 text-center">
            <div className="p-1">
              <p className="text-[11px] font-bold text-zinc-900">📋 New Tasks</p>
              <p className="text-[10px] text-zinc-500">Instant Alert</p>
            </div>
            <div className="p-1 border-x border-zinc-200/80">
              <p className="text-[11px] font-bold text-zinc-900">✅ Verifications</p>
              <p className="text-[10px] text-zinc-500">Live Status</p>
            </div>
            <div className="p-1">
              <p className="text-[11px] font-bold text-zinc-900">📢 Notices</p>
              <p className="text-[10px] text-zinc-500">Department</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={handleEnablePush}
              disabled={loading}
              className="w-full sm:flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-70 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enabling...</span>
                </>
              ) : (
                <>
                  <Bell size={16} />
                  <span>Enable Notifications</span>
                </>
              )}
            </button>

            <button
              onClick={handleDismiss}
              disabled={loading}
              className="w-full sm:w-auto py-2.5 px-4 text-xs font-bold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
            >
              Maybe Later
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PushNotificationPromptModal;
