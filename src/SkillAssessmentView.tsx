import React, { useState, useEffect, useRef } from 'react';
import ExcelJS from 'exceljs';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
  Upload,
  Download,
  RefreshCw,
  Eye,
  AlertTriangle,
  RotateCcw,
  BarChart2,
  Users,
  Search,
  Maximize2,
  ShieldAlert,
  Play,
  Check,
  Lock,
  Shuffle,
  Camera,
  Video,
  VideoOff,
  ShieldCheck,
  BookOpen,
  Send,
  ExternalLink,
  Code,
  Building2,
  Briefcase,
  Zap,
  Target,
  Award,
  HelpCircle,
  Lightbulb,
  X,
  Mail
} from 'lucide-react';
import { API_URL } from './config';

interface SkillAssessmentViewProps {
  user: any;
  token: string | null;
  addToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

interface ShuffledOption {
  text: string;
  originalIndex: number;
}

interface AssessmentTrack {
  track_type: string;
  track_title: string;
  question_count: number;
  cutoff_percentage: number;
  icon: string;
  badge: string;
  description: string;
  duration_mins: number;
}

interface RemedialModule {
  skill_tag: string;
  title: string;
  category: string;
  video_title: string;
  video_url: string;
  duration: string;
  cheat_sheet_rules: string[];
  sample_question: string;
  solution_steps: string[];
  gap_label?: string;
}

// Fisher-Yates array shuffling algorithm
const shuffleArray = <T,>(arr: T[]): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const SkillAssessmentView: React.FC<SkillAssessmentViewProps> = ({ user, token, addToast }) => {
  const isHOD = user?.role === 'HOD' || user?.role === 'SUPREME_ADMIN';
  const isAdvisor = user?.role === 'CLASS_ADVISOR';

  // Navigation tabs: 'tracks' | 'test' | 'remedial' | 'upload' | 'analytics' | 'my_marks'
  // Default to Cohort Analytics for HOD/Advisors, and Mock Tracks for Students
  const [activeTab, setActiveTab] = useState<'tracks' | 'test' | 'remedial' | 'upload' | 'analytics' | 'my_marks'>(
    isHOD || isAdvisor ? 'analytics' : 'tracks'
  );

  // ── Tracks State ───────────────────────────────────────────────────────────
  const [tracks, setTracks] = useState<AssessmentTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string>('GENERAL_APTITUDE');
  const [selectedTrackTitle, setSelectedTrackTitle] = useState<string>('General Aptitude Benchmark');
  const [selectedTrackCutoff, setSelectedTrackCutoff] = useState<number>(60);
  const [selectedTrackDuration, setSelectedTrackDuration] = useState<number>(15);
  const [isMicroQuiz, setIsMicroQuiz] = useState<boolean>(false);
  const [microQuizTopic, setMicroQuizTopic] = useState<string | null>(null);

  // ── Raw & Randomized Question State ────────────────────────────────────────
  const [rawQuestions, setRawQuestions] = useState<any[]>([]);
  const [activeQuestions, setActiveQuestions] = useState<any[]>([]); // randomized questions + shuffled options
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [showReview, setShowReview] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 minutes default
  const [telegramAlertSent, setTelegramAlertSent] = useState<boolean>(false);

  // ── Strict Full Screen & Lockdown State ─────────────────────────────────────
  const [testStarted, setTestStarted] = useState(false);
  const [showStartConfirmModal, setShowStartConfirmModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFsWarning, setShowFsWarning] = useState(false);
  const [violationCount, setViolationCount] = useState(0);

  // ── Webcam & Cloudinary Face Verification State ────────────────────────────
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState<boolean>(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);

  // ── AI Remedial Recommendations & Cheat Sheets State ───────────────────────
  const [remedialModules, setRemedialModules] = useState<RemedialModule[]>([]);
  const [selectedCheatSheet, setSelectedCheatSheet] = useState<RemedialModule | null>(null);
  const [isLoadingRemedial, setIsLoadingRemedial] = useState(false);

  // ── HOD Excel Upload & Question Bank State ─────────────────────────────────
  const [excelQuestions, setExcelQuestions] = useState<any[]>([]);
  const [uploadTrackType, setUploadTrackType] = useState<string>('GENERAL_APTITUDE');
  const [uploadTrackCutoff, setUploadTrackCutoff] = useState<number>(60);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── HOD Analytics State ───────────────────────────────────────────────────
  const [analytics, setAnalytics] = useState<any>(null);
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [selectedResultTrack, setSelectedResultTrack] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // ── Manual Assessment Announcement & Targeting State (HOD / Advisor) ─────
  const [showTriggerModal, setShowTriggerModal] = useState<boolean>(false);
  const [triggerTrackType, setTriggerTrackType] = useState<string>('ZOHO_MOCK');
  const [triggerYear, setTriggerYear] = useState<string>('ALL');
  const [triggerClassId, setTriggerClassId] = useState<string>('ALL');
  const [triggerInstructions, setTriggerInstructions] = useState<string>('');
  const [triggerDeadline, setTriggerDeadline] = useState<string>('');
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [targetPreviewCount, setTargetPreviewCount] = useState<number | null>(null);
  const [targetPreviewClasses, setTargetPreviewClasses] = useState<string[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [emailNodesStatus, setEmailNodesStatus] = useState<any>(null);
  const [isLoadingEmailStatus, setIsLoadingEmailStatus] = useState<boolean>(false);

  const fetchEmailNodesStatus = async () => {
    setIsLoadingEmailStatus(true);
    try {
      const res = await fetch(`${API_URL}/api/email-service/status`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data && !data.error) {
        setEmailNodesStatus(data);
      }
    } catch (_) {
    } finally {
      setIsLoadingEmailStatus(false);
    }
  };

  const [myAssessments, setMyAssessments] = useState<any[]>([]);
  const [myAssessmentsMetrics, setMyAssessmentsMetrics] = useState<any>(null);
  const [isLoadingMyAssessments, setIsLoadingMyAssessments] = useState<boolean>(false);
  const [viewingScorecard, setViewingScorecard] = useState<any | null>(null);

  const fetchMyAssessments = async () => {
    setIsLoadingMyAssessments(true);
    try {
      const authHeaders: any = {};
      if (token) authHeaders['Authorization'] = `Bearer ${token}`;
      const url = user?.id ? `${API_URL}/api/assessment/my-results?user_id=${user.id}` : `${API_URL}/api/assessment/my-results`;
      const res = await fetch(url, { headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setMyAssessments(data.assessments || []);
        setMyAssessmentsMetrics(data.metrics || null);
      }
    } catch (e) {
      console.error('Error fetching student assessment marks:', e);
    } finally {
      setIsLoadingMyAssessments(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch(`${API_URL}/api/classes`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAvailableClasses(data);
      }
    } catch (_) {}
  };

  const fetchTargetPreview = async (year: string, classId: string) => {
    setIsLoadingPreview(true);
    try {
      const res = await fetch(`${API_URL}/api/assessment/target-preview?target_year=${year}&target_class_id=${classId}`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        setTargetPreviewCount(data.total_count);
        setTargetPreviewClasses(data.classes_summary || []);
      }
    } catch (_) {
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/assessment/assignments`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        setAssignments(data.assignments || []);
      }
    } catch (_) {}
  };

  const handleDispatchAssessmentCampaign = async () => {
    if (!triggerTrackType) {
      addToast('Please select an assessment track.', 'warning');
      return;
    }
    setIsTriggering(true);
    try {
      const res = await fetch(`${API_URL}/api/assessment/trigger-announcement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          track_type: triggerTrackType,
          target_year: triggerYear,
          target_class_id: triggerClassId,
          custom_instructions: triggerInstructions,
          deadline: triggerDeadline || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`✅ Dispatched assessment notifications to ${data.delivery?.totalDispatched || 0} student(s) via Email Load Balancer!`, 'success');
        setShowTriggerModal(false);
        setTriggerInstructions('');
        setTriggerDeadline('');
        fetchAssignments();
        fetchTracks();
      } else {
        addToast(data.error || 'Failed to dispatch assessment announcement', 'error');
      }
    } catch (e: any) {
      addToast(e.message || 'Network error triggering assessment', 'error');
    } finally {
      setIsTriggering(false);
    }
  };

  useEffect(() => {
    fetchTracks();
    fetchQuestions('GENERAL_APTITUDE');
    fetchLatestResult();
    fetchMyAssessments();
    fetchRemedialPlan();
    if (isHOD || isAdvisor) {
      fetchHodResults();
      fetchClasses();
      fetchAssignments();
      fetchTargetPreview('ALL', 'ALL');
      fetchEmailNodesStatus();
    }
  }, []);

  // ── Webcam Lifecycle Management ────────────────────────────────────────────
  const startWebcam = async () => {
    setCameraError(null);
    try {
      if (webcamStream) {
        webcamStream.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      setWebcamStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Webcam Access Error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser to proceed with institutional proctoring.'
          : 'No camera hardware detected. A functional webcam is mandatory for verified benchmark assessment.'
      );
      setIsCameraActive(false);
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
      setIsCameraActive(false);
    }
  };

  // Ensure webcam hardware is stopped if component unmounts
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [webcamStream]);

  // Trigger camera whenever start modal opens
  useEffect(() => {
    if (showStartConfirmModal && !capturedPhotoUrl) {
      startWebcam();
    }
  }, [showStartConfirmModal]);

  // Connect stream to modal video preview
  useEffect(() => {
    if (showStartConfirmModal && videoRef.current && webcamStream) {
      videoRef.current.srcObject = webcamStream;
    }
  }, [showStartConfirmModal, webcamStream]);

  // Connect stream to Picture-in-Picture proctor window during exam
  useEffect(() => {
    if (testStarted && !testCompleted && pipVideoRef.current && webcamStream) {
      pipVideoRef.current.srcObject = webcamStream;
    }
  }, [testStarted, testCompleted, webcamStream]);

  // Capture face photograph for identity verification & upload to Cloudinary
  const captureIdentityPhoto = async () => {
    if (!videoRef.current) {
      addToast('Camera feed not ready. Please wait...', 'warning');
      return;
    }
    setIsCapturingPhoto(true);
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      // Center crop square
      const minDim = Math.min(video.videoWidth || 640, video.videoHeight || 480);
      const startX = ((video.videoWidth || 640) - minDim) / 2;
      const startY = ((video.videoHeight || 480) - minDim) / 2;

      ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, 480, 480);
      const base64 = canvas.toDataURL('image/jpeg', 0.85);

      // Upload to Cloudinary via backend
      const res = await fetch(`${API_URL}/api/assessment/capture-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          user_id: user?.id
        })
      });
      const data = await res.json();
      if (data.success && data.photo_url) {
        setCapturedPhotoUrl(data.photo_url);
        addToast('Identity photo verified & stored in Cloudinary!', 'success');
      } else {
        setCapturedPhotoUrl(base64);
        addToast('Photo captured locally.', 'info');
      }
    } catch (err) {
      console.error('Error capturing photo:', err);
      addToast('Failed to capture photo. Please retry.', 'error');
    } finally {
      setIsCapturingPhoto(false);
    }
  };

  // Prepare Randomized Questions & Shuffled Answer Options for Student Attempt
  const prepareRandomizedQuestions = (questionsList: any[]) => {
    const shuffledQList = shuffleArray(questionsList);

    return shuffledQList.map(q => {
      const originalOptions: string[] = Array.isArray(q.options) ? q.options : [];
      const optsWithIndices: ShuffledOption[] = originalOptions.map((opt, idx) => ({
        text: opt,
        originalIndex: idx
      }));

      return {
        ...q,
        shuffledOptions: shuffleArray(optsWithIndices)
      };
    });
  };

  // Strict Lockdown: Listen for Fullscreen Changes, Visibility Changes, Tab Blurs, and Keyboard Shortcuts
  useEffect(() => {
    if (!testStarted || testCompleted) return;

    const handleFsChange = () => {
      const isFs = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFs);

      if (!isFs && testStarted && !testCompleted) {
        setViolationCount(prev => prev + 1);
        setShowFsWarning(true);
      } else if (isFs) {
        setShowFsWarning(false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && testStarted && !testCompleted) {
        setViolationCount(prev => prev + 1);
        setShowFsWarning(true);
      }
    };

    const handleWindowBlur = () => {
      if (testStarted && !testCompleted) {
        setViolationCount(prev => prev + 1);
        setShowFsWarning(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.metaKey || (e.ctrlKey && ['c', 'v', 'u', 't', 'w', 'r', 'n'].includes(e.key.toLowerCase()))) {
        e.preventDefault();
        setViolationCount(prev => prev + 1);
        setShowFsWarning(true);
      }
      if (['F11', 'F12'].includes(e.key)) {
        e.preventDefault();
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [testStarted, testCompleted]);

  // Request Fullscreen
  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowFsWarning(false);
    } catch (e) {
      console.error('Fullscreen request failed:', e);
    }
  };

  // Exit Fullscreen
  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
      setIsFullscreen(false);
    } catch (e) {
      console.error('Fullscreen exit failed:', e);
    }
  };

  // Auto-Submit Test if Violations Exceed Tolerance (3 Incidents)
  useEffect(() => {
    if (violationCount >= 3 && testStarted && !testCompleted && !isSubmitting) {
      addToast('Exceeded maximum security violations (3). Test auto-submitted for institutional review.', 'error');
      handleSubmitTest();
    }
  }, [violationCount]);

  // Countdown Timer Hook (Auto-submits when timeLeft hits 0)
  useEffect(() => {
    if (!testStarted || testCompleted || Boolean(testResult)) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, testCompleted, Boolean(testResult)]);

  // Format timer into MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── Data Fetching APIs ─────────────────────────────────────────────────────

  const fetchTracks = async () => {
    try {
      const classId = user?.class_id || '';
      const year = user?.class_year || user?.year || '';
      const res = await fetch(`${API_URL}/api/assessment/tracks?class_id=${classId}&year=${year}`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.tracks)) {
        setTracks(data.tracks);
      }
    } catch (e) {
      console.error('Error fetching tracks:', e);
    }
  };

  const fetchQuestions = async (track: string = selectedTrack, skillTag?: string) => {
    try {
      let url = `${API_URL}/api/assessment/questions?track=${track}`;
      if (skillTag) {
        url = `${API_URL}/api/assessment/questions?skill_tag=${encodeURIComponent(skillTag)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        setRawQuestions(data.questions);
        setActiveQuestions(prepareRandomizedQuestions(data.questions));
      }
    } catch (e) {
      console.error('Error fetching questions:', e);
    }
  };

  const fetchLatestResult = async (track?: string) => {
    try {
      const authHeaders: any = {};
      if (token) authHeaders['Authorization'] = `Bearer ${token}`;
      let url = user?.id ? `${API_URL}/api/assessment/my-latest?user_id=${user.id}` : `${API_URL}/api/assessment/my-latest`;
      if (track) url += `&track=${track}`;
      const res = await fetch(url, { headers: authHeaders });
      const data = await res.json();
      if (data.success && data.assessment) {
        setTestResult({
          score_percentage: Number(data.assessment.score_percentage),
          correct_count: data.assessment.correct_count,
          total_questions: data.assessment.total_questions,
          category_breakdown: data.assessment.category_breakdown || {},
          strengths: data.assessment.strengths || [],
          gaps: data.assessment.gaps || [],
          answers_summary: data.assessment.answers_summary || [],
          proctor_photo_url: data.assessment.proctor_photo_url,
          track_title: data.assessment.track_title,
          is_passed: data.assessment.is_passed,
          cutoff_percentage: data.assessment.cutoff_percentage
        });
      }
    } catch (e) {
      console.error('Error fetching latest assessment:', e);
    }
  };

  const fetchRemedialPlan = async () => {
    setIsLoadingRemedial(true);
    try {
      const authHeaders: any = {};
      if (token) authHeaders['Authorization'] = `Bearer ${token}`;
      const url = user?.id ? `${API_URL}/api/assessment/remedial-plan?user_id=${user.id}` : `${API_URL}/api/assessment/remedial-plan`;
      const res = await fetch(url, { headers: authHeaders });
      const data = await res.json();
      if (data.success && Array.isArray(data.remedial_modules)) {
        setRemedialModules(data.remedial_modules);
      }
    } catch (e) {
      console.error('Error fetching remedial plan:', e);
    } finally {
      setIsLoadingRemedial(false);
    }
  };

  const fetchHodResults = async () => {
    setIsLoadingResults(true);
    try {
      const res = await fetch(`${API_URL}/api/assessment/hod-results`);
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.metrics);
        setStudentResults(data.results || []);
      }
    } catch (e) {
      console.error('Error fetching HOD results:', e);
    } finally {
      setIsLoadingResults(false);
    }
  };

  // ── Student: Track Selection & Assessment Flow ─────────────────────────────

  const handleSelectTrack = async (t: AssessmentTrack) => {
    setIsMicroQuiz(false);
    setMicroQuizTopic(null);
    setSelectedTrack(t.track_type);
    setSelectedTrackTitle(t.track_title);
    setSelectedTrackCutoff(t.cutoff_percentage);
    setSelectedTrackDuration(t.duration_mins);
    await fetchQuestions(t.track_type);
    setActiveTab('test');
    setShowStartConfirmModal(true);
  };

  const handleLaunchMicroQuiz = async (mod: RemedialModule) => {
    setIsMicroQuiz(true);
    setMicroQuizTopic(mod.skill_tag);
    setSelectedTrack('MICRO_REMEDIAL');
    setSelectedTrackTitle(`5-Question Targeted Micro-Quiz: ${mod.skill_tag}`);
    setSelectedTrackCutoff(80);
    setSelectedTrackDuration(5);
    await fetchQuestions('MICRO_REMEDIAL', mod.skill_tag);
    setActiveTab('test');
    setShowStartConfirmModal(true);
  };

  // Student Starts Proctored Test
  const handleStartAssessment = async () => {
    if (!capturedPhotoUrl) {
      addToast('Please capture and verify your face photo before proceeding.', 'warning');
      return;
    }
    setShowStartConfirmModal(false);
    await enterFullscreen();

    // Freshly randomize question sequence and swap options for this attempt
    const freshlyShuffled = prepareRandomizedQuestions(rawQuestions.length > 0 ? rawQuestions : activeQuestions);
    setActiveQuestions(freshlyShuffled);
    setCurrentIdx(0);
    setSelectedAnswers({});
    setTimeLeft(selectedTrackDuration * 60);
    setTestStarted(true);
    setTestCompleted(false);
    setTestResult(null);

    addToast(`Assessment started! Live webcam proctoring active for ${selectedTrackTitle}.`, 'success');
  };

  // Student Submits Test
  const handleSubmitTest = async () => {
    setIsSubmitting(true);
    stopWebcam();
    await exitFullscreen();
    try {
      const res = await fetch(`${API_URL}/api/assessment/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          answers: selectedAnswers, // maps { [qId]: originalIndex }
          question_ids: activeQuestions.map(q => q.id),
          time_taken_seconds: Math.max(0, (selectedTrackDuration * 60) - timeLeft),
          user_id: user?.id,
          student_name: user?.full_name,
          register_number: user?.register_number,
          proctor_photo_url: capturedPhotoUrl,
          track_type: isMicroQuiz ? 'MICRO_REMEDIAL' : selectedTrack,
          track_title: selectedTrackTitle,
          cutoff_percentage: selectedTrackCutoff
        })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(data.result);
        setTestCompleted(true);
        setTestStarted(false);
        setTelegramAlertSent(true);
        addToast(`Assessment completed! Score: ${data.result.score_percentage}% • Telegram alert dispatched! 📱`, 'success');
        fetchRemedialPlan();
        fetchMyAssessments();
      } else {
        addToast(data.error || 'Failed to submit test', 'error');
      }
    } catch (e) {
      addToast('Error submitting assessment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetakeTest = async () => {
    stopWebcam();
    setCapturedPhotoUrl(null);
    setTestStarted(false);
    setTestCompleted(false);
    setTestResult(null);
    setSelectedAnswers({});
    setShowReview(false);
    setViolationCount(0);
    setTimeLeft(selectedTrackDuration * 60);
    await fetchQuestions(selectedTrack, isMicroQuiz ? (microQuizTopic || undefined) : undefined);
    setShowStartConfirmModal(true);
  };

  // ── HOD: Excel Upload and Publish ──────────────────────────────────────────

  const handleDownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Aptitude Questions');

    worksheet.columns = [
      { header: 'Question Text', key: 'question_text', width: 45 },
      { header: 'Option A', key: 'opt_a', width: 22 },
      { header: 'Option B', key: 'opt_b', width: 22 },
      { header: 'Option C', key: 'opt_c', width: 22 },
      { header: 'Option D', key: 'opt_d', width: 22 },
      { header: 'Correct Option (A/B/C/D)', key: 'correct_option', width: 24 },
      { header: 'Category', key: 'category', width: 24 },
      { header: 'Skill Tag', key: 'skill_tag', width: 24 },
      { header: 'Difficulty', key: 'difficulty', width: 14 },
      { header: 'Explanation / Principles', key: 'explanation', width: 40 }
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }
    };

    worksheet.addRow({
      question_text: "What will be the output of System.out.println(10 + 20 + 'Hello' + 10 + 20)?",
      opt_a: "30Hello1020",
      opt_b: "30Hello30",
      opt_c: "1020Hello1020",
      opt_d: "Compile Error",
      correct_option: "A",
      category: "Technical Core",
      skill_tag: "Core Java",
      difficulty: "MEDIUM",
      explanation: "Java evaluates left to right. 10 + 20 is integer addition (30). Then 30 + 'Hello' is string concatenation."
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Institutional_Questions_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Template downloaded successfully!', 'success');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new Error('Excel file contains no worksheets.');

      const parsed: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header

        const qText = String(row.getCell(1).value || '').trim();
        const optA = String(row.getCell(2).value || '').trim();
        const optB = String(row.getCell(3).value || '').trim();
        const optC = String(row.getCell(4).value || '').trim();
        const optD = String(row.getCell(5).value || '').trim();
        const correctRaw = String(row.getCell(6).value || '').trim().toUpperCase();
        const category = String(row.getCell(7).value || 'Quantitative Aptitude').trim();
        const skillTag = String(row.getCell(8).value || 'Aptitude').trim();
        const difficulty = String(row.getCell(9).value || 'MEDIUM').trim().toUpperCase();
        const explanation = String(row.getCell(10).value || 'Standard principles apply.').trim();

        if (!qText || !optA || !optB) return;

        let correctIdx = 0;
        if (correctRaw === 'B' || correctRaw === '2') correctIdx = 1;
        else if (correctRaw === 'C' || correctRaw === '3') correctIdx = 2;
        else if (correctRaw === 'D' || correctRaw === '4') correctIdx = 3;

        parsed.push({
          question_text: qText,
          options: [optA, optB, optC, optD].filter(Boolean),
          correct_option: correctIdx,
          category,
          skill_tag: skillTag,
          difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(difficulty) ? difficulty : 'MEDIUM',
          explanation
        });
      });

      if (parsed.length === 0) {
        addToast('No valid questions parsed. Please check template format.', 'error');
      } else {
        setExcelQuestions(parsed);
        addToast(`Successfully parsed ${parsed.length} questions from Excel.`, 'success');
      }
    } catch (err: any) {
      console.error('Error parsing Excel:', err);
      addToast(err.message || 'Failed to read Excel file.', 'error');
    } finally {
      setIsParsingExcel(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePublishQuestions = async () => {
    if (excelQuestions.length === 0) return;
    setIsPublishing(true);
    try {
      const res = await fetch(`${API_URL}/api/assessment/questions/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: excelQuestions,
          replaceExisting: false,
          track_type: uploadTrackType,
          track_title: tracks.find(t => t.track_type === uploadTrackType)?.track_title || uploadTrackType,
          cutoff_percentage: uploadTrackCutoff
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Published ${data.count} questions to ${uploadTrackType}!`, 'success');
        setExcelQuestions([]);
        fetchQuestions();
        fetchTracks();
      } else {
        addToast(data.error || 'Failed to publish questions', 'error');
      }
    } catch (e) {
      addToast('Error publishing questions', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  // ── HOD: Export Student Results to Excel ────────────────────────────────────

  const handleExportResults = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Assessment Results');

      worksheet.columns = [
        { header: 'S.No', key: 'sno', width: 8 },
        { header: 'Student Name', key: 'name', width: 26 },
        { header: 'Register Number', key: 'regNo', width: 20 },
        { header: 'Class / Section', key: 'className', width: 18 },
        { header: 'Assessment Track', key: 'track', width: 28 },
        { header: 'Score (%)', key: 'score', width: 14 },
        { header: 'Result Status', key: 'status', width: 16 },
        { header: 'Correct Answers', key: 'correct', width: 16 },
        { header: 'Total Questions', key: 'total', width: 16 },
        { header: 'Time Taken (sec)', key: 'time', width: 16 },
        { header: 'Attempt Timestamp', key: 'timestamp', width: 24 }
      ];

      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF18181B' }
      };

      const filtered = studentResults.filter(s => {
        if (selectedResultTrack !== 'ALL' && s.track_type !== selectedResultTrack) return false;
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return s.student_name?.toLowerCase().includes(q) || s.register_number?.toLowerCase().includes(q);
      });

      filtered.forEach((r, idx) => {
        worksheet.addRow({
          sno: idx + 1,
          name: r.student_name,
          regNo: r.register_number,
          className: r.class_name || 'Unassigned',
          track: r.track_title || 'General Aptitude',
          score: `${r.score_percentage}%`,
          status: Number(r.score_percentage) >= 60 ? 'PASSED' : 'REMEDIAL REQUIRED',
          correct: r.correct_count,
          total: r.total_questions,
          time: r.time_taken_seconds,
          timestamp: new Date(r.created_at).toLocaleString()
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Assessment_Submissions_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      addToast(`Exported ${filtered.length} student scores to Excel!`, 'success');
    } catch (e) {
      addToast('Error exporting results', 'error');
    }
  };

  const isLockdownActive = testStarted && !testCompleted;
  const currentQ = activeQuestions[currentIdx];
  const totalQuestionCount = activeQuestions.length;

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden p-4 md:p-8 bg-[#F5F5F4] flex flex-col min-h-0">
      <div className="w-full flex flex-col min-h-full space-y-6">

        {/* ── Header Bar ────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                <Sparkles size={20} />
              </div>
              <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                Placement Skill Benchmark & Mock Tracks
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 text-amber-900 border border-amber-300 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                SIH DEMO PURPOSE ONLY
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-semibold mt-1">
              Standardized Technical & Company Mock Assessments • AI Remedial Recommendations • Telegram Alerting
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {(isHOD || isAdvisor) && !isLockdownActive && (
              <button
                type="button"
                onClick={() => {
                  setShowTriggerModal(true);
                  fetchTargetPreview(triggerYear, triggerClassId);
                  fetchEmailNodesStatus();
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 hover:from-blue-700 hover:to-violet-800 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Mail size={14} className="text-white" />
                <span>Trigger Assessment & Emails</span>
                {emailNodesStatus && (
                  <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] rounded-full font-mono font-bold">
                    {emailNodesStatus.totalAvailableCredits ?? 600} credits
                  </span>
                )}
              </button>
            )}

            {/* Navigation Tab Switcher */}
            {!isLockdownActive ? (
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 custom-scrollbar">
                {(isHOD || isAdvisor) ? (
                  <>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('analytics'); fetchHodResults(); }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        activeTab === 'analytics'
                          ? 'bg-black text-white shadow-md'
                          : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                      }`}
                    >
                      <BarChart2 size={14} />
                      <span>Cohort Results & Submissions ({studentResults.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        activeTab === 'upload'
                          ? 'bg-black text-white shadow-md'
                          : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                      }`}
                    >
                      <FileSpreadsheet size={14} />
                      <span>Upload Excel Questions</span>
                    </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('tracks')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      activeTab === 'tracks'
                        ? 'bg-black text-white shadow-md'
                        : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                    }`}
                  >
                    <Target size={14} />
                    <span>Mock Tracks Bank</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('my_marks'); fetchMyAssessments(); }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      activeTab === 'my_marks'
                        ? 'bg-black text-white shadow-md'
                        : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                    }`}
                  >
                    <Award size={14} className={activeTab === 'my_marks' ? 'text-amber-300' : 'text-amber-500'} />
                    <span>My Assessment Marks ({myAssessments.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('tracks')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      activeTab === 'tracks'
                        ? 'bg-black text-white shadow-md'
                        : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                    }`}
                  >
                    <Target size={14} />
                    <span>Mock Test Tracks</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('remedial')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      activeTab === 'remedial'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                    }`}
                  >
                    <BookOpen size={14} />
                    <span>AI Remedials & Cheat Sheets</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('test')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      activeTab === 'test'
                        ? 'bg-black text-white shadow-md'
                        : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                    }`}
                  >
                    <ShieldCheck size={14} />
                    <span>Assessment Room</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                SIH Demo Mode
              </span>
              <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-200 flex items-center gap-1.5 animate-pulse">
                <ShieldAlert size={14} /> Lockdown Active
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                <Video size={13} /> Webcam Proctoring
              </span>
              <span className="px-3 py-1 bg-zinc-100 text-zinc-700 rounded-full text-xs font-bold border border-zinc-200 flex items-center gap-1.5">
                <Shuffle size={13} /> Randomized Set
              </span>
            </div>
          )}
          </div>
        </div>

        {/* ── Notice for Students: SIH Demo Purpose Only ── */}
        {!isHOD && !isAdvisor && !isLockdownActive && (
          <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-300/90 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-sm shrink-0 mt-0.5">
                <AlertTriangle size={20} className="text-amber-100" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest bg-amber-200/90 text-amber-950 px-2.5 py-0.5 rounded-full border border-amber-300 shadow-2xs">
                    Official Student Notice
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-amber-950">
                    🎯 Assessment System Configured for SIH Demo Purposes Only
                  </span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  This skill assessment portal, proctored mock tracks, scoring rubrics, and automated AI remedials inside this project are deployed for <strong>Smart India Hackathon (SIH) demonstration and evaluation purposes only</strong>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                  <div className="bg-white/80 border border-amber-200/90 rounded-xl px-2.5 py-1.5 text-[11px] text-amber-900 flex items-center gap-1.5 font-medium shadow-2xs">
                    <span className="font-bold text-amber-700">1.</span> Select Any Mock Track
                  </div>
                  <div className="bg-white/80 border border-amber-200/90 rounded-xl px-2.5 py-1.5 text-[11px] text-amber-900 flex items-center gap-1.5 font-medium shadow-2xs">
                    <span className="font-bold text-amber-700">2.</span> Webcam Identity Check
                  </div>
                  <div className="bg-white/80 border border-amber-200/90 rounded-xl px-2.5 py-1.5 text-[11px] text-amber-900 flex items-center gap-1.5 font-medium shadow-2xs">
                    <span className="font-bold text-amber-700">3.</span> Fullscreen Lockdown
                  </div>
                  <div className="bg-white/80 border border-amber-200/90 rounded-xl px-2.5 py-1.5 text-[11px] text-amber-900 flex items-center gap-1.5 font-medium shadow-2xs">
                    <span className="font-bold text-amber-700">4.</span> Telegram Scorecard
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Active Assessment Announcements Banner ── */}
        {assignments.length > 0 && !isLockdownActive && (
          <div className="bg-gradient-to-r from-indigo-50/90 via-violet-50/70 to-sky-50/90 border border-indigo-200/80 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 font-bold">
                  <Send size={15} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-200">
                      Active Campaign
                    </span>
                    <h4 className="text-xs font-extrabold text-zinc-900">
                      {assignments[0].track_title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    Target Cohort: <strong className="text-zinc-800">{assignments[0].target_year === 'ALL' ? 'All Batches (II & III IT)' : `Year ${assignments[0].target_year}`}</strong>
                    {assignments[0].class_name ? ` • Section: ${assignments[0].class_name}` : ' • All Sections'}
                    {assignments[0].deadline ? ` • Deadline: ${new Date(assignments[0].deadline).toLocaleString()}` : ''}
                  </p>
                </div>
              </div>

              {(isHOD || isAdvisor) && (
                <button
                  type="button"
                  onClick={() => {
                    setShowTriggerModal(true);
                    fetchTargetPreview(triggerYear, triggerClassId);
                  }}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50/80 border border-indigo-200 px-3 py-1.5 rounded-xl transition shadow-2xs whitespace-nowrap cursor-pointer"
                >
                  + Trigger Another Assessment
                </button>
              )}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            PRE-TEST MODAL: WEBCAM IDENTITY VERIFICATION & FULLSCREEN CONFIRMATION
            ═════════════════════════════════════════════════════════════════════ */}
        {showStartConfirmModal && (
          <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-zinc-200 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Camera size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-zinc-900 tracking-tight">
                      Webcam Identity Verification
                    </h3>
                    <p className="text-xs text-zinc-500 font-medium">
                      {selectedTrackTitle}
                    </p>
                  </div>
                </div>

                {capturedPhotoUrl && (
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                )}
              </div>

              {/* Webcam Viewport & Photo Capture Frame */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col items-center justify-center text-center space-y-3">
                {capturedPhotoUrl ? (
                  /* Captured Face Preview */
                  <div className="relative">
                    <img
                      src={capturedPhotoUrl}
                      alt="Verified Face"
                      className="w-44 h-44 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCapturedPhotoUrl(null);
                        startWebcam();
                      }}
                      className="absolute bottom-2 right-2 p-2 bg-black/80 hover:bg-black text-white rounded-xl shadow transition"
                      title="Retake Photo"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                ) : cameraError ? (
                  <div className="p-6 text-center space-y-2">
                    <VideoOff size={32} className="mx-auto text-rose-500" />
                    <p className="text-xs text-rose-700 font-semibold max-w-xs">{cameraError}</p>
                    <button
                      type="button"
                      onClick={startWebcam}
                      className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition"
                    >
                      Retry Camera Permission
                    </button>
                  </div>
                ) : (
                  /* Live Video Stream Viewport */
                  <div className="relative w-48 h-48 rounded-2xl overflow-hidden bg-black border-2 border-dashed border-indigo-400 shadow-inner">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                    <div className="absolute inset-0 border-2 border-indigo-500/40 rounded-2xl pointer-events-none" />
                    <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] font-bold text-white bg-black/60 backdrop-blur-xs py-0.5 rounded">
                      Position face in center
                    </div>
                  </div>
                )}

                {/* Capture Photo Button */}
                {!capturedPhotoUrl && isCameraActive && (
                  <button
                    type="button"
                    disabled={isCapturingPhoto}
                    onClick={captureIdentityPhoto}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera size={14} /> {isCapturingPhoto ? 'Verifying Face...' : 'Capture Face Photo'}
                  </button>
                )}
              </div>

              {/* Assessment Rules */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-amber-900 space-y-2 text-xs">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <ShieldAlert size={15} /> Strict Institutional Integrity Protocol:
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800/90 leading-relaxed font-medium">
                  <li className="text-amber-950 font-bold">
                    <strong>SIH Demo Purpose:</strong> This assessment session is conducted for Smart India Hackathon (SIH) demonstration purposes only within this project.
                  </li>
                  <li><strong>Target Benchmark:</strong> {selectedTrackTitle} (Cutoff: {selectedTrackCutoff}%).</li>
                  <li><strong>Full-Screen Lockdown:</strong> Leaving full-screen logs an integrity incident.</li>
                  <li><strong>Telegram Alert:</strong> Scorecard will be instantly dispatched to your Telegram account upon submission.</li>
                  <li><strong>Time Limit:</strong> {selectedTrackDuration} Minutes duration with automatic submission.</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    stopWebcam();
                    setShowStartConfirmModal(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-900 rounded-xl hover:bg-zinc-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!capturedPhotoUrl}
                  onClick={handleStartAssessment}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 ${
                    capturedPhotoUrl
                      ? 'bg-black hover:bg-zinc-800 text-white cursor-pointer'
                      : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  <Play size={14} /> Enter Full-Screen Exam Room
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            LIVE WEBCAM PICTURE-IN-PICTURE (Shown during active test)
            ═════════════════════════════════════════════════════════════════════ */}
        {isLockdownActive && isCameraActive && (
          <div className="fixed bottom-5 right-5 z-[999999] w-40 sm:w-48 bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl border-2 border-emerald-500 space-y-1.5 flex flex-col items-center">
            <div className="relative w-full h-28 sm:h-32 rounded-xl overflow-hidden bg-black">
              <video
                ref={pipVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-[9px] font-bold text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>PROCTORING</span>
              </div>
            </div>
            <div className="flex items-center justify-between w-full px-1 text-[10px] font-bold text-zinc-600">
              <span>Webcam Active</span>
              <span className="text-emerald-600 font-extrabold text-[9px]">● LIVE</span>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            STRICT FULL SCREEN VIOLATION MODAL
            ═════════════════════════════════════════════════════════════════════ */}
        {showFsWarning && testStarted && !testCompleted && (
          <div className="fixed inset-0 z-[9999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white border-2 border-red-500 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
                <AlertTriangle size={30} />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-zinc-900 tracking-tight">
                  Strict Full-Screen Violation
                </h3>
                <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                  You have exited full-screen mode or switched windows. Institutional integrity requires strict full-screen to remain active until completion.
                </p>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
                Violation Incident #{violationCount} Logged
              </div>

              <button
                type="button"
                onClick={enterFullscreen}
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Maximize2 size={15} /> Return to Full Screen to Continue
              </button>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW 1: MOCK TEST TRACKS HUB (Company & Technical Evaluation Suites)
            ═════════════════════════════════════════════════════════════════════ */}
        {!isLockdownActive && activeTab === 'tracks' && (
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    Campus Placement Suites
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                    SIH Demo Sandbox
                  </span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mt-2">
                  Company-Specific & Technical Mock Tracks
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Choose a specialized evaluation track patterned after top recruiters. Each track enforces strict proctoring and calculates separate eligibility scores. (Live interactive simulation for SIH Demo).
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-600" /> SIH Demo Active
                </span>
                <span className="text-xs font-bold text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200 flex items-center gap-1.5">
                  <Send size={13} className="text-indigo-600" /> Telegram Alerts Active
                </span>
              </div>
            </div>

            {/* Track Selection Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tracks.map(t => {
                const isSelected = selectedTrack === t.track_type;
                return (
                  <div
                    key={t.track_type}
                    className={`bg-white border rounded-2xl p-6 shadow-sm transition-all duration-200 flex flex-col justify-between space-y-4 hover:shadow-md ${
                      isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="space-y-3">
                      {(t as any).is_assigned && (
                        <div className="bg-amber-50 border border-amber-200/90 rounded-xl px-3 py-1.5 flex items-center justify-between text-[10px] font-extrabold text-amber-900 animate-pulse">
                          <span className="flex items-center gap-1.5">
                            <Sparkles size={13} className="text-amber-600" />
                            ASSIGNED BY HOD
                          </span>
                          {(t as any).assignment_details?.deadline && (
                            <span className="font-mono text-amber-800">
                              ⏰ Due: {new Date((t as any).assignment_details.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-start justify-between">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-200">
                          {t.badge}
                        </span>
                        <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                          Cutoff: {t.cutoff_percentage}%
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-extrabold text-zinc-900 leading-snug">
                          {t.track_title}
                        </h4>
                        <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                          {t.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-zinc-100">
                      <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
                        <span className="flex items-center gap-1">
                          <HelpCircle size={13} /> {t.question_count} Questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={13} /> {t.duration_mins} Minutes
                        </span>
                      </div>

                      {(isHOD || isAdvisor) ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedResultTrack(t.track_type);
                              setActiveTab('analytics');
                              fetchHodResults();
                            }}
                            className="flex-1 py-2.5 px-3 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <BarChart2 size={13} /> View Results
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectTrack(t)}
                            className="py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold border border-zinc-200 transition flex items-center justify-center gap-1 cursor-pointer"
                            title="Preview Test as Student"
                          >
                            <Eye size={13} /> Preview
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectTrack(t)}
                          className="w-full py-2.5 px-4 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Play size={13} /> Launch Proctored Assessment
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW 2: AI REMEDIAL RECOMMENDATIONS & FORMULA CHEAT SHEETS
            ═════════════════════════════════════════════════════════════════════ */}
        {!isLockdownActive && activeTab === 'remedial' && (
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    Adaptive Learning Engine
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                    SIH Demo Showcase
                  </span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mt-2">
                  Personalized AI Remedial Recommendations
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Targeted learning modules, formula cheat sheets, and 5-question micro-quizzes generated from your identified skill gaps (&lt;60% accuracy). Demonstrating automated student remediation for SIH evaluation.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchRemedialPlan}
                className="px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-zinc-200 shadow-2xs"
              >
                <RefreshCw size={13} /> Refresh Recommendations
              </button>
            </div>

            {/* Remedial Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {remedialModules.map((mod, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        Priority Gap Focus
                      </span>
                      <span className="text-xs font-bold text-zinc-400">{mod.category}</span>
                    </div>

                    <div>
                      <h4 className="text-base font-extrabold text-zinc-900 leading-snug">
                        {mod.title}
                      </h4>
                      <span className="inline-block text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-1">
                        Topic: {mod.skill_tag}
                      </span>
                    </div>

                    {/* Curated Video Lecture Recommendation */}
                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-zinc-800">
                        <span className="flex items-center gap-1.5 text-zinc-900">
                          <Video size={14} className="text-rose-600" /> Curated Video Lecture
                        </span>
                        <span className="text-[10px] text-zinc-400">{mod.duration}</span>
                      </div>
                      <p className="text-[11px] text-zinc-600 line-clamp-1">{mod.video_title}</p>
                      <a
                        href={mod.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline pt-0.5"
                      >
                        Watch Video Tutorial <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setSelectedCheatSheet(mod)}
                      className="w-full py-2 px-3 bg-white hover:bg-zinc-50 text-zinc-800 rounded-xl text-xs font-bold border border-zinc-200 shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Lightbulb size={13} className="text-amber-500" /> Formula & Rules Cheat Sheet
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLaunchMicroQuiz(mod)}
                      className="w-full py-2.5 px-4 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Zap size={13} className="text-amber-400" /> Take 5-Q Targeted Micro-Quiz
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            FORMULA CHEAT SHEET MODAL (Quick reference drawer)
            ═════════════════════════════════════════════════════════════════════ */}
        {selectedCheatSheet && (
          <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-zinc-200 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb size={20} className="text-amber-500" />
                  <h3 className="text-base font-extrabold text-zinc-900">
                    {selectedCheatSheet.title} Cheat Sheet
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCheatSheet(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Cheat Sheet Rules */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Essential Mathematical & Syntax Rules:
                </h4>
                <div className="space-y-1.5 p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
                  {selectedCheatSheet.cheat_sheet_rules?.map((rule, rIdx) => (
                    <div key={rIdx} className="flex items-start gap-2 text-xs font-medium text-zinc-800">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Problem & Step-by-Step Solution */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Solved Placement Benchmark Problem:
                </h4>
                <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2 text-xs">
                  <p className="font-bold text-indigo-950">{selectedCheatSheet.sample_question}</p>
                  <div className="space-y-1 text-indigo-900/90 text-[11px] font-medium pt-1 border-t border-indigo-100">
                    {selectedCheatSheet.solution_steps?.map((step, sIdx) => (
                      <div key={sIdx}>Step {sIdx + 1}: {step}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCheatSheet(null)}
                  className="px-5 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition"
                >
                  Got It, Ready to Practice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW 3: ASSESSMENT ROOM (Pre-Flight, Live Test, and Scorecard)
            ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'test' && (
          <div>
            {testCompleted && testResult ? (
              /* State A: Scorecard Results View */
              <div className="space-y-6">
                
                {/* Telegram Alert Notification Banner */}
                {telegramAlertSent && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-900 text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <Send size={16} className="text-emerald-700 shrink-0" />
                      <span>
                        <strong>Scorecard Sent to Telegram!</strong> An instant performance breakdown has been dispatched to your linked device.
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                      Dispatched
                    </span>
                  </div>
                )}

                {/* Scorecard Hero Card */}
                <div className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    {testResult.proctor_photo_url ? (
                      <div className="relative shrink-0">
                        <img
                          src={testResult.proctor_photo_url}
                          alt="Proctor Verified Face"
                          className="w-28 h-28 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                        />
                        <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[9px] font-bold shadow-xs">
                          Face Verified
                        </span>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <Award size={40} />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          testResult.score_percentage >= (testResult.cutoff_percentage || 60)
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {testResult.score_percentage >= (testResult.cutoff_percentage || 60) ? 'PASSED ✅' : 'REMEDIAL REQUIRED ⚠️'}
                        </span>
                        <span className="text-xs font-bold text-zinc-500 font-mono">
                          Track: {testResult.track_title || selectedTrackTitle}
                        </span>
                      </div>

                      <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                        Score: {testResult.score_percentage}% ({testResult.correct_count}/{testResult.total_questions} Correct)
                      </h2>
                      <p className="text-xs text-zinc-500 max-w-md">
                        Institutional placement benchmark score recorded in database. Cutoff for this track is {testResult.cutoff_percentage || selectedTrackCutoff}%.
                      </p>
                      <div className="mt-2 text-[11px] font-semibold text-amber-900 bg-amber-50/90 border border-amber-300/80 rounded-xl p-2.5 flex items-center gap-2">
                        <Sparkles size={14} className="text-amber-600 shrink-0" />
                        <span><strong>SIH Demo Notice:</strong> This score, webcam identity verification, and evaluation breakdown were recorded for SIH Demo presentation purposes only.</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('remedial')}
                      className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <BookOpen size={14} /> View AI Remedials & Cheat Sheets
                    </button>
                    <button
                      type="button"
                      onClick={handleRetakeTest}
                      className="w-full sm:w-auto px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold border border-zinc-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw size={14} /> Retake Assessment
                    </button>
                  </div>
                </div>

                {/* Performance Analytics Breakdown */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-zinc-900">Domain Performance Breakdown</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(testResult.category_breakdown || {}).map(([cat, score]) => (
                      <div key={cat} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold text-zinc-800">
                          <span>{cat}</span>
                          <span>{Number(score)}%</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              Number(score) >= 75 ? 'bg-emerald-500' : Number(score) >= 50 ? 'bg-indigo-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowReview(!showReview)}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {showReview ? 'Hide Question Solutions' : 'Review Question Solutions'} <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                {/* Answers Review */}
                {showReview && (
                  <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-zinc-900">Question-by-Question Solution Review</h3>
                    <div className="space-y-4 divide-y divide-zinc-100">
                      {testResult.answers_summary?.map((a: any, idx: number) => (
                        <div key={idx} className="pt-4 space-y-2 text-xs">
                          <div className="flex items-start justify-between gap-4">
                            <span className="font-bold text-zinc-900">Q{idx + 1}. {a.question_text}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                              a.is_correct ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                            }`}>
                              {a.is_correct ? '✓ Correct' : '✕ Incorrect'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {a.options?.map((opt: string, oIdx: number) => {
                              const isSelected = oIdx === a.selected_option;
                              const isCorrect = oIdx === a.correct_option;
                              return (
                                <div
                                  key={oIdx}
                                  className={`p-2.5 rounded-xl border text-[11px] font-medium ${
                                    isCorrect
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                      : isSelected
                                      ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                                      : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                                  }`}
                                >
                                  <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                                  {isCorrect && <span className="block text-[10px] text-emerald-700 font-bold">Correct Answer</span>}
                                </div>
                              );
                            })}
                          </div>

                          <p className="text-[11px] text-zinc-600 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                            💡 <span className="font-bold text-zinc-800">Explanation:</span> {a.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : !testStarted ? (
              /* State B: Pre-Flight Assessment Confirmation Screen */
              <div className="bg-white border border-zinc-200 rounded-3xl p-8 md:p-12 shadow-sm max-w-3xl mx-auto text-center space-y-8 my-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto shadow-xs">
                  <Sparkles size={32} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                      Selected Mock Track
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                      SIH Demo Purpose Only
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900 tracking-tight">
                    {selectedTrackTitle}
                  </h2>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                    A standardized {totalQuestionCount}-question evaluation with strict webcam identity proctoring and full-screen enforcement. Cutoff score is {selectedTrackCutoff}%. (Conducted for SIH Demo purpose only).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs">
                      <Clock size={15} className="text-zinc-700" /> {selectedTrackDuration} Minutes Duration
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-snug">Auto-submits automatically when the countdown timer expires.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs">
                      <Camera size={15} className="text-zinc-700" /> Webcam Proctoring
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-snug">Identity photo captured in Cloudinary and monitored during exam.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs">
                      <Send size={15} className="text-zinc-700" /> Telegram Alerts
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-snug">Scorecard dispatched to your Telegram chat upon completion.</p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setShowStartConfirmModal(true)}
                    className="w-full sm:w-auto px-8 py-3.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Camera size={16} /> Verify Face Identity & Begin Test
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('tracks')}
                    className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-zinc-100 text-zinc-700 rounded-xl text-sm font-bold border border-zinc-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Target size={16} /> Change Track
                  </button>
                </div>
              </div>
            ) : (
              /* State C: Active Interactive Test with Strict Fullscreen & Proctoring */
              <div className="space-y-6">
                
                {/* Header Status Bar with Fullscreen Indicator & Live Timer */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                    <span className="text-xs font-bold text-zinc-400 mr-2">Questions:</span>
                    {activeQuestions.map((_, qIdx) => {
                      const isAnswered = selectedAnswers[activeQuestions[qIdx]?.id] !== undefined;
                      const isCurrent = qIdx === currentIdx;
                      return (
                        <button
                          key={qIdx}
                          type="button"
                          onClick={() => setCurrentIdx(qIdx)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            isCurrent
                              ? 'bg-black text-white ring-2 ring-zinc-900 shadow-sm'
                              : isAnswered
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                          }`}
                        >
                          {qIdx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 bg-amber-100 text-amber-900 rounded-xl text-xs font-extrabold border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>SIH Demo Session</span>
                    </span>

                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="hidden sm:inline">Camera Monitored</span>
                    </span>

                    <div className="flex items-center gap-2 bg-black text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 shadow-sm border border-zinc-800">
                      <Clock size={14} className="text-amber-400 animate-pulse" />
                      <span className="text-zinc-400 uppercase text-[10px] tracking-wider font-semibold hidden sm:inline">Time Left:</span>
                      <span className="font-bold tabular-nums tracking-wider text-sm text-white">{formatTime(timeLeft)}</span>
                    </div>
                  </div>
                </div>

                {/* Current Question Card with Swapped/Shuffled Options */}
                {activeQuestions.length > 0 && currentQ && (
                  <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-zinc-100 text-zinc-800 rounded-full text-[10px] font-bold uppercase tracking-wider border border-zinc-200">
                          {currentQ.category}
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold">
                          {selectedTrackTitle}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-bold">
                          SIH Demo
                        </span>
                      </div>
                      <span className="text-xs font-medium text-zinc-400">
                        Skill Tag: <span className="font-bold text-zinc-800">{currentQ.skill_tag}</span>
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-zinc-900 leading-relaxed">
                        Q{currentIdx + 1} of {totalQuestionCount}. {currentQ.question_text}
                      </h3>
                      <p className="text-xs text-zinc-400">Select one option from the choices below.</p>
                    </div>

                    {/* Randomized Answer Options (Swapped per student) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {currentQ.shuffledOptions?.map((opt: ShuffledOption, displayIdx: number) => {
                        const isSelected = selectedAnswers[currentQ.id] === opt.originalIndex;
                        return (
                          <button
                            key={displayIdx}
                            type="button"
                            onClick={() => {
                              setSelectedAnswers({
                                ...selectedAnswers,
                                [currentQ.id]: opt.originalIndex
                              });
                            }}
                            className={`p-4 rounded-xl border text-left text-xs font-medium transition-all flex items-start gap-3 cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 font-bold shadow-xs'
                                : 'bg-zinc-50/60 border-zinc-200 text-zinc-700 hover:bg-zinc-100/80 hover:border-zinc-300'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5 ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-zinc-200 text-zinc-600'
                            }`}>
                              {String.fromCharCode(65 + displayIdx)}
                            </span>
                            <span className="leading-relaxed">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Navigation Buttons between questions */}
                    <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
                      <button
                        type="button"
                        disabled={currentIdx === 0}
                        onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                        className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1.5"
                      >
                        <ArrowLeft size={14} /> Previous
                      </button>

                      <div className="flex items-center gap-3">
                        {currentIdx < totalQuestionCount - 1 ? (
                          <button
                            type="button"
                            onClick={() => setCurrentIdx(prev => Math.min(totalQuestionCount - 1, prev + 1))}
                            className="px-5 py-2 rounded-xl text-xs font-bold bg-black hover:bg-zinc-800 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                          >
                            Next <ArrowRight size={14} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleSubmitTest}
                            className="px-6 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 size={14} /> {isSubmitting ? 'Submitting...' : 'Finish & Submit Test'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW 4: HOD EXCEL QUESTION CREATOR & TRACK PUBLISHER
            ═════════════════════════════════════════════════════════════════════ */}
        {!isLockdownActive && activeTab === 'upload' && (isHOD || isAdvisor) && (
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200">
                  HOD Question Bank Management
                </span>
                <h3 className="text-xl font-bold text-zinc-900 mt-2">
                  Upload & Publish Questions to Assessment Tracks
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Tag questions to specific company tracks (Zoho, TCS, Infosys, Technical Core) and set customized cutoff benchmarks.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-zinc-200 shadow-xs"
                >
                  <Download size={14} /> Download Sample Template (.xlsx)
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={isParsingExcel}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
                >
                  <Upload size={14} /> {isParsingExcel ? 'Parsing File...' : 'Upload Excel Sheet'}
                </button>
              </div>
            </div>

            {/* Target Track Selection for Upload */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Select Destination Track & Cutoff Percentage:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 block mb-1">Destination Track</label>
                  <select
                    value={uploadTrackType}
                    onChange={e => {
                      setUploadTrackType(e.target.value);
                      const matched = tracks.find(t => t.track_type === e.target.value);
                      if (matched) setUploadTrackCutoff(matched.cutoff_percentage);
                    }}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800"
                  >
                    {tracks.map(t => (
                      <option key={t.track_type} value={t.track_type}>{t.track_title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 block mb-1">Track Cutoff (%)</label>
                  <input
                    type="number"
                    min="40"
                    max="100"
                    value={uploadTrackCutoff}
                    onChange={e => setUploadTrackCutoff(Number(e.target.value))}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* Parsed Excel Questions Preview */}
            {excelQuestions.length > 0 && (
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">
                      Parsed Questions Preview ({excelQuestions.length} Questions)
                    </h4>
                    <p className="text-xs text-zinc-400">Review questions before committing to database.</p>
                  </div>
                  <button
                    type="button"
                    disabled={isPublishing}
                    onClick={handlePublishQuestions}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                  >
                    <Check size={14} /> {isPublishing ? 'Publishing to Track...' : `Publish to ${uploadTrackType}`}
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {excelQuestions.map((q, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                      <div className="flex justify-between font-bold text-zinc-800">
                        <span>Q{idx + 1}. {q.question_text}</span>
                        <span className="text-indigo-600">{q.category}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                        {q.options?.map((opt: string, oIdx: number) => (
                          <span
                            key={oIdx}
                            className={`px-2 py-0.5 rounded border ${
                              oIdx === q.correct_option
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                                : 'bg-white border-zinc-200'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}: {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW 5: HOD STUDENT RESULTS & ANALYTICS
            ═════════════════════════════════════════════════════════════════════ */}
        {!isLockdownActive && activeTab === 'analytics' && (isHOD || isAdvisor) && (
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200">
                  Institutional Performance
                </span>
                <h3 className="text-xl font-bold text-zinc-900 mt-2">
                  Student Assessment Submissions & Results
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Track student participation, scores, proctoring face photos, and export complete reports to Excel.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleExportResults}
                  className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
                >
                  <Download size={14} /> Export Results to Excel (.xlsx)
                </button>
              </div>
            </div>

            {/* Track Filter & Live Search */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-zinc-500">Filter by Track:</span>
                <select
                  value={selectedResultTrack}
                  onChange={e => setSelectedResultTrack(e.target.value)}
                  className="p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800"
                >
                  <option value="ALL">All Tracks</option>
                  <option value="GENERAL_APTITUDE">General Aptitude</option>
                  <option value="TECHNICAL_CORE">Technical Core</option>
                  <option value="ZOHO_MOCK">Zoho Corporation</option>
                  <option value="TCS_NQT">TCS NQT Foundation</option>
                  <option value="INFOSYS_MOCK">Infosys Analytical</option>
                </select>
              </div>

              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search student or reg no..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800"
                />
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider">
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Class</th>
                      <th className="p-3">Track</th>
                      <th className="p-3">Score (%)</th>
                      <th className="p-3">Result</th>
                      <th className="p-3">Correct</th>
                      <th className="p-3">Time</th>
                      <th className="p-3 text-right">Attempt Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium">
                    {studentResults
                      .filter(s => {
                        if (selectedResultTrack !== 'ALL' && s.track_type !== selectedResultTrack) return false;
                        if (!searchQuery) return true;
                        const q = searchQuery.toLowerCase();
                        return s.student_name?.toLowerCase().includes(q) || s.register_number?.toLowerCase().includes(q);
                      })
                      .map(r => (
                        <tr key={r.id} className="hover:bg-zinc-50/80">
                          <td className="p-3 font-bold text-zinc-900 flex items-center gap-2.5">
                            {r.proctor_photo_url ? (
                              <img
                                src={r.proctor_photo_url}
                                alt={r.student_name}
                                className="w-8 h-8 rounded-full object-cover border border-zinc-300 shadow-2xs shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-600 shrink-0">
                                {r.student_name?.charAt(0) || 'S'}
                              </div>
                            )}
                            <div>
                              <span>{r.student_name}</span>
                              <span className="block text-[10px] text-zinc-400 font-mono">{r.register_number}</span>
                            </div>
                          </td>

                          <td className="p-3 text-zinc-600">{r.class_name || 'Unassigned'}</td>
                          <td className="p-3 font-semibold text-zinc-700">{r.track_title || 'General Aptitude'}</td>
                          <td className="p-3 font-extrabold text-zinc-900">{r.score_percentage}%</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              Number(r.score_percentage) >= (r.cutoff_percentage || 60)
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {Number(r.score_percentage) >= (r.cutoff_percentage || 60) ? 'PASSED' : 'REMEDIAL'}
                            </span>
                          </td>
                          <td className="p-3 text-zinc-600">{r.correct_count} / {r.total_questions}</td>
                          <td className="p-3 text-zinc-600">{Math.floor(r.time_taken_seconds / 60)}m {r.time_taken_seconds % 60}s</td>
                          <td className="p-3 text-right text-zinc-400 font-mono text-[11px]">
                            {new Date(r.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW 5: STUDENT MY ASSESSMENT MARKS & OFFICIAL SCORECARDS
            ═════════════════════════════════════════════════════════════════════ */}
        {!isLockdownActive && activeTab === 'my_marks' && (
          <div className="space-y-6">
            
            {/* Header Banner */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full shadow-2xs">
                    Official Academic Transcript • Pillar 1
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full shadow-2xs">
                    SIH Demo Records
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold text-zinc-900 mt-2 flex items-center gap-2.5">
                  <Award className="text-amber-500" size={24} />
                  My Assessment Marks & Scorecards
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-xl leading-relaxed">
                  Verified assessment records for campus placement benchmarks, institutional mock evaluation suites, and technical screening tracks (Demonstration sandbox for SIH evaluation).
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={fetchMyAssessments}
                  disabled={isLoadingMyAssessments}
                  className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={13} className={isLoadingMyAssessments ? 'animate-spin' : ''} />
                  <span>Refresh Marks</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('tracks')}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Target size={13} />
                  <span>Take Another Mock Test</span>
                </button>
              </div>
            </div>

            {/* Performance Summary Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-extrabold uppercase tracking-wider">
                  <span>Average Mark</span>
                  <Award size={16} className="text-amber-500" />
                </div>
                <div className="text-3xl font-extrabold text-zinc-900">
                  {myAssessmentsMetrics?.average_score ?? 0}%
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">Institutional performance average</p>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-extrabold uppercase tracking-wider">
                  <span>Personal Best</span>
                  <Sparkles size={16} className="text-indigo-600" />
                </div>
                <div className="text-3xl font-extrabold text-indigo-600">
                  {myAssessmentsMetrics?.highest_score ?? 0}%
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">Highest score achieved</p>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-extrabold uppercase tracking-wider">
                  <span>Tests Attempted</span>
                  <BookOpen size={16} className="text-blue-600" />
                </div>
                <div className="text-3xl font-extrabold text-zinc-900">
                  {myAssessmentsMetrics?.total_attempts ?? 0}
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">Completed mock evaluations</p>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-extrabold uppercase tracking-wider">
                  <span>Clearance Rate</span>
                  <CheckCircle2 size={16} className="text-emerald-600" />
                </div>
                <div className="text-3xl font-extrabold text-emerald-600">
                  {myAssessmentsMetrics?.pass_rate ?? 0}%
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">
                  {myAssessmentsMetrics?.passed_count ?? 0} of {myAssessmentsMetrics?.total_attempts ?? 0} tests cleared
                </p>
              </div>
            </div>

            {/* Assessment Records List */}
            {isLoadingMyAssessments ? (
              <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center shadow-sm space-y-3">
                <RefreshCw size={24} className="animate-spin mx-auto text-indigo-600" />
                <p className="text-xs font-bold text-zinc-600">Loading your verified assessment records & scorecards...</p>
              </div>
            ) : myAssessments.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center shadow-sm space-y-4 max-w-2xl mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-amber-500">
                  <Award size={28} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-extrabold text-zinc-900">No Assessment Marks Recorded Yet</h4>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                    You have not attempted any proctored mock assessments or institutional placement tests yet. Completing assessments contributes up to +35% toward your overall Placement Readiness Rating (Pillar 1)!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('tracks')}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white rounded-xl text-xs font-bold shadow-md transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Target size={14} />
                  <span>Start Institutional Benchmark Test</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {myAssessments.map(a => {
                  const score = Number(a.score_percentage || 0);
                  const cutoff = Number(a.cutoff_percentage || 60);
                  const passed = a.is_passed || score >= cutoff;

                  return (
                    <div
                      key={a.id}
                      className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        
                        {/* Header: Track & Date */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
                              {new Date(a.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <h4 className="text-base font-extrabold text-zinc-900 mt-0.5">
                              {a.track_title || 'General Aptitude Benchmark'}
                            </h4>
                          </div>

                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider shrink-0 ${
                            passed
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {passed ? 'PASSED ✅' : 'ACTION REQUIRED ⚠️'}
                          </span>
                        </div>

                        {/* Marks & Score Bar */}
                        <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-2xl flex items-center justify-between">
                          <div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-3xl font-black text-zinc-900">{score}%</span>
                              <span className="text-xs font-bold text-zinc-500">
                                ({a.correct_count} / {a.total_questions} Correct)
                              </span>
                            </div>
                            <span className="text-[11px] text-zinc-500 font-semibold block mt-0.5">
                              Institutional Cutoff: <strong className="text-zinc-800">{cutoff}%</strong>
                            </span>
                          </div>

                          {a.proctor_photo_url && (
                            <div className="flex flex-col items-center">
                              <img
                                src={a.proctor_photo_url}
                                alt="Proctored Face"
                                className="w-12 h-12 rounded-xl object-cover border-2 border-indigo-400 shadow-2xs"
                              />
                              <span className="text-[9px] font-extrabold text-indigo-700 mt-1 flex items-center gap-0.5">
                                <ShieldCheck size={10} /> Verified
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Category Performance Breakdown */}
                        {a.category_breakdown && Object.keys(a.category_breakdown).length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                              Domain Marks Breakdown
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {Object.entries(a.category_breakdown).map(([domain, pct]: [string, any]) => (
                                <div key={domain} className="p-2 bg-zinc-50/90 border border-zinc-200 rounded-xl text-xs flex items-center justify-between">
                                  <span className="text-[11px] font-semibold text-zinc-700 truncate pr-2" title={domain}>{domain}</span>
                                  <span className={`font-mono font-extrabold text-xs ${
                                    Number(pct) >= 70 ? 'text-emerald-700' : Number(pct) >= 50 ? 'text-amber-700' : 'text-rose-700'
                                  }`}>
                                    {pct}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-3 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {Math.floor((a.time_taken_seconds || 0) / 60)}m {(a.time_taken_seconds || 0) % 60}s duration
                          </span>
                          <span>•</span>
                          <span>ID: {a.id.slice(0, 8)}...</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-zinc-100 flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setViewingScorecard(a)}
                          className="flex-1 py-2.5 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Eye size={13} />
                          <span>View Full Scorecard</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const matched = tracks.find(t => t.track_type === a.track_type);
                            if (matched) handleSelectTrack(matched);
                            else setActiveTab('tracks');
                          }}
                          className="px-3.5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <RotateCcw size={12} />
                          <span>Retake</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Detailed Assessment Scorecard Modal */}
            {viewingScorecard && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                <div className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
                  
                  {/* Modal Header */}
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-100">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                        Official Assessment Transcript
                      </span>
                      <h3 className="text-xl font-extrabold text-zinc-900 mt-1.5 flex items-center gap-2">
                        <Award className="text-amber-500" size={20} />
                        {viewingScorecard.track_title || 'Assessment Scorecard'}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        Completed on {new Date(viewingScorecard.created_at).toLocaleString()} • Proctored Session
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewingScorecard(null)}
                      className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Summary Marks Banner */}
                  <div className="p-6 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                    <div className="space-y-1 text-center sm:text-left">
                      <span className="text-xs text-zinc-400 font-extrabold uppercase tracking-wider">Final Marks Awarded</span>
                      <div className="text-4xl font-black text-white">
                        {viewingScorecard.score_percentage}%
                      </div>
                      <span className="text-xs text-zinc-300 font-medium">
                        {viewingScorecard.correct_count} of {viewingScorecard.total_questions} Questions Answered Correctly
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {viewingScorecard.proctor_photo_url && (
                        <img
                          src={viewingScorecard.proctor_photo_url}
                          alt="Proctor verified"
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
                        />
                      )}
                      <div className="text-right space-y-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider inline-block ${
                          Number(viewingScorecard.score_percentage) >= Number(viewingScorecard.cutoff_percentage || 60)
                            ? 'bg-emerald-500 text-white'
                            : 'bg-rose-500 text-white'
                        }`}>
                          {Number(viewingScorecard.score_percentage) >= Number(viewingScorecard.cutoff_percentage || 60) ? 'Passed ✅' : 'Action Required'}
                        </span>
                        <span className="block text-[10px] text-zinc-400 font-mono">
                          Cutoff: {viewingScorecard.cutoff_percentage || 60}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Domain Breakdown */}
                  {viewingScorecard.category_breakdown && Object.keys(viewingScorecard.category_breakdown).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700">Domain Performance</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {Object.entries(viewingScorecard.category_breakdown).map(([c, pct]: [string, any]) => (
                          <div key={c} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1.5">
                            <div className="flex justify-between text-xs font-bold text-zinc-800">
                              <span className="truncate pr-2">{c}</span>
                              <span className="font-mono">{pct}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${Number(pct) >= 70 ? 'bg-emerald-500' : Number(pct) >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Question by Question Review (if saved) */}
                  {Array.isArray(viewingScorecard.answers_summary) && viewingScorecard.answers_summary.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700">Detailed Answer Review</h4>
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                        {viewingScorecard.answers_summary.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                              item.is_correct
                                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                : 'bg-rose-50/60 border-rose-200 text-rose-950'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 font-bold">
                              <span>Q{idx + 1}. {item.question_text}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold shrink-0 ${
                                item.is_correct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {item.is_correct ? 'Correct' : 'Incorrect'}
                              </span>
                            </div>
                            <div className="text-[11px] space-y-0.5 font-medium">
                              <div>Your Answer: <span className="font-bold">{item.selected_answer || 'Unanswered'}</span></div>
                              {!item.is_correct && (
                                <div className="text-emerald-800 font-bold">Correct Answer: {item.correct_answer}</div>
                              )}
                              {item.explanation && (
                                <div className="text-zinc-500 italic pt-1 border-t border-zinc-200/50 mt-1">
                                  💡 {item.explanation}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-zinc-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setViewingScorecard(null)}
                      className="px-5 py-2 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Close Scorecard
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* ── Official Assessment Announcement & Email Load Balancer Dispatch Studio Modal ── */}
        {showTriggerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                      Official HOD Placement Studio
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                      <Mail size={11} className="text-blue-600" />
                      Live Brevo Balancer
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-zinc-900 mt-1.5 flex items-center gap-2">
                    <Mail size={20} className="text-blue-600" />
                    Announce Assessment & Dispatch Emails
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Select target year and class section. Official branded invitation emails will be routed through the multi-node load balancer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTriggerModal(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* ── Live Brevo Email Credits Status Card with Mail Logo ── */}
              <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/70 to-sky-50/90 border border-blue-200/90 rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Mail size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-extrabold text-blue-950">
                          Brevo Multi-Node Email Engine
                        </h4>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <p className="text-[11px] text-blue-800 font-semibold mt-0.5">
                        Live Quota Available:{' '}
                        <strong className="text-blue-950 font-mono text-xs">
                          {emailNodesStatus?.totalAvailableCredits ?? 900} Credits
                        </strong>{' '}
                        across active SMTP nodes
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={fetchEmailNodesStatus}
                    disabled={isLoadingEmailStatus}
                    title="Refresh live Brevo credits"
                    className="p-2 text-blue-700 hover:text-blue-900 bg-white/90 hover:bg-white border border-blue-200 rounded-xl transition cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    <RefreshCw size={13} className={isLoadingEmailStatus ? 'animate-spin' : ''} />
                  </button>
                </div>

                {/* Node Status Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-blue-200/60">
                  {emailNodesStatus?.nodes && emailNodesStatus.nodes.length > 0 ? (
                    emailNodesStatus.nodes.map((node: any) => (
                      <div
                        key={node.nodeId}
                        title={node.error || (node.status === 'HEALTHY' ? `${node.credits} credits remaining` : node.status)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border shadow-2xs ${
                          node.status === 'HEALTHY'
                            ? 'bg-white text-zinc-800 border-blue-200'
                            : node.status === 'AUTH_ERROR'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                        }`}
                      >
                        <Mail size={11} className={node.status === 'HEALTHY' ? 'text-blue-600' : node.status === 'AUTH_ERROR' ? 'text-red-600' : 'text-zinc-400'} />
                        <span className="font-mono">{node.nodeId}:</span>
                        <span className={node.status === 'HEALTHY' ? 'text-blue-700 font-extrabold' : node.status === 'AUTH_ERROR' ? 'text-red-700 font-black' : 'text-zinc-500 font-extrabold'}>
                          {node.status === 'AUTH_ERROR' ? 'IP UNRECOGNIZED' : (node.credits !== null ? `${node.credits} left` : node.status)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-[10px] text-blue-700 font-bold">
                      <span className="px-2.5 py-1 bg-white border border-blue-200 rounded-lg flex items-center gap-1">
                        <Mail size={10} className="text-blue-600" /> Node 1: 300 credits
                      </span>
                      <span className="px-2.5 py-1 bg-white border border-blue-200 rounded-lg flex items-center gap-1">
                        <Mail size={10} className="text-blue-600" /> Node 2: 300 credits
                      </span>
                      <span className="px-2.5 py-1 bg-white border border-blue-200 rounded-lg flex items-center gap-1">
                        <Mail size={10} className="text-blue-600" /> Node 3: 300 credits
                      </span>
                    </div>
                  )}

                  {/* Quota Check Indicator */}
                  <div className="ml-auto text-[10px] font-extrabold">
                    {(targetPreviewCount ?? 0) <= (emailNodesStatus?.totalAvailableCredits ?? 900) ? (
                      <span className="text-emerald-700 bg-emerald-50/90 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Check size={11} /> Quota Sufficient ({targetPreviewCount ?? 0} targeted)
                      </span>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        ⚠ Exceeds single-batch quota
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-4">
                
                {/* 1. Track Selector */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1.5">
                    1. Select Assessment Track
                  </label>
                  <select
                    value={triggerTrackType}
                    onChange={e => setTriggerTrackType(e.target.value)}
                    className="w-full p-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  >
                    {tracks.map(t => (
                      <option key={t.track_type} value={t.track_type}>
                        {t.track_title} ({t.question_count} Qs • Cutoff: {t.cutoff_percentage}%)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Target Year & Target Class Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1.5">
                      2. Target Academic Year
                    </label>
                    <select
                      value={triggerYear}
                      onChange={e => {
                        const yr = e.target.value;
                        setTriggerYear(yr);
                        setTriggerClassId('ALL');
                        fetchTargetPreview(yr, 'ALL');
                      }}
                      className="w-full p-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    >
                      <option value="ALL">All Years (II & III IT — 369 Students)</option>
                      <option value="2">II Year (2025-2029 Batch — 188 Students)</option>
                      <option value="3">III Year (2024-2028 Batch — 181 Students)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1.5">
                      3. Target Class / Section
                    </label>
                    <select
                      value={triggerClassId}
                      onChange={e => {
                        const cid = e.target.value;
                        setTriggerClassId(cid);
                        fetchTargetPreview(triggerYear, cid);
                      }}
                      className="w-full p-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    >
                      <option value="ALL">All Sections in Selected Year</option>
                      {availableClasses
                        .filter(c => triggerYear === 'ALL' || String(c.year) === String(triggerYear))
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} (Year {c.year} • Batch {c.batch})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Target Audience Live Counter */}
                <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      <Users size={15} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                        Live Audience Preview
                      </p>
                      <p className="text-xs font-extrabold text-indigo-950">
                        {isLoadingPreview ? (
                          'Calculating target cohort...'
                        ) : (
                          `${targetPreviewCount ?? 0} Students Selected (${targetPreviewClasses.join(', ') || 'All Sections'})`
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-1 bg-white border border-indigo-200 text-indigo-700 rounded-lg shadow-2xs">
                    Multi-Node Pool Ready
                  </span>
                </div>

                {/* 4. Submission Deadline */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1.5">
                    4. Submission Deadline (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={triggerDeadline}
                    onChange={e => setTriggerDeadline(e.target.value)}
                    className="w-full p-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>

                {/* 5. Custom Instructions */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1.5">
                    5. Special Instructions for Students (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Mandatory mock test before upcoming campus placement drive. Make sure webcam is enabled and full-screen lockdown is maintained."
                    value={triggerInstructions}
                    onChange={e => setTriggerInstructions(e.target.value)}
                    className="w-full p-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-zinc-800 placeholder-zinc-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition leading-relaxed resize-none"
                  />
                </div>

              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowTriggerModal(false)}
                  disabled={isTriggering}
                  className="px-4 py-2.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDispatchAssessmentCampaign}
                  disabled={isTriggering}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 hover:from-blue-700 hover:to-violet-800 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isTriggering ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Dispatching via Email Load Balancer...</span>
                    </>
                  ) : (
                    <>
                      <Mail size={15} />
                      <span>Dispatch Assessment & Send Emails</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SkillAssessmentView;
