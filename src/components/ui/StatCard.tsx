import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from './Card';

export interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: string;
  emoji?: string;
}

export function StatCard({ title, value, icon, color, emoji }: StatCardProps) {
  const key = color?.replace('bg-', '')?.replace('-500', '')?.replace('-600', '') || 'blue';
  const colorMap: Record<string, { bg: string; border: string }> = {
    blue: { bg: 'bg-blue-600', border: 'border-blue-100' },
    emerald: { bg: 'bg-emerald-600', border: 'border-emerald-100' },
    indigo: { bg: 'bg-indigo-600', border: 'border-indigo-100' },
    orange: { bg: 'bg-amber-500', border: 'border-amber-100' },
    amber: { bg: 'bg-amber-500', border: 'border-amber-100' },
    purple: { bg: 'bg-purple-600', border: 'border-purple-100' },
  };

  const scheme = colorMap[key] || colorMap.blue;

  return (
    <Card className={cn("relative overflow-hidden p-3.5 sm:p-5 border shadow-xs hover:shadow-md transition-all bg-white dark:bg-[#141418] rounded-xl sm:rounded-2xl", scheme.border)}>
      <div className="flex items-center justify-between gap-2.5 sm:gap-4">
        <div className="space-y-0.5 sm:space-y-1 min-w-0">
          <p className="text-[10px] sm:text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">{title}</p>
          <p className="text-xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{value}</p>
        </div>
        <div className={cn("w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0", scheme.bg)}>
          {icon ? (React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 18 }) : icon) : (emoji || <LayoutDashboard size={18} />)}
        </div>
      </div>
    </Card>
  );
}
