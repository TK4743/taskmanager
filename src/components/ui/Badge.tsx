import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' | 'outline';
  className?: string;
}

export const Badge = ({ children, variant = 'neutral', className }: BadgeProps) => {
  const styles: Record<string, string> = {
    success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border border-amber-100",
    danger: "bg-red-50 text-red-700 border border-red-100",
    info: "bg-blue-50 text-blue-700 border border-blue-100",
    neutral: "bg-zinc-100 text-zinc-600 border border-zinc-200",
    primary: "bg-indigo-50 text-indigo-700 border border-indigo-100",
    outline: "bg-transparent text-zinc-700 border border-zinc-300 dark:border-zinc-700",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-bold uppercase tracking-tight inline-flex items-center gap-1.5", styles[variant] || styles.neutral, className)}>
      {children}
    </span>
  );
};
