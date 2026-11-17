import React from 'react';
import { Menu, FileDown, Send, CheckCircle2, Bell, CheckCheck, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import ThemeToggle from '../../ThemeToggle';
import { cn } from '../../lib/utils';
import type { User, TeamInvitation, Notification } from '../../types';
import { NotificationsDrawer } from '../modals/NotificationsDrawer';

export interface HeaderProps {
  view: string;
  isIndustry: boolean;
  codingPlatformTab?: 'LEETCODE' | 'GITHUB' | string;
  isAdmin: boolean;
  isHOD: boolean;
  isAdvisor: boolean;
  isCoordinator: boolean;
  isStudent: boolean;
  user: User | null;
  notifications: Notification[];
  showNotifications: boolean;
  setShowNotifications: React.Dispatch<React.SetStateAction<boolean>>;
  notificationDropdownRef: React.RefObject<HTMLDivElement | null>;
  markNotificationsRead: () => void;
  markSingleNotificationRead: (id: number | string) => void;
  handleRespondInvitation: (invitationId: string, response: 'ACCEPT' | 'REJECT' | 'DECLINE') => Promise<void>;
  myInvitations: TeamInvitation[];
  handleToggleSidebar: () => void;
  isMobileSidebarOpen: boolean;
  isDesktopSidebarOpen: boolean;
  setShowExportModal: (open: boolean) => void;
  setShowTelegramLinkModal: (open: boolean) => void;
  handleDownloadCombinedExcel?: () => void;
}

export function Header({
  view,
  isIndustry,
  codingPlatformTab = 'LEETCODE',
  isAdmin,
  isHOD,
  isAdvisor,
  isCoordinator,
  isStudent,
  user,
  notifications,
  showNotifications,
  setShowNotifications,
  notificationDropdownRef,
  markNotificationsRead,
  markSingleNotificationRead,
  handleRespondInvitation,
  myInvitations,
  handleToggleSidebar,
  isMobileSidebarOpen,
  isDesktopSidebarOpen,
  setShowExportModal,
  setShowTelegramLinkModal,
  handleDownloadCombinedExcel = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('download-coding-excel'));
    }
  }
}: HeaderProps) {
  return (
          <header className="h-14 md:h-20 bg-white border-b border-zinc-200 px-3 md:px-8 flex items-center justify-between shrink-0 gap-2">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <button
                type="button"
                onClick={handleToggleSidebar}
                className="p-2 -ml-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 flex items-center justify-center cursor-pointer"
                title={
                  (typeof window !== 'undefined' && window.innerWidth < 1024)
                    ? (isMobileSidebarOpen ? "Close navigation menu" : "Open navigation menu")
                    : (isDesktopSidebarOpen ? "Collapse sidebar" : "Expand sidebar")
                }
                aria-label="Toggle navigation menu"
              >
                <Menu size={22} className="stroke-[2.2]" />
              </button>
              <div className="min-w-0">
                <h2 className="text-sm md:text-xl font-bold text-zinc-900 tracking-tight truncate">
                  {(() => {
                    if (isIndustry) {
                      if (view === 'industry-portal' || view === 'dashboard') return 'Corporate Hiring & Assessments';
                      if (view === 'users') return 'Candidate Talent Pool';
                      if (view === 'settings') return 'Account Settings';
                    }
                    if (view === 'leetcode-targets' || view === 'coding-progress') {
                      if (codingPlatformTab === 'LEETCODE') return 'LeetCode';
                      if (codingPlatformTab === 'GITHUB') return 'GitHub';
                      return 'Coding Progress';
                    }
                    if (view === 'departments') return 'Departments';
                    if (view === 'industry-approvals') return 'Industry Partners';
                    if (view === 'my-class') return 'My Class';
                    if (view === 'notice-board') return 'Notice Board';
                    if (view === 'analyzer') return 'Progress Analyzer';
                    if (view === 'verification') return 'Verification';
                    if (view === 'users') return 'User Management';
                    if (view === 'skill-assessment') return 'Skill Assessment';
                    if (view === 'placement-readiness') return 'Placement Rating';
                    if (view === 'institutional-skill-heatmap') return 'Skill Heatmap';
                    if (view === 'live-teaching-hub') return 'Live Teaching Hub';
                    if (view === 'tasks') return 'Tasks';
                    return view.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                  })()}
                </h2>
                <p className="hidden sm:block text-xs font-semibold text-zinc-400 uppercase tracking-wider truncate">
                  {isIndustry ? 'IT Vault • Corporate Portal' : 'VSBEC IT Vault'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              {(isAdmin || isHOD || isAdvisor || isCoordinator) && (
                <>
                  {/* Desktop: show full button text; Mobile: icon only */}
                  <Button variant="success" className="hidden sm:flex items-center gap-2" onClick={() => (view === 'leetcode-targets' || view === 'coding-progress') ? handleDownloadCombinedExcel() : setShowExportModal(true)}>
                    <FileDown size={18} /> {isAdmin || isHOD ? 'Export Custom Report' : 'Export Class Report'}
                  </Button>
                  <Button variant="success" className="sm:hidden flex items-center justify-center p-2 aspect-square" title={isAdmin || isHOD ? 'Export Custom Report' : 'Export Class Report'} onClick={() => (view === 'leetcode-targets' || view === 'coding-progress') ? handleDownloadCombinedExcel() : setShowExportModal(true)}>
                    <FileDown size={16} />
                  </Button>
                </>
              )}
              {isStudent && !user?.telegram_chat_id && (
                <>
                  <button
                    onClick={() => setShowTelegramLinkModal(true)}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all animate-pulse shrink-0"
                  >
                    <Send size={13} className="-rotate-12" /> Connect Telegram
                  </button>
                  <button
                    onClick={() => setShowTelegramLinkModal(true)}
                    className="sm:hidden p-2 rounded-full text-xs font-bold bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all animate-pulse shrink-0"
                    title="Connect Telegram"
                  >
                    <Send size={14} className="-rotate-12" />
                  </button>
                </>
              )}
              {isStudent && user?.telegram_chat_id && (
                <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  <CheckCircle2 size={12} /> Telegram Linked
                </span>
              )}
              <ThemeToggle />

              <div className="relative" ref={notificationDropdownRef}>
                <button
                  className={cn(
                    "p-2.5 rounded-xl transition-all relative border shadow-2xs group/bell cursor-pointer flex items-center justify-center",
                    notifications.filter(n => !n.is_read).length > 0
                      ? "text-amber-500 hover:text-amber-600 bg-amber-50/90 hover:bg-amber-100/90 border-amber-200/80 shadow-amber-500/10"
                      : "text-zinc-500 hover:text-zinc-700 bg-white hover:bg-zinc-50 border-zinc-200"
                  )}
                  onClick={() => setShowNotifications(prev => !prev)}
                  title="Notifications"
                >
                  <Bell size={20} className={cn("transition-transform group-hover/bell:scale-110", notifications.filter(n => !n.is_read).length > 0 ? "text-amber-500" : "text-zinc-500")} />
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <>
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-ping" />
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-[10px] font-bold text-white rounded-full border-2 border-white flex items-center justify-center shadow-xs">
                        {notifications.filter(n => !n.is_read).length > 9 ? '9+' : notifications.filter(n => !n.is_read).length}
                      </span>
                    </>
                  )}
                </button>

                <NotificationsDrawer
                  isOpen={showNotifications}
                  onClose={() => setShowNotifications(false)}
                  notifications={notifications}
                  markNotificationsRead={markNotificationsRead}
                  markSingleNotificationRead={markSingleNotificationRead}
                  myInvitations={myInvitations}
                  handleRespondInvitation={handleRespondInvitation as any}
                />
              </div>
            </div>
          </header>

  );
}
