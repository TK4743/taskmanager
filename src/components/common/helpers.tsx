import React, { lazy } from 'react';
import {
  Trophy, BookOpen, Briefcase, Building2, ClipboardList,
  Clock, CheckCircle2, XCircle, AlertTriangle
} from 'lucide-react';

// Robust lazy loading with automatic reload on deployment chunk hash mismatches
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const reloadKey = 'app-chunk-reload-timestamp';
    try {
      const component = await factory();
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(reloadKey);
      }
      return component;
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        const lastReload = parseInt(window.sessionStorage.getItem(reloadKey) || '0', 10);
        const now = Date.now();
        // If chunk failed to load (e.g. 404 on new deployment), reload page once to fetch latest bundles
        if (now - lastReload > 12000) {
          window.sessionStorage.setItem(reloadKey, String(now));
          window.location.reload();
        }
      }
      throw error;
    }
  });
}

// Intelligent View Prefetcher - downloads chunks during browser idle time or on hover so tab clicks are instant (0ms)
export const prefetchView = (viewName: string) => {
  try {
    switch (viewName) {
      case 'live-teaching-hub':
        import('../../LiveTeachingHubView');
        break;
      case 'skill-assessment':
        import('../../SkillAssessmentView');
        break;
      case 'placement-readiness':
        import('../../PlacementReadinessView');
        break;
      case 'opportunities':
        import('../../StudentOpportunitiesView');
        break;
      case 'skill-gap-analyzer':
        import('../../SkillGapAnalyzerView');
        break;
      case 'student-coding-assessments':
        import('../../StudentCodingAssessmentView');
        break;
      case 'institutional-skill-heatmap':
        import('../../InstitutionalSkillHeatmapView');
        break;
      case 'industry-portal':
      case 'industry-dashboard':
      case 'industry-postings':
      case 'industry-coding-assessments':
      case 'industry-applications':
      case 'industry-reports':
      case 'industry-profile':
        import('../../IndustryPortalView');
        break;
      default:
        break;
    }
  } catch {}
};

// Helper to render Lucide vector icons for task categories
export const renderCategoryIcon = (category: string, size = 14) => {
  switch (category) {
    case 'Competition':
      return <Trophy size={size} />;
    case 'Course':
      return <BookOpen size={size} />;
    case 'Workshop':
      return <Briefcase size={size} />;
    case 'College Work':
      return <Building2 size={size} />;
    default:
      return <ClipboardList size={size} />;
  }
};

// Global Helper for Auto-Optimized WebP/AVIF Cloudinary Images (reduces image bandwidth by up to 90%)
export const getOptimizedImgUrl = (url?: string | null, width = 600) => {
  if (!url) return '';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
  }
  return url;
};

export const getCloudinaryThumbnail = (url: string | undefined | null, width = 400) => {
  if (!url) return '';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/w_${width},c_scale,q_auto,f_auto/`);
  }
  return url;
};

export const getStudentTaskStatusBadge = (task: any, user: any, submissions: any[]) => {
  const isDeadlinePassed = Boolean(task?.deadline && new Date(task.deadline).getTime() < Date.now());
  const isClosed = task?.status === 'CLOSED' || isDeadlinePassed;

  if (user?.role !== 'STUDENT') {
    if (task?.status === 'CLOSED') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-600 border border-zinc-200 inline-flex items-center gap-1">
          <Clock size={12} /> CLOSED
        </span>
      );
    }
    if (isDeadlinePassed) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 inline-flex items-center gap-1">
          <Clock size={12} /> DEADLINE PASSED
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 inline-flex items-center gap-1">
        OPEN
      </span>
    );
  }

  const sub = submissions.find(s => String(s.task_id) === String(task?.id) && String(s.user_id) === String(user?.id));
  if (sub) {
    if (sub.status === 'VERIFIED') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 inline-flex items-center gap-1">
          <CheckCircle2 size={12} /> VERIFIED
        </span>
      );
    }
    if (sub.status === 'SUBMITTED') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 inline-flex items-center gap-1">
          <Clock size={12} /> PENDING VERIFICATION
        </span>
      );
    }
    if (sub.status === 'REJECTED') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200 inline-flex items-center gap-1">
          <XCircle size={12} /> REJECTED
        </span>
      );
    }
    if (sub.status === 'NOT_PARTICIPATING') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200 inline-flex items-center gap-1">
          <AlertTriangle size={12} /> NOT INTERESTED
        </span>
      );
    }
  }

  if (isClosed) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 inline-flex items-center gap-1">
        <Clock size={12} /> INCOMPLETE (CLOSED)
      </span>
    );
  }

  return (
    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200 inline-flex items-center gap-1">
      <Clock size={12} /> PENDING SUBMISSION
    </span>
  );
};

export const getStudentRegisterNumber = (userObj: any, profileObj?: any): string => {
  const possible = [
    userObj?.register_number,
    profileObj?.academic?.register_number,
    userObj?.username
  ];
  for (const val of possible) {
    if (val && typeof val === 'string' && val.trim() && val.trim().toUpperCase() !== 'N/A' && !val.includes('@')) {
      return val.trim();
    }
  }
  return (userObj?.register_number || profileObj?.academic?.register_number || userObj?.username || '').trim();
};
