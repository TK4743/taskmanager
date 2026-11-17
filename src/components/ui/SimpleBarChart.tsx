import React from 'react';
import { cn } from '../../lib/utils';

export interface SimpleBarChartItem {
  label: string;
  value: number;
  total: number;
}

export interface SimpleBarChartProps {
  data: SimpleBarChartItem[];
  label: string;
  color?: string;
}

export const SimpleBarChart = ({ data, label, color = "bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500" }: SimpleBarChartProps) => {
  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">{label}</h4>
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {data.map((item, i) => {
          const percentage = item.total > 0 ? (item.value / item.total) * 100 : 0;
          return (
            <div key={i} className="group">
              <div className="flex justify-between items-center mb-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200">
                <span className="truncate mr-4">{item.label}</span>
                <span className="text-zinc-400 dark:text-zinc-400 font-mono text-xs whitespace-nowrap">{item.value}/{item.total}</span>
              </div>
              <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800/90 rounded-full overflow-hidden border border-zinc-200/60 dark:border-zinc-700/80 shadow-inner">
                <div
                  className={cn("h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_8px_rgba(56,189,248,0.4)]", color)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
