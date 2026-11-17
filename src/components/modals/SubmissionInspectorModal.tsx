import React, { useState } from 'react';
import {
  AlertTriangle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw,
  Maximize2, Copy, Check, FileDown, ExternalLink, X, FileText, Download,
  CheckCircle2, XCircle, Eye, ImageIcon, Mail, User as UserIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import type { Submission } from '../../types';
import type { ProofPreviewData } from '../../ProofPreviewModal';

export interface SubmissionInspectorModalProps {
  inspectingSubmission: Submission | null;
  onClose: () => void;
  filteredList: Submission[];
  onSelectSubmission: (submission: Submission) => void;
  verifySubmission: (id: string | number, status: string, note?: string, reason?: string) => Promise<any> | void;
  onOpenProofPreview?: (data: ProofPreviewData) => void;
  onViewStudentProfile?: (studentId: string) => void;
}

export function SubmissionInspectorModal({
  inspectingSubmission,
  onClose,
  filteredList,
  onSelectSubmission,
  verifySubmission,
  onOpenProofPreview,
  onViewStudentProfile,
}: SubmissionInspectorModalProps) {
  const [inspectingProofZoom, setInspectingProofZoom] = useState(1);
  const [inspectingProofRotation, setInspectingProofRotation] = useState(0);
  const [inspectingCopied, setInspectingCopied] = useState(false);
  const [verificationNote, setVerificationNote] = useState('');

  if (!inspectingSubmission) return null;

  const currentIndex = filteredList.findIndex(s => String(s.id) === String(inspectingSubmission.id));
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < filteredList.length - 1;

  const isPdf = Boolean(
    inspectingSubmission.screenshot_url && 
    (inspectingSubmission.screenshot_url.toLowerCase().includes('.pdf') || inspectingSubmission.screenshot_url.toLowerCase().endsWith('.pdf'))
  );
  const isPurged = Boolean(inspectingSubmission.screenshot_url && inspectingSubmission.screenshot_url.startsWith('PURGED'));
  const hasProof = Boolean(inspectingSubmission.screenshot_url && !isPurged);

  const customVal = inspectingSubmission.custom_field_value?.trim();
  const isCustomUrl = customVal && (/^https?:\/\//i.test(customVal) || /^www\./i.test(customVal) || customVal.includes('github.com') || customVal.includes('leetcode.com') || customVal.includes('drive.google.com'));
  const customTargetUrl = isCustomUrl ? (/^https?:\/\//i.test(customVal) ? customVal : `https://${customVal}`) : null;

  const setInspectingSubmission = (sub: Submission | null) => {
    if (!sub) {
      onClose();
    } else {
      onSelectSubmission(sub);
    }
  };

  const setProofPreviewData = (data: any) => {
    if (onOpenProofPreview) {
      onOpenProofPreview(data);
    }
  };

  return (
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[130] flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200 cursor-pointer"
        onClick={() => {
          setInspectingSubmission(null);
          setInspectingProofZoom(1);
          setInspectingProofRotation(0);
        }}
      >
        <div
          className="bg-white rounded-3xl w-full max-w-6xl h-[92vh] max-h-[920px] flex flex-col shadow-2xl overflow-hidden border border-zinc-200 cursor-default"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Top Bar */}
          <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between gap-3 bg-zinc-50/70 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">
                {inspectingSubmission.task_title}
              </span>
              <span className="text-zinc-300">|</span>
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-extrabold text-zinc-900 text-sm truncate">
                  {inspectingSubmission.student_name}
                </span>
                <span className="text-xs font-mono text-zinc-500 shrink-0">
                  ({inspectingSubmission.register_number || 'No Reg#'})
                </span>
              </div>
              <Badge variant={
                inspectingSubmission.status === 'VERIFIED' ? 'success' :
                inspectingSubmission.status === 'REJECTED' ? 'danger' :
                inspectingSubmission.status === 'NOT_PARTICIPATING' ? 'warning' : 'warning'
              } className="shrink-0 text-xs">
                {inspectingSubmission.status === 'SUBMITTED' ? 'PENDING VERIFICATION' : inspectingSubmission.status === 'NOT_PARTICIPATING' ? 'NOT INTERESTED' : inspectingSubmission.status}
              </Badge>
              {inspectingSubmission.is_duplicate && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shrink-0 animate-pulse" title="Identical SHA-256 match with another student's submission">
                  <AlertTriangle size={12} className="text-amber-500" /> Duplicate File
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Prev / Next Navigation */}
              {currentIndex >= 0 && (
                <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-xl px-2 py-1 shadow-2xs">
                  <span className="text-xs font-bold text-zinc-500 mr-1 hidden sm:inline">
                    {currentIndex + 1} of {filteredList.length}
                  </span>
                  <Button
                    variant="ghost"
                    className="p-1 h-7 w-7 text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-lg disabled:opacity-30"
                    disabled={!hasPrev}
                    onClick={() => {
                      if (hasPrev) {
                        setInspectingSubmission(filteredList[currentIndex - 1]);
                        setInspectingProofZoom(1);
                        setInspectingProofRotation(0);
                      }
                    }}
                    title="Previous Submission (Left Arrow)"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    className="p-1 h-7 w-7 text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-lg disabled:opacity-30"
                    disabled={!hasNext}
                    onClick={() => {
                      if (hasNext) {
                        setInspectingSubmission(filteredList[currentIndex + 1]);
                        setInspectingProofZoom(1);
                        setInspectingProofRotation(0);
                      }
                    }}
                    title="Next Submission (Right Arrow)"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              )}

              <Button
                variant="ghost"
                className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl"
                onClick={() => {
                  setInspectingSubmission(null);
                  setInspectingProofZoom(1);
                  setInspectingProofRotation(0);
                }}
                title="Close (Esc)"
              >
                <X size={20} />
              </Button>
            </div>
          </div>

          {/* Modal Main Content Area (2-column layout) */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* Left / Center: Proof Viewer (7 cols on desktop) */}
            <div className="lg:col-span-7 bg-zinc-950/95 flex flex-col relative overflow-hidden border-b lg:border-b-0 lg:border-r border-zinc-800">
              {/* Amber Duplicate Warning Bar */}
              {inspectingSubmission.is_duplicate && (
                <div className="px-4 py-2 bg-amber-500/20 border-b border-amber-500/30 flex items-center justify-between gap-2 text-amber-200 text-xs z-10 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                    <span className="font-bold truncate">
                      Duplicate Detected: Matches proof from {inspectingSubmission.duplicate_match?.student_name || inspectingSubmission.duplicate_match_name || 'Another Student'}
                      {(inspectingSubmission.duplicate_match?.register_number || inspectingSubmission.duplicate_match_regno) ? ` (${inspectingSubmission.duplicate_match?.register_number || inspectingSubmission.duplicate_match_regno})` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProofPreviewData({
                        url: inspectingSubmission.screenshot_url,
                        title: inspectingSubmission.task_title,
                        filename: inspectingSubmission.original_filename || `Proof_${inspectingSubmission.register_number || 'Student'}_${inspectingSubmission.task_title}`,
                        isDraft: false,
                        duplicateWarning: {
                          isDuplicate: true,
                          originalStudentName: inspectingSubmission.duplicate_match?.student_name || inspectingSubmission.duplicate_match_name || undefined,
                          originalRegisterNumber: inspectingSubmission.duplicate_match?.register_number || inspectingSubmission.duplicate_match_regno || undefined,
                          originalSubmittedAt: inspectingSubmission.duplicate_match?.submitted_at || inspectingSubmission.duplicate_match_submitted_at || undefined,
                        }
                      });
                    }}
                    className="px-2 py-0.5 rounded bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 font-bold text-[11px] shrink-0 transition-colors"
                  >
                    Open Proof Modal
                  </button>
                </div>
              )}

              {/* Proof Toolbar */}
              {hasProof && (
                <div className="px-4 py-2 bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-800/80 flex items-center justify-between text-zinc-300 z-10 shrink-0">
                  <div className="flex items-center gap-1">
                    {!isPdf && (
                      <>
                        <button
                          onClick={() => setInspectingProofZoom(z => Math.min(z + 0.25, 3))}
                          className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-colors"
                          title="Zoom In"
                        >
                          <ZoomIn size={16} />
                        </button>
                        <button
                          onClick={() => setInspectingProofZoom(z => Math.max(z - 0.25, 0.5))}
                          className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-colors"
                          title="Zoom Out"
                        >
                          <ZoomOut size={16} />
                        </button>
                        <button
                          onClick={() => { setInspectingProofZoom(1); setInspectingProofRotation(0); }}
                          className="px-2 py-1 text-[11px] font-bold hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-colors"
                          title="Reset Zoom & Rotation"
                        >
                          {Math.round(inspectingProofZoom * 100)}% Reset
                        </button>
                        <button
                          onClick={() => setInspectingProofRotation(r => (r + 90) % 360)}
                          className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-colors"
                          title="Rotate 90°"
                        >
                          <RotateCw size={16} />
                        </button>
                      </>
                    )}
                    {isPdf && (
                      <span className="text-xs font-bold text-red-400 flex items-center gap-1.5 px-2 py-0.5 bg-red-950/50 rounded-md border border-red-800/50">
                        <FileText size={14} /> PDF Document Proof
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 overflow-hidden">
                    {inspectingSubmission.original_filename ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/90 border border-zinc-700/80 rounded-lg text-zinc-200 text-xs font-mono max-w-[200px] sm:max-w-[320px] truncate" title={`Original Uploaded File: ${inspectingSubmission.original_filename}`}>
                        <FileText size={13} className="text-indigo-400 shrink-0" />
                        <span className="truncate">{inspectingSubmission.original_filename}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(inspectingSubmission.original_filename!);
                            setInspectingCopied('toolbar_filename');
                            setTimeout(() => setInspectingCopied(null), 2000);
                          }}
                          className="text-zinc-400 hover:text-white p-0.5 rounded transition-colors ml-0.5 shrink-0"
                          title="Copy original filename"
                        >
                          {inspectingCopied === 'toolbar_filename' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setProofPreviewData({
                          url: inspectingSubmission.screenshot_url,
                          title: inspectingSubmission.task_title,
                          filename: inspectingSubmission.original_filename || `Proof_${inspectingSubmission.register_number || 'Student'}_${inspectingSubmission.task_title}`,
                          isDraft: false,
                          duplicateWarning: inspectingSubmission.is_duplicate ? {
                            isDuplicate: true,
                            originalStudentName: inspectingSubmission.duplicate_match?.student_name || inspectingSubmission.duplicate_match_name || undefined,
                            originalRegisterNumber: inspectingSubmission.duplicate_match?.register_number || inspectingSubmission.duplicate_match_regno || undefined,
                            originalSubmittedAt: inspectingSubmission.duplicate_match?.submitted_at || inspectingSubmission.duplicate_match_submitted_at || undefined,
                          } : undefined
                        });
                      }}
                      className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors shrink-0"
                      title="Open proof in fullscreen modal preview"
                    >
                      <Eye size={13} /> Proof Modal
                    </button>
                    <a
                      href={inspectingSubmission.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors shrink-0"
                      title="Open original proof in full browser tab"
                    >
                      <ExternalLink size={13} /> Open Original
                    </a>
                    <a
                      href={inspectingSubmission.screenshot_url}
                      download={inspectingSubmission.original_filename || `Proof_${inspectingSubmission.register_number || 'Student'}_${inspectingSubmission.task_title}`}
                      className="p-1.5 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg transition-colors shrink-0"
                      title={`Download Proof File (${inspectingSubmission.original_filename || 'original'})`}
                    >
                      <Download size={16} />
                    </a>
                  </div>
                </div>
              )}

              {/* Proof Container */}
              <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center p-4 relative select-none">
                {isPdf ? (
                  <div className="w-full h-full min-h-[450px] bg-white rounded-2xl overflow-hidden shadow-inner flex flex-col">
                    <iframe
                      src={inspectingSubmission.screenshot_url}
                      className="w-full flex-1 border-0 rounded-2xl"
                      title="PDF Proof Document"
                    />
                    <div className="p-3 bg-zinc-100 border-t border-zinc-200 flex items-center justify-between text-xs">
                      <span className="text-zinc-600 font-medium">Viewing PDF submission</span>
                      <a
                        href={inspectingSubmission.screenshot_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                      >
                        <ExternalLink size={13} /> Open in PDF Reader
                      </a>
                    </div>
                  </div>
                ) : hasProof ? (
                  <div className="w-full h-full flex items-center justify-center overflow-auto">
                    <img
                      src={inspectingSubmission.screenshot_url}
                      alt="Student Task Proof"
                      style={{
                        transform: `scale(${inspectingProofZoom}) rotate(${inspectingProofRotation}deg)`,
                        transition: 'transform 0.15s ease-out'
                      }}
                      className="max-h-full max-w-full object-contain rounded-lg shadow-2xl origin-center cursor-grab active:cursor-grabbing"
                    />
                  </div>
                ) : isPurged ? (
                  <div className="text-center p-8 max-w-md bg-zinc-900/80 rounded-2xl border border-zinc-800 text-zinc-400 space-y-3">
                    <ImageIcon size={48} className="mx-auto text-zinc-600" />
                    <h4 className="text-base font-bold text-zinc-200">Proof Screenshot Purged</h4>
                    <p className="text-xs leading-relaxed text-zinc-400">
                      This submission screenshot has been automatically purged according to the 30-day retention policy. The student's completion record, verified score, and custom field values remain permanent.
                    </p>
                  </div>
                ) : (
                  <div className="text-center p-8 max-w-md bg-zinc-900/80 rounded-2xl border border-zinc-800 text-zinc-400 space-y-3">
                    <AlertTriangle size={48} className="mx-auto text-orange-400" />
                    <h4 className="text-base font-bold text-zinc-200">
                      {inspectingSubmission.status === 'NOT_PARTICIPATING' ? 'Not Participating Opt-Out' : 'No Proof Uploaded'}
                    </h4>
                    <p className="text-xs text-zinc-400">
                      {inspectingSubmission.not_participating_reason
                        ? `Student reason: "${inspectingSubmission.not_participating_reason}"`
                        : 'No screenshot proof was submitted for this entry.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Complete Student & Task Details (5 cols on desktop) */}
            <div className="lg:col-span-5 flex flex-col h-full bg-white overflow-y-auto divide-y divide-zinc-100">
              {/* Duplicate Submission Warning Alert Card */}
              {inspectingSubmission.is_duplicate && (
                <div className="p-4 bg-amber-50 border-b border-amber-200/80 flex items-start gap-3 text-amber-900 shrink-0">
                  <div className="p-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 shrink-0 mt-0.5">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="text-xs space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black uppercase tracking-wider text-amber-900 text-[11px] flex items-center gap-1.5">
                        <AlertTriangle size={12} className="text-amber-600" /> Duplicate Submission Detected
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-200/80 text-amber-900 border border-amber-300">
                        SHA-256 Match
                      </span>
                    </div>
                    <p className="text-amber-950 leading-relaxed font-medium">
                      Identical proof matches earlier submission by{' '}
                      <strong className="text-zinc-900 font-extrabold">
                        {inspectingSubmission.duplicate_match?.student_name || inspectingSubmission.duplicate_match_name || 'Another Student'}
                      </strong>
                      {(inspectingSubmission.duplicate_match?.register_number || inspectingSubmission.duplicate_match_regno) ? ` (${inspectingSubmission.duplicate_match?.register_number || inspectingSubmission.duplicate_match_regno})` : ''}
                      {(inspectingSubmission.duplicate_match?.submitted_at || inspectingSubmission.duplicate_match_submitted_at) ? ` submitted on ${new Date(inspectingSubmission.duplicate_match?.submitted_at || inspectingSubmission.duplicate_match_submitted_at!).toLocaleString()}` : ''}.
                    </p>
                    {inspectingSubmission.proof_file_hash && (
                      <p className="font-mono text-[10px] text-amber-800/80 truncate pt-0.5" title={`SHA-256: ${inspectingSubmission.proof_file_hash}`}>
                        Hash: {inspectingSubmission.proof_file_hash}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Student Profile Card */}
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {inspectingSubmission.student_avatar ? (
                      <img
                        src={inspectingSubmission.student_avatar}
                        alt=""
                        className="w-12 h-12 rounded-2xl object-cover border border-zinc-200 shadow-2xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold text-base">
                        {inspectingSubmission.student_name ? inspectingSubmission.student_name.charAt(0).toUpperCase() : 'S'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-extrabold text-zinc-900 text-base leading-snug">
                        {inspectingSubmission.student_name}
                      </h3>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="font-mono text-xs text-zinc-600 font-bold bg-zinc-100 px-1.5 py-0.5 rounded">
                          {inspectingSubmission.register_number || 'No Reg#'}
                        </span>
                        {inspectingSubmission.register_number && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(inspectingSubmission.register_number!);
                              setInspectingCopied('reg');
                              setTimeout(() => setInspectingCopied(null), 2000);
                            }}
                            className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded"
                            title="Copy Register Number"
                          >
                            {inspectingCopied === 'reg' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="text-xs px-2.5 py-1.5 h-auto text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-bold shrink-0"
                    onClick={() => {
                      const studentId = String(inspectingSubmission.user_id);
                      setInspectingSubmission(null);
                      setInspectingProofZoom(1);
                      setInspectingProofRotation(0);
                      if (onViewStudentProfile) onViewStudentProfile(studentId);
                    }}
                    title="Open full student academic profile with placement metrics"
                  >
                    <UserIcon size={13} /> Full Profile
                  </Button>
                </div>

                {/* Badges: Department, Class, Year */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {inspectingSubmission.department_name && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200/80">
                      Dept: {inspectingSubmission.department_name}
                    </span>
                  )}
                  {inspectingSubmission.class_name && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-100">
                      Class: {inspectingSubmission.class_name}
                    </span>
                  )}
                  {inspectingSubmission.class_year && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-100">
                      Year: {inspectingSubmission.class_year}
                    </span>
                  )}
                  {inspectingSubmission.student_email && (
                    <a
                      href={`mailto:${inspectingSubmission.student_email}`}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border border-zinc-200/70 flex items-center gap-1 truncate max-w-[200px]"
                      title={`Email ${inspectingSubmission.student_email}`}
                    >
                      <Mail size={11} className="shrink-0" />
                      <span className="truncate">{inspectingSubmission.student_email}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Task & Submission Details */}
              <div className="p-5 space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Submission Details</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Submitted On</span>
                    <span className="font-bold text-zinc-800 block mt-0.5">
                      {new Date(inspectingSubmission.submitted_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Resubmission Count</span>
                    <span className="font-bold text-zinc-800 block mt-0.5">
                      {inspectingSubmission.resubmission_count || 0} / 2 allowed
                    </span>
                  </div>
                </div>

                {/* Custom Field Value Display */}
                <div className="p-3.5 bg-zinc-50/90 rounded-2xl border border-zinc-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-600">
                      {inspectingSubmission.custom_field_label || 'Submitted Custom Field'}
                    </span>
                    {customVal && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(customVal);
                          setInspectingCopied('custom');
                          setTimeout(() => setInspectingCopied(null), 2000);
                        }}
                        className="text-xs text-zinc-500 hover:text-black flex items-center gap-1 font-semibold"
                        title="Copy Custom Field Value"
                      >
                        {inspectingCopied === 'custom' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        <span>{inspectingCopied === 'custom' ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>

                  {customVal ? (
                    isCustomUrl ? (
                      <a
                        href={customTargetUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 bg-indigo-50/90 hover:bg-indigo-100/90 border border-indigo-200 rounded-xl text-indigo-700 font-bold text-xs transition-colors group"
                      >
                        <span className="truncate pr-2 font-mono">{customVal}</span>
                        <ExternalLink size={14} className="shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </a>
                    ) : (
                      <p className="font-mono text-xs text-zinc-900 bg-white p-2.5 rounded-xl border border-zinc-200 break-all leading-relaxed">
                        {customVal}
                      </p>
                    )
                  ) : (
                    <p className="text-xs text-zinc-400 italic">No custom field data provided.</p>
                  )}
                </div>

                {/* Uploaded Proof File Info */}
                {hasProof && (
                  <div className="p-3.5 bg-zinc-50/90 rounded-2xl border border-zinc-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
                        <FileText size={13} className="text-indigo-600" /> Original File Name
                      </span>
                      {inspectingSubmission.original_filename && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(inspectingSubmission.original_filename!);
                            setInspectingCopied('right_filename');
                            setTimeout(() => setInspectingCopied(null), 2000);
                          }}
                          className="text-xs text-zinc-500 hover:text-black flex items-center gap-1 font-semibold"
                          title="Copy original file name"
                        >
                          {inspectingCopied === 'right_filename' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          <span>{inspectingCopied === 'right_filename' ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-white border border-zinc-200 rounded-xl">
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg shrink-0">
                          {isPdf ? <FileText size={18} /> : <ImageIcon size={18} />}
                        </span>
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-bold text-zinc-900 block truncate" title={inspectingSubmission.original_filename || (isPdf ? 'PDF Proof' : 'Proof Image')}>
                            {inspectingSubmission.original_filename || (isPdf ? 'Proof_Document.pdf' : 'Proof_Screenshot.png')}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                            {isPdf ? 'PDF Document' : 'Proof Image'}
                          </span>
                        </div>
                      </div>
                      {inspectingSubmission.screenshot_url && !isPurged && (
                        <a
                          href={inspectingSubmission.screenshot_url}
                          download={inspectingSubmission.original_filename || `Proof_${inspectingSubmission.register_number || 'Student'}_${inspectingSubmission.task_title}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-zinc-500 hover:text-indigo-600 hover:bg-zinc-50 rounded-lg transition-colors shrink-0"
                          title="Download / Open Proof"
                        >
                          <Download size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Existing verification note or rejection reason */}
                {inspectingSubmission.verification_note && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-0.5">
                    <p className="font-extrabold text-emerald-900 uppercase text-[10px] tracking-wider">Verification Note</p>
                    <p className="text-emerald-800 font-medium">"{inspectingSubmission.verification_note}"</p>
                    {inspectingSubmission.status === 'VERIFIED' && inspectingSubmission.verified_at && (
                      <p className="text-[10px] text-emerald-600 pt-1">Verified on {new Date(inspectingSubmission.verified_at).toLocaleDateString()}</p>
                    )}
                  </div>
                )}
                {inspectingSubmission.rejection_reason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-0.5">
                    <p className="font-extrabold text-red-900 uppercase text-[10px] tracking-wider">Rejection Feedback</p>
                    <p className="text-red-800 font-medium">"{inspectingSubmission.rejection_reason}"</p>
                  </div>
                )}
              </div>

              {/* Verification / Rejection Action Area */}
              <div className="p-5 mt-auto bg-zinc-50/70 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 flex items-center justify-between">
                    <span>Verification Note / Feedback</span>
                    <span className="text-[10px] text-zinc-400 font-normal">Optional for approval, required for rejection</span>
                  </label>
                  <Input
                    placeholder="e.g. Approved, excellent submission! Or specific feedback..."
                    value={verificationNote}
                    onChange={e => setVerificationNote(e.target.value)}
                    className="text-xs h-9 bg-white"
                  />
                </div>

                {/* Quick rejection reason chips */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Quick Feedback Chips:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Unclear / blurry screenshot",
                      "Incorrect proof for this task",
                      "Submitted link is inaccessible",
                      "Guidelines not fulfilled"
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setVerificationNote(chip)}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-zinc-200 hover:border-zinc-400 text-zinc-600 transition-colors"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <Button
                    variant="success"
                    className="flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                    onClick={async () => {
                      await verifySubmission(inspectingSubmission.id, 'VERIFIED', verificationNote);
                    }}
                  >
                    <CheckCircle2 size={16} /> Approve & Verify
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                    onClick={async () => {
                      const reason = verificationNote.trim() || 'Submission does not satisfy criteria';
                      await verifySubmission(inspectingSubmission.id, 'REJECTED', undefined, reason);
                    }}
                  >
                    <XCircle size={16} /> Reject Submission
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

}

export default SubmissionInspectorModal;
