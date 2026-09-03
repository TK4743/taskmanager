import React, { useState, useEffect, useCallback } from 'react';

interface Posting {
  id: string;
  title: string;
  posting_type: string;
  company_name: string;
  required_skills: { skill: string; level: number; weight: number }[];
  mode: string;
  location: string;
}

interface MatchResult {
  score: number;
  matched: { skill: string; studentLevel: number; requiredLevel: number }[];
  gaps: { skill: string; requiredLevel: number; impact: number }[];
  recommendations: {
    skill: string;
    resources: { title: string; platform: string; url: string; duration: string }[];
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
}

interface SkillGapData {
  posting: Posting;
  analysis: MatchResult;
  studentSkills: { name: string; level: number }[];
}

export default function SkillGapAnalyzerView({ token, user }: { token: string; user: any }) {
  const [postings, setPostings] = useState<Posting[]>([]);
  const [selectedPostingId, setSelectedPostingId] = useState<string>('');
  const [gapData, setGapData] = useState<SkillGapData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [skillDemand, setSkillDemand] = useState<{ skill: string; count: number }[]>([]);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchPostings = useCallback(async () => {
    try {
      const res = await fetch(`/api/postings`, { headers });
      if (res.ok) {
        const data: Posting[] = await res.json();
        setPostings(data);
        if (data.length > 0 && !selectedPostingId) {
          setSelectedPostingId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch postings for skill analyzer', err);
    }
  }, [headers, selectedPostingId]);

  const fetchDemand = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/skill-demand`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSkillDemand(data);
      }
    } catch (_) {}
  }, [headers]);

  const analyzeGap = useCallback(async (pId: string) => {
    if (!pId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/student/skill-gap/${pId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setGapData(data);
      }
    } catch (err) {
      console.error('Error fetching skill gap data', err);
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

  const levelName = (lvl: number) => {
    if (lvl <= 1) return 'Beginner';
    if (lvl === 2) return 'Intermediate';
    return 'Advanced / Expert';
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-zinc-900 pb-16">
      {/* Top Banner Header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-5 shadow-2xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              <h1 className="text-xl font-black text-zinc-900 tracking-tight">AI Skill Gap & Career Intelligence</h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-medium">Deep comparative matching between your verified abilities and target industry job roles</p>
          </div>
          <div className="text-xs font-semibold text-zinc-500 bg-zinc-50 border border-zinc-200 px-3.5 py-1.5 rounded-full w-fit">
            Academic Management System · Skill Intelligence
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-6 space-y-6">
        {/* Top Grid: Selector + High Demand Industry Skills */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Target Role Selector */}
          <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div>
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-wider block mb-2">
                Select Target Career Role / Opportunity
              </label>
              <select
                value={selectedPostingId}
                onChange={e => setSelectedPostingId(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {postings.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {p.company_name} ({p.posting_type})
                  </option>
                ))}
              </select>
            </div>

            {loading && (
              <div className="text-center py-12 text-xs font-bold text-zinc-400">
                <div className="inline-block w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                <div>Analyzing dynamic skill profile against benchmark...</div>
              </div>
            )}

            {!loading && gapData && (
              <div className="pt-2 border-t border-zinc-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-600">AI Compatibility Benchmark</span>
                  <span
                    className={`text-2xl font-black ${
                      gapData.analysis.score >= 75
                        ? 'text-emerald-600'
                        : gapData.analysis.score >= 50
                        ? 'text-amber-600'
                        : 'text-red-600'
                    }`}
                  >
                    {gapData.analysis.score}%
                  </span>
                </div>

                <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                  <div
                    style={{ width: `${gapData.analysis.score}%` }}
                    className={`h-full rounded-full transition-all duration-700 ${
                      gapData.analysis.score >= 75
                        ? 'bg-emerald-500'
                        : gapData.analysis.score >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                  />
                </div>

                {/* Matched vs Gap Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
                    <div className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
                      <span>✓</span> Matched Verified Skills ({gapData.analysis.matched.length})
                    </div>
                    {gapData.analysis.matched.length === 0 ? (
                      <p className="text-xs text-zinc-400">No exact matches logged.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {gapData.analysis.matched.map((m, i) => (
                          <div key={i} className="flex justify-between items-center text-xs font-semibold text-zinc-800">
                            <span>{m.skill}</span>
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
                              {levelName(m.studentLevel)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4">
                    <div className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                      <span>⚠</span> Missing Skill Gaps ({gapData.analysis.gaps.length})
                    </div>
                    {gapData.analysis.gaps.length === 0 ? (
                      <p className="text-xs text-emerald-700 font-bold">Zero gaps! You fully satisfy all criteria.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {gapData.analysis.gaps.map((g, i) => (
                          <div key={i} className="flex justify-between items-center text-xs font-semibold text-zinc-800">
                            <span>{g.skill}</span>
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">
                              Target: {levelName(g.requiredLevel)} ({(g.impact * 100).toFixed(0)}% wt)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* High-Demand Industry Skills Sidebar Widget */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <span>📊</span> High-Demand Industry Skills
              </h3>
              <p className="text-[11px] text-zinc-400 mt-1">Aggregated across all verified corporate postings</p>
            </div>

            {skillDemand.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4">No demand data available yet.</p>
            ) : (
              <div className="space-y-2">
                {skillDemand.map((sd, i) => (
                  <div key={i} className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-zinc-700">{sd.skill}</span>
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {sd.count} Postings
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-zinc-100 space-y-2 text-[11px] text-zinc-500">
              <div className="font-bold text-zinc-800">💡 How AI Matching Works</div>
              <p>• <strong>Weighted Skills (80%)</strong>: Proficiency matched against company requirement weights.</p>
              <p>• <strong>Academic Discipline (10%)</strong>: Verified CGPA contribution.</p>
              <p>• <strong>Coding Vigor (10%)</strong>: LeetCode problem-solving milestone bonus.</p>
            </div>
          </div>
        </div>

        {/* Personalized Curated Bridge Roadmap */}
        {gapData && gapData.analysis.recommendations.length > 0 && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <h3 className="text-base font-bold text-zinc-900">AI Recommended Actionable Bridge Plan</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gapData.analysis.recommendations.map((rec, i) => (
                <div key={i} className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-zinc-900">{rec.skill}</span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${
                        rec.priority === 'HIGH'
                          ? 'bg-red-50 text-red-700 border-red-200'
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
                        className="block bg-white border border-zinc-200 hover:border-indigo-300 rounded-lg p-2.5 transition-all group"
                      >
                        <div className="text-xs font-bold text-indigo-600 group-hover:text-indigo-800 flex items-center gap-1 mb-1">
                          <span>🔗</span> {res.title}
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-400 font-semibold">
                          <span>{res.platform}</span>
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
      </div>
    </div>
  );
}
