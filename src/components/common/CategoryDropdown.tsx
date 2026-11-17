import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, BookOpen, Briefcase, Building2, Layers, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const CATEGORY_OPTIONS = [
  { value: 'Competition', label: 'Competition', icon: Trophy, symbol: '🏆', color: 'text-rose-600' },
  { value: 'Course', label: 'Course', icon: BookOpen, symbol: '📚', color: 'text-indigo-600' },
  { value: 'Workshop', label: 'Workshop', icon: Briefcase, symbol: '💼', color: 'text-amber-600' },
  { value: 'College Work', label: 'College Work', icon: Building2, symbol: '🏢', color: 'text-emerald-600' },
];

export interface CategoryDropdownProps {
  value: string;
  onChange: (val: string) => void;
}

export function CategoryDropdown({ value, onChange }: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = CATEGORY_OPTIONS.find(o => o.value === value);
  const IconComp = selectedOpt ? selectedOpt.icon : Layers;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 px-3.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm bg-white font-medium flex items-center justify-between shadow-sm hover:border-zinc-300"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <IconComp size={18} className={cn("shrink-0", selectedOpt ? selectedOpt.color : "text-zinc-400")} />
          <span className={cn("truncate", selectedOpt ? "text-zinc-900 font-bold" : "text-zinc-400 font-medium")}>{selectedOpt ? selectedOpt.label : "Select Category (Required)"}</span>
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
            {CATEGORY_OPTIONS.map(opt => {
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
