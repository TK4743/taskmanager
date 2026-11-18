import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Mail, Phone, BookOpen, GraduationCap, Building2,
  Trophy, Award, Code, Github, Linkedin, Globe, Edit3, Save,
  X, Check, AlertTriangle, ExternalLink, Download, FileText,
  Clock, CheckCircle2, XCircle, Share2, Copy, Sparkles,
  Camera, Upload, Eye, Activity, ShieldCheck, ChevronRight,
  Layers, Briefcase, Loader2, Trash2, Shield, Send, Plus
} from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { API_URL } from '../../config';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { getStudentRegisterNumber, getOptimizedImgUrl } from '../../components/common/helpers';
import type { User as UserType, ToastType } from '../../types';

export function StudentProfileView({
  user,
  token,
  addToast,
  telegramStats,
  onOpenTelegramModal
}: {
  user: UserType | null;
  token: string | null;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  telegramStats?: any;
  onOpenTelegramModal?: () => void;
}) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('personal');

  // Form states for Personal & Avatar Photo
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [semester, setSemester] = useState<number>(1);
  const [cgpa, setCgpa] = useState<number | string>(0);
  const [currentArrears, setCurrentArrears] = useState<number>(0);
  const [historyOfArrears, setHistoryOfArrears] = useState<number>(0);
  const [aboutMe, setAboutMe] = useState('');
  const [savingPersonal, setSavingPersonal] = useState(false);

  // Form states for Skills
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);

  // Form states for Projects
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjTech, setNewProjTech] = useState('');
  const [newProjGithub, setNewProjGithub] = useState('');
  const [newProjDemo, setNewProjDemo] = useState('');
  const [addingProject, setAddingProject] = useState(false);

  // Form states for Internships
  const [newInternCompany, setNewInternCompany] = useState('');
  const [newInternRole, setNewInternRole] = useState('');
  const [newInternDuration, setNewInternDuration] = useState('');
  const [newInternMode, setNewInternMode] = useState('');
  const [newInternCertUrl, setNewInternCertUrl] = useState('');
  const [addingInternship, setAddingInternship] = useState(false);

  // Form states for Certifications
  const [newCertName, setNewCertName] = useState('');
  const [newCertProvider, setNewCertProvider] = useState('');
  const [newCertIssueDate, setNewCertIssueDate] = useState('');
  const [newCertCredentialId, setNewCertCredentialId] = useState('');
  const [newCertUrl, setNewCertUrl] = useState('');
  const [addingCert, setAddingCert] = useState(false);

  // Form states for Coding Profiles
  const [codingGithub, setCodingGithub] = useState('');
  const [codingLeetcode, setCodingLeetcode] = useState('');
  const [codingGfg, setCodingGfg] = useState('');
  const [codingLinkedin, setCodingLinkedin] = useState('');
  const [codingPortfolio, setCodingPortfolio] = useState('');
  const [savingCoding, setSavingCoding] = useState(false);

  // Form states for Achievements
  const [newAchTitle, setNewAchTitle] = useState('');
  const [newAchCategory, setNewAchCategory] = useState('');
  const [newAchDesc, setNewAchDesc] = useState('');
  const [newAchDate, setNewAchDate] = useState('');
  const [addingAch, setAddingAch] = useState(false);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/student/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        if (data.academic && data.academic.avatar_url) {
          setAvatarUrl(data.academic.avatar_url);
        }
        if (data.personal) {
          setMobileNumber(data.personal.mobile_number || '');
          setDateOfBirth(data.personal.date_of_birth || '');
          setSemester(data.personal.semester || 1);
          setCgpa(data.personal.cgpa || 0);
          setCurrentArrears(data.personal.current_arrears || 0);
          setHistoryOfArrears(data.personal.history_of_arrears || 0);
          setAboutMe(data.personal.about_me || '');
        }
        if (data.coding_profiles) {
          setCodingGithub(data.coding_profiles.github || '');
          setCodingLeetcode(data.coding_profiles.leetcode || '');
          setCodingGfg(data.coding_profiles.geeksforgeeks || '');
          setCodingLinkedin(data.coding_profiles.linkedin || '');
          setCodingPortfolio(data.coding_profiles.portfolio || '');
        }
      }
    } catch (e) {
      addToast('Error loading profile data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchProfileData();
  }, [token]);

  // Avatar Photo Handlers
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      const res = await fetch(`${API_URL}/api/student/profile/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setAvatarUrl(data.avatar_url);
        addToast('Profile photo updated successfully!', 'success');
        fetchProfileData();
      } else {
        addToast(data.error || 'Failed to upload photo', 'error');
      }
    } catch {
      addToast('Error uploading photo', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarUrlSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingAvatar(true);
    try {
      const res = await fetch(`${API_URL}/api/student/profile/avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatar_url: avatarUrl })
      });
      if (res.ok) {
        addToast('Profile photo URL saved!', 'success');
        fetchProfileData();
      }
    } catch {
      addToast('Error saving photo URL', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const res = await fetch(`${API_URL}/api/student/profile/avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ remove: true })
      });
      if (res.ok) {
        setAvatarUrl('');
        addToast('Profile photo removed', 'info');
        fetchProfileData();
      }
    } catch {
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Submit Handlers
  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPersonal(true);
    try {
      const res = await fetch(`${API_URL}/api/student/profile/personal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          mobile_number: mobileNumber,
          date_of_birth: dateOfBirth,
          semester: Number(semester),
          cgpa: Number(cgpa),
          current_arrears: Number(currentArrears),
          history_of_arrears: Number(historyOfArrears),
          about_me: aboutMe
        })
      });
      if (res.ok) {
        addToast('Personal information updated!', 'success');
        fetchProfileData();
      } else {
        addToast('Failed to update personal info', 'error');
      }
    } catch {
      addToast('Network error saving personal details', 'error');
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    if (!newSkillCategory) {
      addToast('Please select a skill category', 'error');
      return;
    }
    if (!newSkillLevel) {
      addToast('Please select a proficiency level', 'error');
      return;
    }
    setAddingSkill(true);
    try {
      const res = await fetch(`${API_URL}/api/student/profile/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ skill_name: newSkillName, category: newSkillCategory, level: newSkillLevel })
      });
      if (res.ok) {
        addToast('Skill added!', 'success');
        setNewSkillName('');
        fetchProfileData();
      }
    } catch {
      addToast('Failed to add skill', 'error');
    } finally {
      setAddingSkill(false);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/student/profile/skills/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Skill removed', 'info');
        fetchProfileData();
      }
    } catch { }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    setAddingProject(true);
    try {
      const res = await fetch(`${API_URL}/api/student/profile/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          project_name: newProjName,
          description: newProjDesc,
          tech_stack: newProjTech,
          github_url: newProjGithub,
          live_demo_url: newProjDemo
        })
      });
      if (res.ok) {
        addToast('Project added!', 'success');
        setNewProjName(''); setNewProjDesc(''); setNewProjTech(''); setNewProjGithub(''); setNewProjDemo('');
        fetchProfileData();
      }
    } catch {
      addToast('Failed to add project', 'error');
    } finally {
      setAddingProject(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/student/profile/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast('Project removed', 'info');
      fetchProfileData();
    } catch { }
  };

  const handleAddInternship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInternCompany.trim()) return;
    if (!newInternMode) {
      addToast('Please select a work mode (Offline, Online, or Hybrid)', 'error');
      return;
    }
    setAddingInternship(true);
    try {
      const res = await fetch(`${API_URL}/api/student/profile/internships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          company: newInternCompany,
          role: newInternRole,
          duration: newInternDuration,
          mode: newInternMode,
          certificate_url: newInternCertUrl
        })
      });
      if (res.ok) {
        addToast('Internship added!', 'success');
        setNewInternCompany(''); setNewInternRole(''); setNewInternDuration(''); setNewInternCertUrl('');
        fetchProfileData();
      }
    } catch {
      addToast('Failed to add internship', 'error');
    } finally {
      setAddingInternship(false);
    }
  };

  const handleDeleteInternship = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/student/profile/internships/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast('Internship removed', 'info');
      fetchProfileData();
    } catch { }
  };

  const handleAddCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCertName.trim()) return;
    setAddingCert(true);
    try {
      const res = await fetch(`${API_URL}/api/student/profile/certifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          certificate_name: newCertName,
          provider: newCertProvider,
          issue_date: newCertIssueDate,
          credential_id: newCertCredentialId,
          certificate_url: newCertUrl
        })
      });
      if (res.ok) {
        addToast('Certification added!', 'success');
        setNewCertName(''); setNewCertProvider(''); setNewCertIssueDate(''); setNewCertCredentialId(''); setNewCertUrl('');
        fetchProfileData();
      }
    } catch {
      addToast('Failed to add certification', 'error');
    } finally {
      setAddingCert(false);
    }
  };

  const handleDeleteCert = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/student/profile/certifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast('Certification removed', 'info');
      fetchProfileData();
    } catch { }
  };

  const handleSaveCodingProfiles = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCoding(true);
    try {
      const res = await fetch(`${API_URL}/api/student/profile/coding-profiles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          github: codingGithub,
          leetcode: codingLeetcode,
          geeksforgeeks: codingGfg,
          linkedin: codingLinkedin,
          portfolio: codingPortfolio
        })
      });
      if (res.ok) {
        addToast('Coding profiles saved!', 'success');
        fetchProfileData();
      }
    } catch {
      addToast('Failed to save coding profiles', 'error');
    } finally {
      setSavingCoding(false);
    }
  };

  const handleAddAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAchTitle.trim()) return;
    if (!newAchCategory) {
      addToast('Please select an achievement category', 'error');
      return;
    }
    setAddingAch(true);
    try {
      const res = await fetch(`${API_URL}/api/student/profile/achievements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: newAchTitle,
          category: newAchCategory,
          description: newAchDesc,
          event_date: newAchDate
        })
      });
      if (res.ok) {
        addToast('Achievement added!', 'success');
        setNewAchTitle(''); setNewAchDesc(''); setNewAchDate('');
        fetchProfileData();
      }
    } catch {
      addToast('Failed to add achievement', 'error');
    } finally {
      setAddingAch(false);
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/student/profile/achievements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast('Achievement removed', 'info');
      fetchProfileData();
    } catch { }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="space-y-6">
          <Card className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <Skeleton className="w-24 h-24 rounded-full shrink-0" />
              <div className="space-y-3 flex-1 text-center sm:text-left w-full">
                <Skeleton className="h-6 w-48 mx-auto sm:mx-0 rounded-lg" />
                <Skeleton className="h-4 w-32 mx-auto sm:mx-0 rounded-md" />
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>
            </div>
          </Card>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-10 w-36 rounded-xl shrink-0" />
            ))}
          </div>
          <Card className="p-6 md:p-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const sections = [
    { id: 'personal', label: '1. Personal Information', icon: User },
    { id: 'skills', label: '2. Skills', icon: Code },
    { id: 'projects', label: '3. Projects', icon: Layers },
    { id: 'internships', label: '4. Internships', icon: Briefcase },
    { id: 'certifications', label: '5. Certifications', icon: Award },
    { id: 'coding', label: '6. Coding Profiles', icon: Globe },
    { id: 'achievements', label: '7. Achievements', icon: Sparkles },
  ];

  const acad = {
    full_name: profile?.academic?.full_name || user?.full_name || 'N/A',
    register_number: profile?.academic?.register_number || user?.register_number || user?.username || 'N/A',
    email: profile?.academic?.email || user?.email || 'N/A',
    department_name: profile?.academic?.department_name || user?.department_name || 'Information Technology',
    class_name: profile?.academic?.class_name || user?.class_name || 'Unassigned Section',
    batch: profile?.academic?.batch || user?.batch || '2023 - 2027',
    year: profile?.academic?.year ? (String(profile.academic.year).startsWith('Year') ? profile.academic.year : `Year ${profile.academic.year}`) : (user?.year ? `Year ${user.year}` : 'N/A'),
    gender: profile?.academic?.gender || user?.gender || 'Not Specified',
    avatar_url: profile?.academic?.avatar_url || user?.avatar_url || ''
  };

  return (
    <PageLayout>
      <div className="space-y-6 pb-12">
        {/* Title & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2.5">
              <GraduationCap size={28} className="text-indigo-600 shrink-0" />
              <span>Student Academic Profile</span>
            </h1>
            <p className="text-xs text-zinc-500 font-semibold mt-0.5">
              Official records for {acad.full_name} ({acad.register_number})
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              if (profile) {
                const { downloadStudentResumePdf } = await import('../../utils/pdf/studentProfilePdfGenerator');
                await downloadStudentResumePdf(profile);
                addToast('Downloading your Profile Resume (PDF)...', 'success');
              } else {
                addToast('Profile data is still loading, please wait...', 'info');
              }
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
            title="Download your profile formatted as a professional resume PDF"
          >
            <Download size={14} />
            <span>Download Resume (PDF)</span>
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-2 custom-scrollbar">
          {sections.map(s => {
            const SIcon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 shrink-0 cursor-pointer",
                  activeSection === s.id
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200"
                )}
              >
                <SIcon size={14} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* 1. PERSONAL INFORMATION */}
        {activeSection === 'personal' && (
          <div className="space-y-6">
            {/* Student Profile Photo Card */}
            <Card className="p-5 md:p-6 bg-white border-zinc-200">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                  <Camera size={16} className="text-indigo-600" /> Student Profile Photo
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Photo Display Avatar */}
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 rounded-2xl bg-zinc-900 p-1 shadow-md border border-zinc-200 flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={acad.full_name || 'Profile'} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-black">
                        {(acad.full_name || 'ST').substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload & URL Controls */}
                <div className="space-y-3 flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="cursor-pointer px-4 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all flex items-center gap-2">
                      {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      <span>Upload Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileUpload}
                        disabled={uploadingAvatar}
                        className="hidden"
                      />
                    </label>

                    {avatarUrl && (
                      <Button type="button" onClick={handleRemoveAvatar} disabled={uploadingAvatar} variant="secondary" className="text-xs text-red-600 hover:text-red-700">
                        <Trash2 size={14} /> Remove Photo
                      </Button>
                    )}
                  </div>

                  <form onSubmit={handleAvatarUrlSave} className="flex gap-2">
                    <Input
                      type="url"
                      placeholder="Direct HTTPS image resource URL (https://...)"
                      value={avatarUrl}
                      onChange={e => setAvatarUrl(e.target.value)}
                      className="text-xs flex-1"
                    />
                    <Button type="submit" disabled={uploadingAvatar} variant="secondary" className="text-xs shrink-0">
                      <Save size={14} /> Save Link
                    </Button>
                  </form>
                </div>
              </div>
            </Card>

            {/* Read Only Academic Info */}
            <Card className="p-5 md:p-6 bg-white border-zinc-200">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                  <Shield size={16} className="text-indigo-600" /> Read-Only Academic Identity
                </h3>
                <span className="text-[11px] text-zinc-400 font-semibold flex items-center gap-1">
                  <Lock size={12} /> Institutional Record
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Full Name</p>
                  <p className="text-sm font-bold text-zinc-900 truncate">{acad.full_name}</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Register Number</p>
                  <p className="text-sm font-bold text-zinc-900 truncate">{acad.register_number}</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">College Email</p>
                  <p className="text-sm font-bold text-zinc-900 truncate">{acad.email}</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Department</p>
                  <p className="text-sm font-bold text-zinc-900 truncate">{acad.department_name}</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Section</p>
                  <p className="text-sm font-bold text-zinc-900 truncate">{acad.class_name}</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Batch</p>
                  <p className="text-sm font-bold text-zinc-900 truncate">{acad.batch}</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Year</p>
                  <p className="text-sm font-bold text-zinc-900 truncate">{acad.year}</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Gender</p>
                  <p className="text-sm font-bold text-zinc-900 truncate">{acad.gender}</p>
                </div>
              </div>
            </Card>

            {/* Telegram Notification Alerts Card */}
            <Card className="p-5 md:p-6 bg-gradient-to-br from-sky-50/80 via-indigo-50/40 to-white border-sky-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-sky-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
                    <Send size={20} className="-rotate-12" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                      Telegram 1-to-1 Deadline Alerts
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Automated task reminders 24 hours before deadlines & instant live coding progress cards.
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 border self-start sm:self-auto",
                  (user?.telegram_chat_id || profile?.academic?.telegram_chat_id || telegramStats?.currentUserLinked)
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : "bg-amber-100 text-amber-800 border-amber-200"
                )}>
                  {(user?.telegram_chat_id || profile?.academic?.telegram_chat_id || telegramStats?.currentUserLinked) ? '🟢 Connected' : '⚡ Not Linked'}
                </span>
              </div>

              {(user?.telegram_chat_id || profile?.academic?.telegram_chat_id || telegramStats?.currentUserLinked) ? (
                <div className="p-3.5 bg-emerald-50/90 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-xs text-emerald-950 font-medium">
                    <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      Active Telegram Alert Connection
                    </p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Bot: <b>@{telegramStats?.botUsername || 'IT_TaskManager_Alerts_bot'}</b> {user?.telegram_username ? `(@${user.telegram_username})` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenTelegramModal ? onOpenTelegramModal() : null}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all shrink-0"
                  >
                    Manage Telegram Connection
                  </button>
                </div>
              ) : (() => {
                const effectiveRegNo = getStudentRegisterNumber(user, profile) || acad.register_number;
                return (
                  <div className="space-y-3">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-sky-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-zinc-700 shrink-0">Command:</span>
                        <code className="bg-zinc-100 text-indigo-700 font-mono font-bold px-2 py-0.5 rounded text-xs border border-zinc-200 truncate">
                          /link {effectiveRegNo}
                        </code>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <a
                          href="https://t.me/it_taskmanager"
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                        >
                          <Send size={13} className="text-sky-500" /> Join Group
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`/link ${effectiveRegNo}`);
                            addToast(`Copied "/link ${effectiveRegNo}" to clipboard! Reply this to @${telegramStats?.botUsername || 'IT_TaskManager_Alerts_bot'} on Telegram.`, 'success');
                          }}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                        >
                          <Copy size={13} /> Copy Command
                        </button>
                        <a
                          href={`https://t.me/${telegramStats?.botUsername || 'IT_TaskManager_Alerts_bot'}?start=${encodeURIComponent(effectiveRegNo)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-1.5 bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-lg text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 shrink-0"
                        >
                          <Send size={13} className="-rotate-12" /> 1-Click Auto-Link
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </Card>

            {/* Editable Personal Form */}
            <Card className="p-5 md:p-6 bg-white border-zinc-200">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                  <Edit3 size={16} className="text-indigo-600" /> Editable Personal Information
                </h3>
              </div>

              <form onSubmit={handleSavePersonal} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Mobile Number</label>
                    <Input
                      type="tel"
                      value={mobileNumber}
                      onChange={e => setMobileNumber(e.target.value)}
                      placeholder="Contact telephone number (e.g. +91 9876543210)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Date of Birth</label>
                    <Input
                      type="date"
                      value={dateOfBirth}
                      onChange={e => setDateOfBirth(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Semester</label>
                    <Select value={semester} onChange={e => setSemester(Number(e.target.value))}>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">CGPA</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={cgpa}
                      onChange={e => setCgpa(e.target.value)}
                      placeholder="Cumulative Grade Point Average (e.g. 8.50)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Current Arrears</label>
                    <Input
                      type="number"
                      min="0"
                      value={currentArrears}
                      onChange={e => setCurrentArrears(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">History of Arrears</label>
                    <Input
                      type="number"
                      min="0"
                      value={historyOfArrears}
                      onChange={e => setHistoryOfArrears(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">About Me</label>
                  <Textarea
                    value={aboutMe}
                    onChange={e => setAboutMe(e.target.value)}
                    placeholder="Executive summary of academic specialization, technical proficiencies, and career objectives..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={savingPersonal} variant="primary" className="px-6">
                    {savingPersonal ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    <span>Save Personal Information</span>
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* 2. SKILLS */}
        {activeSection === 'skills' && (
          <Card className="p-5 md:p-6 bg-white border-zinc-200">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Code size={16} className="text-indigo-600" /> Technical & Soft Skills
            </h3>

            {/* Add Skill Form */}
            <form onSubmit={handleAddSkill} className="flex flex-col sm:flex-row gap-3 mb-6 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <Input
                type="text"
                placeholder="Competency designation (e.g. Distributed Systems, PostgreSQL, React)"
                value={newSkillName}
                onChange={e => setNewSkillName(e.target.value)}
                required
                className="flex-1"
              />
              <Select value={newSkillCategory} onChange={e => setNewSkillCategory(e.target.value)} className="sm:w-44" required>
                <option value="" disabled>Select Category</option>
                <option value="Technical">Technical</option>
                <option value="Soft Skill">Soft Skill</option>
                <option value="Tool">Tool</option>
                <option value="Domain">Domain</option>
              </Select>
              <Select value={newSkillLevel} onChange={e => setNewSkillLevel(e.target.value)} className="sm:w-44" required>
                <option value="" disabled>Select Level</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </Select>
              <Button type="submit" disabled={addingSkill} variant="primary" className="shrink-0">
                {addingSkill ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                <span>Add Skill</span>
              </Button>
            </form>

            {/* Skills Pills List */}
            <div className="flex flex-wrap gap-2">
              {(profile?.skills || []).length === 0 ? (
                <p className="text-xs text-zinc-400 py-4">No skills added yet.</p>
              ) : (
                profile.skills.map((sk: any) => (
                  <div key={sk.id} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900">
                    <span>{sk.skill_name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700 font-bold uppercase">{sk.level}</span>
                    <button type="button" onClick={() => handleDeleteSkill(sk.id)} className="text-zinc-400 hover:text-red-600 transition-colors ml-1">
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* 3. PROJECTS */}
        {activeSection === 'projects' && (
          <Card className="p-5 md:p-6 bg-white border-zinc-200 space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-indigo-600" /> Academic & Personal Projects
            </h3>

            <form onSubmit={handleAddProject} className="space-y-3 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Enterprise / Academic Project Title *" value={newProjName} onChange={e => setNewProjName(e.target.value)} required />
                <Input placeholder="Technology Stack & Tools (e.g. React, Node.js, PostgreSQL)" value={newProjTech} onChange={e => setNewProjTech(e.target.value)} />
                <Input type="url" placeholder="GitHub Repository Source URL (https://github.com/...)" value={newProjGithub} onChange={e => setNewProjGithub(e.target.value)} />
                <Input type="url" placeholder="Production / Live Demo URL (https://...)" value={newProjDemo} onChange={e => setNewProjDemo(e.target.value)} />
              </div>
              <Textarea placeholder="Comprehensive project overview, problem statement, and key architectural contributions..." value={newProjDesc} onChange={e => setNewProjDesc(e.target.value)} rows={2} />
              <div className="flex justify-end">
                <Button type="submit" disabled={addingProject} variant="primary">
                  {addingProject ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  <span>Add Project</span>
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              {(profile?.projects || []).length === 0 ? (
                <p className="text-xs text-zinc-400 py-4 text-center">No projects added yet.</p>
              ) : (
                profile.projects.map((p: any) => (
                  <div key={p.id} className="p-4 bg-white border border-zinc-200 rounded-xl flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-sm font-bold text-zinc-900">{p.project_name}</h4>
                      {p.tech_stack && <p className="text-xs font-semibold text-indigo-600">{p.tech_stack}</p>}
                      {p.description && <p className="text-xs text-zinc-600">{p.description}</p>}
                      <div className="flex gap-3 pt-1 text-xs">
                        {p.github_url && <a href={p.github_url} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline flex items-center gap-1"><Github size={12} /> GitHub</a>}
                        {p.live_demo_url && <a href={p.live_demo_url} target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline flex items-center gap-1"><Globe size={12} /> Live Demo</a>}
                      </div>
                    </div>
                    <button type="button" onClick={() => handleDeleteProject(p.id)} className="text-zinc-400 hover:text-red-600 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* 4. INTERNSHIPS */}
        {activeSection === 'internships' && (
          <Card className="p-5 md:p-6 bg-white border-zinc-200 space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Briefcase size={16} className="text-indigo-600" /> Internship & Work Experience
            </h3>

            <form onSubmit={handleAddInternship} className="space-y-3 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <Input placeholder="Organization / Corporate Entity *" value={newInternCompany} onChange={e => setNewInternCompany(e.target.value)} required />
                <Input placeholder="Designation (e.g. Software Engineering Intern)" value={newInternRole} onChange={e => setNewInternRole(e.target.value)} />
                <Input placeholder="Engagement Timeline (e.g. June 2025 – August 2025)" value={newInternDuration} onChange={e => setNewInternDuration(e.target.value)} />
                <Select value={newInternMode} onChange={e => setNewInternMode(e.target.value)} required>
                  <option value="" disabled>Select Work Mode</option>
                  <option value="Offline">Offline / On-site</option>
                  <option value="Online">Online / Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </Select>
                <Input type="url" placeholder="Verified Credential Verification Link / URL" value={newInternCertUrl} onChange={e => setNewInternCertUrl(e.target.value)} className="sm:col-span-2" />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={addingInternship} variant="primary">
                  {addingInternship ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  <span>Add Internship</span>
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              {(profile?.internships || []).length === 0 ? (
                <p className="text-xs text-zinc-400 py-4 text-center">No internships added yet.</p>
              ) : (
                profile.internships.map((intern: any) => (
                  <div key={intern.id} className="p-4 bg-white border border-zinc-200 rounded-xl flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">{intern.company}</h4>
                      <p className="text-xs font-semibold text-zinc-600">{intern.role} • {intern.duration} ({intern.mode})</p>
                      {intern.certificate_url && (
                        <a href={intern.certificate_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 mt-1">
                          <ExternalLink size={12} /> View Certificate
                        </a>
                      )}
                    </div>
                    <button type="button" onClick={() => handleDeleteInternship(intern.id)} className="text-zinc-400 hover:text-red-600 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* 5. CERTIFICATIONS */}
        {activeSection === 'certifications' && (
          <Card className="p-5 md:p-6 bg-white border-zinc-200 space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Award size={16} className="text-indigo-600" /> Certifications & Courses
            </h3>

            <form onSubmit={handleAddCertification} className="space-y-3 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Professional Certification Title *" value={newCertName} onChange={e => setNewCertName(e.target.value)} required />
                <Input placeholder="Accrediting Body (e.g. AWS, NPTEL, Coursera, Google)" value={newCertProvider} onChange={e => setNewCertProvider(e.target.value)} />
                <Input type="date" placeholder="Issue Date" value={newCertIssueDate} onChange={e => setNewCertIssueDate(e.target.value)} />
                <Input placeholder="Official Credential / License ID" value={newCertCredentialId} onChange={e => setNewCertCredentialId(e.target.value)} />
                <Input type="url" placeholder="Public Credential Verification URL (https://...)" value={newCertUrl} onChange={e => setNewCertUrl(e.target.value)} className="sm:col-span-2" />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={addingCert} variant="primary">
                  {addingCert ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  <span>Add Certification</span>
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              {(profile?.certifications || []).length === 0 ? (
                <p className="text-xs text-zinc-400 py-4 text-center">No certifications added yet.</p>
              ) : (
                profile.certifications.map((c: any) => (
                  <div key={c.id} className="p-4 bg-white border border-zinc-200 rounded-xl flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">{c.certificate_name}</h4>
                      <p className="text-xs font-semibold text-zinc-600">{c.provider} {c.issue_date ? `• Issued ${c.issue_date}` : ''}</p>
                      {c.credential_id && <p className="text-[11px] text-zinc-400">Credential ID: {c.credential_id}</p>}
                      {c.certificate_url && (
                        <a href={c.certificate_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 mt-1">
                          <ExternalLink size={12} /> View Credential
                        </a>
                      )}
                    </div>
                    <button type="button" onClick={() => handleDeleteCert(c.id)} className="text-zinc-400 hover:text-red-600 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* 6. CODING PROFILES */}
        {activeSection === 'coding' && (
          <Card className="p-5 md:p-6 bg-white border-zinc-200">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe size={16} className="text-indigo-600" /> Coding & Professional Profiles
            </h3>

            <form onSubmit={handleSaveCodingProfiles} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">GitHub</label>
                  <Input type="url" placeholder="https://github.com/username" value={codingGithub} onChange={e => setCodingGithub(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">LeetCode</label>
                  <Input type="url" placeholder="https://leetcode.com/username" value={codingLeetcode} onChange={e => setCodingLeetcode(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">GeeksforGeeks</label>
                  <Input type="url" placeholder="https://geeksforgeeks.org/user/username" value={codingGfg} onChange={e => setCodingGfg(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">LinkedIn</label>
                  <Input type="url" placeholder="https://linkedin.com/in/username" value={codingLinkedin} onChange={e => setCodingLinkedin(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Personal Portfolio / Website</label>
                  <Input type="url" placeholder="https://yourportfolio.com" value={codingPortfolio} onChange={e => setCodingPortfolio(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={savingCoding} variant="primary" className="px-6">
                  {savingCoding ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Save Coding Profiles</span>
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* 7. ACHIEVEMENTS */}
        {activeSection === 'achievements' && (
          <Card className="p-5 md:p-6 bg-white border-zinc-200 space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-600" /> Honors, Hackathons & Achievements
            </h3>

            <form onSubmit={handleAddAchievement} className="space-y-3 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input placeholder="Honors / Competition / Event Title *" value={newAchTitle} onChange={e => setNewAchTitle(e.target.value)} required className="sm:col-span-2" />
                <Select value={newAchCategory} onChange={e => setNewAchCategory(e.target.value)} required>
                  <option value="" disabled>Select Category</option>
                  <option value="Hackathons">Hackathons</option>
                  <option value="National Hackathons">National Hackathons</option>
                  <option value="Coding Competitions">Coding Competitions</option>
                  <option value="Paper Presentations">Paper Presentations</option>
                  <option value="Awards">Awards & Honors</option>
                </Select>
                <Input placeholder="Recognition Period (e.g. February 2026)" value={newAchDate} onChange={e => setNewAchDate(e.target.value)} />
              </div>
              <Textarea placeholder="Comprehensive description of recognition, award criteria, or competitive ranking..." value={newAchDesc} onChange={e => setNewAchDesc(e.target.value)} rows={2} />
              <div className="flex justify-end">
                <Button type="submit" disabled={addingAch} variant="primary">
                  {addingAch ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  <span>Add Achievement</span>
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              {(profile?.achievements || []).length === 0 ? (
                <p className="text-xs text-zinc-400 py-4 text-center">No achievements added yet.</p>
              ) : (
                profile.achievements.map((ach: any) => (
                  <div key={ach.id} className="p-4 bg-white border border-zinc-200 rounded-xl flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-zinc-900">{ach.title}</h4>
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-extrabold uppercase">{ach.category}</span>
                      </div>
                      {ach.event_date && <p className="text-[11px] text-zinc-400">{ach.event_date}</p>}
                      {ach.description && <p className="text-xs text-zinc-600 mt-1">{ach.description}</p>}
                    </div>
                    <button type="button" onClick={() => handleDeleteAchievement(ach.id)} className="text-zinc-400 hover:text-red-600 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

      </div>
    </PageLayout>
  );
}


export default StudentProfileView;
