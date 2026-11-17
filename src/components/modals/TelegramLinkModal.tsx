import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, CheckCircle2, Bell, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { getStudentRegisterNumber } from '../common/helpers';
import type { User } from '../../types';

export interface TelegramStats {
  botUsername?: string;
  currentUserLinked?: boolean;
  currentUserTelegram?: string;
}

export interface TelegramLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  telegramStats: TelegramStats | null;
  sendingTest: boolean;
  handleSendTestMessage: () => void;
  handleUnlinkTelegram: () => void;
}

export function TelegramLinkModal({
  isOpen,
  onClose,
  user,
  telegramStats,
  sendingTest,
  handleSendTestMessage,
  handleUnlinkTelegram,
}: TelegramLinkModalProps) {
  if (!isOpen) return null;

  const regNo = getStudentRegisterNumber(user);
  const studentName = user?.full_name || 'Student';
  const botUsername = telegramStats?.botUsername || 'IT_TaskManager_Alerts_bot';
  const directStartUrl = `https://t.me/${botUsername}?start=${encodeURIComponent(regNo)}`;
  const isAlreadyLinked = Boolean(user?.telegram_chat_id || telegramStats?.currentUserLinked);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[130] flex items-center justify-center p-4 cursor-pointer"
        onClick={onClose}
      >
        <motion.div
          onClick={e => e.stopPropagation()}
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          className="bg-white dark:bg-[#181820] rounded-3xl p-6 sm:p-8 w-full max-w-3xl shadow-2xl relative overflow-hidden border border-zinc-100 dark:border-zinc-800 max-h-[92vh] overflow-y-auto cursor-default"
        >
          {/* Top decorative gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-sky-400 via-indigo-500 to-violet-600" />

          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <X size={22} />
          </button>

          {/* Header + Student Profile Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
                <Send size={24} className="-rotate-12" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Connect Telegram Alerts
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  Instant task notifications, deadline alerts & coding reports
                </p>
              </div>
            </div>

            {/* Student Identity Badge */}
            <div className="p-2.5 px-3.5 bg-gradient-to-r from-zinc-50 to-sky-50/50 dark:from-zinc-900 dark:to-sky-950/30 rounded-2xl border border-sky-100 dark:border-sky-900/40 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                {studentName.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate">{studentName}</p>
                <p className="text-[11px] font-bold text-sky-700 dark:text-sky-400 font-mono">
                  Reg: <span className="bg-sky-100 dark:bg-sky-950 px-1 py-0.2 rounded text-sky-900 dark:text-sky-300 font-extrabold">{regNo || 'N/A'}</span>
                </p>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                {isAlreadyLinked ? '🟢 Connected' : 'Ready'}
              </span>
            </div>
          </div>

          {/* Already Linked State */}
          {isAlreadyLinked ? (
            <div className="space-y-4 mb-6">
              <div className="p-5 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border-2 border-emerald-200 dark:border-emerald-850 text-center space-y-2">
                <CheckCircle2 size={36} className="text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h4 className="font-extrabold text-emerald-950 dark:text-emerald-200 text-base">
                  Your Personal Alerts Bot is Active!
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 max-w-lg mx-auto">
                  Connected to <b>@{botUsername}</b> {telegramStats?.currentUserTelegram ? `(@${telegramStats.currentUserTelegram})` : ''}.
                  You will receive 1-to-1 deadline notifications and live coding updates privately.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <a
                  href="https://t.me/it_taskmanager"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-[#0088cc]/10 border border-[#0088cc]/30 hover:bg-[#0088cc]/20 transition-all flex items-center justify-between gap-3 text-zinc-900 dark:text-zinc-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0088cc] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Send size={18} className="-rotate-12" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Official Group</p>
                      <h5 className="text-sm font-black text-zinc-900 dark:text-zinc-100">IT Department Community</h5>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#0088cc] bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-[#0088cc]/30 shrink-0">
                    Open →
                  </span>
                </a>

                <a
                  href={`https://t.me/${botUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all flex items-center justify-between gap-3 text-zinc-900 dark:text-zinc-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Send size={18} className="-rotate-12" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Personal Bot</p>
                      <h5 className="text-sm font-black text-zinc-900 dark:text-zinc-100">@{botUsername}</h5>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 shrink-0">
                    Open DM →
                  </span>
                </a>
              </div>

              <div className="flex items-center gap-2 justify-center pt-2">
                <Button
                  variant="outline"
                  className="text-xs py-2 px-4 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950"
                  disabled={sendingTest}
                  onClick={handleSendTestMessage}
                >
                  {sendingTest ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
                  <span>Send Test Alert</span>
                </Button>
                <Button
                  variant="ghost"
                  className="text-xs py-2 px-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={handleUnlinkTelegram}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* 2-Column Side-by-Side Setup Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* STEP 1: Join Department Telegram Group */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0088cc]/10 via-[#0088cc]/5 to-white dark:to-zinc-900 border-2 border-[#0088cc]/30 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-[#0088cc] text-white px-2.5 py-0.5 rounded-md shadow-xs">
                        STEP 1 • COMMUNITY
                      </span>
                      <span className="text-[11px] font-extrabold text-[#0088cc]">Official Group</span>
                    </div>
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-[#0088cc] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#0088cc]/25">
                        <Send size={20} className="-rotate-12" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-zinc-950 dark:text-zinc-100 leading-tight">
                          Join Telegram Group
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">
                          Daily morning/evening summaries, announcements & department notices
                        </p>
                      </div>
                    </div>
                  </div>

                  <a
                    href="https://t.me/it_taskmanager"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full py-3 px-4 bg-[#0088cc] hover:bg-[#0077b5] active:scale-98 text-white rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-[#0088cc]/25 text-center"
                  >
                    <Send size={15} className="-rotate-12" />
                    <span>Join Telegram Group</span>
                  </a>
                </div>

                {/* STEP 2: Activate 1-to-1 Alerts Bot */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-sky-50/50 to-white dark:to-zinc-900 border-2 border-indigo-300 dark:border-indigo-800 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white px-2.5 py-0.5 rounded-md shadow-xs">
                        STEP 2 • ALERTS BOT
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                        REQUIRED
                      </span>
                    </div>
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/25">
                        <Send size={20} className="-rotate-12" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-zinc-950 dark:text-zinc-100 leading-tight">
                          Start Personal Bot
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">
                          1-to-1 private 24h deadline alerts, scorecards & submission badges
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <a
                      href={directStartUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-sky-600 to-violet-600 hover:from-indigo-700 hover:to-sky-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 text-center"
                    >
                      <Send size={15} className="-rotate-12" />
                      <span>Start Bot & Auto-Link ({regNo})</span>
                    </a>
                    <p className="text-[10px] text-zinc-400 text-center font-medium">
                      Opens <b>@{botUsername}</b> and connects automatically upon clicking <b>START</b>
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 mb-4 text-xs text-zinc-700 dark:text-zinc-300">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black">✓</span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Instant Task Alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black">✓</span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">24h Deadline Alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black">✓</span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Verification Badges</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black">✓</span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Coding Scorecard</span>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-center pt-3 border-t border-zinc-100 dark:border-zinc-800 mt-2">
            <Button
              type="button"
              variant="ghost"
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-bold"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default TelegramLinkModal;
