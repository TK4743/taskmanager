import React from 'react';
import { Code } from 'lucide-react';
import { FloatingModal } from '../../FloatingModal';
import { Button } from '../ui/Button';
import type { User, Department, Class } from '../../types';

export interface AssignTargetFormState {
  scopeType: string;
  targetValue: string;
  dailyTarget: string;
  weeklyTarget: string;
  startDate: string;
  endDate: string;
}

export interface AssignTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  departments: Department[];
  classes: Class[];
  users: User[];
  assignTargetForm: AssignTargetFormState;
  setAssignTargetForm: React.Dispatch<React.SetStateAction<AssignTargetFormState>>;
  submittingTarget: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function AssignTargetModal({
  isOpen,
  onClose,
  user,
  departments,
  classes,
  users,
  assignTargetForm,
  setAssignTargetForm,
  submittingTarget,
  onSubmit,
}: AssignTargetModalProps) {
  if (!isOpen) return null;

  const isAdv = user?.role === 'CLASS_ADVISOR' || (user?.role === 'STUDENT' && user?.is_coordinator);

  return (
    <FloatingModal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Coding Target"
      description="Configure structured weekly LeetCode and GitHub goals"
      icon={<Code size={20} className="text-orange-500" />}
      maxWidth="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Target Scope */}
        <div>
          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Target Scope
          </label>
          <select
            value={assignTargetForm.scopeType}
            onChange={(e) => {
              const val = e.target.value;
              setAssignTargetForm(prev => ({
                ...prev,
                scopeType: val,
                targetValue: '', // Reset child selection on parent change
              }));
            }}
            className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none bg-white dark:bg-[#181820] cursor-pointer"
          >
            <option value="">Select Target Scope</option>
            {!isAdv && <option value="DEPARTMENT">Department-wide</option>}
            {!isAdv && <option value="YEAR">Batch / Year-wide</option>}
            <option value="CLASS">Class Section-wide</option>
            <option value="STUDENT">Individual Student</option>
          </select>
        </div>

        {/* Scope Value */}
        {assignTargetForm.scopeType && (
          <div>
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Select Option (Required)
            </label>
            {assignTargetForm.scopeType === 'DEPARTMENT' && (
              <select
                value={assignTargetForm.targetValue}
                onChange={(e) => setAssignTargetForm(prev => ({ ...prev, targetValue: e.target.value }))}
                className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none bg-white dark:bg-[#181820] cursor-pointer"
                required
              >
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}

            {assignTargetForm.scopeType === 'YEAR' && (
              <select
                value={assignTargetForm.targetValue}
                onChange={(e) => setAssignTargetForm(prev => ({ ...prev, targetValue: e.target.value }))}
                className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none bg-white dark:bg-[#181820] cursor-pointer"
                required
              >
                <option value="">Select Year / Batch</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            )}

            {assignTargetForm.scopeType === 'CLASS' && (
              <select
                value={assignTargetForm.targetValue}
                onChange={(e) => setAssignTargetForm(prev => ({ ...prev, targetValue: e.target.value }))}
                className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none bg-white dark:bg-[#181820] cursor-pointer"
                required
              >
                <option value="">Select Class Section</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (Year {c.year})</option>
                ))}
              </select>
            )}

            {assignTargetForm.scopeType === 'STUDENT' && (
              <select
                value={assignTargetForm.targetValue}
                onChange={(e) => setAssignTargetForm(prev => ({ ...prev, targetValue: e.target.value }))}
                className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none bg-white dark:bg-[#181820] cursor-pointer"
                required
              >
                <option value="">Select Individual Student</option>
                {users.filter(u => u.role === 'STUDENT').map(u => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.register_number})</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Targets */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Daily Target</label>
            <input
              type="number"
              min="0"
              value={assignTargetForm.dailyTarget}
              onChange={(e) => {
                const val = e.target.value;
                const parsed = parseInt(val, 10) || 0;
                setAssignTargetForm(prev => ({
                  ...prev,
                  dailyTarget: val,
                  weeklyTarget: String(parsed * 7),
                }));
              }}
              className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none bg-white dark:bg-[#181820]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Weekly Target</label>
            <input
              type="number"
              min="0"
              value={assignTargetForm.weeklyTarget}
              onChange={(e) => setAssignTargetForm(prev => ({ ...prev, weeklyTarget: e.target.value }))}
              className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none bg-white dark:bg-[#181820]"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Start Date</label>
            <input
              type="date"
              value={assignTargetForm.startDate}
              onChange={(e) => {
                const startVal = e.target.value;
                const parts = startVal.split('-');
                const yr = parseInt(parts[0], 10);
                const mo = parseInt(parts[1], 10) - 1;
                const dy = parseInt(parts[2], 10);

                const localDate = new Date(yr, mo, dy);
                localDate.setDate(localDate.getDate() + 6);

                const endVal = localDate.getFullYear() + '-' +
                  String(localDate.getMonth() + 1).padStart(2, '0') + '-' +
                  String(localDate.getDate()).padStart(2, '0');

                setAssignTargetForm(prev => ({
                  ...prev,
                  startDate: startVal,
                  endDate: endVal,
                }));
              }}
              className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none bg-white dark:bg-[#181820] cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">End Date</label>
            <input
              type="date"
              value={assignTargetForm.endDate}
              onChange={(e) => setAssignTargetForm(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none bg-white dark:bg-[#181820] cursor-pointer"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <Button type="submit" disabled={submittingTarget} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold p-3 rounded-xl transition-all disabled:opacity-50">
            {submittingTarget ? 'Creating...' : 'Create Target'}
          </Button>
        </div>
      </form>
    </FloatingModal>
  );
}

export default AssignTargetModal;
