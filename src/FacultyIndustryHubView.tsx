import React, { useState, useEffect, useCallback } from 'react';
import { 
  Briefcase, 
  Search, 
  Plus, 
  Clock, 
  Award, 
  MapPin, 
  Building2, 
  Send, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  UserCheck, 
  Sparkles, 
  Filter, 
  Calendar,
  Layers,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
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
  logo_url?: string;
  status: string;
  application_count?: number;
}

interface FacultyApplication {
  id: string;
  opportunity_id: string;
  title?: string;
  opportunity_title?: string;
  opportunity_type: string;
  duration?: string;
  compensation?: string;
  company_name?: string;
  industry_sector?: string;
  proposal: string;
  status: string;
  decision_note?: string;
  created_at: string;
  faculty_name?: string;
  faculty_email?: string;
  faculty_role?: string;
  full_name?: string;
  email?: string;
  role?: string;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  FDP: { label: 'Faculty Dev Program', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  CONSULTANCY: { label: 'Consultancy Advisory', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  RESEARCH: { label: 'Sponsored Research', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  WORKSHOP: { label: 'Technical Workshop', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  GUEST_LECTURE: { label: 'Guest Lecture', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
};

export default function FacultyIndustryHubView({ token, user }: { token: string; user: any }) {
  const isIndustry = user?.role === 'INDUSTRY';
  const isAcademic = ['HOD', 'CLASS_ADVISOR', 'SUPREME_ADMIN'].includes(user?.role || '');

  const [opportunities, setOpportunities] = useState<FacultyOpportunity[]>([]);
  const [applications, setApplications] = useState<FacultyApplication[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'proposals'>('browse');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  
  // Faculty apply modal
  const [selectedOpp, setSelectedOpp] = useState<FacultyOpportunity | null>(null);
  const [proposalText, setProposalText] = useState<string>('');
  const [submittingProposal, setSubmittingProposal] = useState<boolean>(false);

  // Industry post new opportunity modal
  const [showPostModal, setShowPostModal] = useState<boolean>(false);
  const [newOpp, setNewOpp] = useState({
    opportunity_type: 'FDP',
    title: '',
    description: '',
    compensation: '',
    duration: '',
    location: '',
    mode: 'Hybrid',
    application_deadline: ''
  });
  const [postingOpp, setPostingOpp] = useState<boolean>(false);

  // Decision review modal for industry
  const [reviewingApp, setReviewingApp] = useState<FacultyApplication | null>(null);
  const [decisionAction, setDecisionAction] = useState<'ACCEPTED' | 'SHORTLISTED' | 'REJECTED'>('ACCEPTED');
  const [decisionNote, setDecisionNote] = useState<string>('');
  const [submittingDecision, setSubmittingDecision] = useState<boolean>(false);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const headers = React.useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }), [token]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
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

  const fetchApplications = useCallback(async () => {
    try {
      const url = isIndustry ? `${API}/api/industry/faculty-applications` : `${API}/api/faculty/my-applications`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error('Failed to fetch applications', err);
    }
  }, [isIndustry, headers]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchOpportunities(), fetchApplications()]);
    setLoading(false);
  }, [fetchOpportunities, fetchApplications]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Submit faculty proposal
  const handleApply = async () => {
    if (!selectedOpp) return;
    if (!proposalText.trim()) {
      showToast('Please provide your collaboration pitch or syllabus outline', 'error');
      return;
    }
    setSubmittingProposal(true);
    try {
      const res = await fetch(`${API}/api/faculty/opportunities/${selectedOpp.id}/apply`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ proposal: proposalText }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Collaboration proposal submitted successfully!');
        setSelectedOpp(null);
        setProposalText('');
        fetchApplications();
        fetchOpportunities();
      } else {
        showToast(data.error || 'Submission failed', 'error');
      }
    } catch (err) {
      showToast('Network error while submitting proposal', 'error');
    } finally {
      setSubmittingProposal(false);
    }
  };

  // Industry post opportunity
  const handlePostOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpp.title.trim() || !newOpp.description.trim()) {
      showToast('Title and Description are required', 'error');
      return;
    }
    setPostingOpp(true);
    try {
      const res = await fetch(`${API}/api/industry/faculty-opportunities`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newOpp)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Faculty opportunity created and published!');
        setShowPostModal(false);
        setNewOpp({
          opportunity_type: 'FDP',
          title: '',
          description: '',
          compensation: '',
          duration: '',
          location: '',
          mode: 'Hybrid',
          application_deadline: ''
        });
        fetchOpportunities();
      } else {
        showToast(data.error || 'Failed to create opportunity', 'error');
      }
    } catch (err) {
      showToast('Network error while creating opportunity', 'error');
    } finally {
      setPostingOpp(false);
    }
  };

  // Industry update proposal status
  const handleUpdateProposalStatus = async () => {
    if (!reviewingApp) return;
    setSubmittingDecision(true);
    try {
      const res = await fetch(`${API}/api/industry/faculty-applications/${reviewingApp.id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: decisionAction,
          decision_note: decisionNote
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Proposal status updated to ${decisionAction}`);
        setReviewingApp(null);
        setDecisionNote('');
        fetchApplications();
      } else {
        showToast(data.error || 'Failed to update status', 'error');
      }
    } catch (err) {
      showToast('Error updating proposal status', 'error');
    } finally {
      setSubmittingDecision(false);
    }
  };

  return (
    <div className="min-h-full bg-zinc-50 text-zinc-900 font-sans p-4 md:p-8">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
          toast.type === 'success' ? 'bg-zinc-900 text-white border-zinc-800' : 'bg-red-600 text-white border-red-700'
        }`}>
          {toast.type === 'success' ? <Sparkles className="w-5 h-5 text-amber-400" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-xs md:text-sm font-semibold">{toast.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-3xl border border-zinc-200 shadow-2xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" />
            {isIndustry ? 'Corporate Academic Partnerships' : 'Faculty Industry Collaboration'}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight">
            {isIndustry ? 'Faculty Enablement & Research Hub' : 'Industry Faculty Hub'}
          </h1>
          <p className="text-zinc-500 text-xs md:text-sm font-medium">
            {isIndustry 
              ? 'Publish FDPs, sponsored research grants, consultancy projects, and collaborate with distinguished faculty members.'
              : 'Engage with corporate partners on Faculty Development Programs, sponsored research grants, and advisory consultancies.'}
          </p>
        </div>

        {isIndustry && (
          <button
            onClick={() => setShowPostModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs md:text-sm rounded-2xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Post Faculty Opportunity
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setActiveTab('browse')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all ${
            activeTab === 'browse'
              ? 'bg-zinc-900 text-white shadow-sm'
              : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          <Search className="w-4 h-4" />
          Available Opportunities
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
            activeTab === 'browse' ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-600'
          }`}>
            {opportunities.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('proposals')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all ${
            activeTab === 'proposals'
              ? 'bg-zinc-900 text-white shadow-sm'
              : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          {isIndustry ? 'Received Faculty Proposals' : 'My Submitted Proposals'}
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
            activeTab === 'proposals' ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-600'
          }`}>
            {applications.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Browse Opportunities */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5" /> Category:
            </span>
            {['ALL', 'FDP', 'CONSULTANCY', 'RESEARCH', 'GUEST_LECTURE', 'WORKSHOP'].map((cat) => {
              const active = filterType === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterType(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    active
                      ? 'bg-zinc-900 text-white shadow-2xs'
                      : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  {cat === 'ALL' ? 'All Opportunities' : cat.replace('_', ' ')}
                </button>
              );
            })}
          </div>

          {/* Opportunities Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-zinc-200 rounded-3xl p-6 h-64 animate-pulse" />
              ))}
            </div>
          ) : opportunities.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-800">No faculty opportunities available for {filterType.replace('_', ' ')}</h3>
              <p className="text-zinc-500 text-xs max-w-md mx-auto">
                {isIndustry 
                  ? 'Click "+ Post Faculty Opportunity" above to create and invite academic faculty to collaborate.'
                  : 'Check back soon or choose another category filter to explore other institutional programs.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {opportunities.map((opp) => {
                const conf = TYPE_CONFIG[opp.opportunity_type] || TYPE_CONFIG['FDP'];
                return (
                  <div
                    key={opp.id}
                    className="bg-white border border-zinc-200 hover:border-zinc-300 rounded-3xl p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-200 group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${conf.bg} ${conf.color} ${conf.border}`}>
                          {conf.label}
                        </span>
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-50 px-2.5 py-0.5 rounded-lg border border-zinc-200">
                          {opp.mode || 'Hybrid'}
                        </span>
                      </div>

                      {/* Title & Company */}
                      <h3 className="text-base font-black text-zinc-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-1">
                        {opp.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 mb-3">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{opp.company_name}</span>
                        {opp.industry_sector && (
                          <span className="text-zinc-400 font-medium">({opp.industry_sector})</span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-zinc-600 line-clamp-3 leading-relaxed mb-4">
                        {opp.description}
                      </p>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-3 rounded-2xl border border-zinc-100 text-xs mb-4">
                        <div className="flex items-center gap-1.5 text-zinc-600">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="truncate font-semibold">{opp.duration || 'Flexible'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-700">
                          <Award className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="truncate font-bold">{opp.compensation || 'Honorarium'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-600 col-span-2">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="truncate font-medium">{opp.location || 'Hybrid / Virtual'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                      <div className="text-[11px] font-semibold text-zinc-400">
                        {opp.application_count ? `${opp.application_count} proposals` : 'Open for proposals'}
                      </div>
                      
                      {!isIndustry ? (
                        <button
                          onClick={() => setSelectedOpp(opp)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all"
                        >
                          Submit Proposal
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl">
                          Active Opportunity
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Proposals / Applications */}
      {activeTab === 'proposals' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-800">
                {isIndustry ? 'No faculty proposals received yet' : 'You have not submitted any proposals yet'}
              </h3>
              <p className="text-zinc-500 text-xs max-w-md mx-auto">
                {isIndustry 
                  ? 'Faculty applications submitted by academic professors and advisors will appear here for your review.'
                  : 'Browse available opportunities in the first tab and submit your collaboration pitch.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {applications.map((app) => {
                const conf = TYPE_CONFIG[app.opportunity_type] || TYPE_CONFIG['FDP'];
                const applicantName = app.faculty_name || app.full_name || 'Faculty Member';
                const applicantEmail = app.faculty_email || app.email || '';
                const applicantRole = app.faculty_role || app.role || 'Faculty';

                return (
                  <div
                    key={app.id}
                    className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xs space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${conf.bg} ${conf.color} ${conf.border}`}>
                            {conf.label}
                          </span>
                          <span className="text-xs text-zinc-400 font-medium">
                            Submitted on {new Date(app.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-zinc-900">
                          {app.title || app.opportunity_title || 'Faculty Collaboration'}
                        </h3>
                        {app.company_name && (
                          <div className="text-xs font-semibold text-zinc-500">
                            Partner: {app.company_name}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                          app.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          app.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          app.status === 'SHORTLISTED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {app.status}
                        </span>

                        {isIndustry && (
                          <button
                            onClick={() => {
                              setReviewingApp(app);
                              setDecisionAction(app.status === 'ACCEPTED' ? 'ACCEPTED' : 'ACCEPTED');
                              setDecisionNote(app.decision_note || '');
                            }}
                            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all"
                          >
                            Review & Decide
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Applicant details for Industry */}
                    {isIndustry && (
                      <div className="flex items-center gap-4 bg-zinc-50 p-3 rounded-2xl border border-zinc-100 text-xs">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                          {applicantName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900">{applicantName} <span className="font-normal text-zinc-500">({applicantRole})</span></div>
                          <div className="text-zinc-500">{applicantEmail}</div>
                        </div>
                      </div>
                    )}

                    {/* Proposal Pitch Text */}
                    {app.proposal && (
                      <div className="bg-zinc-50/80 p-4 rounded-2xl border border-zinc-100 text-xs text-zinc-700 space-y-1">
                        <div className="font-bold text-zinc-900 uppercase tracking-wider text-[10px] text-indigo-600">
                          Faculty Collaboration Pitch & Scope:
                        </div>
                        <p className="whitespace-pre-line leading-relaxed">{app.proposal}</p>
                      </div>
                    )}

                    {/* Decision note if any */}
                    {app.decision_note && (
                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-800">
                        <span className="font-bold">Partner Feedback:</span> {app.decision_note}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Submit Proposal (for Faculty) */}
      {selectedOpp && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-2">
                <Send className="w-3 h-3" /> Submit Proposal
              </div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight">{selectedOpp.title}</h2>
              <p className="text-zinc-500 text-xs mt-0.5">Partner: {selectedOpp.company_name} ({selectedOpp.industry_sector || 'Tech'})</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Collaboration Pitch & Proposed Curriculum / Scope
              </label>
              <textarea
                value={proposalText}
                onChange={(e) => setProposalText(e.target.value)}
                placeholder="Highlight your academic focus, relevant research publications, proposed delivery syllabus for FDP, or advisory framework..."
                rows={5}
                className="w-full p-3.5 text-xs md:text-sm bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-zinc-900 focus:bg-white transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOpp(null)}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={submittingProposal}
                className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {submittingProposal ? 'Submitting...' : 'Submit Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Post New Faculty Opportunity (for Industry HR) */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight">Post Faculty Opportunity</h2>
              <p className="text-zinc-500 text-xs mt-0.5">Publish a Faculty Development Program, Consultancy, or Sponsored Research Grant</p>
            </div>

            <form onSubmit={handlePostOpportunity} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Opportunity Type
                </label>
                <select
                  value={newOpp.opportunity_type}
                  onChange={(e) => setNewOpp({ ...newOpp, opportunity_type: e.target.value })}
                  className="w-full p-3 text-xs md:text-sm bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-zinc-900"
                >
                  <option value="FDP">FDP (Faculty Development Program)</option>
                  <option value="CONSULTANCY">Consultancy Advisory Grant</option>
                  <option value="RESEARCH">Sponsored Research Project</option>
                  <option value="GUEST_LECTURE">Guest Lecture / Keynote</option>
                  <option value="WORKSHOP">Hands-on Technical Masterclass</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Advanced Faculty Enablement: Generative AI & Cloud Architecture"
                  value={newOpp.title}
                  onChange={(e) => setNewOpp({ ...newOpp, title: e.target.value })}
                  className="w-full p-3 text-xs md:text-sm bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-zinc-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Compensation / Honorarium / Grant
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., ₹50,000 Honorarium / Grant"
                    value={newOpp.compensation}
                    onChange={(e) => setNewOpp({ ...newOpp, compensation: e.target.value })}
                    className="w-full p-3 text-xs md:text-sm bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Duration
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 2 Weeks / 3 Months"
                    value={newOpp.duration}
                    onChange={(e) => setNewOpp({ ...newOpp, duration: e.target.value })}
                    className="w-full p-3 text-xs md:text-sm bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Mode
                  </label>
                  <select
                    value={newOpp.mode}
                    onChange={(e) => setNewOpp({ ...newOpp, mode: e.target.value })}
                    className="w-full p-3 text-xs md:text-sm bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-zinc-900"
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                    <option value="Onsite">Onsite</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Corporate Campus / Campus Auditorium"
                    value={newOpp.location}
                    onChange={(e) => setNewOpp({ ...newOpp, location: e.target.value })}
                    className="w-full p-3 text-xs md:text-sm bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Detailed Description & Scope
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Outline the objectives, eligibility, expected outcomes, and technical domains..."
                  value={newOpp.description}
                  onChange={(e) => setNewOpp({ ...newOpp, description: e.target.value })}
                  className="w-full p-3.5 text-xs md:text-sm bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-zinc-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={postingOpp}
                  className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {postingOpp ? 'Publishing...' : 'Publish Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Industry Decision Review for Proposals */}
      {reviewingApp && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-2">
                <UserCheck className="w-3 h-3" /> Proposal Review
              </div>
              <h2 className="text-lg font-black text-zinc-900 tracking-tight">
                Review Faculty Proposal
              </h2>
              <p className="text-zinc-500 text-xs">
                Applicant: {reviewingApp.faculty_name || reviewingApp.full_name || 'Faculty Member'}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Select Decision Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ACCEPTED', 'SHORTLISTED', 'REJECTED'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setDecisionAction(st)}
                      className={`py-2 px-2 rounded-xl text-xs font-extrabold border transition-all ${
                        decisionAction === st
                          ? st === 'ACCEPTED' ? 'bg-emerald-600 text-white border-emerald-600' :
                            st === 'SHORTLISTED' ? 'bg-blue-600 text-white border-blue-600' :
                            'bg-rose-600 text-white border-rose-600'
                          : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Decision Note / Corporate Feedback (Optional)
                </label>
                <textarea
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder="Add feedback, next steps, or meeting schedules for the faculty member..."
                  rows={3}
                  className="w-full p-3 text-xs bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-zinc-900 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReviewingApp(null)}
                className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateProposalStatus}
                disabled={submittingDecision}
                className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {submittingDecision ? 'Saving...' : 'Save Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
