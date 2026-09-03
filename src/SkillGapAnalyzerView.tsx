import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from './config';
import { 
  BrainCircuit, Sparkles, CheckCircle2, AlertTriangle, BookOpen, 
  ExternalLink, Clock, Target, Plus, X, RefreshCw, Award, Code2, 
  Layers, ChevronRight, BarChart3
} from 'lucide-react';

const API = API_URL || '';

interface Posting {
  id: string;
  title: string;
  posting_type: string;
  company_name: string;
  required_skills: any[];
  mode: string;
  location: string;
  stipend_or_salary?: string;
  duration?: string;
  logo_url?: string;
}

interface MatchedSkill {
  skill: string;
  studentLevel: number;
  requiredLevel: number;
  matchPercentage?: number;
  source?: string;
}

interface GapSkill {
  skill: string;
  requiredLevel: number;
  currentLevel?: number;
  impact: number;
  severity?: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface MatchResult {
  score: number;
  skill_score?: number;
  cgpa_bonus?: number;
  leetcode_bonus?: number;
  matched: MatchedSkill[];
  gaps: GapSkill[];
  recommendations: {
    skill: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    resources: { title: string; platform: string; url: string; duration: string }[];
  }[];
  ai_insights?: {
    readiness_summary: string;
    estimated_prep_weeks: number;
    recommended_projects: string[];
    key_takeaway: string;
  };
}

interface SkillGapData {
  posting: Posting;
  analysis: MatchResult;
  studentSkills: { name: string; level: number; source?: string }[];
}

export default function SkillGapAnalyzerView({ token, user }: { token: string; user: any }) {
  const [postings, setPostings] = useState<Posting[]>([]);
  const [selectedPostingId, setSelectedPostingId] = useState<string>('');
  const [gapData, setGapData] = useState<SkillGapData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [skillDemand, setSkillDemand] = useState<{ skill: string; count: number }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [toast, setToast] = useState<string>('');

  // Quick Add Skill Modal state
  const [showAddSkillModal, setShowAddSkillModal] = useState<boolean>(false);
  const [newSkillName, setNewSkillName] = useState<string>('');
  const [newSkillLevel, setNewSkillLevel] = useState<string>('Intermediate');
  const [isAddingSkill, setIsAddingSkill] = useState<boolean>(false);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchPostings = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/postings`, { headers });
      if (res.ok) {
        const data: Posting[] = await res.json();
        setPostings(data);
        if (data.length > 0 && !selectedPostingId) {
          setSelectedPostingId(data[0].id);
        }
      } else {
        setErrorMsg('Failed to load active career postings.');
      }
    } catch (err) {
      console.error('Failed to fetch postings for skill analyzer', err);
      setErrorMsg('Network error fetching career opportunities.');
    }
  }, [headers, selectedPostingId]);

  const fetchDemand = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/admin/skill-demand`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSkillDemand(data);
      }
    } catch (_) {}
  }, [headers]);

  const analyzeGap = useCallback(async (pId: string) => {
    if (!pId) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API}/api/student/skill-gap/${pId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setGapData(data);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Unable to compute skill gap analysis.');
      }
    } catch (err) {
      console.error('Error fetching skill gap data', err);
      setErrorMsg('Error connecting to AI Skill Intelligence engine.');
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    fetchPostings();
    fetchDemand();
  }, []);

  useEffect(() => {
    if (selectedPostingId) {
      analyzeGap(selectedPostingId);
    }
  }, [selectedPostingId, analyzeGap]);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    setIsAddingSkill(true);
    try {
      const res = await fetch(`${API}/api/student/profile/skills`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          skill_name: newSkillName.trim(),
          level: newSkillLevel,
          category: 'Technical'
        })
      });
      if (res.ok) {
        showToast(`✓ Skill "${newSkillName}" successfully added to your profile!`);
        setShowAddSkillModal(false);
        setNewSkillName('');
        // Re-analyze immediately
        if (selectedPostingId) {
          analyzeGap(selectedPostingId);
        }
      } else {
        showToast('Failed to add skill. Please try again.');
      }
    } catch {
      showToast('Error communicating with server.');
    } finally {
      setIsAddingSkill(false);
    }
  };

  const levelLabel = (lvl: number) => {
    if (lvl <= 1) return 'Beginner';
    if (lvl === 2) return 'Intermediate';
    if (lvl === 3) return 'Advanced';
    if (lvl >= 4) return 'Expert';
    return 'Competent';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-zinc-900 pb-20 font-sans">
      {/* Toast alert */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-zinc-900 text-white rounded-full text-xs font-bold shadow-2xl border border-zinc-700 animate-bounce">
          {toast}
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-white border-b border-zinc-200/80 px-6 py-6 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <BrainCircuit size={22} />
              </div>
              <h1 className="text-xl font-black text-zinc-900 tracking-tight">
                AI Skill Gap & Career Intelligence
              </h1>
            </div>
            <p className="text-xs text-zinc-500 font-medium">
              Self-contained algorithmic comparative matching between your verified competencies and industry hiring standards
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddSkillModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={14} /> Add Skill to Profile
            </button>
            <div className="text-xs font-bold text-zinc-500 bg-zinc-50 border border-zinc-200 px-3.5 py-2 rounded-xl hidden sm:block">
              100% Native Algorithmic Engine
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-6 space-y-6">
        {/* Selector Bar */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <Target size={13} className="text-indigo-600" />
              <span>Target Industry Role / Benchmark Opportunity</span>
            </label>
            {postings.length === 0 ? (
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500 font-semibold">
                No active industry postings found. Please ask HR or Faculty to post opportunities.
              </div>
            ) : (
              <select
                value={selectedPostingId}
                onChange={e => setSelectedPostingId(e.target.value)}
                className="w-full bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
              >
                {postings.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {p.company_name} ({p.posting_type})
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={() => selectedPostingId && analyzeGap(selectedPostingId)}
            disabled={loading}
            className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer self-stretch md:self-auto justify-center"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Re-Analyze</span>
          </button>
        </div>

        {/* Error Alert if any */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center justify-between">
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => fetchPostings()} className="underline font-bold hover:text-rose-900 cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center shadow-xs">
            <div className="inline-block w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <div className="text-xs font-black text-zinc-800">Computing AI Skill Intelligence Matrix...</div>
            <p className="text-[11px] text-zinc-400 mt-1">Cross-referencing verified skills, portfolio projects, CGPA, and LeetCode problem solving</p>
          </div>
        )}

        {/* Main Content Grid */}
        {!loading && gapData && (
          <>
            {/* AI Executive Assessment Banner */}
            {gapData.analysis.ai_insights && (
              <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-indigo-800/50 space-y-6">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-indigo-800/60 pb-6">
                  <div className="space-y-1">
                    <span className="text-[11px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-400" />
                      <span>Executive Role Match Analysis</span>
                    </span>
                    <h2 className="text-lg md:text-xl font-black text-white">
                      {gapData.posting.title}
                    </h2>
                    <p className="text-xs text-indigo-200/80 font-medium">
                      {gapData.posting.company_name} · {gapData.posting.mode} · {gapData.posting.location}
                    </p>
                  </div>

                  {/* Compatibility Score Pill */}
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-indigo-300 uppercase block tracking-wider">Overall Match</span>
                      <span className="text-2xl font-black text-white">{gapData.analysis.score}%</span>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      gapData.analysis.score >= 75 ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse' :
                      gapData.analysis.score >= 55 ? 'bg-amber-400 shadow-lg shadow-amber-400/50' : 'bg-rose-400'
                    }`} />
                  </div>
                </div>

                {/* Score Breakdown Bars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-bold text-indigo-200">
                      <span>Core Skills Weight (75%)</span>
                      <span className="text-white font-black">{gapData.analysis.skill_score || 0} / 75</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${((gapData.analysis.skill_score || 0) / 75) * 100}%` }}
                        className="h-full bg-indigo-400 rounded-full transition-all duration-700"
                      />
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-bold text-indigo-200">
                      <span>Academic CGPA (15%)</span>
                      <span className="text-white font-black">{gapData.analysis.cgpa_bonus || 0} / 15</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${((gapData.analysis.cgpa_bonus || 0) / 15) * 100}%` }}
                        className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                      />
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-bold text-indigo-200">
                      <span>LeetCode & DSA (10%)</span>
                      <span className="text-white font-black">{gapData.analysis.leetcode_bonus || 0} / 10</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${((gapData.analysis.leetcode_bonus || 0) / 10) * 100}%` }}
                        className="h-full bg-amber-400 rounded-full transition-all duration-700"
                      />
                    </div>
                  </div>
                </div>

                {/* AI Executive Summary & Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                  <div className="md:col-span-3 bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block">
                      Readiness Summary
                    </span>
                    <p className="text-xs text-indigo-100 font-medium leading-relaxed">
                      {gapData.analysis.ai_insights.readiness_summary}
                    </p>
                    <div className="pt-2 border-t border-white/10 text-[11px] text-indigo-300 flex items-center gap-1.5 font-bold">
                      <span>💡 Strategy:</span>
                      <span className="text-white">{gapData.analysis.ai_insights.key_takeaway}</span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-center items-center text-center space-y-1">
                    <Clock size={20} className="text-amber-400 mb-1" />
                    <span className="text-[10px] font-bold text-indigo-300 uppercase">Est. Prep Time</span>
                    <span className="text-lg font-black text-white">
                      ~{gapData.analysis.ai_insights.estimated_prep_weeks} Weeks
                    </span>
                    <span className="text-[10px] text-indigo-200/70 font-semibold">To Target Role Readiness</span>
                  </div>
                </div>
              </div>
            )}

            {/* Matched vs Gap Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Matched Skills */}
              <div className="bg-white border border-emerald-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-800">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Matched Competencies ({gapData.analysis.matched.length})</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Verified Fit
                  </span>
                </div>

                {gapData.analysis.matched.length === 0 ? (
                  <div className="p-6 bg-zinc-50 rounded-xl text-center space-y-2">
                    <p className="text-xs text-zinc-500 font-semibold">No direct skills matched yet.</p>
                    <button
                      onClick={() => setShowAddSkillModal(true)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                    >
                      + Add your technical skills to improve this score
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {gapData.analysis.matched.map((m, i) => (
                      <div
                        key={i}
                        className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100/80 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                            <span>{m.skill}</span>
                            {m.source && (
                              <span className="text-[9px] font-semibold text-zinc-400 bg-white px-1.5 py-0.2 rounded border border-zinc-200">
                                {m.source}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-500 font-medium">
                            Your Level: {levelLabel(m.studentLevel)} (Req: {levelLabel(m.requiredLevel)})
                          </span>
                        </div>
                        <span className="text-xs font-black text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                          {m.matchPercentage || 100}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Missing Skill Gaps */}
              <div className="bg-white border border-amber-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-900">
                    <AlertTriangle size={16} className="text-amber-600" />
                    <span>Identified Skill Gaps ({gapData.analysis.gaps.length})</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Bridge Focus
                  </span>
                </div>

                {gapData.analysis.gaps.length === 0 ? (
                  <div className="p-6 bg-emerald-50 rounded-xl text-center">
                    <p className="text-xs font-black text-emerald-800">
                      🎉 Perfect Skill Alignment! You satisfy all mandated competencies for this role.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {gapData.analysis.gaps.map((g, i) => (
                      <div
                        key={i}
                        className="p-3 bg-amber-50/40 rounded-xl border border-amber-100 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-xs text-zinc-900">{g.skill}</div>
                          <span className="text-[10px] text-zinc-500 font-medium">
                            Target Requirement: {levelLabel(g.requiredLevel)} · Impact: {(g.impact * 100).toFixed(0)}%
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-black px-2 py-1 rounded-md border uppercase ${
                            g.severity === 'HIGH'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {g.severity || 'MEDIUM'} Priority
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* AI Recommended Portfolio Bridge Projects */}
            {gapData.analysis.ai_insights?.recommended_projects && gapData.analysis.ai_insights.recommended_projects.length > 0 && (
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <Code2 size={18} className="text-indigo-600" />
                  <h3 className="text-sm font-black text-zinc-900">
                    Recommended Hands-On Portfolio Projects
                  </h3>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Building these portfolio projects will directly demonstrate your competence in missing prerequisite areas
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  {gapData.analysis.ai_insights.recommended_projects.map((proj, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200 w-fit block">
                          Project #{idx + 1}
                        </span>
                        <p className="text-xs font-semibold text-zinc-800 leading-snug">{proj}</p>
                      </div>
                      <div className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                        <span>Showcases skill integration</span>
                        <ChevronRight size={12} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Curated Self-Paced Learning Resources */}
            {gapData.analysis.recommendations.length > 0 && (
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-indigo-600" />
                  <h3 className="text-sm font-black text-zinc-900">
                    Curated Learning Roadmaps & Resources
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gapData.analysis.recommendations.map((rec, i) => (
                    <div key={i} className="bg-zinc-50/80 border border-zinc-200 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-zinc-900">{rec.skill}</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${
                            rec.priority === 'HIGH'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {rec.priority} Priority
                        </span>
                      </div>

                      <div className="space-y-2">
                        {rec.resources.map((res, j) => (
                          <a
                            key={j}
                            href={res.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block bg-white border border-zinc-200 hover:border-indigo-400 rounded-xl p-3 transition-all group shadow-2xs"
                          >
                            <div className="text-xs font-bold text-indigo-600 group-hover:text-indigo-800 flex items-center gap-1 mb-1">
                              <span>🔗</span> {res.title}
                              <ExternalLink size={11} className="opacity-60" />
                            </div>
                            <div className="flex justify-between text-[10px] text-zinc-400 font-semibold">
                              <span>Platform: {res.platform}</span>
                              <span>⏱ {res.duration}</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* High-Demand Industry Skills Sidebar / Bottom Widget */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-600" />
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider">
                High-Demand Industry Skills
              </h3>
            </div>
            <span className="text-[10px] font-bold text-zinc-400">Aggregated from active corporate postings</span>
          </div>

          {skillDemand.length === 0 ? (
            <p className="text-xs text-zinc-400 py-2">Loading demand benchmarks...</p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {skillDemand.map((sd, i) => (
                <div
                  key={i}
                  className="bg-indigo-50/60 border border-indigo-100 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-800 flex items-center gap-2"
                >
                  <span>{sd.skill}</span>
                  <span className="bg-white text-indigo-700 text-[10px] font-black px-1.5 py-0.2 rounded-md border border-indigo-200">
                    {sd.count} Postings
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Quick Add Skill */}
      {showAddSkillModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                <Plus className="text-indigo-600" size={16} />
                <span>Add Skill to Your Profile</span>
              </h3>
              <button
                onClick={() => setShowAddSkillModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSkill} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase block mb-1">
                  Skill Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. React, Docker, Python, SQL..."
                  className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-800 outline-none focus:border-indigo-500"
                  value={newSkillName}
                  onChange={e => setNewSkillName(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase block mb-1">
                  Proficiency Level
                </label>
                <select
                  className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-800 outline-none focus:border-indigo-500 cursor-pointer"
                  value={newSkillLevel}
                  onChange={e => setNewSkillLevel(e.target.value)}
                >
                  <option value="Beginner">Beginner (Foundational)</option>
                  <option value="Intermediate">Intermediate (Project Experience)</option>
                  <option value="Advanced">Advanced (Production / In-depth)</option>
                  <option value="Expert">Expert (Architecture / Mastery)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSkillModal(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingSkill}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isAddingSkill ? 'Adding...' : 'Add Skill & Re-Analyze'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
