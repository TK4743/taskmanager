import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, X } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Task } from '../../types';

export interface ExtendDeadlineModalProps {
  task: Task | null;
  onClose: () => void;
  extendedDeadline: string;
  setExtendedDeadline: (deadline: string) => void;
  onExtend: (taskId: string | number, newDeadlineIso: string) => void;
}

export function ExtendDeadlineModal({
  task,
  onClose,
  extendedDeadline,
  setExtendedDeadline,
  onExtend,
}: ExtendDeadlineModalProps) {
  if (!task) return null;

  const minDate = (() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[130] flex items-center justify-center p-4 cursor-pointer"
        onClick={onClose}
      >
        <motion.div
          onClick={e => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-[#181820] rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl space-y-4 cursor-default border border-zinc-100 dark:border-zinc-800"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Clock className="text-indigo-600 dark:text-indigo-400" size={20} /> Extend Deadline & Reopen
            </h3>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
              <X size={18} />
            </button>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
            Task: <span className="font-bold text-zinc-900 dark:text-zinc-100">{task.title}</span>
          </p>

          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              New Extended Deadline Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={extendedDeadline}
              onChange={e => setExtendedDeadline(e.target.value)}
              min={minDate}
              className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121218] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 rounded-xl text-xs"
              onClick={() => onExtend(task.id, extendedDeadline)}
              disabled={!extendedDeadline}
            >
              Save New Deadline & Reopen
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ExtendDeadlineModal;
