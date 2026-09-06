import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Send,
  User,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Copy,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  Loader2,
  X,
  Phone,
  Mail,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import {
  isPushSupported,
  getNotificationPermissionState,
  checkIsPushSubscribed,
  subscribeToPushNotifications
} from './pushNotificationClient';

export interface MandatoryComplianceProps {
  user: any;
  token: string | null;
  apiUrl: string;
  telegramStats: any;
  studentProfileCompletion?: {
    percentage: number;
    missingSections: string[];
    isLoaded: boolean;
  };
  onRefreshTelegramStatus?: () => void;
  onNavigateToProfile?: () => void;
  onUpdateUser?: (updatedUser: any) => void;
  addToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  isOpen: boolean;
  onClose: () => void;
}

export const MandatoryComplianceModal: React.FC<MandatoryComplianceProps> = ({
  user,
  token,
  apiUrl,
  telegramStats,
  studentProfileCompletion,
  onRefreshTelegramStatus,
  onNavigateToProfile,
  onUpdateUser,
  addToast,
  isOpen,
  onClose
}) => {
  // Push Notification State
  const [pushSupported, setPushSupported] = useState<boolean>(false);
  const [pushSubscribed, setPushSubscribed] = useState<boolean>(false);
  const [pushPermission, setPushPermission] = useState<string>('default');
  const [pushLoading, setPushLoading] = useState<boolean>(false);

  // Telegram Linking State
  const [verifyingTelegram, setVerifyingTelegram] = useState<boolean>(false);

  // Staff/Faculty Profile Edit State
  const [isEditingStaffProfile, setIsEditingStaffProfile] = useState<boolean>(false);
  const [staffPhone, setStaffPhone] = useState<string>(user?.phone || '');
  const [staffEmail, setStaffEmail] = useState<string>(user?.email || '');
  const [staffBio, setStaffBio] = useState<string>(user?.bio || '');
  const [savingStaffProfile, setSavingStaffProfile] = useState<boolean>(false);

  const isStudent = user?.role === 'STUDENT';
  const effectiveIdentifier = user?.register_number || user?.username || '';
  const botUsername = telegramStats?.botUsername || 'IT_TaskManager_Alerts_bot';
  const directStartUrl = `https://t.me/${botUsername}?start=${encodeURIComponent(effectiveIdentifier)}`;

  // 1. Check Push Notification Status
  useEffect(() => {
    const checkPush = async () => {
      const supported = isPushSupported();
      setPushSupported(supported);
      if (supported) {
        const perm = getNotificationPermissionState();
        setPushPermission(perm);
        const isSub = await checkIsPushSubscribed();
        setPushSubscribed(isSub || perm === 'granted');
      }
    };
    checkPush();
  }, [isOpen, token]);

  // Sync staff profile state when user changes
  useEffect(() => {
    if (user) {
      setStaffPhone(user.phone || '');
      setStaffEmail(user.email || '');
      setStaffBio(user.bio || '');
    }
  }, [user]);

  // Window Focus Auto-Sync for Telegram Link
  useEffect(() => {
    const handleFocus = () => {
      if (token && onRefreshTelegramStatus) {
        onRefreshTelegramStatus();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [token, onRefreshTelegramStatus]);

  // Enable Push Handler
  const handleEnablePush = async () => {
    if (!token) return;
    setPushLoading(true);
    try {
      const res = await subscribeToPushNotifications(token, apiUrl);
      if (res.success) {
        setPushSubscribed(true);
        setPushPermission('granted');
        addToast?.(res.message || 'Push notifications enabled successfully! 🔔', 'success');
      } else {
        addToast?.(res.message || 'Please allow notification permission in your browser.', 'info');
        setPushPermission(getNotificationPermissionState());
      }
    } catch (err: any) {
      console.error('[Compliance Modal] Push enable error:', err);
      addToast?.('Could not activate push notifications', 'error');
    } finally {
      setPushLoading(false);
    }
  };

  // Verify Telegram Link
  const handleVerifyTelegram = async () => {
    setVerifyingTelegram(true);
    try {
      if (onRefreshTelegramStatus) {
        await onRefreshTelegramStatus();
      }
      addToast?.('Checking Telegram connection...', 'info');
    } finally {
      setTimeout(() => setVerifyingTelegram(false), 600);
    }
  };

  // Staff / Faculty Profile Save Handler
  const handleSaveStaffProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffPhone || !staffEmail) {
      addToast?.('Please enter both mobile number and email address.', 'error');
      return;
    }
    setSavingStaffProfile(true);
    try {
      const res = await fetch(`${apiUrl}/api/settings/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: staffPhone,
          email: staffEmail,
          bio: staffBio
        })
      });
      const data = await res.json();
      if (res.ok) {
        addToast?.('Profile details updated successfully! ✅', 'success');
        if (data.user && onUpdateUser) {
          onUpdateUser(data.user);
        }
        setIsEditingStaffProfile(false);
      } else {
        addToast?.(data.error || 'Failed to update profile details', 'error');
      }
    } catch {
      addToast?.('Error updating profile information', 'error');
    } finally {
      setSavingStaffProfile(false);
    }
  };

  // Determine Completion States
  const isPushDone = pushSubscribed || pushPermission === 'granted';
  const isTelegramDone = Boolean(user?.telegram_chat_id || telegramStats?.currentUserLinked);
  const isProfileDone = isStudent
    ? (studentProfileCompletion?.percentage === 100)
    : Boolean(user?.phone && user?.email);

  const completedCount = (isPushDone ? 1 : 0) + (isTelegramDone ? 1 : 0) + (isProfileDone ? 1 : 0);
  const isAllComplete = completedCount === 3;
  const progressPercent = Math.round((completedCount / 3) * 100);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-left"
        >
          {/* Top Gradient Banner */}
          <div className="h-2 bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-500 shrink-0" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer z-10"
            title="Review Later"
          >
            <X size={20} />
          </button>

          {/* Header Section */}
          <div className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0 pr-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 mb-0.5">
                  <Sparkles size={11} className="text-amber-600" />
                  Mandatory Portal Compliance
                </div>
                <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Complete Your Account Onboarding
                </h2>
              </div>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              All department members ({user?.role?.replace(/_/g, ' ')}) must complete the 3 essential communication & profile channels to receive automated task alerts, verification results, and official broadcasts.
            </p>

            {/* Overall Progress Meter */}
            <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80">
              <div className="flex items-center justify-between text-xs font-black mb-1.5">
                <span className="text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  Compliance Status: {completedCount}/3 Completed
                </span>
                <span className={isAllComplete ? "text-emerald-600 font-extrabold" : "text-indigo-600 font-extrabold"}>
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500 rounded-full",
                    isAllComplete
                      ? "bg-emerald-500"
                      : "bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-500"
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Body: 3 Mandatory Tasks */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">

            {/* ── 1. Push Notifications ── */}
            <div className={cn(
              "p-4 sm:p-5 rounded-2xl border transition-all",
              isPushDone
                ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                : "bg-white dark:bg-zinc-800/80 border-amber-200 dark:border-amber-800/70 shadow-xs"
            )}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs",
                    isPushDone
                      ? "bg-emerald-600 text-white"
                      : "bg-indigo-600 text-white"
                  )}>
                    {isPushDone ? <CheckCircle2 size={20} /> : <BellRing size={20} className="animate-bounce" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      1. Enable Browser & Lock-Screen Notifications
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                        isPushDone
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700"
                          : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700"
                      )}>
                        {isPushDone ? '🟢 Enabled' : '⚡ Required'}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Receive instant Chrome & desktop alerts for new tasks, submissions, deadline reminders & verifications.
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {isPushDone ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-700">
                      <CheckCircle2 size={14} /> Active on this Device
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEnablePush}
                      disabled={pushLoading}
                      className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {pushLoading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Activating...</span>
                        </>
                      ) : (
                        <>
                          <Bell size={14} />
                          <span>1-Click Enable Push</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {pushPermission === 'denied' && (
                <div className="mt-2 p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                  <span>
                    Notifications are blocked in your browser settings. Please click the padlock/settings icon in the address bar to allow notifications.
                  </span>
                </div>
              )}
            </div>

            {/* ── 2. Telegram Bot Alerts & Group ── */}
            <div className={cn(
              "p-4 sm:p-5 rounded-2xl border transition-all",
              isTelegramDone
                ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                : "bg-white dark:bg-zinc-800/80 border-sky-200 dark:border-sky-800/70 shadow-xs"
            )}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs",
                    isTelegramDone
                      ? "bg-emerald-600 text-white"
                      : "bg-[#0088cc] text-white"
                  )}>
                    {isTelegramDone ? <CheckCircle2 size={20} /> : <Send size={18} className="-rotate-12" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      2. Connect Telegram Bot & Official Group
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                        isTelegramDone
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700"
                          : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700"
                      )}>
                        {isTelegramDone ? '🟢 Connected' : '⚡ Required'}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Link your Telegram account to <b>@{botUsername}</b> for 1-to-1 deadline reminders, verification results, and department broadcasts.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleVerifyTelegram}
                    disabled={verifyingTelegram}
                    className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl transition cursor-pointer"
                    title="Refresh Telegram Connection Status"
                  >
                    <RefreshCw size={14} className={cn(verifyingTelegram && "animate-spin text-indigo-600")} />
                  </button>

                  {isTelegramDone ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-700">
                      <CheckCircle2 size={14} /> Linked: @{user?.telegram_username || 'Active'}
                    </div>
                  ) : (
                    <a
                      href={directStartUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Send size={13} className="-rotate-12" />
                      <span>1-Click Connect Bot</span>
                    </a>
                  )}
                </div>
              </div>

              {!isTelegramDone && (
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 font-mono text-[11px]">
                    <span>Or send:</span>
                    <code className="bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-300 font-bold border border-zinc-200 dark:border-zinc-600">
                      /link {effectiveIdentifier}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`/link ${effectiveIdentifier}`);
                        addToast?.(`Copied "/link ${effectiveIdentifier}"! Paste it into @${botUsername} on Telegram.`, 'success');
                      }}
                      className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-500 cursor-pointer"
                      title="Copy link command"
                    >
                      <Copy size={13} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href="https://t.me/it_taskmanager"
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-lg hover:bg-sky-100 transition flex items-center gap-1"
                    >
                      <ExternalLink size={11} /> Join Official Group
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* ── 3. Profile Information Update ── */}
            <div className={cn(
              "p-4 sm:p-5 rounded-2xl border transition-all",
              isProfileDone
                ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                : "bg-white dark:bg-zinc-800/80 border-purple-200 dark:border-purple-800/70 shadow-xs"
            )}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs",
                    isProfileDone
                      ? "bg-emerald-600 text-white"
                      : "bg-purple-600 text-white"
                  )}>
                    {isProfileDone ? <CheckCircle2 size={20} /> : <User size={18} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      3. Update Account & Profile Information
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                        isProfileDone
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700"
                          : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700"
                      )}>
                        {isProfileDone ? '🟢 Complete' : isStudent ? `${studentProfileCompletion?.percentage || 0}% Filled` : '⚡ Action Required'}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {isStudent
                        ? 'Fill your contact phone, bio, technical skills, projects, and coding profiles (GitHub, LeetCode).'
                        : 'Maintain up-to-date contact details (mobile phone, email ID, and department bio).'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {isStudent ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToProfile?.();
                      }}
                      className={cn(
                        "px-4 py-2 text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer",
                        isProfileDone
                          ? "bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700"
                          : "bg-purple-600 hover:bg-purple-700 text-white"
                      )}
                    >
                      <User size={14} />
                      <span>{isProfileDone ? 'View Student Profile' : 'Fill Profile Now (100%)'}</span>
                      <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingStaffProfile(prev => !prev)}
                      className={cn(
                        "px-4 py-2 text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer",
                        isProfileDone
                          ? "bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700"
                          : "bg-purple-600 hover:bg-purple-700 text-white"
                      )}
                    >
                      <User size={14} />
                      <span>{isEditingStaffProfile ? 'Hide Editor' : isProfileDone ? 'Edit Details' : 'Update Contact Info'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Student Missing Sections Breakdown */}
              {isStudent && studentProfileCompletion?.missingSections && studentProfileCompletion.missingSections.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                    Pending Profile Sections:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {studentProfileCompletion.missingSections.map((sec, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                      >
                        ⚠️ {sec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Non-Student Inline Profile Form */}
              {!isStudent && isEditingStaffProfile && (
                <form onSubmit={handleSaveStaffProfile} className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700/60 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1 mb-1">
                        <Phone size={12} className="text-purple-600" /> Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={staffPhone}
                        onChange={e => setStaffPhone(e.target.value)}
                        placeholder="e.g., +91 9876543210"
                        required
                        className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-purple-500 outline-hidden font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1 mb-1">
                        <Mail size={12} className="text-purple-600" /> Official Email ID <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={staffEmail}
                        onChange={e => setStaffEmail(e.target.value)}
                        placeholder="e.g., hod.it@college.edu"
                        required
                        className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-purple-500 outline-hidden font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1 mb-1">
                      <FileText size={12} className="text-purple-600" /> Professional Bio / Specialization
                    </label>
                    <textarea
                      value={staffBio}
                      onChange={e => setStaffBio(e.target.value)}
                      placeholder="e.g., Associate Professor & Head of IT Department. Research interests in Cloud Computing & AI."
                      rows={2}
                      className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-purple-500 outline-hidden font-medium resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingStaffProfile(false)}
                      className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingStaffProfile}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {savingStaffProfile ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      <span>Save Profile Information</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 text-center sm:text-left">
              {isAllComplete ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 size={15} /> All mandatory requirements completed! Thank you.
                </span>
              ) : (
                <span>⚠️ Complete all 3 steps to ensure seamless communication & tracking.</span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
              >
                {isAllComplete ? 'Close' : 'Review Later'}
              </button>

              {isAllComplete && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  <span>Proceed to Dashboard</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MandatoryComplianceModal;
