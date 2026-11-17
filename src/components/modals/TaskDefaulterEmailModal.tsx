import React from 'react';
import { Mail, Send, CheckCircle2, Loader2, Sparkles, Zap } from 'lucide-react';
import { FloatingModal } from './FloatingModal';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { cn } from '../../lib/utils';
import type { Task, User } from '../../types';

export interface TaskDefaulterEmailModalProps {
  emailAlertTask: Task | null;
  onClose: () => void;
  emailAlertPendingData: any;
  emailAlertSuccessStats: any;
  emailAlertSending: boolean;
  emailAlertLoading: boolean;
  emailNodesStatus: any;
  fetchingEmailStatus: boolean;
  fetchEmailNodesStatus: () => void;
  emailAlertCustomMsg: string;
  setEmailAlertCustomMsg: (msg: string) => void;
  handleDispatchTaskPendingEmails: () => void;
  user: User | null;
  isAdmin: boolean;
  isHOD: boolean;
  isAdvisor: boolean;
}

export function TaskDefaulterEmailModal({
  emailAlertTask,
  onClose,
  emailAlertPendingData,
  emailAlertSuccessStats,
  emailAlertSending,
  emailAlertLoading,
  emailNodesStatus,
  fetchingEmailStatus,
  fetchEmailNodesStatus,
  emailAlertCustomMsg,
  setEmailAlertCustomMsg,
  handleDispatchTaskPendingEmails,
  user,
  isAdmin,
  isHOD,
  isAdvisor,
}: TaskDefaulterEmailModalProps) {
  if (!emailAlertTask) return null;

  const assignedClassNames =
    emailAlertPendingData?.assignedClasses?.map((c: any) => c.name).join(', ') || 'All Assigned Classes';
  const pendingStudents = emailAlertPendingData?.students || [];

  return (
    <FloatingModal
      isOpen={Boolean(emailAlertTask)}
      onClose={onClose}
      title="Send Pending Submission Alert"
      subtitle={`Dispatches official academic reminder emails to incomplete students across ${assignedClassNames}.`}
      icon={<Mail size={22} className="text-amber-600" />}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="ghost" onClick={onClose} disabled={emailAlertSending}>
            {emailAlertSuccessStats ? 'Done' : 'Cancel'}
          </Button>

          {!emailAlertSuccessStats && (
            <Button
              onClick={handleDispatchTaskPendingEmails}
              disabled={emailAlertSending || emailAlertLoading || !pendingStudents.length}
              className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white hover:from-amber-700 hover:to-red-700 font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
            >
              {emailAlertSending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Dispatching via Nodes...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Send Alert to {pendingStudents.length} Incomplete Students</span>
                </>
              )}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {/* Task Summary Banner */}
        <div className="bg-gradient-to-r from-zinc-900 to-indigo-950 rounded-2xl p-5 text-white shadow-sm border border-zinc-800">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
              TARGET TASK
            </span>
            <span className="text-xs font-bold text-zinc-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
              {emailAlertTask.category || 'Academic Task'}
            </span>
          </div>
          <h4 className="text-base md:text-lg font-black text-white mb-2 leading-tight">
            {emailAlertTask.title}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300 pt-2 border-t border-white/10">
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Assigned Class(es):</span>
              <span className="font-semibold text-white">{assignedClassNames}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Submission Deadline:</span>
              <span className="font-semibold text-amber-300">
                {emailAlertTask.deadline
                  ? new Date(emailAlertTask.deadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                  : 'No deadline'}
              </span>
            </div>
          </div>
        </div>

        {emailAlertLoading ? (
          <div className="py-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
            <div className="space-y-2 pt-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ) : emailAlertSuccessStats ? (
          /* Success Results Display */
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={30} />
            </div>
            <div>
              <h4 className="text-lg font-black text-emerald-950 dark:text-emerald-200">Email Reminders Processed!</h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-1">
                {emailAlertSuccessStats.message || `Dispatched to ${emailAlertSuccessStats.sentCount} incomplete students.`}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl border border-emerald-150 dark:border-emerald-900 shadow-xs">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">Total Targeted</span>
                <span className="text-base font-black text-zinc-900 dark:text-zinc-100">{emailAlertSuccessStats.totalStudents || 0}</span>
              </div>
              <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl border border-emerald-150 dark:border-emerald-900 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-600 uppercase block">Sent via Nodes</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{emailAlertSuccessStats.sentCount || 0}</span>
              </div>
              <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl border border-emerald-150 dark:border-emerald-900 shadow-xs">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">Failed / Skipped</span>
                <span className="text-base font-black text-zinc-700 dark:text-zinc-300">{emailAlertSuccessStats.failedCount || 0}</span>
              </div>
            </div>

            {emailAlertSuccessStats.errors && emailAlertSuccessStats.errors.length > 0 && (
              <div className="text-left bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <span className="font-bold block text-[11px] text-amber-800 dark:text-amber-400 uppercase">Delivery Notices:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {emailAlertSuccessStats.errors.map((err: string, i: number) => (
                    <li key={i} className="truncate">{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Live Dispatch Pool & Real-Time Credits Card */}
            <div className="bg-gradient-to-br from-zinc-50 to-amber-50/40 dark:from-zinc-900 dark:to-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                    Live Email Dispatch Pool & Credits
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {fetchingEmailStatus && <Loader2 size={12} className="animate-spin text-zinc-400" />}
                  <button
                    type="button"
                    onClick={fetchEmailNodesStatus}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-0.5 underline cursor-pointer"
                  >
                    Refresh Credits
                  </button>
                </div>
              </div>

              {emailNodesStatus ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {emailNodesStatus.nodes?.map((node: any) => (
                    <div
                      key={node.nodeId}
                      className={cn(
                        "p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all shadow-2xs",
                        node.status === 'HEALTHY'
                          ? "bg-white dark:bg-zinc-800 border-emerald-200/80 dark:border-emerald-800 text-zinc-800 dark:text-zinc-200"
                          : node.status === 'QUOTA_EXHAUSTED'
                            ? "bg-red-50/50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-300"
                            : "bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300"
                      )}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full shrink-0",
                              node.status === 'HEALTHY'
                                ? "bg-emerald-500 shadow-xs shadow-emerald-500/50"
                                : node.status === 'QUOTA_EXHAUSTED'
                                  ? "bg-red-500"
                                  : "bg-amber-500"
                            )}
                          />
                          <span className="font-extrabold truncate text-[11px]">{node.nodeId}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 truncate block font-mono">
                          {node.senderEmail}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={cn(
                          "font-mono font-extrabold text-[12px] block",
                          node.status === 'HEALTHY' ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                        )}>
                          {typeof node.credits === 'number'
                            ? `${node.credits} left`
                            : node.status === 'HEALTHY'
                              ? 'Active Relay'
                              : node.status}
                        </span>
                        <span className="text-[9px] text-zinc-400 font-semibold block">
                          {node.planType || node.provider}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-2 text-xs text-zinc-400 font-medium">
                  Checking multi-node pool health...
                </div>
              )}
            </div>

            {/* Incomplete Student Overview */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 bg-zinc-50 dark:bg-zinc-900 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                    Incomplete Students ({pendingStudents.length})
                  </span>
                </div>
                <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                  {pendingStudents.filter((s: any) => s.email).length} with registered email
                </span>
              </div>

              {pendingStudents.length === 0 ? (
                <div className="text-center py-6 bg-white dark:bg-zinc-800 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
                  <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">All assigned students have submitted!</p>
                  <p className="text-[11px] text-zinc-400">Zero pending submissions found for this task.</p>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 bg-white dark:bg-zinc-800 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 custom-scrollbar">
                  {pendingStudents.map((s: any, idx: number) => (
                    <div key={s.id || idx} className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-xs border border-zinc-100 dark:border-zinc-800 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-colors">
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate">{s.full_name || 'Student'}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">{s.register_number} • {s.class_name}</span>
                      </div>
                      <span className="text-[10px] font-medium text-zinc-500 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 truncate max-w-[180px]">
                        {s.email || 'No email registered'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Optional Custom Directive */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                <span>Optional Directive / Custom Remarks</span>
                <span className="text-[10px] font-normal text-zinc-400 lowercase">(embedded inside official email)</span>
              </label>
              <textarea
                value={emailAlertCustomMsg}
                onChange={e => setEmailAlertCustomMsg(e.target.value)}
                placeholder="e.g., Mandatory internal task compliance. Submit your valid completion certificate by 4:00 PM today without fail."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none font-medium text-zinc-800 dark:text-zinc-200 bg-white dark:bg-[#181820]"
              />
            </div>

            {/* Load Balancer Transparency Badge */}
            <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-xl p-3 flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200">
              <Zap size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="leading-snug text-[11px] font-medium">
                Emails will be automatically distributed round-robin across <b>Node 1</b> and <b>Node 2</b> with zero-downtime failover to maximize deliverability.
              </p>
            </div>
          </>
        )}
      </div>
    </FloatingModal>
  );
}

export default TaskDefaulterEmailModal;
