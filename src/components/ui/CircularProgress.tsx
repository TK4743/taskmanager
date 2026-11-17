import React from 'react';
import { cn } from '../../lib/utils';

export interface CircularProgressProps {
  percentage?: number;
  value?: number;
  total?: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const CircularProgress = ({
  percentage: propPercentage,
  value = 0,
  total = 0,
  label,
  size = 'md',
  color = 'text-indigo-500',
}: CircularProgressProps) => {
  const percentage = propPercentage !== undefined ? propPercentage : (total > 0 ? (value / total) * 100 : 0);

  const dimensions = {
    sm: { size: 48, stroke: 4, radius: 18 },
    md: { size: 96, stroke: 8, radius: 36 },
    lg: { size: 96, stroke: 8, radius: 36 },
  }[size];

  const circumference = 2 * Math.PI * dimensions.radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dimensions.size, height: dimensions.size }}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={dimensions.radius}
            stroke="currentColor"
            strokeWidth={dimensions.stroke}
            fill="transparent"
            className="text-zinc-100 dark:text-zinc-800"
          />
          <circle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={dimensions.radius}
            stroke="currentColor"
            strokeWidth={dimensions.stroke}
            fill="transparent"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: offset }}
            className={cn("transition-all duration-1000 ease-out", color)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold text-zinc-900 dark:text-zinc-100", size === 'lg' ? "text-lg" : "text-xs")}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      <span className="text-xs font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">{label}</span>
    </div>
  );
};

export default CircularProgress;
