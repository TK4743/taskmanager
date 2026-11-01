import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  CheckSquare,
  Code2,
  TrendingUp,
  MoreHorizontal,
  Users,
  ShieldCheck,
  Building2,
  BarChart3,
  ShieldAlert,
  Briefcase,
  FileText,
  Bell,
  Sparkles,
  Zap,
  Radio,
  Target,
  UserCheck,
  Building,
  Settings,
  LogOut,
  ChevronRight,
  User,
  GraduationCap
} from 'lucide-react';
import { cn } from './lib/utils';
import { FloatingModal } from './FloatingModal';

export interface MobileBottomNavProps {
  currentView: string;
  onSelectView: (view: string) => void;
  user: {
    role: string;
    is_coordinator?: boolean;
    full_name?: string;
    email?: string;
  } | null;
  pendingVerificationCount?: number;
  onLogout: () => void;
}

interface NavItem {
  id: string;
  label: string;
  view?: string;
  icon: React.ReactNode;
  badge?: number;
  isMore?: boolean;
}

interface SecondaryModule {
  id: string;
  label: string;
  description: string;
  view: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onSelectView,
  user,
  pendingVerificationCount = 0,
  onLogout
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const role = user?.role || 'STUDENT';
  const isCoordinator = Boolean(role === 'STUDENT' && user?.is_coordinator);
  const isStudent = role === 'STUDENT' && !user?.is_coordinator;
  const isAdvisor = role === 'CLASS_ADVISOR';
  const isFaculty = role === 'FACULTY' || role === 'STAFF';
  const isHOD = role === 'HOD';
  const isAdmin = role === 'SUPREME_ADMIN';
  const isIndustry = role === 'INDUSTRY';

  // 1. Build primary 5 navigation items based on role
  const getPrimaryNavItems = (): NavItem[] => {
    if (isStudent) {
      return [
        { id: 'home', label: 'Home', view: 'dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'tasks', label: 'Tasks', view: 'tasks', icon: <CheckSquare size={20} /> },
        { id: 'coding', label: 'Coding', view: 'leetcode-targets', icon: <Code2 size={20} /> },
        { id: 'progress', label: 'Progress', view: 'skill-gap-analyzer', icon: <TrendingUp size={20} /> },
        { id: 'more', label: 'More', isMore: true, icon: <MoreHorizontal size={20} /> }
      ];
    }

    if (isCoordinator) {
      return [
        { id: 'home', label: 'Home', view: 'dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'tasks', label: 'Tasks', view: 'tasks', icon: <CheckSquare size={20} /> },
        { id: 'students', label: 'Students', view: 'users', icon: <Users size={20} /> },
        {
          id: 'verification',
          label: 'Verification',
          view: 'verifications',
          icon: <ShieldCheck size={20} />,
          badge: pendingVerificationCount
        },
        { id: 'more', label: 'More', isMore: true, icon: <MoreHorizontal size={20} /> }
      ];
    }

    if (isAdvisor) {
      return [
        { id: 'home', label: 'Home', view: 'dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'my-class', label: 'My Class', view: 'my-class', icon: <Building2 size={20} /> },
        {
          id: 'verification',
          label: 'Verification',
          view: 'verifications',
          icon: <ShieldCheck size={20} />,
          badge: pendingVerificationCount
        },
        { id: 'progress', label: 'Progress', view: 'skill-gap-analyzer', icon: <TrendingUp size={20} /> },
        { id: 'more', label: 'More', isMore: true, icon: <MoreHorizontal size={20} /> }
      ];
    }

    if (isFaculty) {
      return [
        { id: 'home', label: 'Home', view: 'dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'tasks', label: 'Tasks', view: 'tasks', icon: <CheckSquare size={20} /> },
        { id: 'students', label: 'Students', view: 'users', icon: <Users size={20} /> },
        {
          id: 'verification',
          label: 'Verification',
          view: 'verifications',
          icon: <ShieldCheck size={20} />,
          badge: pendingVerificationCount
        },
        { id: 'more', label: 'More', isMore: true, icon: <MoreHorizontal size={20} /> }
      ];
    }

    if (isHOD) {
      return [
        { id: 'overview', label: 'Overview', view: 'dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'students', label: 'Students', view: 'users', icon: <Users size={20} /> },
        {
          id: 'verification',
          label: 'Verification',
          view: 'verifications',
          icon: <ShieldCheck size={20} />,
          badge: pendingVerificationCount
        },
        { id: 'analytics', label: 'Analytics', view: 'institutional-skill-heatmap', icon: <BarChart3 size={20} /> },
        { id: 'more', label: 'More', isMore: true, icon: <MoreHorizontal size={20} /> }
      ];
    }

    if (isAdmin) {
      return [
        { id: 'overview', label: 'Overview', view: 'dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'departments', label: 'Departments', view: 'departments', icon: <Building2 size={20} /> },
        { id: 'users', label: 'Users', view: 'users', icon: <Users size={20} /> },
        { id: 'roles', label: 'Roles', view: 'users', icon: <ShieldAlert size={20} /> },
        { id: 'more', label: 'More', isMore: true, icon: <MoreHorizontal size={20} /> }
      ];
    }

    if (isIndustry) {
      return [
        { id: 'home', label: 'Home', view: 'industry-dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'postings', label: 'Postings', view: 'industry-postings', icon: <Briefcase size={20} /> },
        { id: 'candidates', label: 'Candidates', view: 'users', icon: <Users size={20} /> },
        { id: 'applications', label: 'Applications', view: 'industry-applications', icon: <FileText size={20} /> },
        { id: 'more', label: 'More', isMore: true, icon: <MoreHorizontal size={20} /> }
      ];
    }

    // Default fallback
    return [
      { id: 'home', label: 'Home', view: 'dashboard', icon: <LayoutDashboard size={20} /> },
      { id: 'tasks', label: 'Tasks', view: 'tasks', icon: <CheckSquare size={20} /> },
      { id: 'coding', label: 'Coding', view: 'leetcode-targets', icon: <Code2 size={20} /> },
      { id: 'progress', label: 'Progress', view: 'skill-gap-analyzer', icon: <TrendingUp size={20} /> },
      { id: 'more', label: 'More', isMore: true, icon: <MoreHorizontal size={20} /> }
    ];
  };

  // 2. Build secondary modules list for the "More" bottom sheet
  const getSecondaryModules = (): SecondaryModule[] => {
    const commonModules: SecondaryModule[] = [];

    if (isStudent) {
      return [
        { id: 'notices', label: 'Notice Board', description: 'Institutional announcements and urgent notices', view: 'notice-board', icon: <Bell className="text-amber-500" size={20} /> },
        { id: 'submissions', label: 'My Submissions', description: 'Review your uploaded tasks & verification statuses', view: 'submissions', icon: <CheckSquare className="text-teal-500" size={20} /> },
        { id: 'coding-tests', label: 'Coding Assessments', description: 'Live coding challenges and Monaco sandbox tests', view: 'student-coding-assessments', icon: <Code2 className="text-indigo-500" size={20} /> },
        { id: 'skill-assessment', label: 'Skill Assessments', description: 'Take academic quizzes and domain skill benchmarks', view: 'skill-assessment', icon: <Sparkles className="text-violet-500" size={20} /> },
        { id: 'teaching-hub', label: 'Live Teaching Hub', description: 'Virtual interactive classrooms and lecture materials', view: 'live-teaching-hub', icon: <Radio className="text-rose-500" size={20} /> },
        { id: 'opportunities', label: 'Student Opportunities', description: 'External hackathons, hiring events, internships', view: 'opportunities', icon: <Briefcase className="text-emerald-500" size={20} /> },
        { id: 'placement', label: 'Placement Rating', description: 'Your hiring readiness score and recruiter metrics', view: 'placement-readiness', icon: <Target className="text-cyan-500" size={20} /> },
        { id: 'profile', label: 'My Profile', description: 'Manage bio, skills, resume, GitHub and LeetCode URLs', view: 'profile', icon: <User className="text-blue-500" size={20} /> },
        { id: 'settings', label: 'Settings', description: 'Notification channels, credentials and preferences', view: 'settings', icon: <Settings className="text-slate-500" size={20} /> }
      ];
    }

    if (isCoordinator) {
      return [
        { id: 'notices', label: 'Notice Board', description: 'Department announcements and alerts', view: 'notice-board', icon: <Bell className="text-amber-500" size={20} /> },
        { id: 'coding-progress', label: 'Coding Progress', description: 'Track classmate LeetCode and GitHub activity', view: 'leetcode-targets', icon: <Code2 className="text-indigo-500" size={20} /> },
        { id: 'skill-gap', label: 'Progress Analyzer', description: 'Class-wide task completion metrics', view: 'skill-gap-analyzer', icon: <Zap className="text-amber-500" size={20} /> },
        { id: 'teaching-hub', label: 'Live Teaching Hub', description: 'Interactive classroom sessions', view: 'live-teaching-hub', icon: <Radio className="text-rose-500" size={20} /> },
        { id: 'heatmap', label: 'Skill Heatmap', description: 'Institutional readiness overview', view: 'institutional-skill-heatmap', icon: <BarChart3 className="text-pink-500" size={20} /> },
        { id: 'submissions', label: 'My Submissions', description: 'Personal task submissions ledger', view: 'submissions', icon: <CheckSquare className="text-teal-500" size={20} /> },
        { id: 'profile', label: 'My Profile', description: 'Your personal academic credentials', view: 'profile', icon: <User className="text-blue-500" size={20} /> },
        { id: 'settings', label: 'Settings', description: 'Account and notification configuration', view: 'settings', icon: <Settings className="text-slate-500" size={20} /> }
      ];
    }

    if (isAdvisor) {
      return [
        { id: 'tasks', label: 'Tasks', description: 'Post and supervise academic tasks', view: 'tasks', icon: <CheckSquare className="text-emerald-500" size={20} /> },
        { id: 'students', label: 'Students', description: 'Class roster and coordinator delegation', view: 'users', icon: <Users className="text-sky-500" size={20} /> },
        { id: 'notices', label: 'Notice Board', description: 'Publish priority class announcements', view: 'notice-board', icon: <Bell className="text-amber-500" size={20} /> },
        { id: 'coding-progress', label: 'Coding Progress', description: 'LeetCode & GitHub progress benchmarks', view: 'leetcode-targets', icon: <Code2 className="text-indigo-500" size={20} /> },
        { id: 'heatmap', label: 'Skill Heatmap', description: 'Class-level skill proficiency matrix', view: 'institutional-skill-heatmap', icon: <BarChart3 className="text-pink-500" size={20} /> },
        { id: 'teaching-hub', label: 'Live Teaching Hub', description: 'Conduct live classroom lectures', view: 'live-teaching-hub', icon: <Radio className="text-rose-500" size={20} /> },
        { id: 'placement', label: 'Placement Rating', description: 'Class candidate hiring readiness', view: 'placement-readiness', icon: <Target className="text-cyan-500" size={20} /> },
        { id: 'settings', label: 'Settings', description: 'Advisor profile and notification preferences', view: 'settings', icon: <Settings className="text-slate-500" size={20} /> }
      ];
    }

    if (isFaculty) {
      return [
        { id: 'notices', label: 'Notice Board', description: 'Department announcements and bulletins', view: 'notice-board', icon: <Bell className="text-amber-500" size={20} /> },
        { id: 'teaching-hub', label: 'Live Teaching Hub', description: 'Deliver live lecture streams and interactive rooms', view: 'live-teaching-hub', icon: <Radio className="text-rose-500" size={20} /> },
        { id: 'skill-assessment', label: 'Skill Assessments', description: 'Build and supervise student quizzes', view: 'skill-assessment', icon: <Sparkles className="text-violet-500" size={20} /> },
        { id: 'heatmap', label: 'Skill Heatmap', description: 'Departmental skill readiness analysis', view: 'institutional-skill-heatmap', icon: <BarChart3 className="text-pink-500" size={20} /> },
        { id: 'coding-progress', label: 'Coding Benchmarks', description: 'Student LeetCode problem trackers', view: 'leetcode-targets', icon: <Code2 className="text-indigo-500" size={20} /> },
        { id: 'settings', label: 'Settings', description: 'Faculty account preferences', view: 'settings', icon: <Settings className="text-slate-500" size={20} /> }
      ];
    }

    if (isHOD) {
      return [
        { id: 'tasks', label: 'Tasks', description: 'Create and broadcast department tasks', view: 'tasks', icon: <CheckSquare className="text-emerald-500" size={20} /> },
        { id: 'classes', label: 'Classes & Sections', description: 'Configure department classes and sections', view: 'classes', icon: <Building2 className="text-violet-500" size={20} /> },
        { id: 'industry-approvals', label: 'Industry Partners', description: 'Review corporate HR partnership applications', view: 'industry-approvals', icon: <Briefcase className="text-amber-500" size={20} /> },
        { id: 'notices', label: 'Notice Board', description: 'Broadcast high-priority notices', view: 'notice-board', icon: <Bell className="text-amber-500" size={20} /> },
        { id: 'coding-progress', label: 'Coding Benchmarks', description: 'Department-wide LeetCode & GitHub stats', view: 'leetcode-targets', icon: <Code2 className="text-indigo-500" size={20} /> },
        { id: 'teaching-hub', label: 'Live Teaching Hub', description: 'Faculty lecture schedules and active hubs', view: 'live-teaching-hub', icon: <Radio className="text-rose-500" size={20} /> },
        { id: 'placement', label: 'Placement Funnel', description: 'Department placement readiness analytics', view: 'placement-readiness', icon: <Target className="text-cyan-500" size={20} /> },
        { id: 'settings', label: 'Settings', description: 'HOD portal preferences', view: 'settings', icon: <Settings className="text-slate-500" size={20} /> }
      ];
    }

    if (isAdmin) {
      return [
        { id: 'tasks', label: 'Tasks', description: 'Global task supervision', view: 'tasks', icon: <CheckSquare className="text-emerald-500" size={20} /> },
        { id: 'verifications', label: 'Verifications', description: 'Audit all pending task proof queues', view: 'verifications', icon: <ShieldCheck className="text-teal-500" size={20} />, badge: pendingVerificationCount },
        { id: 'classes', label: 'Classes & Sections', description: 'Institution-wide class management', view: 'classes', icon: <Building2 className="text-violet-500" size={20} /> },
        { id: 'industry-approvals', label: 'Industry Partners', description: 'Approve corporate HR accounts', view: 'industry-approvals', icon: <Briefcase className="text-amber-500" size={20} /> },
        { id: 'heatmap', label: 'Skill Heatmap', description: 'Cross-departmental skill matrix', view: 'institutional-skill-heatmap', icon: <BarChart3 className="text-pink-500" size={20} /> },
        { id: 'teaching-hub', label: 'Live Teaching Hub', description: 'Institution lecture channels', view: 'live-teaching-hub', icon: <Radio className="text-rose-500" size={20} /> },
        { id: 'notices', label: 'Notice Board', description: 'System-wide notice dispatcher', view: 'notice-board', icon: <Bell className="text-amber-500" size={20} /> },
        { id: 'settings', label: 'Settings', description: 'System configuration and database backups', view: 'settings', icon: <Settings className="text-slate-500" size={20} /> }
      ];
    }

    if (isIndustry) {
      return [
        { id: 'coding-tests', label: 'Coding Assessments', description: 'Create and publish custom coding assessments', view: 'industry-coding-assessments', icon: <Code2 className="text-emerald-500" size={20} /> },
        { id: 'placement', label: 'Placement Rating', description: 'Benchmark candidate talent ratings', view: 'placement-readiness', icon: <Target className="text-cyan-500" size={20} /> },
        { id: 'reports', label: 'HR Reports', description: 'Export talent pipelines and assessment logs', view: 'industry-reports', icon: <TrendingUp className="text-rose-500" size={20} /> },
        { id: 'company-profile', label: 'Company Profile', description: 'Manage corporate hiring profile & branding', view: 'industry-profile', icon: <Building className="text-teal-500" size={20} /> },
        { id: 'settings', label: 'Settings', description: 'Recruiter account credentials', view: 'settings', icon: <Settings className="text-slate-500" size={20} /> }
      ];
    }

    return commonModules;
  };

  const primaryItems = getPrimaryNavItems();
  const secondaryModules = getSecondaryModules();

  const getRoleDisplayName = () => {
    if (isAdmin) return 'Supreme Admin';
    if (isHOD) return 'Head of Department';
    if (isAdvisor) return 'Class Advisor';
    if (isFaculty) return 'Faculty / Staff';
    if (isCoordinator) return 'Student Coordinator';
    if (isIndustry) return 'Corporate HR';
    return 'Student';
  };

  return (
    <>
      {/* Fixed Floating Bottom Navigation Dock (Visible on Mobile / Tablet < 1024px) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 dark:bg-[#121217]/95 backdrop-blur-lg border-t border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="grid grid-cols-5 items-center max-w-lg mx-auto">
          {primaryItems.map((item) => {
            const isActive = !item.isMore && currentView === item.view;
            const hasBadge = Boolean(item.badge && item.badge > 0);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.isMore) {
                    setIsMoreOpen(true);
                  } else if (item.view) {
                    onSelectView(item.view);
                  }
                }}
                className={cn(
                  "relative flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all duration-200 select-none active:scale-95 group",
                  isActive
                    ? "text-zinc-950 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}
                aria-label={item.label}
              >
                {/* Active Indicator Background Pill */}
                {isActive && (
                  <motion.div
                    layoutId="mobileNavActivePill"
                    className="absolute inset-x-1.5 inset-y-0.5 bg-zinc-100 dark:bg-zinc-800/90 rounded-xl -z-10"
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  />
                )}

                {/* Icon Container with Badge */}
                <div className="relative flex items-center justify-center w-7 h-7">
                  {item.icon}

                  {/* Pending Badge */}
                  {hasBadge && (
                    <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 bg-rose-500 text-[10px] font-black text-white rounded-full flex items-center justify-center border-2 border-white dark:border-[#121217] shadow-xs animate-in zoom-in-50">
                      {item.badge! > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-[10px] tracking-tight mt-0.5 truncate max-w-full leading-tight",
                    isActive ? "font-black" : "font-semibold"
                  )}
                >
                  {item.label}
                </span>

                {/* Active Underline Dot */}
                {isActive && (
                  <span className="w-1 h-1 bg-zinc-900 dark:bg-zinc-100 rounded-full mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* "More" Action Sheet: iOS-inspired Bottom Sheet Modal */}
      <FloatingModal
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        title="Application Modules"
        description={`${getRoleDisplayName()} • All accessible modules`}
        icon={<GraduationCap size={22} className="text-indigo-600 dark:text-indigo-400" />}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* User Role Card */}
          <div className="p-3.5 bg-zinc-50 dark:bg-[#181820] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Logged In As</span>
              <p className="text-sm font-extrabold text-zinc-900 dark:text-white truncate">{user?.full_name || 'User'}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user?.email}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 shrink-0">
              {getRoleDisplayName()}
            </span>
          </div>

          {/* Secondary Modules Grid */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">Modules</p>
            <div className="grid grid-cols-1 gap-2">
              {secondaryModules.map((module) => {
                const isActive = currentView === module.view;
                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => {
                      onSelectView(module.view);
                      setIsMoreOpen(false);
                    }}
                    className={cn(
                      "w-full p-3 rounded-2xl border transition-all text-left flex items-center justify-between gap-3 group cursor-pointer",
                      isActive
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm"
                        : "bg-white dark:bg-[#141419] hover:bg-zinc-50 dark:hover:bg-[#1a1a22] text-zinc-800 dark:text-zinc-200 border-zinc-200/80 dark:border-zinc-800"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                          isActive
                            ? "bg-white/10 dark:bg-black/10 border-white/20 dark:border-black/20 text-white dark:text-zinc-900"
                            : "bg-zinc-50 dark:bg-[#1b1b24] border-zinc-200/60 dark:border-zinc-800"
                        )}
                      >
                        {module.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold truncate leading-tight">{module.label}</span>
                          {module.badge !== undefined && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                              {module.badge}
                            </span>
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-xs mt-0.5 truncate font-medium",
                            isActive ? "text-white/80 dark:text-zinc-700" : "text-zinc-500 dark:text-zinc-400"
                          )}
                        >
                          {module.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      className={cn(
                        "shrink-0 transition-transform group-hover:translate-x-0.5",
                        isActive ? "text-white dark:text-zinc-900" : "text-zinc-400"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logout Section */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setIsMoreOpen(false);
                onLogout();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-black transition-colors flex items-center justify-center gap-2 border border-rose-200/60 dark:border-rose-900/40 cursor-pointer"
            >
              <LogOut size={16} />
              <span>Log Out of Session</span>
            </button>
          </div>
        </div>
      </FloatingModal>
    </>
  );
};

export default MobileBottomNav;

