import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Building2, UserCheck, GraduationCap, AlertTriangle, ClipboardList,
  Users, CheckCircle2, Clock, ShieldCheck, Send, ChevronRight,
  TrendingUp, Download, Eye, ExternalLink, Sparkles, Filter, Search, Code, User as UserIcon
} from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { CircularProgress } from '../../components/ui/CircularProgress';
import { SimpleBarChart } from '../../components/ui/SimpleBarChart';
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table';
import { SystemAutomationControlsCard } from '../admin/SystemAutomationControlsCard';
import { getStudentTaskStatusBadge, getStudentRegisterNumber } from '../../components/common/helpers';
import { cn } from '../../lib/utils';
import type {
  User, Department, Class, Task, Submission,
  HODStats, AdvisorStats, CoordinatorStats, StudentStats, ToastType
} from '../../types';

export interface DashboardViewProps {
  user: User | null;
  token: string | null;
  departments: Department[];
  classes: Class[];
  users: User[];
  tasks: Task[];
  submissions: Submission[];
  hodStats: HODStats | null;
  advisorStats: AdvisorStats | null;
  coordinatorStats: CoordinatorStats | null;
  studentStats: StudentStats | null;
  myClass: Class | null;
  pendingIndustryList?: any[];
  myLeetcodeProgress?: any;
  setView: (view: string) => void;
  onOpenTelegramModal?: () => void;
  addToast?: (msg: string, type?: ToastType) => void;
}

const ContentCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <Card className={cn("p-6", className)}>{children}</Card>
);

export function DashboardView({
  user,
  token,
  departments,
  classes,
  users,
  tasks,
  submissions,
  hodStats,
  advisorStats,
  coordinatorStats,
  studentStats,
  myClass,
  pendingIndustryList = [],
  myLeetcodeProgress,
  setView,
  onOpenTelegramModal = () => {},
  addToast = () => {},
}: DashboardViewProps) {
  const isAdmin = user?.role === 'SUPREME_ADMIN';
  const isHOD = user?.role === 'HOD';
  const isAdvisor = user?.role === 'CLASS_ADVISOR';
  const isStudent = user?.role === 'STUDENT';
  const isCoordinator = Boolean(user?.is_coordinator);

  // Analyzer Filters State
  const [analyzerClassFilter, setAnalyzerClassFilter] = useState('');
  const [analyzerYearFilter, setAnalyzerYearFilter] = useState('');
  const [analyzerTaskFilter, setAnalyzerTaskFilter] = useState('');
  const [analyzerStatusFilter, setAnalyzerStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING' | 'NOT_PARTICIPATING'>('ALL');
  const [analyzerGenderFilter, setAnalyzerGenderFilter] = useState<'ALL' | 'BOYS' | 'GIRLS'>('ALL');
  const [adminDeptFilter, setAdminDeptFilter] = useState('');

  // ── UnifiedAnalyzer Subcomponent ──
  const UnifiedAnalyzer = ({ role, title }: { role: string, title: string }) => {
    // Determine context
    const isGlobal = role === 'SUPREME_ADMIN';
    const isDept = role === 'HOD';
    const isCls = role === 'CLASS_ADVISOR' || role === 'COORDINATOR';

    const currentDeptId = isGlobal ? adminDeptFilter : user?.department_id?.toString();
    const currentClassId = isCls ? (user?.class_id || myClass?.id)?.toString() : analyzerClassFilter;

    const deptStudents = users.filter(u => {
      if (u.role !== 'STUDENT') return false;
      if (isCls) return u.class_id?.toString() === currentClassId;
      if (currentDeptId) return u.department_id?.toString() === currentDeptId;
      return true;
    }).filter(u => {
      if (!isCls && analyzerClassFilter) return u.class_id?.toString() === analyzerClassFilter;
      // HOD year filter: when a year is selected but no specific class, filter students by year
      if (isDept && analyzerYearFilter && !analyzerClassFilter) {
        const studentClass = classes.find(c => c.id.toString() === u.class_id?.toString());
        return String(studentClass?.year) === analyzerYearFilter;
      }
      return true;
    });

    const enriched = deptStudents.map(student => {
      let submissionStatus = 'PENDING';
      let submissionLabel = 'Not Registered';
      const clsName = classes.find(c => c.id.toString() === student.class_id?.toString())?.name || '—';
      let missingTasks: any[] = [];

      if (analyzerTaskFilter) {
        const sub = submissions.find(s =>
          s.user_id?.toString() === student.id?.toString() &&
          s.task_id?.toString() === analyzerTaskFilter
        );
        if (sub) {
          submissionStatus = sub.status;
          submissionLabel = sub.status === 'VERIFIED' ? 'Verified' : sub.status === 'REJECTED' ? 'Rejected' : sub.status === 'NOT_PARTICIPATING' ? 'Not Interested' : 'Submitted';
        }
      } else {
        const studentSubs = submissions.filter(s => s.user_id?.toString() === student.id?.toString());
        const visibleTasks = tasks.filter(t => {
          if (analyzerClassFilter) {
            if ((t.class_ids || []).some(cid => cid.toString() === analyzerClassFilter)) return true;
            if (t.department_id && t.department_id.toString() === student.department_id?.toString() && (!(t.class_ids || []).length)) return true;
            if (!t.department_id && (!(t.class_ids || []).length)) return true;
            return false;
          }
          if (Array.isArray(t.class_ids) && t.class_ids.length > 0 && !t.class_ids.some(cid => cid.toString() === student.class_id?.toString())) return false;
          if (t.department_id && t.department_id.toString() !== student.department_id?.toString() && (!(t.class_ids || []).length)) return false;
          return true;
        });

        const visibleTaskIds = new Set(visibleTasks.map(t => (t as any)._id?.toString() || (t as any).id?.toString()));
        const studentSubsInContext = studentSubs.filter(s => visibleTaskIds.has(s.task_id?.toString()));
        const totalTasks = visibleTasks.length;
        const doneTaskIds = new Set(studentSubsInContext.filter(s => s.status === 'VERIFIED' || s.status === 'SUBMITTED').map(s => s.task_id?.toString()));
        const doneCount = doneTaskIds.size;

        missingTasks = visibleTasks.filter(t => !doneTaskIds.has((t as any)._id?.toString() || (t as any).id?.toString()));

        submissionLabel = `${doneCount} / ${totalTasks} Events`;
        if (totalTasks === 0) {
          submissionStatus = 'PENDING';
        } else if (doneCount === totalTasks) {
          submissionStatus = 'VERIFIED';
        } else if (doneCount > 0) {
          submissionStatus = 'SUBMITTED';
        } else {
          submissionStatus = 'PENDING';
        }
      }

      return { ...student, submissionStatus, submissionLabel, clsName, missingTasks };
    });

    const getStudentGender = (student: any): 'MALE' | 'FEMALE' => {
      const g = (student.gender || '').toUpperCase();
      if (g === 'FEMALE' || g === 'GIRLS') return 'FEMALE';
      return 'MALE';
    };

    const isStudentDone = (s: any) => {
      if (analyzerTaskFilter) {
        return s.submissionStatus === 'VERIFIED' || s.submissionStatus === 'SUBMITTED';
      }
      return s.submissionStatus === 'VERIFIED';
    };

    const isStudentResponded = (s: any) => {
      const studentSubs = submissions.filter(sub => sub.user_id?.toString() === s.id?.toString() && sub.status !== 'NOT_PARTICIPATING');
      if (analyzerTaskFilter) {
        return studentSubs.some(sub => sub.task_id?.toString() === analyzerTaskFilter);
      }
      return studentSubs.length > 0;
    };

    const isStudentSkipped = (s: any) => {
      const studentSubs = submissions.filter(sub => sub.user_id?.toString() === s.id?.toString());
      if (analyzerTaskFilter) {
        return studentSubs.some(sub => sub.task_id?.toString() === analyzerTaskFilter && sub.status === 'NOT_PARTICIPATING');
      }
      return studentSubs.some(sub => sub.status === 'NOT_PARTICIPATING');
    };

    const boysEnriched = enriched.filter(s => getStudentGender(s) === 'MALE');
    const girlsEnriched = enriched.filter(s => getStudentGender(s) === 'FEMALE');

    const boysCompleted = boysEnriched.filter(isStudentDone).length;
    const boysPending = boysEnriched.length - boysCompleted;

    const girlsCompleted = girlsEnriched.filter(isStudentDone).length;
    const girlsPending = girlsEnriched.length - girlsCompleted;

    const completedCount = enriched.filter(isStudentDone).length;
    const pendingCount = enriched.length - completedCount;

    const respondedCount = enriched.filter(isStudentResponded).length;
    const boysResponded = boysEnriched.filter(isStudentResponded).length;
    const girlsResponded = girlsEnriched.filter(isStudentResponded).length;

    const skippedCount = enriched.filter(isStudentSkipped).length;
    const boysSkipped = boysEnriched.filter(isStudentSkipped).length;
    const girlsSkipped = girlsEnriched.filter(isStudentSkipped).length;

    const filtered = enriched.filter(s => {
      const g = getStudentGender(s);
      if (analyzerGenderFilter === 'BOYS' && g !== 'MALE') return false;
      if (analyzerGenderFilter === 'GIRLS' && g !== 'FEMALE') return false;
      if (analyzerStatusFilter === 'COMPLETED') return isStudentDone(s);
      if (analyzerStatusFilter === 'PENDING') return !isStudentDone(s) && s.submissionStatus !== 'NOT_PARTICIPATING';
      if (analyzerStatusFilter === 'NOT_PARTICIPATING') return s.submissionStatus === 'NOT_PARTICIPATING';
      return true;
    });

    return (
      <ContentCard className="p-0 overflow-hidden mt-10">
        <div className="p-6 border-b border-zinc-200 bg-zinc-50/50">
          <h3 className="text-xl font-bold text-zinc-900 tracking-tight">{title}</h3>
          <p className="text-xs font-medium text-zinc-500 mt-1">Track student progress and events by class and gender</p>
        </div>

        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-5 gap-4 bg-white border-b border-zinc-200">
          {isGlobal && (
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">Departments</label>
              <Select
                value={adminDeptFilter}
                onChange={e => {
                  setAdminDeptFilter(e.target.value);
                  setAnalyzerYearFilter('');
                  setAnalyzerClassFilter('');
                }}
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id.toString()}>{d.name}</option>)}
              </Select>
            </div>
          )}
          {!isCls && (
            <>
              {/* YEAR filter — HOD / Admin */}
              {(isDept || isGlobal) && (
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">Year</label>
                  <Select
                    value={analyzerYearFilter}
                    onChange={e => {
                      setAnalyzerYearFilter(e.target.value);
                      setAnalyzerClassFilter(''); // reset class when year changes
                    }}
                  >
                    <option value="">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </Select>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">Section / Class</label>
                <Select
                  value={analyzerClassFilter}
                  onChange={e => setAnalyzerClassFilter(e.target.value)}
                >
                  <option value="">All Classes / Sections</option>
                  {classes.filter(c => {
                    if (analyzerYearFilter && String(c.year) !== analyzerYearFilter) return false;
                    if (currentDeptId && c.department_id?.toString() !== currentDeptId) return false;
                    return true;
                  }).sort((a, b) => (a.year || 0) - (b.year || 0) || (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' })).map(c => (
                    <option key={c.id} value={c.id.toString()}>{c.name}</option>
                  ))}
                </Select>
              </div>
            </>
          )}
          <div className={cn(isGlobal ? "md:col-span-1" : isCls ? "md:col-span-2" : "md:col-span-1")}>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">Event</label>
            <Select
              value={analyzerTaskFilter}
              onChange={e => setAnalyzerTaskFilter(e.target.value)}
            >
              <option value="">All Events</option>
              {tasks.filter(t => {
                const isDeptMatch = !currentDeptId || t.department_id?.toString() === currentDeptId || !t.department_id;
                if (!isDeptMatch) return false;
                if (currentClassId) {
                  if ((t.class_ids || []).some(cid => cid.toString() === currentClassId)) return true;
                  if (t.department_id && t.department_id.toString() === currentDeptId && (!(t.class_ids || []).length)) return true;
                  if (!t.department_id && (!(t.class_ids || []).length)) return true;
                  return false;
                }
                return true;
              }).map(t => (
                <option key={t.id} value={t.id.toString()}>{t.title}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">Gender</label>
            <Select
              value={analyzerGenderFilter}
              onChange={e => setAnalyzerGenderFilter(e.target.value as any)}
            >
              <option value="ALL">All Students</option>
              <option value="BOYS">Boys</option>
              <option value="GIRLS">Girls</option>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">Status</label>
            <Select
              value={analyzerStatusFilter}
              onChange={e => setAnalyzerStatusFilter(e.target.value as any)}
            >
              <option value="ALL">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Not Registered</option>
              <option value="NOT_PARTICIPATING">Not Interested</option>
            </Select>
          </div>
        </div>

        {/* Separate Gender Breakdown Cards */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 bg-zinc-50 border-b border-zinc-200">
          <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Students</p>
              <p className="text-xl sm:text-2xl font-black text-zinc-900 mt-0.5">{enriched.length}</p>
            </div>
            <div className="text-left sm:text-right text-[11px] sm:text-xs font-semibold text-zinc-600 space-y-0.5">
              <p className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md flex items-center sm:justify-end gap-1"><UserIcon size={11} /> Boys: {boysEnriched.length}</p>
              <p className="bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded-md flex items-center sm:justify-end gap-1"><UserIcon size={11} /> Girls: {girlsEnriched.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#18181c] p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-indigo-200 dark:border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Responded</p>
              <p className="text-xl sm:text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-0.5">{respondedCount}</p>
              <span className="text-[9px] font-semibold text-indigo-500 dark:text-indigo-400">Interested</span>
            </div>
            <div className="text-left sm:text-right text-[11px] sm:text-xs font-semibold space-y-0.5">
              <p className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-md flex items-center sm:justify-end gap-1"><UserIcon size={11} /> Boys: {boysResponded}</p>
              <p className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-md flex items-center sm:justify-end gap-1"><UserIcon size={11} /> Girls: {girlsResponded}</p>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Completed</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">{completedCount}</p>
            </div>
            <div className="text-left sm:text-right text-[11px] sm:text-xs font-semibold space-y-0.5">
              <p className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md flex items-center sm:justify-end gap-1"><UserIcon size={11} /> Boys: {boysCompleted}</p>
              <p className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md flex items-center sm:justify-end gap-1"><UserIcon size={11} /> Girls: {girlsCompleted}</p>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold text-orange-500 uppercase tracking-wider">Skipped</p>
              <p className="text-xl sm:text-2xl font-black text-orange-600 mt-0.5">{skippedCount}</p>
            </div>
            <div className="text-left sm:text-right text-[11px] sm:text-xs font-semibold space-y-0.5">
              <p className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded-md flex items-center sm:justify-end gap-1"><UserIcon size={11} /> Boys: {boysSkipped}</p>
              <p className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded-md flex items-center sm:justify-end gap-1"><UserIcon size={11} /> Girls: {girlsSkipped}</p>
            </div>
          </div>
        </div>

        {/* Visualization Section */}
        <div className="px-3.5 sm:px-8 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 bg-zinc-50/20 border-b border-zinc-100">
          <div className="lg:col-span-1 flex justify-center items-center bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-zinc-100 shadow-xs">
            <CircularProgress
              value={completedCount}
              total={enriched.length}
              label="Overall Completion"
              color="text-emerald-500"
              size="lg"
            />
          </div>
          <div className="lg:col-span-2 bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-zinc-100 shadow-xs min-h-[180px]">
            {analyzerTaskFilter ? (
              <SimpleBarChart
                label="Class-wise Completion"
                color="bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                data={(() => {
                  const classMap = new Map();
                  enriched.forEach(s => {
                    const cls = s.clsName || 'Unknown';
                    if (!classMap.has(cls)) classMap.set(cls, { value: 0, total: 0 });
                    const stats = classMap.get(cls);
                    stats.total++;
                    if (s.submissionStatus === 'VERIFIED' || s.submissionStatus === 'SUBMITTED') stats.value++;
                  });
                  return Array.from(classMap.entries()).map(([label, stats]) => ({ label, ...stats }));
                })()}
              />
            ) : (
              <SimpleBarChart
                label="Event-wise Performance"
                color="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                data={tasks.filter(t => {
                  const isDeptMatch = !currentDeptId || t.department_id?.toString() === currentDeptId || !t.department_id;
                  if (!isDeptMatch) return false;
                  if (currentClassId) return !(t.class_ids || []).length || (t.class_ids || []).some(cid => cid.toString() === currentClassId);
                  return true;
                }).slice(0, 10).map(t => {
                  const taskSubmissions = submissions.filter(s => s.task_id?.toString() === t.id.toString());
                  const relevantStudents = enriched.filter(s => {
                    if (t.class_ids?.length > 0) return t.class_ids.some(cid => cid.toString() === s.class_id?.toString());
                    if (t.department_id) return t.department_id.toString() === s.department_id?.toString();
                    return true;
                  });
                  const done = relevantStudents.filter(s => {
                    const sub = taskSubmissions.find(sub => sub.user_id?.toString() === s.id.toString());
                    return sub && (sub.status === 'VERIFIED' || sub.status === 'SUBMITTED');
                  }).length;
                  return { label: t.title, value: done, total: Math.max(relevantStudents.length, done) };
                })}
              />
            )}
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <div className="px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/30">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-zinc-200">
                <span className="text-xs font-bold text-zinc-700">{filtered.length} Students</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                <span className="text-xs font-bold text-emerald-700">{filtered.filter(isStudentDone).length} Done</span>
              </div>
              <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                <span className="text-xs font-bold text-red-700">{filtered.length - filtered.filter(isStudentDone).length} Not Registered</span>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-full border border-zinc-200/80 dark:border-zinc-700/80 shadow-inner">
              <button
                type="button"
                onClick={() => setAnalyzerGenderFilter('ALL')}
                className={cn(
                  "px-3.5 py-1 rounded-full text-xs font-bold transition-all",
                  analyzerGenderFilter === 'ALL'
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60"
                )}
              >
                All ({enriched.length})
              </button>
              <button
                type="button"
                onClick={() => setAnalyzerGenderFilter('BOYS')}
                className={cn(
                  "px-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1",
                  analyzerGenderFilter === 'BOYS'
                    ? "bg-blue-600 dark:bg-sky-500 text-white shadow-sm"
                    : "text-blue-600 dark:text-sky-400 hover:bg-blue-50 dark:hover:bg-sky-950/40"
                )}
              >
                Boys ({boysEnriched.length})
              </button>
              <button
                type="button"
                onClick={() => setAnalyzerGenderFilter('GIRLS')}
                className={cn(
                  "px-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1",
                  analyzerGenderFilter === 'GIRLS'
                    ? "bg-pink-600 dark:bg-rose-500 text-white shadow-sm"
                    : "text-pink-600 dark:text-rose-400 hover:bg-pink-50 dark:hover:bg-rose-950/40"
                )}
              >
                Girls ({girlsEnriched.length})
              </button>
            </div>
          </div>

          <Table>
            <THead>
              <TR>
                <TH>Student</TH>
                <TH className="text-center">Status</TH>
                <TH className="text-right">Progress</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map(student => {
                const isCompleted = student.submissionStatus === 'VERIFIED' || student.submissionStatus === 'SUBMITTED';
                return (
                  <TR key={student.id}>
                    <TD className="text-sm text-zinc-900">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-zinc-900">{student.full_name}</span>
                        {student.gender && (() => {
                          const isBoy = ['MALE', 'BOYS', 'BOY', 'M'].includes((student.gender || '').toUpperCase());
                          return (
                            <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded uppercase border flex items-center gap-1", isBoy ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-pink-50 text-pink-600 border-pink-100")}>
                              <UserIcon size={10} /> {isBoy ? 'Boy' : 'Girl'}
                            </span>
                          );
                        })()}
                        {!analyzerClassFilter && (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-xs font-bold rounded uppercase border border-indigo-100">
                            {student.clsName}
                          </span>
                        )}
                        <span className="text-xs text-zinc-400 font-mono italic">{student.register_number}</span>
                      </div>
                      {!analyzerTaskFilter && student.missingTasks && student.missingTasks.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className="text-xs text-zinc-400 font-bold uppercase mr-1">Missing:</span>
                          {student.missingTasks.slice(0, 3).map((t: any) => (
                            <span key={t.id} className="px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded text-xs font-medium">{t.title}</span>
                          ))}
                          {student.missingTasks.length > 3 && <span className="text-xs text-zinc-400">+{student.missingTasks.length - 3} more</span>}
                        </div>
                      )}
                    </TD>
                    <TD className="text-center">
                      <Badge variant={
                        student.submissionStatus === 'VERIFIED' ? 'success' :
                          student.submissionStatus === 'SUBMITTED' ? 'warning' : 'danger'
                      }>
                        {student.submissionStatus === 'SUBMITTED' && !analyzerTaskFilter ? 'In Progress' :
                          student.submissionStatus === 'SUBMITTED' && analyzerTaskFilter ? 'Submitted' :
                            student.submissionLabel}
                      </Badge>
                    </TD>
                    <TD className="text-right font-black text-zinc-400">
                      {(() => {
                        if (analyzerTaskFilter) return isCompleted ? '100%' : '0%';
                        const parts = student.submissionLabel.split('/');
                        if (parts.length < 2) return '0%';
                        const done = parseInt(parts[0].trim());
                        const total = parseInt(parts[1].trim().split(' ')[0]);
                        if (isNaN(done) || isNaN(total) || total === 0) return '0%';
                        return `${Math.min(100, Math.round((done / total) * 100))}%`;
                      })()}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </div>
      </ContentCard>
    );
  };


  return (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full h-full flex flex-col min-h-0"
                >
                  <PageLayout>
                    {isAdmin ? (
                      <div className="flex flex-col gap-6">
                        {/* Supreme Admin System Automation & Backup Controls */}
                        <SystemAutomationControlsCard token={token} addToast={addToast} />

                        {pendingIndustryList.length > 0 && (
                          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-orange-500/10 border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                                <Building2 size={20} />
                              </div>
                              <div>
                                <h4 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                                  <span>{pendingIndustryList.length} Corporate Partner Application{pendingIndustryList.length > 1 ? 's' : ''} Pending Approval</span>
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">Action Required</span>
                                </h4>
                                <p className="text-xs text-zinc-600 mt-0.5">
                                  {pendingIndustryList.map(p => p.company_name).join(', ')} registered and {pendingIndustryList.length > 1 ? 'are' : 'is'} awaiting verification to post campus internships & jobs.
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => setView('industry-approvals')}
                              className="rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold shrink-0 shadow-sm"
                            >
                              Review & Approve →
                            </Button>
                          </div>
                        )}
                        <UnifiedAnalyzer role="SUPREME_ADMIN" title="Global System Analyzer" />
                      </div>
                    ) : isHOD ? (
                      <div className="flex flex-col gap-5 sm:gap-8">
                        {/* Premium Header Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
                          <StatCard title="Active Classes" value={hodStats?.total_classes || 0} icon={<Building2 />} color="blue" />
                          <StatCard title="Class Advisors" value={hodStats?.total_advisors || 0} icon={<UserCheck />} color="emerald" />
                          <StatCard title="Total Enrollment" value={hodStats?.total_students || 0} icon={<GraduationCap />} color="indigo" />
                          <StatCard title="Not Interested / Opted Out" value={hodStats?.not_participating_submissions ?? submissions.filter(s => s.status === 'NOT_PARTICIPATING').length} icon={<AlertTriangle />} color="bg-orange-500" />
                          <StatCard title="Tasks Under Oversight" value={hodStats?.taskStats?.length || 0} icon={<ClipboardList />} color="orange" />
                        </div>

                        {/* Full Width Class Analyzer */}
                        <div className="w-full">
                          <UnifiedAnalyzer role="HOD" title="Class Analyzer" />
                        </div>
                      </div>
                    ) : isAdvisor ? (() => {
                      const activeClassId = user?.class_id || myClass?.id;
                      const myClassStudentsCount = users.filter(u => u.role === 'STUDENT' && (activeClassId ? String(u.class_id) === String(activeClassId) : true)).length;
                      const totalClassStudents = myClassStudentsCount || (advisorStats?.total_students ?? 0);
                      const filteredSubs = submissions.filter(s => {
                        const std = users.find(u => u.id === s.user_id);
                        const cid = s.class_id || std?.class_id;
                        return activeClassId ? String(cid) === String(activeClassId) : true;
                      });
                      const respondedCount = new Set(filteredSubs.filter(s => s.status !== 'NOT_PARTICIPATING').map(s => s.user_id)).size;
                      const pendingCount = submissions.length > 0
                        ? new Set(filteredSubs.filter(s => s.status === 'SUBMITTED').map(s => s.user_id)).size
                        : (advisorStats?.submitted_tasks_count ?? 0);
                      const verifiedCount = submissions.length > 0
                        ? new Set(filteredSubs.filter(s => s.status === 'VERIFIED').map(s => s.user_id)).size
                        : (advisorStats?.verified_tasks_count ?? 0);

                      return (
                        <div className="flex flex-col gap-5 sm:gap-8">
                          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
                            <StatCard title="Class Students" value={totalClassStudents} icon={<Users />} color="bg-blue-500" />
                            <StatCard title="Responded Students" value={respondedCount} icon={<CheckCircle2 />} color="bg-indigo-500" />
                            <StatCard title="Pending Verification" value={pendingCount} icon={<Clock />} color="bg-orange-500" />
                            <StatCard title="Verified Students" value={verifiedCount} icon={<CheckCircle2 />} color="bg-emerald-500" />
                          </div>
                          <UnifiedAnalyzer role="CLASS_ADVISOR" title="Class Performance Analyzer" />
                        </div>
                      );
                    })() : (
                      <div className="flex flex-col gap-5 sm:gap-8">
                        {isCoordinator ? (() => {
                          const activeClassId = user?.class_id || myClass?.id;
                          const myClassStudentsCount = users.filter(u => u.role === 'STUDENT' && (activeClassId ? String(u.class_id) === String(activeClassId) : true)).length;
                          const totalClassStudents = myClassStudentsCount || (coordinatorStats?.class_student_count ?? coordinatorStats?.total_students ?? 0);
                          const filteredCoordSubs = submissions.filter(s => {
                            const std = users.find(u => u.id === s.user_id);
                            const cid = s.class_id || std?.class_id;
                            return activeClassId ? String(cid) === String(activeClassId) : true;
                          });
                          const respondedCount = new Set(filteredCoordSubs.filter(s => s.status !== 'NOT_PARTICIPATING').map(s => s.user_id)).size;
                          const pendingCount = submissions.length > 0
                            ? new Set(filteredCoordSubs.filter(s => s.status === 'SUBMITTED').map(s => s.user_id)).size
                            : (coordinatorStats?.pending_reviews ?? 0);
                          const verifiedCount = submissions.length > 0
                            ? new Set(filteredCoordSubs.filter(s => s.status === 'VERIFIED').map(s => s.user_id)).size
                            : (coordinatorStats?.verified_submissions ?? 0);

                          return (
                            <>
                              <div>
                                <div className="flex items-center gap-2.5 mb-3">
                                  <div className="w-1.5 h-5 bg-zinc-900 dark:bg-white rounded-full" />
                                  <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white tracking-tight">My Class Summary</h3>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
                                  <StatCard title="Class Students" value={totalClassStudents} icon={<Users />} color="bg-blue-500" />
                                  <StatCard title="Responded Students" value={respondedCount} icon={<CheckCircle2 />} color="bg-indigo-500" />
                                  <StatCard title="Pending Verification" value={pendingCount} icon={<Clock />} color="bg-orange-500" />
                                  <StatCard title="Verified Students" value={verifiedCount} icon={<CheckCircle2 />} color="bg-emerald-500" />
                                </div>
                              </div>

                              <div
                                className="bg-zinc-900 dark:bg-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-7 text-white flex flex-row items-center justify-between gap-3 sm:gap-6 cursor-pointer hover:bg-black transition-all group shadow-md"
                                onClick={() => setView('verifications')}
                              >
                                <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                                  <div className="w-11 h-11 sm:w-14 sm:h-14 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                                    <ShieldCheck size={24} className="text-white" />
                                  </div>
                                  <div className="min-w-0">
                                    <h3 className="text-base sm:text-2xl font-bold truncate">Coordinator Workspace</h3>
                                    <p className="text-xs sm:text-sm text-zinc-400 truncate sm:whitespace-normal">Verify class submissions</p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0">
                                  <span className="text-2xl sm:text-4xl font-black text-amber-400">{submissions.filter(s => {
                                    const std = users.find(u => u.id === s.user_id);
                                    const cid = s.class_id || std?.class_id;
                                    return s.status === 'SUBMITTED' && cid && String(cid) === String(user?.class_id);
                                  }).length}</span>
                                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-400">Pending</span>
                                </div>
                              </div>

                              <UnifiedAnalyzer role="COORDINATOR" title="Class Achievement Analyzer" />
                            </>
                          );
                        })() : (
                          <div>
                            {/* Prominent Telegram Connect Banner for unlinked students */}
                            {isStudent && !user?.telegram_chat_id && (
                              <div className="mb-6 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-700 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/20">
                                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                                <div className="absolute left-1/3 -top-10 w-32 h-32 bg-sky-400/20 rounded-full blur-xl pointer-events-none" />

                                <div className="flex items-start gap-4 relative z-10">
                                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner border border-white/30 text-white">
                                    <Send size={24} className="-rotate-12 text-sky-200" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider backdrop-blur-md">
                                        Action Recommended
                                      </span>
                                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-200">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Instant Phone Notifications
                                      </span>
                                    </div>
                                    <h2 className="text-lg sm:text-xl font-black mt-1 text-white tracking-tight">
                                      Connect your Telegram for Live Task Alerts & Coding Reports
                                    </h2>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0 relative z-10">
                                  <a
                                    href="https://t.me/it_taskmanager"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full sm:w-auto px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl font-black text-xs sm:text-sm backdrop-blur-md shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                                  >
                                    <Send size={15} className="text-sky-200" />
                                    <span>1️⃣ Join Telegram Group</span>
                                  </a>
                                  <a
                                    href={`https://t.me/IT_TaskManager_Alerts_bot?start=${encodeURIComponent(getStudentRegisterNumber(user) || '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full sm:w-auto px-5 py-2.5 bg-white text-indigo-950 rounded-xl font-black text-xs sm:text-sm shadow-lg hover:bg-sky-50 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                                  >
                                    <Send size={15} className="text-sky-500 -rotate-12" />
                                    <span>2️⃣ Link Bot ({getStudentRegisterNumber(user) || 'Link'})</span>
                                  </a>
                                </div>
                              </div>
                            )}

                            {/* Connected Student Quick Shortcut Card */}
                            {isStudent && user?.telegram_chat_id && (
                              <div className="mb-6 p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={18} />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-black text-zinc-900 truncate flex items-center gap-1.5">
                                      Telegram Alerts Connected 🟢
                                    </h4>
                                    <p className="text-[11px] text-zinc-500 font-medium truncate">
                                      Receiving 1-to-1 task reminders & daily updates
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                                  <a
                                    href="https://t.me/it_taskmanager"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                                  >
                                    <Send size={12} className="text-sky-500" /> Open Group
                                  </a>
                                  <a
                                    href="https://t.me/IT_TaskManager_Alerts_bot"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                                  >
                                    <Send size={12} className="text-indigo-500" /> Open Bot
                                  </a>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <StatCard title="Total Assigned Tasks" value={studentStats?.total_tasks || 0} icon={<ClipboardList />} color="bg-blue-500" />
                              <StatCard title="Submitted" value={studentStats?.submitted_tasks || 0} icon={<Clock />} color="bg-orange-500" />
                              <StatCard title="Verified" value={studentStats?.verified_tasks || 0} icon={<CheckCircle2 />} color="bg-emerald-500" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                              <Card className="border border-zinc-200 flex flex-col justify-between bg-white">
                                <div>
                                  <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-black text-zinc-950 flex items-center gap-1.5 uppercase tracking-wider">
                                      <Code size={16} className="text-orange-500" /> LeetCode Daily Target
                                    </h3>
                                    {myLeetcodeProgress?.dailyStatus === 'COMPLETED' ? (
                                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">MET</span>
                                    ) : (
                                      <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full">PENDING</span>
                                    )}
                                  </div>
                                  <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-4xl font-black text-zinc-900">{myLeetcodeProgress?.solvedToday ?? 0}</span>
                                    <span className="text-xs font-bold text-zinc-400">/ {myLeetcodeProgress?.dailyTarget ?? 0} solved today (Yesterday: {myLeetcodeProgress?.solvedYesterday ?? 0})</span>
                                  </div>
                                </div>
                                <div>
                                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 mb-2 overflow-hidden border border-zinc-200/60 dark:border-zinc-700/80">
                                    <div
                                      className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(251,146,60,0.5)]"
                                      style={{ width: `${Math.min(100, myLeetcodeProgress?.completionDailyPct ?? 0)}%` }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500">
                                    <span>{myLeetcodeProgress?.completionDailyPct ?? 0}% Done</span>
                                    <button onClick={() => setView('leetcode-targets')} className="text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 font-bold">
                                      View Details <ChevronRight size={10} />
                                    </button>
                                  </div>
                                </div>
                              </Card>

                              <Card className="border border-zinc-200 flex flex-col justify-between bg-white">
                                <div>
                                  <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-black text-zinc-950 flex items-center gap-1.5 uppercase tracking-wider">
                                      <Code size={16} className="text-indigo-500" /> LeetCode Weekly Target
                                    </h3>
                                    {myLeetcodeProgress?.weeklyStatus === 'COMPLETED' ? (
                                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">MET</span>
                                    ) : (
                                      <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">PENDING</span>
                                    )}
                                  </div>
                                  <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-4xl font-black text-zinc-900">{myLeetcodeProgress?.solvedThisWeek ?? 0}</span>
                                    <span className="text-xs font-bold text-zinc-400">/ {myLeetcodeProgress?.weeklyTarget ?? 0} solved this week</span>
                                  </div>
                                </div>
                                <div>
                                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 mb-2 overflow-hidden border border-zinc-200/60 dark:border-zinc-700/80">
                                    <div
                                      className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                                      style={{ width: `${Math.min(100, myLeetcodeProgress?.completionWeeklyPct ?? 0)}%` }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500">
                                    <span>{myLeetcodeProgress?.completionWeeklyPct ?? 0}% Done</span>
                                    <button onClick={() => setView('leetcode-targets')} className="text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 font-bold">
                                      View Details <ChevronRight size={10} />
                                    </button>
                                  </div>
                                </div>
                              </Card>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Removed redundant HOD Stats section */}

                    <ContentCard>
                      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                      <div className="space-y-4">
                        {tasks.slice(0, 5).map(task => {
                          const isDeadlinePassed = Boolean(task.deadline && new Date(task.deadline).getTime() < Date.now());
                          return (
                            <div key={task.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl gap-3">
                              <div className="min-w-0 flex-1">
                                <p translate="no" className="font-medium text-zinc-900 truncate notranslate">{task.title}</p>
                                <p className="text-xs text-zinc-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                                  <span>
                                    {Array.isArray(task.class_ids) && task.class_ids.length > 0
                                      ? task.class_ids.map(id => classes.find(c => c.id.toString() === id.toString())?.name || id).join(', ')
                                      : (task.department_name || 'Global Task')
                                    }
                                  </span>
                                  <span>•</span>
                                  <span>{new Date(task.created_at).toLocaleDateString()}</span>
                                  {task.deadline && (
                                    <>
                                      <span>•</span>
                                      <span className={cn(
                                        "font-medium",
                                        isDeadlinePassed ? "text-rose-600 font-semibold" : "text-zinc-600"
                                      )}>
                                        Due: {new Date(task.deadline).toLocaleDateString()}
                                      </span>
                                    </>
                                  )}
                                </p>
                              </div>
                              <div className="shrink-0">
                                {getStudentTaskStatusBadge(task, user, submissions)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ContentCard>
                  </PageLayout>
                </motion.div>

  );
}

export default DashboardView;
