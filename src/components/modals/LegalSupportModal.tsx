import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Shield,
  FileText,
  HelpCircle,
  Database,
  ExternalLink,
  Mail,
  Send,
  CheckCircle2,
  Lock,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Button } from '../ui/Button';

export type LegalModalType = 'PRIVACY' | 'TERMS' | 'SUPPORT' | 'SOURCES';

export interface LegalSupportModalProps {
  isOpen: boolean;
  type: LegalModalType | null;
  onClose: () => void;
}

export const LegalSupportModal: React.FC<LegalSupportModalProps> = ({
  isOpen,
  type,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<LegalModalType>('PRIVACY');

  useEffect(() => {
    if (type) {
      setActiveTab(type);
    }
  }, [type]);

  // Handle escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-4xl bg-white dark:bg-[#121217] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] z-10 overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                {activeTab === 'PRIVACY' && <Shield size={20} />}
                {activeTab === 'TERMS' && <FileText size={20} />}
                {activeTab === 'SUPPORT' && <HelpCircle size={20} />}
                {activeTab === 'SOURCES' && <Database size={20} />}
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                  {activeTab === 'PRIVACY' && 'Privacy Policy & Data Protection'}
                  {activeTab === 'TERMS' && 'Terms of Service & Code of Conduct'}
                  {activeTab === 'SUPPORT' && 'Help, Documentation & Support'}
                  {activeTab === 'SOURCES' && 'System Architecture & Data Sources'}
                </h3>
                <p className="text-xs text-zinc-500 font-medium">
                  VSB Engineering College • Department of Information Technology
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 pt-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121217] shrink-0">
            <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto scrollbar-none" aria-label="Legal & Support Tabs">
              <button
                type="button"
                onClick={() => setActiveTab('PRIVACY')}
                className={`pb-3 px-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'PRIVACY'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                <Shield size={14} /> Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('TERMS')}
                className={`pb-3 px-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'TERMS'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                <FileText size={14} /> Terms of Service
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('SUPPORT')}
                className={`pb-3 px-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'SUPPORT'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                <HelpCircle size={14} /> Help & Support
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('SOURCES')}
                className={`pb-3 px-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'SOURCES'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                <Database size={14} /> Sources & Specs
              </button>
            </nav>
          </div>

          {/* Modal Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-zinc-700 dark:text-zinc-300 custom-scrollbar leading-relaxed">
            {activeTab === 'PRIVACY' && (
              <div className="space-y-6">
                <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4">
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm flex items-center gap-2">
                    <Lock size={16} /> Privacy Commitment
                  </h4>
                  <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-1">
                    VSBEC IT Vault is designed to uphold rigorous academic data integrity, confidentiality, and security standards for all institutional students, faculty, and corporate partners.
                  </p>
                </div>

                <div className="space-y-2">
                  <h5 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">1. Data Collected</h5>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">
                    We collect student register numbers, academic emails, full names, assigned classes, task submissions, code assessment logs, LeetCode profile handles, and optional Telegram chat IDs for automated notification delivery.
                  </p>
                </div>

                <div className="space-y-2">
                  <h5 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">2. Purpose of Processing</h5>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">
                    Student data is processed exclusively to verify academic coursework, record daily competitive programming habits, evaluate skill gap indicators, compile placement readiness indices, and issue official faculty reports.
                  </p>
                </div>

                <div className="space-y-2">
                  <h5 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">3. Media & Proof Storage</h5>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">
                    Task submission screenshots and verification assets are uploaded over secure HTTPS to Cloudinary and tracked via unique public identifiers. Media records older than 30 days are automatically purged while retaining immutable verification audit logs in PostgreSQL.
                  </p>
                </div>

                <div className="space-y-2">
                  <h5 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">4. Access Controls & Role Isolation</h5>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">
                    Role-Based Access Control (RBAC) ensures Class Advisors can only inspect students belonging to their assigned class, HODs can monitor department-wide cohorts, and verified Industry HR recruiters can only review approved candidate profiles.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'TERMS' && (
              <div className="space-y-6">
                <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-xl p-4">
                  <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm flex items-center gap-2">
                    <FileText size={16} /> Academic Code of Conduct
                  </h4>
                  <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1">
                    Every user of VSBEC IT Vault agrees to observe ethical academic conduct, authenticity in coursework, and strict anti-plagiarism guidelines.
                  </p>
                </div>

                <div className="space-y-2">
                  <h5 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">1. Authentic Submissions</h5>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">
                    Students must submit original proofs, genuine coding contest solutions, and real GitHub activity. Falsifying screenshots, forging LeetCode statistics, or claiming peer submissions is grounds for immediate rejection and faculty disciplinary escalation.
                  </p>
                </div>

                <div className="space-y-2">
                  <h5 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">2. Deadlines & Extensions</h5>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">
                    Deadlines are automatically synchronized with Indian Standard Time (IST). Tasks close strictly at 11:59 PM IST on the deadline date unless an authorized extension is granted by the assigned Class Advisor or HOD.
                  </p>
                </div>

                <div className="space-y-2">
                  <h5 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">3. In-Browser Assessment Integrity</h5>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">
                    Proctored skill assessments and in-browser coding tests log full-screen blur events, tab switches, and webcam proctoring frames. Attempting to bypass proctoring controls or use unauthorized tools will terminate the assessment attempt.
                  </p>
                </div>

                <div className="space-y-2">
                  <h5 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">4. Account Credentials</h5>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">
                    Users are solely responsible for maintaining the confidentiality of their credentials and OTPs. Shared or unauthorized proxy logins will result in account suspension.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'SUPPORT' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Mail size={16} />
                    </div>
                    <h5 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Department Technical Support</h5>
                    <p className="text-xs text-zinc-500">
                      For account activation, password resets, or database corrections:
                    </p>
                    <a
                      href="mailto:it.taskmanager.vsbec@gmail.com"
                      className="text-xs font-bold text-indigo-600 hover:underline block pt-1"
                    >
                      it.taskmanager.vsbec@gmail.com
                    </a>
                  </div>

                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                      <Send size={16} />
                    </div>
                    <h5 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Telegram Bot Alerts</h5>
                    <p className="text-xs text-zinc-500">
                      Link your account to receive real-time deadline warnings and verification feedback:
                    </p>
                    <a
                      href="https://t.me/it_taskmanager"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1 pt-1"
                    >
                      <span>@IT_TaskManager_Alerts_bot</span> <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Frequently Asked Questions</h5>
                  <div className="space-y-2 text-xs">
                    <details className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer">
                      <summary className="font-bold text-zinc-800 dark:text-zinc-200">How do I verify my LeetCode streak?</summary>
                      <p className="mt-2 text-zinc-600 dark:text-zinc-400 leading-normal">
                        Ensure your LeetCode username is correctly entered in your Student Profile. Our backend sync workers poll public GraphQL endpoints to register your daily solved counts and maintain your streak index.
                      </p>
                    </details>
                    <details className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer">
                      <summary className="font-bold text-zinc-800 dark:text-zinc-200">What if my task submission is rejected?</summary>
                      <p className="mt-2 text-zinc-600 dark:text-zinc-400 leading-normal">
                        Check the specific rejection reason provided by your faculty advisor in the Tasks or Submissions view. If the task is still open, you can resubmit an updated proof immediately.
                      </p>
                    </details>
                    <details className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer">
                      <summary className="font-bold text-zinc-800 dark:text-zinc-200">How do I generate my verified PDF profile?</summary>
                      <p className="mt-2 text-zinc-600 dark:text-zinc-400 leading-normal">
                        Navigate to your Student Profile view and click the "Export Placement PDF" button to download a cryptographically formatted placement dossier.
                      </p>
                    </details>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'SOURCES' && (
              <div className="space-y-6">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-2">
                    <Cpu size={16} className="text-indigo-600" /> Platform Architecture & Synchronizers
                  </h4>
                  <p className="text-xs text-zinc-500">
                    High-availability academic operations stack maintained for VSB Engineering College Department of Information Technology.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block">Database Tier</span>
                    <span className="text-zinc-500">Supabase PostgreSQL with dedicated schema isolation and Row-Level Security policies.</span>
                  </div>
                  <div className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block">Mailing Service</span>
                    <span className="text-zinc-500">Brevo REST API v3 dispatching 6-digit cryptographic OTPs and automated deadline alerts.</span>
                  </div>
                  <div className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block">Media & Asset Pipeline</span>
                    <span className="text-zinc-500">Cloudinary CDN with automated 30-day proof archiving and thumbnail transformations.</span>
                  </div>
                  <div className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block">Dual Git Parity</span>
                    <span className="text-zinc-500">Continuous parity between TK4743/taskmanager and Tharun4743/taskmanager repositories.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end shrink-0">
            <Button variant="secondary" onClick={onClose} className="text-xs font-bold px-4 py-2">
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LegalSupportModal;
