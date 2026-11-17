import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, ClipboardList, Building2, ShieldCheck,
  CheckCircle2, AlertTriangle, Eye, EyeOff, X,
  Clock, RotateCcw, Check, Sparkles, Send, Shield,
  GraduationCap, ChevronRight, KeyRound, MailCheck, ArrowLeft
} from 'lucide-react';
import { API_URL } from '../../config';
import { cn } from '../../lib/utils';
import ThemeToggle from '../../ThemeToggle';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import type { User, ToastType } from '../../types';

export interface AuthViewProps {
  onLoginSuccess: (token: string, user: User) => void;
  onToast?: (msg: string, type?: ToastType) => void;
}

export function AuthView({ onLoginSuccess, onToast }: AuthViewProps) {
  const addToast = (msg: string, type?: ToastType) => {
    if (onToast) onToast(msg, type);
  };

  const [showPassword, setShowPassword] = useState(false);

  // Login State
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  // Forgot Password State
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'IDENTIFIER' | 'OTP' | 'SUCCESS'>('IDENTIFIER');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotShowNewPass, setForgotShowNewPass] = useState(false);
  const [forgotMaskedEmail, setForgotMaskedEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotCountdown, setForgotCountdown] = useState(600);
  const [forgotResendCooldown, setForgotResendCooldown] = useState(0);

  // Industry Self-Registration Modal State
  const [showIndustryRegModal, setShowIndustryRegModal] = useState(false);
  const [indRegData, setIndRegData] = useState({
    username: '', password: '', full_name: '', email: '',
    company_name: '', industry_sector: 'Information Technology', website: '', hq_location: '', description: ''
  });
  const [indRegLoading, setIndRegLoading] = useState(false);
  const [indRegMsg, setIndRegMsg] = useState('');
  const [indRegError, setIndRegError] = useState('');

  // 🎓 Student Self-Registration Drawer State (Idea 1)
  const [showStudentRegDrawer, setShowStudentRegDrawer] = useState(false);
  const [studentRegStep, setStudentRegStep] = useState<'FORM' | 'OTP' | 'SUCCESS'>('FORM');
  const [studentRegData, setStudentRegData] = useState({
    fullName: '',
    registerNumber: '',
    departmentId: '',
    classId: '',
    email: '',
    password: '',
  });
  const [studentRegAcademicData, setStudentRegAcademicData] = useState<{
    departments: Array<{ id: string; name: string }>;
    classes: Array<{ id: string; name: string; department_id: string; year?: number; batch?: string }>;
  }>({ departments: [], classes: [] });
  const [studentRegOtp, setStudentRegOtp] = useState('');
  const [studentRegMaskedEmail, setStudentRegMaskedEmail] = useState('');
  const [studentRegCountdown, setStudentRegCountdown] = useState(600);
  const [studentRegResendCooldown, setStudentRegResendCooldown] = useState(0);
  const [studentRegLoading, setStudentRegLoading] = useState(false);
  const [studentRegError, setStudentRegError] = useState('');
  const [studentRegSuccessData, setStudentRegSuccessData] = useState<any>(null);
  const [studentRegShowPassword, setStudentRegShowPassword] = useState(false);

  useEffect(() => {
    let timer: any;
    if (showStudentRegDrawer && studentRegStep === 'OTP' && studentRegCountdown > 0) {
      timer = setInterval(() => {
        setStudentRegCountdown(c => (c > 0 ? c - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showStudentRegDrawer, studentRegStep, studentRegCountdown]);

  useEffect(() => {
    let timer: any;
    if (showStudentRegDrawer && studentRegStep === 'OTP' && studentRegResendCooldown > 0) {
      timer = setInterval(() => {
        setStudentRegResendCooldown(c => (c > 0 ? c - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showStudentRegDrawer, studentRegStep, studentRegResendCooldown]);


  const fetchAcademicStructureForRegistration = async () => {
    try {
      const res = await fetch(`${API_URL}/api/public/academic-structure`);
      if (res.ok) {
        const data = await res.json();
        setStudentRegAcademicData(data);
        if (data.departments?.length > 0) {
          setStudentRegData(p => {
            const deptId = p.departmentId || data.departments[0].id;
            const validClasses = data.classes?.filter((c: any) => String(c.department_id) === String(deptId)) || [];
            const clsId = p.classId || (validClasses.length > 0 ? validClasses[0].id : '');
            return { ...p, departmentId: deptId, classId: clsId };
          });
        }
      }
    } catch (e) {
      console.error('Failed to load academic structure:', e);
    }
  };

  const handleStudentRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentRegLoading(true);
    setStudentRegError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/student-signup/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentRegData),
      });
      const data = await res.json();
      if (res.ok) {
        setStudentRegMaskedEmail(data.maskedEmail || studentRegData.email);
        setStudentRegStep('OTP');
        setStudentRegCountdown(data.expiresInSeconds || 600);
        setStudentRegResendCooldown(data.cooldownSeconds || 60);
      } else {
        setStudentRegError(data.error || 'Failed to dispatch verification code');
      }
    } catch {
      setStudentRegError('Network error while requesting verification code');
    } finally {
      setStudentRegLoading(false);
    }
  };

  const handleStudentResendOtp = async () => {
    if (studentRegResendCooldown > 0 || studentRegLoading) return;
    setStudentRegLoading(true);
    setStudentRegError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/student-signup/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registerNumber: studentRegData.registerNumber }),
      });
      const data = await res.json();
      if (res.ok) {
        setStudentRegCountdown(data.expiresInSeconds || 600);
        setStudentRegResendCooldown(data.cooldownSeconds || 60);
        addToast('New verification code sent to your email!', 'success');
      } else {
        setStudentRegError(data.error || 'Failed to resend code');
      }
    } catch {
      setStudentRegError('Network error while resending verification code');
    } finally {
      setStudentRegLoading(false);
    }
  };

  const handleStudentVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentRegLoading(true);
    setStudentRegError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/student-signup/verify-and-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registerNumber: studentRegData.registerNumber,
          otp: studentRegOtp,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStudentRegSuccessData(data.student);
        setStudentRegStep('SUCCESS');
        addToast('Student account registered! Pending advisor approval.', 'success');
      } else {
        setStudentRegError(data.error || 'Invalid verification code');
      }
    } catch {
      setStudentRegError('Network error while verifying code');
    } finally {
      setStudentRegLoading(false);
    }
  };

  const resetStudentRegDrawer = () => {
    setShowStudentRegDrawer(false);
    setStudentRegStep('FORM');
    setStudentRegOtp('');
    setStudentRegError('');
    setStudentRegData({
      fullName: '',
      registerNumber: '',
      departmentId: studentRegAcademicData.departments?.[0]?.id || '',
      classId: '',
      email: '',
      password: '',
    });
  };



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...loginData })
      });
      const data = await res.json();
      if (res.ok) {
        sessionStorage.removeItem('app_cache_depts');
        sessionStorage.removeItem('app_cache_classes');
        sessionStorage.removeItem('app_cache_users');
        sessionStorage.removeItem('app_cache_tasks');
        sessionStorage.removeItem('app_cache_submissions');
        sessionStorage.removeItem('app_cache_notifs');

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLoginSuccess(data.token, data.user);
      } else {
        setError(data.error || 'Failed to login');
      }
    } catch (e) {
      setError('Connection failed');
    }
  };

  useEffect(() => {
    let timer: any;
    if (showForgotPasswordModal && forgotStep === 'OTP') {
      timer = setInterval(() => {
        setForgotCountdown(prev => (prev > 0 ? prev - 1 : 0));
        setForgotResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showForgotPasswordModal, forgotStep]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setForgotError('');
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your Register Number or Email ID');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setForgotMaskedEmail(data.maskedEmail || 'your registered email');
        setForgotStep('OTP');
        setForgotCountdown(600);
        setForgotResendCooldown(60);
        addToast('Verification code sent to your email!', 'success');
      } else {
        setForgotError(data.error || 'Failed to send OTP code.');
      }
    } catch (err) {
      setForgotError('Connection error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (!forgotOtp.trim()) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }
    if (forgotOtp.trim().length !== 6) {
      setForgotError('Verification code must be 6 digits.');
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match. Please re-enter.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: forgotIdentifier.trim(),
          otp: forgotOtp.trim(),
          newPassword: forgotNewPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setForgotStep('SUCCESS');
        addToast('Password reset successfully in database!', 'success');
        if (data.token && data.user) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          onLoginSuccess(data.token, data.user);
          
          
        }
      } else {
        setForgotError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setForgotError('Connection error. Please check your network.');
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotModal = () => {
    setShowForgotPasswordModal(false);
    setForgotStep('IDENTIFIER');
    setForgotIdentifier('');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError('');
    setForgotMaskedEmail('');
    setForgotLoading(false);
    setForgotCountdown(600);
    setForgotResendCooldown(0);
  };


    const roles = [
      { id: 'STUDENT', title: 'Student', icon: <Users className="w-6 h-6" />, desc: 'Submit and track your academic tasks' },
      { id: 'STUDENT_COORDINATOR', title: 'Coordinator', icon: <Users className="w-6 h-6 text-amber-500" />, desc: 'Verify tasks for your class' },
      { id: 'CLASS_ADVISOR', title: 'Class Advisor', icon: <ClipboardList className="w-6 h-6" />, desc: 'Manage class tasks and students' },
      { id: 'HOD', title: 'Department HOD', icon: <Building2 className="w-6 h-6" />, desc: 'Oversee department progress' },
      { id: 'SUPREME_ADMIN', title: 'Supreme Admin', icon: <ShieldCheck className="w-6 h-6" />, desc: 'System-wide resource management' },
    ];

    return (
      <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-slate-50 via-white to-indigo-50/20 dark:from-[#09090b] dark:via-[#0c0c10] dark:to-[#121218] flex flex-col justify-center items-center px-4 py-4 sm:py-6 overflow-y-auto relative text-zinc-900 dark:text-zinc-100">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md my-auto py-2"
        >
          {/* Header Section */}
          <div className="flex flex-col items-center mb-3 sm:mb-4 text-center">
            <div id="app-logo-slot" className="logo-container w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white dark:bg-zinc-800 p-1.5 mb-2 shadow-lg border border-zinc-200/80 dark:border-zinc-700/80 ring-4 ring-indigo-50 dark:ring-indigo-950/40 flex items-center justify-center overflow-hidden" aria-label="Company Logo Slot"></div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">IT Vault</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-0.5 text-xs sm:text-sm font-medium">
              VSBEC IT Vault — Academic & Placement Governance Platform
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key="login-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full"
            >
              <Card className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#141418] border border-zinc-200/80 dark:border-zinc-800 shadow-xl">
                <div className="mb-3.5 text-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">Portal Login</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm mt-0.5">Please enter your credentials</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 block">Email ID / Register Number</label>
                    <Input
                      placeholder="Enter Email ID or Register Number"
                      value={loginData.username}
                      onChange={e => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                      required
                      autoFocus
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 block">Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={e => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        required
                        className="pr-12 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        )}
                      </button>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          resetForgotModal();
                          setShowForgotPasswordModal(true);
                          if (loginData.username) setForgotIdentifier(loginData.username);
                        }}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline transition-colors cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </div>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-2xl text-xs font-semibold border flex items-start gap-2.5 ${
                        error.toLowerCase().includes('waiting for supreme admin') || error.toLowerCase().includes('pending')
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : error.toLowerCase().includes('rejected')
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : 'bg-red-50 border-red-200 text-red-700'
                      }`}
                    >
                      <span className="text-sm shrink-0 mt-0.5">
                        {error.toLowerCase().includes('waiting for supreme admin') || error.toLowerCase().includes('pending')
                          ? '⏳'
                          : '⚠️'}
                      </span>
                      <div className="leading-relaxed">
                        {error}
                      </div>
                    </motion.div>
                  )}
                  <Button className="w-full py-2.5 sm:py-3 text-base sm:text-lg font-bold rounded-xl mt-1 cursor-pointer">Sign In</Button>

                  {/* Onboarding Actions: Symmetrical Dual Registration Cards (Task Manager Style) */}
                  <div className="pt-3.5 mt-3.5 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-2.5 px-0.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        New Registration
                      </span>
                      <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                        Create Account
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Student Registration Card */}
                      <button
                        type="button"
                        onClick={() => {
                          fetchAcademicStructureForRegistration();
                          setStudentRegStep('FORM');
                          setStudentRegError('');
                          setShowStudentRegDrawer(true);
                        }}
                        className="p-3 rounded-2xl bg-zinc-50/80 hover:bg-blue-50/70 dark:bg-zinc-900/40 dark:hover:bg-blue-950/30 border border-zinc-200/80 hover:border-blue-300 dark:border-zinc-800 dark:hover:border-blue-700/60 transition-all duration-200 text-left group cursor-pointer flex flex-col justify-between h-[88px] relative shadow-2xs hover:shadow-xs"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="w-7 h-7 rounded-lg bg-blue-100/90 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                            <GraduationCap size={15} />
                          </div>
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded-md border border-blue-200/80 dark:border-blue-800/60 flex items-center gap-0.5 shadow-2xs group-hover:border-blue-400 transition-colors">
                            OTP <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                            Student Join
                          </p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium truncate mt-0.5">
                            Verify & join section
                          </p>
                        </div>
                      </button>

                      {/* Corporate Partner Card */}
                      <button
                        type="button"
                        onClick={() => {
                          setIndRegError('');
                          setIndRegMsg('');
                          setShowIndustryRegModal(true);
                        }}
                        className="p-3 rounded-2xl bg-zinc-50/80 hover:bg-indigo-50/70 dark:bg-zinc-900/40 dark:hover:bg-indigo-950/30 border border-zinc-200/80 hover:border-indigo-300 dark:border-zinc-800 dark:hover:border-indigo-700/60 transition-all duration-200 text-left group cursor-pointer flex flex-col justify-between h-[88px] relative shadow-2xs hover:shadow-xs"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100/90 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                            <Building2 size={15} />
                          </div>
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded-md border border-indigo-200/80 dark:border-indigo-800/60 flex items-center gap-0.5 shadow-2xs group-hover:border-indigo-400 transition-colors">
                            HR <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                            Corporate Partner
                          </p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium truncate mt-0.5">
                            Recruiter & hiring
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </form>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* ── Forgot Password & Reset Modal ─────────────────────────────── */}
          <AnimatePresence>
            {showForgotPasswordModal && (
              <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm cursor-pointer" onClick={resetForgotModal}>
                <motion.div
                  onClick={e => e.stopPropagation()}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white rounded-[2rem] p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-zinc-100 max-h-[90vh] overflow-y-auto cursor-default"
                >
                  <button
                    type="button"
                    onClick={resetForgotModal}
                    className="absolute top-5 right-5 p-2 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
                  >
                    <X size={20} className="text-zinc-400" />
                  </button>

                  {forgotStep === 'IDENTIFIER' && (
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                      <div className="text-center pb-2">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 border border-indigo-100">
                          <KeyRound size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900">Reset Password</h3>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                          Enter your registered <b>Email ID</b> or <b>Register Number</b>. We'll send a 6-digit verification code to your inbox.
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block mb-1.5">
                          Email ID or Register Number
                        </label>
                        <Input
                          placeholder="Enter Email ID or Register Number"
                          value={forgotIdentifier}
                          onChange={e => setForgotIdentifier(e.target.value)}
                          required
                          autoFocus
                        />
                      </div>

                      {forgotError && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                          {forgotError}
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={resetForgotModal}>
                          Cancel
                        </Button>
                        <Button type="submit" className="flex-1 rounded-xl" disabled={forgotLoading}>
                          {forgotLoading ? 'Sending Code...' : 'Send Verification Code'}
                        </Button>
                      </div>
                    </form>
                  )}

                  {forgotStep === 'OTP' && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="text-center pb-1">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                          <MailCheck size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900">Enter Verification Code</h3>
                        <p className="text-xs text-zinc-500 mt-1">
                          Code sent to <span className="font-semibold text-zinc-800">{forgotMaskedEmail}</span>
                        </p>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                          <span>⏰ Code expires in:</span>
                          <span className="font-mono font-bold">
                            {Math.floor(forgotCountdown / 60).toString().padStart(2, '0')}:{(forgotCountdown % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block mb-1.5">
                          6-Digit Verification Code (OTP)
                        </label>
                        <Input
                          placeholder="• • • • • •"
                          maxLength={6}
                          value={forgotOtp}
                          onChange={e => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="text-center text-xl tracking-[0.4em] font-mono font-bold"
                          required
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block mb-1.5">
                          New Password
                        </label>
                        <div className="relative">
                          <Input
                            type={forgotShowNewPass ? 'text' : 'password'}
                            placeholder="At least 6 characters"
                            value={forgotNewPassword}
                            onChange={e => setForgotNewPassword(e.target.value)}
                            required
                            className="pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setForgotShowNewPass(p => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                            tabIndex={-1}
                          >
                            {forgotShowNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block mb-1.5">
                          Confirm New Password
                        </label>
                        <Input
                          type={forgotShowNewPass ? 'text' : 'password'}
                          placeholder="Re-enter new password"
                          value={forgotConfirmPassword}
                          onChange={e => setForgotConfirmPassword(e.target.value)}
                          required
                        />
                      </div>

                      {forgotError && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                          {forgotError}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={handleRequestOtp}
                          disabled={forgotResendCooldown > 0 || forgotLoading}
                          className={`text-xs font-semibold ${forgotResendCooldown > 0 ? 'text-zinc-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer'}`}
                        >
                          {forgotResendCooldown > 0 ? `Resend code in ${forgotResendCooldown}s` : 'Resend Code'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setForgotStep('IDENTIFIER')}
                          className="text-xs text-zinc-500 hover:text-zinc-800 cursor-pointer"
                        >
                          Change Email / Reg No
                        </button>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={resetForgotModal}>
                          Cancel
                        </Button>
                        <Button type="submit" className="flex-1 rounded-xl" disabled={forgotLoading || forgotCountdown <= 0}>
                          {forgotLoading ? 'Updating...' : 'Update Password'}
                        </Button>
                      </div>
                    </form>
                  )}

                  {forgotStep === 'SUCCESS' && (
                    <div className="text-center py-4 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                        <CheckCircle2 size={36} />
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900">Password Reset Complete!</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
                        Your password has been successfully updated in the database. You are now logged in!
                      </p>
                      <div className="pt-2">
                        <Button className="w-full rounded-xl" onClick={resetForgotModal}>
                          Go to Dashboard
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ── Industry Self-Registration Modal ─────────────────────────── */}
          <AnimatePresence>
            {showIndustryRegModal && (
              <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer" onClick={() => setShowIndustryRegModal(false)}>
                <motion.div
                  onClick={e => e.stopPropagation()}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white rounded-[2rem] p-6 md:p-8 max-w-lg w-full shadow-2xl relative border border-zinc-100 max-h-[90vh] overflow-y-auto cursor-default"
                >
                  <button
                    type="button"
                    onClick={() => setShowIndustryRegModal(false)}
                    className="absolute top-5 right-5 p-2 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
                  >
                    <X size={20} className="text-zinc-400" />
                  </button>

                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                      <span>🏢</span> Corporate Partner
                    </div>
                    <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Register Industry Account</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Post internships, live projects, campus jobs, and connect with talent
                    </p>
                  </div>

                  {indRegMsg ? (
                    <div className="text-center py-6 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                        <CheckCircle2 size={36} />
                      </div>
                      <h4 className="text-lg font-bold text-zinc-900">Registration Submitted!</h4>
                      <p className="text-xs text-zinc-600 max-w-xs mx-auto">
                        {indRegMsg}
                      </p>
                      <Button
                        className="w-full rounded-xl mt-4"
                        onClick={() => {
                          setShowIndustryRegModal(false);
                          setIndRegMsg('');
                        }}
                      >
                        Back to Login
                      </Button>
                    </div>
                  ) : (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setIndRegLoading(true);
                        setIndRegError('');
                        try {
                          const res = await fetch(`${API_URL}/api/industry/register`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(indRegData),
                          });
                          const data = await res.json();
                          if (res.ok) {
                            setIndRegMsg('Your company registration has been submitted for administrative verification. You can sign in once verified.');
                          } else {
                            setIndRegError(data.error || 'Registration failed');
                          }
                        } catch (err: any) {
                          setIndRegError('Network error during registration');
                        } finally {
                          setIndRegLoading(false);
                        }
                      }}
                      className="space-y-3"
                    >
                      {indRegError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
                          ⚠️ {indRegError}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block mb-1">Company Name *</label>
                          <Input
                            placeholder="e.g. Zoho Corporation / Tech Innovations"
                            value={indRegData.company_name}
                            onChange={e => setIndRegData(p => ({ ...p, company_name: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block mb-1">Industry Sector</label>
                          <select
                            className="w-full h-10 px-3 border border-zinc-200 rounded-xl text-sm bg-white"
                            value={indRegData.industry_sector}
                            onChange={e => setIndRegData(p => ({ ...p, industry_sector: e.target.value }))}
                          >
                            <option value="Information Technology">Information Technology</option>
                            <option value="Fintech & Banking">Fintech & Banking</option>
                            <option value="AI & Robotics">AI & Robotics</option>
                            <option value="Healthcare & BioTech">Healthcare & BioTech</option>
                            <option value="Automotive & EV">Automotive & EV</option>
                            <option value="Consulting & Analytics">Consulting & Analytics</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block mb-1">HR / Recruiter Name *</label>
                          <Input
                            placeholder="e.g. Priya Sharma (Talent Acquisition Lead)"
                            value={indRegData.full_name}
                            onChange={e => setIndRegData(p => ({ ...p, full_name: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block mb-1">Work Email *</label>
                          <Input
                            type="email"
                            placeholder="hr@company.com or careers@org.in"
                            value={indRegData.email}
                            onChange={e => setIndRegData(p => ({ ...p, email: e.target.value, username: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block mb-1">Password *</label>
                          <Input
                            type="password"
                            placeholder="Create password (min 6 chars)"
                            value={indRegData.password}
                            onChange={e => setIndRegData(p => ({ ...p, password: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block mb-1">Website URL</label>
                          <Input
                            placeholder="https://www.company.com"
                            value={indRegData.website}
                            onChange={e => setIndRegData(p => ({ ...p, website: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block mb-1">HQ Location</label>
                        <Input
                          placeholder="e.g. Bengaluru / Chennai, India"
                          value={indRegData.hq_location}
                          onChange={e => setIndRegData(p => ({ ...p, hq_location: e.target.value }))}
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block mb-1">Company Description</label>
                        <textarea
                          className="w-full p-2.5 border border-zinc-200 rounded-xl text-xs resize-none"
                          rows={2}
                          placeholder="Brief overview of company focus, hiring domains, and internship opportunities..."
                          value={indRegData.description}
                          onChange={e => setIndRegData(p => ({ ...p, description: e.target.value }))}
                        />
                      </div>

                      <div className="flex gap-3 pt-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 rounded-xl"
                          onClick={() => setShowIndustryRegModal(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                          disabled={indRegLoading}
                        >
                          {indRegLoading ? 'Submitting...' : 'Register Company'}
                        </Button>
                      </div>
                    </form>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ── 🎓 Student Registration Centered Modal ─────────────────────── */}
          <AnimatePresence>
            {showStudentRegDrawer && (
              <div
                className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer"
                onClick={resetStudentRegDrawer}
              >
                <motion.div
                  onClick={e => e.stopPropagation()}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="bg-white dark:bg-[#121216] rounded-[2rem] p-6 md:p-8 max-w-lg w-full shadow-2xl relative border border-zinc-100 dark:border-zinc-800 max-h-[90vh] overflow-y-auto cursor-default flex flex-col"
                >
                  {/* Close Button in Top Right */}
                  <button
                    type="button"
                    onClick={resetStudentRegDrawer}
                    className="absolute top-5 right-5 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    <X size={20} />
                  </button>

                  {/* Modal Header */}
                  <div className="mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                      <GraduationCap size={14} /> Student Admissions
                    </div>
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                      Student Registration
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {studentRegStep === 'FORM' && 'Step 1 of 2: Fill your institutional details & academic section'}
                      {studentRegStep === 'OTP' && 'Step 2 of 2: Enter the 6-digit verification code sent to your email'}
                      {studentRegStep === 'SUCCESS' && 'Application Submitted for Class Advisor Verification'}
                    </p>

                    {/* Step Breadcrumbs */}
                    <div className="flex items-center gap-2 mt-3">
                      <div className={`h-1.5 flex-1 rounded-full transition-colors ${studentRegStep === 'FORM' || studentRegStep === 'OTP' || studentRegStep === 'SUCCESS' ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                      <div className={`h-1.5 flex-1 rounded-full transition-colors ${studentRegStep === 'OTP' || studentRegStep === 'SUCCESS' ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                      <div className={`h-1.5 flex-1 rounded-full transition-colors ${studentRegStep === 'SUCCESS' ? 'bg-emerald-600' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div className="space-y-4">
                    {studentRegError && (
                      <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs font-semibold rounded-2xl flex items-start gap-2.5">
                        <span className="text-sm shrink-0">⚠️</span>
                        <div className="leading-relaxed">{studentRegError}</div>
                      </div>
                    )}

                    {/* Step 1: Academic Form */}
                    {studentRegStep === 'FORM' && (
                      <form id="student-reg-form" onSubmit={handleStudentRequestOtp} className="space-y-3.5">
                        <div>
                          <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">
                            Full Name (As per College Records) <span className="text-red-500">*</span>
                          </label>
                          <Input
                            placeholder="e.g. THARUN KUMAR K"
                            value={studentRegData.fullName}
                            onChange={e => setStudentRegData(p => ({ ...p, fullName: e.target.value }))}
                            required
                            autoFocus
                            className="text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">
                            University Register Number <span className="text-red-500">*</span>
                          </label>
                          <Input
                            placeholder="e.g. 922524205001"
                            value={studentRegData.registerNumber}
                            onChange={e => setStudentRegData(p => ({ ...p, registerNumber: e.target.value.trim().toUpperCase() }))}
                            required
                            className="font-mono text-sm tracking-wider"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">
                              Department <span className="text-red-500">*</span>
                            </label>
                            <select
                              className="w-full h-10 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                              value={studentRegData.departmentId}
                              onChange={e => {
                                const newDept = e.target.value;
                                const validCls = studentRegAcademicData.classes.filter(c => String(c.department_id) === String(newDept));
                                setStudentRegData(p => ({
                                  ...p,
                                  departmentId: newDept,
                                  classId: validCls.length > 0 ? validCls[0].id : ''
                                }));
                              }}
                              required
                            >
                              {studentRegAcademicData.departments?.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">
                              Class &amp; Section <span className="text-red-500">*</span>
                            </label>
                            <select
                              className="w-full h-10 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                              value={studentRegData.classId}
                              onChange={e => setStudentRegData(p => ({ ...p, classId: e.target.value }))}
                              required
                            >
                              {studentRegAcademicData.classes
                                ?.filter(c => String(c.department_id) === String(studentRegData.departmentId))
                                .map(c => (
                                  <option key={c.id} value={c.id}>
                                    {c.name} {c.batch ? `(${c.batch})` : ''}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">
                            College / Personal Email <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="email"
                            placeholder="e.g. 3ithackathon@gmail.com"
                            value={studentRegData.email}
                            onChange={e => setStudentRegData(p => ({ ...p, email: e.target.value }))}
                            required
                            className="text-sm"
                          />
                          <p className="text-[11px] text-zinc-400 mt-1">
                            A 6-digit Brevo verification code will be sent to this email.
                          </p>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">
                            Create Password (Min 6 Characters) <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Input
                              type={studentRegShowPassword ? 'text' : 'password'}
                              placeholder="Choose secure password"
                              value={studentRegData.password}
                              onChange={e => setStudentRegData(p => ({ ...p, password: e.target.value }))}
                              required
                              className="pr-10 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setStudentRegShowPassword(p => !p)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                              tabIndex={-1}
                            >
                              {studentRegShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    {/* Step 2: OTP Verification Screen */}
                    {studentRegStep === 'OTP' && (
                      <form id="student-otp-form" onSubmit={handleStudentVerifyAndRegister} className="space-y-4 py-2">
                        <div className="text-center pb-2">
                          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                            <MailCheck size={28} />
                          </div>
                          <h4 className="text-lg font-bold text-zinc-900 dark:text-white">Verify Your Email Address</h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            We've sent a 6-digit code to <span className="font-bold text-zinc-900 dark:text-white">{studentRegMaskedEmail}</span>
                          </p>

                          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                            <span>⏱️ Code expires in:</span>
                            <span className="font-mono font-bold">
                              {Math.floor(studentRegCountdown / 60).toString().padStart(2, '0')}:{(studentRegCountdown % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-1.5 text-center">
                            Enter 6-Digit Verification Code
                          </label>
                          <Input
                            placeholder="• • • • • •"
                            maxLength={6}
                            value={studentRegOtp}
                            onChange={e => setStudentRegOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="text-center text-2xl tracking-[0.5em] font-mono font-bold h-13"
                            required
                            autoFocus
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <button
                            type="button"
                            onClick={handleStudentResendOtp}
                            disabled={studentRegResendCooldown > 0 || studentRegLoading}
                            className={`font-semibold ${studentRegResendCooldown > 0 ? 'text-zinc-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800 hover:underline cursor-pointer'}`}
                          >
                            {studentRegResendCooldown > 0 ? `Resend code in ${studentRegResendCooldown}s` : 'Resend Code'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setStudentRegStep('FORM');
                              setStudentRegError('');
                            }}
                            className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <ArrowLeft size={12} /> Edit Details
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Step 3: Success & Pending Confirmation */}
                    {studentRegStep === 'SUCCESS' && (
                      <div className="text-center py-6 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-50 dark:ring-emerald-950/30">
                          <CheckCircle2 size={36} />
                        </div>
                        <h4 className="text-xl font-bold text-zinc-900 dark:text-white">Registration Submitted!</h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                          Your email was successfully verified. Your account for <b>{studentRegSuccessData?.fullName || studentRegData.fullName}</b> ({studentRegSuccessData?.registerNumber || studentRegData.registerNumber}) has been placed in <b>Pending Advisor Approval</b>.
                        </p>

                        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl text-left text-xs space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Assigned Class:</span>
                            <span className="font-bold text-zinc-900 dark:text-white">{studentRegSuccessData?.className || 'Assigned Section'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Department:</span>
                            <span className="font-bold text-zinc-900 dark:text-white">{studentRegSuccessData?.departmentName || 'Information Technology'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Status:</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">⏳ Pending Advisor Approval</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Your Class Advisor will review and approve your profile. Once approved, you can log in directly using your Register Number and Password.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
                    {studentRegStep === 'FORM' && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 rounded-xl cursor-pointer"
                          onClick={resetStudentRegDrawer}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          form="student-reg-form"
                          className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                          disabled={studentRegLoading}
                        >
                          {studentRegLoading ? 'Sending Code...' : 'Send Verification Code →'}
                        </Button>
                      </>
                    )}

                    {studentRegStep === 'OTP' && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 rounded-xl cursor-pointer"
                          onClick={() => {
                            setStudentRegStep('FORM');
                            setStudentRegError('');
                          }}
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          form="student-otp-form"
                          className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                          disabled={studentRegLoading || studentRegOtp.length !== 6 || studentRegCountdown <= 0}
                        >
                          {studentRegLoading ? 'Verifying...' : 'Verify & Register'}
                        </Button>
                      </>
                    )}

                    {studentRegStep === 'SUCCESS' && (
                      <Button
                        type="button"
                        className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                        onClick={resetStudentRegDrawer}
                      >
                        Back to Login
                      </Button>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );

}

export default AuthView;
