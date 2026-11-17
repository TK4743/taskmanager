import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, BookOpen, Briefcase, Building2, Layers, ChevronRight, CheckCircle2,
  Code2, Award, FileSpreadsheet, Plus
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { API_URL } from '../../config';

interface CategoryItem {
  value: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}

const KNOWN_CATEGORY_ICONS: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; color: string }> = {
  'Competition': { icon: Trophy, color: 'text-rose-600' },
  'Course': { icon: BookOpen, color: 'text-indigo-600' },
  'Workshop': { icon: Briefcase, color: 'text-amber-600' },
  'College Work': { icon: Building2, color: 'text-emerald-600' },
  'Hackathon': { icon: Code2, color: 'text-purple-600' },
  'Certification': { icon: Award, color: 'text-blue-600' },
  'Assignment': { icon: FileSpreadsheet, color: 'text-teal-600' },
};

export interface CategoryDropdownProps {
  value: string;
  onChange: (val: string) => void;
  categories?: string[];
}

export function CategoryDropdown({ value, onChange, categories: propCategories }: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fetchedCategories, setFetchedCategories] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsAddingCustom(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch distinct categories from database tasks if not supplied via props
  useEffect(() => {
    if (!propCategories || propCategories.length === 0) {
      const token = localStorage.getItem('token');
      if (token) {
        fetch(`${API_URL}/api/tasks/meta/options`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data && Array.isArray(data.categories)) {
              setFetchedCategories(data.categories);
            }
          })
          .catch(() => {});
      }
    }
  }, [propCategories]);

  const activeCategories: CategoryItem[] = useMemo(() => {
    const rawList = propCategories && propCategories.length > 0 ? propCategories : fetchedCategories;
    const set = new Set<string>();
    
    // Add known defaults if empty
    if (rawList.length === 0) {
      ['Competition', 'Course', 'Workshop', 'College Work'].forEach(c => set.add(c));
    } else {
      rawList.forEach(c => {
        if (c && c.trim()) set.add(c.trim());
      });
    }

    if (value && value.trim()) set.add(value.trim());

    return Array.from(set).map(cat => {
      const known = KNOWN_CATEGORY_ICONS[cat];
      return {
        value: cat,
        label: cat,
        icon: known ? known.icon : Layers,
        color: known ? known.color : 'text-zinc-600'
      };
    });
  }, [propCategories, fetchedCategories, value]);

  const selectedOpt = activeCategories.find(o => o.value.toLowerCase() === (value || '').toLowerCase());
  const IconComp = selectedOpt ? selectedOpt.icon : Layers;

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setCustomInput('');
    setIsAddingCustom(false);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 px-3.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm bg-white font-medium flex items-center justify-between shadow-sm hover:border-zinc-300 cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <IconComp size={18} className={cn("shrink-0", selectedOpt ? selectedOpt.color : "text-zinc-400")} />
          <span className={cn("truncate", selectedOpt ? "text-zinc-900 font-bold" : "text-zinc-400 font-medium")}>
            {selectedOpt ? selectedOpt.label : "Select Category (Required)"}
          </span>
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
            className="absolute left-0 right-0 top-full z-50 bg-white rounded-xl border border-zinc-200 shadow-xl py-1 overflow-hidden mt-1 max-h-72 overflow-y-auto"
          >
            {activeCategories.map(opt => {
              const OptIcon = opt.icon;
              const isSelected = opt.value.toLowerCase() === (value || '').toLowerCase();
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setIsAddingCustom(false);
                  }}
                  className={cn(
                    "w-full px-3.5 py-2.5 text-xs font-bold flex items-center justify-between transition-colors text-left cursor-pointer",
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

            {/* Custom Category Input Option */}
            <div className="border-t border-zinc-100 p-2 bg-zinc-50/70">
              {isAddingCustom ? (
                <form onSubmit={handleAddCustom} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="New category name..."
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    autoFocus
                    className="flex-1 px-2.5 py-1.5 text-xs font-medium bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAddingCustom(false); setCustomInput(''); }}
                    className="px-2 py-1.5 text-zinc-500 hover:text-zinc-700 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(true)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/60 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>+ Custom Category</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
