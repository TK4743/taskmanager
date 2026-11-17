import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { API_URL } from '../config';
import { parseRouteFromPath, getPathFromState } from '../lib/routing';
import type {
  User, Task, Submission, Department, Class, Team, TeamMember,
  TeamInvitation, TeamSubmission, Notice, Notification, HODStats,
  AdvisorStats, CoordinatorStats, StudentStats, ToastMessage, ToastType,
  AppRouteState
} from '../types';
import type { ProofPreviewData } from '../components/modals/ProofPreviewModal';

export function useAppData() {
  // Auth state
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  });

  // Navigation state
  const [view, setView] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const r = parseRouteFromPath(window.location.pathname);
      return r.view || 'dashboard';
    }
    return 'dashboard';
  });

  const [codingPlatformTab, setCodingPlatformTab] = useState<'LEETCODE' | 'GITHUB'>(() => {
    if (typeof window !== 'undefined') {
      const r = parseRouteFromPath(window.location.pathname);
      return r.codingPlatformTab || 'LEETCODE';
    }
    return 'LEETCODE';
  });

  const [publicPortfolioRegNo, setPublicPortfolioRegNo] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const r = parseRouteFromPath(window.location.pathname);
      if (r.portfolioRegNo) return r.portfolioRegNo;
      const sp = new URLSearchParams(window.location.search);
      const q = sp.get('portfolio');
      if (q && q.trim()) return q.trim();
    }
    return null;
  });

  const [viewingStudentProfileId, setViewingStudentProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  // Toast notification state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Core application entities
  const [departments, setDepartments] = useState<Department[]>(() => {
    try {
      const cached = sessionStorage.getItem('app_cache_depts');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [classes, setClasses] = useState<Class[]>(() => {
    try {
      const cached = sessionStorage.getItem('app_cache_classes');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const cached = sessionStorage.getItem('app_cache_users');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const cached = sessionStorage.getItem('app_cache_tasks');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    try {
      const cached = sessionStorage.getItem('app_cache_submissions');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });

  // Role-specific stats
  const [hodStats, setHodStats] = useState<HODStats | null>(null);
  const [advisorStats, setAdvisorStats] = useState<AdvisorStats | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [coordinatorStats, setCoordinatorStats] = useState<CoordinatorStats | null>(null);
  const [supremeStats, setSupremeStats] = useState<any>(null);
  const [myClass, setMyClass] = useState<Class | null>(null);

  // In-app notifications
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const cached = sessionStorage.getItem('app_cache_notifs');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  // Teams & invitations
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [myInvitations, setMyInvitations] = useState<TeamInvitation[]>([]);
  const [teamSubmissions, setTeamSubmissions] = useState<TeamSubmission[]>([]);

  // Notices
  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    category: 'GENERAL' as any,
    priority: 'NORMAL' as any,
    scope: 'ALL' as any,
    target_dept_id: '',
    target_class_id: '',
    expires_at: ''
  });
  const [isCreatingNotice, setIsCreatingNotice] = useState(false);
  const [noticeAttachment, setNoticeAttachment] = useState<File | null>(null);

  // Modals state
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showCreateNoticeModal, setShowCreateNoticeModal] = useState<boolean>(false);
  const [showTelegramLinkModal, setShowTelegramLinkModal] = useState<boolean>(false);
  const [telegramChatIdInput, setTelegramChatIdInput] = useState<string>('');
  const [telegramUsernameInput, setTelegramUsernameInput] = useState<string>('');
  const [isLinkingTelegram, setIsLinkingTelegram] = useState<boolean>(false);

  const [inspectingSubmission, setInspectingSubmission] = useState<Submission | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState<Submission | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [teamReviewModal, setTeamReviewModal] = useState<TeamSubmission | null>(null);

  const [teamModalTask, setTeamModalTask] = useState<Task | null>(null);
  const [currentTaskTeam, setCurrentTaskTeam] = useState<Team | null>(null);
  const [eligibleClassmates, setEligibleClassmates] = useState<any[]>([]);
  const [selectedClassmateIds, setSelectedClassmateIds] = useState<string[]>([]);
  const [classmateSearchTerm, setClassmateSearchTerm] = useState<string>('');
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [teamProofFile, setTeamProofFile] = useState<File | null>(null);
  const [teamRemarks, setTeamRemarks] = useState<string>('');
  const [isSubmittingTeam, setIsSubmittingTeam] = useState<boolean>(false);

  const [extendingTask, setExtendingTask] = useState<Task | null>(null);
  const [extendedDeadline, setExtendedDeadline] = useState<string>('');
  const [showExtendModal, setShowExtendModal] = useState<boolean>(false);

  const [emailAlertTask, setEmailAlertTask] = useState<Task | null>(null);
  const [emailAlertPendingData, setEmailAlertPendingData] = useState<any>(null);
  const [emailAlertLoading, setEmailAlertLoading] = useState<boolean>(false);
  const [emailAlertSending, setEmailAlertSending] = useState<boolean>(false);
  const [emailAlertCustomMsg, setEmailAlertCustomMsg] = useState<string>('');
  const [emailAlertSuccessStats, setEmailAlertSuccessStats] = useState<any>(null);
  const [emailNodesStatus, setEmailNodesStatus] = useState<any>(null);
  const [fetchingEmailStatus, setFetchingEmailStatus] = useState<boolean>(false);

  const [viewingStaffStudentProfile, setViewingStaffStudentProfile] = useState<any>(null);
  const [proofPreviewData, setProofPreviewData] = useState<ProofPreviewData | null>(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);

  // Sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('desktop_sidebar_open');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileSidebarOpen(prev => !prev);
    } else {
      setIsDesktopSidebarOpen(prev => {
        const next = !prev;
        try { localStorage.setItem('desktop_sidebar_open', String(next)); } catch {}
        return next;
      });
    }
  };

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch functions
  const fetchTasks = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
        try { sessionStorage.setItem('app_cache_tasks', JSON.stringify(data)); } catch {}
      }
    } catch {}
  }, [token]);

  const fetchSubmissions = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
        try { sessionStorage.setItem('app_cache_submissions', JSON.stringify(data)); } catch {}
      }
    } catch {}
  }, [token]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        try { sessionStorage.setItem('app_cache_users', JSON.stringify(data)); } catch {}
      }
    } catch {}
  }, [token]);

  const fetchNotices = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/notices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotices(data);
      }
    } catch {}
  }, [token]);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        try { sessionStorage.setItem('app_cache_notifs', JSON.stringify(data)); } catch {}
      }
    } catch {}
  }, [token]);

  const fetchMyTeamsAndInvitations = useCallback(async () => {
    if (!token || user?.role !== 'STUDENT') return;
    try {
      const res = await fetch(`${API_URL}/api/team/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyTeams(data.teams || []);
        setMyInvitations(data.invitations || []);
      }
    } catch (e) {
      console.error('Failed to fetch my teams:', e);
    }
  }, [token, user?.role]);

  const fetchCoordinatorStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/stats/coordinator`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCoordinatorStats(data);
      }
    } catch {}
  }, [token]);

  const fetchEmailNodesStatus = useCallback(async () => {
    if (!token) return;
    setFetchingEmailStatus(true);
    try {
      const res = await fetch(`${API_URL}/api/email-service/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmailNodesStatus(data);
      }
    } catch {}
    finally {
      setFetchingEmailStatus(false);
    }
  }, [token]);

  // Initial bootstrap data fetch
  const fetchInitialData = useCallback(async (passedToken?: string) => {
    const activeToken = passedToken || token || localStorage.getItem('token');
    if (!activeToken) {
      setIsLoading(false);
      return;
    }
    const headers = { Authorization: `Bearer ${activeToken}` };
    try {
      const bootRes = await fetch(`${API_URL}/api/bootstrap`, { headers });
      if (bootRes.status === 401) {
        handleLogout();
        setIsLoading(false);
        return;
      }
      if (bootRes.ok) {
        const bData = await bootRes.json();
        if (bData.departments) setDepartments(bData.departments);
        if (bData.classes) setClasses(bData.classes);
        if (bData.users) setUsers(bData.users);
        if (bData.tasks) setTasks(bData.tasks);
        if (bData.submissions) setSubmissions(bData.submissions);
        if (bData.user) {
          setUser(bData.user);
          localStorage.setItem('user', JSON.stringify(bData.user));
        }
      }
    } catch (e) {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Bootstrap trigger on mount / login
  useEffect(() => {
    if (token) {
      fetchInitialData();
      fetchNotices();
      fetchNotifications();
      fetchMyTeamsAndInvitations();
    } else {
      setIsLoading(false);
    }
  }, [token, fetchInitialData, fetchNotices, fetchNotifications, fetchMyTeamsAndInvitations]);

  // Logout handler
  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {}
    setToken(null);
    setUser(null);
    setView('dashboard');
    setTasks([]);
    setSubmissions([]);
    setDepartments([]);
    setClasses([]);
    setUsers([]);
    setNotices([]);
    setNotifications([]);
    setMyTeams([]);
    setMyInvitations([]);
  }, []);

  // Notifications actions
  const markNotificationsRead = useCallback(async () => {
    if (!token) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {}
  }, [token]);

  const markSingleNotificationRead = useCallback(async (id: number | string) => {
    if (!token) return;
    setNotifications(prev => prev.map(n => String(n.id) === String(id) ? { ...n, is_read: true } : n));
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {}
  }, [token]);

  // Task actions
  const deleteTask = useCallback(async (id: number | string) => {
    if (!confirm('Hard delete this task? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTasks(prev => prev.filter(t => String(t.id) !== String(id)));
        fetchSubmissions();
        addToast('Task deleted successfully', 'success');
      } else {
        const data = await res.json();
        addToast(data.error || 'Failed to delete task', 'error');
      }
    } catch {
      addToast('Network error deleting task', 'error');
    }
  }, [token, fetchSubmissions, addToast]);

  const toggleTaskStatus = useCallback(async (id: number | string, currentStatus: string) => {
    const newStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
    setTasks(prev => prev.map(t => String(t.id) === String(id) ? { ...t, status: newStatus as any } : t));
    addToast(`Task status updated to ${newStatus}`, 'info');
    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        setTasks(prev => prev.map(t => String(t.id) === String(id) ? { ...t, status: currentStatus as any } : t));
        const data = await res.json();
        addToast(data.error || 'Failed to update task status', 'error');
      }
    } catch {
      setTasks(prev => prev.map(t => String(t.id) === String(id) ? { ...t, status: currentStatus as any } : t));
      addToast('Network error updating task status', 'error');
    }
  }, [token, addToast]);

  const handleExtendDeadlineAndReopen = useCallback(async (taskId: string | number, deadlineIso: string) => {
    const previousTasks = [...tasks];
    setTasks(prev => prev.map(t => String(t.id) === String(taskId) ? { ...t, status: 'OPEN', deadline: deadlineIso } : t));
    setExtendingTask(null);
    setExtendedDeadline('');
    addToast('Task reopened and deadline extended successfully!', 'success');
    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/reopen`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deadline: deadlineIso })
      });
      if (res.ok) {
        fetchTasks();
      } else {
        setTasks(previousTasks);
        const data = await res.json();
        addToast(data.error || 'Failed to extend deadline and reopen task', 'error');
      }
    } catch {
      setTasks(previousTasks);
      addToast('Network error reopening task', 'error');
    }
  }, [tasks, token, fetchTasks, addToast]);

  // Submission verification
  const verifySubmission = useCallback(async (
    id: string | number,
    status: 'VERIFIED' | 'REJECTED',
    customNote?: string,
    customReason?: string
  ) => {
    if (status === 'REJECTED' && (!customReason || !customReason.trim())) {
      addToast('Please provide a reason for rejecting the submission.', 'error');
      return false;
    }
    try {
      const res = await fetch(`${API_URL}/api/submissions/${id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status,
          verification_note: status === 'VERIFIED' ? customNote : null,
          rejection_reason: status === 'REJECTED' ? customReason : null
        })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(status === 'VERIFIED' ? 'Submission successfully verified!' : 'Submission rejected.', 'success');
        setShowRejectionModal(null);
        setSubmissions(prev => prev.map(s => String(s.id) === String(id) ? {
          ...s,
          status,
          verification_note: status === 'VERIFIED' ? (customNote || s.verification_note) : s.verification_note,
          rejection_reason: status === 'REJECTED' ? (customReason || s.rejection_reason) : s.rejection_reason,
          verified_at: new Date().toISOString()
        } : s));
        fetchSubmissions();
        return true;
      } else {
        addToast(data.error || 'Failed to update submission status', 'error');
        return false;
      }
    } catch {
      addToast('Network error during verification', 'error');
      return false;
    }
  }, [token, fetchSubmissions, addToast]);

  // Teams handlers
  const openTeamModal = useCallback(async (task: Task) => {
    setTeamModalTask(task);
    setTeamProofFile(null);
    setTeamRemarks('');
    setSelectedClassmateIds([]);
    setNewTeamName('');

    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/team/task/${task.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentTaskTeam(data.team || null);

        if (!data.team && user?.role === 'STUDENT') {
          const classmatesRes = await fetch(`${API_URL}/api/team/classmates/${task.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (classmatesRes.ok) {
            setEligibleClassmates(await classmatesRes.json());
          }
        }
      }
    } catch {
      addToast('Failed to load team details', 'error');
    }
  }, [token, user?.role, addToast]);

  const handleCreateTeam = useCallback(async () => {
    if (!teamModalTask || !newTeamName.trim() || selectedClassmateIds.length === 0) return;
    setIsSubmittingTeam(true);
    try {
      const res = await fetch(`${API_URL}/api/team/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          taskId: teamModalTask.id,
          teamName: newTeamName.trim(),
          members: selectedClassmateIds
        })
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Team created successfully and invitations sent!', 'success');
        setNewTeamName('');
        setSelectedClassmateIds([]);
        openTeamModal(teamModalTask);
        fetchMyTeamsAndInvitations();
      } else {
        addToast(data.error || 'Failed to create team', 'error');
      }
    } catch {
      addToast('Network error creating team', 'error');
    } finally {
      setIsSubmittingTeam(false);
    }
  }, [teamModalTask, newTeamName, selectedClassmateIds, token, openTeamModal, fetchMyTeamsAndInvitations, addToast]);

  const handleCreateSoloTeam = useCallback(async () => {
    if (!teamModalTask) return;
    setIsSubmittingTeam(true);
    try {
      const soloTeamName = newTeamName.trim() || `${user?.full_name || user?.username || 'Student'} (Solo)`;
      const res = await fetch(`${API_URL}/api/team/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          taskId: teamModalTask.id,
          teamName: soloTeamName,
          members: []
        })
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Solo submission mode activated! You can now submit your proof.', 'success');
        openTeamModal(teamModalTask);
        fetchMyTeamsAndInvitations();
      } else {
        addToast(data.error || 'Failed to activate solo mode', 'error');
      }
    } catch {
      addToast('Network error creating solo entry', 'error');
    } finally {
      setIsSubmittingTeam(false);
    }
  }, [teamModalTask, newTeamName, user, token, openTeamModal, fetchMyTeamsAndInvitations, addToast]);

  const handleInviteMoreClassmates = useCallback(async () => {
    if (!currentTaskTeam || selectedClassmateIds.length === 0) return;
    try {
      const res = await fetch(`${API_URL}/api/team/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          teamId: currentTaskTeam.id,
          studentIds: selectedClassmateIds
        })
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Invitations sent successfully!', 'success');
        setSelectedClassmateIds([]);
        if (teamModalTask) openTeamModal(teamModalTask);
      } else {
        addToast(data.error || 'Failed to send invitations', 'error');
      }
    } catch {
      addToast('Network error sending invitations', 'error');
    }
  }, [currentTaskTeam, selectedClassmateIds, teamModalTask, token, openTeamModal, addToast]);

  const handleRespondInvitation = useCallback(async (invitationId: string, response: 'ACCEPT' | 'REJECT' | 'DECLINE') => {
    const action = response === 'REJECT' ? 'DECLINE' : response;
    setMyInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    try {
      const res = await fetch(`${API_URL}/api/team/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ invitationId, response: action })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(`Invitation ${action === 'ACCEPT' ? 'accepted' : 'declined'} successfully!`, 'success');
        Promise.all([
          fetchMyTeamsAndInvitations(),
          fetchTasks(),
          fetchSubmissions()
        ]);
        if (teamModalTask) openTeamModal(teamModalTask);
      } else {
        addToast(data.error || 'Failed to respond to invitation', 'error');
        fetchMyTeamsAndInvitations();
      }
    } catch {
      addToast('Network error responding to invitation', 'error');
      fetchMyTeamsAndInvitations();
    }
  }, [token, fetchMyTeamsAndInvitations, fetchTasks, fetchSubmissions, teamModalTask, openTeamModal, addToast]);

  const handleRemoveTeamMember = useCallback(async (memberId: string) => {
    if (!confirm('Remove this member from team?')) return;
    try {
      const res = await fetch(`${API_URL}/api/team/member/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Member removed from team', 'info');
        if (teamModalTask) openTeamModal(teamModalTask);
      } else {
        addToast(data.error || 'Failed to remove member', 'error');
      }
    } catch {
      addToast('Network error removing member', 'error');
    }
  }, [teamModalTask, token, openTeamModal, addToast]);

  const handleDeleteTeam = useCallback(async (teamId: string) => {
    if (!confirm('Delete this team? All invitations and member details will be deleted.')) return;
    try {
      const res = await fetch(`${API_URL}/api/team/${teamId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Team deleted', 'info');
        setCurrentTaskTeam(null);
        fetchMyTeamsAndInvitations();
        if (teamModalTask) openTeamModal(teamModalTask);
      } else {
        addToast(data.error || 'Failed to delete team', 'error');
      }
    } catch {
      addToast('Network error deleting team', 'error');
    }
  }, [teamModalTask, token, openTeamModal, fetchMyTeamsAndInvitations, addToast]);

  const handleSubmitTeamProof = useCallback(async () => {
    if (!currentTaskTeam || !teamProofFile) {
      return addToast('Please select a proof screenshot file', 'error');
    }
    setIsSubmittingTeam(true);
    try {
      const formData = new FormData();
      formData.append('teamId', currentTaskTeam.id);
      formData.append('remarks', teamRemarks);
      formData.append('screenshot', teamProofFile, teamProofFile.name);
      formData.append('original_filename', teamProofFile.name);

      const res = await fetch(`${API_URL}/api/team/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Team task submitted successfully!', 'success');
        setTeamProofFile(null);
        setTeamRemarks('');
        if (teamModalTask) openTeamModal(teamModalTask);
        fetchSubmissions();
        if (user?.role === 'STUDENT' && user?.is_coordinator) {
          fetchCoordinatorStats();
        }
      } else {
        addToast(data.error || 'Failed to submit team task', 'error');
      }
    } catch {
      addToast('Network error submitting team task', 'error');
    } finally {
      setIsSubmittingTeam(false);
    }
  }, [currentTaskTeam, teamProofFile, teamRemarks, teamModalTask, token, openTeamModal, fetchSubmissions, user, fetchCoordinatorStats, addToast]);

  const handleReviewTeamSubmission = useCallback(async (submissionId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`${API_URL}/api/team/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          submissionId,
          status,
          feedback: status === 'REJECTED' ? teamRejectionReason : 'Approved team submission'
        })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(`Team submission ${status.toLowerCase()} successfully!`, 'success');
        setTeamReviewModal(null);
        setTeamRejectionReason('');
        fetchSubmissions();
        if (user?.role === 'STUDENT' && user?.is_coordinator) {
          fetchCoordinatorStats();
        }
      } else {
        addToast(data.error || 'Failed to review submission', 'error');
      }
    } catch {
      addToast('Network error reviewing team submission', 'error');
    }
  }, [teamRejectionReason, token, fetchSubmissions, user, fetchCoordinatorStats, addToast]);

  // Notice handlers
  const handleCreateNotice = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) return;
    setIsCreatingNotice(true);
    try {
      const formData = new FormData();
      formData.append('title', noticeForm.title.trim());
      formData.append('content', noticeForm.content.trim());
      formData.append('category', noticeForm.category);
      formData.append('priority', noticeForm.priority);
      formData.append('scope', noticeForm.scope);
      if (noticeForm.target_dept_id) formData.append('target_dept_id', noticeForm.target_dept_id);
      if (noticeForm.target_class_id) formData.append('target_class_id', noticeForm.target_class_id);
      if (noticeForm.expires_at) formData.append('expires_at', noticeForm.expires_at);
      if (noticeAttachment) formData.append('attachment', noticeAttachment);

      const res = await fetch(`${API_URL}/api/notices`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        addToast('Notice published successfully!', 'success');
        setShowCreateNoticeModal(false);
        setNoticeForm({
          title: '', content: '', category: 'GENERAL', priority: 'NORMAL',
          scope: 'ALL', target_dept_id: '', target_class_id: '', expires_at: ''
        });
        setNoticeAttachment(null);
        fetchNotices();
      } else {
        const data = await res.json();
        addToast(data.error || 'Failed to publish notice', 'error');
      }
    } catch {
      addToast('Network error publishing notice', 'error');
    } finally {
      setIsCreatingNotice(false);
    }
  }, [noticeForm, noticeAttachment, token, fetchNotices, addToast]);

  const handleDeleteNotice = useCallback(async (id: string) => {
    if (!confirm('Hard delete this announcement? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API_URL}/api/notices/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotices(prev => prev.filter(n => String(n.id) !== String(id)));
        addToast('Notice deleted', 'info');
      }
    } catch {}
  }, [token, addToast]);

  const handlePinNotice = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/notices/${id}/pin`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const updated = await res.json();
        setNotices(prev => prev.map(n => String(n.id) === String(id) ? { ...n, is_pinned: updated.is_pinned } : n));
        addToast(updated.is_pinned ? 'Notice pinned to top' : 'Notice unpinned', 'info');
      }
    } catch {}
  }, [token, addToast]);

  const handleShareNotice = useCallback((id: string, title?: string) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?noticeId=${id}`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        addToast('Notice link copied to clipboard!', 'success');
      }).catch(() => {
        prompt('Copy Notice Link:', shareUrl);
      });
    } else {
      prompt('Copy Notice Link:', shareUrl);
    }
  }, [addToast]);

  const handleShareBoard = useCallback(() => {
    const shareUrl = `${window.location.origin}${window.location.pathname}`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        addToast('Notice board link copied to clipboard!', 'success');
      }).catch(() => {
        prompt('Copy Notice Board Link:', shareUrl);
      });
    } else {
      prompt('Copy Notice Board Link:', shareUrl);
    }
  }, [addToast]);

  // Telegram modal handlers
  const handleLinkTelegram = useCallback(async () => {
    if (!telegramChatIdInput.trim()) return;
    setIsLinkingTelegram(true);
    try {
      const res = await fetch(`${API_URL}/api/student/link-telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          chatId: telegramChatIdInput.trim(),
          telegramUsername: telegramUsernameInput.trim() || undefined
        })
      });
      if (res.ok) {
        setUser(prev => prev ? { ...prev, telegram_chat_id: telegramChatIdInput.trim(), telegram_username: telegramUsernameInput.trim() } : null);
        setShowTelegramLinkModal(false);
        addToast('Telegram linked successfully!', 'success');
      } else {
        const data = await res.json();
        addToast(data.error || 'Failed to link Telegram', 'error');
      }
    } catch {
      addToast('Network error linking Telegram', 'error');
    } finally {
      setIsLinkingTelegram(false);
    }
  }, [telegramChatIdInput, telegramUsernameInput, token, addToast]);

  const [sendingTelegramTest, setSendingTelegramTest] = useState<boolean>(false);

  const handleSendTestMessage = useCallback(async (targetId?: string) => {
    setSendingTelegramTest(true);
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
      setSendingTelegramTest(false);
    }
  }, [token, addToast]);

  const handleUnlinkTelegram = useCallback(async () => {
    if (!confirm('Unlink your Telegram notifications?')) return;
    try {
      const res = await fetch(`${API_URL}/api/student/unlink-telegram`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUser(prev => prev ? { ...prev, telegram_chat_id: null, telegram_username: null, telegram_linked_at: null } : null);
        addToast('Telegram unlinked', 'info');
      } else {
        const data = await res.json().catch(() => ({}));
        addToast(data.error || 'Failed to unlink Telegram', 'error');
      }
    } catch {
      addToast('Network error unlinking Telegram', 'error');
    }
  }, [token, addToast]);

  // Email alert modal handler
  const openTaskPendingEmailModal = useCallback(async (task: Task) => {
    setEmailAlertTask(task);
    setEmailAlertLoading(true);
    setEmailAlertPendingData(null);
    setEmailAlertSuccessStats(null);
    setEmailAlertCustomMsg('');
    fetchEmailNodesStatus();
    try {
      const res = await fetch(`${API_URL}/api/tasks/${task.id}/pending-students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmailAlertPendingData(data);
      } else {
        addToast('Failed to fetch pending students for this task', 'error');
      }
    } catch {
      addToast('Network error fetching pending students', 'error');
    } finally {
      setEmailAlertLoading(false);
    }
  }, [token, fetchEmailNodesStatus, addToast]);

  const handleDispatchTaskPendingEmails = useCallback(async () => {
    if (!emailAlertTask) return;
    setEmailAlertSending(true);
    try {
      const res = await fetch(`${API_URL}/api/tasks/${emailAlertTask.id}/send-pending-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customMessage: emailAlertCustomMsg.trim() || undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailAlertSuccessStats(data);
        addToast(data.message || `Dispatched pending reminders to ${data.sentCount} students!`, 'success');
        fetchEmailNodesStatus();
      } else {
        addToast(data.error || 'Failed to dispatch email reminders', 'error');
      }
    } catch {
      addToast('Network error sending email alerts', 'error');
    } finally {
      setEmailAlertSending(false);
    }
  }, [emailAlertTask, emailAlertCustomMsg, token, fetchEmailNodesStatus, addToast]);

  // Roles & derived properties
  const isAdmin = user?.role === 'SUPREME_ADMIN';
  const isHOD = user?.role === 'HOD';
  const isAdvisor = user?.role === 'CLASS_ADVISOR';
  const isStudent = user?.role === 'STUDENT';
  const isCoordinator = Boolean(user?.role === 'STUDENT' && user?.is_coordinator);
  const isFaculty = user?.role === 'FACULTY';
  const isIndustry = user?.role === 'INDUSTRY';

  const pendingIndustryList = useMemo(() => {
    return users.filter(u => u.role === 'INDUSTRY' && (!u.is_approved || u.status === 'PENDING'));
  }, [users]);

  const pendingVerificationCount = useMemo(() => {
    return submissions.filter(s => s.status === 'SUBMITTED').length;
  }, [submissions]);

  return {
    user, setUser, token, setToken, view, setView,
    publicPortfolioRegNo, setPublicPortfolioRegNo,
    viewingStudentProfileId, setViewingStudentProfileId,
    isLoading, setIsLoading, hasError, setHasError,
    toasts, addToast, removeToast,
    departments, setDepartments, fetchDepartments: fetchInitialData,
    classes, setClasses,
    users, setUsers, fetchUsers,
    tasks, setTasks, fetchTasks,
    submissions, setSubmissions, fetchSubmissions,
    hodStats, setHodStats,
    advisorStats, setAdvisorStats,
    studentStats, setStudentStats,
    coordinatorStats, setCoordinatorStats, fetchCoordinatorStats,
    supremeStats, setSupremeStats,
    myClass, setMyClass,
    notifications, setNotifications, showNotifications, setShowNotifications,
    notificationDropdownRef, markNotificationsRead, markSingleNotificationRead,
    myTeams, setMyTeams, myInvitations, setMyInvitations,
    teamSubmissions, setTeamSubmissions, fetchMyTeamsAndInvitations,
    notices, setNotices, fetchNotices,
    showExportModal, setShowExportModal,
    showCreateNoticeModal, setShowCreateNoticeModal,
    noticeForm, setNoticeForm, handleCreateNotice, handleDeleteNotice, handlePinNotice,
    handleShareNotice, handleShareBoard, isCreatingNotice, setIsCreatingNotice,
    noticeAttachment, setNoticeAttachment,
    showTelegramLinkModal, setShowTelegramLinkModal,
    telegramChatIdInput, setTelegramChatIdInput, telegramUsernameInput, setTelegramUsernameInput,
    isLinkingTelegram, handleLinkTelegram, handleUnlinkTelegram,
    sendingTelegramTest, handleSendTestMessage,
    inspectingSubmission, setInspectingSubmission,
    showRejectionModal, setShowRejectionModal, rejectionReason, setRejectionReason,
    teamReviewModal, setTeamReviewModal,
    teamModalTask, setTeamModalTask, currentTaskTeam, setCurrentTaskTeam,
    eligibleClassmates, selectedClassmateIds, setSelectedClassmateIds,
    classmateSearchTerm, setClassmateSearchTerm, newTeamName, setNewTeamName,
    teamProofFile, setTeamProofFile, teamRemarks, setTeamRemarks,
    isSubmittingTeam, openTeamModal, handleCreateTeam, handleCreateSoloTeam,
    handleInviteMoreClassmates, handleRespondInvitation, handleRemoveTeamMember,
    handleDeleteTeam, handleSubmitTeamProof, handleReviewTeamSubmission,
    extendingTask, setExtendingTask, extendedDeadline, setExtendedDeadline,
    showExtendModal, setShowExtendModal, handleExtendDeadlineAndReopen,
    emailAlertTask, setEmailAlertTask, emailAlertPendingData, emailAlertLoading,
    emailAlertSending, emailAlertCustomMsg, setEmailAlertCustomMsg,
    emailAlertSuccessStats, emailNodesStatus, fetchingEmailStatus,
    openTaskPendingEmailModal, handleDispatchTaskPendingEmails, fetchEmailNodesStatus,
    viewingStaffStudentProfile, setViewingStaffStudentProfile,
    proofPreviewData, setProofPreviewData,
    highlightedTaskId, setHighlightedTaskId,
    isDesktopSidebarOpen, setIsDesktopSidebarOpen,
    isMobileSidebarOpen, setIsMobileSidebarOpen,
    handleToggleSidebar, handleLogout,
    deleteTask, toggleTaskStatus, verifySubmission,
    isAdmin, isHOD, isAdvisor, isStudent, isCoordinator, isFaculty, isIndustry,
    pendingIndustryList, pendingVerificationCount,
    codingPlatformTab, setCodingPlatformTab,
    myLeetcodeProgress: null,
    fetchInitialData
  };
}
