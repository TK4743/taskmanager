import React from 'react';
import { XCircle } from 'lucide-react';
import { FloatingModal } from './FloatingModal';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import type { Submission } from '../../types';

export interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission?: Submission | null;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  onConfirm: () => void;
}

export function RejectionModal({
  isOpen,
  onClose,
  submission,
  rejectionReason,
  setRejectionReason,
  onConfirm,
}: RejectionModalProps) {
  if (!isOpen) return null;

  return (
    <FloatingModal
      isOpen={isOpen}
      onClose={onClose}
      title="Reject Submission"
      description={submission ? `${submission.student_name} (${submission.register_number || 'Student'}) • ${submission.task_title}` : 'Provide constructive feedback for student resubmission'}
      icon={<XCircle className="text-red-600" size={20} />}
      maxWidth="md"
      footer={
        <div className="flex items-center gap-3 w-full">
          <Button variant="ghost" className="flex-1 text-xs" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1 text-xs font-bold"
            disabled={!rejectionReason.trim()}
            onClick={onConfirm}
          >
            Confirm Rejection
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Reason for Rejection *</label>
          <Textarea
            placeholder="Provide explicit feedback and actionable correction criteria for the student..."
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            required
            className="text-xs min-h-[90px]"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Quick Suggestions:</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              "Screenshot is blurry / illegible",
              "Incorrect proof for this task",
              "Submitted link is private or inaccessible",
              "Does not meet task requirements",
              "Student name/register number mismatch"
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setRejectionReason(chip)}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>
      </div>
    </FloatingModal>
  );
}

export default RejectionModal;
