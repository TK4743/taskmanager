import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Search, Users, Building2, GraduationCap, Download, CheckCircle2,
  XCircle, Clock, Eye, Trash2, KeyRound, Check, X, Shield, Plus,
  FileText, Loader2, UserCheck, AlertTriangle, ShieldCheck, User as UserIcon
} from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { API_URL } from '../../config';
import { cn } from '../../lib/utils';
import type { User, Department, Class, ToastType } from '../../types';

export interface UsersViewProps {
  users: User[];
  departments: Department[];
  classes: Class[];
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  isHOD: boolean;
  isAdvisor: boolean;
  isIndustry: boolean;
  myClass?: Class | null;
  onViewStudentProfile?: (id: string) => void;
  onApproveStudent?: (id: string | number, name: string) => void;
  onRejectStudent?: (id: string | number, name: string) => void;
  onBulkDownloadProfiles?: (customClassId?: string) => void;
  onRefresh?: () => void;
  addToast?: (msg: string, type?: ToastType) => void;
}

export function UsersView({
  users,
  departments,
  classes,
  user,
  token,
  isAdmin,
  isHOD,
  isAdvisor,
  isIndustry,
  myClass,
  onViewStudentProfile = () => {},
  onApproveStudent,
  onRejectStudent,
  onBulkDownloadProfiles,
  onRefresh = () => {},
  addToast = () => {},
}: UsersViewProps) {
  // Filters & Pagination State
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userDeptFilter, setUserDeptFilter] = useState('');
  const [userYearFilter, setUserYearFilter] = useState('');
  const [userClassFilter, setUserClassFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [studentFilter, setStudentFilter] = useState<'ALL' | 'APPROVED' | 'PENDING'>('ALL');
  const [userPage, setUserPage] = useState(1);
  const [isExportingBulkResumes, setIsExportingBulkResumes] = useState(false);

  const itemsPerPage = 15;

  const getPaginationRange = (current: number, total: number) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const fetchInitialData = () => {
    onRefresh();
  };

  const toggleCoordinator = async (id: number | string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${id}/coordinator`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_coordinator: !currentStatus })
      });
      if (res.ok) {
        addToast(currentStatus ? 'Coordinator role revoked' : 'User assigned as Coordinator', 'success');
        onRefresh();
      }
    } catch {
      addToast('Failed to update coordinator status', 'error');
    }
  };

  const resetPassword = async (id: number | string) => {
    if (!confirm('Reset password to default (welcome123)?')) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${id}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Password reset to welcome123 successfully', 'success');
      } else {
        addToast('Failed to reset password', 'error');
      }
    } catch {
      addToast('Error resetting password', 'error');
    }
  };


  const setViewingStudentProfileId = (id: string | null) => {
    if (id) onViewStudentProfile(id);
  };

  const handleApproveStudent = async (studentId: string | number, studentName: string) => {
    if (onApproveStudent) {
      onApproveStudent(studentId, studentName);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/users/${studentId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast(`Approved ${studentName}`, 'success');
        onRefresh();
      } else {
        addToast('Failed to approve student', 'error');
      }
    } catch {
      addToast('Network error while approving student', 'error');
    }
  };

  const handleRejectStudent = async (studentId: string | number, studentName: string) => {
    if (onRejectStudent) {
      onRejectStudent(studentId, studentName);
      return;
    }
    if (!confirm(`Are you sure you want to reject and delete ${studentName}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${studentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast(`Rejected and removed ${studentName}`, 'info');
        onRefresh();
      } else {
        addToast('Failed to reject student', 'error');
      }
    } catch {
      addToast('Network error while rejecting student', 'error');
    }
  };

  const handleBulkDownloadProfiles = async (customClassId?: string) => {
    if (onBulkDownloadProfiles) {
      onBulkDownloadProfiles(customClassId);
      return;
    }
    setIsExportingBulkResumes(true);
    try {
      const params = new URLSearchParams();
      if (customClassId) params.append('class_id', customClassId);
      else if (userClassFilter) params.append('class_id', userClassFilter);
      if (userDeptFilter) params.append('department_id', userDeptFilter);
      if (userYearFilter) params.append('year', userYearFilter);

      const res = await fetch(`${API_URL}/api/admin/export-resumes-bulk?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Students_Bulk_Resumes.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        addToast('Resumes downloaded successfully', 'success');
      } else {
        addToast('Failed to download resumes', 'error');
      }
    } catch {
      addToast('Network error while downloading resumes', 'error');
    } finally {
      setIsExportingBulkResumes(false);
    }
  };

  return (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full h-full flex flex-col min-h-0"
                >
                  <PageLayout>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                      <h3 className="text-xl font-bold text-zinc-900">
                        {isAdmin ? 'All Users' : isHOD ? 'Class Advisors & Students' : isIndustry ? 'Student Candidates & Placement Talent' : 'Students'}
                      </h3>
                      {/* SA Filters */}
                      {isAdmin && (
                        <div className="flex flex-wrap gap-3 w-full md:w-auto">
                          <select
                            className="px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-black/10"
                            value={userRoleFilter}
                            onChange={e => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                          >
                            <option value="">All Roles</option>
                            <option value="HOD">HOD</option>
                            <option value="CLASS_ADVISOR">Class Advisor</option>
                            <option value="STUDENT">Student</option>
                          </select>
                          <select
                            className="px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-black/10"
                            value={userDeptFilter}
                            onChange={e => {
                              setUserDeptFilter(e.target.value);
                              setUserYearFilter('');
                              setUserClassFilter('');
                              setUserPage(1);
                            }}
                          >
                            <option value="">All Departments</option>
                            {departments.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {isIndustry && (
                        <div className="flex flex-wrap gap-3 w-full md:w-auto">
                          <select
                            className="px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-black/10"
                            value={userDeptFilter}
                            onChange={e => {
                              setUserDeptFilter(e.target.value);
                              setUserYearFilter('');
                              setUserClassFilter('');
                              setUserPage(1);
                            }}
                          >
                            <option value="">All Departments</option>
                            {departments.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          <select
                            className="px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-black/10"
                            value={userYearFilter}
                            onChange={e => {
                              setUserYearFilter(e.target.value);
                              setUserClassFilter('');
                              setUserPage(1);
                            }}
                          >
                            <option value="">All Years</option>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                          </select>
                        </div>
                      )}
                      {isHOD && (
                        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                          <div className="bg-zinc-100 p-1 rounded-xl flex">
                            {['ALL', 'CLASS_ADVISOR', 'STUDENT'].map(filter => (
                              <button
                                key={filter}
                                onClick={() => setStudentFilter(filter as any)}
                                className={cn(
                                  "px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex-1",
                                  studentFilter === filter ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                                )}
                              >
                                {filter === 'CLASS_ADVISOR' ? 'Advisors' : filter === 'STUDENT' ? 'Students' : 'All'}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {isAdvisor && (
                        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                          <div className="bg-zinc-100 p-1 rounded-xl flex">
                            {(['ALL', 'COORDINATORS', 'PENDING'] as const).map(filter => {
                              const pendingCount = users.filter(u => u.role === 'STUDENT' && (u.status === 'PENDING_APPROVAL' || u.is_approved === false)).length;
                              return (
                                <button
                                  key={filter}
                                  onClick={() => { setStudentFilter(filter); setUserPage(1); }}
                                  className={cn(
                                    "px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all flex-1 flex items-center gap-1.5 justify-center cursor-pointer",
                                    studentFilter === filter ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                                  )}
                                >
                                  <span>{filter === 'ALL' ? 'All' : filter === 'COORDINATORS' ? 'Coordinators' : 'Pending Approvals'}</span>
                                  {filter === 'PENDING' && pendingCount > 0 && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                                      {pendingCount}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mb-6 flex flex-col md:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <Input
                          placeholder={`Search ${isAdmin ? 'HODs' : isHOD ? 'Advisors or Students' : isIndustry ? 'Candidates by name, registration number, department...' : 'Students'} by name or registration number...`}
                          className="pl-10 h-11"
                          value={searchTerm}
                          onChange={e => { setSearchTerm(e.target.value); setUserPage(1); }}
                        />
                      </div>

                      {/* HOD / Admin / Industry Year & Section Filters */}
                      {(isHOD || isAdmin || isIndustry) && (
                        <div className="flex flex-wrap items-center gap-3">
                          {!isIndustry && (
                            <select
                              className="h-11 px-3 rounded-lg border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-black/5"
                              value={userYearFilter}
                              onChange={e => {
                                setUserYearFilter(e.target.value);
                                setUserClassFilter('');
                                setUserPage(1);
                              }}
                            >
                              <option value="">All Years</option>
                              <option value="1">1st Year</option>
                              <option value="2">2nd Year</option>
                              <option value="3">3rd Year</option>
                              <option value="4">4th Year</option>
                            </select>
                          )}

                          <select
                            className="h-11 px-3 rounded-lg border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-black/5"
                            value={userClassFilter}
                            onChange={e => {
                              setUserClassFilter(e.target.value);
                              setUserPage(1);
                            }}
                          >
                            <option value="">All Classes / Sections</option>
                            {classes
                              .filter(c => (!userDeptFilter || String(c.department_id) === String(userDeptFilter)) && (!userYearFilter || String(c.year) === userYearFilter))
                              .sort((a, b) => (a.year || 0) - (b.year || 0) || a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
                              .map(c => (
                                <option key={c.id} value={c.id.toString()}>{c.name}</option>
                              ))}
                          </select>
                        </div>
                      )}

                      {(isAdvisor || isHOD || isAdmin || isIndustry) && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleBulkDownloadProfiles()}
                            disabled={isExportingBulkResumes}
                            className="h-11 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer shrink-0"
                            title="Download all candidate resumes in current view as formatted PDFs in a ZIP archive"
                          >
                            {isExportingBulkResumes ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Download size={16} />
                            )}
                            <span>{isExportingBulkResumes ? 'Compiling Resumes...' : 'Bulk Download Resumes (.zip)'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <Table className="w-full">
                      <THead>
                        <TR>
                          <TH>Candidate Name</TH>
                          <TH>{isAdvisor || isIndustry ? 'Register No' : 'Username'}</TH>
                          {isAdvisor && <TH>Email</TH>}
                          {!isAdvisor && <TH>{isAdmin || isIndustry ? 'Department' : 'Section / Class'}</TH>}
                          {isIndustry && <TH>Class / Section</TH>}
                          <TH className="text-right">Actions</TH>
                        </TR>
                      </THead>
                      <TBody>
                        {(() => {
                          const filtered = users
                            .filter(u => {
                              if (isIndustry) {
                                if (u.role !== 'STUDENT') return false;
                                if (userDeptFilter && u.department_id?.toString() !== userDeptFilter.toString()) return false;
                                return true;
                              }
                              if (isAdmin) {
                                if (userRoleFilter && u.role !== userRoleFilter) return false;
                                if (userDeptFilter && u.department_id?.toString() !== userDeptFilter.toString()) return false;
                                return u.role !== 'SUPREME_ADMIN'; // Don't show SA itself
                              }
                              if (isAdvisor) {
                                if (studentFilter === 'COORDINATORS') return u.is_coordinator;
                                if (studentFilter === 'PENDING') return u.status === 'PENDING_APPROVAL' || u.is_approved === false;
                              } else if (isHOD) {
                                if (studentFilter === 'CLASS_ADVISOR') return u.role === 'CLASS_ADVISOR';
                                if (studentFilter === 'STUDENT') return u.role === 'STUDENT';
                              }
                              return true;
                            })
                            .filter(u => {
                              if (!isAdmin && !isHOD && !isIndustry) {
                                const userClassId = (user?.class_id || myClass?.id)?.toString();
                                if (userClassId && u.class_id?.toString() !== userClassId) return false;
                              }
                              if (userYearFilter) {
                                const cls = classes.find(c => c.id?.toString() === u.class_id?.toString());
                                const yr = cls?.year || (u as any).class_year;
                                if (String(yr) !== userYearFilter) return false;
                              }
                              if (userClassFilter) {
                                if (u.class_id?.toString() !== userClassFilter) return false;
                              }
                              return true;
                            })
                            .filter(u => {
                              if (!searchTerm) return true;
                              const query = searchTerm.toLowerCase();
                              return u.full_name?.toLowerCase().includes(query) || (u.register_number || u.username).toLowerCase().includes(query) || u.department_name?.toLowerCase().includes(query);
                            });

                          const totalPages = Math.ceil(filtered.length / itemsPerPage);
                          const sortedFiltered = [...filtered].sort((a, b) => {
                            if (a.role === 'CLASS_ADVISOR' && b.role === 'CLASS_ADVISOR') {
                              const cA = classes.find(c => c.id?.toString() === a.class_id?.toString());
                              const cB = classes.find(c => c.id?.toString() === b.class_id?.toString());
                              const yrA = cA?.year || (a as any).class_year || 0;
                              const yrB = cB?.year || (b as any).class_year || 0;
                              if (yrA !== yrB) return yrA - yrB;
                              const nameA = cA?.name || a.class_name || a.full_name || '';
                              const nameB = cB?.name || b.class_name || b.full_name || '';
                              return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
                            }
                            if (a.role === 'STUDENT' && b.role === 'STUDENT') {
                              if (a.register_number && b.register_number) {
                                return a.register_number.localeCompare(b.register_number, undefined, { numeric: true });
                              }
                            }
                            return (a.full_name || '').localeCompare(b.full_name || '', undefined, { numeric: true, sensitivity: 'base' });
                          });
                          const paginated = sortedFiltered.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage);

                          return (
                            <>
                              {paginated.map(u => (
                                <TR key={u.id}>
                                  <TD className="font-medium text-zinc-900 break-words">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {u.full_name}
                                      {!!u.is_coordinator && (
                                        <Badge variant="warning">Class Coord</Badge>
                                      )}
                                      {(u.status === 'PENDING_APPROVAL' || u.is_approved === false) && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1">
                                          ⏳ Pending Approval
                                        </span>
                                      )}
                                      {u.status === 'REJECTED' && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800 flex items-center gap-1">
                                          ❌ Rejected
                                        </span>
                                      )}
                                      {isAdmin && (
                                        <Badge variant={
                                          u.role === 'HOD' ? 'info' :
                                            u.role === 'CLASS_ADVISOR' ? 'primary' : 'neutral'
                                        }>
                                          {u.role === 'CLASS_ADVISOR' ? 'Advisor' : u.role}
                                        </Badge>
                                      )}
                                    </div>
                                  </TD>
                                  <TD className="text-zinc-500 break-all">{u.register_number || u.username}</TD>
                                  {isAdvisor && <TD className="text-zinc-500">{u.email}</TD>}
                                  {!isAdvisor && (
                                    <TD>
                                      <span className="px-2 py-1 bg-zinc-100 rounded text-xs text-zinc-600">
                                        {isAdmin || isIndustry ? (u.department_name || '—') : u.class_name}
                                      </span>
                                    </TD>
                                  )}
                                  {isIndustry && (
                                    <TD>
                                      <span className="px-2 py-1 bg-zinc-100 rounded text-xs text-zinc-600">
                                        {u.class_name || '—'}
                                      </span>
                                    </TD>
                                  )}
                                  <TD className="text-right">
                                    <div className="flex justify-end items-center gap-1.5 flex-wrap">
                                      {(isAdvisor || isHOD || isAdmin) && u.role === 'STUDENT' && (u.status === 'PENDING_APPROVAL' || u.is_approved === false) && (
                                        <>
                                          <Button
                                            variant="outline"
                                            className="px-2.5 py-1 h-7 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 rounded-lg cursor-pointer"
                                            onClick={() => handleApproveStudent(u.id, u.full_name)}
                                            title="Approve student registration"
                                          >
                                            Approve
                                          </Button>
                                          <Button
                                            variant="outline"
                                            className="px-2 py-1 h-7 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 rounded-lg cursor-pointer"
                                            onClick={() => handleRejectStudent(u.id, u.full_name)}
                                            title="Reject student registration"
                                          >
                                            Reject
                                          </Button>
                                        </>
                                      )}
                                      {u.role === 'STUDENT' && (
                                        <Button
                                          variant="ghost"
                                          className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                          onClick={() => {
                                            const activeClassId = (user?.class_id || myClass?.id)?.toString();
                                            const isMyClassStudent = activeClassId && u.class_id?.toString() === activeClassId;
                                            if (isAdmin || isHOD || isIndustry || isMyClassStudent) {
                                              setViewingStudentProfileId(String(u.id));
                                            } else {
                                              addToast('Class Advisors can only view profiles of students in their assigned class', 'error');
                                            }
                                          }}
                                          title="View Full Candidate Profile"
                                        >
                                          <UserIcon size={18} />
                                        </Button>
                                      )}
                                      {(isAdvisor || isHOD || isAdmin) && u.role === 'STUDENT' && (
                                        <Button
                                          variant="ghost"
                                          className={cn("p-2", u.is_coordinator ? "text-amber-600" : "text-zinc-400")}
                                          onClick={() => toggleCoordinator(u.id, u.is_coordinator || false)}
                                          title={u.is_coordinator ? "Remove Coordinator" : "Make Coordinator"}
                                        >
                                          <ShieldCheck size={18} />
                                        </Button>
                                      )}
                                      {(isAdvisor || isHOD || isAdmin) && (
                                        <Button
                                          variant="ghost"
                                          className="p-2 text-zinc-400 hover:text-blue-600"
                                          onClick={() => resetPassword(u.id)}
                                          title="Reset Password"
                                        >
                                          <ShieldCheck size={18} className="text-blue-500" />
                                        </Button>
                                      )}
                                      {(isAdvisor || isHOD || isAdmin) && (
                                        <button
                                          onClick={async () => {
                                            const roleLabel = u.role === 'CLASS_ADVISOR' ? 'Advisor' : u.role === 'HOD' ? 'HOD' : 'User';
                                            if (confirm(`Delete ${roleLabel} ${u.full_name}? This cannot be undone.`)) {
                                              const res = await fetch(`${API_URL}/api/users/${u.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                                              if (res.ok) {
                                                fetchInitialData();
                                                addToast(`${roleLabel} deleted successfully.`, 'success');
                                              } else {
                                                const data = await res.json();
                                                addToast(data.error || 'Failed to delete user', 'error');
                                              }
                                            }
                                          }}
                                          className="p-2 transition-colors text-zinc-400 hover:text-red-500"
                                        >
                                          <Trash2 size={18} />
                                        </button>
                                      )}
                                    </div>
                                  </TD>
                                </TR>
                              ))}
                              {filtered.length > itemsPerPage && (
                                <TR>
                                  <TD colSpan={6} className="bg-zinc-50/30">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
                                      <p className="text-xs font-medium text-zinc-500 whitespace-nowrap">
                                        Showing {(userPage - 1) * itemsPerPage + 1} to {Math.min(userPage * itemsPerPage, filtered.length)} of {filtered.length} entries
                                      </p>
                                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                        <Button
                                          variant="secondary"
                                          className="px-3 py-1 h-8 text-xs font-semibold"
                                          disabled={userPage === 1}
                                          onClick={() => setUserPage(prev => prev - 1)}
                                        >
                                          Previous
                                        </Button>
                                        <div className="flex items-center gap-1">
                                          {getPaginationRange(userPage, totalPages).map((p, idx) => typeof p === 'number' ? (
                                            <button
                                              key={idx}
                                              onClick={() => setUserPage(p)}
                                              className={cn(
                                                "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                                                userPage === p ? "bg-black text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-100"
                                              )}
                                            >
                                              {p}
                                            </button>
                                          ) : (
                                            <span key={idx} className="w-5 text-center text-xs text-zinc-400 font-bold">...</span>
                                          ))}
                                        </div>
                                        <Button
                                          variant="secondary"
                                          className="px-3 py-1 h-8 text-xs font-semibold"
                                          disabled={userPage === totalPages}
                                          onClick={() => setUserPage(prev => prev + 1)}
                                        >
                                          Next
                                        </Button>
                                      </div>
                                    </div>
                                  </TD>
                                </TR>
                              )}
                              {filtered.length === 0 && (
                                <TR>
                                  <TD colSpan={6} className="text-center text-zinc-500 text-sm py-12">
                                    No matching records found.
                                  </TD>
                                </TR>
                              )}
                            </>
                          );
                        })()}
                      </TBody>
                    </Table>
                  </PageLayout>
                </motion.div>

  );
}

export default UsersView;
