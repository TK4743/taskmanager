import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import {
  Code,
  Play,
  Send,
  Camera,
  Maximize2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Award,
  ChevronRight,
  Building2,
  FileCode2,
  Lock,
  Layers,
  Check,
  Eye,
  Terminal,
  HelpCircle,
  Laptop,
  GripVertical,
  Smartphone,
  Monitor,
  Mail
} from 'lucide-react';
import { API_URL } from './config';
import { checkIsMobileOrTablet } from './lib/deviceCheck';

interface StudentCodingAssessmentViewProps {
  user: any;
  token: string | null;
}

interface AssessmentItem {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  questions_per_student: number;
  passing_score: number;
  start_at: string;
  end_at: string;
  allowed_languages: string[];
  company_name: string;
  industry_sector: string;
  logo_url: string | null;
  attempt_status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
  final_score: number;
  is_passed: boolean;
  started_at: string | null;
  submitted_at: string | null;
}

interface Question {
  id: string;
  title: string;
  problem_statement: string;
  input_format: string;
  output_format: string;
  constraints: string;
  difficulty: string;
  marks: number;
  skills: string[];
  allowed_languages: string[];
  sample_test_cases: { id: string; input_data: string; expected_output: string; explanation?: string }[];
  latest_submission?: {
    language: string;
    source_code: string;
    score: number;
    status: string;
    public_tests_passed: number;
    public_tests_total: number;
    hidden_tests_passed: number;
    hidden_tests_total: number;
  };
}

export const StudentCodingAssessmentView: React.FC<StudentCodingAssessmentViewProps> = ({ user, token }) => {
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAssessment, setActiveAssessment] = useState<AssessmentItem | null>(null);

  // Pre-check & permission state
  const [showPreCheckModal, setShowPreCheckModal] = useState(false);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Device enforcement state (Desktop/Laptop only)
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(() => checkIsMobileOrTablet().isMobile);
  const [showMobileProhibitedModal, setShowMobileProhibitedModal] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileDevice(checkIsMobileOrTablet().isMobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Active coding attempt state
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<Record<number, string>>({ 0: 'cpp', 1: 'python' });
  const [codeBuffers, setCodeBuffers] = useState<Record<number, Record<string, string>>>({ 0: {}, 1: {} });
  const [starterTemplates, setStarterTemplates] = useState<Record<string, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(3600);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Autosave state
  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving' | 'error' | 'idle'>('saved');
  const autosaveTimeoutRef = useRef<any>(null);

  // Sandbox execution state
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sampleTestResults, setSampleTestResults] = useState<any[]>([]);
  const [activeSampleTab, setActiveSampleTab] = useState<number>(0);
  const [submissionFeedback, setSubmissionFeedback] = useState<Record<number, any>>({});
  const [overallCompleted, setOverallCompleted] = useState(false);
  const [finalResult, setFinalResult] = useState<any>(null);

  // Proctoring Video & Event Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [proctorViolations, setProctorViolations] = useState<number>(0);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 1. Fetch Assigned Assessments
  const fetchAssessments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/student/coding-assessments`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAssessments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  // 2. Start Camera Proctoring Stream
  const initWebcam = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraAllowed(true);
      logProctorEvent('CAMERA_STARTED', 'LOW');
    } catch (err: any) {
      console.error('[Webcam Error]', err);
      setCameraAllowed(false);
      setCameraError('Camera permission is mandatory for proctoring. Please allow camera access in browser permissions.');
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // 3. Log Proctoring Event
  const logProctorEvent = async (eventType: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW', meta: any = {}) => {
    if (!attemptId) return;
    try {
      await fetch(`${API_URL}/api/student/coding-assessments/proctor-event`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          assignment_id: attemptId,
          event_type: eventType,
          severity,
          metadata: meta
        })
      });
    } catch {}
  };

  // 4. Anti-Cheat, Fullscreen, Right-Click & Clipboard Lockdown Listeners
  useEffect(() => {
    if (!attemptId || overallCompleted) return;

    const handleFullscreenChange = () => {
      const inFs = Boolean(document.fullscreenElement);
      setIsFullscreen(inFs);
      if (!inFs) {
        setProctorViolations(v => v + 1);
        logProctorEvent('FULLSCREEN_EXIT', 'MEDIUM', { timestamp: new Date().toISOString() });
        showToast('⚠️ Fullscreen exit recorded by proctor.');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setProctorViolations(v => v + 1);
        logProctorEvent('TAB_SWITCH', 'HIGH', { timestamp: new Date().toISOString() });
        showToast('⚠️ Tab switch / window blur detected.');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setProctorViolations(v => v + 1);
      logProctorEvent('RIGHT_CLICK_ATTEMPT', 'LOW', { timestamp: new Date().toISOString() });
      showToast('🚫 Right-click context menu is strictly disabled during the coding test!');
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setProctorViolations(v => v + 1);
      logProctorEvent('COPY_ATTEMPT', 'LOW', { timestamp: new Date().toISOString() });
      showToast('🚫 Copying content is strictly disabled during assessment!');
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      showToast('🚫 Cutting content is disabled during assessment!');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setProctorViolations(v => v + 1);
      logProctorEvent('PASTE_ATTEMPT', 'HIGH', { timestamp: new Date().toISOString() });
      showToast('🚫 Pasting code is strictly prohibited! Please write your code manually.');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        ((e.ctrlKey || e.metaKey) && ['u', 's', 'p'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        e.stopPropagation();
        showToast('🚫 Developer Tools and Page Shortcuts are disabled!');
        return;
      }

      // Prevent Ctrl+C, Ctrl+V, Ctrl+X
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
        if (e.key.toLowerCase() === 'v') {
          setProctorViolations(v => v + 1);
          logProctorEvent('KEYBOARD_PASTE_ATTEMPT', 'HIGH', { timestamp: new Date().toISOString() });
          showToast('🚫 Pasting code (Ctrl+V) is disabled! Type solution manually.');
        } else {
          showToast('🚫 Clipboard shortcuts are disabled during test!');
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('copy', handleCopy, true);
    window.addEventListener('cut', handleCut, true);
    window.addEventListener('paste', handlePaste, true);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('copy', handleCopy, true);
      window.removeEventListener('cut', handleCut, true);
      window.removeEventListener('paste', handlePaste, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [attemptId, overallCompleted]);

  // 5. Timer Countdown
  useEffect(() => {
    if (!attemptId || overallCompleted || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds(s => {
        if (s <= 1) {
          clearInterval(timer);
          handleFinishAssessment(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [attemptId, overallCompleted, remainingSeconds]);

  // 6. Begin Assessment Flow
  const handleOpenPreCheck = (assessment: AssessmentItem) => {
    const check = checkIsMobileOrTablet();
    if (check.isMobile) {
      setIsMobileDevice(true);
      setShowMobileProhibitedModal(true);
      showToast('💻 Desktop/Laptop Required: Mobile devices are strictly prohibited.');
      return;
    }
    setActiveAssessment(assessment);
    setShowPreCheckModal(true);
    initWebcam();
  };

  const handleStartAttempt = async () => {
    const check = checkIsMobileOrTablet();
    if (check.isMobile) {
      setIsMobileDevice(true);
      setShowMobileProhibitedModal(true);
      showToast('💻 Desktop/Laptop Required: Coding assessments cannot be taken on mobile devices.');
      return;
    }

    if (!activeAssessment || !cameraAllowed) {
      showToast('Camera verification required to start.');
      return;
    }

    try {
      // Enter Fullscreen
      if (document.documentElement.requestFullscreen) {
        try {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        } catch {}
      }

      const res = await fetch(`${API_URL}/api/student/coding-assessments/${activeAssessment.id}/start`, {
        method: 'POST',
        headers
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || 'Failed to start attempt');
        return;
      }

      // Fetch attempt details
      const attemptRes = await fetch(`${API_URL}/api/student/coding-assessments/${activeAssessment.id}/attempt`, { headers });
      if (attemptRes.ok) {
        const data = await attemptRes.json();
        setAttemptId(data.attempt_id);
        setQuestions(data.questions || []);
        setRemainingSeconds(data.remaining_seconds || 3600);
        setStarterTemplates(data.starter_templates || {});

        // Initialize code buffers from latest submissions or starter templates
        const initialBuffers: Record<number, Record<string, string>> = { 0: {}, 1: {} };
        const initialLangs: Record<number, string> = { 0: 'cpp', 1: 'python' };

        (data.questions || []).forEach((q: any, idx: number) => {
          const lang = q.draft?.language || q.latest_submission?.language || (idx === 0 ? 'cpp' : 'python');
          const sourceCode = q.draft?.source_code ?? (q.latest_submission?.source_code || data.starter_templates?.[lang] || '');
          initialLangs[idx] = lang;
          initialBuffers[idx] = {
            [lang]: sourceCode
          };
          if (q.latest_submission) {
            setSubmissionFeedback(prev => ({ ...prev, [idx]: q.latest_submission }));
          }
        });

        setSelectedLanguage(initialLangs);
        setCodeBuffers(initialBuffers);
        setShowPreCheckModal(false);
      }
    } catch (e) {
      showToast('Error initializing coding assessment');
    }
  };

  // 7. Language Switcher (Per Question)
  const handleLanguageChange = (newLang: string) => {
    setSelectedLanguage(prev => ({ ...prev, [currentQIdx]: newLang }));
    setCodeBuffers(prev => {
      const qBuf = prev[currentQIdx] || {};
      if (!qBuf[newLang]) {
        return {
          ...prev,
          [currentQIdx]: {
            ...qBuf,
            [newLang]: starterTemplates[newLang] || ''
          }
        };
      }
      return prev;
    });
  };

  const handleCodeChange = (val: string | undefined) => {
    const lang = selectedLanguage[currentQIdx] || 'cpp';
    const newCode = val || '';
    setCodeBuffers(prev => ({
      ...prev,
      [currentQIdx]: {
        ...(prev[currentQIdx] || {}),
        [lang]: newCode
      }
    }));

    // Debounced 3-Second Autosave to Server
    if (!attemptId || !questions[currentQIdx]) return;
    setAutosaveStatus('saving');
    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/student/coding-assessments/draft`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            assignment_id: attemptId,
            question_id: questions[currentQIdx].id,
            language: lang,
            source_code: newCode
          })
        });
        if (res.ok) {
          setAutosaveStatus('saved');
        } else {
          setAutosaveStatus('error');
        }
      } catch {
        setAutosaveStatus('error');
      }
    }, 3000);
  };

  // 8. Run Code (Sample Visible Tests Only)
  const handleRunCode = async () => {
    if (!attemptId || questions.length === 0) return;
    const currentQ = questions[currentQIdx];
    const lang = selectedLanguage[currentQIdx] || 'cpp';
    const code = codeBuffers[currentQIdx]?.[lang] || '';

    if (!code.trim()) {
      showToast('Please write some code before running.');
      return;
    }

    setIsRunning(true);
    setSampleTestResults([]);

    try {
      const res = await fetch(`${API_URL}/api/student/coding-assessments/run`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          assignment_id: attemptId,
          question_id: currentQ.id,
          language: lang,
          source_code: code
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSampleTestResults(data.results || []);
        if (data.status === 'ACCEPTED') {
          showToast('✅ All sample test cases passed!');
        } else if (data.status === 'COMPILATION_ERROR') {
          showToast('❌ Compilation error.');
        } else {
          showToast(`⚠️ ${data.status}`);
        }
      } else {
        showToast(data.error || 'Execution failed');
      }
    } catch (e) {
      showToast('Failed to execute code');
    } finally {
      setIsRunning(false);
    }
  };

  // 9. Submit Solution (Evaluated on Server Against Hidden Tests)
  const handleSubmitCode = async () => {
    if (!attemptId || questions.length === 0) return;
    const currentQ = questions[currentQIdx];
    const lang = selectedLanguage[currentQIdx] || 'cpp';
    const code = codeBuffers[currentQIdx]?.[lang] || '';

    if (!code.trim()) {
      showToast('Cannot submit empty code.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/student/coding-assessments/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          assignment_id: attemptId,
          question_id: currentQ.id,
          language: lang,
          source_code: code
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSubmissionFeedback(prev => ({ ...prev, [currentQIdx]: data.submission }));
        setSampleTestResults(data.results || []);
        showToast(`🎉 Submitted! Score: ${data.submission.score}/${data.submission.max_marks}`);
      } else {
        showToast(data.error || 'Submission failed');
      }
    } catch (e) {
      showToast('Failed to submit solution');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 10. Complete Assessment
  const handleFinishAssessment = async (isAutoExpire = false) => {
    if (!activeAssessment) return;
    try {
      const res = await fetch(`${API_URL}/api/student/coding-assessments/${activeAssessment.id}/finish`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setFinalResult(data.result);
        setOverallCompleted(true);
        stopWebcam();
        if (document.fullscreenElement) {
          try { document.exitFullscreen(); } catch {}
        }
        showToast(isAutoExpire ? 'Time expired. Assessment submitted!' : 'Assessment completed successfully!');
        fetchAssessments();
      }
    } catch (e) {
      showToast('Error completing assessment');
    }
  };

  const currentQ = questions[currentQIdx];
  const activeLang = selectedLanguage[currentQIdx] || 'cpp';
  const activeCode = codeBuffers[currentQIdx]?.[activeLang] ?? (starterTemplates[activeLang] || '');

  // Format timer
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── Render 1: Completed Assessment Screen ──────────────────────────────────
  if (overallCompleted && finalResult) {
    return (
      <div className="min-h-full p-6 md:p-12 flex items-center justify-center bg-[#F8FAFC]">
        <div className="max-w-xl w-full bg-white rounded-3xl p-8 border border-zinc-200 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <Award size={40} />
          </div>
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              {finalResult.is_passed ? '✓ ASSESSMENT PASSED' : 'COMPLETED'}
            </span>
            <h2 className="text-2xl font-black text-zinc-900 mt-3">Assessment Submitted</h2>
            <p className="text-sm text-zinc-500 mt-1">{activeAssessment?.title} · {activeAssessment?.company_name}</p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-bold text-zinc-400 uppercase">Final Score</div>
              <div className="text-3xl font-black text-indigo-600 mt-1">{finalResult.final_score} / 100</div>
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-400 uppercase">Passing Benchmark</div>
              <div className="text-3xl font-black text-zinc-800 mt-1">{activeAssessment?.passing_score || 60}%</div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Mail size={18} />
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-blue-900 uppercase tracking-wider block">Official Scorecard Emailed</span>
                <span className="text-xs text-blue-800 font-semibold">Your comprehensive evaluation report has been dispatched to your email.</span>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2.5 py-1 bg-white text-blue-700 rounded-lg border border-blue-200 shadow-2xs shrink-0">
              ✓ Sent
            </span>
          </div>

          <p className="text-xs text-zinc-500 leading-relaxed">
            Your technical performance and verified problem-solving benchmarks have been recorded in the Institutional Skill Intelligence Engine and transmitted to {activeAssessment?.company_name} recruiters.
          </p>

          <button
            onClick={() => {
              setAttemptId(null);
              setOverallCompleted(false);
              setActiveAssessment(null);
              fetchAssessments();
            }}
            className="w-full py-3.5 bg-zinc-900 hover:bg-black text-white font-bold rounded-2xl text-sm transition-all shadow-md"
          >
            ← Return to Coding Assessments
          </button>
        </div>
      </div>
    );
  }

  // ── Render 2: Mobile / Small Viewport Blocker (Laptop & Desktop Only) ────
  if (attemptId && isMobileDevice) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0A0F1D] text-white flex items-center justify-center p-6 select-none font-sans">
        <div className="max-w-md w-full bg-[#111827] border border-rose-500/50 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <Monitor size={32} />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
              Desktop / Laptop Required
            </span>
            <h2 className="text-xl font-black text-white">Mobile Device Prohibited</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Industry coding assessments cannot be attended on mobile phones or tablets. The multi-file coding IDE, code execution sandbox, and live proctoring require a standard <strong>Laptop or Desktop PC</strong> (minimum 1024px screen width).
            </p>
          </div>
          <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 text-[11px] text-amber-300/90 font-medium">
            💡 Please switch to your Laptop or Desktop PC to continue your coding assessment.
          </div>
          <button
            onClick={() => {
              setAttemptId(null);
              fetchAssessments();
            }}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            ← Exit to Assessment List
          </button>
        </div>
      </div>
    );
  }

  // ── Render 3: Active Coding IDE Screen ─────────────────────────────────────
  if (attemptId && currentQ) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0A0F1D] text-white flex flex-col overflow-hidden font-sans select-none">
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] px-5 py-2.5 bg-zinc-900/95 backdrop-blur-md text-white rounded-full text-xs font-bold shadow-2xl border border-zinc-700 animate-bounce flex items-center gap-2">
            <span>{toast}</span>
          </div>
        )}

        {/* Top Assessment Navigation & Status Bar */}
        <div className="h-14 bg-[#111827] border-b border-slate-800 px-4 md:px-6 flex items-center justify-between shrink-0 shadow-xs z-20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#0A0F1D] px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-inner">
              <Code size={15} className="text-indigo-400" />
              <span className="text-xs font-extrabold text-slate-200">
                Question {currentQIdx + 1} of {questions.length}
              </span>
            </div>

            <div className="flex gap-1.5">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentQIdx(idx);
                    setSampleTestResults([]);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    currentQIdx === idx
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                      : submissionFeedback[idx]
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 hover:bg-emerald-900'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  Q{idx + 1} {submissionFeedback[idx] ? '✓' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Center Timer & Anti-Cheat Badge */}
          <div className="flex items-center gap-3">
            <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-bold">
              <Lock size={12} className="text-rose-400" />
              <span>Copy & Right-Click Locked</span>
            </span>

            <div className="flex items-center gap-2 bg-[#0A0F1D] px-4 py-1.5 rounded-xl border border-slate-700/80 shadow-inner">
              <Clock size={15} className={remainingSeconds < 300 ? 'text-rose-400 animate-pulse' : 'text-amber-400 animate-pulse'} />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold hidden sm:inline">Time Left:</span>
              <span className={`font-mono text-sm font-extrabold tracking-wider tabular-nums ${remainingSeconds < 300 ? 'text-rose-400' : 'text-amber-300'}`}>
                {formatTime(remainingSeconds)}
              </span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFinishAssessment(false)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Finish Assessment</span>
              <CheckCircle2 size={15} />
            </button>
          </div>
        </div>

        {/* Main Split Layout: Left Problem Statement, Right Monaco IDE */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden select-none">
          
          {/* LEFT: Problem Statement */}
          <div 
            className="w-full md:w-1/2 border-r border-slate-800 bg-[#0B1120] flex flex-col overflow-y-auto p-6 md:p-7 custom-scrollbar min-h-0 select-none"
            onContextMenu={e => { e.preventDefault(); showToast('🚫 Right click is disabled on problem statement!'); }}
            onCopy={e => { e.preventDefault(); showToast('🚫 Copying problem text is disabled!'); }}
            onPaste={e => { e.preventDefault(); showToast('🚫 Pasting is disabled!'); }}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-black px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                {currentQ.difficulty} · {currentQ.marks} Marks
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {(currentQ.skills || []).map((sk, i) => (
                  <span key={i} className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-700/80">
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            <h1 className="text-xl md:text-2xl font-black text-white mb-4 leading-tight tracking-tight">{currentQ.title}</h1>

            <div className="space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed font-normal">
              <div className="whitespace-pre-wrap leading-relaxed">{currentQ.problem_statement}</div>

              {currentQ.input_format && (
                <div className="space-y-1.5 pt-1">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Input Format</h4>
                  <div className="py-2.5 px-3.5 bg-[#131C31] rounded-xl text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap break-words border border-slate-800 shadow-inner">
                    {currentQ.input_format}
                  </div>
                </div>
              )}

              {currentQ.output_format && (
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Output Format</h4>
                  <div className="py-2.5 px-3.5 bg-[#131C31] rounded-xl text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap break-words border border-slate-800 shadow-inner">
                    {currentQ.output_format}
                  </div>
                </div>
              )}

              {currentQ.constraints && (
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Constraints</h4>
                  <div className="py-2.5 px-3.5 bg-[#131C31] rounded-xl text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap break-words border border-slate-800 shadow-inner">
                    {currentQ.constraints}
                  </div>
                </div>
              )}

              {/* Sample Test Cases (Unclipped Monospace Rendering) */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span>SAMPLE TEST CASES</span>
                </h4>
                {(currentQ.sample_test_cases || []).map((tc, idx) => (
                  <div key={tc.id || idx} className="p-4 bg-[#131C31] rounded-2xl border border-slate-700/80 space-y-2.5 shadow-sm">
                    <div className="text-xs font-black text-indigo-400">Sample Case #{idx + 1}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Input</span>
                        <div className="py-2.5 px-3 bg-[#0A0F1D] rounded-xl text-xs font-mono leading-relaxed text-slate-100 min-h-[38px] overflow-x-auto whitespace-pre-wrap break-all border border-slate-800/80">
                          {tc.input_data}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Expected Output</span>
                        <div className="py-2.5 px-3 bg-[#0A0F1D] rounded-xl text-xs font-mono leading-relaxed text-emerald-400 font-semibold min-h-[38px] overflow-x-auto whitespace-pre-wrap break-all border border-slate-800/80">
                          {tc.expected_output}
                        </div>
                      </div>
                    </div>
                    {tc.explanation && (
                      <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800">
                        {tc.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Monaco Editor & Interactive Test Runner */}
          <div className="w-full md:w-1/2 flex flex-col bg-[#0A0F1D] min-h-0">
            
            {/* Editor Top Bar with Language Selector */}
            <div className="h-11 bg-[#111827] px-4 flex items-center justify-between border-b border-slate-800 shrink-0 select-none z-10">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Language:</span>
                <select
                  value={activeLang}
                  onChange={e => handleLanguageChange(e.target.value)}
                  className="bg-[#0A0F1D] text-indigo-300 text-xs font-bold px-3 py-1 rounded-xl border border-slate-700 hover:border-indigo-500/60 focus:border-indigo-500 outline-none shadow-xs transition-colors cursor-pointer"
                >
                  <option value="c">C (GCC)</option>
                  <option value="cpp">C++ (G++)</option>
                  <option value="java">Java (JDK 17)</option>
                  <option value="python">Python 3</option>
                </select>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Autosave Status Pill */}
                <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#0A0F1D] border border-slate-800 shadow-inner">
                  {autosaveStatus === 'saving' && (
                    <span className="text-amber-400 flex items-center gap-1 animate-pulse">
                      <RotateCcw size={11} className="animate-spin" /> Saving...
                    </span>
                  )}
                  {autosaveStatus === 'saved' && (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check size={11} /> Saved
                    </span>
                  )}
                  {autosaveStatus === 'error' && (
                    <span className="text-rose-400 flex items-center gap-1">
                      <AlertTriangle size={11} /> Save error
                    </span>
                  )}
                  {autosaveStatus === 'idle' && (
                    <span className="text-slate-400">Ready</span>
                  )}
                </div>

                <button
                  onClick={() => {
                    handleCodeChange(starterTemplates[activeLang] || '');
                    showToast('Template reset.');
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Reset to starter template"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* Monaco Code Editor */}
            <div className="flex-1 min-h-0 relative">
              <Editor
                height="100%"
                language={activeLang === 'c' || activeLang === 'cpp' ? 'cpp' : activeLang}
                theme="vs-dark"
                value={activeCode}
                onChange={handleCodeChange}
                onMount={(editor) => {
                  const domNode = editor.getDomNode();
                  if (domNode) {
                    domNode.addEventListener('contextmenu', (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      showToast('🚫 Right-click is strictly disabled in the code editor!');
                    }, true);

                    domNode.addEventListener('paste', (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setProctorViolations(v => v + 1);
                      logProctorEvent('MONACO_PASTE_ATTEMPT', 'HIGH', { timestamp: new Date().toISOString() });
                      showToast('🚫 Pasting code is strictly prohibited! Please type your solution manually.');
                    }, true);

                    domNode.addEventListener('copy', (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      showToast('🚫 Copying code is disabled!');
                    }, true);

                    domNode.addEventListener('cut', (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      showToast('🚫 Cut is disabled!');
                    }, true);
                  }

                  editor.onKeyDown((e) => {
                    if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyC' || e.code === 'KeyV' || e.code === 'KeyX')) {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.code === 'KeyV') {
                        setProctorViolations(v => v + 1);
                        logProctorEvent('KEYBOARD_PASTE_ATTEMPT', 'HIGH', { timestamp: new Date().toISOString() });
                        showToast('🚫 Pasting code (Ctrl+V) is disabled! Type solution manually.');
                      } else {
                        showToast('🚫 Clipboard shortcuts are disabled during test!');
                      }
                    }
                  });
                }}
                options={{
                  fontSize: 13,
                  fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                  minimap: { enabled: false },
                  automaticLayout: true,
                  lineNumbers: 'on',
                  tabSize: 4,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  contextmenu: false,
                  copyWithSyntaxHighlighting: false,
                  dragAndDrop: false,
                  links: false
                }}
              />
            </div>

            {/* Bottom Test Runner Panel & Action Buttons */}
            <div className="h-56 bg-[#111827] border-t border-slate-800 flex flex-col shrink-0 z-10">
              <div className="h-11 px-4 bg-[#0A0F1D] flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-indigo-400" />
                  <span className="text-xs font-extrabold text-slate-200">Test Cases Console</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    disabled={isRunning || isSubmitting}
                    onClick={handleRunCode}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Play size={13} className="text-emerald-400" />
                    <span>{isRunning ? 'Running...' : 'Run Code'}</span>
                  </button>

                  <button
                    disabled={isRunning || isSubmitting}
                    onClick={handleSubmitCode}
                    className="px-5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
                  >
                    <Send size={13} />
                    <span>{isSubmitting ? 'Evaluating...' : 'Submit'}</span>
                  </button>
                </div>
              </div>

              {/* Test Results Output */}
              <div className="flex-1 overflow-y-auto p-3 text-xs font-mono space-y-2 custom-scrollbar">
                {sampleTestResults.length === 0 && !submissionFeedback[currentQIdx] && (
                  <div className="text-slate-500 py-6 text-center text-xs">
                    Click <strong>Run Code</strong> to test against sample cases or <strong>Submit</strong> to evaluate against all test cases.
                  </div>
                )}

                {submissionFeedback[currentQIdx] && (
                  <div className="p-3 bg-indigo-950/40 border border-indigo-700/50 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-indigo-300">Latest Submission Status: {submissionFeedback[currentQIdx].status}</span>
                      <p className="text-[11px] text-slate-400">
                        Public Tests: {submissionFeedback[currentQIdx].public_tests_passed}/{submissionFeedback[currentQIdx].public_tests_total} · Hidden Tests: {submissionFeedback[currentQIdx].hidden_tests_passed}/{submissionFeedback[currentQIdx].hidden_tests_total}
                      </p>
                    </div>
                    <div className="text-right font-black text-emerald-400 text-sm">
                      Score: {submissionFeedback[currentQIdx].score} / 50
                    </div>
                  </div>
                )}

                {sampleTestResults.map((r, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border ${
                      r.passed ? 'bg-emerald-950/20 border-emerald-800/60' : 'bg-rose-950/20 border-rose-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold flex items-center gap-1.5">
                        {r.passed ? <CheckCircle2 size={13} className="text-emerald-400" /> : <XCircle size={13} className="text-rose-400" />}
                        <span className={r.passed ? 'text-emerald-300' : 'text-rose-300'}>
                          {r.is_hidden ? `Hidden Test Case #${i + 1}` : `Sample Case #${i + 1}`} — {r.status}
                        </span>
                      </span>
                      <span className="text-[10px] text-slate-500">{r.execution_time_ms} ms</span>
                    </div>

                    {!r.is_hidden && (
                      <div className="grid grid-cols-2 gap-2 text-[11px] mt-1 pt-1 border-t border-slate-800">
                        <div>
                          <span className="text-slate-500 block">Your Output:</span>
                          <span className="text-slate-200">{r.actual_output || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Expected Output:</span>
                          <span className="text-emerald-400">{r.expected_output || '—'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Webcam Proctoring Feed (Draggable Anywhere, Never Obstructs Console) */}
        <motion.div
          drag
          dragMomentum={false}
          whileDrag={{ scale: 1.05 }}
          className="fixed top-18 right-6 z-[9999] w-48 bg-slate-900/95 backdrop-blur-md rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-2xl select-none cursor-move"
          title="Click and drag to position webcam proctor anywhere on screen"
        >
          <div className="flex items-center justify-between px-2.5 py-1 bg-slate-800/90 border-b border-slate-700/80 text-[10px] font-bold text-slate-300 cursor-grab active:cursor-grabbing">
            <span className="flex items-center gap-1 text-slate-200">
              <GripVertical size={13} className="text-slate-400" /> Move Camera
            </span>
            <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 text-[9px] font-black border border-rose-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              LIVE
            </span>
          </div>

          <div className="relative aspect-video bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
            <div className="absolute bottom-1 left-1.5 right-1.5 text-center text-[9px] font-bold text-white/80 bg-black/60 backdrop-blur-xs py-0.5 rounded">
              Camera Monitored
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Render 3: Assessment Catalog & Pre-Check Modal ─────────────────────────
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-zinc-900 text-white rounded-2xl text-xs font-bold shadow-2xl border border-zinc-700">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Laptop size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Industry Coding Assessments</h1>
              <p className="text-xs text-zinc-500 font-semibold mt-0.5">
                Corporate placement coding benchmarks with server-side 2-question random assignment, multi-language support (C, C++, Java, Python), and live proctoring.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Cards Grid */}
      {loading ? (
        <div className="text-center py-20 text-zinc-400 font-bold">Loading coding assessments...</div>
      ) : assessments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-zinc-200 shadow-xs space-y-3">
          <FileCode2 size={40} className="mx-auto text-zinc-300" />
          <h3 className="text-base font-bold text-zinc-700">No Active Coding Assessments</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            You currently have no pending industry coding assessments. When corporate partners publish short coding benchmarks, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map(a => (
            <div
              key={a.id}
              className="bg-white rounded-3xl p-6 border border-zinc-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                    {a.company_name}
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                    a.attempt_status === 'SUBMITTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    a.attempt_status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-zinc-100 text-zinc-700'
                  }`}>
                    {a.attempt_status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-lg font-black text-zinc-900 mb-1 leading-snug">{a.title}</h3>
                <p className="text-xs text-zinc-500 line-clamp-2 mb-4">{a.description || 'Short industry coding benchmark.'}</p>

                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600 bg-zinc-50 p-3.5 rounded-2xl mb-4 border border-zinc-150">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">Questions</span>
                    <span className="font-bold text-zinc-800">2 Assigned (From 10 Pool)</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">Duration</span>
                    <span className="font-bold text-zinc-800">{a.duration_minutes} Minutes</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-zinc-200/60">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">Supported Languages</span>
                    <span className="font-semibold text-indigo-600">C · C++ · Java · Python</span>
                  </div>
                </div>
              </div>

              <div>
                {a.attempt_status === 'SUBMITTED' ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                    <span className="text-xs font-black text-emerald-800">Score: {a.final_score} / 100 ({a.is_passed ? 'PASSED' : 'COMPLETED'})</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenPreCheck(a)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>{a.attempt_status === 'IN_PROGRESS' ? 'Resume Assessment' : 'Start Assessment'}</span>
                    <ChevronRight size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pre-Check & Camera Permission Modal */}
      <AnimatePresence>
        {showPreCheckModal && activeAssessment && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-zinc-200 space-y-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200">
                    Pre-Assessment Proctoring Check
                  </span>
                  <h3 className="text-xl font-black text-zinc-900 mt-2">{activeAssessment.title}</h3>
                </div>
                <button
                  onClick={() => {
                    setShowPreCheckModal(false);
                    stopWebcam();
                  }}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg"
                >
                  <XCircle size={22} />
                </button>
              </div>

              {/* Camera Preview Area */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-600 block">Webcam Feed Verification *</label>
                <div className="relative aspect-video bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-300 shadow-inner flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {!cameraAllowed && (
                    <div className="text-center p-4 text-xs text-zinc-400 space-y-2">
                      <Camera size={28} className="mx-auto text-zinc-500" />
                      <p>{cameraError || 'Requesting camera permissions...'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Assessment Rules */}
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 text-xs text-zinc-600 space-y-1.5 font-medium">
                <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-amber-500" /> Integrity & Device Rules
                </div>
                <p>• 💻 <strong>Desktop / Laptop PC Mandatory:</strong> Mobile phones and tablets are strictly prohibited.</p>
                <p>• You will receive <strong>2 randomly assigned coding questions</strong> from the 10-question pool.</p>
                <p>• You may choose your language (<strong>C, C++, Java, or Python</strong>) independently for each question.</p>
                <p>• Assessment is strictly timed ({activeAssessment.duration_minutes} mins) based on the server clock.</p>
                <p>• Camera must remain active. Fullscreen exits and tab switches will be flagged to HR.</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowPreCheckModal(false);
                    stopWebcam();
                  }}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={!cameraAllowed || isMobileDevice}
                  onClick={handleStartAttempt}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Enter & Start Coding</span>
                  <Maximize2 size={14} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Device Prohibited Alert Modal */}
      <AnimatePresence>
        {showMobileProhibitedModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-rose-200 text-center space-y-5"
            >
              <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                <Laptop size={32} />
              </div>
              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                  Laptop or Desktop Only
                </span>
                <h3 className="text-xl font-black text-zinc-900">Mobile Device Detected</h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Assessment test sessions can <strong>only be attended on a Laptop or Desktop computer</strong>. Mobile devices and tablets are strictly not allowed for exam security and IDE workspace compliance.
                </p>
              </div>
              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200 text-left text-xs text-zinc-700 space-y-1 font-medium">
                <div className="font-bold text-zinc-900 flex items-center gap-1.5 text-xs">
                  💻 Device Requirements:
                </div>
                <p>• Standard Laptop or Desktop PC (Windows, macOS, or Linux)</p>
                <p>• Screen resolution of 1024px width or higher</p>
                <p>• Working front-facing webcam for proctoring</p>
              </div>
              <button
                onClick={() => setShowMobileProhibitedModal(false)}
                className="w-full py-3.5 bg-zinc-900 hover:bg-black text-white font-bold rounded-2xl text-xs transition-all shadow-md cursor-pointer"
              >
                Understood, I will switch to Laptop/Desktop
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentCodingAssessmentView;
