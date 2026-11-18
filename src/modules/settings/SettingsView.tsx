import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User, Lock, KeyRound, Shield, Check, Eye, EyeOff,
  Bell, Smartphone, Send, ExternalLink, ShieldCheck,
  CheckCircle2, AlertTriangle, Save, RefreshCw,
  Loader2, BellOff, Info, Copy, Megaphone, Zap, Settings
} from 'lucide-react';
import {
  isPushSupported,
  getNotificationPermissionState,
  checkIsPushSubscribed,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  sendTestPushNotification
} from '../../utils/pushNotificationClient';
import { API_URL } from '../../config';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLayout } from '../../components/layout/PageLayout';
import { getStudentRegisterNumber } from '../../components/common/helpers';
import { SystemAutomationControlsCard } from '../admin/SystemAutomationControlsCard';
import type { User as UserType, ToastType } from '../../types';

export function SettingsView({
  user,
  token,
  addToast
}: {
  user: UserType | null;
  token: string | null;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');



  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch(`${API_URL}/api/settings/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Password changed successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.error || 'Failed to change password');
        addToast(data.error || 'Failed to change password', 'error');
      }
    } catch (err) {
      setPasswordError('Error connecting to server');
      addToast('Error changing password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const [telegramStats, setTelegramStats] = useState<any>(null);
  const [groupChatIdInput, setGroupChatIdInput] = useState('');
  const [savingGroupChat, setSavingGroupChat] = useState(false);
  const [sendingSummary, setSendingSummary] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  // Web Push Notification States
  const [pushSupported, setPushSupported] = useState<boolean>(false);
  const [pushSubscribed, setPushSubscribed] = useState<boolean>(false);
  const [pushPermission, setPushPermission] = useState<string>('default');
  const [pushLoading, setPushLoading] = useState<boolean>(false);
  const [pushTestLoading, setPushTestLoading] = useState<boolean>(false);

  useEffect(() => {
    const checkPush = async () => {
      const supported = isPushSupported();
      setPushSupported(supported);
      if (supported) {
        const perm = getNotificationPermissionState();
        setPushPermission(perm);
        const isSub = await checkIsPushSubscribed();
        setPushSubscribed(isSub);

        // If user already granted permission in browser, ensure subscription is synced to DB
        if (perm === 'granted' && token) {
          subscribeToPushNotifications(token, API_URL)
            .then(res => {
              if (res.success) {
                setPushSubscribed(true);
              }
            })
            .catch(() => { });
        }
      }
    };
    checkPush();
  }, [token]);

  const handleTogglePush = async () => {
    setPushLoading(true);
    try {
      if (pushSubscribed) {
        const res = await unsubscribeFromPushNotifications(token, API_URL);
        if (res.success) {
          setPushSubscribed(false);
          addToast(res.message, 'info');
        } else {
          addToast(res.message, 'error');
        }
      } else {
        const res = await subscribeToPushNotifications(token, API_URL);
        if (res.success) {
          setPushSubscribed(true);
          setPushPermission('granted');
          addToast(res.message, 'success');
        } else {
          setPushPermission(getNotificationPermissionState());
          addToast(res.message, 'error');
        }
      }
    } catch {
      addToast('Failed to update push notification settings', 'error');
    } finally {
      setPushLoading(false);
    }
  };

  const handleSendTestPush = async () => {
    setPushTestLoading(true);
    try {
      // Show immediate notification on laptop/desktop via active Service Worker
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.showNotification) {
            reg.showNotification('🔔 VSBEC IT Vault', {
              body: '✅ Desktop notification test succeeded on this laptop!',
              icon: `${window.location.origin}/logo.png`,
              badge: `${window.location.origin}/badge.png`,
              tag: `test-local-${Date.now()}`,
              requireInteraction: true
            });
          }
        } catch (localErr) {
          console.warn('[Push] Local notification warning:', localErr);
        }
      }

      const res = await sendTestPushNotification(token, API_URL);
      if (res.success) {
        addToast(res.message, 'success');
      } else {
        addToast(res.message, 'error');
      }
    } catch {
      addToast('Error sending test push notification', 'error');
    } finally {
      setPushTestLoading(false);
    }
  };

  const fetchTelegramStatus = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/telegram/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTelegramStats(data);
        if (data.groupChatId) setGroupChatIdInput(data.groupChatId);
      }
    } catch (err) {
      console.error('Error fetching Telegram status:', err);
    }
  };

  useEffect(() => {
    fetchTelegramStatus();
  }, [token]);

  const handleSaveGroupChat = async () => {
    if (!groupChatIdInput.trim()) {
      addToast('Please enter a valid Group Chat ID', 'error');
      return;
    }
    setSavingGroupChat(true);
    try {
      const res = await fetch(`${API_URL}/api/telegram/set-group-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ chatId: groupChatIdInput.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message || 'Group Chat ID saved!', 'success');
        fetchTelegramStatus();
      } else {
        addToast(data.error || 'Failed to save Group Chat ID', 'error');
      }
    } catch {
      addToast('Error saving Group Chat ID', 'error');
    } finally {
      setSavingGroupChat(false);
    }
  };

  const handleSendGroupSummaryNow = async () => {
    setSendingSummary(true);
    try {
      const res = await fetch(`${API_URL}/api/telegram/send-group-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetChatId: groupChatIdInput.trim() || undefined })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast(data.message || 'Group summary sent to Telegram!', 'success');
      } else {
        addToast(data.message || data.error || 'Failed to send group summary', 'error');
      }
    } catch {
      addToast('Error sending group summary', 'error');
    } finally {
      setSendingSummary(false);
    }
  };

  const handleSendRemindersNow = async () => {
    setSendingReminders(true);
    try {
      const res = await fetch(`${API_URL}/api/telegram/send-reminders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast(data.details || `Reminders sent to ${data.notifiedCount} student(s)!`, 'success');
      } else {
        addToast(data.details || data.error || 'Failed to send reminders', 'error');
      }
    } catch {
      addToast('Error triggering reminders', 'error');
    } finally {
      setSendingReminders(false);
    }
  };

  const handleSendTestMessage = async (targetId?: string) => {
    setSendingTest(true);
    try {
      const res = await fetch(`${API_URL}/api/telegram/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetChatId: targetId })
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Test notification sent successfully to Telegram!', 'success');
      } else {
        addToast(data.error || 'Failed to send test message', 'error');
      }
    } catch {
      addToast('Error sending test message', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    if (!confirm('Are you sure you want to disconnect your Telegram account from IT Vault?')) return;
    try {
      const res = await fetch(`${API_URL}/api/student/unlink-telegram`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Telegram disconnected successfully.', 'info');
        fetchTelegramStatus();
      }
    } catch {
      addToast('Error disconnecting Telegram', 'error');
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6 w-full pb-12">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
              <Settings size={24} className="text-zinc-900" /> Account Settings
            </h1>
            <p className="text-xs text-zinc-500 font-medium">Manage your account security and preferences</p>
          </div>
        </div>

        {/* Account Details Overview */}
        <Card className="p-6 bg-white border-zinc-200">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <User size={16} className="text-indigo-600" /> Account Identity Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Full Name</p>
              <p className="text-sm font-bold text-zinc-900 truncate">{user?.full_name}</p>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Role</p>
              <p className="text-sm font-bold text-zinc-900 truncate">{user?.role}</p>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Username / ID</p>
              <p className="text-sm font-bold text-zinc-900 truncate">{user?.register_number || user?.username}</p>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Email</p>
              <p className="text-sm font-bold text-zinc-900 truncate">{user?.email || 'N/A'}</p>
            </div>
          </div>
        </Card>

        {/* ── Supreme Admin System Automation & Backup Controls ── */}
        {user?.role === 'SUPREME_ADMIN' && (
          <SystemAutomationControlsCard token={token} addToast={addToast} />
        )}

        {/* ── Native Mobile & Lock Screen Web Push Notifications Section ── */}
        <Card className="p-6 bg-white border-zinc-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div id="app-logo-slot" className="logo-container w-11 h-11 rounded-full bg-white flex items-center justify-center border border-zinc-200 shadow-sm p-1.5 shrink-0 overflow-hidden" aria-label="Company Logo Slot">
                <img src="/logo.png" alt="IT Vault Logo" className="w-full h-full object-contain" width="44" height="44" loading="eager" decoding="async" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                  Mobile & Lock Screen Notifications (PWA)
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${pushSubscribed
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}>
                    {pushSubscribed ? '🟢 Active & Subscribed' : '⚪ Inactive'}
                  </span>
                </h3>
                <p className="text-xs text-zinc-500">Real-time alerts on your phone lock screen for new assignments & verification results</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {!pushSupported ? (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
                <AlertTriangle size={18} className="shrink-0 text-amber-600" />
                <span>
                  Push notifications are not supported on this specific browser. If you are on an iPhone/iPad, please tap <b>Share &gt; Add to Home Screen</b> to install the app and enable notifications (iOS 16.4+).
                </span>
              </div>
            ) : (
              <div className="p-5 bg-gradient-to-br from-indigo-50/70 to-purple-50/50 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-zinc-900 text-sm flex items-center gap-2">
                    {pushSubscribed ? '🔔 Lock Screen Alerts Enabled' : '🔕 Lock Screen Alerts Disabled'}
                  </h4>
                  <p className="text-xs text-zinc-600 max-w-xl">
                    {pushSubscribed
                      ? 'This device is registered to receive instant push alerts whenever a task is assigned, reviewed, or verified.'
                      : 'Enable lock-screen notifications to get notified instantly even when the app is closed or in your pocket.'}
                  </p>
                  {pushPermission === 'denied' && (
                    <p className="text-xs font-semibold text-rose-600 mt-1">
                      ⚠️ Notifications are currently blocked in your browser settings. Please allow notifications for this site.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <Button
                    variant={pushSubscribed ? 'outline' : 'primary'}
                    className={`text-xs py-2.5 px-4 font-bold ${pushSubscribed
                      ? 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
                      }`}
                    disabled={pushLoading || pushPermission === 'denied'}
                    onClick={handleTogglePush}
                  >
                    {pushLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : pushSubscribed ? (
                      <BellOff size={14} />
                    ) : (
                      <Bell size={14} />
                    )}
                    <span>{pushSubscribed ? 'Disable on this Device' : 'Enable Phone Notifications'}</span>
                  </Button>

                  {pushSubscribed && (
                    <Button
                      variant="outline"
                      className="text-xs py-2.5 px-3.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold"
                      disabled={pushTestLoading}
                      onClick={handleSendTestPush}
                    >
                      {pushTestLoading ? <Loader2 size={14} className="animate-spin" /> : <Smartphone size={14} />}
                      <span>Send Test Push</span>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Mobile App Installation Tip */}
            <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 text-[11px] text-zinc-500 flex items-start gap-2.5">
              <Info size={15} className="shrink-0 text-zinc-400 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-zinc-700">📱 Mobile App Installation Tip:</span>
                <p>
                  For the best experience on mobile, install this app on your Home Screen (Android: Tap <b>Install App</b>; iOS: Tap <b>Share &gt; Add to Home Screen</b>).
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Telegram Notifications Section ── */}
        <Card className="p-6 bg-white border-zinc-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <Send size={20} className="-rotate-12 translate-x-0.5" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                  Telegram Automated Notifications
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                    100% Free & Auto
                  </span>
                </h3>
                <p className="text-xs text-zinc-500">Instant 1-to-1 deadline reminders and department group summaries</p>
              </div>
            </div>
          </div>

          {/* Student Specific Telegram Connection */}
          {user?.role === 'STUDENT' && (
            <div className="space-y-4">
              {telegramStats?.currentUserLinked ? (
                <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                        Connected to @{telegramStats.botUsername}
                      </h4>
                      <p className="text-xs text-emerald-800">
                        {telegramStats.currentUserTelegram ? `@${telegramStats.currentUserTelegram} • ` : ''}
                        You are set up to receive 1-to-1 deadline reminders on Telegram!
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      className="text-xs py-2 px-3 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                      disabled={sendingTest}
                      onClick={() => handleSendTestMessage()}
                    >
                      {sendingTest ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
                      <span>Send Test Alert</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-xs py-2 px-3 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={handleUnlinkTelegram}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (() => {
                const studentRegNo = getStudentRegisterNumber(user);
                return (
                  <div className="p-5 bg-gradient-to-br from-sky-50 via-indigo-50/40 to-violet-50/40 rounded-2xl border border-sky-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-zinc-900 text-sm flex items-center gap-2">
                            <Bell size={16} className="text-sky-600" /> Connect Telegram for Private Deadline Alerts
                          </h4>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-mono">
                            {studentRegNo || 'Student'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 max-w-lg">
                          Get private task reminders on your phone 24 hours before deadlines, verification results, and check your LeetCode/GitHub stats anytime.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`https://t.me/${telegramStats?.botUsername || 'IT_TaskManager_Alerts_bot'}?start=${encodeURIComponent(studentRegNo)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs text-white bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600 hover:from-sky-600 hover:to-indigo-700 shadow-md shadow-sky-500/25 transition-all shrink-0"
                        >
                          <Send size={14} className="-rotate-12" />
                          <span>1-Click Auto-Link ({studentRegNo})</span>
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-sky-100 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-zinc-700 shrink-0">Command:</span>
                          <code className="bg-zinc-100 text-indigo-700 font-mono font-bold px-2 py-0.5 rounded border border-zinc-200 truncate">
                            /link {studentRegNo}
                          </code>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`/link ${studentRegNo}`);
                            addToast(`Copied "/link ${studentRegNo}" to clipboard! Reply to @${telegramStats?.botUsername || 'IT_TaskManager_Alerts_bot'}.`, 'success');
                          }}
                          className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1 rounded-lg border border-sky-200 transition-colors shrink-0 flex items-center gap-1"
                        >
                          <Copy size={12} />
                          <span>Copy</span>
                        </button>
                      </div>

                      <a
                        href={`https://t.me/${telegramStats?.botUsername || 'IT_TaskManager_Alerts_bot'}?text=${encodeURIComponent(`/link ${studentRegNo}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 p-2.5 bg-white hover:bg-zinc-50 rounded-xl border border-sky-100 text-xs font-bold text-zinc-700 hover:text-zinc-900 transition-colors"
                      >
                        <ExternalLink size={13} className="text-sky-600" />
                        <span>Open Pre-filled /link Command</span>
                      </a>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Admin / Faculty Management Section */}
          {user?.role !== 'STUDENT' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Telegram Bot</p>
                  <p className="text-xs font-bold text-zinc-900 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    @{telegramStats?.botUsername || 'IT_TaskManager_Alerts_bot'}
                  </p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Students Connected</p>
                  <p className="text-sm font-black text-indigo-600 mt-0.5">
                    {telegramStats?.linkedStudents || 0} <span className="text-zinc-400 text-xs font-normal">/ {telegramStats?.totalStudents || 0} students</span>
                  </p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Auto Schedule</p>
                  <p className="text-xs font-bold text-zinc-700 mt-0.5">
                    ⏰ 8 PM (Reminders) • 9 PM (Summary)
                  </p>
                </div>
              </div>

              {/* Group Chat Configuration */}
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-extrabold text-zinc-800 block">Department / Class Telegram Group Chat ID</label>
                    <p className="text-[11px] text-zinc-500">Group summaries will automatically be posted to this group ID every evening.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={groupChatIdInput}
                    onChange={e => setGroupChatIdInput(e.target.value)}
                    placeholder="Enter Telegram Channel / Group ID (e.g. -1001234567890)"
                    className="text-xs bg-white"
                  />
                  <Button
                    onClick={handleSaveGroupChat}
                    disabled={savingGroupChat}
                    className="bg-black hover:bg-zinc-800 text-white text-xs font-bold shrink-0"
                  >
                    {savingGroupChat ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>Save</span>
                  </Button>
                </div>
              </div>

              {/* Instant Broadcast Actions */}
              <div className="pt-2 border-t border-zinc-100">
                <p className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2.5">Manual Notification Triggers</p>
                <div className="flex flex-wrap gap-2.5">
                  <Button
                    variant="primary"
                    disabled={sendingSummary}
                    onClick={handleSendGroupSummaryNow}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2"
                  >
                    {sendingSummary ? <Loader2 size={14} className="animate-spin" /> : <Megaphone size={14} />}
                    <span>Broadcast Group Summary Now</span>
                  </Button>

                  <Button
                    variant="outline"
                    disabled={sendingReminders}
                    onClick={handleSendRemindersNow}
                    className="text-xs font-bold border-zinc-300 text-zinc-800 hover:bg-zinc-100 flex items-center gap-2"
                  >
                    {sendingReminders ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
                    <span>Send Reminders to Pending Students Now</span>
                  </Button>

                  <Button
                    variant="ghost"
                    disabled={sendingTest}
                    onClick={() => handleSendTestMessage(groupChatIdInput.trim() || undefined)}
                    className="text-xs font-bold text-zinc-600 hover:text-zinc-900 flex items-center gap-1.5"
                  >
                    {sendingTest ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                    <span>Test Notification</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Change Password Card */}
        <Card className="p-6 bg-white border-zinc-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
            <div>
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <KeyRound size={18} className="text-amber-600" /> Change Password
              </h3>
              <p className="text-xs text-zinc-500">Update your login security credentials</p>
            </div>
          </div>

          {passwordError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Current account password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                >
                  {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="New password (minimum 8 characters)"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                >
                  {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Confirm new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                >
                  {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={changingPassword} variant="primary" className="px-6 flex items-center gap-2">
                {changingPassword ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                <span>Update Password</span>
              </Button>
            </div>
          </form>
        </Card>


      </div>
    </PageLayout>
  );
}


export default SettingsView;
