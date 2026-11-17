import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, CheckCircle2, Upload, XCircle, Clock, AlertTriangle, ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All', icon: LayoutDashboard, color: 'text-zinc-500' },
  { value: 'VERIFIED', label: 'Verified', icon: CheckCircle2, color: 'text-emerald-600' },
  { value: 'SUBMITTED', label: 'Submitted', icon: Upload, color: 'text-blue-600' },
  { value: 'REJECTED', label: 'Rejected', icon: XCircle, color: 'text-red-500' },
  { value: 'NOT_SUBMITTED', label: 'Not Submitted', icon: Clock, color: 'text-amber-500' },
  { value: 'NOT_PARTICIPATING', label: 'Not Participating', icon: AlertTriangle, color: 'text-orange-500' },
];

export interface StatusDropdownProps {
  value: string;
  onChange: (val: string) => void;
}

export function StatusDropdown({ value, onChange }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = STATUS_OPTIONS.find(o => o.value === value) || STATUS_OPTIONS[0];
  const IconComp = selectedOpt.icon;

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 px-3.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm bg-white font-medium flex items-center justify-between shadow-sm hover:border-zinc-300"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <IconComp size={18} className={cn("shrink-0", selectedOpt.color)} />
          <span className="truncate text-zinc-900 font-bold">{selectedOpt.label}</span>
        </div>
        <ChevronRight size={16} className={cn("text-zinc-400 transition-transform duration-200 shrink-0", isOpen ? "rotate-90" : "")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 bg-white rounded-xl border border-zinc-200 shadow-xl py-1 overflow-hidden mt-1 max-h-60 overflow-y-auto"
          >
            {STATUS_OPTIONS.map(opt => {
              const OptIcon = opt.icon;
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full px-3.5 py-2.5 text-xs font-bold flex items-center justify-between transition-colors text-left",
                    isSelected ? "bg-zinc-100 text-zinc-900" : "text-zinc-700 hover:bg-zinc-50"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <OptIcon size={18} className={cn("shrink-0", opt.color)} />
                    <span className="text-sm font-semibold">{opt.label}</span>
                  </div>
                  {isSelected && <CheckCircle2 size={16} className="text-zinc-900 shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
