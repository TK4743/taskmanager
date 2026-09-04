import React, { useState, useEffect, useCallback } from 'react';
import HRCodingAssessmentsManager from './HRCodingAssessmentsManager';
import { API_URL } from './config';

const API = API_URL || '';

interface CompanyProfile {
  id: string; user_id: string; company_name: string; industry_sector: string;
  company_size: string; website: string; description: string; logo_url: string;
  hq_location: string; is_verified: boolean; username: string; full_name: string; email: string;
}
interface Posting {
  id: string; posting_type: string; title: string; description: string; location: string;
  mode: string; stipend_or_salary: string; duration: string; required_skills: any[];
  min_cgpa: number; application_deadline: string; status: string; total_seats: number;
  application_count: number; created_at: string;
}
interface Application {
  id: string; student_id: string; full_name: string; email: string; register_number: string;
  cgpa: number; match_score: number; matched_skills: any[]; gap_skills: any[];
  status: string; cover_note: string; created_at: string;
}

const POSTING_TYPES = ['JOB','INTERNSHIP','TRAINING','WORKSHOP','FDP','RESEARCH'];
const SKILL_LEVELS = ['Beginner','Intermediate','Advanced','Expert','Master'];
const STATUS_COLORS: Record<string, string> = {
  APPLIED: '#4f46e5', SHORTLISTED: '#d97706', INTERVIEW: '#2563eb',
  SELECTED: '#059669', REJECTED: '#dc2626', COMPLETED: '#7c3aed',
};

export default function IndustryPortalView({
  token,
  user,
  activeTab = 'dashboard',
  onTabChange
}: {
  token: string;
  user: any;
  activeTab?: 'dashboard'|'postings'|'applications'|'coding-assessments'|'faculty'|'reports'|'profile';
  onTabChange?: (tab: 'dashboard'|'postings'|'applications'|'coding-assessments'|'faculty'|'reports'|'profile') => void;
}) {
  const [tab, setTabState] = useState<'dashboard'|'postings'|'applications'|'coding-assessments'|'faculty'|'reports'|'profile'>(activeTab || 'dashboard');

  useEffect(() => {
    if (activeTab) {
      setTabState(activeTab);
      if (activeTab === 'reports') fetchReportPreview();
    }
  }, [activeTab]);

  const setTab = (t: 'dashboard'|'postings'|'applications'|'coding-assessments'|'faculty'|'reports'|'profile') => {
    setTabState(t);
    if (onTabChange) onTabChange(t);
    if (t === 'reports') fetchReportPreview();
  };
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [postings, setPostings] = useState<Posting[]>([]);
  const [selectedPosting, setSelectedPosting] = useState<Posting | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [facultyApps, setFacultyApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPostingForm, setShowPostingForm] = useState(false);
  const [postingForm, setPostingForm] = useState({
    posting_type: 'INTERNSHIP', title: '', description: '', location: '', mode: 'Hybrid',
    stipend_or_salary: '', duration: '', min_cgpa: '0', total_seats: '',
    application_deadline: '', eligibility_notes: '',
    required_skills: [] as {skill:string;level:number;weight:number}[]
  });
  const [newSkill, setNewSkill] = useState({ skill: '', level: 2, weight: 1 });
  const [profileForm, setProfileForm] = useState<Partial<CompanyProfile>>({});
  const [toast, setToast] = useState('');

  // ── Reports Center State ──────────────────────────────────────────────────
  const [reportType, setReportType] = useState<string>('applications');
  const [reportPostingId, setReportPostingId] = useState<string>('');
  const [reportStatus, setReportStatus] = useState<string>('');
  const [reportMinMatch, setReportMinMatch] = useState<string>('');
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewCount, setPreviewCount] = useState<number>(0);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadLogs, setDownloadLogs] = useState<any[]>([]);

  const h = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const fetchProfile = useCallback(async () => {
    try { const r = await fetch(`${API}/api/industry/profile`, { headers: h }); if (r.ok) { const d = await r.json(); setProfile(d); setProfileForm(d); } } catch {}
  }, [token]);

  const fetchPostings = useCallback(async () => {
    const r = await fetch(`${API}/api/industry/postings`, { headers: h }); if (r.ok) setPostings(await r.json());
  }, [token]);

  const fetchApplications = useCallback(async (id: string) => {
    setLoading(true);
    const r = await fetch(`${API}/api/industry/postings/${id}/applications`, { headers: h });
    if (r.ok) setApplications(await r.json()); setLoading(false);
  }, [token]);

  const fetchFacultyApps = useCallback(async () => {
    const r = await fetch(`${API}/api/industry/faculty-applications`, { headers: h });
    if (r.ok) setFacultyApps(await r.json());
  }, [token]);

  const fetchReportPreview = useCallback(async (selectedType?: string) => {
    setPreviewLoading(true);
    const targetType = selectedType || reportType;
    try {
      const q = new URLSearchParams();
      if (reportPostingId) q.append('postingId', reportPostingId);
      if (reportStatus) q.append('status', reportStatus);
      if (reportMinMatch) q.append('minMatch', reportMinMatch);
      if (reportStartDate) q.append('startDate', reportStartDate);
      if (reportEndDate) q.append('endDate', reportEndDate);

      const res = await fetch(`${API}/api/industry/reports-preview/${targetType}?${q.toString()}`, { headers: h });
      if (res.ok) {
        const d = await res.json();
        setPreviewData(d.preview || []);
        setPreviewCount(d.recordCount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPreviewLoading(false);
    }
  }, [token, reportType, reportPostingId, reportStatus, reportMinMatch, reportStartDate, reportEndDate]);

  const fetchDownloadLogs = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/industry/reports-logs`, { headers: h });
      if (res.ok) setDownloadLogs(await res.json());
    } catch (e) {}
  }, [token]);

  const handleDownloadReport = async (fmt: 'csv'|'xlsx'|'pdf') => {
    setDownloading(true);
    try {
      const q = new URLSearchParams();
      q.append('format', fmt);
      if (reportPostingId) q.append('postingId', reportPostingId);
      if (reportStatus) q.append('status', reportStatus);
      if (reportMinMatch) q.append('minMatch', reportMinMatch);
      if (reportStartDate) q.append('startDate', reportStartDate);
      if (reportEndDate) q.append('endDate', reportEndDate);

      const res = await fetch(`${API}/api/industry/reports/${reportType}?${q.toString()}`, { headers: h });
      if (!res.ok) {
        showToast('Report generation failed');
        setDownloading(false);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = fmt === 'xlsx' ? 'xlsx' : fmt === 'pdf' ? 'html' : 'csv';
      a.download = `HR_Report_${reportType}_${new Date().toISOString().split('T')[0]}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast(`Report downloaded successfully (${fmt.toUpperCase()})`);
      fetchDownloadLogs();
    } catch (err) {
      showToast('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => { fetchProfile(); fetchPostings(); fetchFacultyApps(); fetchDownloadLogs(); }, []);
  useEffect(() => { if (selectedPosting) fetchApplications(selectedPosting.id); }, [selectedPosting]);
  useEffect(() => { if (tab === 'reports') fetchReportPreview(); }, [tab, reportType]);

  const submitPosting = async () => {
    const r = await fetch(`${API}/api/industry/postings`, { method:'POST', headers: h, body: JSON.stringify({ ...postingForm, min_cgpa: parseFloat(postingForm.min_cgpa)||0, total_seats: postingForm.total_seats ? parseInt(postingForm.total_seats) : null }) });
    const d = await r.json();
    if (r.ok) { showToast('Posting created!'); setShowPostingForm(false); fetchPostings(); setPostingForm({ posting_type:'INTERNSHIP', title:'', description:'', location:'', mode:'Hybrid', stipend_or_salary:'', duration:'', min_cgpa:'0', total_seats:'', application_deadline:'', eligibility_notes:'', required_skills:[] }); }
    else showToast(d.error || 'Failed to create posting');
  };

  const updateAppStatus = async (appId: string, status: string) => {
    const r = await fetch(`${API}/api/industry/applications/${appId}/status`, { method:'PUT', headers: h, body: JSON.stringify({ status }) });
    if (r.ok) { showToast(`Application ${status.toLowerCase()}`); if (selectedPosting) fetchApplications(selectedPosting.id); }
    else showToast('Update failed');
  };

  const addSkill = () => {
    if (!newSkill.skill.trim()) return;
    setPostingForm(p => ({ ...p, required_skills: [...p.required_skills, { ...newSkill, skill: newSkill.skill.trim() }] }));
    setNewSkill({ skill:'', level:2, weight:1 });
  };

  const c: Record<string, React.CSSProperties> = {
    wrap: { height:'100%', minHeight:'100%', overflowY:'auto', background:'#F5F5F4', color:'#0f172a', fontFamily:"'Inter',sans-serif", paddingBottom: 60, boxSizing: 'border-box' as const },
    hdr: { background:'#ffffff', borderBottom:'1px solid #e2e8f0', padding:'18px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 1px 2px 0 rgba(0,0,0,0.03)' },
    tabBar: { display:'flex', gap:6, padding:'14px 28px', borderBottom:'1px solid #e2e8f0', background:'#ffffff', flexWrap:'wrap' },
    tab: (a:boolean) => ({ padding:'8px 18px', borderRadius:10, border: a ? '1px solid #0f172a' : '1px solid #e2e8f0', cursor:'pointer', fontWeight:700, fontSize:13, background: a ? '#0f172a' : '#ffffff', color: a ? '#ffffff' : '#475569', transition:'all 0.15s ease-in-out' }),
    body: { padding:'24px 28px', maxWidth:1200, margin:'0 auto' },
    card: { background:'#ffffff', border:'1px solid #e2e8f0', borderRadius:16, padding:22, marginBottom:14, boxShadow:'0 1px 3px 0 rgba(0, 0, 0, 0.05)' },
    btn: (bg='#0f172a') => ({ background:bg, color:'#ffffff', border:'none', borderRadius:10, padding:'9px 18px', cursor:'pointer', fontWeight:700, fontSize:13, transition:'opacity 0.15s' }),
    inp: { background:'#ffffff', border:'1px solid #cbd5e1', borderRadius:10, padding:'10px 13px', color:'#0f172a', width:'100%', fontSize:14, boxSizing:'border-box' as const, outline:'none' },
    lbl: { display:'block', marginBottom:6, fontSize:11, color:'#64748b', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:0.5 },
    grid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16 },
    stat: { background:'#ffffff', border:'1px solid #e2e8f0', borderRadius:16, padding:20, textAlign:'center' as const, boxShadow:'0 1px 3px 0 rgba(0, 0, 0, 0.04)' },
    badge: (v:boolean) => ({ background: v ? '#ecfdf5' : '#fffbeb', color: v ? '#047857' : '#b45309', border:`1px solid ${v ? '#a7f3d0' : '#fde68a'}`, borderRadius:20, padding:'4px 14px', fontSize:12, fontWeight:700 }),
    modal: { position:'fixed' as const, inset:0, background:'rgba(15, 23, 42, 0.65)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9000, padding:16 },
    mbox: { background:'#ffffff', border:'1px solid #e2e8f0', borderRadius:20, padding:28, width:'100%', maxWidth:620, maxHeight:'92vh', overflowY:'auto' as const, color:'#0f172a', boxShadow:'0 20px 25px -5px rgba(0,0,0,0.1)' },
    toast: { position:'fixed' as const, bottom:24, right:24, background:'#059669', color:'#ffffff', borderRadius:12, padding:'12px 22px', fontWeight:700, zIndex:99999, boxShadow:'0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
    scoreWrap: (s:number) => ({ height:6, borderRadius:3, background: s>=75?'#059669':s>=50?'#d97706':'#dc2626', width:`${s}%`, transition:'width 0.5s' }),
    appCard: (s:string) => ({ background:'#ffffff', border:`1px solid ${s==='SELECTED'?'#a7f3d0':s==='REJECTED'?'#fecaca':'#e2e8f0'}`, borderRadius:14, padding:18, marginBottom:12, boxShadow:'0 1px 2px 0 rgba(0, 0, 0, 0.04)' }),
  };

  return (
    <div style={c.wrap}>
      {toast && <div style={c.toast}>✅ {toast}</div>}

      <div style={c.hdr}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'#0f172a' }}>{profile?.company_name || user?.full_name || 'Corporate Partner Portal'}</div>
          <div style={{ fontSize:12, color:'#64748b', marginTop:2, fontWeight:600 }}>{profile?.industry_sector || 'Talent Acquisition & Campus Recruitment'}</div>
        </div>
        <span style={c.badge(!!profile?.is_verified)}>{profile?.is_verified ? '✓ Verified Partner' : '⏳ Pending Approval'}</span>
      </div>

      <div style={c.body}>

        {/* DASHBOARD */}
        {tab==='dashboard' && <>
          <h2 style={{ fontSize:22, fontWeight:800, color:'#0f172a', marginBottom:20 }}>Overview</h2>
          <div style={c.grid}>
            <div style={c.stat}>
              <div style={{ fontSize:34,fontWeight:900,color:'#4f46e5' }}>{postings.length}</div>
              <div style={{ color:'#64748b',fontSize:12,fontWeight:600,marginTop:4 }}>Total Postings</div>
            </div>
            <div style={c.stat}>
              <div style={{ fontSize:34,fontWeight:900,color:'#059669' }}>{postings.filter(p=>p.status==='OPEN').length}</div>
              <div style={{ color:'#64748b',fontSize:12,fontWeight:600,marginTop:4 }}>Active Postings</div>
            </div>
            <div style={c.stat}>
              <div style={{ fontSize:34,fontWeight:900,color:'#d97706' }}>{postings.reduce((a,p)=>a+(parseInt(String(p.application_count))||0),0)}</div>
              <div style={{ color:'#64748b',fontSize:12,fontWeight:600,marginTop:4 }}>Total Applications</div>
            </div>
            <div style={c.stat}>
              <div style={{ fontSize:34,fontWeight:900,color:'#7c3aed' }}>{facultyApps.length}</div>
              <div style={{ color:'#64748b',fontSize:12,fontWeight:600,marginTop:4 }}>Faculty Applications</div>
            </div>
          </div>

          {!profile?.is_verified && (
            <div style={{ ...c.card, borderColor:'#fde68a', background:'#fffbeb', marginTop:20 }}>
              <div style={{ fontWeight:700, color:'#b45309', marginBottom:4, fontSize:15 }}>⚠️ Account Pending Verification</div>
              <p style={{ color:'#92400e', margin:0, fontSize:13 }}>
                Your company is being reviewed by the institution admin. Complete your profile while waiting. You'll be notified once approved.
              </p>
            </div>
          )}

          <div style={{ marginTop:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h3 style={{ fontWeight:800, color:'#0f172a', margin:0, fontSize:16 }}>Recent Postings</h3>
              <button style={c.btn('#0f172a')} onClick={() => setTab('postings')}>View All →</button>
            </div>
            {postings.slice(0,3).map(p => (
              <div key={p.id} style={c.card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
                  <div>
                    <div style={{ display:'flex', gap:6, marginBottom:6 }}>
                      <span style={{ background:'#e0e7ff',color:'#4338ca',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:700 }}>{p.posting_type}</span>
                      <span style={{ background:p.status==='OPEN'?'#d1fae5':'#fee2e2',color:p.status==='OPEN'?'#047857':'#b91c1c',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:700 }}>{p.status}</span>
                    </div>
                    <div style={{ fontWeight:800, color:'#0f172a', fontSize:15 }}>{p.title}</div>
                    <div style={{ color:'#64748b',fontSize:13, marginTop:2 }}>{p.mode} · {p.location||'Remote'}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:26,fontWeight:900,color:'#4f46e5' }}>{p.application_count||0}</div>
                    <div style={{ fontSize:11,color:'#64748b',fontWeight:600 }}>applicants</div>
                  </div>
                </div>
              </div>
            ))}
            {postings.length===0 && (
              <div style={{ ...c.card, textAlign:'center', color:'#64748b', padding:40, background:'#ffffff' }}>
                No postings yet. <button style={{ ...c.btn('#4f46e5'), marginLeft:8 }} onClick={() => setTab('postings')}>Create one →</button>
              </div>
            )}
          </div>
        </>}

        {/* POSTINGS */}
        {tab==='postings' && <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h2 style={{ fontSize:22, fontWeight:800, color:'#0f172a', margin:0 }}>My Postings</h2>
            <button style={c.btn('#4f46e5')} onClick={() => setShowPostingForm(true)}>+ Create Posting</button>
          </div>
          {postings.length===0 && <div style={{ ...c.card, textAlign:'center', color:'#64748b', padding:50 }}>No postings yet. Create your first job or internship posting!</div>}
          {postings.map(p => (
            <div key={p.id} style={c.card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:6, marginBottom:6, flexWrap:'wrap' }}>
                    <span style={{ background:'#e0e7ff',color:'#4338ca',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:700 }}>{p.posting_type}</span>
                    <span style={{ background:p.status==='OPEN'?'#d1fae5':'#f1f5f9',color:p.status==='OPEN'?'#047857':'#64748b',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:700 }}>{p.status}</span>
                    <span style={{ background:'#f1f5f9',color:'#475569',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600 }}>{p.mode}</span>
                  </div>
                  <div style={{ fontWeight:800, color:'#0f172a', fontSize:16, marginBottom:3 }}>{p.title}</div>
                  <div style={{ color:'#64748b',fontSize:13,marginBottom:8 }}>{p.location||'Remote'} {p.stipend_or_salary&&`· ${p.stipend_or_salary}`} {p.duration&&`· ${p.duration}`}</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                    {(p.required_skills||[]).slice(0,6).map((sk:any,i:number) => (
                      <span key={i} style={{ background:'#f1f5f9',color:'#334155',border:'1px solid #e2e8f0',borderRadius:5,padding:'2px 7px',fontSize:11,fontWeight:600 }}>{sk.skill}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <div style={{ background:'#eef2ff',border:'1px solid #c7d2fe',borderRadius:12,padding:'8px 16px',textAlign:'center' }}>
                    <div style={{ fontSize:22,fontWeight:900,color:'#4f46e5' }}>{p.application_count||0}</div>
                    <div style={{ fontSize:11,color:'#4338ca',fontWeight:600 }}>applicants</div>
                  </div>
                  <button style={{ ...c.btn('#2563eb'), fontSize:12 }} onClick={() => { setSelectedPosting(p); setTab('applications'); }}>View Apps</button>
                </div>
              </div>
            </div>
          ))}
        </>}

        {/* APPLICATIONS */}
        {tab==='applications' && <>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <h2 style={{ fontSize:22, fontWeight:800, color:'#0f172a', margin:0 }}>Applications</h2>
            {selectedPosting && <span style={{ color:'#64748b', fontSize:14, fontWeight:600 }}>· {selectedPosting.title}</span>}
          </div>
          {!selectedPosting ? (
            <div style={c.card}>
              <p style={{ color:'#64748b',fontWeight:600,marginBottom:14 }}>Select a posting to review applicants:</p>
              {postings.map(p => (
                <button key={p.id} style={{ ...c.btn('#ffffff'), color:'#0f172a', display:'block', width:'100%', textAlign:'left', marginBottom:8, border:'1px solid #e2e8f0', borderRadius:10, padding:'12px 16px' }} onClick={() => setSelectedPosting(p)}>
                  <span style={{ fontWeight:700 }}>{p.title}</span> <span style={{ color:'#4f46e5', marginLeft:8, fontSize:13, fontWeight:700 }}>({p.application_count||0} applicants)</span>
                </button>
              ))}
              {postings.length===0 && <div style={{ color:'#64748b', textAlign:'center', padding:30 }}>No postings available</div>}
            </div>
          ) : loading ? (
            <div style={{ textAlign:'center', padding:60, color:'#64748b' }}>Loading applications...</div>
          ) : <>
            <button style={{ ...c.btn('#475569'), marginBottom:16 }} onClick={() => setSelectedPosting(null)}>← Back to Postings</button>
            {applications.length===0 && <div style={{ ...c.card, textAlign:'center', color:'#64748b', padding:50 }}>No applications yet for this posting.</div>}
            {applications.map(app => (
              <div key={app.id} style={c.appCard(app.status)}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontWeight:800, color:'#0f172a', fontSize:16 }}>{app.full_name}</span>
                      <span style={{ background:`${STATUS_COLORS[app.status]||'#4f46e5'}18`, color:STATUS_COLORS[app.status]||'#4f46e5', border:`1px solid ${(STATUS_COLORS[app.status]||'#4f46e5')}40`, borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{app.status}</span>
                    </div>
                    <div style={{ color:'#64748b', fontSize:13, marginBottom:10 }}>
                      {app.email} · {app.register_number} {app.cgpa ? `· CGPA ${app.cgpa}` : ''}
                    </div>
                    <div style={{ marginBottom:8 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:12, color:'#64748b', fontWeight:600 }}>AI Match Score</span>
                        <span style={{ fontSize:13, fontWeight:800, color: app.match_score>=75?'#059669':app.match_score>=50?'#d97706':'#dc2626' }}>{app.match_score}%</span>
                      </div>
                      <div style={{ background:'#f1f5f9', borderRadius:4, height:6, overflow:'hidden' }}>
                        <div style={c.scoreWrap(app.match_score)} />
                      </div>
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                      {(app.matched_skills||[]).map((sk:any,i:number) => <span key={i} style={{ background:'#ecfdf5',color:'#047857',border:'1px solid #a7f3d0',borderRadius:5,padding:'2px 6px',fontSize:11,fontWeight:600 }}>✓ {sk.skill}</span>)}
                      {(app.gap_skills||[]).slice(0,3).map((sk:any,i:number) => <span key={i} style={{ background:'#fef2f2',color:'#b91c1c',border:'1px solid #fecaca',borderRadius:5,padding:'2px 6px',fontSize:11,fontWeight:600 }}>⚠ {sk.skill}</span>)}
                    </div>
                    {app.cover_note && <div style={{ marginTop:10, color:'#475569', fontSize:13, fontStyle:'italic', borderLeft:'3px solid #6366f1', paddingLeft:10 }}>"{app.cover_note}"</div>}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6, minWidth:130 }}>
                    {app.status==='APPLIED' && <>
                      <button style={c.btn('#d97706')} onClick={() => updateAppStatus(app.id,'SHORTLISTED')}>⭐ Shortlist</button>
                      <button style={c.btn('#dc2626')} onClick={() => updateAppStatus(app.id,'REJECTED')}>✗ Reject</button>
                    </>}
                    {app.status==='SHORTLISTED' && <>
                      <button style={c.btn('#2563eb')} onClick={() => updateAppStatus(app.id,'INTERVIEW')}>📅 Interview</button>
                      <button style={c.btn('#dc2626')} onClick={() => updateAppStatus(app.id,'REJECTED')}>✗ Reject</button>
                    </>}
                    {app.status==='INTERVIEW' && <>
                      <button style={c.btn('#059669')} onClick={() => updateAppStatus(app.id,'SELECTED')}>✓ Select</button>
                      <button style={c.btn('#dc2626')} onClick={() => updateAppStatus(app.id,'REJECTED')}>✗ Reject</button>
                    </>}
                    {app.status==='SELECTED' && <span style={{ color:'#059669', fontSize:13, fontWeight:700 }}>🎉 Selected</span>}
                    {app.status==='REJECTED' && <span style={{ color:'#dc2626', fontSize:13, fontWeight:700 }}>✗ Rejected</span>}
                  </div>
                </div>
              </div>
            ))}
          </>}
        </>}

        {/* CODING ASSESSMENTS */}
        {tab==='coding-assessments' && (
          <HRCodingAssessmentsManager
            token={token}
            user={user}
            showToast={(msg: string) => alert(msg)}
          />
        )}

        {/* FACULTY HUB */}
        {tab==='faculty' && <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h2 style={{ fontSize:22, fontWeight:800, color:'#0f172a', margin:0 }}>Faculty Hub</h2>
          </div>
          <h3 style={{ fontSize:15, color:'#475569', fontWeight:700, marginBottom:14 }}>Faculty Applications Received</h3>
          {facultyApps.length===0 && <div style={{ ...c.card, textAlign:'center', color:'#64748b', padding:50 }}>No faculty applications yet. Post opportunities on the Faculty Hub to receive applications.</div>}
          {facultyApps.map((fa:any) => (
            <div key={fa.id} style={c.card}>
              <div style={{ fontWeight:800, color:'#0f172a', fontSize:15, marginBottom:4 }}>{fa.full_name} <span style={{ color:'#64748b', fontWeight:400, fontSize:13 }}>({fa.role?.replace('_',' ')})</span></div>
              <div style={{ color:'#64748b', fontSize:13, marginBottom:6 }}>{fa.email}</div>
              <div style={{ color:'#334155', fontSize:13, marginBottom:8 }}>Applied for: <strong>{fa.title}</strong> ({fa.opportunity_type})</div>
              {fa.proposal && <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:12, color:'#334155', fontSize:13, fontStyle:'italic', marginBottom:8 }}>"{fa.proposal}"</div>}
              <span style={{ background:'#e0e7ff',color:'#4338ca',borderRadius:6,padding:'3px 10px',fontSize:12,fontWeight:700 }}>{fa.status}</span>
            </div>
          ))}
        </>}

        {/* HR REPORTS CENTER */}
        {tab==='reports' && <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
            <div>
              <h2 style={{ fontSize:22, fontWeight:800, color:'#0f172a', margin:0 }}>📈 HR Recruitment & Intelligence Reports</h2>
              <p style={{ fontSize:12, color:'#64748b', marginTop:4, fontWeight:500 }}>
                Generate institutional candidate placement records, AI compatibility analyses, and export professionally formatted CSV, XLSX, and PDF documents.
              </p>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button
                disabled={downloading}
                style={{ ...c.btn('#059669'), display:'flex', alignItems:'center', gap:6, opacity: downloading ? 0.7 : 1 }}
                onClick={() => handleDownloadReport('xlsx')}
              >
                {downloading ? '⏳ Generating...' : '📥 Export Excel (.xlsx)'}
              </button>
              <button
                disabled={downloading}
                style={{ ...c.btn('#dc2626'), display:'flex', alignItems:'center', gap:6, opacity: downloading ? 0.7 : 1 }}
                onClick={() => handleDownloadReport('pdf')}
              >
                📄 Official PDF
              </button>
              <button
                disabled={downloading}
                style={{ ...c.btn('#475569'), display:'flex', alignItems:'center', gap:6, opacity: downloading ? 0.7 : 1 }}
                onClick={() => handleDownloadReport('csv')}
              >
                📊 CSV
              </button>
            </div>
          </div>

          {/* Report Type Selector Pills */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:10, marginBottom:18 }}>
            {[
              { id: 'applications', label: '📋 Applications', desc: 'All candidate submissions' },
              { id: 'coding-assessment', label: '💻 Coding Tests', desc: 'Q1/Q2 scores & proctor logs' },
              { id: 'skill-match', label: '🎯 Skill Intelligence', desc: 'Compatibility & skill gaps' },
              { id: 'shortlist', label: '⭐ Shortlisted', desc: 'Pre-selected candidates' },
              { id: 'interviews', label: '📅 Interviews', desc: 'Scheduled interview pipeline' },
              { id: 'selections', label: '🏆 Selections', desc: 'Final hires & offer letters' },
              { id: 'postings-summary', label: '📊 Postings Summary', desc: 'Role-by-role metrics' },
              { id: 'recruitment-summary', label: '📈 Executive Summary', desc: 'Company-wide analytics' },
            ].map(r => (
              <div
                key={r.id}
                onClick={() => { setReportType(r.id); fetchReportPreview(r.id); }}
                style={{
                  background: reportType === r.id ? '#0f172a' : '#ffffff',
                  color: reportType === r.id ? '#ffffff' : '#0f172a',
                  border: `1px solid ${reportType === r.id ? '#0f172a' : '#e2e8f0'}`,
                  borderRadius: 12,
                  padding: '12px 14px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  transition: 'all 0.15s ease-in-out'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 13 }}>{r.label}</div>
                <div style={{ fontSize: 11, color: reportType === r.id ? '#cbd5e1' : '#64748b', marginTop: 2 }}>{r.desc}</div>
              </div>
            ))}
          </div>

          {/* Dynamic Filters Bar */}
          <div style={{ ...c.card, padding: 16, marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
              ⚙️ Filter Report Criteria
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div>
                <label style={c.lbl}>Filter by Opportunity</label>
                <select
                  style={c.inp}
                  value={reportPostingId}
                  onChange={e => setReportPostingId(e.target.value)}
                >
                  <option value="">All Company Postings</option>
                  {postings.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.posting_type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={c.lbl}>Application Status</label>
                <select
                  style={c.inp}
                  value={reportStatus}
                  onChange={e => setReportStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="APPLIED">Applied</option>
                  <option value="SHORTLISTED">Shortlisted</option>
                  <option value="INTERVIEW">Interview</option>
                  <option value="SELECTED">Selected</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div>
                <label style={c.lbl}>Min Match Score</label>
                <select
                  style={c.inp}
                  value={reportMinMatch}
                  onChange={e => setReportMinMatch(e.target.value)}
                >
                  <option value="">Any Compatibility (0%+)</option>
                  <option value="50">50% & Above</option>
                  <option value="60">60% & Above</option>
                  <option value="70">70% & Above</option>
                  <option value="80">80% & Above</option>
                  <option value="90">90% & Above</option>
                </select>
              </div>

              <div>
                <label style={c.lbl}>Start Date</label>
                <input
                  type="date"
                  style={c.inp}
                  value={reportStartDate}
                  onChange={e => setReportStartDate(e.target.value)}
                />
              </div>

              <div>
                <label style={c.lbl}>End Date</label>
                <input
                  type="date"
                  style={c.inp}
                  value={reportEndDate}
                  onChange={e => setReportEndDate(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', marginTop: 14 }}>
              <button
                style={{ ...c.btn('#0f172a'), padding: '8px 18px', fontSize: 12 }}
                onClick={() => fetchReportPreview()}
              >
                🔍 Apply Filters & Refresh Preview
              </button>
            </div>
          </div>

          {/* Live Data Preview Section */}
          <div style={c.card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 14, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
              <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>
                  Live Data Preview ({previewCount} records matching criteria)
                </span>
                {previewLoading && <span style={{ fontSize: 11, color: '#4f46e5', fontWeight: 600 }}>Loading...</span>}
              </div>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                Showing first {previewData.length} records · Full dataset exported on download
              </span>
            </div>

            {previewData.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                No records found matching the specified filters. Try adjusting your filters.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      {Object.keys(previewData[0]).map(col => (
                        <th key={col} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#475569', textTransform: 'uppercase', fontSize: 11 }}>
                          {col.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        {Object.keys(previewData[0]).map(col => {
                          let val = row[col];
                          if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
                          return (
                            <td key={col} style={{ padding: '10px 12px', color: '#334155' }}>
                              {col === 'match_score' ? (
                                <span style={{ background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                                  {val}%
                                </span>
                              ) : col === 'application_status' ? (
                                <span style={{ background: STATUS_COLORS[val] ? `${STATUS_COLORS[val]}15` : '#f1f5f9', color: STATUS_COLORS[val] || '#334155', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                                  {val}
                                </span>
                              ) : (
                                String(val ?? '—')
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Download History Audit Log */}
          {downloadLogs.length > 0 && (
            <div style={{ ...c.card, marginTop: 18 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginTop: 0, marginBottom: 12 }}>
                🕒 Recent Report Export Audit History
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b' }}>Report Type</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b' }}>Format</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b' }}>Records</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b' }}>Exported At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {downloadLogs.map((log, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0f172a' }}>{log.report_type.toUpperCase()}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ padding: '2px 6px', borderRadius: 4, background: '#f1f5f9', fontWeight: 700, fontSize: 10 }}>
                            {log.format}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', color: '#334155' }}>{log.record_count}</td>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>}

        {/* PROFILE */}
        {tab==='profile' && <>
          <h2 style={{ fontSize:22, fontWeight:800, color:'#0f172a', marginBottom:20 }}>Company Profile</h2>
          <div style={c.card}>
            <div style={{ marginBottom:14 }}>
              <label style={c.lbl}>Company Name</label>
              <input style={c.inp} value={profileForm.company_name||''} onChange={e => setProfileForm(p=>({...p,company_name:e.target.value}))} />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={c.lbl}>Industry Sector (SIH26044 Multi-Domain)</label>
              <select style={c.inp} value={profileForm.industry_sector||'Enterprise IT Services & Product Engineering'} onChange={e => setProfileForm(p=>({...p,industry_sector:e.target.value}))}>
                <option value="🌿 AYUSH & Digital Health-Tech">🌿 AYUSH & Digital Health-Tech (Ayurveda, Yoga, Unani, Siddha, Homoeopathy & Telemedicine)</option>
                <option value="🤖 AI / Machine Learning & Data Science">🤖 AI / Machine Learning & Data Science</option>
                <option value="☁️ Cloud Computing, DevOps & Cyber Security">☁️ Cloud Computing, DevOps & Cyber Security</option>
                <option value="💼 Enterprise IT Services & Product Engineering">💼 Enterprise IT Services & Product Engineering</option>
                <option value="💳 FinTech, Banking & Web3">💳 FinTech, Banking & Web3</option>
                <option value="⚡ Embedded Systems, IoT & Robotics">⚡ Embedded Systems, IoT & Robotics</option>
                <option value="🧬 Bio-Informatics & Healthcare Analytics">🧬 Bio-Informatics & Healthcare Analytics</option>
                <option value="🎓 Ed-Tech & E-Learning Platforms">🎓 Ed-Tech & E-Learning Platforms</option>
              </select>
            </div>
            {([['company_size','Company Size'],['hq_location','HQ Location'],['website','Website URL']] as [string,string][]).map(([field,label]) => (
              <div key={field} style={{ marginBottom:14 }}>
                <label style={c.lbl}>{label}</label>
                <input style={c.inp} value={(profileForm as any)[field]||''} onChange={e => setProfileForm(p=>({...p,[field]:e.target.value}))} />
              </div>
            ))}
            <div style={{ marginBottom:16 }}>
              <label style={c.lbl}>Company Description</label>
              <textarea style={{ ...c.inp, minHeight:100, resize:'vertical' }} value={profileForm.description||''} onChange={e => setProfileForm(p=>({...p,description:e.target.value}))} />
            </div>
            <button style={c.btn('#0f172a')} onClick={async()=>{ const r=await fetch(`${API}/api/industry/profile`,{method:'PUT',headers:h,body:JSON.stringify(profileForm)}); if(r.ok){showToast('Profile saved!');fetchProfile();}else showToast('Save failed'); }}>Save Profile</button>
          </div>
        </>}
      </div>

      {/* CREATE POSTING MODAL */}
      {showPostingForm && (
        <div style={c.modal} onClick={e=>{ if(e.target===e.currentTarget) setShowPostingForm(false); }}>
          <div style={c.mbox}>
            <h3 style={{ marginTop:0, marginBottom:20, fontSize:18, fontWeight:800, color:'#0f172a' }}>Create New Posting</h3>
            <div style={{ marginBottom:14 }}>
              <label style={c.lbl}>Posting Type *</label>
              <select style={c.inp} value={postingForm.posting_type} onChange={e=>setPostingForm(p=>({...p,posting_type:e.target.value}))}>
                {POSTING_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {([['title','Title *'],['location','Location'],['stipend_or_salary','Stipend / Salary'],['duration','Duration (e.g. 2 months)'],['min_cgpa','Minimum CGPA'],['total_seats','Total Seats'],['eligibility_notes','Eligibility Notes']] as [string,string][]).map(([field,label])=>(
              <div key={field} style={{ marginBottom:12 }}>
                <label style={c.lbl}>{label}</label>
                <input style={c.inp} value={(postingForm as any)[field]||''} onChange={e=>setPostingForm(p=>({...p,[field]:e.target.value}))} />
              </div>
            ))}
            <div style={{ marginBottom:12 }}>
              <label style={c.lbl}>Work Mode</label>
              <select style={c.inp} value={postingForm.mode} onChange={e=>setPostingForm(p=>({...p,mode:e.target.value}))}>
                {['Remote','Onsite','Hybrid'].map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={c.lbl}>Application Deadline</label>
              <input type="datetime-local" style={c.inp} value={postingForm.application_deadline} onChange={e=>setPostingForm(p=>({...p,application_deadline:e.target.value}))} />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={c.lbl}>Description</label>
              <textarea style={{ ...c.inp, minHeight:80, resize:'vertical' }} value={postingForm.description} onChange={e=>setPostingForm(p=>({...p,description:e.target.value}))} />
            </div>
            {/* Required Skills Builder */}
            <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:14, marginBottom:16 }}>
              <label style={{ ...c.lbl, color:'#4338ca', marginBottom:10 }}>Required Skills (for AI matching)</label>
              <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                <input style={{ ...c.inp, flex:2, minWidth:100 }} placeholder="Skill name (e.g. React)" value={newSkill.skill} onChange={e=>setNewSkill(p=>({...p,skill:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&addSkill()} />
                <select style={{ ...c.inp, flex:1, minWidth:110 }} value={newSkill.level} onChange={e=>setNewSkill(p=>({...p,level:parseInt(e.target.value)}))}>
                  {SKILL_LEVELS.map((l,i)=><option key={l} value={i+1}>{l}</option>)}
                </select>
                <button style={{ ...c.btn('#4f46e5'), padding:'9px 14px', flexShrink:0 }} onClick={addSkill}>+ Add</button>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {postingForm.required_skills.map((sk,i)=>(
                  <span key={i} style={{ background:'#e0e7ff', border:'1px solid #c7d2fe', color:'#3730a3', borderRadius:6, padding:'4px 10px', fontSize:12, display:'flex', alignItems:'center', gap:6, fontWeight:600 }}>
                    {sk.skill} ({SKILL_LEVELS[sk.level-1]||'Mid'})
                    <button style={{ background:'none', border:'none', color:'#dc2626', cursor:'pointer', padding:0, fontSize:14, lineHeight:1, fontWeight:700 }} onClick={()=>setPostingForm(p=>({...p,required_skills:p.required_skills.filter((_,idx)=>idx!==i)}))}>×</button>
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button style={c.btn('#64748b')} onClick={()=>setShowPostingForm(false)}>Cancel</button>
              <button style={c.btn('#0f172a')} onClick={submitPosting}>Create Posting</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
