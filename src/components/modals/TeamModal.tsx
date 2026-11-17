import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, X, Search, Check, Trash2, UserPlus, Upload, FileText,
  Clock, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, ExternalLink,
  Loader2, Eye, User as UserIcon, Maximize2
} from 'lucide-react';
import { Textarea } from '../ui/Textarea';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import type { Task, User } from '../../types';
import type { ProofPreviewData } from '../../ProofPreviewModal';

export interface TeamModalProps {
  teamModalTask: Task | null;
  onClose: () => void;
  currentTaskTeam: any;
  user: User | null;
  newTeamName: string;
  setNewTeamName: (val: string) => void;
  classmateSearchTerm: string;
  setClassmateSearchTerm: (val: string) => void;
  selectedClassmateIds: string[];
  setSelectedClassmateIds: React.Dispatch<React.SetStateAction<string[]>>;
  classmatesList: any[];
  teamProofFile: File | null;
  setTeamProofFile: (file: File | null) => void;
  teamRemarks: string;
  setTeamRemarks: (val: string) => void;
  isCreatingTeam: boolean;
  isSubmittingProof: boolean;
  handleCreateTeam: () => void;
  handleCreateSoloTeam: () => void;
  handleInviteMoreClassmates: () => void;
  handleRespondInvitation: (invitationId: string, response: 'ACCEPT' | 'DECLINE') => void;
  handleRemoveTeamMember: (memberId: string) => void;
  handleDeleteTeam: (teamId: string) => void;
  handleSubmitTeamProof: () => void;
  setCurrentTaskTeam?: (team: any) => void;
  eligibleClassmates?: any[];
  isSubmittingTeam?: boolean;
  onOpenProofPreview?: (data: ProofPreviewData) => void;
}

export function TeamModal({
  teamModalTask,
  onClose,
  currentTaskTeam,
  user,
  newTeamName,
  setNewTeamName,
  classmateSearchTerm,
  setClassmateSearchTerm,
  selectedClassmateIds,
  setSelectedClassmateIds,
  classmatesList,
  teamProofFile,
  setTeamProofFile,
  teamRemarks,
  setTeamRemarks,
  isCreatingTeam,
  isSubmittingProof,
  handleCreateTeam,
  handleCreateSoloTeam,
  handleInviteMoreClassmates,
  handleRespondInvitation,
  handleRemoveTeamMember,
  handleDeleteTeam,
  handleSubmitTeamProof,
  setCurrentTaskTeam: propSetCurrentTaskTeam,
  eligibleClassmates = [],
  isSubmittingTeam = false,
  onOpenProofPreview,
}: TeamModalProps) {
  const { addToast } = useToast();
  if (!teamModalTask) return null;

  const setTeamModalTask = (task: Task | null) => {
    if (!task) onClose();
  };

  const setCurrentTaskTeam = (team: any) => {
    if (propSetCurrentTaskTeam) propSetCurrentTaskTeam(team);
  };

  const setProofPreviewData = (data: any) => {
    if (onOpenProofPreview) onOpenProofPreview(data);
  };

  return (
                  <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm cursor-pointer" onClick={() => { setTeamModalTask(null); setCurrentTaskTeam(null); }}>
                <motion.div
                  onClick={e => e.stopPropagation()}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto cursor-default"
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                        <Users size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900">{teamModalTask.title} — Team Management</h3>
                        <p className="text-xs text-zinc-500 font-medium">Min {teamModalTask.min_team_size || 2} - Max {teamModalTask.max_team_size || 5} Members</p>
                      </div>
                    </div>
                    <button onClick={() => { setTeamModalTask(null); setCurrentTaskTeam(null); }} className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors">
                      <X size={20} className="text-zinc-400" />
                    </button>
                  </div>

                  {!currentTaskTeam ? (
                    /* Form a New Team View */
                    <div className="space-y-6">
                      <div className="bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl space-y-1">
                        <h4 className="font-bold text-sm text-indigo-900">Form a New Team</h4>
                        <p className="text-xs text-indigo-700">
                          Create a team for this task and invite your classmates. As team leader, you will be able to manage members and upload the final proof submission.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block">Team Name <span className="text-red-500">*</span></label>
                        <Input
                          placeholder="e.g. Cyber Squad / Tech Titans"
                          value={newTeamName}
                          onChange={e => setNewTeamName(e.target.value)}
                          className="h-11 font-semibold"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block">
                            Select Classmates to Invite (Optional)
                          </label>
                          <span className="text-xs text-zinc-400 font-mono">
                            Max {teamModalTask.max_team_size ? teamModalTask.max_team_size - 1 : 4} invites
                          </span>
                        </div>

                        {eligibleClassmates.length > 0 && (
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                            <Input
                              placeholder="Search classmate by Name or Reg No..."
                              value={classmateSearchTerm}
                              onChange={e => setClassmateSearchTerm(e.target.value)}
                              className="pl-9 h-9 text-xs"
                            />
                          </div>
                        )}

                        {(() => {
                          const filtered = eligibleClassmates.filter(s =>
                            !classmateSearchTerm ||
                            (s.full_name || '').toLowerCase().includes(classmateSearchTerm.toLowerCase()) ||
                            (s.register_number || '').toLowerCase().includes(classmateSearchTerm.toLowerCase()) ||
                            (s.username || '').toLowerCase().includes(classmateSearchTerm.toLowerCase())
                          );

                          if (filtered.length === 0) {
                            return (
                              <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-2xl text-center text-xs text-zinc-500">
                                {classmateSearchTerm ? 'No matching classmates found.' : 'No available classmates in your section for this task (all students might already be in teams).'}
                              </div>
                            );
                          }

                          return (
                            <div className="max-h-60 overflow-y-auto border border-zinc-200 rounded-2xl p-3 bg-zinc-50/50 space-y-2 custom-scrollbar">
                              {filtered.map(student => {
                                const isSelected = selectedClassmateIds.includes(student.id);
                                return (
                                  <label
                                    key={student.id}
                                    className={cn(
                                      "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border",
                                      isSelected ? "bg-indigo-50/90 border-indigo-300 shadow-sm" : "bg-white border-zinc-200 hover:border-indigo-300"
                                    )}
                                  >
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={e => {
                                          if (e.target.checked) {
                                            if (selectedClassmateIds.length >= (teamModalTask.max_team_size ? teamModalTask.max_team_size - 1 : 4)) {
                                              return addToast(`Max team limit is ${teamModalTask.max_team_size || 5} including leader`, 'warning');
                                            }
                                            setSelectedClassmateIds(prev => [...prev, student.id]);
                                          } else {
                                            setSelectedClassmateIds(prev => prev.filter(id => id !== student.id));
                                          }
                                        }}
                                        className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                      />
                                      <div>
                                        <p className="text-sm font-extrabold text-zinc-900">{student.full_name}</p>
                                        <p className="text-xs text-indigo-600 font-mono font-semibold">Reg No: {student.register_number || student.username}</p>
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <Badge variant="primary" className="bg-indigo-600 text-white text-[10px]">
                                        Selected
                                      </Badge>
                                    )}
                                  </label>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={handleCreateSoloTeam}
                          disabled={isSubmittingTeam}
                          variant="secondary"
                          className="flex-1 h-12 border-zinc-300 font-bold rounded-2xl flex items-center justify-center gap-2 text-xs"
                        >
                          <UserIcon size={16} /> Complete as Solo (Individual)
                        </Button>
                        <Button
                          onClick={handleCreateTeam}
                          disabled={isSubmittingTeam || !newTeamName.trim()}
                          className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-xs"
                        >
                          {isSubmittingTeam ? <Loader2 size={18} className="animate-spin" /> : <Users size={16} />} Create Team & Send Invites
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Manage Existing Team View */
                    <div className="space-y-6">
                      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-extrabold text-zinc-900">{currentTaskTeam.team_name}</h4>
                            <Badge variant={
                              currentTaskTeam.status === 'APPROVED' ? 'success' :
                                currentTaskTeam.status === 'REJECTED' ? 'danger' :
                                  currentTaskTeam.status === 'SUBMITTED' ? 'info' :
                                    currentTaskTeam.status === 'READY' ? 'warning' : 'neutral'
                            }>
                              {currentTaskTeam.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-zinc-500 font-medium mt-0.5">
                            Leader: <span className="font-bold text-zinc-800">{currentTaskTeam.leader_name}</span> ({currentTaskTeam.leader_regno})
                          </p>
                        </div>

                        {user?.id?.toString() === currentTaskTeam.leader_id?.toString() && currentTaskTeam.status !== 'APPROVED' && (
                          <Button
                            variant="ghost"
                            onClick={() => handleDeleteTeam(currentTaskTeam.id)}
                            className="text-red-500 hover:bg-red-50 hover:text-red-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-red-100"
                          >
                            <Trash2 size={14} /> Delete Team
                          </Button>
                        )}
                      </div>

                      {/* Team Members List */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                          Team Members ({(currentTaskTeam.members || []).filter(m => m.status === 'ACCEPTED').length} Accepted)
                        </h5>
                        <div className="space-y-2">
                          {(currentTaskTeam.members || []).map(m => {
                            const isLeader = m.student_id?.toString() === currentTaskTeam.leader_id?.toString();
                            return (
                              <div key={m.id} className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-2xl">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                    isLeader ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-600"
                                  )}>
                                    {isLeader ? 'L' : 'M'}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                                      {m.full_name || m.username}
                                      {isLeader && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-extrabold">Leader</span>}
                                    </p>
                                    <p className="text-xs text-zinc-400 font-mono">{m.register_number}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <Badge variant={
                                    m.status === 'ACCEPTED' ? 'success' :
                                      m.status === 'PENDING' ? 'warning' :
                                        m.status === 'DECLINED' ? 'danger' : 'neutral'
                                  }>
                                    {m.status}
                                  </Badge>

                                  {user?.id?.toString() === currentTaskTeam.leader_id?.toString() && !isLeader && currentTaskTeam.status !== 'APPROVED' && (
                                    <button
                                      onClick={() => handleRemoveTeamMember(m.id)}
                                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Remove Member"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Pending Invitations */}
                      {currentTaskTeam.invitations && currentTaskTeam.invitations.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Pending Invitations</h5>
                          <div className="space-y-2">
                            {currentTaskTeam.invitations.map(inv => {
                              const isMe = String(inv.student_id) === String(user?.id);
                              return (
                                <div key={inv.id} className="flex items-center justify-between p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 font-semibold shadow-xs">
                                  <span>{isMe ? "You have been invited to join this team!" : `Waiting for ${inv.student_name} to respond...`}</span>
                                  {isMe ? (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleRespondInvitation(inv.id, 'ACCEPT')}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-sm border-none"
                                      >
                                        Accept
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleRespondInvitation(inv.id, 'DECLINE')}
                                        className="bg-white hover:bg-zinc-100 text-zinc-700 font-bold text-xs px-3 py-1.5 rounded-xl border border-zinc-200"
                                      >
                                        Decline
                                      </Button>
                                    </div>
                                  ) : (
                                    <Badge variant="warning">Pending</Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Invite Additional Classmates Section for Leader */}
                      {user?.id?.toString() === currentTaskTeam.leader_id?.toString() && currentTaskTeam.status !== 'APPROVED' && (
                        <div className="pt-4 border-t border-zinc-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                              Invite Additional Classmates
                            </h5>
                            <span className="text-xs text-zinc-400 font-mono">
                              Max {teamModalTask?.max_team_size || 5} members
                            </span>
                          </div>

                          {eligibleClassmates.length > 0 ? (
                            <div className="space-y-3">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                <Input
                                  placeholder="Search classmate by Name or Reg No..."
                                  value={classmateSearchTerm}
                                  onChange={e => setClassmateSearchTerm(e.target.value)}
                                  className="pl-9 h-9 text-xs"
                                />
                              </div>

                              {(() => {
                                const filtered = eligibleClassmates.filter(s =>
                                  !classmateSearchTerm ||
                                  (s.full_name || '').toLowerCase().includes(classmateSearchTerm.toLowerCase()) ||
                                  (s.register_number || '').toLowerCase().includes(classmateSearchTerm.toLowerCase()) ||
                                  (s.username || '').toLowerCase().includes(classmateSearchTerm.toLowerCase())
                                );

                                if (filtered.length === 0) {
                                  return (
                                    <p className="text-xs text-zinc-400 italic">No matching classmates found.</p>
                                  );
                                }

                                const currentTotal = ((currentTaskTeam.members || []).filter(m => ['ACCEPTED', 'PENDING'].includes(m.status)).length) + (currentTaskTeam.invitations || []).length;
                                const maxAllowed = teamModalTask?.max_team_size || 5;

                                return (
                                  <div className="max-h-40 overflow-y-auto border border-zinc-200 rounded-2xl p-2.5 bg-zinc-50/50 space-y-1.5 custom-scrollbar">
                                    {filtered.map(student => {
                                      const isSelected = selectedClassmateIds.includes(student.id);
                                      return (
                                        <label
                                          key={student.id}
                                          className={cn(
                                            "flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border text-xs",
                                            isSelected ? "bg-indigo-50/90 border-indigo-300 shadow-sm" : "bg-white border-zinc-200 hover:border-indigo-300"
                                          )}
                                        >
                                          <div className="flex items-center gap-2.5">
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={e => {
                                                if (e.target.checked) {
                                                  if (currentTotal + selectedClassmateIds.length >= maxAllowed) {
                                                    return addToast(`Max team limit is ${maxAllowed} members`, 'warning');
                                                  }
                                                  setSelectedClassmateIds(prev => [...prev, student.id]);
                                                } else {
                                                  setSelectedClassmateIds(prev => prev.filter(id => id !== student.id));
                                                }
                                              }}
                                              className="w-3.5 h-3.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <div>
                                              <p className="font-bold text-zinc-900">{student.full_name}</p>
                                              <p className="text-[10px] text-zinc-400 font-mono">Reg No: {student.register_number || student.username}</p>
                                            </div>
                                          </div>
                                          {isSelected && (
                                            <Badge variant="primary" className="bg-indigo-600 text-white text-[10px]">
                                              Selected
                                            </Badge>
                                          )}
                                        </label>
                                      );
                                    })}
                                  </div>
                                );
                              })()}

                              {selectedClassmateIds.length > 0 && (
                                <Button
                                  onClick={handleInviteMoreClassmates}
                                  className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                                >
                                  <UserPlus size={16} /> Send Invitation ({selectedClassmateIds.length})
                                </Button>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-400 italic">No available classmates in your section to invite.</p>
                          )}
                        </div>
                      )}

                      {/* Team Task Proof Submission / Status Section */}
                      <div className="pt-4 border-t border-zinc-200 space-y-4">
                        <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Team Submission Status</h5>

                        {currentTaskTeam.submission ? (
                          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-zinc-600">Submitted Proof</span>
                              <Badge variant={
                                currentTaskTeam.submission.status === 'APPROVED' ? 'success' :
                                  currentTaskTeam.submission.status === 'REJECTED' ? 'danger' : 'warning'
                              }>
                                {currentTaskTeam.submission.status}
                              </Badge>
                            </div>

                            {currentTaskTeam.submission.status === 'REJECTED' && (
                              <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1 text-xs text-red-700">
                                <p className="font-extrabold flex items-center gap-1.5 text-red-800">
                                  <XCircle size={15} /> Submission Rejected
                                </p>
                                <p className="font-semibold">
                                  <span className="font-bold text-red-900">Feedback / Reason:</span> {currentTaskTeam.submission.remarks || 'Please check task instructions and upload corrected proof screenshot below.'}
                                </p>
                              </div>
                            )}

                            {currentTaskTeam.submission.proof_url && (
                              <div
                                onClick={() => setProofPreviewData({
                                  url: currentTaskTeam.submission!.proof_url,
                                  title: currentTaskTeam?.task_title ? `${currentTaskTeam.task_title} (Team Proof)` : 'Team Task Proof',
                                  isDraft: false
                                })}
                                className="relative group/teamproof cursor-pointer inline-block"
                                title="Click to inspect team proof in full resolution"
                              >
                                <img
                                  src={currentTaskTeam.submission.proof_url}
                                  alt="Team Proof"
                                  className="max-h-48 rounded-xl object-contain border border-zinc-200 group-hover/teamproof:brightness-95 transition-all"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/teamproof:opacity-100 flex items-center justify-center rounded-xl transition-opacity text-white text-xs font-bold gap-1.5">
                                  <Eye size={16} /> Inspect Proof
                                </div>
                              </div>
                            )}

                            {currentTaskTeam.submission.remarks && currentTaskTeam.submission.status !== 'REJECTED' && (
                              <p className="text-xs text-zinc-600 bg-white p-3 rounded-xl border border-zinc-200">
                                <span className="font-bold text-zinc-800">Remarks:</span> {currentTaskTeam.submission.remarks}
                              </p>
                            )}
                          </div>
                        ) : null}

                        {user?.id?.toString() === currentTaskTeam.leader_id?.toString() && (!currentTaskTeam.submission || currentTaskTeam.submission.status === 'REJECTED') && (
                          /* Leader Proof Upload / Re-upload */
                          <div className="space-y-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                            <h6 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                              {currentTaskTeam.submission?.status === 'REJECTED' ? 'Resubmit Team Task Proof' : 'Submit Team Task Proof'}
                            </h6>
                            <div>
                              <label className="text-xs font-bold text-zinc-700 mb-1.5 block">Proof Screenshot <span className="text-red-500">*</span></label>
                              {teamProofFile ? (
                                <div className="bg-white p-4 rounded-2xl border border-indigo-200 flex flex-col gap-3 shadow-xs">
                                  {/* Team Staged Proof Header */}
                                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                        <CheckCircle2 size={16} />
                                      </div>
                                      <div className="min-w-0">
                                        <span className="text-xs font-bold text-indigo-950 block truncate" title={teamProofFile.name}>
                                          {teamProofFile.name}
                                        </span>
                                        <span className="text-[10px] text-zinc-500">{(teamProofFile.size / (1024 * 1024)).toFixed(2)} MB • Draft</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setProofPreviewData({
                                          url: URL.createObjectURL(teamProofFile),
                                          title: currentTaskTeam?.task_title ? `${currentTaskTeam.task_title} (Team Proof Draft)` : 'Team Proof Draft',
                                          filename: teamProofFile.name,
                                          size: `${(teamProofFile.size / (1024 * 1024)).toFixed(2)} MB`,
                                          isDraft: true,
                                          onDeleteFile: () => {
                                            setTeamProofFile(null);
                                            const teamInput = document.getElementById('team-proof-file-input') as HTMLInputElement | null;
                                            if (teamInput) teamInput.value = '';
                                            addToast('Team proof screenshot removed', 'info');
                                          }
                                        })}
                                        className="text-xs font-bold text-indigo-700 hover:text-indigo-950 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                                        title="Preview team proof before submitting"
                                      >
                                        <Maximize2 size={13} /> Fullscreen Zoom
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setTeamProofFile(null);
                                          const teamInput = document.getElementById('team-proof-file-input') as HTMLInputElement | null;
                                          if (teamInput) teamInput.value = '';
                                          addToast('Team proof screenshot removed', 'info');
                                        }}
                                        className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg border border-red-200 shrink-0 transition-colors"
                                        title="Delete screenshot before submission"
                                      >
                                        <Trash2 size={13} /> Remove
                                      </button>
                                    </div>
                                  </div>

                                  {/* Team Proof Preview Viewport */}
                                  <div
                                    onClick={() => setProofPreviewData({
                                      url: URL.createObjectURL(teamProofFile),
                                      title: currentTaskTeam?.task_title ? `${currentTaskTeam.task_title} (Team Proof Draft)` : 'Team Proof Draft',
                                      filename: teamProofFile.name,
                                      size: `${(teamProofFile.size / (1024 * 1024)).toFixed(2)} MB`,
                                      isDraft: true,
                                      onDeleteFile: () => {
                                        setTeamProofFile(null);
                                        const teamInput = document.getElementById('team-proof-file-input') as HTMLInputElement | null;
                                        if (teamInput) teamInput.value = '';
                                        addToast('Team proof screenshot removed', 'info');
                                      }
                                    })}
                                    className="relative w-full max-h-64 rounded-xl overflow-hidden border border-indigo-200 bg-zinc-950/5 flex items-center justify-center cursor-pointer group/teamview shadow-inner p-2"
                                    title="Click to inspect team proof in 350% zoom modal"
                                  >
                                    <img
                                      src={URL.createObjectURL(teamProofFile)}
                                      alt="Team proof preview"
                                      className="max-h-56 w-auto max-w-full rounded-lg object-contain transition-transform duration-200 group-hover/teamview:scale-[1.01]"
                                    />
                                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/teamview:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-2">
                                      <Eye size={16} /> Click for 350% Zoom & Pan
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <input
                                  type="file"
                                  id="team-proof-file-input"
                                  accept="image/*"
                                  onChange={e => setTeamProofFile(e.target.files?.[0] || null)}
                                  className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                                />
                              )}
                            </div>

                            <div>
                              <label className="text-xs font-bold text-zinc-700 mb-1.5 block">Remarks / Notes (Optional)</label>
                              <Textarea
                                placeholder="Add any additional notes for the reviewer..."
                                value={teamRemarks}
                                onChange={e => setTeamRemarks(e.target.value)}
                                className="min-h-[80px]"
                              />
                            </div>

                            <Button
                              onClick={handleSubmitTeamProof}
                              disabled={isSubmittingTeam || !teamProofFile}
                              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                            >
                              {isSubmittingTeam ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />} {currentTaskTeam.submission?.status === 'REJECTED' ? 'Resubmit Proof' : 'Submit Task Proof'}
                            </Button>
                          </div>
                        )}

                        {user?.id?.toString() !== currentTaskTeam.leader_id?.toString() && !currentTaskTeam.submission && (
                          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-center text-xs text-zinc-500 font-medium">
                            Waiting for team leader (<span className="font-bold text-zinc-800">{currentTaskTeam.leader_name}</span>) to submit the team proof.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>

  );
}

export default TeamModal;
