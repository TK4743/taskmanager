import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from './config';
import { 
  BarChart3, Sparkles, AlertTriangle, CheckCircle2, TrendingUp, 
  Layers, Filter, Search, Download, ShieldCheck, ArrowUpRight, 
  Activity, RefreshCw, BookOpen, Users, Award, Building2, Zap
} from 'lucide-react';

const API = API_URL || '';

export const INDUSTRY_SECTORS = [
  { id: 'ALL', name: '🌐 All Domains & Sectors' },
  { id: 'AYUSH_HEALTH', name: '🌿 AYUSH & Digital Health-Tech' },
  { id: 'AI_DATA', name: '🤖 AI, Machine Learning & Data Science' },
  { id: 'CLOUD_CYBER', name: '☁️ Cloud Computing, DevOps & Security' },
  { id: 'ENTERPRISE_IT', name: '💼 Enterprise IT & Product Engineering' },
  { id: 'FINTECH', name: '💳 FinTech & Banking Systems' },
  { id: 'CORE_CS', name: '⚡ Core CS, DSA & Databases' },
];

interface SkillHeatmapItem {
  skill_name: string;
  category: string;
  student_count: number;
  cohort_percentage: number;
  avg_proficiency: number;
  verified_count: number;
  level_counts: { beginner: number; intermediate: number; advanced: number; expert: number };
  industry_demand: number;
  status: 'STRONG' | 'MODERATE' | 'DEFICIT';
}

interface SectorReadiness {
  sector: string;
  skills_tracked: number;
  readiness_score: number;
  top_strengths: string[];
  top_gaps: string[];
  readiness_tier: string;
}

interface CriticalDeficit {
  skill: string;
  category: string;
  current_proficiency_pct: number;
  avg_score: number;
  industry_demand_rank: number;
  urgency: 'HIGH' | 'MEDIUM';
  recommended_action: string;
}

export default function InstitutionalSkillHeatmapView({ token, user }: { token: string; user: any }) {
  const [loading, setLoading] = useState<boolean>(true);
  const [heatmapData, setHeatmapData] = useState<SkillHeatmapItem[]>([]);
  const [sectorReadiness, setSectorReadiness] = useState<SectorReadiness[]>([]);
  const [criticalDeficits, setCriticalDeficits] = useState<CriticalDeficit[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [healthScore, setHealthScore] = useState<number>(0);
  const [verifiedRatio, setVerifiedRatio] = useState<number>(0);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'STRONG' | 'MODERATE' | 'DEFICIT'>('ALL');
  const [toast, setToast] = useState<string>('');

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchHeatmap = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/analytics/institutional-skills-heatmap`, { headers });
      if (res.ok) {
        const data = await res.json();
        setHeatmapData(data.skills_heatmap || []);
        setSectorReadiness(data.sector_readiness || []);
        setCriticalDeficits(data.critical_deficits || []);
        setTotalStudents(data.total_students || 0);
        setHealthScore(data.institutional_health_score || 0);
        setVerifiedRatio(data.verified_skills_ratio || 0);
      } else {
        showToast('Failed to load institutional heatmap data');
      }
    } catch {
      showToast('Network error loading skills heatmap');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHeatmap();
  }, [fetchHeatmap]);

  const filteredSkills = heatmapData.filter(s => {
    const matchesSearch = s.skill_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || s.category.includes(selectedCategory);
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const exportCSV = () => {
    if (heatmapData.length === 0) return;
    const csvRows = [
      ['Skill Name', 'Category', 'Student Count', 'Cohort %', 'Avg Proficiency %', 'Verified Count', 'Industry Demand Rank', 'Institutional Status'],
      ...heatmapData.map(h => [
        `"${h.skill_name}"`,
        `"${h.category}"`,
        h.student_count,
        `${h.cohort_percentage}%`,
        `${h.avg_proficiency}%`,
        h.verified_count,
        h.industry_demand,
        h.status
      ])
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Institutional_Skill_Heatmap_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast('Exported institutional heatmap CSV successfully');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600/95 backdrop-blur-md text-white px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-400/30 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Sparkles size={16} />
          {toast}
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/60 p-6 md:p-8 border border-indigo-500/20 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles size={13} className="text-amber-400 animate-spin" />
              SIH26044 Academic Intelligence & Governance
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <BarChart3 className="text-indigo-400 h-8 w-8" />
              Institutional Skill Heatmap & Cohort Analytics
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Real-time student competency mapping, domain sector readiness (including <strong>Ministry of Ayush</strong> & Health-Tech), and curriculum deficit intervention matrices for academic leadership.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchHeatmap}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-lg active:scale-95"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Sync Heatmap
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all shadow-lg active:scale-95"
            >
              <Download size={14} />
              Export Accreditation CSV
            </button>
          </div>
        </div>

        {/* Executive KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Cohort Analyzed</span>
              <Users size={16} className="text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {totalStudents} <span className="text-xs font-medium text-slate-400">Students</span>
            </div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
              <CheckCircle2 size={12} /> 100% Active Profiles
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Institutional Health</span>
              <Activity size={16} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {healthScore}%
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-semibold">
              Aggregate Competency Index
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Verified Skills Ratio</span>
              <ShieldCheck size={16} className="text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-400 mt-1">
              {verifiedRatio}%
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-semibold">
              Compiler & Proctored Tests
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Deficit Alerts</span>
              <AlertTriangle size={16} className="text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 mt-1">
              {criticalDeficits.length} <span className="text-xs font-medium text-slate-400">Skills</span>
            </div>
            <div className="text-[10px] text-rose-300/80 mt-1 font-semibold">
              Action Plan Required
            </div>
          </div>
        </div>
      </div>

      {/* Sector Readiness Grid (Highlighting Ministry of Ayush & IT) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="text-indigo-400" size={18} />
            Domain & Sector Competency Mapping
          </h2>
          <span className="text-xs text-slate-400 font-medium">Auto-aggregated across student submissions & test scores</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {sectorReadiness.map((sec, idx) => (
            <div 
              key={idx} 
              className="bg-slate-900/50 hover:bg-slate-900/80 transition-all border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-300 truncate max-w-[140px]">{sec.sector}</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                    sec.readiness_score >= 70 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    sec.readiness_score >= 45 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {sec.readiness_score}%
                  </span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-3">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      sec.readiness_score >= 70 ? 'bg-emerald-500' :
                      sec.readiness_score >= 45 ? 'bg-amber-500' :
                      'bg-rose-500'
                    }`}
                    style={{ width: `${sec.readiness_score}%` }}
                  />
                </div>

                <div className="text-[11px] text-slate-400 font-semibold mb-1">Top Cohort Strengths:</div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {sec.top_strengths.length > 0 ? (
                    sec.top_strengths.map((st, i) => (
                      <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-medium">
                        ✓ {st}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">No standout strength</span>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-indigo-400 font-bold mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span>{sec.readiness_tier}</span>
                <span>{sec.skills_tracked} Skills</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Deficits & Action Plans */}
      {criticalDeficits.length > 0 && (
        <div className="bg-rose-950/20 border border-rose-500/30 rounded-3xl p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-rose-300 flex items-center gap-2">
              <AlertTriangle className="text-rose-400" size={18} />
              Critical Institutional Deficits & Faculty Intervention Matrix
            </h2>
            <span className="text-xs text-rose-300/80 font-semibold">Priority Action for HOD & Class Advisors</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {criticalDeficits.map((def, i) => (
              <div key={i} className="bg-slate-900/90 border border-rose-500/20 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-white">{def.skill}</span>
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {def.urgency} Urgency
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mb-2">{def.category}</div>
                  
                  <div className="flex items-center justify-between text-xs font-semibold mb-2 text-slate-300">
                    <span>Cohort Proficiency:</span>
                    <span className="text-rose-400 font-bold">{def.current_proficiency_pct}%</span>
                  </div>

                  <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                    💡 <strong className="text-slate-300">Action:</strong> {def.recommended_action}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Skills Heatmap Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="text-indigo-400" size={18} />
              Comprehensive Cohort Skill Inventory
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Showing {filteredSkills.length} verified technical & domain skills</p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search skills or domain..."
                className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Categories</option>
              <option value="AYUSH">🌿 AYUSH & Digital Health</option>
              <option value="AI">🤖 AI & Data Science</option>
              <option value="Cloud">☁️ Cloud & DevOps</option>
              <option value="Enterprise">💼 Enterprise Software</option>
              <option value="Core">⚡ Core CS & Databases</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="py-1.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Status</option>
              <option value="STRONG">🟢 Strong (&gt;65%)</option>
              <option value="MODERATE">🟡 Moderate (40-65%)</option>
              <option value="DEFICIT">🔴 Deficit (&lt;40%)</option>
            </select>
          </div>
        </div>

        {/* Heatmap Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                <th className="p-3.5">Skill & Category</th>
                <th className="p-3.5">Student Adoption</th>
                <th className="p-3.5">Proficiency Spectrum</th>
                <th className="p-3.5">Avg Score</th>
                <th className="p-3.5">Industry Demand</th>
                <th className="p-3.5">Accreditation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredSkills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 italic">
                    No matching skills found for the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSkills.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-white text-sm">{item.skill_name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.category}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.status === 'STRONG' ? 'bg-emerald-500' :
                              item.status === 'MODERATE' ? 'bg-amber-500' :
                              'bg-rose-500'
                            }`}
                            style={{ width: `${item.cohort_percentage}%` }}
                          />
                        </div>
                        <span className="font-bold text-white">{item.cohort_percentage}%</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.student_count} of {totalStudents} students</div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300" title="Beginner">
                          Beg: {item.level_counts.beginner}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300" title="Intermediate">
                          Int: {item.level_counts.intermediate}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300" title="Advanced">
                          Adv: {item.level_counts.advanced}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300" title="Expert">
                          Exp: {item.level_counts.expert}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className={`font-bold ${
                        item.avg_proficiency >= 75 ? 'text-emerald-400' :
                        item.avg_proficiency >= 60 ? 'text-amber-400' :
                        'text-rose-400'
                      }`}>
                        {item.avg_proficiency}%
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                        🔥 {item.industry_demand} Open Postings
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        item.status === 'STRONG' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        item.status === 'MODERATE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {item.status === 'STRONG' && <CheckCircle2 size={12} />}
                        {item.status === 'MODERATE' && <TrendingUp size={12} />}
                        {item.status === 'DEFICIT' && <AlertTriangle size={12} />}
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
