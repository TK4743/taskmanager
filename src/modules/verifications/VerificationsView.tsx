import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Search, Filter, CheckCircle2, XCircle, Clock, Eye, Download,
  Camera, FileText, Loader2, Check, X, AlertTriangle, Users,
  CheckCheck, ArrowRight, ExternalLink, ImageIcon, ShieldCheck,
  ChevronLeft, ChevronRight, CheckSquare, Copy, Trash2
} from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table';
import { getCloudinaryThumbnail } from '../../components/common/helpers';
import { API_URL } from '../../config';
import { cn } from '../../lib/utils';
import type { Submission, Task, Class, Department, User, ToastType, TeamSubmission } from '../../types';
import {
  downloadScreenshotsZip as utilDownloadZip,
  downloadScreenshotsPdf as utilDownloadPdf,
  type ExportContext
} from '../../utils/exportUtils';

export interface VerificationsViewProps {
  submissions: Submission[];
  teamSubmissions?: TeamSubmission[];
  tasks: Task[];
  classes: Class[];
  departments: Department[];
  users: User[];
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  isHOD: boolean;
  isAdvisor: boolean;
  isCoordinator: boolean;
  isFaculty?: boolean;
  screenshotDownloadProgress?: any;
  downloadScreenshotsZip?: (taskId?: any, submissionsList?: any) => Promise<void>;
  downloadScreenshotsPdf?: (taskId?: any, submissionsList?: any) => Promise<void>;
  verifySubmission: (id: string | number, status: string, feedback?: string, reason?: string) => Promise<any> | void;
  onInspectSubmission?: (sub: Submission) => void;
  onOpenRejectionModal?: (subId: string | number) => void;
  onOpenReviewsModal?: (sub: Submission) => void;
  onOpenTeamReviewModal?: (sub: any) => void;
  onRefresh?: () => void;
  addToast?: (msg: string, type?: ToastType) => void;
}

export function VerificationsView({
  submissions,
  teamSubmissions = [],
  tasks,
  classes,
  departments,
  users,
  user,
  token,
  isAdmin,
  isHOD,
  isAdvisor,
  isCoordinator,
  isFaculty = false,
  screenshotDownloadProgress = null,
  downloadScreenshotsZip,
  downloadScreenshotsPdf,
  verifySubmission,
  onInspectSubmission,
  onOpenRejectionModal,
  onOpenReviewsModal,
  onOpenTeamReviewModal,
  onRefresh = () => {},
  addToast = () => {},
}: VerificationsViewProps) {
  const [internalDownloadProgress, setInternalDownloadProgress] = useState<any>(null);
  const activeProgress = screenshotDownloadProgress || internalDownloadProgress;

  const handleDownloadZip = async (taskId?: any, submissionsList?: any) => {
    if (downloadScreenshotsZip) {
      await downloadScreenshotsZip(taskId, submissionsList);
      return;
    }
    const ctx: ExportContext = {
      user,
      departments,
      classes,
      tasks,
      users,
      submissions,
      token,
      addToast,
      setScreenshotDownloadProgress: setInternalDownloadProgress
    };
    await utilDownloadZip(ctx, taskId ? { taskId } : undefined, submissionsList);
  };

  const handleDownloadPdf = async (taskId?: any, submissionsList?: any) => {
    if (downloadScreenshotsPdf) {
      await downloadScreenshotsPdf(taskId, submissionsList);
      return;
    }
    const ctx: ExportContext = {
      user,
      departments,
      classes,
      tasks,
      users,
      submissions,
      token,
      addToast,
      setScreenshotDownloadProgress: setInternalDownloadProgress
    };
    await utilDownloadPdf(ctx, taskId ? { taskId } : undefined, submissionsList);
  };

  // Verification Filter States
  const [verificationFilter, setVerificationFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NOT INTERESTED'>('PENDING');
  const [verificationTaskFilter, setVerificationTaskFilter] = useState('');
  const [verificationDeptFilter, setVerificationDeptFilter] = useState('');
  const [verificationClassFilter, setVerificationClassFilter] = useState('');
  const [verificationYearFilter, setVerificationYearFilter] = useState('');
  const [submissionSearchTerm, setSubmissionSearchTerm] = useState('');
  const [submissionPage, setSubmissionPage] = useState(1);
  const [selectedSubmissions, setSelectedSubmissions] = useState<(string | number)[]>([]);
  const [verificationNote, setVerificationNote] = useState('');
  const [isBatchVerifying, setIsBatchVerifying] = useState(false);

  // Automatically reset page when any filter criteria changes
  useEffect(() => {
    setSubmissionPage(1);
  }, [verificationFilter, verificationTaskFilter, verificationDeptFilter, verificationClassFilter, verificationYearFilter, submissionSearchTerm]);

  const fetchInitialData = () => {
    onRefresh();
  };

  const fetchReviews = async (subId: number | string) => {
    try {
      const res = await fetch(`${API_URL}/api/submissions/${subId}/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (onOpenReviewsModal) {
          const sub = submissions.find(s => String(s.id) === String(subId));
          if (sub) onOpenReviewsModal(sub);
        }
      }
    } catch {}
  };


  const itemsPerPage = 15;

  const getPaginationRange = (current: number, total: number) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

    const getFilteredVerificationSubmissions = () => {
    return submissions.filter(s => {
      // 1. Filter by Status
      if (verificationFilter === 'ALL') {
        // include all
      } else if (verificationFilter === 'PENDING') {
        if (s.status !== 'SUBMITTED') return false;
      } else if (verificationFilter === 'NOT INTERESTED') {
        if (s.status !== 'NOT_PARTICIPATING') return false;
      } else {
        if (s.status !== verificationFilter) return false;
      }

      // 2. Filter by Task
      if (verificationTaskFilter && String(s.task_id) !== verificationTaskFilter) {
        return false;
      }

      // 3. Role / Scope filter
      const subClassId = s.class_id ? String(s.class_id) : '';
      const subDeptId = s.department_id ? String(s.department_id) : '';
      const resolvedUserClassId = user?.class_id
        ? String(user.class_id)
        : classes.find(cls => cls.advisor_id === user?.id)?.id
        ? String(classes.find(cls => cls.advisor_id === user?.id)?.id)
        : '';
      const userDeptId = user?.department_id ? String(user?.department_id) : '';

      if (isAdvisor || isCoordinator) {
        if (resolvedUserClassId && subClassId && subClassId !== resolvedUserClassId) return false;
      } else if (isHOD || isFaculty) {
        if (userDeptId && subDeptId && subDeptId !== userDeptId) return false;
      }

      // 4. Department filter
      if (verificationDeptFilter) {
        const subDeptId = s.department_id ? String(s.department_id) : '';
        if (subDeptId) {
          if (subDeptId !== verificationDeptFilter) return false;
        } else if (subClassId) {
          const c = classes.find(cls => String(cls.id) === subClassId);
          if (c && String(c.department_id) !== verificationDeptFilter) return false;
        }
      }

      // 5. Class filter
      if (verificationClassFilter) {
        if (subClassId && subClassId !== verificationClassFilter) return false;
      }

      // 6. Year filter
      if (verificationYearFilter) {
        const subYear = s.class_year !== undefined && s.class_year !== null ? String(s.class_year) : '';
        if (subYear) {
          if (subYear !== verificationYearFilter) return false;
        } else if (subClassId) {
          const c = classes.find(cls => String(cls.id) === subClassId);
          if (c && String(c.year) !== verificationYearFilter) return false;
        }
      }

      // 7. Search query
      if (submissionSearchTerm) {
        const q = submissionSearchTerm.toLowerCase();
        const matchesName = s.student_name?.toLowerCase().includes(q);
        const matchesReg = s.register_number?.toLowerCase().includes(q);
        const matchesTask = s.task_title?.toLowerCase().includes(q);
        const matchesField = s.custom_field_value?.toLowerCase().includes(q);
        const matchesReason = s.not_participating_reason?.toLowerCase().includes(q);
        if (!matchesName && !matchesReg && !matchesTask && !matchesField && !matchesReason) return false;
      }

      return true;
    });
  };


  const handleBatchVerify = async () => {
    if (selectedSubmissions.length === 0) return;
    if (!confirm(`Verify ${selectedSubmissions.length} selected submission${selectedSubmissions.length > 1 ? 's' : ''}?`)) return;

    setIsBatchVerifying(true);
    try {
      const res = await fetch(`${API_URL}/api/submissions/batch-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          submission_ids: selectedSubmissions,
          verification_note: verificationNote.trim() || 'Verified in bulk'
        })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(`Successfully verified ${selectedSubmissions.length} submissions!`, 'success');
        setSelectedSubmissions([]);
        setVerificationNote('');
        onRefresh();
      } else {
        addToast(data.error || 'Failed to batch verify submissions', 'error');
      }
    } catch {
      addToast('Network error during bulk verification', 'error');
    } finally {
      setIsBatchVerifying(false);
    }
  };

  const setInspectingSubmission = (sub: Submission | null) => {
    if (sub && onInspectSubmission) {
      onInspectSubmission(sub);
    }
  };

  const setShowRejectionModal = (subId: string | number | null) => {
    if (subId && onOpenRejectionModal) {
      onOpenRejectionModal(subId);
    }
  };

  const handleReviewTeamSubmission = async (subId: string, status: 'APPROVED' | 'REJECTED') => {
    if (onOpenTeamReviewModal) {
      const sub = submissions.find(s => String(s.id) === String(subId));
      onOpenTeamReviewModal({ id: subId, name: sub?.student_name || 'Team', status });
    }
  };

  return (
                <motion.div
                  key="verifications"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full h-full flex flex-col min-h-0"
                >
                  <PageLayout>
                    <div className="flex justify-between items-center flex-wrap gap-2.5 mb-3 sm:mb-4">
                      <div className="flex gap-1.5 overflow-x-auto no-scrollbar max-w-full pb-1 shrink-0">
                        {['PENDING', 'VERIFIED', 'REJECTED', 'NOT INTERESTED', 'ALL'].map(f => (
                          <button
                            key={f}
                            onClick={() => setVerificationFilter(f as any)}
                            className={cn(
                              "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0",
                              verificationFilter === f ? "bg-black text-white dark:bg-white dark:text-black shadow-xs" : "bg-white dark:bg-[#18181c] text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                            )}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const filteredForZip = getFilteredVerificationSubmissions();
                            handleDownloadZip(undefined, filteredForZip);
                          }}
                          disabled={activeProgress !== null}
                          className="flex items-center gap-1.5 text-xs py-2 px-3.5 rounded-full font-bold border-zinc-200 hover:border-zinc-900 transition-colors shadow-2xs"
                        >
                          {activeProgress ? (
                            <>
                              <Loader2 size={13} className="animate-spin text-blue-600" />
                              <span>{activeProgress.percent}%</span>
                            </>
                          ) : (
                            <>
                              <Camera size={14} className="text-zinc-600" />
                              <span>Download Proofs (.ZIP)</span>
                            </>
                          )}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            const filteredForPdf = selectedSubmissions.length > 0
                              ? submissions.filter(s => selectedSubmissions.includes(s.id))
                              : getFilteredVerificationSubmissions();
                            handleDownloadPdf(undefined, filteredForPdf);
                          }}
                          disabled={activeProgress !== null}
                          className="flex items-center gap-1.5 text-xs py-2 px-3.5 rounded-full font-bold border-zinc-200 hover:border-red-600 hover:text-red-700 transition-colors shadow-2xs"
                        >
                          {activeProgress ? (
                            <>
                              <Loader2 size={13} className="animate-spin text-red-600" />
                              <span>{activeProgress.percent}%</span>
                            </>
                          ) : (
                            <>
                              <FileText size={14} className="text-red-600" />
                              <span>Download Proofs (.PDF)</span>
                            </>
                          )}
                        </Button>
                        {(() => {
                          const currentFiltered = getFilteredVerificationSubmissions();
                          const allPending = currentFiltered.filter(s => s.status === 'SUBMITTED' && !(isCoordinator && String(s.user_id) === String(user?.id)));
                          const allPendingIds = allPending.map(s => s.id);
                          const isAllPendingSelected = allPendingIds.length > 0 && allPendingIds.every(id => selectedSubmissions.includes(id));

                          return (
                            <>
                              {allPendingIds.length > 0 && (
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    if (isAllPendingSelected) {
                                      const pendingSet = new Set(allPendingIds);
                                      setSelectedSubmissions(prev => prev.filter(id => !pendingSet.has(id)));
                                    } else {
                                      setSelectedSubmissions(prev => Array.from(new Set([...prev, ...allPendingIds])));
                                    }
                                  }}
                                  className="flex items-center gap-1.5 text-xs py-2 px-3.5 rounded-full font-bold border-zinc-200 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-zinc-100 transition-colors shadow-2xs"
                                >
                                  <CheckSquare size={14} className={isAllPendingSelected ? "text-blue-600 dark:text-blue-400" : "text-zinc-500"} />
                                  <span>
                                    {isAllPendingSelected
                                      ? `Deselect All (${selectedSubmissions.length})`
                                      : `Select All Pending (${allPendingIds.length})`}
                                  </span>
                                </Button>
                              )}
                              {selectedSubmissions.length > 0 && (
                                <Button
                                  variant="success"
                                  onClick={handleBatchVerify}
                                  className="flex items-center gap-1.5 text-xs py-2 px-3.5 rounded-full font-bold shadow-sm"
                                >
                                  <CheckCheck size={14} /> Bulk Verify ({selectedSubmissions.length})
                                </Button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-start">
                      <div className={cn((isHOD || isAdmin) ? "md:col-span-2" : "md:col-span-3", "relative self-start")}>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <Input
                          placeholder="Search submissions by student name or register number..."
                          className="pl-10 h-10 text-sm"
                          value={submissionSearchTerm}
                          onChange={e => { setSubmissionSearchTerm(e.target.value); setSubmissionPage(1); }}
                        />
                      </div>

                      {(isHOD || isAdmin) && (
                        <div className="flex flex-wrap items-center gap-2">
                          {isAdmin && (
                            <Select
                              value={verificationDeptFilter}
                              onChange={e => {
                                setVerificationDeptFilter(e.target.value);
                                setVerificationYearFilter('');
                                setVerificationClassFilter('');
                                setSubmissionPage(1);
                              }}
                            >
                              <option value="">All Departments</option>
                              {departments.map(d => (
                                <option key={d.id} value={d.id.toString()}>{d.name}</option>
                              ))}
                            </Select>
                          )}
                          {(isHOD || isAdmin || isFaculty) && (
                            <Select
                              value={verificationYearFilter}
                              onChange={e => {
                                setVerificationYearFilter(e.target.value);
                                setVerificationClassFilter('');
                                setSubmissionPage(1);
                              }}
                            >
                              <option value="">All Years</option>
                              <option value="1">1st Year</option>
                              <option value="2">2nd Year</option>
                              <option value="3">3rd Year</option>
                              <option value="4">4th Year</option>
                            </Select>
                          )}
                          <Select
                            value={verificationClassFilter}
                            onChange={e => { setVerificationClassFilter(e.target.value); setSubmissionPage(1); }}
                          >
                            <option value="">All Classes / Sections</option>
                            {classes.filter(c => {
                              if (verificationDeptFilter && c.department_id?.toString() !== verificationDeptFilter) return false;
                              if (verificationYearFilter && String(c.year) !== verificationYearFilter) return false;
                              if (isAdmin) return true;
                              if (isHOD || isFaculty) return c.department_id?.toString() === user?.department_id?.toString();
                              if (isAdvisor || (user?.role === 'STUDENT' && user?.is_coordinator)) return String(c.id) === String(user?.class_id);
                              return c.department_id?.toString() === user?.department_id?.toString();
                            }).sort((a, b) => (a.year || 0) - (b.year || 0) || (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' })).map(c => (
                              <option key={c.id} value={c.id.toString()}>{c.name}</option>
                            ))}
                          </Select>
                        </div>
                      )}

                      <div>
                        <Select
                          value={verificationTaskFilter}
                          onChange={e => { setVerificationTaskFilter(e.target.value); setSubmissionPage(1); }}
                        >
                          <option value="">All Tasks</option>
                          {tasks.map(t => (
                            <option key={t.id} value={t.id.toString()}>{t.title}</option>
                          ))}
                        </Select>
                      </div>
                    </div>

                    {/* Faculty & Coordinator Team Submissions Review Section */}
                    {(!verificationTaskFilter || tasks.find(t => t.id.toString() === verificationTaskFilter)?.submission_type === 'TEAM') && (() => {
                      const filteredTeamSubs = teamSubmissions.filter(sub => {
                        // 0. Filter by Task Dropdown
                        if (verificationTaskFilter && sub.task_id?.toString() !== verificationTaskFilter) {
                          return false;
                        }

                        // 1. Filter by Status Tab
                        if (verificationFilter === 'PENDING') {
                          if (sub.status !== 'PENDING') return false;
                        } else if (verificationFilter === 'VERIFIED') {
                          if (sub.status !== 'APPROVED' && sub.status !== 'VERIFIED') return false;
                        } else if (verificationFilter === 'REJECTED') {
                          if (sub.status !== 'REJECTED') return false;
                        } else if (verificationFilter === 'NOT INTERESTED') {
                          return false;
                        }
                        // 'ALL' tab includes all team submissions

                        // 2. Filter by Search Query
                        if (submissionSearchTerm) {
                          const q = submissionSearchTerm.toLowerCase();
                          const matchesTeamName = sub.team_name?.toLowerCase().includes(q);
                          const matchesLeader = sub.leader_name?.toLowerCase().includes(q) || sub.leader_regno?.toLowerCase().includes(q);
                          const matchesMember = sub.members?.some(m => (m.full_name || m.username)?.toLowerCase().includes(q) || m.register_number?.toLowerCase().includes(q));
                          const matchesTaskTitle = sub.task_title?.toLowerCase().includes(q);
                          if (!matchesTeamName && !matchesLeader && !matchesMember && !matchesTaskTitle) return false;
                        }

                        // 3. Filter by Class
                        if (!isAdmin && !isHOD && !isFaculty) {
                          const userClassId = user?.class_id?.toString();
                          const matchesTeamClass = sub.class_id?.toString() === userClassId;
                          const leaderUser = users.find(u => u.id === sub.leader_id || u.register_number === sub.leader_regno);
                          const matchesClass = matchesTeamClass || leaderUser?.class_id?.toString() === userClassId ||
                            sub.members?.some(m => users.find(u => u.id === m.id || u.register_number === m.register_number)?.class_id?.toString() === userClassId);
                          if (!matchesClass) return false;
                        } else if (verificationDeptFilter || verificationClassFilter || verificationYearFilter) {
                          const leaderUser = users.find(u => u.id === sub.leader_id || u.register_number === sub.leader_regno);
                          const subClassId = sub.class_id?.toString() || leaderUser?.class_id?.toString();
                          const subClass = classes.find(c => c.id.toString() === subClassId);

                          if (verificationDeptFilter) {
                            const deptId = subClass?.department_id?.toString() || leaderUser?.department_id?.toString();
                            if (deptId && deptId !== verificationDeptFilter) return false;
                          }
                          if (verificationYearFilter && subClass && String(subClass.year) !== verificationYearFilter) {
                            return false;
                          }
                          if (verificationClassFilter) {
                            const matchesTeamClass = sub.class_id?.toString() === verificationClassFilter;
                            const matchesClass = matchesTeamClass || leaderUser?.class_id?.toString() === verificationClassFilter ||
                              sub.members?.some(m => users.find(u => u.id === m.id || u.register_number === m.register_number)?.class_id?.toString() === verificationClassFilter);
                            if (!matchesClass) return false;
                          }
                        }

                        return true;
                      });

                      if (filteredTeamSubs.length === 0 && teamSubmissions.length === 0) return null;

                      return (
                        <div className="mb-8 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="primary" className="bg-indigo-600 text-white border-none">
                                <Users size={12} /> Team Task Submissions
                              </Badge>
                              <span className="text-xs text-zinc-500 font-bold">
                                {filteredTeamSubs.length} Team{filteredTeamSubs.length !== 1 ? 's' : ''} {verificationFilter === 'ALL' ? 'Submitted' : verificationFilter}
                              </span>
                            </div>
                          </div>

                          {filteredTeamSubs.length === 0 ? (
                            <div className="p-8 bg-zinc-50 border border-zinc-200 rounded-2xl text-center text-xs text-zinc-500">
                              No {verificationFilter.toLowerCase()} team submissions found.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {filteredTeamSubs.map(sub => (
                                <Card key={sub.id} className="p-5 space-y-4 border border-zinc-200 hover:border-indigo-300 transition-colors">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                                          {sub.task_title || tasks.find(t => String(t.id) === String(sub.task_id))?.title || 'Team Task'}
                                        </span>
                                      </div>
                                      <h4 className="font-extrabold text-zinc-900 text-base flex items-center gap-2">
                                        {sub.team_name}
                                      </h4>
                                      <p className="text-xs text-zinc-500 font-medium">
                                        Leader: <span className="font-bold text-zinc-800">{sub.leader_name}</span> ({sub.leader_regno})
                                      </p>
                                    </div>
                                    <Badge variant={
                                      sub.status === 'APPROVED' || sub.status === 'VERIFIED' ? 'success' :
                                        sub.status === 'REJECTED' ? 'danger' : 'warning'
                                    }>
                                      {sub.status}
                                    </Badge>
                                  </div>

                                  {/* Members list */}
                                  {sub.members && sub.members.length > 0 && (
                                    <div className="bg-zinc-50 p-3 rounded-xl space-y-1 border border-zinc-100">
                                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Accepted Members ({sub.members.length})</p>
                                      <div className="flex flex-wrap gap-1.5 pt-1">
                                        {sub.members.map(m => {
                                          const isLeader = String(m.student_id) === String(sub.leader_id) || m.register_number === sub.leader_regno;
                                          return (
                                            <span key={m.id} className={cn(
                                              "border px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1.5",
                                              isLeader ? "bg-indigo-50 border-indigo-200 text-indigo-900" : "bg-white border-zinc-200 text-zinc-700"
                                            )}>
                                              {m.full_name || m.username} ({m.register_number})
                                              {isLeader ? (
                                                <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase">Leader</span>
                                              ) : (
                                                <span className="bg-zinc-100 text-zinc-600 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase">Member</span>
                                              )}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Proof Image & Original File Name */}
                                  {sub.proof_url && (
                                    <div className="space-y-1.5">
                                      <div className="rounded-xl overflow-hidden bg-zinc-900 border border-zinc-200 max-h-48 flex items-center justify-center cursor-pointer relative group/img" onClick={() => window.open(sub.proof_url, '_blank')} title="Click to open original proof">
                                        <img src={sub.proof_url} alt="Team Proof" className="max-h-48 object-contain group-hover/img:scale-105 transition-transform" />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                          <Eye size={14} /> Open Original Proof
                                        </div>
                                      </div>
                                      {sub.original_filename && (
                                        <div className="flex items-center justify-between px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-xs">
                                          <span className="font-mono text-zinc-700 truncate max-w-[280px]" title={`Uploaded file: ${sub.original_filename}`}>
                                            📄 {sub.original_filename}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navigator.clipboard.writeText(sub.original_filename!);
                                              addToast('Filename copied to clipboard', 'info');
                                            }}
                                            className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded transition-colors"
                                            title="Copy file name"
                                          >
                                            <Copy size={12} />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {sub.remarks && (
                                    <p className="text-xs text-zinc-600 italic bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                                      "{sub.remarks}"
                                    </p>
                                  )}

                                  {sub.status === 'PENDING' && (
                                    <div className="flex gap-2 pt-2 border-t border-zinc-100">
                                      <Button
                                        variant="success"
                                        className="flex-1 text-xs py-2 font-bold"
                                        onClick={() => handleReviewTeamSubmission(sub.id, 'APPROVED')}
                                      >
                                        <CheckCircle2 size={16} /> Approve Team
                                      </Button>
                                      <Button
                                        variant="danger"
                                        className="flex-1 text-xs py-2 font-bold"
                                        onClick={() => handleReviewTeamSubmission(sub.id, 'REJECTED')}
                                      >
                                        <XCircle size={16} /> Reject Team
                                      </Button>
                                    </div>
                                  )}
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {(() => {
                      const filtered = getFilteredVerificationSubmissions();
                      const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
                      const safePage = Math.min(submissionPage, totalPages);
                      const paginated = filtered.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

                      return (
                        <>
                          {/* ── Mobile Touch Cards Layout (< md) ─────────────── */}
                          <div className="block md:hidden space-y-3">
                            {(() => {
                              const pagePending = paginated.filter(s => s.status === 'SUBMITTED').map(s => s.id);
                              const isPageSelected = pagePending.length > 0 && pagePending.every(id => selectedSubmissions.includes(id));
                              if (pagePending.length === 0) return null;

                              return (
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
                                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                    <input
                                      type="checkbox"
                                      className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 accent-blue-600 cursor-pointer"
                                      checked={isPageSelected}
                                      onChange={e => {
                                        if (e.target.checked) {
                                          setSelectedSubmissions(prev => Array.from(new Set([...prev, ...pagePending])));
                                        } else {
                                          const pendingSet = new Set(pagePending);
                                          setSelectedSubmissions(prev => prev.filter(id => !pendingSet.has(id)));
                                        }
                                      }}
                                    />
                                    <span>Select All on Page ({pagePending.length})</span>
                                  </label>
                                  {selectedSubmissions.length > 0 && (
                                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
                                      {selectedSubmissions.length} Selected
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                            {filtered.length === 0 ? (
                              <Card className="text-center py-10 p-4">
                                <Users size={40} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                                <p className="font-bold text-sm text-zinc-900 dark:text-white">No submissions found</p>
                                <p className="text-xs text-zinc-400">There are no task submissions matching your current filters.</p>
                              </Card>
                            ) : (
                              paginated.map(s => {
                                const isPdf = Boolean(
                                  s.screenshot_url && 
                                  (s.screenshot_url.toLowerCase().includes('.pdf') || s.screenshot_url.toLowerCase().endsWith('.pdf'))
                                );
                                const isPurged = Boolean(s.screenshot_url && s.screenshot_url.startsWith('PURGED'));
                                const hasProof = Boolean(s.screenshot_url && !isPurged);
                                const fileName = s.original_filename || (isPdf ? 'Proof_Document.pdf' : 'Proof_Screenshot.png');

                                return (
                                  <Card
                                    key={s.id}
                                    className={cn(
                                      "p-3.5 rounded-2xl border-l-4 transition-all shadow-xs bg-white dark:bg-[#141418] space-y-3",
                                      s.status === 'VERIFIED' ? "border-l-emerald-500" :
                                      s.status === 'REJECTED' ? "border-l-red-500" :
                                      s.status === 'NOT_PARTICIPATING' ? "border-l-orange-400" :
                                      "border-l-amber-500"
                                    )}
                                  >
                                    <div className="flex items-start justify-between gap-2.5">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        {s.status === 'SUBMITTED' && (
                                          <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 cursor-pointer shrink-0 mt-0.5"
                                            checked={selectedSubmissions.includes(s.id)}
                                            onChange={e => {
                                              if (e.target.checked) setSelectedSubmissions(prev => [...prev, s.id]);
                                              else setSelectedSubmissions(prev => prev.filter(id => id !== s.id));
                                            }}
                                          />
                                        )}
                                        {s.student_avatar ? (
                                          <img
                                            src={s.student_avatar}
                                            alt={s.student_name}
                                            className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                                          />
                                        ) : (
                                          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                                            {(s.student_name || 'U').charAt(0).toUpperCase()}
                                          </div>
                                        )}
                                        <div className="min-w-0">
                                          <p className="text-sm font-bold text-zinc-900 dark:text-white leading-tight truncate">
                                            {s.student_name}
                                          </p>
                                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">{s.register_number || 'No Reg#'}</span>
                                            {s.class_name && (
                                              <span className="px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold rounded uppercase">
                                                {s.class_name}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                                        {s.is_duplicate && (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1 shrink-0 animate-pulse" title={`Duplicate of proof by ${s.duplicate_match?.student_name || s.duplicate_match_name || 'another student'}`}>
                                            <AlertTriangle size={10} className="text-amber-500" /> Duplicate File
                                          </span>
                                        )}
                                        <Badge variant={
                                          s.status === 'VERIFIED' ? 'success' :
                                          s.status === 'REJECTED' ? 'danger' : 'warning'
                                        } className={cn("shrink-0 text-[10px] font-bold", s.status === 'NOT_PARTICIPATING' ? 'bg-orange-100 text-orange-700 border-orange-200' : '')}>
                                          {s.status === 'SUBMITTED' ? 'PENDING' : s.status === 'NOT_PARTICIPATING' ? 'NOT INTERESTED' : s.status}
                                        </Badge>
                                      </div>
                                    </div>

                                    <div className="bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80 space-y-1">
                                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2">{s.task_title}</p>
                                      <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                        <span>Submitted: {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : 'N/A'}</span>
                                        {s.resubmission_count && s.resubmission_count > 0 ? (
                                          <span className="px-1 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded font-bold">
                                            #{s.resubmission_count}
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>

                                    {s.status === 'NOT_PARTICIPATING' && (
                                      <div className="p-2.5 bg-orange-50/90 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/40 rounded-xl">
                                        <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                          <AlertTriangle size={11} className="text-orange-500 shrink-0" /> Reason
                                        </p>
                                        <p className="text-xs text-orange-950 dark:text-orange-200 font-semibold leading-relaxed">
                                          "{s.not_participating_reason || 'No specific reason provided'}"
                                        </p>
                                      </div>
                                    )}

                                    {s.status !== 'NOT_PARTICIPATING' && s.custom_field_value && (() => {
                                      const val = s.custom_field_value.trim();
                                      const isUrl = /^https?:\/\//i.test(val) || /^www\./i.test(val) || val.includes('github.com') || val.includes('drive.google.com') || val.includes('leetcode.com');
                                      const targetUrl = isUrl ? (/^https?:\/\//i.test(val) ? val : `https://${val}`) : null;
                                      return (
                                        <div className="flex items-center justify-between gap-2 p-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg text-xs">
                                          <span className="text-[10px] font-bold text-zinc-400 uppercase truncate">
                                            {s.custom_field_label || 'Data'}:
                                          </span>
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            {targetUrl ? (
                                              <a
                                                href={targetUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline truncate max-w-[180px]"
                                              >
                                                <ExternalLink size={11} />
                                                <span className="truncate">{val}</span>
                                              </a>
                                            ) : (
                                              <span className="font-mono text-zinc-900 dark:text-zinc-100 truncate max-w-[180px]">{val}</span>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                navigator.clipboard.writeText(val);
                                                addToast('Copied to clipboard', 'info');
                                              }}
                                              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 shrink-0"
                                              title="Copy"
                                            >
                                              <Copy size={12} />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })()}

                                    {s.status !== 'NOT_PARTICIPATING' && hasProof && (
                                      <div className="flex items-center justify-between gap-2 p-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-2 min-w-0">
                                          {isPdf ? (
                                            <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 flex items-center justify-center shrink-0">
                                              <FileText size={18} />
                                            </div>
                                          ) : (
                                            <img
                                              src={getCloudinaryThumbnail(s.screenshot_url, 100)}
                                              alt="Proof"
                                              className="w-9 h-9 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                                            />
                                          )}
                                          <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{fileName}</p>
                                              {s.is_duplicate && (
                                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                                                  Duplicate
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-[10px] text-zinc-400 uppercase font-semibold">{isPdf ? 'PDF Document' : 'Screenshot'}</p>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setInspectingSubmission(s)}
                                          className="px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg flex items-center gap-1 shrink-0"
                                        >
                                          <Eye size={12} /> View
                                        </button>
                                      </div>
                                    )}

                                    <div className="flex items-center gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                                      {s.status === 'SUBMITTED' ? (
                                        <>
                                          <Button
                                            variant="success"
                                            className="flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 rounded-xl shadow-xs"
                                            onClick={() => verifySubmission(s.id, 'VERIFIED')}
                                          >
                                            <CheckCircle2 size={14} /> Verify
                                          </Button>
                                          <Button
                                            variant="danger"
                                            className="flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 rounded-xl shadow-xs"
                                            onClick={() => setShowRejectionModal(s.id)}
                                          >
                                            <XCircle size={14} /> Reject
                                          </Button>
                                          <Button
                                            variant="secondary"
                                            className="p-2 text-zinc-600 dark:text-zinc-400 rounded-xl"
                                            onClick={() => setInspectingSubmission(s)}
                                            title="Inspect full details"
                                          >
                                            <Eye size={16} />
                                          </Button>
                                        </>
                                      ) : (
                                        <>
                                          <Button
                                            variant="secondary"
                                            className="flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 rounded-xl"
                                            onClick={() => setInspectingSubmission(s)}
                                          >
                                            <Eye size={13} /> Full Details
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            className="p-2 text-zinc-500 rounded-xl"
                                            onClick={() => fetchReviews(s.id)}
                                            title="Review History"
                                          >
                                            <History size={16} />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </Card>
                                );
                              })
                            )}

                            {filtered.length > itemsPerPage && (
                              <div className="flex items-center justify-between pt-2 pb-4">
                                <Button
                                  variant="secondary"
                                  className="px-3 py-1.5 text-xs font-semibold"
                                  disabled={submissionPage === 1}
                                  onClick={() => setSubmissionPage(prev => prev - 1)}
                                >
                                  Previous
                                </Button>
                                <span className="text-xs font-bold text-zinc-500">
                                  Page {submissionPage} of {totalPages}
                                </span>
                                <Button
                                  variant="secondary"
                                  className="px-3 py-1.5 text-xs font-semibold"
                                  disabled={submissionPage === totalPages}
                                  onClick={() => setSubmissionPage(prev => prev + 1)}
                                >
                                  Next
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Desktop Table View (>= md) */}
                          <div className="hidden md:block">
                            <Table className="w-full">
                      <THead>
                        <TR>
                          <TH className="w-12">
                            {(() => {
                              const pagePending = paginated.filter(sub => sub.status === 'SUBMITTED').map(sub => sub.id);
                              const isPageSelected = pagePending.length > 0 && pagePending.every(id => selectedSubmissions.includes(id));

                              return (
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 accent-blue-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                                  title="Select all pending on this page"
                                  checked={isPageSelected}
                                  disabled={pagePending.length === 0}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setSelectedSubmissions(prev => Array.from(new Set([...prev, ...pagePending])));
                                    } else {
                                      const pendingSet = new Set(pagePending);
                                      setSelectedSubmissions(prev => prev.filter(id => !pendingSet.has(id)));
                                    }
                                  }}
                                />
                              );
                            })()}
                          </TH>
                          <TH>Student Details</TH>
                          <TH>Task</TH>
                          {verificationFilter === 'NOT INTERESTED' ? (
                            <TH colSpan={2}>Reason for Not Interested</TH>
                          ) : (
                            <>
                              <TH>Custom Field</TH>
                              <TH>Proof / Screenshot</TH>
                            </>
                          )}
                          <TH className="text-center">Status</TH>
                          <TH className="text-right">Actions</TH>
                        </TR>
                      </THead>
                      <TBody>
                        {(() => {
                          const filtered = getFilteredVerificationSubmissions();

                          if (filtered.length === 0) {
                            return (
                              <TR>
                                <TD colSpan={7} className="text-center py-12">
                                  <div className="max-w-md mx-auto">
                                    <Users size={48} className="mx-auto text-zinc-300 mb-4" />
                                    <p className="font-bold text-base text-zinc-900">No submissions found</p>
                                    <p className="text-sm text-zinc-400">There are no task submissions matching your current filters.</p>
                                  </div>
                                </TD>
                              </TR>
                            );
                          }

                          const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
                          const safePage = Math.min(submissionPage, totalPages);
                          const paginated = filtered.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

                          return (
                            <>
                              {paginated.map(s => (
                                <TR key={s.id} className={cn("border-l-4 transition-colors hover:bg-zinc-50/60", s.status === 'VERIFIED' ? "border-emerald-500" : s.status === 'REJECTED' ? "border-red-500" : s.status === 'NOT_PARTICIPATING' ? "border-orange-400" : "border-amber-500")}>
                                  <TD>
                                    {s.status === 'SUBMITTED' && (
                                      <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-zinc-300 cursor-pointer"
                                        checked={selectedSubmissions.includes(s.id)}
                                        onChange={e => {
                                          if (e.target.checked) setSelectedSubmissions(prev => [...prev, s.id]);
                                          else setSelectedSubmissions(prev => prev.filter(id => id !== s.id));
                                        }}
                                      />
                                    )}
                                  </TD>
                                  <TD>
                                    <div className="flex items-center gap-3">
                                      {s.student_avatar ? (
                                        <img
                                          src={s.student_avatar}
                                          alt={s.student_name}
                                          className="w-9 h-9 rounded-full object-cover border border-zinc-200 shrink-0"
                                        />
                                      ) : (
                                        <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold text-xs flex items-center justify-center shrink-0">
                                          {(s.student_name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                      <div className="break-words min-w-0 space-y-0.5">
                                        <p className="text-sm font-bold text-zinc-900 leading-tight break-words">
                                          {s.student_name}
                                        </p>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="text-xs text-zinc-500 font-mono italic">{s.register_number || 'No Reg#'}</span>
                                          {s.class_name && (
                                            <span className="px-1.5 py-0.2 bg-zinc-100 text-zinc-700 text-[10px] font-bold rounded uppercase border border-zinc-200">
                                              {s.class_name}
                                            </span>
                                          )}
                                          {s.department_name && (
                                            <span className="text-[10px] text-zinc-400 font-medium">
                                              • {s.department_name}
                                            </span>
                                          )}
                                        </div>
                                        {s.student_email && (
                                          <a
                                            href={`mailto:${s.student_email}`}
                                            className="text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline block truncate max-w-[190px]"
                                            title={s.student_email}
                                          >
                                            {s.student_email}
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </TD>
                                  <TD>
                                    <div className="space-y-1">
                                      <p className="text-sm font-medium text-zinc-900 break-words">{s.task_title}</p>
                                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-zinc-400">
                                        <span>{s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : 'N/A'}</span>
                                        {s.resubmission_count && s.resubmission_count > 0 ? (
                                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded">
                                            Resubmission #{s.resubmission_count}
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                  </TD>
                                  {s.status === 'NOT_PARTICIPATING' ? (
                                    <TD colSpan={2}>
                                      <div className="p-3 bg-orange-50/90 border border-orange-200 rounded-xl max-w-md shadow-xs">
                                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                          <AlertTriangle size={12} className="text-orange-500 shrink-0" />
                                          <span>Reason for Not Interested</span>
                                        </p>
                                        <p className="text-xs text-orange-950 font-semibold break-words leading-relaxed">
                                          "{s.not_participating_reason || 'No specific reason provided'}"
                                        </p>
                                      </div>
                                    </TD>
                                  ) : (
                                    <>
                                      <TD>
                                        <p className="text-[10px] text-zinc-400 uppercase font-extrabold mb-1 tracking-wider">
                                          {s.custom_field_label || 'Field Data'}
                                        </p>
                                        {s.custom_field_value ? (() => {
                                          const val = s.custom_field_value.trim();
                                          const isUrl = /^https?:\/\//i.test(val) || /^www\./i.test(val) || val.includes('github.com') || val.includes('drive.google.com') || val.includes('leetcode.com');
                                          const targetUrl = isUrl ? (/^https?:\/\//i.test(val) ? val : `https://${val}`) : null;
                                          return (
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              {targetUrl ? (
                                                <a
                                                  href={targetUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline bg-blue-50/80 border border-blue-200 px-2 py-1 rounded-lg"
                                                >
                                                  <ExternalLink size={12} />
                                                  <span className="max-w-[150px] truncate">{val}</span>
                                                </a>
                                              ) : (
                                                <span className="text-xs font-mono text-zinc-900 bg-zinc-100 px-2 py-1 rounded inline-block break-all max-w-[190px]">
                                                  {val}
                                                </span>
                                              )}
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  navigator.clipboard.writeText(val);
                                                  addToast('Copied to clipboard', 'info');
                                                }}
                                                className="p-1 text-zinc-400 hover:text-zinc-700 rounded hover:bg-zinc-100 transition-colors"
                                                title="Copy value"
                                              >
                                                <Copy size={12} />
                                              </button>
                                            </div>
                                          );
                                        })() : (
                                          <span className="text-xs text-zinc-400 font-mono italic">—</span>
                                        )}
                                      </TD>
                                      <TD>
                                        {s.screenshot_url && !s.screenshot_url.startsWith('PURGED') ? (() => {
                                          const isPdf = s.screenshot_url.toLowerCase().includes('.pdf') || s.screenshot_url.toLowerCase().endsWith('.pdf');
                                          const fileName = s.original_filename || (isPdf ? 'Proof_Document.pdf' : 'Proof_Screenshot.png');
                                          return (
                                            <div className="flex items-center gap-2.5 max-w-[240px]">
                                              {isPdf ? (
                                                <button
                                                  type="button"
                                                  onClick={() => setInspectingSubmission(s)}
                                                  className="flex items-center gap-2 p-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-700 transition-colors group cursor-pointer shrink-0"
                                                  title={`Inspect PDF: ${fileName}`}
                                                >
                                                  <FileText size={18} className="text-red-600 shrink-0 group-hover:scale-110 transition-transform" />
                                                  <div className="text-left">
                                                    <span className="text-xs font-black block">PDF Proof</span>
                                                    <span className="text-[10px] text-red-500 font-medium flex items-center gap-0.5">
                                                      <Eye size={10} /> Inspect
                                                    </span>
                                                  </div>
                                                </button>
                                              ) : (
                                                <div
                                                  className="relative group/img cursor-pointer rounded-xl overflow-hidden border-2 border-zinc-200 hover:border-indigo-600 transition-all shadow-2xs shrink-0"
                                                  onClick={() => setInspectingSubmission(s)}
                                                  title={`Click to inspect proof: ${fileName}`}
                                                >
                                                  <img
                                                    src={getCloudinaryThumbnail(s.screenshot_url, 150)}
                                                    className="w-13 h-13 object-cover group-hover/img:scale-110 transition-transform duration-200"
                                                    alt="Proof Thumbnail"
                                                  />
                                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                    <Eye size={16} />
                                                  </div>
                                                </div>
                                              )}

                                              <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                  <span 
                                                    className="font-mono text-xs font-bold text-zinc-800 hover:text-indigo-600 cursor-pointer block truncate" 
                                                    onClick={() => setInspectingSubmission(s)}
                                                    title={`Uploaded file name: ${fileName}`}
                                                  >
                                                    {fileName}
                                                  </span>
                                                  {s.is_duplicate && (
                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 border border-amber-500/40 flex items-center gap-1 shrink-0 animate-pulse" title={`Duplicate of proof by ${s.duplicate_match?.student_name || s.duplicate_match_name || 'another student'}`}>
                                                      <AlertTriangle size={9} className="text-amber-500" /> Duplicate File
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="flex items-center gap-1.5 pt-0.5">
                                                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-zinc-400">
                                                    {isPdf ? 'PDF' : (fileName.split('.').pop() || 'IMG').toUpperCase()}
                                                  </span>
                                                  {s.original_filename && (
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(s.original_filename!);
                                                        addToast('Filename copied to clipboard', 'info');
                                                      }}
                                                      className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded transition-colors"
                                                      title="Copy file name"
                                                    >
                                                      <Copy size={11} />
                                                    </button>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })() : s.screenshot_url && s.screenshot_url.startsWith('PURGED') ? (
                                          <span className="text-xs text-zinc-400 font-mono italic">Purged (30d+)</span>
                                        ) : (
                                          <span className="text-xs text-zinc-400 font-mono italic">No File</span>
                                        )}
                                      </TD>
                                    </>
                                  )}
                                  <TD className="text-center">
                                    <div className="flex flex-col items-center gap-1">
                                      <Badge variant={
                                        s.status === 'VERIFIED' ? 'success' :
                                          s.status === 'REJECTED' ? 'danger' : 'warning'
                                      } className={s.status === 'NOT_PARTICIPATING' ? 'bg-orange-100 text-orange-700 border-orange-200' : ''}>
                                        {s.status === 'SUBMITTED' ? 'PENDING' : s.status === 'NOT_PARTICIPATING' ? 'NOT INTERESTED' : s.status}
                                      </Badge>
                                      {s.is_duplicate && (
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 border border-amber-500/40 flex items-center gap-1 shrink-0 animate-pulse" title={`Duplicate of proof by ${s.duplicate_match?.student_name || s.duplicate_match_name || 'another student'}`}>
                                          <AlertTriangle size={9} className="text-amber-500" /> Duplicate
                                        </span>
                                      )}
                                    </div>
                                  </TD>
                                  <TD className="text-right">
                                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                      {/* Quick Inspector Modal Opener */}
                                      <Button
                                        variant="secondary"
                                        className="px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-bold border-zinc-200 hover:border-zinc-900 transition-colors"
                                        onClick={() => setInspectingSubmission(s)}
                                        title="Inspect full proof and student details"
                                      >
                                        <Eye size={13} className="text-zinc-600" /> Review
                                      </Button>

                                      {s.status === 'SUBMITTED' && (
                                        isCoordinator && String(s.user_id) === String(user?.id) ? (
                                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-2xs" title="Your own submission must be verified by Class Advisor or HOD">
                                            <Clock size={12} className="text-amber-600" /> Own Submission (Advisor Review)
                                          </span>
                                        ) : (
                                          <>
                                            <Button
                                              variant="success"
                                              className="px-2.5 py-1.5 flex items-center gap-1 text-xs font-bold"
                                              onClick={() => verifySubmission(s.id, 'VERIFIED')}
                                              title="Approve & Verify"
                                            >
                                              <CheckCircle2 size={13} /> Verify
                                            </Button>
                                            <Button
                                              variant="danger"
                                              className="px-2.5 py-1.5 flex items-center gap-1 text-xs font-bold"
                                              onClick={() => setShowRejectionModal(s.id)}
                                              title="Reject submission with feedback"
                                            >
                                              <XCircle size={13} /> Reject
                                            </Button>
                                          </>
                                        )
                                      )}
                                      {s.status === 'REJECTED' && (
                                        <span className="text-xs text-red-500 font-semibold px-2 py-1 bg-red-50 rounded-lg border border-red-200">
                                          Rejected
                                        </span>
                                      )}
                                      {s.status === 'VERIFIED' && (
                                        <span className="text-xs text-emerald-600 font-bold px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-1">
                                          <CheckCircle2 size={13} /> Verified
                                        </span>
                                      )}
                                      <Button
                                        variant="ghost"
                                        className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-lg"
                                        onClick={async () => {
                                          if (confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
                                            const res = await fetch(`${API_URL}/api/submissions/${s.id}`, {
                                              method: 'DELETE',
                                              headers: { Authorization: `Bearer ${token}` }
                                            });
                                            if (res.ok) {
                                              fetchInitialData();
                                            } else {
                                              const data = await res.json();
                                              alert(data.error || 'Failed to delete submission');
                                            }
                                          }
                                        }}
                                        title="Delete Submission"
                                      >
                                        <Trash2 size={15} />
                                      </Button>
                                    </div>
                                  </TD>
                                </TR>
                              ))}
                              {filtered.length > itemsPerPage && (
                                <TR>
                                  <TD colSpan={7} className="bg-zinc-50/30">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
                                      <p className="text-xs font-medium text-zinc-500 whitespace-nowrap">
                                        Showing {(safePage - 1) * itemsPerPage + 1} to {Math.min(safePage * itemsPerPage, filtered.length)} of {filtered.length} entries
                                      </p>
                                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                        <Button
                                          variant="secondary"
                                          className="px-3 py-1 h-8 text-xs font-semibold"
                                          disabled={safePage <= 1}
                                          onClick={() => setSubmissionPage(prev => Math.max(1, prev - 1))}
                                        >
                                          Previous
                                        </Button>
                                        <div className="flex items-center gap-1">
                                          {getPaginationRange(safePage, totalPages).map((p, idx) => typeof p === 'number' ? (
                                            <button
                                              key={idx}
                                              onClick={() => setSubmissionPage(p)}
                                              className={cn(
                                                "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                                                safePage === p ? "bg-black text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-100"
                                              )}
                                            >
                                              {p}
                                            </button>
                                          ) : (
                                            <span key={idx} className="w-5 text-center text-xs text-zinc-400 font-bold">...</span>
                                          ))}
                                        </div>
                                        <Button
                                          variant="secondary"
                                          className="px-3 py-1 h-8 text-xs font-semibold"
                                          disabled={safePage >= totalPages}
                                          onClick={() => setSubmissionPage(prev => Math.min(totalPages, prev + 1))}
                                        >
                                          Next
                                        </Button>
                                      </div>
                                    </div>
                                  </TD>
                                </TR>
                              )}
                            </>
                          );
                        })()}
                      </TBody>
                    </Table>
                  </div>
                </>
              );
            })()}
                  </PageLayout>
                </motion.div>

  );
}

export default VerificationsView;
