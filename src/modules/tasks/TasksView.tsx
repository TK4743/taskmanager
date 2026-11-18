import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Users, Trophy, BookOpen, Briefcase, Building2, ClipboardList, Plus, Loader2,
  Share2, Trash2, Clock, AlertTriangle, CheckCircle2, XCircle, ExternalLink,
  FileText, Upload, ImageIcon, Eye, FileCheck, Info, Mail, Maximize2, ChevronRight,
  Calendar, X, Copy
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { PageLayout } from '../../components/layout/PageLayout';
import { CategoryDropdown } from '../../components/common/CategoryDropdown';
import { FormattedTaskDescription } from '../../components/common/FormattedTaskDescription';
import { TaskDescriptionEditor } from '../../components/common/TaskDescriptionEditor';
import {
  getOptimizedImgUrl, getCloudinaryThumbnail, getStudentTaskStatusBadge, renderCategoryIcon
} from '../../components/common/helpers';
import { cn } from '../../lib/utils';
import { API_URL } from '../../config';
import type { ProofPreviewData } from '../../components/modals/ProofPreviewModal';
import type { Task, Submission, Department, ClassItem, TeamInvitation, User, Team } from '../../types';

const ContentCard = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm w-full", className)} {...props}>
    {children}
  </div>
);

export interface TasksViewProps {
  user: User | null;
  token: string | null;
  tasks: Task[];
  submissions: Submission[];
  departments: Department[];
  classes: ClassItem[];
  myInvitations: TeamInvitation[];
  myTeams?: Team[];
  isAdmin: boolean;
  isHOD: boolean;
  isAdvisor: boolean;
  isCoordinator: boolean;
  isStudent: boolean;
  fetchTasks: () => void;
  fetchSubmissions: () => void;
  fetchCoordinatorStats?: () => void;
  deleteTask: (id: number | string) => Promise<void>;
  toggleTaskStatus: (id: number | string, currentStatus: string) => Promise<void>;
  openTeamModal: (task: Task) => void;
  handleRespondInvitation: (invitationId: string, response: 'ACCEPT' | 'REJECT' | 'DECLINE') => Promise<void>;
  openTaskPendingEmailModal: (task: Task) => void;
  setExtendingTask: (task: Task | null) => void;
  setExtendedDeadline: (d: string) => void;
  setShowExtendModal: (show: boolean) => void;
  setProofPreviewData: (data: ProofPreviewData | null) => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  highlightedTaskId?: string | null;
}

export function TasksView({
  user,
  token,
  tasks,
  submissions,
  departments,
  classes,
  myInvitations,
  myTeams = [],
  isAdmin,
  isHOD,
  isAdvisor,
  isCoordinator,
  isStudent,
  fetchTasks,
  fetchSubmissions,
  fetchCoordinatorStats,
  deleteTask,
  toggleTaskStatus,
  openTeamModal,
  handleRespondInvitation,
  openTaskPendingEmailModal,
  setExtendingTask,
  setExtendedDeadline,
  setShowExtendModal,
  setProofPreviewData,
  addToast,
  highlightedTaskId
}: TasksViewProps) {
  // Task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: '',
    external_link: '',
    deadline: '',
    screenshot_instruction: '',
    custom_field_label: '',
    department_id: '',
    class_ids: [] as (string | number)[],
    submission_type: 'INDIVIDUAL',
    min_team_size: 2,
    max_team_size: 5
  });

  const [savedScreenshotOptions, setSavedScreenshotOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vsb_predefined_screenshot_options');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [savedFieldLabelOptions, setSavedFieldLabelOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vsb_predefined_field_labels');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [dbMetaOptions, setDbMetaOptions] = useState<{
    categories: string[];
    screenshot_instructions: string[];
    custom_field_labels: string[];
  }>({ categories: [], screenshot_instructions: [], custom_field_labels: [] });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_URL}/api/tasks/meta/options`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setDbMetaOptions({
            categories: Array.isArray(data.categories) ? data.categories : [],
            screenshot_instructions: Array.isArray(data.screenshot_instructions) ? data.screenshot_instructions : [],
            custom_field_labels: Array.isArray(data.custom_field_labels) ? data.custom_field_labels : []
          });
        }
      })
      .catch(() => {});
  }, []);

  const allTaskCategories = useMemo(() => {
    const set = new Set<string>();
    dbMetaOptions.categories.forEach(c => set.add(c));
    tasks.forEach(t => {
      if (t.category && t.category.trim()) set.add(t.category.trim());
    });
    if (set.size === 0) {
      ['Competition', 'Course', 'Workshop', 'College Work'].forEach(c => set.add(c));
    }
    return Array.from(set).sort();
  }, [dbMetaOptions.categories, tasks]);

  const allScreenshotOptions = useMemo(() => {
    const set = new Set<string>();
    set.add('Upload registration confirmation screenshot');
    savedScreenshotOptions.forEach(s => set.add(s));
    return Array.from(set);
  }, [savedScreenshotOptions]);

  const allFieldLabelOptions = useMemo(() => {
    const set = new Set<string>();
    set.add('Have you registered?');
    set.add('Team Name');
    savedFieldLabelOptions.forEach(l => set.add(l));
    return Array.from(set);
  }, [savedFieldLabelOptions]);

  const getCategoryBadgeStyle = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('competition') || cat.includes('hackathon')) return 'bg-rose-50 text-rose-600 border-rose-100';
    if (cat.includes('course') || cat.includes('certif')) return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    if (cat.includes('workshop') || cat.includes('train')) return 'bg-amber-50 text-amber-600 border-amber-100';
    if (cat.includes('college') || cat.includes('assign')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (cat.includes('project') || cat.includes('research')) return 'bg-purple-50 text-purple-600 border-purple-100';
    return 'bg-zinc-50 text-zinc-600 border-zinc-200';
  };

  const [isCustomScreenshot, setIsCustomScreenshot] = useState(false);
  const [isCustomFieldLabel, setIsCustomFieldLabel] = useState(false);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [showTaskPreview, setShowTaskPreview] = useState(false);

  // Filters & submission staging
  const [studentTaskFilter, setStudentTaskFilter] = useState<'ALL' | 'PENDING_ACTION' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'NOT_INTERESTED' | 'OVERDUE'>('ALL');
  const [customFieldValue, setCustomFieldValue] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Record<number, File>>({});
  const [isDraggingScreenshot, setIsDraggingScreenshot] = useState<number | null>(null);
  const [notParticipating, setNotParticipating] = useState<Record<number, boolean>>({});
  const [notParticipatingReason, setNotParticipatingReason] = useState<Record<number, string>>({});
  const [isEditingOptOut, setIsEditingOptOut] = useState<Record<number, boolean>>({});
  const [uploading, setUploading] = useState<number | null>(null);

  // Modals inside TasksView
  const [selectedPosterModal, setSelectedPosterModal] = useState<string | null>(null);
  const [sharedTaskModal, setSharedTaskModal] = useState<Task | null>(null);

  // Highlight scroll
  useEffect(() => {
    if (highlightedTaskId && tasks.length > 0) {
      const el = document.getElementById(`task-${highlightedTaskId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedTaskId, tasks]);

  const studentSubmissionsMap = useMemo(() => {
    const map = new Map<string, Submission>();
    if (!user?.id) return map;
    const uidStr = String(user.id);
    for (let i = 0; i < submissions.length; i++) {
      const s = submissions[i];
      if (String(s.user_id) === uidStr) {
        map.set(String(s.task_id), s);
      }
    }
    // Also include team submissions for teams the current student belongs to
    for (const team of (myTeams || [])) {
      if (!team.task_id) continue;
      const isMember = String(team.leader_id) === uidStr || (team.members && team.members.some(m => String(m.student_id) === uidStr && m.status === 'ACCEPTED'));
      if (isMember && team.submission && !map.has(String(team.task_id))) {
        const subStatus = team.submission.status === 'APPROVED' ? 'VERIFIED' : (team.submission.status === 'REJECTED' ? 'REJECTED' : 'SUBMITTED');
        map.set(String(team.task_id), {
          id: team.submission.id,
          task_id: team.task_id,
          task_title: team.task_title || '',
          submission_type: 'TEAM',
          user_id: user.id,
          status: subStatus,
          created_at: team.submission.created_at,
          screenshot_url: team.submission.proof_url,
          cloudinary_public_id: team.submission.cloudinary_public_id,
          remarks: team.submission.remarks
        } as any);
      }
    }
    return map;
  }, [user, submissions, myTeams]);

  const handleSaveCustomScreenshot = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed || trimmed === 'Upload registration confirmation screenshot' || savedScreenshotOptions.includes(trimmed)) return;
    const updated = [...savedScreenshotOptions, trimmed];
    setSavedScreenshotOptions(updated);
    try {
      localStorage.setItem('vsb_predefined_screenshot_options', JSON.stringify(updated));
    } catch {}
    addToast('Saved screenshot instruction for reuse!', 'success');
  };

  const handleSaveCustomFieldLabel = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed || trimmed === 'Have you registered?' || trimmed === 'Team Name' || savedFieldLabelOptions.includes(trimmed)) return;
    const updated = [...savedFieldLabelOptions, trimmed];
    setSavedFieldLabelOptions(updated);
    try {
      localStorage.setItem('vsb_predefined_field_labels', JSON.stringify(updated));
    } catch {}
    addToast('Saved verification label for reuse!', 'success');
  };

  const handlePosterSelect = (file: File | null) => {
    if (!file) {
      setPosterFile(null);
      setPosterPreview(null);
      return;
    }
    const isImg = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isImg && !isPdf) {
      addToast('Please select a valid image or PDF file for the poster.', 'error');
      return;
    }
    setPosterFile(file);
    if (isPdf) {
      setPosterPreview('PDF_DOCUMENT');
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPosterPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const copyTaskShareLink = (taskId: string | number) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?taskId=${taskId}`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        addToast('Task share link copied to clipboard!', 'success');
      }).catch(() => {
        prompt('Copy Task Share Link:', shareUrl);
      });
    } else {
      prompt('Copy Task Share Link:', shareUrl);
    }
  };

  const handleTaskPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.category || !newTask.category.trim()) {
      addToast('Please select a category for the task.', 'error');
      return;
    }
    if (isHOD && (!newTask.class_ids || newTask.class_ids.length === 0)) {
      addToast('Please select at least one class for the task.', 'error');
      return;
    }
    setShowTaskPreview(true);
  };

  const createTask = async () => {
    if (!newTask.category || !newTask.category.trim()) {
      addToast('Please select a category for the task.', 'error');
      return;
    }
    if (isHOD && (!newTask.class_ids || newTask.class_ids.length === 0)) {
      addToast('Please select at least one class for the task.', 'error');
      return;
    }

    setIsUploadingPoster(true);
    let poster_url: string | null = null;
    let poster_cloudinary_public_id: string | null = null;

    try {
      if (posterFile) {
        const formData = new FormData();
        formData.append('poster', posterFile);
        const uploadRes = await fetch(`${API_URL}/api/upload/poster`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          poster_url = uploadData.poster_url;
          poster_cloudinary_public_id = uploadData.poster_cloudinary_public_id;
        } else {
          addToast('Poster image upload failed. Posting task without poster image.', 'warning');
        }
      }

      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...newTask,
          poster_url,
          poster_cloudinary_public_id
        })
      });

      if (res.ok) {
        const createdTask = await res.json();
        // Auto-save custom screenshot instruction & field label for reuse across future tasks
        if (newTask.screenshot_instruction && newTask.screenshot_instruction.trim() !== 'Upload registration confirmation screenshot' && !savedScreenshotOptions.includes(newTask.screenshot_instruction.trim())) {
          const updated = [...savedScreenshotOptions, newTask.screenshot_instruction.trim()];
          setSavedScreenshotOptions(updated);
          try {
            localStorage.setItem('vsb_predefined_screenshot_options', JSON.stringify(updated));
          } catch {}
        }
        if (newTask.custom_field_label && newTask.custom_field_label.trim() !== 'Have you registered?' && newTask.custom_field_label.trim() !== 'Team Name' && !savedFieldLabelOptions.includes(newTask.custom_field_label.trim())) {
          const updated = [...savedFieldLabelOptions, newTask.custom_field_label.trim()];
          setSavedFieldLabelOptions(updated);
          try {
            localStorage.setItem('vsb_predefined_field_labels', JSON.stringify(updated));
          } catch {}
        }
        setIsCustomScreenshot(false);
        setIsCustomFieldLabel(false);
        setNewTask({ title: '', description: '', category: 'Competition', external_link: '', deadline: '', screenshot_instruction: '', custom_field_label: '', department_id: '', class_ids: [], submission_type: 'INDIVIDUAL', min_team_size: 2, max_team_size: 5 });
        setPosterFile(null);
        setPosterPreview(null);
        setShowTaskPreview(false);
        addToast('Task created successfully!', 'success');
        fetchTasks();
        setSharedTaskModal(createdTask);
      } else {
        const data = await res.json();
        addToast(`Failed to create task: ${data.error}`, 'error');
        setShowTaskPreview(false);
      }
    } catch (e) {
      addToast('Network error while creating task. Please try again.', 'error');
      setShowTaskPreview(false);
    } finally {
      setIsUploadingPoster(false);
    }
  };

  const submitTask = async (taskId: number | string) => {
    const fileForTask = selectedFiles[Number(taskId)];
    if (!fileForTask) return addToast('Screenshot is required to participate.', 'error');
    if (!customFieldValue.trim()) return addToast('Please fill the required custom field.', 'error');

    setUploading(Number(taskId));

    // Client-side compression
    const compressImage = (file: File): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            } else {
              if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
            }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) resolve(blob); else reject(new Error('Canvas failed'));
            }, 'image/jpeg', 0.8);
          };
          img.onerror = reject;
        };
        reader.onerror = reject;
      });
    };

    try {
      let fileToUpload: Blob | File = fileForTask;
      if (fileForTask.type.startsWith('image/')) {
        addToast('Compressing image...', 'info');
        fileToUpload = await compressImage(fileForTask);
      }

      const formData = new FormData();
      formData.append('task_id', taskId.toString());
      formData.append('screenshot', fileToUpload, fileForTask.name);
      formData.append('original_filename', fileForTask.name);
      formData.append('custom_field_value', customFieldValue);

      const res = await fetch(`${API_URL}/api/submissions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        setSelectedFiles(prev => {
          const next = { ...prev };
          delete next[Number(taskId)];
          return next;
        });
        setCustomFieldValue('');
        addToast('Task submitted successfully!', 'success');
        // Only refresh submissions after submitting
        fetchSubmissions();
        if (user?.role === 'STUDENT' && user?.is_coordinator) {
          fetchCoordinatorStats();
        }
      } else {
        const data = await res.json();
        addToast(`Submission failed: ${data.error}`, 'error');
      }
    } catch (e) {
      addToast('Network error during submission', 'error');
    }
    setUploading(null);
  };

  const submitNotParticipating = async (taskId: number | string) => {
    const reason = notParticipatingReason[Number(taskId)] || '';
    if (!reason.trim()) return addToast('Please enter your reason for not participating.', 'error');
    setUploading(Number(taskId));
    try {
      const res = await fetch(`${API_URL}/api/submissions/not-participating`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, not_participating_reason: reason.trim() })
      });
      if (res.ok) {
        setNotParticipating(prev => ({ ...prev, [Number(taskId)]: false }));
        setNotParticipatingReason(prev => ({ ...prev, [Number(taskId)]: '' }));
        setIsEditingOptOut(prev => ({ ...prev, [Number(taskId)]: false }));
        addToast('Recorded: Not participating in this task.', 'info');
        fetchSubmissions();
        if (user?.role === 'STUDENT' && user?.is_coordinator) {
          fetchCoordinatorStats();
        }
      } else {
        const data = await res.json();
        addToast(`Failed: ${data.error}`, 'error');
      }
    } catch {
      addToast('Network error. Please try again.', 'error');
    }
    setUploading(null);
  };

  const handleFileUpload = (taskId: number | string, file: File | null) => {
    if (file) {
      // Add a 5MB size limit restriction as requested
      if (file.size > 5 * 1024 * 1024) {
        addToast('Image size exceeds 5MB limit. Please select a smaller file.', 'error');
        return;
      }
      setSelectedFiles(prev => ({ ...prev, [Number(taskId)]: file }));
    }
  };

  const handleDeleteScreenshot = (taskId: number | string) => {
    setSelectedFiles(prev => {
      const next = { ...prev };
      delete next[Number(taskId)];
      return next;
    });
    const fileInput = document.getElementById(`file-${taskId}`) as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = '';
    }
    addToast('Screenshot removed.', 'info');
  };


  return (
    <>
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full h-full flex flex-col min-h-0"
                >
                  <PageLayout>
                    {isStudent && myInvitations.length > 0 && (
                      <div className="space-y-4 mb-8">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                            <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-950 flex items-center gap-2">
                              <Users size={18} className="text-indigo-600" />
                              Pending Team Formation Invitation{myInvitations.length > 1 ? 's' : ''} ({myInvitations.length})
                            </h3>
                          </div>
                        </div>
                        {myInvitations.map(inv => (
                          <div
                            key={inv.id}
                            className="p-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-2xl shadow-xl border border-indigo-700/50 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all hover:shadow-2xl"
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                                <Users size={24} className="text-indigo-200" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                                    Team Invitation
                                  </span>
                                  {inv.task_category && (
                                    <span className="bg-purple-500/30 text-purple-200 border border-purple-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                      {inv.task_category}
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-base font-extrabold text-white leading-snug">
                                  You are invited to join team <span className="text-amber-300 underline font-black">"{inv.team_name}"</span>
                                </h4>
                                <p className="text-xs text-indigo-200 font-medium flex items-center gap-1.5 flex-wrap">
                                  <span>Invited by: <strong className="text-white">{inv.inviter_name || 'Classmate'}</strong></span>
                                  <span>•</span>
                                  <span>Task: <strong className="text-indigo-100">{inv.task_title}</strong></span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-indigo-700/50">
                              <Button
                                type="button"
                                onClick={() => handleRespondInvitation(inv.id, 'ACCEPT')}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs px-5 py-2.5 rounded-xl border-none shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer"
                              >
                                <CheckCircle2 size={16} /> Accept Invitation
                              </Button>
                              <Button
                                type="button"
                                onClick={() => handleRespondInvitation(inv.id, 'DECLINE')}
                                className="bg-white/10 hover:bg-white/20 text-indigo-100 hover:text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/20 backdrop-blur-sm transition-all cursor-pointer"
                              >
                                Decline
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {(isAdmin || isHOD || isAdvisor || isCoordinator) && (
                      <ContentCard>
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-zinc-900">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-black text-white">
                            <Plus size={20} />
                          </div>
                          Post New Task
                        </h3>
                        <form onSubmit={handleTaskPreview} className="space-y-4 w-full">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
                            <div className="min-w-0">
                              <Input
                                placeholder="Official Task Title"
                                value={newTask.title}
                                onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                                required
                              />
                            </div>
                            <div className="min-w-0">
                              <CategoryDropdown
                                value={newTask.category}
                                onChange={val => setNewTask(prev => ({ ...prev, category: val }))}
                                categories={allTaskCategories}
                              />
                            </div>
                            <div className="min-w-0">
                              <Input
                                placeholder="Application / Reference Documentation URL (Optional)"
                                value={newTask.external_link}
                                onChange={e => setNewTask(prev => ({ ...prev, external_link: e.target.value }))}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-col gap-1.5">
                                <div className="relative flex items-center">
                                  <input
                                    type="datetime-local"
                                    value={newTask.deadline}
                                    onChange={e => setNewTask(prev => ({ ...prev, deadline: e.target.value }))}
                                    required
                                    title="Select Deadline Date and Time"
                                    min={(() => { const d = new Date(); const pad = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; })()}
                                    className="w-full h-11 px-4 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-sm bg-white text-zinc-800 cursor-pointer [color-scheme:light]"
                                  />
                                </div>
                                {/* Quick shortcut pills & selected formatted preview */}
                                <div className="flex flex-wrap gap-1 items-center">
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-0.5">Quick:</span>
                                  {[
                                    { label: '+1 Day', ms: 24 * 60 * 60 * 1000 },
                                    { label: '+3 Days', ms: 3 * 24 * 60 * 60 * 1000 },
                                    { label: '+7 Days', ms: 7 * 24 * 60 * 60 * 1000 },
                                    { label: '+30 Days', ms: 30 * 24 * 60 * 60 * 1000 },
                                  ].map(({ label, ms }) => {
                                    const d = new Date(Date.now() + ms);
                                    const pad = (n: number) => String(n).padStart(2, '0');
                                    const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                                    return (
                                      <button
                                        key={label}
                                        type="button"
                                        onClick={() => setNewTask(prev => ({ ...prev, deadline: iso }))}
                                        className="px-2 py-0.5 text-[11px] font-medium rounded-md border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:border-zinc-300 transition-all"
                                      >
                                        {label}
                                      </button>
                                    );
                                  })}
                                  {newTask.deadline && (
                                    <button
                                      type="button"
                                      onClick={() => setNewTask(prev => ({ ...prev, deadline: '' }))}
                                      className="px-2 py-0.5 text-[11px] font-medium rounded-md border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-all ml-auto"
                                    >
                                      Clear
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* Screenshot Instruction – Dropdown with Custom option */}
                            <div className="min-w-0 space-y-2">
                              <Select
                                value={
                                  newTask.screenshot_instruction === 'Upload registration confirmation screenshot'
                                    ? 'Upload registration confirmation screenshot'
                                    : savedScreenshotOptions.includes(newTask.screenshot_instruction)
                                      ? newTask.screenshot_instruction
                                      : isCustomScreenshot || newTask.screenshot_instruction
                                        ? '__custom__'
                                        : ''
                                }
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val === '__custom__') {
                                    setIsCustomScreenshot(true);
                                    if (newTask.screenshot_instruction === 'Upload registration confirmation screenshot' || savedScreenshotOptions.includes(newTask.screenshot_instruction)) {
                                      setNewTask(prev => ({ ...prev, screenshot_instruction: '' }));
                                    }
                                  } else {
                                    setIsCustomScreenshot(false);
                                    setNewTask(prev => ({ ...prev, screenshot_instruction: val }));
                                  }
                                }}
                                required
                              >
                                <option value="" disabled>Screenshot Instruction (Select Option)</option>
                                <option value="Upload registration confirmation screenshot">Upload registration confirmation screenshot</option>
                                {savedScreenshotOptions.filter(o => o !== 'Upload registration confirmation screenshot').map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                                <option value="__custom__">Other / Custom</option>
                              </Select>

                              {(isCustomScreenshot || (newTask.screenshot_instruction && newTask.screenshot_instruction !== 'Upload registration confirmation screenshot' && !savedScreenshotOptions.includes(newTask.screenshot_instruction))) && (
                                <div className="space-y-1">
                                  <Input
                                    placeholder="Enter detailed proof guidelines and required screenshot criteria..."
                                    value={newTask.screenshot_instruction}
                                    onChange={e => setNewTask(prev => ({ ...prev, screenshot_instruction: e.target.value }))}
                                    required
                                    autoFocus
                                  />
                                  {newTask.screenshot_instruction.trim() && !savedScreenshotOptions.includes(newTask.screenshot_instruction.trim()) && newTask.screenshot_instruction.trim() !== 'Upload registration confirmation screenshot' && (
                                    <div className="flex items-center justify-between px-1">
                                      <span className="text-[11px] text-zinc-400">Custom instruction</span>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveCustomScreenshot(newTask.screenshot_instruction)}
                                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                                      >
                                        + Save option for future tasks
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Custom Verification Field Label – Dropdown with Custom option */}
                            <div className="min-w-0 space-y-2">
                              <Select
                                value={
                                  (newTask.custom_field_label === 'Have you registered?' || newTask.custom_field_label === 'Team Name')
                                    ? newTask.custom_field_label
                                    : savedFieldLabelOptions.includes(newTask.custom_field_label)
                                      ? newTask.custom_field_label
                                      : isCustomFieldLabel || newTask.custom_field_label
                                        ? '__custom__'
                                        : ''
                                }
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val === '__custom__') {
                                    setIsCustomFieldLabel(true);
                                    if (newTask.custom_field_label === 'Have you registered?' || newTask.custom_field_label === 'Team Name' || savedFieldLabelOptions.includes(newTask.custom_field_label)) {
                                      setNewTask(prev => ({ ...prev, custom_field_label: '' }));
                                    }
                                  } else {
                                    setIsCustomFieldLabel(false);
                                    setNewTask(prev => ({ ...prev, custom_field_label: val }));
                                  }
                                }}
                                required
                              >
                                <option value="" disabled>Custom Verification Field Label (Select Option)</option>
                                <option value="Have you registered?">Have you registered?</option>
                                <option value="Team Name">Team Name</option>
                                {savedFieldLabelOptions.filter(o => o !== 'Have you registered?' && o !== 'Team Name').map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                                <option value="__custom__">Other / Custom</option>
                              </Select>

                              {(isCustomFieldLabel || (newTask.custom_field_label && newTask.custom_field_label !== 'Have you registered?' && newTask.custom_field_label !== 'Team Name' && !savedFieldLabelOptions.includes(newTask.custom_field_label))) && (
                                <div className="space-y-1">
                                  <Input
                                    placeholder="Enter custom verification attribute label (e.g. Problem URL, Team ID)..."
                                    value={newTask.custom_field_label}
                                    onChange={e => setNewTask(prev => ({ ...prev, custom_field_label: e.target.value }))}
                                    required
                                    autoFocus
                                  />
                                  {newTask.custom_field_label.trim() && !savedFieldLabelOptions.includes(newTask.custom_field_label.trim()) && newTask.custom_field_label.trim() !== 'Have you registered?' && newTask.custom_field_label.trim() !== 'Team Name' && (
                                    <div className="flex items-center justify-between px-1">
                                      <span className="text-[11px] text-zinc-400">Custom label</span>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveCustomFieldLabel(newTask.custom_field_label)}
                                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                                      >
                                        + Save option for future tasks
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Task Submission Type Selector */}
                            <div className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 md:col-span-2 space-y-3">
                              <label className="text-xs font-bold text-zinc-600 uppercase tracking-widest block">
                                Task Submission Type
                              </label>
                              <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm text-zinc-800">
                                  <input
                                    type="radio"
                                    name="submission_type"
                                    value="INDIVIDUAL"
                                    checked={newTask.submission_type === 'INDIVIDUAL'}
                                    onChange={() => setNewTask(prev => ({ ...prev, submission_type: 'INDIVIDUAL' }))}
                                    className="w-4 h-4 text-black border-zinc-300 focus:ring-black"
                                  />
                                  <span>Individual Task</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm text-zinc-800">
                                  <input
                                    type="radio"
                                    name="submission_type"
                                    value="TEAM"
                                    checked={newTask.submission_type === 'TEAM'}
                                    onChange={() => setNewTask(prev => ({ ...prev, submission_type: 'TEAM' }))}
                                    className="w-4 h-4 text-indigo-600 border-zinc-300 focus:ring-indigo-500"
                                  />
                                  <span className="flex items-center gap-1.5 font-bold text-indigo-600">
                                    <Users size={16} /> Team Task
                                  </span>
                                </label>
                              </div>

                              {newTask.submission_type === 'TEAM' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-200">
                                  <div>
                                    <label className="text-xs font-bold text-zinc-600 mb-1 block">
                                      Minimum Team Size
                                    </label>
                                    <Input
                                      type="number"
                                      min={2}
                                      max={10}
                                      value={newTask.min_team_size}
                                      onChange={e => setNewTask(prev => ({ ...prev, min_team_size: parseInt(e.target.value, 10) || 2 }))}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-bold text-zinc-600 mb-1 block">
                                      Maximum Team Size
                                    </label>
                                    <Input
                                      type="number"
                                      min={2}
                                      max={20}
                                      value={newTask.max_team_size}
                                      onChange={e => setNewTask(prev => ({ ...prev, max_team_size: parseInt(e.target.value, 10) || 5 }))}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {isAdmin && (
                              <div className="min-w-0">
                                <Select
                                  value={newTask.department_id || ''}
                                  onChange={e => setNewTask(prev => ({ ...prev, department_id: e.target.value, class_ids: [] }))}
                                >
                                  <option value="">Global Task (Visible to All)</option>
                                  {[...departments].sort((a, b) => a.name.localeCompare(b.name)).map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                  ))}
                                </Select>
                              </div>
                            )}

                            {(isAdmin || isHOD) && (
                              <div className="w-full bg-white border border-zinc-200 rounded-lg p-3 md:col-span-2 min-w-0">
                                <div className="flex items-center justify-between mb-3">
                                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-widest block">
                                    {isAdmin ? 'Select Specific Classes (Optional)' : 'Assign to Classes'}
                                  </label>
                                  {(() => {
                                    const availClasses = classes.filter(c => {
                                      if (isAdmin) {
                                        return !newTask.department_id || String(c.department_id) === String(newTask.department_id);
                                      }
                                      return !user?.department_id || String(c.department_id) === String(user?.department_id);
                                    });
                                    const allSelected = availClasses.length > 0 && availClasses.every(c => (newTask.class_ids || []).map(String).includes(String(c.id)));
                                    return (
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (allSelected) {
                                              setNewTask(prev => ({ ...prev, class_ids: [] }));
                                            } else {
                                              setNewTask(prev => ({ ...prev, class_ids: availClasses.map(c => c.id) }));
                                            }
                                          }}
                                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                                        >
                                          {allSelected ? 'Deselect All' : `Select All (${availClasses.length})`}
                                        </button>
                                      </div>
                                    );
                                  })()}
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                  {classes
                                    .filter(c => {
                                      if (isAdmin) {
                                        return !newTask.department_id || String(c.department_id) === String(newTask.department_id);
                                      }
                                      return !user?.department_id || String(c.department_id) === String(user?.department_id);
                                    })
                                    .sort((a, b) => (a.year || 0) - (b.year || 0) || (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' }))
                                    .map(c => (
                                      <label key={c.id} className="flex items-center gap-2 p-2 hover:bg-zinc-50 rounded-md cursor-pointer transition-colors border border-transparent hover:border-zinc-200">
                                        <input
                                          type="checkbox"
                                          className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black/20 font-medium text-xs cursor-pointer"
                                          checked={(newTask.class_ids || []).map(String).includes(String(c.id))}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setNewTask(prev => ({ ...prev, class_ids: [...(prev.class_ids || []), c.id] }));
                                            } else {
                                              setNewTask(prev => ({ ...prev, class_ids: (prev.class_ids || []).filter(id => String(id) !== String(c.id)) }));
                                            }
                                          }}
                                        />
                                        <span className="text-sm font-medium text-zinc-700">{c.name}</span>
                                      </label>
                                    ))}
                                </div>
                                <p className="text-xs text-zinc-500 mt-3 bg-zinc-50 p-2 rounded min-h-[2.5rem] flex items-center font-medium">
                                  {(newTask.class_ids || []).length === 0 ? (
                                    <>
                                      <Info size={14} className="inline mr-1 text-zinc-400 shrink-0" /> No specific classes selected. This task will act as a {newTask.department_id ? 'Class-Wide' : 'Global'} broadcast to everyone applicable.
                                    </>
                                  ) : (
                                    <>
                                      Assigned to: {(newTask.class_ids || []).map(id => classes.find(c => String(c.id) === String(id))?.name || id).join(', ')}
                                    </>
                                  )}
                                </p>
                              </div>
                            )}

                            <div className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 md:col-span-2 min-w-0">
                              <label className="text-xs font-bold text-zinc-600 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                                <ImageIcon size={14} /> Hackathon / Event Poster (Image or PDF) (Optional)
                              </label>
                              {posterPreview ? (
                                <div className="relative rounded-lg overflow-hidden border border-zinc-200 bg-white p-3 flex items-center justify-between group">
                                  {posterPreview === 'PDF_DOCUMENT' ? (
                                    <div className="flex items-center gap-3">
                                      <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                                        <FileText size={24} />
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-zinc-900">{posterFile?.name || 'Event_Poster.pdf'}</p>
                                        <p className="text-xs text-zinc-500 font-medium">PDF Document Poster Attached</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <img src={posterPreview} alt="Poster preview" className="max-h-48 rounded object-contain" />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handlePosterSelect(null)}
                                    className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow"
                                    title="Remove poster"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : (
                                <label className="border-2 border-dashed border-zinc-200 hover:border-black rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-white hover:bg-zinc-50">
                                  <Upload size={24} className="text-zinc-400 mb-1" />
                                  <span className="text-xs font-bold text-zinc-700">Click or Drag & Drop poster (Image or PDF) here</span>
                                  <span className="text-[10px] text-zinc-400 font-medium">Upload poster banner or PDF flyer (e.g. Hackathon, Workshop, Event Poster)</span>
                                  <input
                                    type="file"
                                    accept="image/*,.pdf,application/pdf"
                                    className="hidden"
                                    onChange={e => handlePosterSelect(e.target.files?.[0] || null)}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                          <TaskDescriptionEditor
                            placeholder="Comprehensive task brief, procedural steps, and submission guidelines..."
                            value={newTask.description}
                            onChange={val => setNewTask(prev => ({ ...prev, description: val }))}
                            required
                          />
                          <div className="flex gap-4">
                            <Button type="submit" variant="secondary" className="flex-1">
                              <ImageIcon size={18} /> Live Preview
                            </Button>
                            <Button type="button" onClick={createTask} disabled={isUploadingPoster} className="flex-1">
                              {isUploadingPoster ? <Loader2 size={18} className="animate-spin" /> : <ClipboardList size={18} />} Post Task
                            </Button>
                          </div>
                        </form>
                      </ContentCard>
                    )}

                    <div className="space-y-4 pb-12">
                      {isStudent && myInvitations.length > 0 && (
                        <div className="space-y-3 mb-6">
                          {myInvitations.map(inv => (
                            <div key={inv.id} className="p-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                  <Users size={20} className="text-white" />
                                </div>
                                <div>
                                  <p className="font-bold text-sm">Team Invitation Received!</p>
                                  <p className="text-xs text-indigo-100 font-medium">
                                    {inv.inviter_name || 'Classmate'} invited you to join team <span className="font-bold text-white">"{inv.team_name}"</span> for task <span className="font-bold text-white">"{inv.task_title}"</span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  onClick={() => handleRespondInvitation(inv.id, 'ACCEPT')}
                                  className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs px-4 py-2 rounded-xl border-none shadow-sm"
                                >
                                  Accept Invitation
                                </Button>
                                <Button
                                  onClick={() => handleRespondInvitation(inv.id, 'DECLINE')}
                                  className="bg-white/20 hover:bg-white/30 text-white font-semibold text-xs px-4 py-2 rounded-xl border border-white/30"
                                >
                                  Decline
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {isStudent && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar mb-4">
                          <button
                            type="button"
                            onClick={() => setStudentTaskFilter('ALL')}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border cursor-pointer",
                              studentTaskFilter === 'ALL' ? "bg-black text-white border-black shadow-sm" : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                            )}
                          >
                            All Tasks ({tasks.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentTaskFilter('PENDING_ACTION')}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border cursor-pointer flex items-center gap-1.5",
                              studentTaskFilter === 'PENDING_ACTION' ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                            )}
                          >
                            <Clock size={14} /> Pending Action
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentTaskFilter('UNDER_REVIEW')}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border cursor-pointer flex items-center gap-1.5",
                              studentTaskFilter === 'UNDER_REVIEW' ? "bg-amber-600 text-white border-amber-600 shadow-sm" : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                            )}
                          >
                            <Clock size={14} /> Under Review
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentTaskFilter('VERIFIED')}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border cursor-pointer flex items-center gap-1.5",
                              studentTaskFilter === 'VERIFIED' ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            )}
                          >
                            <CheckCircle2 size={14} /> Verified
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentTaskFilter('REJECTED')}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border cursor-pointer flex items-center gap-1.5",
                              studentTaskFilter === 'REJECTED' ? "bg-red-600 text-white border-red-600 shadow-sm" : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                            )}
                          >
                            <XCircle size={14} /> Rejected
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentTaskFilter('NOT_INTERESTED')}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border cursor-pointer flex items-center gap-1.5",
                              studentTaskFilter === 'NOT_INTERESTED' ? "bg-orange-600 text-white border-orange-600 shadow-sm" : "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                            )}
                          >
                            <AlertTriangle size={14} /> Not Interested
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentTaskFilter('OVERDUE')}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border cursor-pointer flex items-center gap-1.5",
                              studentTaskFilter === 'OVERDUE' ? "bg-rose-600 text-white border-rose-600 shadow-sm" : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                            )}
                          >
                            <AlertTriangle size={14} /> Overdue / Closed
                          </button>
                        </div>
                      )}

                      {(() => {
                        const filteredTasks = [...tasks].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).filter(task => {
                          if (!isStudent || studentTaskFilter === 'ALL') return true;
                          const sub = studentSubmissionsMap.get(String(task.id));
                          const isDeadlinePassed = task.deadline && new Date(task.deadline) < new Date();
                          const isClosed = task.status === 'CLOSED' || isDeadlinePassed;

                          if (studentTaskFilter === 'PENDING_ACTION') return !sub && !isClosed;
                          if (studentTaskFilter === 'UNDER_REVIEW') return sub?.status === 'SUBMITTED';
                          if (studentTaskFilter === 'VERIFIED') return sub?.status === 'VERIFIED';
                          if (studentTaskFilter === 'REJECTED') return sub?.status === 'REJECTED';
                          if (studentTaskFilter === 'NOT_INTERESTED') return sub?.status === 'NOT_PARTICIPATING';
                          if (studentTaskFilter === 'OVERDUE') return !sub && isClosed;
                          return true;
                        });

                        if (filteredTasks.length === 0) {
                          return (
                            <Card className="p-10 text-center border-dashed border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl my-4">
                              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <ClipboardList size={24} />
                              </div>
                              <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                                No Tasks Found in this Category
                              </h4>
                              <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
                                {studentTaskFilter === 'REJECTED'
                                  ? 'You have zero rejected submissions. Great job!'
                                  : studentTaskFilter === 'NOT_INTERESTED'
                                  ? 'You have not marked any tasks as skipped or not interested.'
                                  : 'No tasks currently match your selected filter.'}
                              </p>
                              {studentTaskFilter !== 'ALL' && (
                                <Button
                                  variant="outline"
                                  onClick={() => setStudentTaskFilter('ALL')}
                                  className="text-xs font-bold"
                                >
                                  View All Tasks
                                </Button>
                              )}
                            </Card>
                          );
                        }

                        return filteredTasks.map(task => {
                        const submission = studentSubmissionsMap.get(String(task.id));
                        const isDeadlinePassed = task.deadline && new Date(task.deadline) < new Date();
                        const isWithin24h = task.deadline && !isDeadlinePassed && (new Date(task.deadline).getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000;

                        const catStyle = getCategoryBadgeStyle(task.category);
                        const isHighlighted = String(highlightedTaskId) === String(task.id);

                        return (
                          <Card
                            key={task.id}
                            id={`task-${task.id}`}
                            className={cn(
                              "group hover:shadow-md transition-all duration-300",
                              isHighlighted ? "ring-2 ring-indigo-500 bg-indigo-50/15 shadow-xl" : ""
                            )}
                          >
                            {task.poster_url && (
                              <div className="relative mb-5 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-200 group/poster max-h-80 flex items-center justify-center">
                                {task.poster_url.toLowerCase().includes('.pdf') ? (
                                  <div
                                    onClick={() => setSelectedPosterModal(task.poster_url || null)}
                                    className="w-full p-6 bg-gradient-to-r from-red-900/80 via-zinc-900 to-zinc-950 text-white flex items-center justify-between cursor-pointer group-hover/poster:opacity-90 transition-opacity"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="p-3 bg-red-600 text-white rounded-xl shadow-lg">
                                        <FileText size={28} />
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-white">Event / Hackathon Poster (PDF)</p>
                                        <p className="text-xs text-zinc-400 font-medium">Click to View or Download PDF Flyer</p>
                                      </div>
                                    </div>
                                    <span className="text-xs font-bold flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                      <Maximize2 size={14} /> Open PDF
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    <img
                                      src={task.poster_url}
                                      alt={`${task.title} Poster`}
                                      className="w-full h-full max-h-80 object-cover object-center group-hover/poster:scale-105 transition-transform duration-500 cursor-pointer"
                                      onClick={() => setSelectedPosterModal(task.poster_url || null)}
                                    />
                                    <div
                                      className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/poster:opacity-100 transition-opacity flex items-end justify-between p-4 cursor-pointer"
                                      onClick={() => setSelectedPosterModal(task.poster_url || null)}
                                    >
                                      <span className="text-white text-xs font-bold flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                        <Maximize2 size={14} /> Click to View Full Poster
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}

                            <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5", catStyle)}>
                                    {renderCategoryIcon(task.category || '', 12)}
                                    <span>{task.category || 'General'}</span>
                                  </span>
                                  {task.submission_type === 'TEAM' && (
                                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <Users size={12} /> Team (Min {task.min_team_size || 2} - Max {task.max_team_size || 5})
                                    </span>
                                  )}
                                  <h4 translate="no" className="font-bold text-zinc-900 text-lg md:text-xl break-words notranslate">{task.title}</h4>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                  <span className="font-medium text-zinc-700">{task.creator_name}</span>
                                  <span className="hidden md:inline">•</span>
                                  <span>{new Date(task.created_at).toLocaleDateString()}</span>
                                  <span className="hidden md:inline">•</span>
                                  {Array.isArray(task.class_ids) && task.class_ids.length > 0 ? (
                                    (() => {
                                      const names = task.class_ids
                                        .map(id => classes.find(c => String(c.id) === String(id))?.name)
                                        .filter((name): name is string => Boolean(name));
                                      const displayText = names.length > 0 ? names.join(', ') : 'Assigned Section';
                                      return (
                                        <span
                                          className="bg-purple-50 text-purple-600 border border-purple-100 px-2.5 py-0.5 rounded-full text-xs font-semibold max-w-[240px] md:max-w-md truncate inline-block align-middle"
                                          title={displayText}
                                        >
                                          {displayText}
                                        </span>
                                      );
                                    })()
                                  ) : (
                                    <span className={cn(
                                      "px-2 py-0.5 rounded-full border border-transparent whitespace-nowrap",
                                      task.department_name ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-orange-50 text-orange-600 border-orange-100"
                                    )}>
                                      {task.department_name ? 'Class Task' : 'Global Task'}
                                    </span>
                                  )}
                                  {(!isStudent || isCoordinator) && (
                                    <>
                                      <span className="hidden md:inline">•</span>
                                      <span className="bg-zinc-100 text-zinc-700 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 whitespace-nowrap border border-zinc-200 font-semibold text-xs">
                                        <Users size={12} className="text-zinc-500" /> {task.submission_count || 0} {isHOD || isAdmin ? 'submitted (All Sections)' : 'submitted (Class)'}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="text-left md:text-right shrink-0 flex flex-col items-start md:items-end gap-2">
                                <div>
                                  <p className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1 md:justify-end">
                                    <Clock size={12} /> Deadline
                                  </p>
                                  <p className={cn(
                                    "text-sm font-bold flex flex-col md:items-end",
                                    isDeadlinePassed ? "text-red-500" : (isWithin24h ? "text-orange-500" : "text-zinc-600")
                                  )}>
                                    {task.deadline ? new Date(task.deadline).toLocaleString() : "No deadline"}
                                    {isDeadlinePassed ? (
                                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-extrabold mt-1 uppercase">Deadline Passed</span>
                                    ) : isWithin24h ? (
                                      <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-extrabold mt-1 uppercase">Due within 24h</span>
                                    ) : task.deadline ? (
                                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold mt-1">
                                        {(() => {
                                          const diffMs = new Date(task.deadline).getTime() - Date.now();
                                          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                          const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                          return `${diffDays}d ${diffHours}h remaining`;
                                        })()}
                                      </span>
                                    ) : null}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="text-zinc-600 text-sm mb-6 break-words">
                              <FormattedTaskDescription content={task.description} />
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mb-6">
                              <button
                                type="button"
                                onClick={() => copyTaskShareLink(task.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-colors"
                                title="Share Task Link"
                              >
                                <Share2 size={14} /> Share Task Link
                              </button>

                              {task.external_link && (
                                <a
                                  href={task.external_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-blue-600 hover:underline text-xs font-semibold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
                                >
                                  <ExternalLink size={14} /> Apply Link
                                </a>
                              )}
                            </div>

                            {isStudent && task.status === 'OPEN' && (
                              <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200 mt-6 shadow-sm space-y-4">
                                {task.submission_type === 'TEAM' ? (
                                  <div className="space-y-3">
                                    {(() => {
                                      const pendingInvForTask = myInvitations.find(inv => String(inv.task_id) === String(task.id));
                                      if (pendingInvForTask) {
                                        return (
                                          <div className="p-4 bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-700 text-white rounded-xl shadow-md flex flex-wrap items-center justify-between gap-4">
                                            <div className="space-y-0.5">
                                              <div className="flex items-center gap-2">
                                                <Badge variant="primary" className="bg-white text-indigo-900 font-extrabold border-none">
                                                  PENDING INVITATION
                                                </Badge>
                                              </div>
                                              <p className="text-sm font-black">
                                                {pendingInvForTask.inviter_name || 'A classmate'} invited you to join team <span className="underline">"{pendingInvForTask.team_name}"</span>!
                                              </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                              <Button
                                                type="button"
                                                onClick={() => handleRespondInvitation(pendingInvForTask.id, 'ACCEPT')}
                                                className="bg-white text-indigo-700 hover:bg-indigo-50 font-black text-xs px-4 py-2 rounded-xl shadow-sm border-none"
                                              >
                                                Accept Invitation
                                              </Button>
                                              <Button
                                                type="button"
                                                onClick={() => handleRespondInvitation(pendingInvForTask.id, 'DECLINE')}
                                                className="bg-black/30 hover:bg-black/50 text-white font-bold text-xs px-4 py-2 rounded-xl border border-white/30"
                                              >
                                                Decline
                                              </Button>
                                            </div>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-indigo-50/90 border border-indigo-200 rounded-xl shadow-xs">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="primary" className="bg-indigo-600 text-white border-none">
                                            <Users size={12} /> Team Task
                                          </Badge>
                                          <span className="text-xs font-bold text-indigo-950">
                                            Requires Team of {task.min_team_size || 2} - {task.max_team_size || 5} Members
                                          </span>
                                        </div>
                                        <p className="text-xs text-indigo-700 font-medium">
                                          Form a team with your classmates, accept pending invitations, or manage your current team and proof submission.
                                        </p>
                                      </div>
                                      <Button
                                        type="button"
                                        onClick={() => openTeamModal(task)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm shrink-0 flex items-center gap-2"
                                      >
                                        <Users size={16} /> Manage / View Team
                                      </Button>
                                    </div>
                                  </div>
                                ) : isDeadlinePassed ? (
                                  <div className="text-center py-6">
                                    <div className="w-12 h-12 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                      <Clock size={24} />
                                    </div>
                                    <h5 className="font-bold text-zinc-500 mb-1">Uploads Closed</h5>
                                    <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                                      The deadline for this task has passed. Submissions are no longer accepted.
                                    </p>
                                  </div>
                                ) : (
                                  (() => {
                                    const isLocked = submission?.status === 'REJECTED' && (submission.resubmission_count || 0) >= 2;

                                    // Already opted out (show reason banner with option to edit)
                                    if (submission?.status === 'NOT_PARTICIPATING' && !isEditingOptOut[task.id]) {
                                      return (
                                        <div className="p-4 bg-orange-50/90 border border-orange-200 rounded-xl space-y-3 shadow-sm">
                                          <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 text-orange-800 font-bold text-sm">
                                              <AlertTriangle size={18} className="text-orange-500 shrink-0" />
                                              <span>Status: Skip / Not Interested</span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setNotParticipating(prev => ({ ...prev, [task.id]: true }));
                                                setNotParticipatingReason(prev => ({ ...prev, [task.id]: submission.not_participating_reason || '' }));
                                                setIsEditingOptOut(prev => ({ ...prev, [task.id]: true }));
                                              }}
                                              className="text-xs font-bold text-orange-700 hover:text-orange-950 bg-orange-100 hover:bg-orange-200 px-3 py-1.5 rounded-lg border border-orange-300 transition-colors"
                                            >
                                              Edit Reason / Change Option
                                            </button>
                                          </div>
                                          <div className="pl-4 border-l-3 border-orange-400 bg-white/70 p-3 rounded-r-lg border border-zinc-200/60">
                                            <p className="text-[11px] font-bold text-orange-600 uppercase tracking-wider mb-0.5">Submitted Reason:</p>
                                            <p className="text-sm text-zinc-900 font-semibold break-words leading-relaxed">
                                              "{submission.not_participating_reason || 'No specific reason provided'}"
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    }

                                    if (isLocked) {
                                      return (
                                        <div className="text-center py-6">
                                          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <XCircle size={24} />
                                          </div>
                                          <h5 className="font-bold text-red-600 mb-1">Submission Locked</h5>
                                          <p className="text-sm text-red-500 max-w-sm mx-auto">
                                            You have exceeded the maximum number of resubmissions (2) for this task. It cannot be submitted again.
                                          </p>
                                        </div>
                                      );
                                    }

                                    if (!submission || submission.status === 'REJECTED') {
                                      const isOptingOut = notParticipating[task.id] || false;
                                      return (
                                        <div className="space-y-4">
                                          {submission?.status === 'REJECTED' && (
                                            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-xs text-red-700 shadow-sm space-y-2">
                                              <p className="font-extrabold text-sm mb-1 flex items-center gap-1.5 text-red-800">
                                                <XCircle size={16} className="text-red-500" /> Submission Rejected by Advisor / HOD
                                              </p>
                                              <p className="font-medium bg-white/80 p-2.5 rounded-lg border border-red-200 text-zinc-900">
                                                <strong>Note / Reason:</strong> "{submission.rejection_reason || submission.verification_note || 'No specific note provided'}"
                                              </p>
                                              <p className="font-bold text-red-700">Please review the reason above, update your proof, and resubmit below.</p>
                                            </div>
                                          )}

                                          {/* ── Intent Selector (works for any task type) ── */}
                                          <div>
                                            <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wide">Will you be submitting this task?</p>
                                            <div className="grid grid-cols-2 gap-3">
                                              {/* Yes, submit */}
                                              <button
                                                type="button"
                                                onClick={() => setNotParticipating(prev => ({ ...prev, [task.id]: false }))}
                                                className={cn(
                                                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all font-semibold text-sm',
                                                  !isOptingOut
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                                                    : 'border-zinc-200 bg-white text-zinc-400 hover:border-zinc-300'
                                                )}
                                              >
                                                <CheckCircle2 size={22} className={!isOptingOut ? 'text-emerald-500' : 'text-zinc-300'} />
                                                <span>Yes, I'll Submit</span>
                                              </button>

                                              {/* Skip / Not Interested */}
                                              <button
                                                type="button"
                                                onClick={() => setNotParticipating(prev => ({ ...prev, [task.id]: true }))}
                                                className={cn(
                                                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all font-semibold text-sm',
                                                  isOptingOut
                                                    ? 'border-orange-400 bg-orange-50 text-orange-700 shadow-sm'
                                                    : 'border-zinc-200 bg-white text-zinc-400 hover:border-zinc-300'
                                                )}
                                              >
                                                <AlertTriangle size={22} className={isOptingOut ? 'text-orange-500' : 'text-zinc-300'} />
                                                <span>Skip / Not Interested</span>
                                              </button>
                                            </div>
                                          </div>

                                          {/* ── If NOT participating: just reason ── */}
                                          {isOptingOut ? (
                                            <div className="space-y-3 pt-1">
                                              <label className="text-sm font-bold text-zinc-700 flex items-center gap-1.5">
                                                <AlertTriangle size={14} className="text-orange-500" />
                                                Reason for Not Participating <span className="text-red-500">*</span>
                                              </label>
                                              <Textarea
                                                placeholder="Provide official academic justification for opting out of this task..."
                                                value={notParticipatingReason[task.id] || ''}
                                                onChange={e => setNotParticipatingReason(prev => ({ ...prev, [task.id]: e.target.value }))}
                                                className="min-h-[90px]"
                                              />
                                              <Button
                                                onClick={() => submitNotParticipating(task.id)}
                                                disabled={uploading === task.id || !(notParticipatingReason[task.id] || '').trim()}
                                                className={cn(
                                                  'w-full font-bold bg-orange-500 hover:bg-orange-600 text-white',
                                                  (uploading === task.id || !(notParticipatingReason[task.id] || '').trim()) && 'opacity-50 cursor-not-allowed'
                                                )}
                                              >
                                                {uploading === task.id
                                                  ? <Loader2 size={18} className="animate-spin" />
                                                  : <><AlertTriangle size={16} /> Confirm: Not Participating</>}
                                              </Button>
                                            </div>
                                          ) : (
                                            /* ── If PARTICIPATING: custom field + screenshot both mandatory ── */
                                            <div className="space-y-4 pt-1">
                                              <div>
                                                <label className="text-sm font-bold text-zinc-700 mb-1.5 flex items-center gap-1">
                                                  {task.custom_field_label || 'Custom Field'}
                                                  <span className="text-red-500 ml-0.5">*</span>
                                                  <span className="text-[10px] font-medium text-zinc-400 ml-1">(Required)</span>
                                                </label>
                                                {task.custom_field_label?.trim() === 'Have you registered?' ? (
                                                  <select
                                                    value={customFieldValue}
                                                    onChange={e => setCustomFieldValue(e.target.value)}
                                                    className={cn(
                                                      "w-full h-10 px-3 rounded-xl border bg-white dark:bg-zinc-900 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-black",
                                                      !customFieldValue.trim() ? "border-red-200 focus:border-red-400" : "border-zinc-200 dark:border-zinc-700"
                                                    )}
                                                    required
                                                  >
                                                    <option value="" disabled>Select (Yes / No)</option>
                                                    <option value="Yes">Yes</option>
                                                    <option value="No">No</option>
                                                  </select>
                                                ) : (
                                                  <Input
                                                    placeholder={`Enter ${task.custom_field_label || 'required detail'}...`}
                                                    value={customFieldValue}
                                                    onChange={e => setCustomFieldValue(e.target.value)}
                                                    className={cn(!customFieldValue.trim() && 'border-red-200 focus:border-red-400')}
                                                  />
                                                )}
                                              </div>
                                              <div>
                                                <label className="text-sm font-bold text-zinc-700 mb-1.5 flex items-center gap-1">
                                                  {task.screenshot_instruction || 'Upload Screenshot'}
                                                  <span className="text-red-500 ml-0.5">*</span>
                                                  <span className="text-[10px] font-medium text-zinc-400 ml-1">(Required)</span>
                                                </label>
                                                <div className="flex flex-col gap-3">
                                                  <input
                                                    type="file"
                                                    accept="image/*"
                                                    id={`file-${task.id}`}
                                                    className="hidden"
                                                    onChange={e => handleFileUpload(task.id, e.target.files?.[0] || null)}
                                                  />
                                                  <div className="flex flex-col gap-4">
                                                    <div className="w-full">
                                                      {selectedFiles[task.id] ? (
                                                        <div className="w-full border-2 border-emerald-400 bg-emerald-50/70 rounded-2xl p-4 md:p-5 flex flex-col gap-3.5 shadow-sm transition-all">
                                                          {/* Staged Proof Top Metadata Bar */}
                                                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200/80 pb-3">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                                <CheckCircle2 size={18} />
                                                              </div>
                                                              <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800">Proof Screenshot Loaded</span>
                                                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold border border-emerald-300">Draft</span>
                                                                </div>
                                                                <p className="text-xs text-zinc-800 font-bold truncate max-w-xs md:max-w-md mt-0.5" title={selectedFiles[task.id].name}>
                                                                  {selectedFiles[task.id].name}
                                                                </p>
                                                              </div>
                                                            </div>

                                                            {/* Preview Controls */}
                                                            <div className="flex items-center gap-2 shrink-0">
                                                              <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  setProofPreviewData({
                                                                    url: URL.createObjectURL(selectedFiles[task.id]),
                                                                    title: task.title,
                                                                    filename: selectedFiles[task.id].name,
                                                                    size: `${(selectedFiles[task.id].size / (1024 * 1024)).toFixed(2)} MB`,
                                                                    isDraft: true,
                                                                    onChangeFile: () => document.getElementById(`file-${task.id}`)?.click(),
                                                                    onDeleteFile: () => handleDeleteScreenshot(task.id)
                                                                  });
                                                                }}
                                                                className="text-xs font-bold text-indigo-700 hover:text-indigo-950 bg-white hover:bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                                                                title="Open 350% pan & zoom high-resolution preview modal"
                                                              >
                                                                <Maximize2 size={13} /> Fullscreen Zoom
                                                              </button>
                                                              <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  document.getElementById(`file-${task.id}`)?.click();
                                                                }}
                                                                className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200 transition-colors flex items-center gap-1 shadow-xs"
                                                                title="Select a different screenshot"
                                                              >
                                                                <Upload size={13} /> Change
                                                              </button>
                                                              <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  handleDeleteScreenshot(task.id);
                                                                }}
                                                                className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-200 transition-colors flex items-center gap-1.5 shadow-xs"
                                                                title="Remove screenshot if wrong"
                                                              >
                                                                <Trash2 size={13} /> Remove
                                                              </button>
                                                            </div>
                                                          </div>

                                                          {/* High-Clarity In-Card Live Preview Viewport */}
                                                          <div
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              setProofPreviewData({
                                                                url: URL.createObjectURL(selectedFiles[task.id]),
                                                                title: task.title,
                                                                filename: selectedFiles[task.id].name,
                                                                size: `${(selectedFiles[task.id].size / (1024 * 1024)).toFixed(2)} MB`,
                                                                isDraft: true,
                                                                onChangeFile: () => document.getElementById(`file-${task.id}`)?.click(),
                                                                onDeleteFile: () => handleDeleteScreenshot(task.id)
                                                              });
                                                            }}
                                                            className="relative w-full max-h-72 md:max-h-80 rounded-xl overflow-hidden border-2 border-emerald-300 bg-zinc-900/5 flex items-center justify-center cursor-pointer group/preview shadow-inner p-2"
                                                            title="Click to inspect proof in 350% zoom & rotate modal"
                                                          >
                                                            <img
                                                              src={URL.createObjectURL(selectedFiles[task.id])}
                                                              alt="Staged proof preview"
                                                              className="max-h-64 md:max-h-72 w-auto max-w-full rounded-lg object-contain transition-transform duration-200 group-hover/preview:scale-[1.01]"
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-2 backdrop-blur-[1px]">
                                                              <Eye size={18} /> Click to Inspect with 350% Zoom & Pan
                                                            </div>
                                                            <div className="absolute bottom-3 right-3 bg-zinc-900/75 text-white text-[10px] font-semibold px-2.5 py-1 rounded-md backdrop-blur-xs flex items-center gap-1 shadow-sm">
                                                              <span>{(selectedFiles[task.id].size / (1024 * 1024)).toFixed(2)} MB</span>
                                                            </div>
                                                          </div>

                                                          {/* Academic Verification Checklist Alert */}
                                                          <div className="bg-white/90 border border-emerald-300/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-900">
                                                            <FileCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                                                            <div>
                                                              <p className="font-bold text-emerald-950">Pre-Submission Verification</p>
                                                              <p className="text-[11px] text-zinc-600 leading-relaxed mt-0.5">
                                                                Please confirm that your <strong className="text-zinc-900">Full Name</strong>, <strong className="text-zinc-900">Register Number</strong>, and <strong className="text-zinc-900">Completion Status</strong> are clearly visible in the preview above before clicking Submit.
                                                              </p>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      ) : (
                                                        <div
                                                          className={cn(
                                                            'relative w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer group',
                                                            isDraggingScreenshot === task.id ? 'border-blue-500 bg-blue-50 scale-105' : 'border-red-200 bg-white text-zinc-400 hover:border-black hover:text-black'
                                                          )}
                                                          onDragOver={e => { e.preventDefault(); setIsDraggingScreenshot(task.id); }}
                                                          onDragLeave={() => setIsDraggingScreenshot(null)}
                                                          onDrop={e => { e.preventDefault(); setIsDraggingScreenshot(null); handleFileUpload(task.id, e.dataTransfer.files[0]); }}
                                                          onClick={() => document.getElementById(`file-${task.id}`)?.click()}
                                                        >
                                                          <Upload size={24} className="mb-2 group-hover:-translate-y-1 transition-transform" />
                                                          <p className="font-bold text-center text-[10px] md:text-sm uppercase tracking-wide">Upload Screenshot</p>
                                                          <p className="text-[10px] opacity-60 text-center">Drag or Click to upload (Max 5MB)</p>
                                                        </div>
                                                      )}
                                                    </div>

                                                    {/* Submit Action Button */}
                                                    <Button
                                                      onClick={() => submitTask(task.id)}
                                                      disabled={uploading === task.id || !selectedFiles[task.id] || !customFieldValue.trim()}
                                                      variant={selectedFiles[task.id] && customFieldValue.trim() ? 'primary' : 'secondary'}
                                                      className={cn(
                                                        'w-full h-12 font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 rounded-xl shadow-xs transition-all cursor-pointer',
                                                        selectedFiles[task.id] && customFieldValue.trim() ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'opacity-50 cursor-not-allowed'
                                                      )}
                                                    >
                                                      {uploading === task.id ? <Loader2 size={20} className="animate-spin" /> : <><CheckCircle2 size={18} /> Confirm & Submit Academic Proof</>}
                                                    </Button>
                                                  </div>
                                                  <div className="flex items-start gap-2 text-zinc-400">
                                                    <span className="text-xs shrink-0 mt-0.5">*</span>
                                                    <p className="text-xs italic leading-tight">{task.screenshot_instruction || 'Ensure your screenshot clearly shows completion or registration details before submitting.'}</p>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }
                                    return (
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center",
                                            submission.status === 'VERIFIED' ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"
                                          )}>
                                            {submission.status === 'VERIFIED' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                                          </div>
                                          <div>
                                            <p className="text-sm font-bold text-zinc-900">
                                              {submission.status === 'VERIFIED' ? 'Completed' : 'Under Review'}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                              {submission.status === 'VERIFIED' ? `Verified on ${new Date(submission.verified_at!).toLocaleDateString()}` : 'Waiting for verification review'}
                                            </p>
                                          </div>
                                        </div>
                                        {submission.screenshot_url && !submission.screenshot_url.startsWith('PURGED') ? (
                                          <button
                                            type="button"
                                            onClick={() => setProofPreviewData({
                                              url: submission.screenshot_url,
                                              title: task.title,
                                              filename: submission.original_filename || `Proof_${submission.register_number || 'Student'}_${task.title}`,
                                              isDraft: false,
                                              duplicateWarning: submission.is_duplicate ? {
                                                isDuplicate: true,
                                                originalStudentName: submission.duplicate_match?.student_name || submission.duplicate_match_name || undefined,
                                                originalRegisterNumber: submission.duplicate_match?.register_number || submission.duplicate_match_regno || undefined,
                                                originalSubmittedAt: submission.duplicate_match?.submitted_at || submission.duplicate_match_submitted_at || undefined,
                                              } : undefined
                                            })}
                                            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                                            title="Inspect submitted proof in full resolution"
                                          >
                                            <Eye size={13} /> View Proof
                                          </button>
                                        ) : submission.screenshot_url?.startsWith('PURGED') ? (
                                          <span className="text-xs text-zinc-400 font-medium italic flex items-center gap-1">
                                            <ImageIcon size={14} /> Purged (30d+)
                                          </span>
                                        ) : null}
                                      </div>
                                    );
                                  })()
                                )}
                              </div>
                            )}
                            {(isAdmin || isHOD || isAdvisor || isCoordinator) && (
                              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-4">
                                {(isAdmin || isHOD) && (
                                  <Button
                                    variant="secondary"
                                    className="bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-200 text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all"
                                    onClick={() => openTaskPendingEmailModal(task)}
                                    title="Send official email reminder to all incomplete students across assigned classes"
                                  >
                                    <Mail size={14} className="text-amber-600" /> Send Pending Email Alert
                                  </Button>
                                )}

                                {(isAdmin || isHOD || isAdvisor || isCoordinator) && (
                                  <>
                                    <Button
                                      variant="secondary"
                                      className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 text-xs font-bold flex items-center gap-1.5"
                                      onClick={() => {
                                        setExtendingTask(task);
                                        const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
                                        const pad = (n: number) => String(n).padStart(2, '0');
                                        setExtendedDeadline(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
                                      }}
                                    >
                                      <Clock size={14} /> Extend Deadline & Reopen
                                    </Button>

                                    <Button
                                      variant="ghost"
                                      className="text-zinc-500 hover:text-zinc-900 text-xs font-semibold"
                                      onClick={() => toggleTaskStatus(task.id, task.status)}
                                    >
                                      {task.status === 'OPEN' ? 'Close Task' : 'Open Task'}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      className="text-zinc-400 hover:text-red-500 text-xs font-semibold"
                                      onClick={() => deleteTask(task.id)}
                                    >
                                      <Trash2 size={16} /> Delete
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}
                          </Card>
                        );
                      });
                    })()}
                    </div>
                  </PageLayout>
                </motion.div>


          {showTaskPreview && (() => {
            const catStyle = getCategoryBadgeStyle(newTask.category);

            const previewDeadlinePassed = newTask.deadline && new Date(newTask.deadline) < new Date();
            const previewWithin24h = newTask.deadline && !previewDeadlinePassed && (new Date(newTask.deadline).getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000;

            return (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[130] flex items-center justify-center p-4 cursor-pointer" onClick={() => setShowTaskPreview(false)}>
                <motion.div
                  onClick={e => e.stopPropagation()}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-4xl shadow-2xl relative max-h-[95vh] md:max-h-[90vh] flex flex-col cursor-default"
                >
                  <button
                    onClick={() => setShowTaskPreview(false)}
                    className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    <XCircle size={24} />
                  </button>
                  <h2 className="text-2xl font-bold mb-2">Live Preview</h2>
                  <p className="text-zinc-500 text-sm mb-6">This is exactly what students will see.</p>

                  <div className="flex-1 overflow-y-auto pr-2 -mr-2 custom-scrollbar">
                    <Card className="border border-zinc-200 shadow-sm p-4 md:p-6 mb-6">
                      <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5", catStyle)}>
                              {renderCategoryIcon(newTask.category, 12)}
                              <span>{newTask.category || 'General'}</span>
                            </span>
                            <h4 translate="no" className="font-bold text-zinc-900 text-lg md:text-xl break-words notranslate">{newTask.title || "Untitled Task"}</h4>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                            <span className="font-medium text-zinc-700">{user?.name || "Task Creator"}</span>
                            <span className="hidden md:inline">•</span>
                            <span>{new Date().toLocaleDateString()}</span>
                            <span className="hidden md:inline">•</span>
                            <span className="px-2 py-0.5 rounded-full border border-transparent whitespace-nowrap bg-blue-50 text-blue-600 border-blue-100">
                              Class Task
                            </span>
                            <span className="hidden md:inline">•</span>
                            <span className="bg-zinc-100 text-zinc-600 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 whitespace-nowrap border border-zinc-200">
                              <Users size={12} /> 0 students submitted
                            </span>
                          </div>
                        </div>
                        <div className="text-left md:text-right shrink-0">
                          <p className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1 md:justify-end">
                            <Clock size={12} /> Deadline
                          </p>
                          <p className={cn(
                            "text-sm font-bold flex flex-col md:items-end",
                            previewDeadlinePassed ? "text-red-500" : (previewWithin24h ? "text-orange-500" : "text-zinc-600")
                          )}>
                            {newTask.deadline ? new Date(newTask.deadline).toLocaleString() : "No deadline"}
                            {previewWithin24h && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded mt-1">Due within 24h!</span>}
                          </p>
                        </div>
                      </div>

                      <div className="text-zinc-600 text-sm mb-6 break-words">
                        <FormattedTaskDescription content={newTask.description} />
                      </div>

                      {newTask.external_link && (
                        <div className="mb-6">
                          <a
                            href={newTask.external_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm font-medium"
                          >
                            <ExternalLink size={16} /> Visit Apply Link
                          </a>
                        </div>
                      )}

                      <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200 mt-6 shadow-sm">
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200/80">
                          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Eye size={13} className="text-indigo-600" /> Student Submission Form (Preview Mode)
                          </span>
                          <span className="text-[10px] bg-zinc-200/80 text-zinc-600 font-bold px-2 py-0.5 rounded">
                            Interactive Mockup
                          </span>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-zinc-700 mb-2 block">
                              {newTask.custom_field_label || "Custom Field"}
                            </label>
                            {newTask.custom_field_label?.trim() === 'Have you registered?' ? (
                              <select
                                disabled
                                className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-400 text-sm font-medium cursor-not-allowed"
                              >
                                <option>Select (Yes / No) - Dropdown Option</option>
                                <option>Yes</option>
                                <option>No</option>
                              </select>
                            ) : (
                              <Input
                                placeholder={`Enter ${newTask.custom_field_label || "required detail"}...`}
                                disabled
                              />
                            )}
                          </div>
                          <div>
                            <label className="text-sm font-medium text-zinc-700 mb-2 block">
                              {newTask.screenshot_instruction || "Upload Screenshot"}
                            </label>
                            <div className="flex flex-col gap-4">
                              <div className="flex items-center gap-4">
                                <div className="flex-1 w-full">
                                  <div
                                    className="relative w-full border-2 border-dashed rounded-xl p-6 md:p-8 flex flex-col items-center justify-center transition-all cursor-not-allowed border-zinc-200 bg-white text-zinc-400"
                                  >
                                    <Upload size={24} className="mb-2" />
                                    <p className="font-bold text-center text-[10px] md:text-sm uppercase tracking-wide">Upload Screen</p>
                                    <p className="text-[10px] opacity-60 text-center">Drag or Click</p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  disabled
                                  variant="secondary"
                                  title="Inactive in task creator preview. Active for enrolled students once published."
                                  className="h-auto md:h-full px-8 py-4 shrink-0 transition-all font-black uppercase tracking-wider text-sm opacity-50 cursor-not-allowed"
                                >
                                  Submit (Preview)
                                </Button>
                              </div>
                              <div className="mt-3 flex items-start gap-2 text-zinc-400">
                                <span className="text-xs shrink-0 mt-0.5">*</span>
                                <p className="text-xs italic leading-tight">
                                  {newTask.screenshot_instruction || "Ensure your screenshot clearly shows the completion or registration details before hitting Submit."}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-100 flex gap-4 shrink-0">
                    <Button variant="secondary" className="flex-1" onClick={() => setShowTaskPreview(false)}>Back to Edit</Button>
                    <Button className="flex-1" onClick={() => { createTask(); setShowTaskPreview(false); }}>Publish Task</Button>
                  </div>
                </motion.div>
              </div>
            );
          })()}


            {selectedPosterModal && (
              <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-pointer" onClick={() => setSelectedPosterModal(null)}>
                <motion.div
                  onClick={e => e.stopPropagation()}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center p-2 cursor-default"
                >
                  <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                    <a
                      href={selectedPosterModal}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors border border-white/20 flex items-center gap-1.5 text-xs font-bold px-4"
                    >
                      <ExternalLink size={16} /> Open in New Tab
                    </a>
                    <button
                      onClick={() => setSelectedPosterModal(null)}
                      className="p-2.5 bg-black/70 text-white rounded-full hover:bg-black/90 transition-colors border border-white/20"
                      title="Close Poster View"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  {selectedPosterModal.toLowerCase().includes('.pdf') ? (
                    <iframe
                      src={selectedPosterModal}
                      title="Event Poster PDF Viewer"
                      className="w-full h-[85vh] rounded-xl shadow-2xl border border-zinc-700 bg-white"
                    />
                  ) : (
                    <img
                      src={selectedPosterModal}
                      alt="Full Poster View"
                      className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-zinc-700"
                    />
                  )}
                </motion.div>
              </div>
            )}

            {sharedTaskModal && (
              <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm cursor-pointer" onClick={() => setSharedTaskModal(null)}>
                <motion.div
                  onClick={e => e.stopPropagation()}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative space-y-6 max-h-[95vh] overflow-y-auto cursor-default"
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg">
                        ✓
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900">Task Posted Successfully!</h3>
                        <p className="text-xs text-zinc-500 font-medium">Ready to share with students and advisors</p>
                      </div>
                    </div>
                    <button onClick={() => setSharedTaskModal(null)} className="p-1 hover:bg-zinc-100 rounded-full">
                      <X size={20} className="text-zinc-400" />
                    </button>
                  </div>

                  {sharedTaskModal.poster_url && (
                    <div className="rounded-xl overflow-hidden max-h-44 bg-zinc-950 border border-zinc-200 flex items-center justify-center">
                      <img src={sharedTaskModal.poster_url} alt="Poster" className="max-h-44 object-contain" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Task Title</p>
                    <p translate="no" className="text-base font-bold text-zinc-900 notranslate">{sharedTaskModal.title}</p>
                  </div>

                  <div className="space-y-2 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                    <label className="text-xs font-bold text-zinc-600 uppercase tracking-widest block">Direct Share Link</label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={`${window.location.origin}${window.location.pathname}?taskId=${sharedTaskModal.id}`}
                        className="text-xs font-mono bg-white"
                      />
                      <Button
                        type="button"
                        onClick={() => copyTaskShareLink(sharedTaskModal.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 font-bold"
                      >
                        <Copy size={16} /> Copy
                      </Button>
                    </div>
                  </div>

                  <Button onClick={() => setSharedTaskModal(null)} className="w-full">
                    Done
                  </Button>
                </motion.div>
              </div>
            )}

    </>
  );
}
