import React, { useState, useEffect, useCallback } from 'react';

interface Posting {
  id: string; posting_type: string; title: string; description: string; location: string;
  mode: string; stipend_or_salary: string; duration: string; required_skills: any[];
  min_cgpa: number; application_deadline: string; status: string; total_seats: number;
  company_name: string; industry_sector: string; logo_url: string; hq_location: string;
  created_at: string;
}
interface Application {
  id: string; posting_id: string; title: string; posting_type: string; company_name: string;
  logo_url: string; status: string; match_score: number; matched_skills: any[]; gap_skills: any[];
  location: string; mode: string; stipend_or_salary: string; duration: string; created_at: string;
}
interface MatchResult {
  score: number; matched: {skill:string;studentLevel:number;requiredLevel:number}[];
  gaps: {skill:string;requiredLevel:number;impact:number}[];
  recommendations: {skill:string;resources:{title:string;platform:string;url:string;duration:string}[];priority:string}[];
}

const TYPE_ICONS: Record<string,string> = { JOB:'💼', INTERNSHIP:'🎯', TRAINING:'📚', WORKSHOP:'🔧', FDP:'🎓', RESEARCH:'🔬' };
const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  JOB: { bg: '#eef2ff', text: '#4f46e5', border: '#c7d2fe' },
  INTERNSHIP: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
  TRAINING: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  WORKSHOP: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  FDP: { bg: '#faf5ff', text: '#7c3aed', border: '#ddd6fe' },
  RESEARCH: { bg: '#fdf2f8', text: '#db2777', border: '#fbcfe8' }
};
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  APPLIED: { bg: '#eef2ff', text: '#4f46e5', border: '#c7d2fe' },
  SHORTLISTED: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  INTERVIEW: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  SELECTED: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
  REJECTED: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  COMPLETED: { bg: '#faf5ff', text: '#7c3aed', border: '#ddd6fe' },
  WITHDRAWN: { bg: '#f4f4f5', text: '#71717a', border: '#e4e4e7' }
};
const POST_TYPES = ['ALL','JOB','INTERNSHIP','TRAINING','WORKSHOP','FDP','RESEARCH'];

export default function StudentOpportunitiesView({ token, user }: { token: string; user: any }) {
  const [tab, setTab] = useState<'browse'|'applications'|'recommendations'>('browse');
  const [postings, setPostings] = useState<Posting[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedPosting, setSelectedPosting] = useState<Posting|null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult|null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success'|'error'>('success');
  const [loading, setLoading] = useState(false);

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast(msg); setToastType(type); setTimeout(() => setToast(''), 3500);
  };

  const fetchPostings = useCallback(async () => {
    setLoading(true);
    let url = `/api/postings`;
    const params = new URLSearchParams();
    if (typeFilter !== 'ALL') params.append('type', typeFilter);
    if (search && search.trim()) params.append('search', search.trim());
    const qStr = params.toString();
    if (qStr) url += `?${qStr}`;

    try {
      const r = await fetch(url, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const data = await r.json();
        setPostings(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch postings:', err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, search, token]);

  const fetchApplications = useCallback(async () => {
    try {
      const r = await fetch(`/api/student/applications`, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const data = await r.json();
        setApplications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    }
  }, [token]);

  const fetchRecommendations = useCallback(async () => {
    try {
      const r = await fetch(`/api/student/recommendations`, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const data = await r.json();
        setRecommendations(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  }, [token]);

  useEffect(() => { fetchPostings(); }, [fetchPostings]);
  useEffect(() => { fetchApplications(); fetchRecommendations(); }, [fetchApplications, fetchRecommendations]);

  const openPosting = async (p: Posting) => {
    setSelectedPosting(p); setMatchResult(null); setMatchLoading(true);
    try {
      const r = await fetch(`/api/postings/${p.id}/match`, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
      if (r.ok) setMatchResult(await r.json());
    } catch {}
    setMatchLoading(false);
  };

  const applyToPosting = async () => {
    if (!selectedPosting) return;
    setApplyLoading(true);
    try {
      const r = await fetch(`/api/postings/${selectedPosting.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cover_note: coverNote })
      });
      const d = await r.json();
      if (r.ok) {
        showToast(`Applied to ${selectedPosting.title}! Match score: ${d.match?.score || 0}%`);
        setShowApplyModal(false);
        setCoverNote('');
        fetchApplications();
        setSelectedPosting(null);
      } else {
        showToast(d.error || 'Application failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Application failed', 'error');
    } finally {
      setApplyLoading(false);
    }
  };

  const withdrawApp = async (id: string) => {
    try {
      const r = await fetch(`/api/student/applications/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        showToast('Application withdrawn');
        fetchApplications();
      } else {
        const d = await r.json();
        showToast(d.error || 'Cannot withdraw', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Cannot withdraw', 'error');
    }
  };

  const applied = (postingId: string) => applications.some(a => a.posting_id === postingId);

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-zinc-900 pb-16">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[99999] px-5 py-3 rounded-xl shadow-xl font-bold text-sm text-white transition-all ${toastType === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toastType === 'success' ? '✅' : '❌'} {toast}
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-5 shadow-2xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <h1 className="text-xl font-black text-zinc-900 tracking-tight">Industry Opportunities & Placements</h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-medium">Jobs · Internships · Training · Workshops · Joint Faculty R&D</p>
          </div>
          <div className="text-xs font-semibold text-zinc-500 bg-zinc-50 border border-zinc-200 px-3.5 py-1.5 rounded-full w-fit">
            Welcome, <span className="font-bold text-zinc-900">{user?.full_name || 'Candidate'}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-zinc-200 px-6">
        <div className="max-w-6xl mx-auto flex gap-2 pt-2">
          {(['browse', 'recommendations', 'applications'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 font-bold text-xs rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
                tab === t
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              {t === 'browse' ? '🔍 Browse All' : t === 'recommendations' ? '⭐ AI Recommended' : '📋 My Applications'}
              {t === 'applications' && applications.length > 0 && (
                <span className="bg-zinc-200 text-zinc-800 text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1">
                  {applications.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-6">
        {/* BROWSE TAB */}
        {tab === 'browse' && (
          <>
            <div className="flex flex-col md:flex-row gap-3 mb-6 items-stretch md:items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="🔍 Search company, role, or keywords..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-900 font-medium placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {POST_TYPES.map(t => {
                  const style = TYPE_COLORS[t];
                  const active = typeFilter === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        active
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      {t !== 'ALL' && TYPE_ICONS[t]} {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {loading && (
              <div className="text-center py-20 text-zinc-400 text-xs font-semibold bg-white rounded-2xl border border-zinc-200 shadow-2xs">
                <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <div>Fetching verified corporate postings...</div>
              </div>
            )}

            {!loading && postings.length === 0 && (
              <div className="text-center py-20 text-zinc-400 text-xs font-bold bg-white rounded-2xl border border-zinc-200 shadow-2xs">
                No opportunities match your current filter. Try selecting another category or clearing search.
              </div>
            )}

            <div className="space-y-3.5">
              {postings.map(p => {
                const style = TYPE_COLORS[p.posting_type] || { bg: '#f4f4f5', text: '#52525b', border: '#e4e4e7' };
                const isApp = applied(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => openPosting(p)}
                    className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }}
                            className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border"
                          >
                            {TYPE_ICONS[p.posting_type]} {p.posting_type}
                          </span>
                          <span className="text-[11px] font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-md">
                            {p.mode}
                          </span>
                          {isApp && (
                            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              ✓ Applied
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                          {p.title}
                        </h3>

                        <div className="text-xs font-medium text-zinc-500 flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-zinc-700">{p.company_name}</span>
                          <span>•</span>
                          <span>{p.hq_location || p.location || 'Hybrid / Remote'}</span>
                          {p.stipend_or_salary && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                                💰 {p.stipend_or_salary}
                              </span>
                            </>
                          )}
                        </div>

                        {p.required_skills && p.required_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {p.required_skills.slice(0, 6).map((sk: any, idx: number) => (
                              <span
                                key={idx}
                                className="bg-indigo-50/70 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md text-[11px] font-semibold"
                              >
                                {sk.skill || (typeof sk === 'string' ? sk : '')}
                              </span>
                            ))}
                            {p.required_skills.length > 6 && (
                              <span className="text-zinc-400 text-[11px] font-semibold self-center">
                                +{p.required_skills.length - 6} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex md:flex-col items-end justify-between md:justify-start gap-2 shrink-0">
                        {p.duration && (
                          <span className="text-[11px] text-zinc-500 font-medium">⏱ {p.duration}</span>
                        )}
                        {p.application_deadline && (
                          <span className="text-[11px] text-zinc-500 font-medium">
                            📅 {new Date(p.application_deadline).toLocaleDateString()}
                          </span>
                        )}
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            if (!isApp) {
                              openPosting(p);
                              setShowApplyModal(true);
                            }
                          }}
                          className={`mt-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            isApp
                              ? 'bg-zinc-100 text-zinc-500 cursor-default border border-zinc-200'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-600/20'
                          }`}
                        >
                          {isApp ? '✓ Applied' : 'Apply Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* RECOMMENDATIONS TAB */}
        {tab === 'recommendations' && (
          <div>
            <div className="mb-6">
              <h2 className="text-base font-bold text-zinc-900">⭐ AI Personalized Career Match</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Matched against your verified skill proficiency, CGPA, and LeetCode problem-solving vigor.</p>
            </div>

            {recommendations.length === 0 && (
              <div className="text-center py-20 text-zinc-400 text-xs font-semibold bg-white rounded-2xl border border-zinc-200 shadow-2xs">
                Add skills to your student profile to unlock customized corporate recommendations!
              </div>
            )}

            <div className="space-y-3.5">
              {recommendations.map((p: any, idx: number) => {
                const style = TYPE_COLORS[p.posting_type] || { bg: '#f4f4f5', text: '#52525b', border: '#e4e4e7' };
                return (
                  <div
                    key={p.id}
                    onClick={() => openPosting(p)}
                    className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {idx === 0 && (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                              🏆 Top Match
                            </span>
                          )}
                          <span
                            style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }}
                            className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border"
                          >
                            {TYPE_ICONS[p.posting_type]} {p.posting_type}
                          </span>
                          <span className="text-[11px] font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-md">
                            {p.mode}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-zinc-900">{p.title}</h3>
                        <p className="text-xs font-medium text-zinc-500">{p.company_name}</p>

                        <div className="pt-2 max-w-md">
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-zinc-500">AI Compatibility Score</span>
                            <span className={p.match_score >= 75 ? 'text-emerald-600' : p.match_score >= 50 ? 'text-amber-600' : 'text-red-600'}>
                              {p.match_score}%
                            </span>
                          </div>
                          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                            <div
                              style={{ width: `${p.match_score}%` }}
                              className={`h-full rounded-full transition-all duration-700 ${
                                p.match_score >= 75 ? 'bg-emerald-500' : p.match_score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          openPosting(p);
                          setShowApplyModal(true);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-indigo-600/20"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MY APPLICATIONS TAB */}
        {tab === 'applications' && (
          <div>
            <div className="mb-6">
              <h2 className="text-base font-bold text-zinc-900">📋 Tracked Submissions</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Real-time status tracking for applied industry job & fellowship positions.</p>
            </div>

            {applications.length === 0 && (
              <div className="text-center py-20 text-zinc-400 text-xs font-semibold bg-white rounded-2xl border border-zinc-200 shadow-2xs">
                You have not submitted any opportunity applications yet.
              </div>
            )}

            <div className="space-y-3.5">
              {applications.map(a => {
                const sColor = STATUS_COLORS[a.status] || { bg: '#f4f4f5', text: '#52525b', border: '#e4e4e7' };
                return (
                  <div key={a.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            style={{ backgroundColor: sColor.bg, color: sColor.text, borderColor: sColor.border }}
                            className="text-[11px] font-black px-2.5 py-0.5 rounded-md border"
                          >
                            ● {a.status}
                          </span>
                          <span className="text-xs text-zinc-400 font-semibold">{new Date(a.created_at).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-base font-bold text-zinc-900">{a.title}</h3>
                        <p className="text-xs font-medium text-zinc-500">{a.company_name}</p>
                      </div>

                      {a.status === 'APPLIED' && (
                        <button
                          onClick={() => withdrawApp(a.id)}
                          className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>

                    {/* Progress tracker */}
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                      {['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED'].map((s, i, arr) => {
                        const statuses = ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'COMPLETED'];
                        const currentIdx = statuses.indexOf(a.status);
                        const stepIdx = statuses.indexOf(s);
                        const done = currentIdx >= stepIdx && a.status !== 'REJECTED';
                        return (
                          <React.Fragment key={s}>
                            <div className="flex flex-col items-center min-w-[60px]">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                                  done
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'bg-zinc-100 border-zinc-300 text-zinc-400'
                                }`}
                              >
                                {done ? '✓' : '·'}
                              </div>
                              <span className={`text-[10px] font-bold mt-1 ${done ? 'text-zinc-900' : 'text-zinc-400'}`}>
                                {s}
                              </span>
                            </div>
                            {i < arr.length - 1 && (
                              <div
                                className={`flex-1 h-0.5 mb-4 ${
                                  done && currentIdx > stepIdx ? 'bg-indigo-600' : 'bg-zinc-200'
                                }`}
                              />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* POSTING DETAIL & AI MATCH MODAL */}
      {selectedPosting && !showApplyModal && (
        <div
          onClick={e => {
            if (e.target === e.currentTarget) {
              setSelectedPosting(null);
              setMatchResult(null);
            }
          }}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[9000] p-4 overflow-y-auto"
        >
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-5 my-auto">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex gap-2 mb-2">
                  <span className="text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                    {TYPE_ICONS[selectedPosting.posting_type]} {selectedPosting.posting_type}
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">
                    {selectedPosting.mode}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-zinc-900">{selectedPosting.title}</h2>
                <p className="text-xs text-zinc-500 font-medium">
                  {selectedPosting.company_name} · {selectedPosting.hq_location || selectedPosting.location || 'Remote'}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedPosting(null);
                  setMatchResult(null);
                }}
                className="text-zinc-400 hover:text-zinc-700 font-bold p-1 text-lg"
              >
                ✕
              </button>
            </div>

            {/* AI Match Overview */}
            {matchLoading && (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-center text-xs font-semibold text-indigo-700">
                🤖 Computing AI skill compatibility score...
              </div>
            )}

            {matchResult && !matchLoading && (
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-700">🤖 AI Skill Compatibility</span>
                  <span
                    className={`text-xl font-black ${
                      matchResult.score >= 75 ? 'text-emerald-600' : matchResult.score >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}
                  >
                    {matchResult.score}%
                  </span>
                </div>
                <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${matchResult.score}%` }}
                    className={`h-full rounded-full ${
                      matchResult.score >= 75 ? 'bg-emerald-500' : matchResult.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                  />
                </div>

                {matchResult.matched.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">✅ Matched Skills</div>
                    <div className="flex flex-wrap gap-1.5">
                      {matchResult.matched.map((sk, i) => (
                        <span key={i} className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2 py-0.5 rounded-md">
                          ✓ {sk.skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {matchResult.gaps.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">⚠️ Skill Gaps To Close</div>
                    <div className="flex flex-wrap gap-1.5">
                      {matchResult.gaps.map((g, i) => (
                        <span key={i} className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-2 py-0.5 rounded-md">
                          ⚠ {g.skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Opportunity Details */}
            <div className="space-y-3 text-xs text-zinc-600">
              <div>
                <h4 className="font-bold text-zinc-900 mb-1">About the Position</h4>
                <p className="leading-relaxed whitespace-pre-line">{selectedPosting.description || 'No detailed description provided.'}</p>
              </div>

              {selectedPosting.stipend_or_salary && (
                <div className="font-bold text-emerald-700">
                  Compensation: {selectedPosting.stipend_or_salary}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
              <button
                onClick={() => {
                  setSelectedPosting(null);
                  setMatchResult(null);
                }}
                className="px-4 py-2 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-50"
              >
                Close
              </button>
              <button
                onClick={() => setShowApplyModal(true)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-indigo-600/20"
              >
                Proceed to Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT APPLICATION MODAL */}
      {showApplyModal && selectedPosting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[9500] p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-zinc-900">Apply to {selectedPosting.title}</h3>
            <p className="text-xs text-zinc-500 font-medium">Your verified skill profile, LeetCode metrics, and academic CGPA will be securely submitted to {selectedPosting.company_name}.</p>

            <textarea
              placeholder="Add an optional cover note or statement of interest (optional)..."
              value={coverNote}
              onChange={e => setCoverNote(e.target.value)}
              rows={4}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={applyToPosting}
                disabled={applyLoading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-indigo-600/20 disabled:opacity-50"
              >
                {applyLoading ? 'Submitting...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
