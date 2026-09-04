import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from './config';
import { 
  BarChart3, Sparkles, AlertTriangle, CheckCircle2, TrendingUp, 
  Layers, Search, Download, ShieldCheck, 
  Activity, RefreshCw, Users, Zap
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
    <div className="min-h-screen bg-[#F5F5F4] text-zinc-900 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-zinc-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-zinc-700 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles size={16} className="text-amber-400" />
          {toast}
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-white border-b border-zinc-200/90 px-6 py-5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                <BarChart3 size={20} />
              </span>
              <h1 className="text-xl font-black text-zinc-900 tracking-tight">
                Institutional Skill Heatmap & Cohort Analytics
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                <Sparkles size={11} className="text-amber-600" />
                SIH26044
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-medium">
              Real-time student competency mapping, domain sector readiness (including <strong>Ministry of Ayush & Health-Tech</strong>), and institutional deficit analytics for academic governance.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchHeatmap}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-indigo-600' : ''} />
              Refresh
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Download size={13} />
              Export Accreditation CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* Executive KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
              <span>Cohort Analyzed</span>
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Users size={16} />
              </span>
            </div>
            <div className="text-2xl font-black text-zinc-900 mt-2">
              {totalStudents} <span className="text-xs font-semibold text-zinc-400">Students</span>
            </div>
            <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1.5 font-bold">
              <CheckCircle2 size={13} /> 100% Active Profiles
            </div>
          </div>

          <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
              <span>Institutional Health</span>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Activity size={16} />
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-2">
              {healthScore}%
            </div>
            <div className="text-[11px] text-zinc-500 mt-1.5 font-medium">
              Aggregate Competency Index
            </div>
          </div>

          <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
              <span>Verified Skills Ratio</span>
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <ShieldCheck size={16} />
              </span>
            </div>
            <div className="text-2xl font-black text-blue-600 mt-2">
              {verifiedRatio}%
            </div>
            <div className="text-[11px] text-zinc-500 mt-1.5 font-medium">
              Compiler & Proctored Tests
            </div>
          </div>

          <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
              <span>Deficit Alerts</span>
              <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <AlertTriangle size={16} />
              </span>
            </div>
            <div className="text-2xl font-black text-rose-600 mt-2">
              {criticalDeficits.length} <span className="text-xs font-semibold text-zinc-400">Skills</span>
            </div>
            <div className="text-[11px] text-rose-600 mt-1.5 font-bold">
              Action Plan Required
            </div>
          </div>
        </div>

        {/* Sector Competency Mapping (Featuring Ministry of Ayush & IT Sectors) */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                <Layers size={18} />
              </span>
              <h2 className="text-base font-extrabold text-zinc-900">
                Domain & Sector Competency Mapping
              </h2>
            </div>
            <span className="text-xs text-zinc-500 font-medium">
              Aggregated across active student submissions, LeetCode sync & proctored coding assessments
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {sectorReadiness.map((sec, idx) => (
              <div 
                key={idx} 
                className="bg-zinc-50/80 hover:bg-white transition-all border border-zinc-200/80 hover:border-indigo-300 rounded-xl p-4 flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-xs font-extrabold text-zinc-900 truncate">{sec.sector}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                      sec.readiness_score >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      sec.readiness_score >= 45 ? 'bg-amber-50 text-amber-800 border-amber-200' :
                      'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {sec.readiness_score}%
                    </span>
                  </div>

                  <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden mb-3">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        sec.readiness_score >= 70 ? 'bg-emerald-500' :
                        sec.readiness_score >= 45 ? 'bg-amber-500' :
                        'bg-rose-500'
                      }`}
                      style={{ width: `${sec.readiness_score}%` }}
                    />
                  </div>

                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Top Strengths:</div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {sec.top_strengths.length > 0 ? (
                      sec.top_strengths.map((st, i) => (
                        <span key={i} className="text-[10px] bg-white border border-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded-md font-semibold">
                          ✓ {st}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-zinc-400 italic">No standout strength</span>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-indigo-700 font-bold mt-2 pt-2 border-t border-zinc-200 flex items-center justify-between">
                  <span>{sec.readiness_tier}</span>
                  <span>{sec.skills_tracked} Skills</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Deficits & Action Plans */}
        {criticalDeficits.length > 0 && (
          <div className="bg-gradient-to-r from-rose-50/70 via-red-50/50 to-amber-50/50 border-2 border-rose-200/90 rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                  <AlertTriangle size={18} />
                </span>
                <h2 className="text-base font-extrabold text-rose-950">
                  Critical Institutional Deficits & Faculty Intervention Matrix
                </h2>
              </div>
              <span className="text-xs text-rose-800 font-bold bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-full">
                HOD & Advisor Action Required
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {criticalDeficits.map((def, i) => (
                <div key={i} className="bg-white border border-rose-200/80 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-extrabold text-zinc-900">{def.skill}</span>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                        {def.urgency} Urgency
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 font-medium mb-2">{def.category}</div>
                    
                    <div className="flex items-center justify-between text-xs font-semibold mb-2 text-zinc-700">
                      <span>Cohort Proficiency:</span>
                      <span className="text-rose-600 font-black">{def.current_proficiency_pct}%</span>
                    </div>

                    <p className="text-[11px] text-zinc-600 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 leading-relaxed font-medium">
                      💡 <strong className="text-zinc-800">Action:</strong> {def.recommended_action}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Skills Heatmap Table */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <TrendingUp size={18} />
                </span>
                <h2 className="text-base font-extrabold text-zinc-900">
                  Comprehensive Cohort Skill Inventory
                </h2>
              </div>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Showing {filteredSkills.length} verified technical & domain skills across current batch
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="🔍 Search skill or domain..."
                  className="pl-9 pr-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-52 font-medium"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="py-2 px-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                className="py-2 px-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="ALL">All Status</option>
                <option value="STRONG">🟢 Strong (&gt;65%)</option>
                <option value="MODERATE">🟡 Moderate (40-65%)</option>
                <option value="DEFICIT">🔴 Deficit (&lt;40%)</option>
              </select>
            </div>
          </div>

          {/* Heatmap Table */}
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 text-zinc-600 font-extrabold border-b border-zinc-200 uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">Skill & Category</th>
                  <th className="p-3.5">Student Adoption</th>
                  <th className="p-3.5">Proficiency Spectrum</th>
                  <th className="p-3.5">Avg Score</th>
                  <th className="p-3.5">Industry Demand</th>
                  <th className="p-3.5">Accreditation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-medium">
                {filteredSkills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-zinc-400 font-semibold italic">
                      No matching skills found for the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSkills.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="font-extrabold text-zinc-900 text-xs sm:text-sm">{item.skill_name}</div>
                        <div className="text-[11px] text-zinc-500 font-medium mt-0.5">{item.category}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-zinc-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.status === 'STRONG' ? 'bg-emerald-500' :
                                item.status === 'MODERATE' ? 'bg-amber-500' :
                                'bg-rose-500'
                              }`}
                              style={{ width: `${item.cohort_percentage}%` }}
                            />
                          </div>
                          <span className="font-black text-zinc-900">{item.cohort_percentage}%</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">{item.student_count} of {totalStudents} students</div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1 text-[10px] font-semibold">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200" title="Beginner">
                            Beg: {item.level_counts.beginner}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100" title="Intermediate">
                            Int: {item.level_counts.intermediate}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100" title="Advanced">
                            Adv: {item.level_counts.advanced}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100" title="Expert">
                            Exp: {item.level_counts.expert}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className={`font-black text-xs ${
                          item.avg_proficiency >= 75 ? 'text-emerald-700' :
                          item.avg_proficiency >= 60 ? 'text-amber-700' :
                          'text-rose-700'
                        }`}>
                          {item.avg_proficiency}%
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700">
                          🔥 {item.industry_demand} Postings
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          item.status === 'STRONG' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                          item.status === 'MODERATE' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                          'bg-rose-50 text-rose-800 border-rose-300'
                        }`}>
                          {item.status === 'STRONG' && <CheckCircle2 size={12} className="text-emerald-600" />}
                          {item.status === 'MODERATE' && <TrendingUp size={12} className="text-amber-600" />}
                          {item.status === 'DEFICIT' && <AlertTriangle size={12} className="text-rose-600" />}
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
    </div>
  );
}
