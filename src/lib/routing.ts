import type { AppRouteState } from '../types';

export { type AppRouteState };

export const parseRouteFromPath = (pathname: string): AppRouteState => {
  const cleanPath = (pathname || '/')
    .split('?')[0]
    .split('#')[0]
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '');

  // Public Student Portfolio route (/p/:regno)
  if (cleanPath.startsWith('p/')) {
    const rawReg = cleanPath.slice(2).trim();
    if (rawReg) return { view: 'public-portfolio', portfolioRegNo: rawReg, footerModal: null };
  }

  // Public Student Portfolio query (?portfolio=:regno)
  if (typeof window !== 'undefined') {
    const sp = new URLSearchParams(window.location.search);
    const pVal = sp.get('portfolio');
    if (pVal && pVal.trim()) {
      return { view: 'public-portfolio', portfolioRegNo: pVal.trim(), footerModal: null };
    }
  }

  // Footer Modals
  if (cleanPath === 'sources') return { view: 'dashboard', footerModal: 'SOURCES' };
  if (cleanPath === 'privacy') return { view: 'dashboard', footerModal: 'PRIVACY' };
  if (cleanPath === 'terms') return { view: 'dashboard', footerModal: 'TERMS' };
  if (cleanPath === 'support') return { view: 'dashboard', footerModal: 'SUPPORT' };

  // Coding progress sub-routes
  if (cleanPath === 'codingprogress/github' || cleanPath === 'coding-progress/github' || cleanPath === 'leetcode-targets/github') {
    return { view: 'leetcode-targets', codingPlatformTab: 'GITHUB', footerModal: null };
  }
  if (cleanPath === 'codingprogress/leetcode' || cleanPath === 'coding-progress/leetcode' || cleanPath === 'leetcode-targets/leetcode') {
    return { view: 'leetcode-targets', codingPlatformTab: 'LEETCODE', footerModal: null };
  }
  if (cleanPath === 'codingprogress' || cleanPath === 'coding-progress' || cleanPath === 'leetcode-targets') {
    return { view: 'leetcode-targets', codingPlatformTab: 'LEETCODE', footerModal: null };
  }

  // Tasks sub-routes (Support /tasks/rejected, /tasks/not-interested, /tasks/all, etc.)
  if (cleanPath === 'tasks/rejected') {
    return { view: 'tasks', studentTaskFilter: 'REJECTED', verificationFilter: 'REJECTED', footerModal: null };
  }
  if (cleanPath === 'tasks/not-interested' || cleanPath === 'tasks/notinterested' || cleanPath === 'tasks/opted-out') {
    return { view: 'tasks', studentTaskFilter: 'NOT_INTERESTED', verificationFilter: 'NOT INTERESTED', footerModal: null };
  }
  if (cleanPath === 'tasks/verified') {
    return { view: 'tasks', studentTaskFilter: 'VERIFIED', verificationFilter: 'VERIFIED', footerModal: null };
  }
  if (cleanPath === 'tasks/under-review') {
    return { view: 'tasks', studentTaskFilter: 'UNDER_REVIEW', footerModal: null };
  }
  if (cleanPath === 'tasks/pending' || cleanPath === 'tasks/pending-action') {
    return { view: 'tasks', studentTaskFilter: 'PENDING_ACTION', verificationFilter: 'PENDING', footerModal: null };
  }
  if (cleanPath === 'tasks/overdue') {
    return { view: 'tasks', studentTaskFilter: 'OVERDUE', footerModal: null };
  }
  if (cleanPath === 'tasks/all') {
    return { view: 'tasks', studentTaskFilter: 'ALL', verificationFilter: 'ALL', footerModal: null };
  }
  if (cleanPath === 'tasks' || cleanPath.startsWith('tasks/')) {
    return { view: 'tasks', studentTaskFilter: 'ALL', footerModal: null };
  }

  // Verifications sub-routes
  if (cleanPath === 'verifications/rejected' || cleanPath === 'verification/rejected') {
    return { view: 'verifications', verificationFilter: 'REJECTED', footerModal: null };
  }
  if (cleanPath === 'verifications/not-interested' || cleanPath === 'verifications/notinterested' || cleanPath === 'verification/not-interested') {
    return { view: 'verifications', verificationFilter: 'NOT INTERESTED', footerModal: null };
  }
  if (cleanPath === 'verifications/verified' || cleanPath === 'verification/verified') {
    return { view: 'verifications', verificationFilter: 'VERIFIED', footerModal: null };
  }
  if (cleanPath === 'verifications/pending' || cleanPath === 'verification/pending') {
    return { view: 'verifications', verificationFilter: 'PENDING', footerModal: null };
  }
  if (cleanPath === 'verifications/all' || cleanPath === 'verification/all') {
    return { view: 'verifications', verificationFilter: 'ALL', footerModal: null };
  }
  if (cleanPath === 'verifications' || cleanPath === 'verification' || cleanPath.startsWith('verifications/')) {
    return { view: 'verifications', footerModal: null };
  }

  // Submissions
  if (cleanPath === 'submissions' || cleanPath === 'my-submissions' || cleanPath.startsWith('submissions/')) {
    return { view: 'submissions', footerModal: null };
  }

  // Assessment & Placement
  if (cleanPath === 'assessment' || cleanPath === 'assessments' || cleanPath === 'skill-assessment') return { view: 'skill-assessment', footerModal: null };
  if (cleanPath === 'placement' || cleanPath === 'placement-readiness' || cleanPath === 'placement-rating' || cleanPath === 'boost' || cleanPath === 'boost-readiness' || cleanPath === 'readiness' || cleanPath.startsWith('boost/')) return { view: 'placement-readiness', footerModal: null };
  if (cleanPath === 'teaching-hub' || cleanPath === 'live-teaching-hub') return { view: 'live-teaching-hub', footerModal: null };
  if (cleanPath === 'opportunities') return { view: 'opportunities', footerModal: null };
  if (cleanPath === 'coding-tests' || cleanPath === 'student-coding-assessments') return { view: 'student-coding-assessments', footerModal: null };
  if (cleanPath === 'skill-gap' || cleanPath === 'skill-gap-analyzer' || cleanPath === 'analyzer' || cleanPath === 'progress-analyzer') return { view: 'skill-gap-analyzer', footerModal: null };
  if (cleanPath === 'heatmap' || cleanPath === 'skill-heatmap' || cleanPath === 'institutional-skill-heatmap') return { view: 'institutional-skill-heatmap', footerModal: null };

  // Notice board
  if (cleanPath === 'notices' || cleanPath === 'notice-board') return { view: 'notice-board', footerModal: null };

  // Student Profile
  if (cleanPath.startsWith('profile') || cleanPath === 'my-profile') return { view: 'profile', footerModal: null };

  // Staff & Administration
  if (cleanPath === 'my-class') return { view: 'my-class', footerModal: null };
  if (cleanPath === 'classes') return { view: 'classes', footerModal: null };
  if (cleanPath === 'departments') return { view: 'departments', footerModal: null };
  if (cleanPath === 'users' || cleanPath === 'students') return { view: 'users', footerModal: null };
  if (cleanPath === 'industry-approvals' || cleanPath === 'industry-partners') return { view: 'industry-approvals', footerModal: null };
  if (cleanPath === 'settings') return { view: 'settings', footerModal: null };
  if (cleanPath === 'comparison' || cleanPath === 'feature-comparison') return { view: 'feature-comparison', footerModal: null };

  // Corporate / Industry Portal
  if (cleanPath === 'industry/dashboard' || cleanPath === 'industry-dashboard' || cleanPath === 'industry-portal') return { view: 'industry-dashboard', footerModal: null };
  if (cleanPath === 'industry/postings' || cleanPath === 'industry-postings') return { view: 'industry-postings', footerModal: null };
  if (cleanPath === 'industry/coding-assessments' || cleanPath === 'industry-coding-assessments') return { view: 'industry-coding-assessments', footerModal: null };
  if (cleanPath === 'industry/applications' || cleanPath === 'industry-applications') return { view: 'industry-applications', footerModal: null };
  if (cleanPath === 'industry/reports' || cleanPath === 'industry-reports') return { view: 'industry-reports', footerModal: null };
  if (cleanPath === 'industry/profile' || cleanPath === 'industry-profile') return { view: 'industry-profile', footerModal: null };

  // Dashboard / default
  return { view: 'dashboard', footerModal: null };
};

export const getPathFromState = (
  view: string,
  codingPlatformTab: 'LEETCODE' | 'GITHUB',
  footerModal: 'PRIVACY' | 'TERMS' | 'SUPPORT' | 'SOURCES' | null,
  studentTaskFilter?: 'ALL' | 'PENDING_ACTION' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'NOT_INTERESTED' | 'OVERDUE',
  verificationFilter?: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NOT INTERESTED' | 'ALL'
): string => {
  if (footerModal === 'SOURCES') return '/sources';
  if (footerModal === 'PRIVACY') return '/privacy';
  if (footerModal === 'TERMS') return '/terms';
  if (footerModal === 'SUPPORT') return '/support';

  switch (view) {
    case 'leetcode-targets':
    case 'coding-progress':
    case 'coding_progress':
    case 'leetcode_targets':
      return codingPlatformTab === 'GITHUB' ? '/codingprogress/github' : '/codingprogress/leetcode';
    case 'tasks': {
      if (studentTaskFilter === 'REJECTED') return '/tasks/rejected';
      if (studentTaskFilter === 'NOT_INTERESTED') return '/tasks/not-interested';
      if (studentTaskFilter === 'VERIFIED') return '/tasks/verified';
      if (studentTaskFilter === 'UNDER_REVIEW') return '/tasks/under-review';
      if (studentTaskFilter === 'PENDING_ACTION') return '/tasks/pending';
      if (studentTaskFilter === 'OVERDUE') return '/tasks/overdue';
      return '/tasks';
    }
    case 'submissions':
      return '/submissions';
    case 'verifications':
    case 'verification': {
      if (verificationFilter === 'REJECTED') return '/verifications/rejected';
      if (verificationFilter === 'NOT INTERESTED') return '/verifications/not-interested';
      if (verificationFilter === 'VERIFIED') return '/verifications/verified';
      if (verificationFilter === 'PENDING') return '/verifications/pending';
      if (verificationFilter === 'ALL') return '/verifications/all';
      return '/verifications';
    }
    case 'notice-board':
      return '/notices';
    case 'skill-assessment':
      return '/assessment';
    case 'placement-readiness':
    case 'placement':
    case 'boost':
    case 'boost-readiness':
      return '/boost';
    case 'live-teaching-hub':
      return '/teaching-hub';
    case 'opportunities':
      return '/opportunities';
    case 'student-coding-assessments':
      return '/coding-tests';
    case 'skill-gap-analyzer':
      return '/skill-gap';
    case 'institutional-skill-heatmap':
      return '/heatmap';
    case 'my-class':
      return '/my-class';
    case 'classes':
      return '/classes';
    case 'departments':
      return '/departments';
    case 'users':
      return '/users';
    case 'industry-approvals':
      return '/industry-approvals';
    case 'settings':
      return '/settings';
    case 'feature-comparison':
      return '/comparison';
    case 'profile':
      return '/profile';
    case 'industry-dashboard':
      return '/industry/dashboard';
    case 'industry-postings':
      return '/industry/postings';
    case 'industry-coding-assessments':
      return '/industry/coding-assessments';
    case 'industry-applications':
      return '/industry/applications';
    case 'industry-reports':
      return '/industry/reports';
    case 'industry-profile':
      return '/industry/profile';
    case 'dashboard':
    default:
      return '/';
  }
};
