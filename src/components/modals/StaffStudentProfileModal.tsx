import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, User, Mail, Phone, BookOpen, GraduationCap, Building2,
  Trophy, Award, Code, Github, Linkedin, Globe, ExternalLink,
  Download, FileText, CheckCircle2, Clock, AlertTriangle, Sparkles,
  Layers, Briefcase, Calendar, RotateCcw
} from 'lucide-react';
import { API_URL } from '../../config';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { getStudentRegisterNumber, getOptimizedImgUrl } from '../common/helpers';
import type { User as UserType } from '../../types';

export function StaffStudentProfileModal({
  studentId,
  token,
  onClose
}: {
  studentId: string;
  token: string | null;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('personal');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/student/profile/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        } else {
          const err = await res.json();
          setError(err.error || 'Failed to load student profile');
        }
      } catch {
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };
    if (studentId) fetchProfile();
  }, [studentId, token]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const acad = profile?.academic || {};

  const sections = [
    { id: 'personal', label: '1. Personal & Academic', icon: User },
    { id: 'skills', label: '2. Skills', icon: Code },
    { id: 'projects', label: '3. Projects', icon: Layers },
    { id: 'internships', label: '4. Internships', icon: Briefcase },
    { id: 'certifications', label: '5. Certifications', icon: Award },
    { id: 'coding', label: '6. Coding Profiles', icon: Globe },
    { id: 'achievements', label: '7. Achievements', icon: Sparkles },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[130] flex items-center justify-center p-3 sm:p-4 md:p-6" onClick={onClose}>
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl p-5 sm:p-6 md:p-8 w-full max-w-[94vw] h-[92vh] max-h-[94vh] shadow-2xl relative flex flex-col overflow-hidden border border-zinc-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 md:pb-5 border-b border-zinc-200 shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-zinc-900 overflow-hidden flex items-center justify-center text-white font-bold shrink-0">
              {acad.avatar_url ? (
                <img src={acad.avatar_url} alt={acad.full_name} className="w-full h-full object-cover" />
              ) : (
                (acad.full_name || 'ST').substring(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-zinc-900 flex items-center gap-2">
                {acad.full_name || 'Student Profile'}
              </h2>
              <p className="text-xs md:text-sm text-zinc-500 font-semibold">
                Reg No: {acad.register_number} • Section: {acad.class_name || 'N/A'} • Dept: {acad.department_name || 'IT'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={async () => {
                if (profile) {
                  const { downloadStudentResumePdf } = await import('../../utils/pdf/studentProfilePdfGenerator');
                  downloadStudentResumePdf(profile);
                }
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Download this student's profile as a formatted Resume PDF"
            >
              <Download size={14} /> <span>Download Resume (PDF)</span>
            </button>
            {acad.register_number && (
              <a
                href={`/p/${encodeURIComponent(acad.register_number)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                title="View shareable public portfolio"
              >
                <Globe size={14} /> <span>Public Portfolio</span>
              </a>
            )}
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-800 transition-colors border border-transparent hover:border-zinc-200 cursor-pointer">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Section Pill Selectors */}
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto max-w-full py-3 md:py-3.5 custom-scrollbar shrink-0 border-b border-zinc-200">
          {sections.map(s => {
            const SIcon = s.icon;
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  "px-3.5 sm:px-4 py-2 md:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 shrink-0 border cursor-pointer",
                  isActive
                    ? "bg-zinc-900 text-white border-zinc-900 shadow-sm scale-[1.01]"
                    : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
                )}
              >
                <SIcon size={14} className={cn(isActive ? "text-white" : "text-zinc-400")} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pt-4 md:pt-5 space-y-4 md:space-y-5 pr-1 md:pr-2 custom-scrollbar">
          {loading ? (
            <div className="py-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-3.5 md:p-4 bg-zinc-50/50 rounded-xl border border-zinc-200/60 space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
              <div className="space-y-3 pt-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
              {error}
            </div>
          ) : (
            <>
              {activeSection === 'personal' && (
                <div className="space-y-4 md:space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                    <div className="p-3.5 md:p-4 bg-zinc-50/50 rounded-xl border border-zinc-200/60 flex gap-3 items-center">
                      <Mail size={18} className="text-zinc-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">College Email</p>
                        <p className="text-xs md:text-sm font-bold text-zinc-900 truncate" title={acad.email}>{acad.email || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="p-3.5 md:p-4 bg-zinc-50/50 rounded-xl border border-zinc-200/60 flex gap-3 items-center">
                      <User size={18} className="text-zinc-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Gender</p>
                        <p className="text-xs md:text-sm font-bold text-zinc-900 truncate">{acad.gender || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="p-3.5 md:p-4 bg-zinc-50/50 rounded-xl border border-zinc-200/60 flex gap-3 items-center">
                      <Phone size={18} className="text-zinc-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Mobile Number</p>
                        <p className="text-xs md:text-sm font-bold text-zinc-900 truncate">{profile.personal?.mobile_number || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="p-3.5 md:p-4 bg-zinc-50/50 rounded-xl border border-zinc-200/60 flex gap-3 items-center">
                      <Calendar size={18} className="text-zinc-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Date of Birth</p>
                        <p className="text-xs md:text-sm font-bold text-zinc-900 truncate">{profile.personal?.date_of_birth || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="p-3.5 md:p-4 bg-zinc-50/50 rounded-xl border border-zinc-200/60 flex gap-3 items-center">
                      <BookOpen size={18} className="text-zinc-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Semester</p>
                        <p className="text-xs md:text-sm font-bold text-zinc-900 truncate">{profile.personal?.semester ? `Semester ${profile.personal.semester}` : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="p-3.5 md:p-4 bg-zinc-50/50 rounded-xl border border-zinc-200/60 flex gap-3 items-center">
                      <GraduationCap size={18} className="text-emerald-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">CGPA</p>
                        <p className="text-xs md:text-sm font-bold text-emerald-600 truncate">{profile.personal?.cgpa || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="p-3.5 md:p-4 bg-zinc-50/50 rounded-xl border border-zinc-200/60 flex gap-3 items-center">
                      <AlertTriangle size={18} className={cn("shrink-0", (profile.personal?.current_arrears > 0) ? "text-rose-500" : "text-emerald-500")} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Current Arrears</p>
                        <p className={cn("text-xs md:text-sm font-bold truncate", (profile.personal?.current_arrears > 0) ? "text-rose-600" : "text-emerald-600")}>
                          {profile.personal?.current_arrears ?? 0}
                        </p>
                      </div>
                    </div>
                    <div className="p-3.5 md:p-4 bg-zinc-50/50 rounded-xl border border-zinc-200/60 flex gap-3 items-center">
                      <RotateCcw size={18} className={cn("shrink-0", (profile.personal?.history_of_arrears > 0) ? "text-amber-500" : "text-zinc-400")} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">History of Arrears</p>
                        <p className={cn("text-xs md:text-sm font-bold truncate", (profile.personal?.history_of_arrears > 0) ? "text-amber-600" : "text-zinc-600")}>
                          {profile.personal?.history_of_arrears ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {profile.personal?.about_me && (
                    <div className="p-4 md:p-5 bg-zinc-50/50 rounded-2xl border border-zinc-200/60">
                      <p className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase mb-1.5 tracking-wider">About Student</p>
                      <p className="text-xs md:text-sm text-zinc-700 leading-relaxed">{profile.personal.about_me}</p>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'skills' && (
                <div className="space-y-4 md:space-y-5">
                  {(() => {
                    const grouped: Record<string, any[]> = {};
                    (profile.skills || []).forEach((sk: any) => {
                      const cat = sk.category || 'Other';
                      if (!grouped[cat]) grouped[cat] = [];
                      grouped[cat].push(sk);
                    });
                    const categories = Object.keys(grouped).sort();
                    if (categories.length === 0) {
                      return <p className="text-xs text-zinc-400 py-8 text-center">No skills recorded.</p>;
                    }
                    return categories.map(cat => (
                      <div key={cat} className="p-4 md:p-5 bg-zinc-50/50 rounded-2xl border border-zinc-200/60 shadow-2xs">
                        <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Code size={13} className="text-zinc-500" /> {cat}
                        </h4>
                        <div className="flex flex-wrap gap-2 md:gap-2.5">
                          {grouped[cat].map((sk: any) => {
                            const isLvlAdvanced = sk.level?.toLowerCase() === 'advanced';
                            const isLvlIntermediate = sk.level?.toLowerCase() === 'intermediate';
                            return (
                              <div key={sk.id} className="px-3.5 py-2 bg-white rounded-xl border border-zinc-200/80 text-xs font-semibold flex items-center gap-2 hover:border-zinc-400 transition-colors">
                                <span className="text-zinc-800">{sk.skill_name}</span>
                                <span className={cn(
                                  "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
                                  isLvlAdvanced ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                    isLvlIntermediate ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-zinc-100 text-zinc-600"
                                )}>
                                  {sk.level || 'Unknown'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {activeSection === 'projects' && (
                <div className="space-y-4 md:space-y-5">
                  {(profile.projects || []).length === 0 ? (
                    <p className="text-xs text-zinc-400 py-8 text-center">No projects recorded.</p>
                  ) : (
                    profile.projects.map((p: any) => (
                      <div key={p.id} className="p-5 md:p-6 bg-zinc-50/50 border border-zinc-200/60 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h4 className="text-sm md:text-base font-bold text-zinc-900 flex items-center gap-1.5">
                              <Layers size={15} className="text-zinc-500" /> {p.project_name}
                            </h4>
                            {p.tech_stack && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {p.tech_stack.split(',').map((tech: string, tIdx: number) => (
                                  <span key={tIdx} className="px-2 py-0.5 rounded-md bg-indigo-50/50 border border-indigo-100 text-[10px] font-bold text-indigo-600">
                                    {tech.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {p.description && <p className="text-xs md:text-sm text-zinc-600 leading-relaxed">{p.description}</p>}
                        <div className="flex gap-3 pt-1 text-xs">
                          {p.github_url && (
                            <a href={p.github_url} target="_blank" rel="noreferrer" className="px-3.5 py-1.5 bg-white border border-zinc-200 hover:border-zinc-400 text-zinc-700 font-bold rounded-xl flex items-center gap-1.5 transition-colors">
                              <Github size={13} /> Code Repository
                            </a>
                          )}
                          {p.live_demo_url && (
                            <a href={p.live_demo_url} target="_blank" rel="noreferrer" className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 hover:border-emerald-300 text-emerald-700 font-bold rounded-xl flex items-center gap-1.5 transition-colors">
                              <Globe size={13} /> Live Preview
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeSection === 'internships' && (
                <div className="space-y-4 md:space-y-5">
                  {(profile.internships || []).length === 0 ? (
                    <p className="text-xs text-zinc-400 py-8 text-center">No internships recorded.</p>
                  ) : (
                    profile.internships.map((intern: any) => (
                      <div key={intern.id} className="p-5 md:p-6 bg-zinc-50/50 border border-zinc-200/60 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-sm md:text-base font-bold text-zinc-900 flex items-center gap-1.5">
                            <Briefcase size={15} className="text-zinc-500" /> {intern.company}
                          </h4>
                          <p className="text-xs md:text-sm font-bold text-zinc-600">
                            {intern.role}
                          </p>
                          <p className="text-[11px] md:text-xs text-zinc-400 font-semibold">
                            {intern.duration} • <span className="uppercase text-[10px] bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-500 font-bold">{intern.mode}</span>
                          </p>
                        </div>
                        {intern.certificate_url && (
                          <a href={intern.certificate_url} target="_blank" rel="noreferrer" className="px-3.5 py-2 bg-white border border-zinc-200 hover:border-zinc-400 text-indigo-600 hover:text-indigo-800 font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0 text-xs shadow-2xs">
                            <ExternalLink size={13} /> View Certificate
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeSection === 'certifications' && (
                <div className="space-y-4 md:space-y-5">
                  {(profile.certifications || []).length === 0 ? (
                    <p className="text-xs text-zinc-400 py-8 text-center">No certifications recorded.</p>
                  ) : (
                    profile.certifications.map((c: any) => (
                      <div key={c.id} className="p-5 md:p-6 bg-zinc-50/50 border border-zinc-200/60 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-sm md:text-base font-bold text-zinc-900 flex items-center gap-1.5">
                            <Award size={15} className="text-zinc-500" /> {c.certificate_name}
                          </h4>
                          <p className="text-xs md:text-sm font-semibold text-zinc-600">
                            {c.provider} {c.issue_date ? `• Issued ${c.issue_date}` : ''}
                          </p>
                        </div>
                        {c.certificate_url && (
                          <a href={c.certificate_url} target="_blank" rel="noreferrer" className="px-3.5 py-2 bg-white border border-zinc-200 hover:border-zinc-400 text-indigo-600 hover:text-indigo-800 font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0 text-xs shadow-2xs">
                            <ExternalLink size={13} /> View Credential
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeSection === 'coding' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {profile.coding_profiles?.github && (
                    <a href={profile.coding_profiles.github} target="_blank" rel="noreferrer" className="p-4 md:p-5 bg-zinc-900 border border-zinc-950 text-xs md:text-sm font-bold text-white rounded-2xl flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] transition-all group">
                      <span className="flex items-center gap-2.5">
                        <Github size={18} />
                        <span>GitHub Profile</span>
                      </span>
                      <ExternalLink size={13} className="opacity-60 group-hover:opacity-100" />
                    </a>
                  )}
                  {profile.coding_profiles?.leetcode && (
                    <a href={profile.coding_profiles.leetcode} target="_blank" rel="noreferrer" className="p-4 md:p-5 bg-amber-50 border border-amber-200 text-xs md:text-sm font-bold text-amber-800 rounded-2xl flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] transition-all group">
                      <span className="flex items-center gap-2.5">
                        <Globe size={18} className="text-amber-600" />
                        <span>LeetCode Profile</span>
                      </span>
                      <ExternalLink size={13} className="opacity-60 group-hover:opacity-100" />
                    </a>
                  )}
                  {profile.coding_profiles?.linkedin && (
                    <a href={profile.coding_profiles.linkedin} target="_blank" rel="noreferrer" className="p-4 md:p-5 bg-blue-50 border border-blue-200 text-xs md:text-sm font-bold text-blue-800 rounded-2xl flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] transition-all group">
                      <span className="flex items-center gap-2.5">
                        <Linkedin size={18} className="text-blue-600" />
                        <span>LinkedIn Profile</span>
                      </span>
                      <ExternalLink size={13} className="opacity-60 group-hover:opacity-100" />
                    </a>
                  )}
                  {profile.coding_profiles?.geeksforgeeks && (
                    <a href={profile.coding_profiles.geeksforgeeks} target="_blank" rel="noreferrer" className="p-4 md:p-5 bg-emerald-50 border border-emerald-200 text-xs md:text-sm font-bold text-emerald-800 rounded-2xl flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] transition-all group">
                      <span className="flex items-center gap-2.5">
                        <Globe size={18} className="text-emerald-600" />
                        <span>GeeksforGeeks Profile</span>
                      </span>
                      <ExternalLink size={13} className="opacity-60 group-hover:opacity-100" />
                    </a>
                  )}
                  {profile.coding_profiles?.portfolio && (
                    <a href={profile.coding_profiles.portfolio} target="_blank" rel="noreferrer" className="p-4 md:p-5 bg-indigo-50 border border-indigo-200 text-xs md:text-sm font-bold text-indigo-800 rounded-2xl flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] transition-all group">
                      <span className="flex items-center gap-2.5">
                        <Globe size={18} className="text-indigo-600" />
                        <span>Portfolio Website</span>
                      </span>
                      <ExternalLink size={13} className="opacity-60 group-hover:opacity-100" />
                    </a>
                  )}
                </div>
              )}

              {activeSection === 'achievements' && (
                <div className="space-y-4 md:space-y-5">
                  {(profile.achievements || []).length === 0 ? (
                    <p className="text-xs text-zinc-400 py-8 text-center">No achievements recorded.</p>
                  ) : (
                    profile.achievements.map((ach: any) => (
                      <div key={ach.id} className="p-5 md:p-6 bg-zinc-50/50 border border-zinc-200/60 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm md:text-base font-bold text-zinc-900 flex items-center gap-1.5">
                            <Trophy size={15} className="text-amber-500" /> {ach.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-[9px] font-black text-indigo-600 uppercase">
                            {ach.category}
                          </span>
                        </div>
                        {ach.event_date && <p className="text-[10px] md:text-xs text-zinc-400 font-semibold">{ach.event_date}</p>}
                        {ach.description && <p className="text-xs md:text-sm text-zinc-600 mt-2 leading-relaxed">{ach.description}</p>}
                      </div>
                    ))
                  )}
                </div>
              )}

            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}


export default StaffStudentProfileModal;
