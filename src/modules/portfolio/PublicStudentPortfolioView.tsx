import React, { useEffect, useState } from 'react';
import {
  User,
  GraduationCap,
  Briefcase,
  Code2,
  Award,
  ExternalLink,
  Github,
  Globe,
  Share2,
  Check,
  QrCode,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Layers,
  Terminal,
  Download
} from 'lucide-react';
import { API_URL } from '../../config';
import { ThemeToggle } from '../../components/layout/ThemeToggle';
import { downloadStudentResumePdf } from '../../utils/pdf/studentProfilePdfGenerator';

interface PublicPortfolioProps {
  regNo: string;
  onBackToApp?: () => void;
}

export default function PublicStudentPortfolioView({ regNo, onBackToApp }: PublicPortfolioProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Guarantee browser-level vertical scroll enablement
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}/api/public/portfolio/${encodeURIComponent(regNo)}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Unable to load portfolio for ${regNo}`);
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Failed to load student portfolio');
      } finally {
        setLoading(false);
      }
    };

    if (regNo) {
      fetchPortfolio();
    }
  }, [regNo]);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/p/${encodeURIComponent(regNo)}` : '';

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen h-[100dvh] w-full overflow-y-auto bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-mono tracking-wide animate-pulse">
          Retrieving verified academic record for {regNo}...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen h-[100dvh] w-full overflow-y-auto bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4 text-red-500 dark:text-red-400">
          <User size={32} />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Portfolio Unavailable</h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-md mb-6 leading-relaxed">
          {error || 'This student profile is either private or does not exist in the VSBEC IT Vault registry.'}
        </p>
        {onBackToApp && (
          <button
            onClick={onBackToApp}
            className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 text-sm font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm"
          >
            <ArrowLeft size={16} /> Return to Portal
          </button>
        )}
      </div>
    );
  }

  const { academic, personal, skills = [], projects = [], internships = [], certifications = [], coding_profiles = {}, achievements = [] } = data;

  const hasAnyCodingProfile = Boolean(
    coding_profiles && (
      coding_profiles.github ||
      coding_profiles.leetcode ||
      coding_profiles.linkedin ||
      coding_profiles.portfolio
    )
  );

  return (
    <div className="min-h-screen h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-950 dark:selection:text-emerald-200 pb-20 custom-scrollbar">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer shrink-0"
              title="Return to Portal"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block leading-none truncate">
                VSBEC IT VAULT
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate block">
                Verified Student Portfolio
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Light / Dark Mode Toggle */}
          <ThemeToggle />

          {/* Download Resume PDF Button */}
          <button
            onClick={() => downloadStudentResumePdf(data)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition shadow-2xs cursor-pointer"
            title="Download verified student academic resume (PDF)"
          >
            <Download size={14} />
            <span>Resume (PDF)</span>
          </button>

          {/* QR Code Trigger */}
          <button
            onClick={() => setShowQrModal(true)}
            className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer shadow-2xs"
            title="Scan QR Code"
          >
            <QrCode size={16} />
          </button>

          {/* Share Portfolio Trigger */}
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
            title="Copy public portfolio link"
          >
            {copied ? <Check size={14} className="text-emerald-200" /> : <Share2 size={14} />}
            <span className="hidden sm:inline">{copied ? 'Copied Link!' : 'Share Portfolio'}</span>
            <span className="sm:hidden">{copied ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      </header>

      {/* Hero Profile Header */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 space-y-8">
        <section className="relative p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 shadow-md dark:shadow-2xl backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
            {academic.avatar_url ? (
              <img
                src={academic.avatar_url}
                alt={academic.full_name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-lg shrink-0"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-3xl font-black shrink-0">
                {academic.full_name?.charAt(0) || 'S'}
              </div>
            )}

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                  {academic.full_name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 shadow-2xs">
                  <ShieldCheck size={12} /> Verified Profile
                </span>
              </div>

              <p className="text-sm font-mono text-zinc-600 dark:text-zinc-400">
                Reg No: <span className="text-zinc-900 dark:text-zinc-200 font-bold">{academic.register_number}</span>
                <span className="mx-2 text-zinc-300 dark:text-zinc-600">•</span>
                {academic.department_name} ({academic.batch})
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-zinc-600 dark:text-zinc-400">
                <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 font-semibold text-zinc-800 dark:text-zinc-200">
                  {academic.class_name || 'Department of IT'}
                </span>
                {personal.semester && (
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 font-semibold text-zinc-800 dark:text-zinc-200">
                    Semester {personal.semester}
                  </span>
                )}
                {personal.cgpa && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-extrabold shadow-2xs">
                    CGPA: {personal.cgpa}
                  </span>
                )}
              </div>
            </div>
          </div>

          {personal.about_me && (
            <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">About</h3>
              <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                {personal.about_me}
              </p>
            </div>
          )}

          {/* Coding Profile Badges */}
          {hasAnyCodingProfile && (
            <div className="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800/80 flex flex-wrap items-center gap-3">
              {coding_profiles.github && (
                <a
                  href={`https://github.com/${coding_profiles.github.replace(/^https?:\/\/github\.com\//i, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
                >
                  <Github size={14} /> GitHub: {coding_profiles.github.replace(/^https?:\/\/github\.com\//i, '')}
                </a>
              )}
              {coding_profiles.leetcode && (
                <a
                  href={`https://leetcode.com/${coding_profiles.leetcode.replace(/^https?:\/\/leetcode\.com\/(u\/)?/i, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
                >
                  <Code2 size={14} /> LeetCode: {coding_profiles.leetcode.replace(/^https?:\/\/leetcode\.com\/(u\/)?/i, '')}
                </a>
              )}
              {coding_profiles.linkedin && (
                <a
                  href={coding_profiles.linkedin.startsWith('http') ? coding_profiles.linkedin : `https://linkedin.com/in/${coding_profiles.linkedin}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
                >
                  <Globe size={14} /> LinkedIn
                </a>
              )}
              {coding_profiles.portfolio && (
                <a
                  href={coding_profiles.portfolio.startsWith('http') ? coding_profiles.portfolio : `https://${coding_profiles.portfolio}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 text-purple-800 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
                >
                  <Globe size={14} /> Personal Website
                </a>
              )}
            </div>
          )}
        </section>

        {/* Skills Section */}
        {skills.length > 0 && (
          <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 shadow-md dark:shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-600 dark:text-emerald-400" /> Technical Skills
            </h2>
            <div className="flex flex-wrap gap-2 pt-1">
              {skills.map((s: any, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 shadow-2xs"
                >
                  <span>{s.skill_name}</span>
                  {s.proficiency && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold">
                      {s.proficiency}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Projects Section */}
        {projects.length > 0 && (
          <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 shadow-md dark:shadow-xl space-y-5">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Code2 size={18} className="text-emerald-600 dark:text-emerald-400" /> Featured Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((p: any, idx: number) => {
                const title = p.project_title || p.project_name || 'Project';
                const liveUrl = p.project_url || p.live_demo_url;
                return (
                  <div key={idx} className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-3 flex flex-col justify-between hover:border-emerald-500/40 transition">
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-zinc-900 dark:text-white text-base">{title}</h3>
                      {p.tech_stack && (
                        <p className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-medium">{p.tech_stack}</p>
                      )}
                      {p.description && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3">{p.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      {liveUrl && (
                        <a
                          href={liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold flex items-center gap-1"
                        >
                          Live Demo <ExternalLink size={12} />
                        </a>
                      )}
                      {p.github_url && (
                        <a
                          href={p.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-semibold flex items-center gap-1"
                        >
                          Source <Github size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Internships Section */}
        {internships.length > 0 && (
          <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 shadow-md dark:shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Briefcase size={18} className="text-emerald-600 dark:text-emerald-400" /> Industry Internships & Experience
            </h2>
            <div className="space-y-3">
              {internships.map((int: any, idx: number) => {
                const role = int.role_title || int.role || 'Intern';
                const company = int.company_name || int.company || 'Company';
                return (
                  <div key={idx} className="p-4 rounded-xl bg-zinc-50/80 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{role}</h3>
                      {int.duration && <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{int.duration}</span>}
                    </div>
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{company}</p>
                    {int.description && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 pt-1 leading-relaxed">{int.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Certifications Section */}
        {certifications.length > 0 && (
          <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 shadow-md dark:shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Award size={18} className="text-emerald-600 dark:text-emerald-400" /> Verified Certifications
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {certifications.map((c: any, idx: number) => {
                const certName = c.cert_name || c.certificate_name || 'Certification';
                const issuer = c.issuer || c.provider || '';
                const certLink = c.cert_url || c.certificate_url;
                return (
                  <div key={idx} className="p-4 rounded-xl bg-zinc-50/80 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{certName}</h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{issuer} {c.issue_date ? `• ${c.issue_date}` : ''}</p>
                    </div>
                    {certLink && (
                      <a
                        href={certLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                        title="View Credential"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Achievements Section */}
        {achievements.length > 0 && (
          <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 shadow-md dark:shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Award size={18} className="text-amber-500 dark:text-amber-400" /> Honors & Achievements
            </h2>
            <div className="space-y-3">
              {achievements.map((ach: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-zinc-50/80 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{ach.title}</h3>
                  {ach.description && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{ach.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* QR Code Modal */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-5 shadow-2xl cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Scan Portfolio QR</h3>
            <div className="bg-white p-4 rounded-2xl inline-block shadow-lg border border-zinc-200">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`}
                alt="QR Code"
                className="w-48 h-48"
              />
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Scan with any mobile camera to view {academic.full_name}'s verified student portfolio.
            </p>
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
