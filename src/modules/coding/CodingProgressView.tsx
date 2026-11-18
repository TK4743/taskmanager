import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Code, Github, Zap, Target, Hourglass, TrendingUp, Calendar,
  Filter, Search, Download, Plus, RotateCw, RotateCcw,
  ExternalLink, ChevronUp, ChevronDown, CheckCircle2, XCircle,
  AlertTriangle, Clock, Users, ArrowUpRight, Loader2, Sparkles,
  Activity, Building2, X, Trash2, Terminal, Trophy
} from 'lucide-react';
import { HistoryChartWrapper } from '../../components/common/HistoryChartWrapper';
import { API_URL } from '../../config';
import { cn } from '../../lib/utils';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { AssignTargetModal } from '../../components/modals/AssignTargetModal';
import { StudentHistoryModal } from '../../components/modals/StudentHistoryModal';
import type { User, Department, Class, ToastType } from '../../types';

export interface CodingProgressViewProps {
  user: User | null;
  token: string | null;
  departments: Department[];
  classes: Class[];
  users: User[];
  addToast?: (msg: string, type?: ToastType) => void;
}

export function CodingProgressView({
  user,
  token,
  departments,
  classes,
  users,
  addToast = () => {},
}: CodingProgressViewProps) {
  const isAdmin = user?.role === 'SUPREME_ADMIN';
  const isHOD = user?.role === 'HOD';
  const isAdvisor = user?.role === 'CLASS_ADVISOR';

  // ── States & Sorting ──
  // LeetCode Target Tracking State
  const [myLeetcodeProgress, setMyLeetcodeProgress] = useState<any>(null);
  const [leetcodeStats, setLeetcodeStats] = useState<any>(null);
  const [leetcodeProgressList, setLeetcodeProgressList] = useState<any[]>([]);
  const [leetcodeTargets, setLeetcodeTargets] = useState<any[]>([]);
  const [showAssignTargetModal, setShowAssignTargetModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStudentHistory, setSelectedStudentHistory] = useState<any>(null);
  const [studentHistoryData, setStudentHistoryData] = useState<any>(null);
  const [syncingLeetcode, setSyncingLeetcode] = useState(false);
  const [submittingTarget, setSubmittingTarget] = useState(false);

  const [leetcodeDate, setLeetcodeDate] = useState<string>(new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [leetcodeStatusFilter, setLeetcodeStatusFilter] = useState<string>('ALL');
  const [leetcodeSearch, setLeetcodeSearch] = useState<string>('');
  const [leetcodeViewType, setLeetcodeViewType] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [leetcodeActiveTab, setLeetcodeActiveTab] = useState<'MONITOR' | 'TARGETS'>('MONITOR');
  const [selectedLeetcodeDeptId, setSelectedLeetcodeDeptId] = useState<string>('ALL');
  const [selectedLeetcodeYear, setSelectedLeetcodeYear] = useState<string>('ALL');
  const [selectedLeetcodeClassId, setSelectedLeetcodeClassId] = useState<string>('ALL');
  const [leetcodeSortColumn, setLeetcodeSortColumn] = useState<string>('registerNumber');
  const [leetcodeSortOrder, setLeetcodeSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (user) {
      if (user.role === 'CLASS_ADVISOR' || (user.role === 'STUDENT' && user.is_coordinator)) {
        if (user.class_id) setSelectedLeetcodeClassId(user.class_id.toString());
        if (user.department_id) setSelectedLeetcodeDeptId(user.department_id.toString());
        if (classes.length > 0) {
          const userClassObj = classes.find(c => String(c.id) === String(user.class_id));
          if (userClassObj?.year) setSelectedLeetcodeYear(String(userClassObj.year));
        }
      } else if (user.role === 'HOD') {
        setSelectedLeetcodeDeptId(user.department_id ? user.department_id.toString() : 'ALL');
        setSelectedLeetcodeClassId('ALL');
        setSelectedLeetcodeYear('ALL');
        
        
      } else if (user.role === 'SUPREME_ADMIN') {
        setSelectedLeetcodeDeptId('ALL');
        setSelectedLeetcodeClassId('ALL');
        setSelectedLeetcodeYear('ALL');
        
        
      }
    }
  }, [user, classes]);

  // GitHub & Combined Progress Tracking State
  const [codingPlatformTab, setCodingPlatformTab] = useState<'LEETCODE' | 'GITHUB'>(() => (typeof window !== 'undefined' ? 'LEETCODE' : 'LEETCODE'));
  const [myGithubProgress, setMyGithubProgress] = useState<any>(null);
  const [githubStats, setGithubStats] = useState<any>(null);
  const [githubProgressList, setGithubProgressList] = useState<any[]>([]);
  const [combinedProgressList, setCombinedProgressList] = useState<any[]>([]);
  const [syncingGithub, setSyncingGithub] = useState(false);

  // ── Client-side filtering (instant, no network) ─────────────────────────────
  const filteredLeetcodeProgressList = useMemo(() => {
    return leetcodeProgressList.filter(row => {
      // Year filter
      if (selectedLeetcodeYear !== 'ALL') {
        if (row.year == null || String(row.year) !== selectedLeetcodeYear) return false;
      }
      // Class / Section filter
      if (selectedLeetcodeClassId !== 'ALL') {
        if (String(row.classId) !== String(selectedLeetcodeClassId)) return false;
      }
      // Status filter: INCOMPLETE covers both INCOMPLETE and NO_TARGET
      if (leetcodeStatusFilter !== 'ALL') {
        const rowStatus = leetcodeViewType === 'DAILY' ? row.dailyStatus : row.weeklyStatus;
        if (leetcodeStatusFilter === 'COMPLETED') {
          if (rowStatus !== 'COMPLETED') return false;
        } else if (leetcodeStatusFilter === 'INCOMPLETE') {
          if (rowStatus !== 'INCOMPLETE' && rowStatus !== 'NO_TARGET') return false;
        } else if (leetcodeStatusFilter === 'DATA_UNAVAILABLE') {
          if (rowStatus !== 'DATA_UNAVAILABLE') return false;
        }
      }
      // Text search across all identifiers
      if (leetcodeSearch) {
        const s = leetcodeSearch.toLowerCase();
        return (
          (row.fullName || '').toLowerCase().includes(s) ||
          (row.registerNumber || '').toLowerCase().includes(s) ||
          (row.leetcodeUsername || '').toLowerCase().includes(s) ||
          (row.leetcodeUrl || '').toLowerCase().includes(s) ||
          (row.className || '').toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [leetcodeProgressList, selectedLeetcodeYear, selectedLeetcodeClassId, leetcodeStatusFilter, leetcodeSearch, leetcodeViewType]);

  const sortedLeetcodeProgressList = useMemo(() => {
    return [...filteredLeetcodeProgressList].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (leetcodeSortColumn) {
        case 'registerNumber':
          valA = a.registerNumber || '';
          valB = b.registerNumber || '';
          break;
        case 'fullName':
          valA = a.fullName || '';
          valB = b.fullName || '';
          break;
        case 'className':
          valA = a.className || '';
          valB = b.className || '';
          break;
        case 'hasProfile':
          valA = a.leetcodeUsername ? 1 : 0;
          valB = b.leetcodeUsername ? 1 : 0;
          break;
        case 'target':
          valA = leetcodeViewType === 'DAILY' ? a.dailyTarget : a.weeklyTarget;
          valB = leetcodeViewType === 'DAILY' ? b.dailyTarget : b.weeklyTarget;
          break;
        case 'solved':
          valA = leetcodeViewType === 'DAILY' ? a.solvedToday : a.solvedThisWeek;
          valB = leetcodeViewType === 'DAILY' ? b.solvedToday : b.solvedThisWeek;
          break;
        case 'completionPct':
          valA = leetcodeViewType === 'DAILY' ? a.completionDailyPct : a.completionWeeklyPct;
          valB = leetcodeViewType === 'DAILY' ? b.completionDailyPct : b.completionWeeklyPct;
          break;
        case 'status':
          valA = leetcodeViewType === 'DAILY' ? a.dailyStatus : a.weeklyStatus;
          valB = leetcodeViewType === 'DAILY' ? b.dailyStatus : b.weeklyStatus;
          break;
        default:
          valA = a.registerNumber || '';
          valB = b.registerNumber || '';
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        const comp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
        return leetcodeSortOrder === 'asc' ? comp : -comp;
      }
      const comp = valA > valB ? 1 : valA < valB ? -1 : 0;
      return leetcodeSortOrder === 'asc' ? comp : -comp;
    });
  }, [filteredLeetcodeProgressList, leetcodeSortColumn, leetcodeSortOrder, leetcodeViewType]);

  // ── Client-side filtering for GitHub (instant, no network) ──────────────────
  const filteredGithubProgressList = useMemo(() => {
    return githubProgressList.filter(row => {
      // Year filter
      if (selectedLeetcodeYear !== 'ALL') {
        if (row.year == null || String(row.year) !== selectedLeetcodeYear) return false;
      }
      // Class / Section filter
      if (selectedLeetcodeClassId !== 'ALL') {
        if (String(row.classId) !== String(selectedLeetcodeClassId)) return false;
      }
      // Status filter: translate UI labels to GitHub commit semantics
      if (leetcodeStatusFilter !== 'ALL') {
        const isDaily = leetcodeViewType === 'DAILY';
        const commits = isDaily ? (row.commitsToday ?? 0) : (row.commitsThisWeek ?? 0);
        const hasProfile = !!(row.githubUsername || row.githubUrl);
        if (leetcodeStatusFilter === 'COMPLETED') {
          if (commits <= 0) return false;
        } else if (leetcodeStatusFilter === 'INCOMPLETE') {
          // Has a profile but zero commits
          if (!hasProfile || commits > 0) return false;
        } else if (leetcodeStatusFilter === 'DATA_UNAVAILABLE') {
          // No GitHub profile at all
          if (hasProfile) return false;
        }
      }
      // Text search
      if (leetcodeSearch) {
        const s = leetcodeSearch.toLowerCase();
        return (
          (row.fullName || '').toLowerCase().includes(s) ||
          (row.registerNumber || '').toLowerCase().includes(s) ||
          (row.githubUsername || '').toLowerCase().includes(s) ||
          (row.githubUrl || '').toLowerCase().includes(s) ||
          (row.className || '').toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [githubProgressList, selectedLeetcodeYear, selectedLeetcodeClassId, leetcodeStatusFilter, leetcodeSearch, leetcodeViewType]);

  const sortedGithubProgressList = useMemo(() => {
    return [...filteredGithubProgressList].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (leetcodeSortColumn) {
        case 'registerNumber':
          valA = a.registerNumber || '';
          valB = b.registerNumber || '';
          break;
        case 'fullName':
          valA = a.fullName || '';
          valB = b.fullName || '';
          break;
        case 'className':
          valA = a.className || '';
          valB = b.className || '';
          break;
        case 'hasProfile':
          valA = a.githubUsername ? 1 : 0;
          valB = b.githubUsername ? 1 : 0;
          break;
        case 'commitsToday':
          valA = a.commitsToday ?? 0;
          valB = b.commitsToday ?? 0;
          break;
        case 'commitsThisWeek':
          valA = a.commitsThisWeek ?? 0;
          valB = b.commitsThisWeek ?? 0;
          break;
        case 'syncStatus':
          valA = a.syncStatus || '';
          valB = b.syncStatus || '';
          break;
        default:
          valA = a.registerNumber || '';
          valB = b.registerNumber || '';
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        const comp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
        return leetcodeSortOrder === 'asc' ? comp : -comp;
      }
      const comp = valA > valB ? 1 : valA < valB ? -1 : 0;
      return leetcodeSortOrder === 'asc' ? comp : -comp;
    });
  }, [filteredGithubProgressList, leetcodeSortColumn, leetcodeSortOrder, leetcodeViewType]);

  const leetcodeDynamicStats = useMemo(() => {
    const total = filteredLeetcodeProgressList.length;
    let met = 0;
    let inProgress = 0;
    for (const r of filteredLeetcodeProgressList) {
      const status = leetcodeViewType === 'DAILY' ? r.dailyStatus : r.weeklyStatus;
      if (status === 'COMPLETED') met++;
      else if (status === 'INCOMPLETE') inProgress++;
    }
    const rate = total > 0 ? Math.round((met / total) * 100) : 0;
    return {
      totalStudents: total,
      met,
      inProgress,
      rate
    };
  }, [filteredLeetcodeProgressList, leetcodeViewType]);

  const githubDynamicStats = useMemo(() => {
    const total = filteredGithubProgressList.length;
    const isDaily = leetcodeViewType === 'DAILY';
    let active = 0;
    for (const r of filteredGithubProgressList) {
      const count = isDaily ? (r.commitsToday ?? 0) : (r.commitsThisWeek ?? 0);
      if (count > 0) active++;
    }
    return {
      totalStudents: total,
      activeCommitters: active
    };
  }, [filteredGithubProgressList, leetcodeViewType]);

  const githubTop3 = useMemo(() => {
    const isDaily = leetcodeViewType === 'DAILY';
    return [...filteredGithubProgressList]
      .filter(s => {
        const count = isDaily ? (s.commitsToday ?? 0) : (s.commitsThisWeek ?? 0);
        return count > 0;
      })
      .sort((a, b) => {
        const countA = isDaily ? (a.commitsToday ?? 0) : (a.commitsThisWeek ?? 0);
        const countB = isDaily ? (b.commitsToday ?? 0) : (b.commitsThisWeek ?? 0);
        if (countB !== countA) return countB - countA;
        return (a.fullName || '').localeCompare(b.fullName || '');
      })
      .slice(0, 3);
  }, [filteredGithubProgressList, leetcodeViewType]);

  const handleSortHeader = (col: string) => {
    if (leetcodeSortColumn === col) {
      setLeetcodeSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setLeetcodeSortColumn(col);
      setLeetcodeSortOrder('asc');
    }
  };

  const getISTDateForTarget = () => {
    return new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  };
  const getEndDateForTarget = (date: Date) => {
    const end = new Date(date);
    end.setDate(date.getDate() + 6);
    return end.toISOString().split('T')[0];
  };

  const [assignTargetForm, setAssignTargetForm] = useState({
    dailyTarget: '2',
    weeklyTarget: '14',
    startDate: getISTDateForTarget().toISOString().split('T')[0],
    endDate: getEndDateForTarget(getISTDateForTarget()),
    scopeType: 'CLASS',
    targetValue: ''
  });



  // ── Data Fetching ──
  const fetchMyLeetcodeProgress = async () => {
    try {
      const res = await fetch(`${API_URL}/api/leetcode/progress/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyLeetcodeProgress(data);
      }
    } catch (err) {
      console.error('Error fetching personal LeetCode progress:', err);
    }
  };

  const fetchLeetcodeStats = async () => {
    try {
      const deptParam = selectedLeetcodeDeptId !== 'ALL' ? `&departmentId=${selectedLeetcodeDeptId}` : '';
      const res = await fetch(`${API_URL}/api/leetcode/stats?date=${leetcodeDate}${deptParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeetcodeStats(data);
      }
    } catch (err) {
      console.error('Error fetching LeetCode stats:', err);
    }
  };

  // Track the latest LeetCode progress request and AbortController to discard stale or cancelled responses
  const leetcodeProgressRequestId = React.useRef(0);
  const leetcodeAbortControllerRef = React.useRef<AbortController | null>(null);

  const fetchLeetcodeProgress = async () => {
    const requestId = ++leetcodeProgressRequestId.current;
    if (leetcodeAbortControllerRef.current) {
      leetcodeAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    leetcodeAbortControllerRef.current = controller;

    try {
      const endpoint = leetcodeViewType === 'DAILY' ? 'daily' : 'weekly';
      const deptParam = selectedLeetcodeDeptId !== 'ALL' ? `&departmentId=${selectedLeetcodeDeptId}` : '';
      // NOTE: search, status, year, and classId are filtered client-side for instantaneous responsiveness
      const res = await fetch(`${API_URL}/api/leetcode/progress/${endpoint}?date=${leetcodeDate}${deptParam}`, {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${token}` }
      });
      // Discard stale responses from earlier requests or cancelled requests
      if (requestId !== leetcodeProgressRequestId.current || controller.signal.aborted) return;
      if (res.ok) {
        const data = await res.json();
        if (requestId === leetcodeProgressRequestId.current && !controller.signal.aborted) {
          setLeetcodeProgressList(data);
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (requestId === leetcodeProgressRequestId.current) {
        console.error('Error fetching LeetCode progress:', err);
      }
    }
  };

  const fetchLeetcodeTargets = async () => {
    try {
      const res = await fetch(`${API_URL}/api/leetcode/targets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeetcodeTargets(data);
      }
    } catch (err) {
      console.error('Error fetching LeetCode targets:', err);
    }
  };

  const [syncingMyLeetcode, setSyncingMyLeetcode] = useState(false);

  const handleSyncMyLeetcode = async () => {
    setSyncingMyLeetcode(true);
    try {
      const res = await fetch(`${API_URL}/api/leetcode/sync/my`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        addToast(data.message || 'LeetCode daily progress synced successfully', 'success');
        await fetchMyLeetcodeProgress();
      } else {
        const data = await res.json().catch(() => ({}));
        addToast(data.error || 'Failed to sync LeetCode progress', 'error');
      }
    } catch (err) {
      addToast('Network error syncing LeetCode progress', 'error');
    } finally {
      setSyncingMyLeetcode(false);
    }
  };

  const [syncingMyGithub, setSyncingMyGithub] = useState(false);

  const fetchMyGithubProgress = async () => {
    try {
      const res = await fetch(`${API_URL}/api/github/progress/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setMyGithubProgress(await res.json());
    } catch (err) {
      console.error('Error fetching personal GitHub progress:', err);
    }
  };

  const handleSyncMyGithub = async () => {
    setSyncingMyGithub(true);
    try {
      const res = await fetch(`${API_URL}/api/github/sync/my`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const data = await res.json();
        addToast(data.message || 'GitHub daily commits synced successfully', 'success');
        await fetchMyGithubProgress();
      } else {
        const data = await res.json().catch(() => ({}));
        addToast(data.error || 'Failed to sync GitHub progress', 'error');
      }
    } catch (err) {
      addToast('Network error syncing GitHub progress', 'error');
    } finally {
      setSyncingMyGithub(false);
    }
  };

  const fetchGithubStats = async () => {
    try {
      const deptParam = selectedLeetcodeDeptId !== 'ALL' ? `&departmentId=${selectedLeetcodeDeptId}` : '';
      const res = await fetch(`${API_URL}/api/github/stats?date=${leetcodeDate}${deptParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setGithubStats(await res.json());
    } catch (err) {
      console.error('Error fetching GitHub stats:', err);
    }
  };

  // Track the latest GitHub progress request and AbortController to discard stale or cancelled responses
  const githubProgressRequestId = React.useRef(0);
  const githubAbortControllerRef = React.useRef<AbortController | null>(null);

  const fetchGithubProgress = async () => {
    const requestId = ++githubProgressRequestId.current;
    if (githubAbortControllerRef.current) {
      githubAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    githubAbortControllerRef.current = controller;

    try {
      const deptParam = selectedLeetcodeDeptId !== 'ALL' ? `&departmentId=${selectedLeetcodeDeptId}` : '';
      // NOTE: search, status, year, and classId are filtered client-side for instantaneous responsiveness
      const res = await fetch(`${API_URL}/api/github/daily-commits?date=${leetcodeDate}${deptParam}`, {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (requestId !== githubProgressRequestId.current || controller.signal.aborted) return;
      if (res.ok) {
        const data = await res.json();
        if (requestId === githubProgressRequestId.current && !controller.signal.aborted) {
          setGithubProgressList(data);
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (requestId === githubProgressRequestId.current) {
        console.error('Error fetching GitHub progress:', err);
      }
    }
  };

  const fetchCombinedProgress = async () => {
    try {
      const deptParam = selectedLeetcodeDeptId !== 'ALL' ? `&departmentId=${selectedLeetcodeDeptId}` : '';
      const yearParam = selectedLeetcodeYear !== 'ALL' ? `&year=${selectedLeetcodeYear}` : '';
      const classParam = selectedLeetcodeClassId !== 'ALL' ? `&classId=${selectedLeetcodeClassId}` : '';
      const searchParam = leetcodeSearch ? `&search=${encodeURIComponent(leetcodeSearch)}` : '';
      const res = await fetch(`${API_URL}/api/coding/progress/combined?date=${leetcodeDate}&view=${leetcodeViewType}&status=${leetcodeStatusFilter}${searchParam}${deptParam}${yearParam}${classParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setCombinedProgressList(await res.json());
    } catch (err) {
      console.error('Error fetching combined progress:', err);
    }
  };

  const handleDeleteLeetcodeTarget = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this LeetCode target?')) return;
    try {
      const res = await fetch(`${API_URL}/api/leetcode/targets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('LeetCode target deleted successfully', 'success');
        fetchLeetcodeTargets();
        fetchLeetcodeProgress();
        fetchLeetcodeStats();
      } else {
        const data = await res.json();
        addToast(data.error || 'Failed to delete LeetCode target', 'error');
      }
    } catch (err) {
      addToast('Error deleting LeetCode target', 'error');
    }
  };


  // Initial fetch on mount or token/tab change
  useEffect(() => {
    if (!token) return;
    if (user?.role === 'STUDENT' && !user?.is_coordinator) {
      fetchMyLeetcodeProgress();
      fetchMyGithubProgress();
    } else {
      fetchLeetcodeStats();
      fetchLeetcodeProgress();
      fetchLeetcodeTargets();
      fetchGithubStats();
      fetchGithubProgress();
    }
  }, [token, user, selectedLeetcodeDeptId, selectedLeetcodeYear, selectedLeetcodeClassId, leetcodeDate, codingPlatformTab]);

  // ── Action Handlers ──
  const handleSyncGithubProgress = async () => {
    setSyncingGithub(true);
    try {
      const res = await fetch(`${API_URL}/api/github/sync/daily-commits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const data = await res.json();
        addToast(data.message || 'GitHub daily commits sync completed', 'success');
        fetchGithubProgress();
        fetchGithubStats();
        fetchCombinedProgress();
      } else {
        addToast('Failed to sync GitHub daily commits', 'error');
      }
    } catch (err) {
      addToast('Network error syncing GitHub daily commits', 'error');
    } finally {
      setSyncingGithub(false);
    }
  };

  const handleDownloadCombinedExcel = async () => {
    try {
      const deptParam = selectedLeetcodeDeptId !== 'ALL' ? `&departmentId=${selectedLeetcodeDeptId}` : '';
      const yearParam = selectedLeetcodeYear !== 'ALL' ? `&year=${selectedLeetcodeYear}` : '';
      const classParam = selectedLeetcodeClassId !== 'ALL' ? `&classId=${selectedLeetcodeClassId}` : '';
      const exportView = codingPlatformTab === 'GITHUB'
        ? (leetcodeViewType === 'DAILY' ? 'GITHUB_DAILY' : 'GITHUB_WEEKLY')
        : leetcodeViewType;
      const downloadUrl = `${API_URL}/api/coding/export-excel?date=${leetcodeDate}&view=${exportView}${deptParam}${yearParam}${classParam}`;

      const res = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        let errMessage = 'Failed to export excel report';
        try {
          const data = await res.json();
          errMessage = data.error || errMessage;
        } catch (e) { }
        addToast(errMessage, 'error');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Try to parse the filename from Content-Disposition header if available
      const contentDisposition = res.headers.get('content-disposition');
      let fileName = `${exportView}_Progress_Report_${leetcodeDate}.xlsx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename=(?:"([^"]+)"|([^;]+))/);
        if (match) {
          fileName = (match[1] || match[2]).trim();
        }
      }

      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading combined excel:', err);
      addToast('Network error exporting Excel', 'error');
    }
  };

  useEffect(() => {
    const handleDownloadEvent = () => {
      handleDownloadCombinedExcel();
    };
    window.addEventListener('download-coding-excel', handleDownloadEvent);
    return () => window.removeEventListener('download-coding-excel', handleDownloadEvent);
  }, [selectedLeetcodeDeptId, selectedLeetcodeYear, selectedLeetcodeClassId, codingPlatformTab, leetcodeViewType, leetcodeDate, token]);

  const handleCreateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTargetForm.scopeType || !assignTargetForm.targetValue) {
      addToast('Please select both a target scope and target option.', 'error');
      return;
    }
    if (submittingTarget) return;
    setSubmittingTarget(true);
    try {
      const res = await fetch(`${API_URL}/api/leetcode/targets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(assignTargetForm)
      });
      if (res.ok) {
        addToast('LeetCode target created successfully', 'success');
        setShowAssignTargetModal(false);
        fetchLeetcodeTargets();
        fetchLeetcodeProgress();
        fetchLeetcodeStats();
      } else {
        const data = await res.json();
        addToast(data.error || 'Failed to create LeetCode target', 'error');
      }
    } catch (err) {
      addToast('Network error creating LeetCode target', 'error');
    } finally {
      setSubmittingTarget(false);
    }
  };

  const handleSyncProgress = async () => {
    setSyncingLeetcode(true);
    try {
      const res = await fetch(`${API_URL}/api/leetcode/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        addToast(data.message || 'LeetCode progress synchronized successfully', 'success');
        await fetchLeetcodeProgress();
        await fetchLeetcodeStats();
      } else {
        const data = await res.json().catch(() => ({}));
        addToast(data.error || 'Failed to start LeetCode sync', 'error');
      }
    } catch (err) {
      addToast('Network error starting LeetCode sync', 'error');
    } finally {
      setSyncingLeetcode(false);
    }
  };

  const handleViewStudentHistory = async (student: any) => {
    setSelectedStudentHistory(student);
    setShowHistoryModal(true);
    try {
      const endpoint = codingPlatformTab === 'GITHUB'
        ? `${API_URL}/api/github/daily-commits/${student.studentId}`
        : `${API_URL}/api/leetcode/progress/student/${student.studentId}`;
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudentHistoryData(data);
      }
    } catch (err) {
      console.error('Error fetching student history details:', err);
    }
  };



  // ── Render View ──
    const isStaff = ['SUPREME_ADMIN', 'HOD', 'CLASS_ADVISOR'].includes(user?.role || '') || (user?.role === 'STUDENT' && user?.is_coordinator);

    if (!isStaff) {
      // Student View
      return (
        <PageLayout>
          <div className="mb-6">
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <Code className="text-orange-500" size={26} /> Coding Progress Tracking
            </h2>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Your Daily & Weekly LeetCode + GitHub Solved Progress</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* LeetCode Daily Card */}
            <Card className="flex flex-col justify-between border-l-4 border-l-orange-500 bg-white">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"><Code size={16} className="text-orange-500" /> LeetCode Daily</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSyncMyLeetcode}
                      disabled={syncingMyLeetcode}
                      className="text-xs flex items-center gap-1 px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      title="Sync today's LeetCode problems"
                    >
                      <RotateCw size={12} className={syncingMyLeetcode ? "animate-spin text-orange-600" : "text-orange-600"} />
                      <span>{syncingMyLeetcode ? 'Syncing...' : 'Sync'}</span>
                    </button>
                    {myLeetcodeProgress?.dailyStatus === 'COMPLETED' ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">MET</span>
                    ) : myLeetcodeProgress?.dailyStatus === 'DATA_UNAVAILABLE' ? (
                      <span className="bg-zinc-100 text-zinc-800 text-[10px] font-bold px-2 py-0.5 rounded-full">NO SYNC</span>
                    ) : (
                      <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full">PENDING</span>
                    )}
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-black text-zinc-900">{myLeetcodeProgress?.solvedToday ?? 0}</span>
                  <span className="text-sm font-bold text-zinc-600 flex items-center gap-1.5">
                    <span className="text-zinc-400 font-bold">/</span>
                    <span className="font-extrabold text-zinc-800">{myLeetcodeProgress?.dailyTarget ?? 0}</span>
                    <span>solved today</span>
                    <span className="text-zinc-400 font-normal text-xs">(Yesterday: {myLeetcodeProgress?.solvedYesterday ?? 0})</span>
                  </span>
                </div>
              </div>
              <div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 mb-2 overflow-hidden border border-zinc-200/60 dark:border-zinc-700/80">
                  <div
                    className="bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(251,146,60,0.5)]"
                    style={{ width: `${Math.min(100, myLeetcodeProgress?.completionDailyPct ?? 0)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500 font-bold">
                  <span>{myLeetcodeProgress?.completionDailyPct ?? 0}% completed today</span>
                  {myLeetcodeProgress?.leetcodeUrl && (
                    <a href={myLeetcodeProgress.leetcodeUrl.startsWith('http') ? myLeetcodeProgress.leetcodeUrl : `https://leetcode.com/u/${myLeetcodeProgress.leetcodeUrl}/`} target="_blank" rel="noreferrer" className="text-orange-600 font-bold hover:underline flex items-center gap-1">
                      Profile <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            </Card>

            {/* GitHub Daily Card */}
            <Card className="flex flex-col justify-between border-l-4 border-l-zinc-900 bg-white">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"><Github size={16} className="text-zinc-900" /> GitHub Daily Commits</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSyncMyGithub}
                      disabled={syncingMyGithub}
                      className="text-xs flex items-center gap-1 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      title="Sync today's GitHub commits"
                    >
                      <RotateCw size={12} className={syncingMyGithub ? "animate-spin text-zinc-900" : "text-zinc-600"} />
                      <span>{syncingMyGithub ? 'Syncing...' : 'Sync'}</span>
                    </button>
                    {myGithubProgress?.commitsToday > 0 ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">ACTIVE</span>
                    ) : (
                      <span className="bg-zinc-100 text-zinc-600 text-[10px] font-bold px-2 py-0.5 rounded-full">NO COMMITS</span>
                    )}
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-black text-zinc-900">{myGithubProgress?.commitsToday ?? 0}</span>
                  <span className="text-zinc-500 font-bold">commits pushed today</span>
                </div>
              </div>
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 font-semibold">
                <span>Total this week: <strong className="text-zinc-900 font-bold">{myGithubProgress?.commitsThisWeek ?? 0}</strong> commits</span>
                {myGithubProgress?.githubUrl ? (
                  <a
                    href={myGithubProgress.githubUrl.startsWith('http') ? myGithubProgress.githubUrl : `https://github.com/${myGithubProgress.githubUrl.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                  >
                    Profile <ExternalLink size={11} />
                  </a>
                ) : (
                  <span className="text-zinc-400 text-[11px] italic">Profile not set</span>
                )}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white">
              <h3 className="text-md font-black text-zinc-900 mb-4 flex items-center gap-1.5">
                <Activity size={18} className="text-orange-500" /> LeetCode Solved History (Last 30 Days)
              </h3>
              <div className="h-44 flex items-end justify-center">
                {myLeetcodeProgress?.studentId ? (
                  <HistoryChartWrapper studentId={myLeetcodeProgress.studentId} type="daily" token={token} />
                ) : (
                  <div className="text-zinc-400 font-bold text-xs py-10">Loading chart...</div>
                )}
              </div>
            </Card>

            <Card className="bg-white">
              <h3 className="text-md font-black text-zinc-900 mb-4 flex items-center gap-1.5">
                <Activity size={18} className="text-indigo-500" /> LeetCode Weekly History
              </h3>
              <div className="h-44 flex items-end justify-center">
                {myLeetcodeProgress?.studentId ? (
                  <HistoryChartWrapper studentId={myLeetcodeProgress.studentId} type="weekly" token={token} />
                ) : (
                  <div className="text-zinc-400 font-bold text-xs py-10">Loading chart...</div>
                )}
              </div>
            </Card>
          </div>
        </PageLayout>
      );
    }

    // Staff View — Separate Dedicated Views for LeetCode Tracker & GitHub Tracker
    return (
      <PageLayout>
        {/* Platform Selection Tabs & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 mb-6 pb-2 md:pb-0">
          <div className="flex items-center gap-2 overflow-x-auto -mb-px">
            <button
              type="button"
              onClick={() => setCodingPlatformTab('LEETCODE')}
              className={cn(
                "flex items-center gap-2 px-5 py-3 border-b-2 font-black text-sm transition-all cursor-pointer",
                codingPlatformTab === 'LEETCODE' || codingPlatformTab === 'COMBINED'
                  ? "border-orange-600 text-orange-600 bg-orange-50/50 rounded-t-xl"
                  : "border-transparent text-zinc-500 hover:text-zinc-900"
              )}
            >
              <Code size={18} className="text-orange-500" />
              <span>LeetCode Tracker</span>
              <span className="ml-1 bg-orange-100 text-orange-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {filteredLeetcodeProgressList.length} Students
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCodingPlatformTab('GITHUB')}
              className={cn(
                "flex items-center gap-2 px-5 py-3 border-b-2 font-black text-sm transition-all cursor-pointer",
                codingPlatformTab === 'GITHUB'
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl"
                  : "border-transparent text-zinc-500 hover:text-zinc-900"
              )}
            >
              <Github size={18} className="text-indigo-600" />
              <span>GitHub Tracker</span>
              <span className="ml-1 bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {filteredGithubProgressList.length} Students
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 -mt-1 md:-mt-2 pb-1.5 md:pb-1">
            {codingPlatformTab === 'LEETCODE' && (
              <>
                <Button
                  onClick={handleSyncProgress}
                  disabled={syncingLeetcode}
                  variant="outline"
                  className="border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold px-3 py-1.5 text-xs rounded-xl flex items-center gap-1.5 bg-white cursor-pointer"
                >
                  {syncingLeetcode ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                  <span>Sync LeetCode</span>
                </Button>

                <Button
                  onClick={() => {
                    setAssignTargetForm(prev => ({
                      ...prev,
                      targetValue: classes[0]?.id || ''
                    }));
                    setShowAssignTargetModal(true);
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1.5 text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus size={14} /> LeetCode Target
                </Button>
              </>
            )}

            {codingPlatformTab === 'GITHUB' && (
              <Button
                onClick={handleSyncGithubProgress}
                disabled={syncingGithub}
                variant="outline"
                className="border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold px-3 py-1.5 text-xs rounded-xl flex items-center gap-1.5 bg-white cursor-pointer"
              >
                {syncingGithub ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                <span>Sync GitHub</span>
              </Button>
            )}
          </div>
        </div>

        {/* ─── LEETCODE TRACKER VIEW ─── */}
        {(codingPlatformTab === 'LEETCODE' || codingPlatformTab === 'COMBINED') && (
          <div>
            {/* LeetCode Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard title="Total Students" value={filteredLeetcodeProgressList.length} color="orange" icon={<Zap />} />
              <StatCard title={leetcodeViewType === 'DAILY' ? "Target Met Today" : "Target Met This Week"} value={leetcodeDynamicStats.met} color="emerald" icon={<Target />} />
              <StatCard title={leetcodeViewType === 'DAILY' ? "In Progress Today" : "In Progress This Week"} value={leetcodeDynamicStats.inProgress} color="amber" icon={<Hourglass />} />
              <StatCard title="Completion Rate" value={`${leetcodeDynamicStats.rate}%`} color="indigo" icon={<TrendingUp />} />
            </div>

            {/* Row 1: Sub-navigation Tabs & View Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              {/* Sub-tab: Monitor vs Targets */}
              <div className="flex bg-zinc-100/80 rounded-xl p-1 border border-zinc-200/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setLeetcodeActiveTab('MONITOR')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    leetcodeActiveTab === 'MONITOR' ? "bg-white shadow-xs text-orange-600 font-extrabold" : "text-zinc-500 hover:text-zinc-900"
                  )}
                >
                  Live Progress Monitor
                </button>
                <button
                  type="button"
                  onClick={() => setLeetcodeActiveTab('TARGETS')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    leetcodeActiveTab === 'TARGETS' ? "bg-white shadow-xs text-orange-600 font-extrabold" : "text-zinc-500 hover:text-zinc-900"
                  )}
                >
                  Target Configurations ({leetcodeTargets.length})
                </button>
              </div>

              {/* View type & Date selection */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex bg-zinc-100/80 rounded-xl p-1 border border-zinc-200/80 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setLeetcodeViewType('DAILY')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      leetcodeViewType === 'DAILY' ? "bg-white shadow-xs text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
                    )}
                  >
                    Daily View
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeetcodeViewType('WEEKLY')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      leetcodeViewType === 'WEEKLY' ? "bg-white shadow-xs text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
                    )}
                  >
                    Weekly View
                  </button>
                </div>

                <div className="flex items-center gap-1.5 border border-zinc-200/80 rounded-xl px-3 py-1.5 bg-white shadow-2xs">
                  <Calendar size={14} className="text-zinc-400" />
                  <input
                    type="date"
                    value={leetcodeDate}
                    onChange={(e) => setLeetcodeDate(e.target.value)}
                    className="text-xs font-bold text-zinc-700 bg-transparent border-none outline-none p-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Unified Filter & Search Toolbar */}
            <div className="bg-white p-3 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Department Filter */}
                {isAdmin && (
                  <div className="flex items-center gap-1.5 border border-zinc-200 rounded-xl px-3 py-1.5 bg-zinc-50/50">
                    <Building2 size={14} className="text-zinc-400" />
                    <select
                      value={selectedLeetcodeDeptId}
                      onChange={(e) => {
                        setSelectedLeetcodeDeptId(e.target.value);
                        setSelectedLeetcodeYear('ALL');
                        setSelectedLeetcodeClassId('ALL');
                      }}
                      className="text-xs font-bold text-zinc-700 bg-transparent border-none outline-none p-0 pr-6 cursor-pointer"
                    >
                      <option value="ALL">All Departments</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id.toString()}>{d.name} ({d.code})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Year Filter */}
                {(isAdmin || isHOD) && (
                  <div className="flex items-center gap-1.5 border border-zinc-200 rounded-xl px-3 py-1.5 bg-zinc-50/50">
                    <Filter size={14} className="text-zinc-400" />
                    <select
                      value={selectedLeetcodeYear}
                      onChange={(e) => {
                        setSelectedLeetcodeYear(e.target.value);
                        setSelectedLeetcodeClassId('ALL');
                      }}
                      className="text-xs font-bold text-zinc-700 bg-transparent border-none outline-none p-0 pr-6 cursor-pointer"
                    >
                      <option value="ALL">All Years</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                )}

                {/* Section / Class Filter */}
                {(isAdmin || isHOD) && (
                  <div className="flex items-center gap-1.5 border border-zinc-200 rounded-xl px-3 py-1.5 bg-zinc-50/50">
                    <Filter size={14} className="text-zinc-400" />
                    <select
                      value={selectedLeetcodeClassId}
                      onChange={(e) => setSelectedLeetcodeClassId(e.target.value)}
                      className="text-xs font-bold text-zinc-700 bg-transparent border-none outline-none p-0 pr-6 cursor-pointer"
                    >
                      <option value="ALL">All Sections</option>
                      {classes
                        .filter(c => {
                          if (selectedLeetcodeDeptId && selectedLeetcodeDeptId !== 'ALL' && c.department_id?.toString() !== selectedLeetcodeDeptId) return false;
                          if (selectedLeetcodeYear && selectedLeetcodeYear !== 'ALL' && String(c.year) !== selectedLeetcodeYear) return false;
                          if (isAdmin) return true;
                          if (isHOD) return c.department_id?.toString() === user?.department_id?.toString();
                          if (isAdvisor || (user?.role === 'STUDENT' && user?.is_coordinator)) return String(c.id) === String(user?.class_id);
                          return c.department_id?.toString() === user?.department_id?.toString();
                        })
                        .sort((a, b) => (a.year || 0) - (b.year || 0) || (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' }))
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 border border-zinc-200 rounded-xl px-3 py-1.5 bg-zinc-50/50">
                  <Filter size={14} className="text-zinc-400" />
                  <select
                    value={leetcodeStatusFilter}
                    onChange={(e) => setLeetcodeStatusFilter(e.target.value)}
                    className="text-xs font-bold text-zinc-700 bg-transparent border-none outline-none p-0 pr-6 cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="INCOMPLETE">Incomplete</option>
                    <option value="DATA_UNAVAILABLE">No Sync Data</option>
                  </select>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative flex-1 md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
                <input
                  type="text"
                  placeholder="Search candidate by name or register number..."
                  value={leetcodeSearch}
                  onChange={(e) => setLeetcodeSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 bg-zinc-50/50 focus:bg-white focus:outline-hidden transition-all"
                />
                {leetcodeSearch && (
                  <button
                    onClick={() => setLeetcodeSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-0.5 rounded-full"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* LeetCode Live Progress Monitor Table */}
            {leetcodeActiveTab === 'MONITOR' ? (
              <Card className="p-0 overflow-hidden border border-zinc-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        <th onClick={() => handleSortHeader('registerNumber')} className="px-6 py-4 cursor-pointer select-none">
                          REGISTER NO {leetcodeSortColumn === 'registerNumber' ? (leetcodeSortOrder === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th onClick={() => handleSortHeader('fullName')} className="px-6 py-4 cursor-pointer select-none">
                          STUDENT NAME {leetcodeSortColumn === 'fullName' ? (leetcodeSortOrder === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th onClick={() => handleSortHeader('className')} className="px-6 py-4 cursor-pointer select-none">
                          SECTION /CLASS {leetcodeSortColumn === 'className' ? (leetcodeSortOrder === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="px-6 py-4">LEETCODE PROFILE</th>
                        <th className="px-6 py-4 text-center">
                          {leetcodeViewType === 'DAILY' ? 'TODAY' : 'THIS WEEK'}
                        </th>
                        {leetcodeViewType === 'DAILY' && (
                          <th className="px-6 py-4 text-center">YESTERDAY</th>
                        )}
                        <th onClick={() => handleSortHeader('status')} className="px-6 py-4 text-center cursor-pointer select-none">
                          TARGET (completed / Incomplete) {leetcodeSortColumn === 'status' ? (leetcodeSortOrder === 'asc' ? '↑' : '↓') : ''}
                        </th>

                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 text-sm">
                      {sortedLeetcodeProgressList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-zinc-400 font-semibold">
                            No LeetCode student records match the selected filters.
                          </td>
                        </tr>
                      ) : (
                        sortedLeetcodeProgressList.map((row) => {
                          const isDaily = leetcodeViewType === 'DAILY';
                          const solved = isDaily ? (row.solvedToday ?? 0) : (row.solvedThisWeek ?? 0);
                          const target = isDaily ? (row.dailyTarget ?? 0) : (row.weeklyTarget ?? 0);
                          const status = (isDaily ? row.dailyStatus : row.weeklyStatus) || 'PENDING';
                          const profileUrl = row.leetcodeUrl
                            ? (row.leetcodeUrl.startsWith('http') ? row.leetcodeUrl : `https://leetcode.com/u/${row.leetcodeUrl}/`)
                            : (row.leetcodeUsername
                              ? (row.leetcodeUsername.startsWith('http') ? row.leetcodeUsername : `https://leetcode.com/u/${row.leetcodeUsername}/`)
                              : null);

                          const displayStatus = status === 'COMPLETED' ? 'COMPLETED' :
                            status === 'NO_TARGET' ? 'NO TARGET' : 'INCOMPLETE';

                          return (
                            <tr key={row.studentId} className="hover:bg-zinc-50 transition-colors">
                              <td className="px-6 py-4 font-mono text-xs font-bold text-zinc-500">{row.registerNumber}</td>
                              <td className="px-6 py-4 font-bold text-zinc-900">
                                <button
                                  type="button"
                                  onClick={() => handleViewStudentHistory(row)}
                                  className="hover:underline hover:text-indigo-600 text-left cursor-pointer"
                                >
                                  {row.fullName}
                                </button>
                              </td>
                              <td className="px-6 py-4 font-semibold text-zinc-600">{row.className}</td>
                              <td className="px-6 py-4">
                                {profileUrl ? (
                                  <a
                                    href={profileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
                                  >
                                    <Code size={13} /> {row.leetcodeUsername || 'LeetCode Profile'} <ExternalLink size={11} />
                                  </a>
                                ) : (
                                  <span className="text-xs text-zinc-400 font-medium">Not Linked</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center font-semibold">
                                <span className="inline-flex items-center justify-center gap-1.5 font-mono">
                                  <span className="text-zinc-900 font-black text-sm">{solved}</span>
                                  <span className="text-zinc-400 font-black text-sm select-none">/</span>
                                  <span className="text-zinc-600 font-bold text-xs">{target}</span>
                                </span>
                              </td>
                              {isDaily && (
                                <td className="px-6 py-4 text-center font-semibold text-zinc-600">
                                  {row.solvedYesterday ?? 0}
                                </td>
                              )}
                              <td className="px-6 py-4 text-center">
                                <span className={cn(
                                  "inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full",
                                  displayStatus === 'COMPLETED' ? "bg-emerald-100 text-emerald-800" :
                                    displayStatus === 'NO TARGET' ? "bg-zinc-50 text-zinc-400" : "bg-orange-100 text-orange-800"
                                )}>
                                  {displayStatus}
                                </span>
                              </td>

                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <Card className="p-0 overflow-hidden border border-zinc-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        <th className="px-6 py-4">Scope</th>
                        <th className="px-6 py-4">Target Audience / Value</th>
                        <th className="px-6 py-4 text-center">Daily Target</th>
                        <th className="px-6 py-4 text-center">Weekly Target</th>
                        <th className="px-6 py-4">Duration</th>
                        <th className="px-6 py-4">Created By</th>
                        {(isHOD || isAdmin) && <th className="px-6 py-4 text-center">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 text-sm">
                      {leetcodeTargets.length === 0 ? (
                        <tr>
                          <td colSpan={(isHOD || isAdmin) ? 7 : 6} className="px-6 py-12 text-center text-zinc-400 font-semibold">
                            No active LeetCode target configurations found. Click "LeetCode Target" to add one.
                          </td>
                        </tr>
                      ) : (
                        leetcodeTargets.map((target) => (
                          <tr key={target.id} className="hover:bg-zinc-50">
                            <td className="px-6 py-4 font-bold text-zinc-800">{target.scope_type || 'CLASS'}</td>
                            <td className="px-6 py-4 font-semibold text-zinc-900">{target.target_value_name || target.class_name || 'All Students'}</td>
                            <td className="px-6 py-4 text-center font-bold text-orange-600">{target.daily_target} / day</td>
                            <td className="px-6 py-4 text-center font-bold text-indigo-600">{target.weekly_target} / week</td>
                            <td className="px-6 py-4 text-xs font-medium text-zinc-500">{target.start_date} to {target.end_date}</td>
                            <td className="px-6 py-4 text-xs text-zinc-600">{target.creator_name || 'Staff'}</td>
                            {(isHOD || isAdmin) && (
                              <td className="px-6 py-4 text-center">
                                <button type="button" onClick={() => handleDeleteLeetcodeTarget(target.id)} className="text-zinc-400 hover:text-red-600 p-1" title="Delete Target">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ─── GITHUB TRACKER VIEW ─── */}
        {codingPlatformTab === 'GITHUB' && (
          <div>
            {/* GitHub Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard title="Total Students" value={filteredGithubProgressList.length} color="purple" icon={<Zap />} />
              <StatCard title={leetcodeViewType === 'DAILY' ? "Active Committers Today" : "Active Committers This Week"} value={githubDynamicStats.activeCommitters} color="emerald" icon={<Terminal />} />

              {/* Top 3 Leaderboard Card */}
              <Card className="p-4 border border-zinc-200 bg-white shadow-xs sm:col-span-2 lg:col-span-2 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Trophy size={16} className="text-amber-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      GitHub Top 3 Leaderboard ({leetcodeViewType === 'DAILY' ? 'Today' : 'This Week'})
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Champions
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 flex-1 items-center">
                  {githubTop3.length === 0 ? (
                    <div className="col-span-3 text-center py-2 text-zinc-400 text-xs font-semibold">
                      No commits recorded {leetcodeViewType === 'DAILY' ? 'today' : 'this week'} yet.
                    </div>
                  ) : (
                    [0, 1, 2].map((index) => {
                      const item = githubTop3[index];
                      if (!item) {
                        return (
                          <div key={index} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 justify-center">
                            <span className="text-[10px] font-bold text-zinc-300">#{index + 1} Empty</span>
                          </div>
                        );
                      }

                      const commits = leetcodeViewType === 'DAILY' ? (item.commitsToday ?? 0) : (item.commitsThisWeek ?? 0);
                      const rankColors = index === 0 ? "bg-amber-100 text-amber-800 border-amber-200" :
                        index === 1 ? "bg-slate-100 text-slate-700 border-slate-200" :
                          "bg-orange-100 text-orange-800 border-orange-200";

                      const rankEmoji = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";

                      return (
                        <div key={item.studentId || index} className="flex items-center gap-2 p-2 rounded-xl border border-zinc-100 bg-zinc-50/80 shadow-2xs hover:bg-zinc-50 transition-colors">
                          <span className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border",
                            rankColors
                          )}>
                            {rankEmoji}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-zinc-800 truncate" title={item.fullName}>
                              {item.fullName}
                            </p>
                            <p className="text-[10px] font-bold text-indigo-600">
                              {commits} {commits === 1 ? 'commit' : 'commits'}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>

            {/* Row 1: View Controls & Date */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200">
                  {leetcodeViewType === 'WEEKLY' ? 'Weekly Commit Tracker' : 'Daily Commit Tracker'}
                </span>
              </div>

              {/* View type & Date selection */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex bg-zinc-100/80 rounded-xl p-1 border border-zinc-200/80 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setLeetcodeViewType('DAILY')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      leetcodeViewType === 'DAILY' ? "bg-white shadow-xs text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
                    )}
                  >
                    Daily View
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeetcodeViewType('WEEKLY')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      leetcodeViewType === 'WEEKLY' ? "bg-white shadow-xs text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
                    )}
                  >
                    Weekly View
                  </button>
                </div>

                <div className="flex items-center gap-1.5 border border-zinc-200/80 rounded-xl px-3 py-1.5 bg-white shadow-2xs">
                  <Calendar size={14} className="text-zinc-400" />
                  <input
                    type="date"
                    value={leetcodeDate}
                    onChange={(e) => setLeetcodeDate(e.target.value)}
                    className="text-xs font-bold text-zinc-700 bg-transparent border-none outline-none p-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Unified Filter & Search Toolbar */}
            <div className="bg-white p-3 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Department Filter */}
                {isAdmin && (
                  <div className="flex items-center gap-1.5 border border-zinc-200 rounded-xl px-3 py-1.5 bg-zinc-50/50">
                    <Building2 size={14} className="text-zinc-400" />
                    <select
                      value={selectedLeetcodeDeptId}
                      onChange={(e) => {
                        setSelectedLeetcodeDeptId(e.target.value);
                        setSelectedLeetcodeYear('ALL');
                        setSelectedLeetcodeClassId('ALL');
                      }}
                      className="text-xs font-bold text-zinc-700 bg-transparent border-none outline-none p-0 pr-6 cursor-pointer"
                    >
                      <option value="ALL">All Departments</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id.toString()}>{d.name} ({d.code})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Year Filter */}
                {(isAdmin || isHOD) && (
                  <div className="flex items-center gap-1.5 border border-zinc-200 rounded-xl px-3 py-1.5 bg-zinc-50/50">
                    <Filter size={14} className="text-zinc-400" />
                    <select
                      value={selectedLeetcodeYear}
                      onChange={(e) => {
                        setSelectedLeetcodeYear(e.target.value);
                        setSelectedLeetcodeClassId('ALL');
                      }}
                      className="text-xs font-bold text-zinc-700 bg-transparent border-none outline-none p-0 pr-6 cursor-pointer"
                    >
                      <option value="ALL">All Years</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                )}

                {/* Section / Class Filter */}
                {(isAdmin || isHOD) && (
                  <div className="flex items-center gap-1.5 border border-zinc-200 rounded-xl px-3 py-1.5 bg-zinc-50/50">
                    <Filter size={14} className="text-zinc-400" />
                    <select
                      value={selectedLeetcodeClassId}
                      onChange={(e) => setSelectedLeetcodeClassId(e.target.value)}
                      className="text-xs font-bold text-zinc-700 bg-transparent border-none outline-none p-0 pr-6 cursor-pointer"
                    >
                      <option value="ALL">All Sections</option>
                      {classes
                        .filter(c => {
                          if (selectedLeetcodeDeptId && selectedLeetcodeDeptId !== 'ALL' && c.department_id?.toString() !== selectedLeetcodeDeptId) return false;
                          if (selectedLeetcodeYear && selectedLeetcodeYear !== 'ALL' && String(c.year) !== selectedLeetcodeYear) return false;
                          if (isAdmin) return true;
                          if (isHOD) return c.department_id?.toString() === user?.department_id?.toString();
                          if (isAdvisor || (user?.role === 'STUDENT' && user?.is_coordinator)) return String(c.id) === String(user?.class_id);
                          return c.department_id?.toString() === user?.department_id?.toString();
                        })
                        .sort((a, b) => (a.year || 0) - (b.year || 0) || (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' }))
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Search Box */}
              <div className="relative flex-1 md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
                <input
                  type="text"
                  placeholder="Search candidate by name or register number..."
                  value={leetcodeSearch}
                  onChange={(e) => setLeetcodeSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 bg-zinc-50/50 focus:bg-white focus:outline-hidden transition-all"
                />
                {leetcodeSearch && (
                  <button
                    onClick={() => setLeetcodeSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-0.5 rounded-full"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* GitHub Live Progress Monitor Table */}
            <Card className="p-0 overflow-hidden border border-zinc-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      <th onClick={() => handleSortHeader('registerNumber')} className="px-6 py-4 cursor-pointer select-none">
                        REGISTER NO {leetcodeSortColumn === 'registerNumber' ? (leetcodeSortOrder === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th onClick={() => handleSortHeader('fullName')} className="px-6 py-4 cursor-pointer select-none">
                        STUDENT NAME {leetcodeSortColumn === 'fullName' ? (leetcodeSortOrder === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th onClick={() => handleSortHeader('className')} className="px-6 py-4 cursor-pointer select-none">
                        SECTION/CLASS {leetcodeSortColumn === 'className' ? (leetcodeSortOrder === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th className="px-6 py-4">GITHUB PROFILE</th>
                      {leetcodeViewType === 'DAILY' ? (
                        <th onClick={() => handleSortHeader('commitsToday')} className="px-6 py-4 text-center cursor-pointer select-none">
                          COMMITS TODAY {leetcodeSortColumn === 'commitsToday' ? (leetcodeSortOrder === 'asc' ? '↑' : '↓') : ''}
                        </th>
                      ) : (
                        <th onClick={() => handleSortHeader('commitsThisWeek')} className="px-6 py-4 text-center cursor-pointer select-none">
                          COMMITS THIS WEEK {leetcodeSortColumn === 'commitsThisWeek' ? (leetcodeSortOrder === 'asc' ? '↑' : '↓') : ''}
                        </th>
                      )}
                      <th onClick={() => handleSortHeader('syncStatus')} className="px-6 py-4 text-center cursor-pointer select-none">
                        SYNC STATUS {leetcodeSortColumn === 'syncStatus' ? (leetcodeSortOrder === 'asc' ? '↑' : '↓') : ''}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-sm">
                    {sortedGithubProgressList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 font-semibold">
                          No GitHub student records match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      sortedGithubProgressList.map((row) => {
                        const commitsToday = row.commitsToday ?? row.dailyCommitCount ?? 0;
                        const commitsThisWeek = row.commitsThisWeek ?? 0;
                        const profileUrl = row.githubUsername
                          ? (row.githubUsername.startsWith('http') ? row.githubUsername : `https://github.com/${row.githubUsername}`)
                          : (row.githubUrl || null);

                        return (
                          <tr key={row.studentId} className="hover:bg-zinc-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs font-bold text-zinc-500">{row.registerNumber}</td>
                            <td className="px-6 py-4 font-bold text-zinc-900">
                              <button
                                type="button"
                                onClick={() => handleViewStudentHistory(row)}
                                className="hover:underline hover:text-indigo-600 text-left cursor-pointer"
                              >
                                {row.fullName}
                              </button>
                            </td>
                            <td className="px-6 py-4 font-semibold text-zinc-600">{row.className}</td>
                            <td className="px-6 py-4">
                              {profileUrl ? (
                                <a
                                  href={profileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                                >
                                  <Github size={13} /> {row.githubUsername || 'GitHub Profile'} <ExternalLink size={11} />
                                </a>
                              ) : (
                                <span className="text-xs text-zinc-400 font-medium">Not Linked</span>
                              )}
                            </td>
                            {leetcodeViewType === 'DAILY' ? (
                              <td className="px-6 py-4 text-center">
                                <span className={cn(
                                  "font-bold text-sm",
                                  commitsToday > 0 ? "text-emerald-600 font-extrabold" : "text-zinc-400"
                                )}>
                                  {commitsToday}
                                </span>
                              </td>
                            ) : (
                              <td className="px-6 py-4 text-center font-bold text-zinc-800">
                                {commitsThisWeek}
                              </td>
                            )}
                            <td className="px-6 py-4 text-center">
                              <span className={cn(
                                "inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full",
                                row.syncStatus === 'SUCCESS' ? "bg-emerald-100 text-emerald-800" :
                                  row.syncStatus === 'NO_PROFILE' ? "bg-zinc-100 text-zinc-600" : "bg-amber-100 text-amber-800"
                              )}>
                                {row.syncStatus === 'SUCCESS' ? 'SYNCED' : row.syncStatus === 'NO_PROFILE' ? 'NO HANDLE' : 'PENDING'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </PageLayout>
    );
}

export default CodingProgressView;
