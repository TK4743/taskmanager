import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Briefcase, Terminal, Users, Award, FileBarChart,
  Building2, Settings, ClipboardList, Code2, Bell, FileCheck, TrendingUp,
  Video, Compass, Code, Sparkles, Map, GraduationCap, CheckSquare,
  FileSpreadsheet, UserCheck, LogOut, X, Target, Megaphone, Radio, Zap,
  BarChart3, ShieldCheck, CheckCircle2, User as UserIcon
} from 'lucide-react';
import { prefetchView } from '../common/helpers';
import { cn } from '../../lib/utils';
import { FEATURE_FLAGS } from '../../config';
import type { User } from '../../types';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  viewTarget?: string;
  badge?: string;
}

function SidebarItem({
  icon,
  label,
  active,
  onClick,
  viewTarget,
  badge
}: SidebarItemProps) {
  const handlePrefetch = () => {
    if (viewTarget) {
      prefetchView(viewTarget);
    }
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={handlePrefetch}
      onTouchStart={handlePrefetch}
      onFocus={handlePrefetch}
      className={cn(
        "flex items-center gap-2.5 w-full px-3 py-2 rounded-xl transition-all font-semibold text-xs leading-normal text-left group cursor-pointer",
        active
          ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/20"
          : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900"
      )}
    >
      <span className="shrink-0 transition-transform group-hover:scale-110 flex items-center justify-center">{icon}</span>
      <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis min-w-0 py-0.5 leading-normal">{label}</span>
      {badge && (
        <span className={cn(
          "ml-1.5 text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0 uppercase tracking-tight",
          active ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}

export interface SidebarProps {
  view: string;
  setView: (view: string) => void;
  user: User | null;
  isAdmin: boolean;
  isHOD: boolean;
  isAdvisor: boolean;
  isStudent: boolean;
  isCoordinator: boolean;
  isFaculty: boolean;
  isIndustry: boolean;
  isDesktopSidebarOpen: boolean;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  handleLogout: () => void;
  fetchNotices?: () => void;
  pendingIndustryList?: any[];
  pendingVerificationCount?: number;
}

export function Sidebar({
  view,
  setView,
  user,
  isAdmin,
  isHOD,
  isAdvisor,
  isStudent,
  isCoordinator,
  isFaculty,
  isIndustry,
  isDesktopSidebarOpen,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  handleLogout,
  fetchNotices = () => {},
  pendingIndustryList = [],
  pendingVerificationCount = 0
}: SidebarProps) {
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-zinc-100 flex items-center justify-between shrink-0 h-20">
        <div className="flex items-center gap-3">
          <div id="app-logo-slot" className="logo-container w-11 h-11 rounded-full bg-white p-1.5 overflow-hidden shrink-0 shadow-sm border border-zinc-200 flex items-center justify-center" aria-label="Company Logo Slot"></div>
          <div className="min-w-0">
            <span className="font-black text-sm tracking-tight text-zinc-900 block leading-tight">IT Vault</span>
            <span className={cn(
              "font-bold text-[10px] tracking-wider uppercase block truncate",
              isIndustry
                ? "text-indigo-600"
                : "text-zinc-500"
            )}>
              {isAdmin ? "SUPREME ADMIN" : isHOD ? "HOD PORTAL" : isIndustry ? "CORPORATE HR" : isAdvisor ? "ADVISOR" : isCoordinator ? "COORDINATOR" : "STUDENT"}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileSidebarOpen(false)}
          className="p-1 text-zinc-400 hover:text-zinc-900 lg:hidden rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Close navigation menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {isIndustry ? (
          <>
            <SidebarItem
              icon={<LayoutDashboard size={20} className="text-blue-500" />}
              label="Dashboard"
              active={view === 'industry-dashboard' || view === 'dashboard' || view === 'industry-portal'}
              onClick={() => { setView('industry-dashboard'); setIsMobileSidebarOpen(false); }}
            />
            <SidebarItem
              icon={<Briefcase size={20} className="text-amber-500" />}
              label="Postings"
              active={view === 'industry-postings' || view === 'industry-applications'}
              onClick={() => { setView('industry-postings'); setIsMobileSidebarOpen(false); }}
            />
            <SidebarItem
              icon={<Terminal size={20} className="text-emerald-500" />}
              label="Coding Assessments"
              active={view === 'industry-coding-assessments'}
              onClick={() => { setView('industry-coding-assessments'); setIsMobileSidebarOpen(false); }}
            />
            <SidebarItem
              icon={<Users size={20} className="text-sky-500" />}
              label="Candidate Pool"
              active={view === 'users'}
              onClick={() => { setView('users'); setIsMobileSidebarOpen(false); }}
            />
            <SidebarItem
              icon={<Target size={20} className="text-cyan-500" />}
              label="Placement Rating"
              active={view === 'placement-readiness'}
              onClick={() => { setView('placement-readiness'); setIsMobileSidebarOpen(false); }}
            />
            <SidebarItem
              icon={<TrendingUp size={20} className="text-rose-500" />}
              label="HR Reports"
              active={view === 'industry-reports'}
              onClick={() => { setView('industry-reports'); setIsMobileSidebarOpen(false); }}
            />
            <SidebarItem
              icon={<Building2 size={20} className="text-teal-500" />}
              label="Company Profile"
              active={view === 'industry-profile'}
              onClick={() => { setView('industry-profile'); setIsMobileSidebarOpen(false); }}
            />
            <SidebarItem
              icon={<Settings size={20} className="text-slate-500" />}
              label="Settings"
              active={view === 'settings'}
              onClick={() => { setView('settings'); setIsMobileSidebarOpen(false); }}
            />
          </>
        ) : (
          <>
            <SidebarItem
              icon={<LayoutDashboard size={20} className="text-blue-500" />}
              label="Dashboard"
              active={view === 'dashboard'}
              onClick={() => { setView('dashboard'); setIsMobileSidebarOpen(false); }}
            />

            <SidebarItem
              icon={<ClipboardList size={20} className="text-indigo-500" />}
              label="Tasks"
              active={view === 'tasks'}
              onClick={() => { setView('tasks'); setIsMobileSidebarOpen(false); }}
            />

            <SidebarItem
              icon={<Code size={20} className="text-amber-500" />}
              label="Coding Progress"
              active={view === 'leetcode-targets' || view === 'coding-progress'}
              onClick={() => { setView('leetcode-targets'); setIsMobileSidebarOpen(false); }}
            />

            <SidebarItem
              icon={<Megaphone size={20} className="text-rose-500" />}
              label="Notice Board"
              active={view === 'notice-board'}
              onClick={() => { setView('notice-board'); fetchNotices(); setIsMobileSidebarOpen(false); }}
            />

            <SidebarItem
              icon={<Sparkles size={20} className="text-purple-500" />}
              label="Skill Assessment"
              viewTarget="skill-assessment"
              active={view === 'skill-assessment'}
              onClick={() => { setView('skill-assessment'); setIsMobileSidebarOpen(false); }}
            />

            {FEATURE_FLAGS.placementRating && (
              <SidebarItem
                icon={<Target size={20} className="text-cyan-500" />}
                label="Placement Rating"
                viewTarget="placement-readiness"
                active={view === 'placement-readiness'}
                onClick={() => { setView('placement-readiness'); setIsMobileSidebarOpen(false); }}
              />
            )}

            {FEATURE_FLAGS.liveTeachingHub && (
              <SidebarItem
                icon={<Radio size={20} className="text-emerald-500 animate-pulse" />}
                label="Live Teaching Hub"
                viewTarget="live-teaching-hub"
                active={view === 'live-teaching-hub'}
                onClick={() => { setView('live-teaching-hub'); setIsMobileSidebarOpen(false); }}
              />
            )}

            {/* Academia-Industry Innovation Navigation */}
            {isStudent && (
              <>
                {FEATURE_FLAGS.opportunities && (
                  <SidebarItem
                    icon={<Briefcase size={20} className="text-teal-400" />}
                    label="Opportunities"
                    viewTarget="opportunities"
                    active={view === 'opportunities'}
                    onClick={() => { setView('opportunities'); setIsMobileSidebarOpen(false); }}
                  />
                )}
                {FEATURE_FLAGS.codingTests && (
                  <SidebarItem
                    icon={<Code size={20} className="text-indigo-500" />}
                    label="Coding Tests"
                    viewTarget="student-coding-assessments"
                    active={view === 'student-coding-assessments'}
                    onClick={() => { setView('student-coding-assessments'); setIsMobileSidebarOpen(false); }}
                  />
                )}
                {FEATURE_FLAGS.skillGapAi && (
                  <SidebarItem
                    icon={<Zap size={20} className="text-amber-400" />}
                    label="Skill Gap AI"
                    viewTarget="skill-gap-analyzer"
                    active={view === 'skill-gap-analyzer'}
                    onClick={() => { setView('skill-gap-analyzer'); setIsMobileSidebarOpen(false); }}
                  />
                )}
              </>
            )}

            {(isAdvisor || isHOD || isAdmin) && (
              <SidebarItem
                icon={<BarChart3 size={20} className="text-pink-400" />}
                label="Skill Heatmap"
                viewTarget="institutional-skill-heatmap"
                active={view === 'institutional-skill-heatmap'}
                onClick={() => { setView('institutional-skill-heatmap'); setIsMobileSidebarOpen(false); }}
              />
            )}

            {isAdmin && (
              <>
                <SidebarItem
                  icon={<Briefcase size={20} className="text-emerald-500" />}
                  label="Industry Partners"
                  badge={pendingIndustryList.length > 0 ? `${pendingIndustryList.length} Pending` : undefined}
                  active={view === 'industry-approvals'}
                  onClick={() => { setView('industry-approvals'); setIsMobileSidebarOpen(false); }}
                />
                <SidebarItem
                  icon={<Building2 size={20} className="text-violet-500" />}
                  label="Departments"
                  active={view === 'departments'}
                  onClick={() => { setView('departments'); setIsMobileSidebarOpen(false); }}
                />
                <SidebarItem
                  icon={<Users size={20} className="text-sky-500" />}
                  label="HOD Accounts"
                  active={view === 'users'}
                  onClick={() => { setView('users'); setIsMobileSidebarOpen(false); }}
                />
              </>
            )}

            {isHOD && (
              <>
                <SidebarItem
                  icon={<Briefcase size={20} className="text-emerald-500" />}
                  label="Industry Partners"
                  badge={pendingIndustryList.length > 0 ? `${pendingIndustryList.length} Pending` : undefined}
                  active={view === 'industry-approvals'}
                  onClick={() => { setView('industry-approvals'); setIsMobileSidebarOpen(false); }}
                />
                <SidebarItem
                  icon={<Building2 size={20} className="text-violet-500" />}
                  label="Classes"
                  active={view === 'classes'}
                  onClick={() => { setView('classes'); setIsMobileSidebarOpen(false); }}
                />
                <SidebarItem
                  icon={<Users size={20} className="text-sky-500" />}
                  label="Users"
                  active={view === 'users'}
                  onClick={() => { setView('users'); setIsMobileSidebarOpen(false); }}
                />
              </>
            )}

            {isAdvisor && (
              <>
                <SidebarItem
                  icon={<Building2 size={20} className="text-violet-500" />}
                  label="My Class"
                  active={view === 'my-class'}
                  onClick={() => { setView('my-class'); setIsMobileSidebarOpen(false); }}
                />
                <SidebarItem
                  icon={<Users size={20} className="text-sky-500" />}
                  label="Students"
                  active={view === 'users'}
                  onClick={() => { setView('users'); setIsMobileSidebarOpen(false); }}
                />
              </>
            )}

            {(isAdvisor || isHOD || isAdmin || isCoordinator || isFaculty) && (
              <SidebarItem
                icon={<ShieldCheck size={20} className="text-emerald-600" />}
                label="Verifications"
                badge={pendingVerificationCount > 0 ? `${pendingVerificationCount} Pending` : undefined}
                active={view === 'verifications'}
                onClick={() => { setView('verifications'); setIsMobileSidebarOpen(false); }}
              />
            )}

            {isStudent && (
              <>
                <SidebarItem
                  icon={<CheckCircle2 size={20} className="text-teal-500" />}
                  label="My Submissions"
                  active={view === 'submissions'}
                  onClick={() => { setView('submissions'); setIsMobileSidebarOpen(false); }}
                />
                <SidebarItem
                  icon={<UserIcon size={20} className="text-blue-600" />}
                  label="Profile"
                  active={view === 'profile'}
                  onClick={() => { setView('profile'); setIsMobileSidebarOpen(false); }}
                />
              </>
            )}

            <SidebarItem
              icon={<Settings size={20} className="text-slate-500" />}
              label="Settings"
              active={view === 'settings'}
              onClick={() => { setView('settings'); setIsMobileSidebarOpen(false); }}
            />
          </>
        )}
      </nav>

      <div className="p-3 border-t border-zinc-100 shrink-0 bg-white">
        <div className="px-3 py-2 mb-2 bg-zinc-50 rounded-xl">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Logged in as</p>
          <p className="text-xs font-bold text-zinc-900 truncate">{user?.full_name}</p>
        </div>
        <button
          onClick={() => { handleLogout(); setIsMobileSidebarOpen(false); }}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-zinc-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-semibold text-xs group"
        >
          <LogOut size={16} className="text-rose-500 group-hover:text-rose-600 transition-colors" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          "bg-white dark:bg-[#121217] border-r border-zinc-200 dark:border-zinc-800 shrink-0 transition-all duration-300 ease-in-out hidden lg:block overflow-hidden relative z-30",
          isDesktopSidebarOpen ? "w-72 xl:w-80" : "w-0 border-r-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="w-72 xl:w-80 h-full flex flex-col shrink-0">
          {renderSidebarContent()}
        </div>
      </aside>

      {/* Sidebar - Mobile Drawer */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-[85vw] max-w-xs bg-white dark:bg-[#121217] h-full flex flex-col z-10 shadow-2xl overflow-hidden"
            >
              {renderSidebarContent()}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
