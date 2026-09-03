import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from './config';

const API = API_URL || '';

interface FacultyOpportunity {
  id: string;
  company_id: string;
  opportunity_type: string;
  title: string;
  description: string;
  compensation: string;
  duration: string;
  location: string;
  mode: string;
  application_deadline: string;
  company_name: string;
  industry_sector: string;
  logo_url: string;
  status: string;
}

interface FacultyApplication {
  id: string;
  opportunity_id: string;
  title: string;
  opportunity_type: string;
  duration: string;
  compensation: string;
  company_name: string;
  proposal: string;
  status: string;
  created_at: string;
}

export default function FacultyIndustryHubView({ token, user }: { token: string; user: any }) {
  const [opportunities, setOpportunities] = useState<FacultyOpportunity[]>([]);
  const [myApplications, setMyApplications] = useState<FacultyApplication[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'my_apps'>('browse');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedOpp, setSelectedOpp] = useState<FacultyOpportunity | null>(null);
  const [proposalText, setProposalText] = useState<string>('');
  const [applying, setApplying] = useState<boolean>(false);
  const [toast, setToast] = useState<string>('');

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchOpportunities = useCallback(async () => {
    try {
      let url = `${API}/api/faculty/opportunities`;
      if (filterType !== 'ALL') {
        url += `?type=${filterType}`;
      }
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data);
      }
    } catch (err) {
      console.error('Failed to fetch faculty opportunities', err);
    }
  }, [filterType, headers]);

  const fetchMyApplications = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/faculty/my-applications`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMyApplications(data);
      }
    } catch (err) {
      console.error('Failed to fetch my applications', err);
    }
  }, [headers]);

  useEffect(() => {
    fetchOpportunities();
    fetchMyApplications();
  }, [fetchOpportunities, fetchMyApplications]);

  const handleApply = async () => {
    if (!selectedOpp) return;
    setApplying(true);
    try {
      const res = await fetch(`${API}/api/faculty/opportunities/${selectedOpp.id}/apply`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ proposal: proposalText }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Application / Proposal submitted successfully!');
        setSelectedOpp(null);
        setProposalText('');
        fetchMyApplications();
      } else {
        showToast(data.error || 'Submission failed');
      }
    } catch (err) {
      showToast('Network error while submitting application');
    } finally {
      setApplying(false);
    }
  };

  const s: Record<string, React.CSSProperties> = {
    container: {
      minHeight: '100vh',
      background: '#F5F5F4',
      color: '#0f172a',
      fontFamily: "'Inter', sans-serif",
      padding: '24px',
    },
    card: {
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '16px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
    },
    tabBtn: (active: boolean) => ({
      padding: '10px 20px',
      borderRadius: '10px',
      fontWeight: 700,
      fontSize: '13px',
      cursor: 'pointer',
      border: active ? '1px solid #0f172a' : '1px solid #e2e8f0',
      background: active ? '#0f172a' : '#ffffff',
      color: active ? '#ffffff' : '#475569',
      transition: 'all 0.15s ease-in-out',
    }),
    badge: (color: string) => ({
      background: `${color}15`,
      color: color,
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 700,
      border: `1px solid ${color}40`,
    }),
    button: (bg = '#0f172a') => ({
      background: bg,
      color: '#ffffff',
      border: 'none',
      padding: '9px 18px',
      borderRadius: '10px',
      fontWeight: 700,
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'all 0.15s',
    }),
    modal: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    },
    modalBox: {
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '20px',
      padding: '28px',
      maxWidth: '600px',
      width: '100%',
      color: '#0f172a',
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    },
    toast: {
      position: 'fixed' as const,
      bottom: '24px',
      right: '24px',
      background: '#059669',
      color: '#ffffff',
      borderRadius: '10px',
      padding: '12px 24px',
      fontWeight: 700,
      zIndex: 9999,
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    },
  };

  const TYPE_COLORS: Record<string, string> = {
    FDP: '#4f46e5',
    CONSULTANCY: '#059669',
    RESEARCH: '#db2777',
    WORKSHOP: '#2563eb',
    GUEST_LECTURE: '#d97706',
  };

  return (
    <div style={s.container}>
      {toast && <div style={s.toast}>✨ {toast}</div>}

      {/* Header Subtitle */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: '#64748b', margin: 0, fontSize: '14px', fontWeight: 600 }}>
          Engage with corporate partners on FDPs, sponsored research, consultancy, and expert sessions
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button style={s.tabBtn(activeTab === 'browse')} onClick={() => setActiveTab('browse')}>
          🔍 Available Opportunities ({opportunities.length})
        </button>
        <button style={s.tabBtn(activeTab === 'my_apps')} onClick={() => setActiveTab('my_apps')}>
          📝 My Proposals & Applications ({myApplications.length})
        </button>
      </div>

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <>
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {['ALL', 'FDP', 'CONSULTANCY', 'RESEARCH', 'GUEST_LECTURE', 'WORKSHOP'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  background: filterType === t ? '#0f172a' : '#ffffff',
                  color: filterType === t ? '#ffffff' : '#475569',
                  border: `1px solid ${filterType === t ? '#0f172a' : '#e2e8f0'}`,
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-in-out',
                }}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>

          {opportunities.length === 0 ? (
            <div style={{ ...s.card, textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: 600 }}>
              No faculty opportunities available for the selected category.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
              {opportunities.map((opp) => (
                <div key={opp.id} style={s.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={s.badge(TYPE_COLORS[opp.opportunity_type] || '#4f46e5')}>
                      {opp.opportunity_type.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                      Mode: {opp.mode}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px 0', color: '#0f172a' }}>
                    {opp.title}
                  </h3>

                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#4f46e5', marginBottom: '10px' }}>
                    🏢 {opp.company_name} ({opp.industry_sector || 'Tech'})
                  </div>

                  <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 14px 0', lineHeight: 1.5, maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {opp.description}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', fontSize: '12px', color: '#64748b' }}>
                    <div>⏱ Duration: <strong style={{ color: '#0f172a' }}>{opp.duration || 'Flexible'}</strong></div>
                    <div>💰 Grant: <strong style={{ color: '#059669' }}>{opp.compensation || 'Honorarium'}</strong></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button style={s.button('#0f172a')} onClick={() => setSelectedOpp(opp)}>
                      Submit Proposal →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* My Applications Tab */}
      {activeTab === 'my_apps' && (
        <>
          {myApplications.length === 0 ? (
            <div style={{ ...s.card, textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: 600 }}>
              You haven't submitted any faculty proposals yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myApplications.map((app) => (
                <div key={app.id} style={s.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <span style={s.badge(TYPE_COLORS[app.opportunity_type] || '#4f46e5')}>
                        {app.opportunity_type.replace('_', ' ')}
                      </span>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px 0' }}>
                        {app.title}
                      </h3>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        Company: {app.company_name} · Submitted on {new Date(app.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span style={s.badge(app.status === 'APPLIED' ? '#d97706' : '#059669')}>
                      {app.status}
                    </span>
                  </div>

                  {app.proposal && (
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#334155' }}>
                      <strong>Proposal Pitch:</strong> {app.proposal}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Proposal Submission Modal */}
      {selectedOpp && (
        <div style={s.modal} onClick={(e) => e.target === e.currentTarget && setSelectedOpp(null)}>
          <div style={s.modalBox}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>
              Submit Collaboration Proposal
            </h3>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px 0', fontWeight: 600 }}>
              For: {selectedOpp.title} ({selectedOpp.company_name})
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#4f46e5', marginBottom: '8px' }}>
                Proposal Pitch / Scope of Collaboration
              </label>
              <textarea
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '12px',
                  color: '#0f172a',
                  fontSize: '13px',
                  minHeight: '120px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                placeholder="Detail your research domain, proposed syllabus for FDP, consulting methodology, or lecture focus areas..."
                value={proposalText}
                onChange={(e) => setProposalText(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button style={s.button('#64748b')} onClick={() => setSelectedOpp(null)}>
                Cancel
              </button>
              <button style={s.button('#0f172a')} onClick={handleApply} disabled={applying}>
                {applying ? 'Submitting...' : 'Submit Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
