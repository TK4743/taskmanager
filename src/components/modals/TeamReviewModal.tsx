import React from 'react';
import { Users } from 'lucide-react';
import { FloatingModal } from './FloatingModal';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';

export interface TeamReviewModalState {
  id: string;
  name: string;
  status: 'APPROVED' | 'REJECTED';
}

export interface TeamReviewModalProps {
  teamReviewModal: TeamReviewModalState | null;
  onClose: () => void;
  teamRejectionReason: string;
  setTeamRejectionReason: (reason: string) => void;
  onConfirm: (subId: string, status: 'APPROVED' | 'REJECTED') => Promise<void> | void;
}

export function TeamReviewModal({
  teamReviewModal,
  onClose,
  teamRejectionReason,
  setTeamRejectionReason,
  onConfirm,
}: TeamReviewModalProps) {
  if (!teamReviewModal) return null;

  return (
    <FloatingModal
      isOpen={Boolean(teamReviewModal)}
      onClose={onClose}
      title={teamReviewModal.status === 'APPROVED' ? 'Approve Team Submission' : 'Reject Team Submission'}
      description={`Team: ${teamReviewModal.name}`}
      icon={<Users size={18} className="text-indigo-600" />}
      maxWidth="md"
      footer={
        <div className="flex items-center gap-3 w-full">
          <Button variant="ghost" className="flex-1 text-xs" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={teamReviewModal.status === 'APPROVED' ? 'success' : 'danger'}
            className="flex-1 text-xs font-bold"
            onClick={async () => {
              const subId = teamReviewModal.id;
              const status = teamReviewModal.status;
              onClose();
              await onConfirm(subId, status);
            }}
          >
            {teamReviewModal.status === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            {teamReviewModal.status === 'APPROVED' ? 'Approval Note (Optional)' : 'Reason for Rejection *'}
          </label>
          <Textarea
            placeholder={teamReviewModal.status === 'APPROVED' ? 'Optional feedback or note...' : 'Please specify why this team submission is rejected...'}
            value={teamRejectionReason}
            onChange={e => setTeamRejectionReason(e.target.value)}
            className="text-xs min-h-[90px]"
          />
        </div>

        {teamReviewModal.status === 'REJECTED' && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Quick Suggestions:</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Proof does not show all team members",
                "Project repository is incomplete or private",
                "Deliverables do not match task requirements",
                "Duplicate or unverified submission proof"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTeamRejectionReason(chip)}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </FloatingModal>
  );
}

export default TeamReviewModal;
