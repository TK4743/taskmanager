import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, GraduationCap, Building2, CheckSquare, Users, Download,
  FileDown, FileText, Loader2, Filter, Layers, Clock, AlertTriangle,
  ClipboardList, ShieldCheck, Camera, Sparkles
} from 'lucide-react';
import { StatusDropdown } from '../common/StatusDropdown';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import type { User, Department, Class, Task } from '../../types';

export interface ReportFiltersState {
  departmentId?: string;
  year?: string;
  classIds?: string[];
  taskId?: string;
  gender?: string;
  status?: string;
}

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isAdmin: boolean;
  isHOD: boolean;
  isAdvisor: boolean;
  departments: Department[];
  classes: Class[];
  tasks: Task[];
  users: User[];
  reportFilters: ReportFiltersState;
  setReportFilters: React.Dispatch<React.SetStateAction<ReportFiltersState>>;
  isExporting: boolean;
  isDownloadingProofs: boolean;
  downloadProgress: number;
  totalDownloads: number;
  proofDownloadFormat: 'ZIP' | 'PDF';
  setProofDownloadFormat: (format: 'ZIP' | 'PDF') => void;
  exportToExcel: (filters?: any) => Promise<void>;
  downloadScreenshotsZip: (taskId?: any, classIds?: any, gender?: any, year?: any, departmentId?: any) => Promise<void>;
  downloadScreenshotsPdf: (taskId?: any, classIds?: any, gender?: any, year?: any, departmentId?: any) => Promise<void>;
  hodStats?: any;
  myClass?: any;
  isCoordinator?: boolean;
  availableScreenshotCount?: number;
  screenshotDownloadProgress?: any;
  abortScreenshotDownloadRef?: React.MutableRefObject<boolean>;
}

export function ExportModal({
  isOpen,
  onClose,
  user,
  isAdmin,
  isHOD,
  isAdvisor,
  departments,
  classes,
  tasks,
  users,
  reportFilters,
  setReportFilters,
  isExporting,
  isDownloadingProofs,
  downloadProgress,
  totalDownloads,
  proofDownloadFormat,
  setProofDownloadFormat,
  exportToExcel,
  downloadScreenshotsZip,
  downloadScreenshotsPdf,
  hodStats,
  myClass,
  isCoordinator = false,
  availableScreenshotCount = 0,
  screenshotDownloadProgress = null,
  abortScreenshotDownloadRef,
}: ExportModalProps) {
  if (!isOpen) return null;

  const setShowExportModal = (show: boolean) => {
    if (!show) onClose();
  };

  const getStudentGender = (userId: string | number): string => {
    const u = users.find(usr => String(usr.id) === String(userId));
    return u?.gender || 'NOT_SPECIFIED';
  };

  return (
                  <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm cursor-pointer" onClick={() => setShowExportModal(false)}>
                <motion.div
                  onClick={e => e.stopPropagation()}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white rounded-[2rem] p-6 md:p-8 max-w-xl w-full shadow-2xl relative border border-zinc-100 max-h-[90vh] overflow-y-auto cursor-default"
                >
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="absolute top-5 right-5 p-2 hover:bg-zinc-100 rounded-full transition-colors"
                  >
                    <X size={20} className="text-zinc-400" />
                  </button>

                  <h3 className="text-2xl font-black text-zinc-900 tracking-tight pr-8">Report Studio</h3>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1.5 mb-6">
                    {isAdmin ? 'System-Wide Report' : isHOD ? 'Department Report' : `Class Report — ${user?.class_name || 'My Class'}`}
                  </p>

                  <div className="space-y-4">

                    {/* HOD / Admin: Class Year Filter */}
                    {(isAdmin || isHOD) && (
                      <div>
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                          <GraduationCap size={11} /> Class Year
                        </label>
                        <select
                          className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          value={reportFilters.year || ''}
                          onChange={(e) => setReportFilters(prev => ({ ...prev, year: e.target.value, classIds: [] }))}
                        >
                          <option value="">All Class Years (1st - 4th Year)</option>
                          <option value="1">1st Year (I Year)</option>
                          <option value="2">2nd Year (II Year)</option>
                          <option value="3">3rd Year (III Year)</option>
                          <option value="4">4th Year (IV Year)</option>
                        </select>
                      </div>
                    )}

                    {/* HOD / Admin: multi-class checkbox picker */}
                    {(isAdmin || isHOD) && (() => {
                      const baseClasses = isAdmin
                        ? classes
                        : (hodStats?.classStats || classes.filter(c => c.department_id?.toString() === user?.department_id?.toString()));
                      const availableClasses = reportFilters.year
                        ? baseClasses.filter((c: any) => String(c.year) === String(reportFilters.year))
                        : baseClasses;
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                              <Users size={11} />
                              Select Classes <span className="normal-case text-zinc-300 font-medium">(pick multiple)</span>
                            </label>
                            {reportFilters.year && (
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                Year {reportFilters.year} Classes
                              </span>
                            )}
                          </div>
                          <div className="max-h-40 overflow-y-auto border border-zinc-100 rounded-2xl bg-zinc-50 p-3 flex flex-col gap-2">
                            {(availableClasses as any[]).slice().sort((a: any, b: any) => (a.year || 0) - (b.year || 0) || (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' })).map((c: any) => {
                              const cid = c.id.toString();
                              const checked = reportFilters.classIds.includes(cid);
                              return (
                                <label key={cid} className="flex items-center gap-3 cursor-pointer group">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => setReportFilters(prev => ({
                                      ...prev,
                                      classIds: checked
                                        ? prev.classIds.filter(id => id !== cid)
                                        : [...prev.classIds, cid]
                                    }))}
                                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                  />
                                  <span className={`text-sm font-bold transition-colors ${checked ? 'text-blue-700' : 'text-zinc-700 group-hover:text-zinc-900'}`}>{c.name}</span>
                                </label>
                              );
                            })}
                          </div>
                          {reportFilters.classIds.length > 0 && (
                            <p className="text-[10px] font-bold text-blue-600 mt-1.5">
                              {reportFilters.classIds.length} class{reportFilters.classIds.length > 1 ? 'es' : ''} selected — report will combine all selected classes
                            </p>
                          )}
                          {reportFilters.classIds.length === 0 && (
                            <p className="text-[10px] font-medium text-zinc-400 mt-1.5">No class selected — will include all classes</p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Class Advisor & Student Coordinator: assigned class indicator */}
                    {(isAdvisor || isCoordinator) && !isAdmin && !isHOD && (
                      <div>
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 block">Assigned Class</label>
                        <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-bold text-zinc-800">
                          {myClass?.name || classes.find(c => c.id.toString() === user?.class_id?.toString())?.name || 'My Class'}
                        </div>
                      </div>
                    )}

                    {/* Task selector */}
                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5"><ClipboardList size={11} /> Task</label>
                      <select
                        className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={reportFilters.taskId}
                        onChange={(e) => setReportFilters(prev => ({ ...prev, taskId: e.target.value }))}
                      >
                        <option value="">All Tasks</option>
                        {tasks.map((t: any) => (
                          <option key={t.id} value={t.id.toString()}>{t.title}</option>
                        ))}
                      </select>
                    </div>

                    {/* Submission Status */}
                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5"><ShieldCheck size={11} /> Submission Status</label>
                      <StatusDropdown
                        value={reportFilters.status || 'ALL'}
                        onChange={(val) => setReportFilters(prev => ({ ...prev, status: val }))}
                      />
                    </div>

                    {/* Gender Filter (All / Boys / Girls) */}
                    {(() => {
                      const selectedClassIds = reportFilters.classIds || [];
                      const selectedYear = reportFilters.year || '';
                      const scopedStudents = users.filter(u => {
                        if (u.role !== 'STUDENT') return false;
                        if (selectedYear) {
                          const uClass = classes.find(c => c.id?.toString() === u.class_id?.toString());
                          if (!uClass || String(uClass.year) !== String(selectedYear)) return false;
                        }
                        if (isAdmin) {
                          if (selectedClassIds.length > 0) return selectedClassIds.includes(u.class_id?.toString() || '');
                          return true;
                        }
                        if (isHOD) {
                          if (u.department_id?.toString() !== user?.department_id?.toString()) return false;
                          if (selectedClassIds.length > 0) return selectedClassIds.includes(u.class_id?.toString() || '');
                          return true;
                        }
                        const userClassId = (user?.class_id || myClass?.id)?.toString();
                        if (isAdvisor || isCoordinator) {
                          return u.class_id?.toString() === userClassId;
                        }
                        if (selectedClassIds.length > 0) return selectedClassIds.includes(u.class_id?.toString() || '');
                        return true;
                      });

                      const totalBoys = scopedStudents.filter(s => getStudentGender(s.id) === 'MALE').length;
                      const totalGirls = scopedStudents.filter(s => getStudentGender(s.id) === 'FEMALE').length;
                      const totalAll = scopedStudents.length;
                      const currentGender = reportFilters.gender || 'ALL';

                      return (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                              <Users size={11} /> Gender Filter
                            </label>
                            <span className="text-[10px] font-bold text-zinc-500">
                              {currentGender === 'BOYS' ? 'Boys Only' : currentGender === 'GIRLS' ? 'Girls Only' : 'All (Split in Excel)'}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 p-1.5 bg-zinc-100/80 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60">
                            <button
                              type="button"
                              onClick={() => setReportFilters(prev => ({ ...prev, gender: 'ALL' }))}
                              className={cn(
                                "flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all",
                                currentGender === 'ALL'
                                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm ring-1 ring-black/5"
                                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                              )}
                            >
                              <span>👥 All</span>
                              {totalAll > 0 && (
                                <span className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded-full font-mono",
                                  currentGender === 'ALL'
                                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                                    : "bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-500"
                                )}>
                                  {totalAll}
                                </span>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setReportFilters(prev => ({ ...prev, gender: 'BOYS' }))}
                              className={cn(
                                "flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all",
                                currentGender === 'BOYS'
                                  ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-400"
                                  : "text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                              )}
                            >
                              <span>👦 Boys</span>
                              {totalBoys > 0 && (
                                <span className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded-full font-mono",
                                  currentGender === 'BOYS'
                                    ? "bg-blue-700 text-blue-100"
                                    : "bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300"
                                )}>
                                  {totalBoys}
                                </span>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setReportFilters(prev => ({ ...prev, gender: 'GIRLS' }))}
                              className={cn(
                                "flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all",
                                currentGender === 'GIRLS'
                                  ? "bg-pink-600 text-white shadow-sm ring-2 ring-pink-400"
                                  : "text-pink-700 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/40"
                              )}
                            >
                              <span>👧 Girls</span>
                              {totalGirls > 0 && (
                                <span className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded-full font-mono",
                                  currentGender === 'GIRLS'
                                    ? "bg-pink-700 text-pink-100"
                                    : "bg-pink-100 dark:bg-pink-900/60 text-pink-800 dark:text-pink-300"
                                )}>
                                  {totalGirls}
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })()}




                    {/* Screenshot count banner */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/80 dark:bg-sky-950/40 border border-blue-100 dark:border-sky-800/60 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 dark:bg-sky-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                          <Camera size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-blue-950 dark:text-sky-100 leading-none mb-1">Student Proof Screenshots</p>
                          <p className="text-[11px] text-blue-700 dark:text-sky-300 font-medium leading-none">
                            {availableScreenshotCount > 0
                              ? `${availableScreenshotCount} proof screenshot${availableScreenshotCount > 1 ? 's' : ''} available for export`
                              : 'No proof screenshots matching current filters'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black px-2.5 py-1 rounded-full bg-blue-100 dark:bg-sky-900/60 text-blue-800 dark:text-sky-200 font-mono shrink-0 border border-blue-200 dark:border-sky-800/80">
                        {availableScreenshotCount} Files
                      </span>
                    </div>

                    {screenshotDownloadProgress ? (
                      <div className="p-4 rounded-2xl bg-zinc-900 text-white space-y-3 shadow-lg">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-2 text-zinc-200">
                            <Loader2 size={15} className="animate-spin text-blue-400" />
                            {screenshotDownloadProgress.statusText}
                          </span>
                          <span className="font-mono text-blue-400 font-black">{screenshotDownloadProgress.percent}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${screenshotDownloadProgress.percent}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-zinc-400">
                          <span>Progress: {screenshotDownloadProgress.current} / {screenshotDownloadProgress.total}</span>
                          <button
                            type="button"
                            onClick={() => { if (abortScreenshotDownloadRef) abortScreenshotDownloadRef.current = true; }}
                            className="font-bold text-red-400 hover:text-red-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <Button
                            onClick={() => exportToExcel(reportFilters)}
                            className="rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center gap-2 py-3 shadow-sm font-bold"
                          >
                            <FileDown size={17} /> Download Excel
                          </Button>
                          <Button
                            onClick={() => downloadScreenshotsPdf(reportFilters)}
                            disabled={availableScreenshotCount === 0}
                            className={cn(
                              "rounded-2xl flex items-center justify-center gap-2 py-3 shadow-sm font-bold transition-all",
                              availableScreenshotCount > 0
                                ? "bg-red-600 hover:bg-red-700 text-white shadow-red-200"
                                : "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
                            )}
                          >
                            <FileText size={17} /> Download Proofs (.PDF)
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <Button
                            onClick={() => downloadScreenshotsZip(reportFilters)}
                            disabled={availableScreenshotCount === 0}
                            variant="secondary"
                            className={cn(
                              "rounded-2xl flex items-center justify-center gap-2 py-3 shadow-sm font-bold transition-all border border-zinc-200",
                              availableScreenshotCount > 0
                                ? "text-zinc-700 hover:bg-zinc-100"
                                : "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
                            )}
                          >
                            <Camera size={17} /> Download Proofs (.ZIP)
                          </Button>
                          <Button
                            onClick={async () => {
                              await exportToExcel(reportFilters);
                              if (availableScreenshotCount > 0) {
                                await downloadScreenshotsPdf(reportFilters);
                              }
                            }}
                            disabled={availableScreenshotCount === 0}
                            className={cn(
                              "rounded-2xl text-white font-bold flex items-center justify-center gap-2 py-3 shadow-sm transition-all",
                              availableScreenshotCount > 0
                                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                                : "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
                            )}
                          >
                            <Sparkles size={16} /> Export Excel + Proofs PDF
                          </Button>
                        </div>
                        <div className="flex justify-end pt-1">
                          <Button
                            variant="ghost"
                            onClick={() => { setShowExportModal(false); setReportFilters({ classIds: [], taskId: '', year: '', status: 'ALL', gender: 'ALL' }); }}
                            className="rounded-2xl text-zinc-500 hover:text-zinc-800 px-4"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

  );
}

export default ExportModal;
