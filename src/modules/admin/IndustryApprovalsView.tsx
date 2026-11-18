import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Clock, CheckCircle2, Building2, Search, ExternalLink, ShieldCheck,
  AlertTriangle, Mail, Phone, Globe, MapPin, XCircle, Check, Loader2
} from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { API_URL } from '../../config';
import { cn } from '../../lib/utils';
import type { User, ToastType } from '../../types';

export interface IndustryApprovalsViewProps {
  user: User | null;
  token: string | null;
  addToast?: (msg: string, type?: ToastType) => void;
}

export function IndustryApprovalsView({
  user,
  token,
  addToast = () => {},
}: IndustryApprovalsViewProps) {
  const isFetchingIndustryRef = useRef(false);

  // Industry Approvals & Partner Management State
  const [pendingIndustryList, setPendingIndustryList] = useState<any[]>([]);
  const [allIndustryList, setAllIndustryList] = useState<any[]>([]);
  const [industryActionLoading, setIndustryActionLoading] = useState<string | null>(null);
  const [industryRejectModal, setIndustryRejectModal] = useState<any | null>(null);
  const [industryRejectReason, setIndustryRejectReason] = useState('');
  const [industrySearchTerm, setIndustrySearchTerm] = useState('');
  const [industryActiveTab, setIndustryActiveTab] = useState<'PENDING' | 'ALL'>('PENDING');

  const fetchIndustryData = async (passedToken?: string) => {
    if (isFetchingIndustryRef.current) return;
    isFetchingIndustryRef.current = true;
    try {
      const activeUser = user || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);
      if (!activeUser || (activeUser.role !== 'SUPREME_ADMIN' && activeUser.role !== 'HOD')) return;
      const activeToken = passedToken || token || localStorage.getItem('token');
      if (!activeToken) return;
      const headers = { Authorization: `Bearer ${activeToken}` };
      const [pendingRes, listRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/industry/pending`, { headers }),
        fetch(`${API_URL}/api/admin/industry/list`, { headers })
      ]);
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPendingIndustryList(Array.isArray(pendingData) ? pendingData : []);
      }
      if (listRes.ok) {
        const listData = await listRes.json();
        setAllIndustryList(Array.isArray(listData) ? listData : []);
      }
    } catch (e) {
      console.error('Failed to fetch industry partner data', e);
    } finally {
      isFetchingIndustryRef.current = false;
    }
  };

  const handleApproveIndustry = async (userId: string, approved: boolean, reason?: string) => {
    setIndustryActionLoading(userId);
    try {
      const activeToken = token || localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/industry/approve/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeToken}` },
        body: JSON.stringify({ approved, rejection_reason: reason })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(approved ? '🎉 Corporate Partner verified and approved successfully!' : 'Industry account application rejected.', approved ? 'success' : 'info');
        setIndustryRejectModal(null);
        setIndustryRejectReason('');
        await fetchIndustryData();
      } else {
        addToast(data.error || 'Approval action failed', 'error');
      }
    } catch (e) {
      addToast('Network error while processing request', 'error');
    } finally {
      setIndustryActionLoading(null);
    }
  };


  useEffect(() => {
    fetchIndustryData();
  }, [token, user]);

  return (
                <motion.div
                  key="industry-approvals"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full h-full flex flex-col min-h-0"
                >
                  <PageLayout>
                    {/* Header Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <Card className="p-5 border-amber-200 bg-amber-50/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Approvals</p>
                            <p className="text-3xl font-black text-amber-900 mt-1">{pendingIndustryList.length}</p>
                          </div>
                          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm">
                            <Clock size={22} />
                          </div>
                        </div>
                      </Card>

                      <Card className="p-5 border-emerald-200 bg-emerald-50/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Verified Partners</p>
                            <p className="text-3xl font-black text-emerald-900 mt-1">
                              {allIndustryList.filter(c => c.is_verified).length}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                            <CheckCircle2 size={22} />
                          </div>
                        </div>
                      </Card>

                      <Card className="p-5 border-indigo-200 bg-indigo-50/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Total Registered</p>
                            <p className="text-3xl font-black text-indigo-900 mt-1">{allIndustryList.length}</p>
                          </div>
                          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
                            <Building2 size={22} />
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 mb-6">
                      <button
                        onClick={() => setIndustryActiveTab('PENDING')}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                          industryActiveTab === 'PENDING'
                            ? "bg-zinc-900 text-white shadow-sm"
                            : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
                        )}
                      >
                        <Clock size={15} />
                        <span>Pending Approvals</span>
                        {pendingIndustryList.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black">
                            {pendingIndustryList.length}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => setIndustryActiveTab('ALL')}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                          industryActiveTab === 'ALL'
                            ? "bg-zinc-900 text-white shadow-sm"
                            : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
                        )}
                      >
                        <Building2 size={15} />
                        <span>All Industry Partners</span>
                        <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-black">
                          {allIndustryList.length}
                        </span>
                      </button>
                    </div>

                    {/* Tab Content: Pending */}
                    {industryActiveTab === 'PENDING' && (
                      <div>
                        {pendingIndustryList.length === 0 ? (
                          <Card className="p-12 text-center bg-white border-dashed border-2 border-zinc-200 rounded-3xl">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                              <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900">No Pending Approvals</h3>
                            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                              All registered corporate accounts have been verified. New industry registrations will appear here for review.
                            </p>
                          </Card>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {pendingIndustryList.map((company) => (
                              <Card key={company.id} className="p-6 border-zinc-200 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                <div className="space-y-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg shrink-0">
                                        {(company.company_name || 'C').charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <h4 className="font-black text-lg text-zinc-900 leading-tight">
                                          {company.company_name}
                                        </h4>
                                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold tracking-wider uppercase">
                                          {company.industry_sector || 'Information Technology'}
                                        </span>
                                      </div>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200 shrink-0">
                                      Pending Approval
                                    </span>
                                  </div>

                                  <div className="space-y-2 text-xs text-zinc-600 bg-zinc-50 p-3.5 rounded-xl">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-zinc-500">Recruiter / HR:</span>
                                      <span className="font-bold text-zinc-900">{company.full_name || '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-zinc-500">Work Email:</span>
                                      <a href={`mailto:${company.email}`} className="font-bold text-indigo-600 hover:underline">
                                        {company.email || company.username}
                                      </a>
                                    </div>
                                    {company.hq_location && (
                                      <div className="flex items-center justify-between">
                                        <span className="font-semibold text-zinc-500">Location:</span>
                                        <span className="font-medium text-zinc-700">{company.hq_location}</span>
                                      </div>
                                    )}
                                    {company.website && (
                                      <div className="flex items-center justify-between">
                                        <span className="font-semibold text-zinc-500">Website:</span>
                                        <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer" className="font-bold text-indigo-600 hover:underline truncate max-w-[200px]">
                                          {company.website}
                                        </a>
                                      </div>
                                    )}
                                  </div>

                                  {company.description && (
                                    <p className="text-xs text-zinc-600 bg-white border border-zinc-100 p-3 rounded-xl line-clamp-3">
                                      {company.description}
                                    </p>
                                  )}

                                  {company.registered_at && (
                                    <p className="text-[11px] text-zinc-400">
                                      Registered: {new Date(company.registered_at).toLocaleString()}
                                    </p>
                                  )}
                                </div>

                                <div className="flex gap-3 pt-5 mt-4 border-t border-zinc-100">
                                  <Button
                                    variant="outline"
                                    onClick={() => setIndustryRejectModal(company)}
                                    disabled={industryActionLoading === company.user_id}
                                    className="flex-1 rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50 font-bold text-xs"
                                  >
                                    Deny / Reject
                                  </Button>
                                  <Button
                                    onClick={() => handleApproveIndustry(company.user_id, true)}
                                    disabled={industryActionLoading === company.user_id}
                                    className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
                                  >
                                    {industryActionLoading === company.user_id ? 'Approving...' : '✓ Approve Company'}
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab Content: All Partners Directory */}
                    {industryActiveTab === 'ALL' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Input
                            placeholder="Search registered organizations by name, recruiter, or domain..."
                            value={industrySearchTerm}
                            onChange={e => setIndustrySearchTerm(e.target.value)}
                            className="max-w-md bg-white rounded-xl"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {allIndustryList
                            .filter(c => {
                              if (!industrySearchTerm.trim()) return true;
                              const s = industrySearchTerm.toLowerCase();
                              return (
                                (c.company_name || '').toLowerCase().includes(s) ||
                                (c.full_name || '').toLowerCase().includes(s) ||
                                (c.email || '').toLowerCase().includes(s) ||
                                (c.industry_sector || '').toLowerCase().includes(s) ||
                                (c.hq_location || '').toLowerCase().includes(s)
                              );
                            })
                            .map(company => (
                              <Card key={company.id} className="p-5 bg-white rounded-2xl border-zinc-200 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
                                <div>
                                  <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-10 h-10 rounded-xl bg-zinc-100 font-bold text-zinc-700 flex items-center justify-center shrink-0">
                                        {(company.company_name || 'C').charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <h4 className="font-bold text-sm text-zinc-900 truncate">{company.company_name}</h4>
                                        <p className="text-[11px] text-zinc-500 truncate">{company.industry_sector || 'General'}</p>
                                      </div>
                                    </div>
                                    <span className={cn(
                                      "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0",
                                      company.is_verified ? "bg-emerald-100 text-emerald-800" : (company.rejection_reason ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800")
                                    )}>
                                      {company.is_verified ? 'Verified' : (company.rejection_reason ? 'Rejected' : 'Pending')}
                                    </span>
                                  </div>

                                  <div className="space-y-1 text-xs text-zinc-600 bg-zinc-50 p-3 rounded-xl mb-3">
                                    <p className="truncate"><b>Contact:</b> {company.full_name || '—'}</p>
                                    <p className="truncate"><b>Email:</b> <a href={`mailto:${company.email}`} className="text-indigo-600 hover:underline">{company.email}</a></p>
                                    {company.hq_location && <p className="truncate"><b>HQ:</b> {company.hq_location}</p>}
                                    {company.website && (
                                      <p className="truncate">
                                        <b>Web:</b> <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{company.website}</a>
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="pt-2 flex gap-2">
                                  {!company.is_verified ? (
                                    <Button
                                      onClick={() => handleApproveIndustry(company.user_id, true)}
                                      disabled={industryActionLoading === company.user_id}
                                      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                                    >
                                      {industryActionLoading === company.user_id ? 'Approving...' : 'Approve'}
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      onClick={() => setIndustryRejectModal(company)}
                                      disabled={industryActionLoading === company.user_id}
                                      className="w-full rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-bold"
                                    >
                                      Revoke / Reject
                                    </Button>
                                  )}
                                </div>
                              </Card>
                            ))}
                        </div>
                      </div>
                    )}
                  </PageLayout>

                  {/* Rejection Reason Modal */}
                  {industryRejectModal && (
                    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer" onClick={() => { setIndustryRejectModal(null); setIndustryRejectReason(''); }}>
                      <motion.div
                        onClick={e => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-zinc-200 cursor-default"
                      >
                        <h3 className="text-lg font-bold text-zinc-900">Deny Industry Application</h3>
                        <p className="text-xs text-zinc-500 mt-1">
                          Denying registration for <b>{industryRejectModal.company_name}</b>. You can optionally provide a reason for the recruiter.
                        </p>

                        <div className="mt-4">
                          <label className="text-xs font-bold text-zinc-700 block mb-1">Reason for Rejection (Optional)</label>
                          <textarea
                            className="w-full p-3 border border-zinc-200 rounded-xl text-xs resize-none"
                            rows={3}
                            placeholder="Specify institutional justification and documentation criteria for rejection..."
                            value={industryRejectReason}
                            onChange={e => setIndustryRejectReason(e.target.value)}
                          />
                        </div>

                        <div className="flex gap-3 mt-5">
                          <Button
                            variant="outline"
                            className="flex-1 rounded-xl"
                            onClick={() => { setIndustryRejectModal(null); setIndustryRejectReason(''); }}
                          >
                            Cancel
                          </Button>
                          <Button
                            className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                            disabled={industryActionLoading === industryRejectModal.user_id}
                            onClick={() => handleApproveIndustry(industryRejectModal.user_id, false, industryRejectReason)}
                          >
                            {industryActionLoading === industryRejectModal.user_id ? 'Rejecting...' : 'Confirm Rejection'}
                          </Button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </motion.div>

  );
}

export default IndustryApprovalsView;
