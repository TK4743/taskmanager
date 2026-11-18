import React from 'react';
import { Megaphone, GraduationCap } from 'lucide-react';
import { FloatingModal } from './FloatingModal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { cn } from '../../lib/utils';
import type { User, Class } from '../../types';

export interface NoticeFormState {
  title: string;
  description: string;
  priority: string;
  scope: string;
  class_id?: string;
  class_ids?: string[];
  department_id?: string;
}

export interface CreateNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  noticeForm: NoticeFormState;
  setNoticeForm: React.Dispatch<React.SetStateAction<NoticeFormState>>;
  noticeFile: File | null;
  setNoticeFile: (file: File | null) => void;
  isPublishingNotice: boolean;
  onSubmit: (e: React.FormEvent) => void;
  user: User | null;
  classes: Class[];
  isAdmin: boolean;
  isHOD: boolean;
  isAdvisor: boolean;
}

export function CreateNoticeModal({
  isOpen,
  onClose,
  noticeForm,
  setNoticeForm,
  noticeFile,
  setNoticeFile,
  isPublishingNotice,
  onSubmit,
  user,
  classes,
  isAdmin,
  isHOD,
  isAdvisor,
}: CreateNoticeModalProps) {
  if (!isOpen) return null;

  return (
    <FloatingModal
      isOpen={isOpen}
      onClose={onClose}
      title="Publish New Notice"
      subtitle="Broadcast announcements, schedules, and alerts to students"
      icon={<Megaphone className="text-indigo-600" size={20} />}
      maxWidth="max-w-lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
            Notice Title <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="Official circular subject (e.g. Departmental Assessment & Examination Schedule)"
            value={noticeForm.title}
            onChange={e => setNoticeForm(prev => ({ ...prev, title: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
            Description / Content <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            placeholder="Enter official departmental notice content, guidelines, and instructions..."
            value={noticeForm.description}
            onChange={e => setNoticeForm(prev => ({ ...prev, description: e.target.value }))}
            className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-sm bg-white dark:bg-[#181820] text-zinc-800 dark:text-zinc-200"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Priority</label>
            <Select
              value={noticeForm.priority}
              onChange={e => setNoticeForm(prev => ({ ...prev, priority: e.target.value }))}
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Target Scope</label>
            <Select
              value={noticeForm.scope}
              onChange={e => setNoticeForm(prev => ({ ...prev, scope: e.target.value }))}
            >
              {isAdmin && <option value="ALL">All (Global)</option>}
              {(isAdmin || isHOD) && <option value="DEPARTMENT">Department</option>}
              <option value="CLASS">Class</option>
            </Select>
          </div>
        </div>

        {noticeForm.scope === 'CLASS' && (() => {
          const deptClasses = isHOD && user?.department_id
            ? classes.filter(c => String(c.department_id) === String(user.department_id))
            : (isAdvisor && user?.class_id ? classes.filter(c => String(c.id) === String(user.class_id)) : classes);
          const availClasses = deptClasses.length > 0 ? deptClasses : classes;
          const selectedIds = noticeForm.class_ids && noticeForm.class_ids.length > 0
            ? noticeForm.class_ids
            : (noticeForm.class_id ? [noticeForm.class_id] : []);
          const allSelected = availClasses.length > 0 && availClasses.every(c => selectedIds.includes(String(c.id)));

          return (
            <div className="space-y-2 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <GraduationCap size={16} className="text-indigo-600" /> Target Classes <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    {selectedIds.length} selected
                  </span>
                  {availClasses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (allSelected) {
                          setNoticeForm(prev => ({ ...prev, class_ids: [], class_id: '' }));
                        } else {
                          const allCids = availClasses.map(c => String(c.id));
                          setNoticeForm(prev => ({ ...prev, class_ids: allCids, class_id: allCids[0] || '' }));
                        }
                      }}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 underline cursor-pointer"
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1">
                {availClasses.map(c => {
                  const isSelected = selectedIds.includes(String(c.id));
                  return (
                    <label
                      key={c.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border text-xs font-medium cursor-pointer transition-all",
                        isSelected
                          ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-300 shadow-sm"
                          : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => {
                          if (e.target.checked) {
                            const next = [...selectedIds, String(c.id)];
                            setNoticeForm(prev => ({ ...prev, class_ids: next, class_id: next[0] || '' }));
                          } else {
                            const next = selectedIds.filter(id => id !== String(c.id));
                            setNoticeForm(prev => ({ ...prev, class_ids: next, class_id: next[0] || '' }));
                          }
                        }}
                        className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                      <span className="truncate">{c.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <div>
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
            Attachment File (Optional PDF / Image)
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={e => setNoticeFile(e.target.files?.[0] || null)}
            className="w-full text-xs text-zinc-600 dark:text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 dark:file:bg-zinc-800 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 cursor-pointer"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            disabled={isPublishingNotice}
          >
            {isPublishingNotice ? 'Publishing...' : 'Publish Notice'}
          </Button>
        </div>
      </form>
    </FloatingModal>
  );
}

export default CreateNoticeModal;
