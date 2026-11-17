import React from 'react';
import { cn } from '../../lib/utils';

export const Table = ({ children, className, ...props }: React.TableHTMLAttributes<HTMLTableElement> & { children?: React.ReactNode }) => (
  <div className="w-full overflow-x-auto custom-scrollbar border border-zinc-200 rounded-2xl bg-white shadow-sm">
    <table className={cn("w-full text-left border-collapse", className)} {...props}>
      {children}
    </table>
  </div>
);

export const THead = ({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement> & { children?: React.ReactNode }) => (
  <thead className={cn("bg-zinc-50 border-b border-zinc-200", className)} {...props}>
    {children}
  </thead>
);

export const TBody = ({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement> & { children?: React.ReactNode }) => (
  <tbody className={cn("divide-y divide-zinc-100 bg-white", className)} {...props}>
    {children}
  </tbody>
);

export const TR = ({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement> & { children?: React.ReactNode }) => (
  <tr className={cn("hover:bg-zinc-50/50 transition-colors h-14 text-sm", className)} {...props}>
    {children}
  </tr>
);

export const TH = ({ children, className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement> & { children?: React.ReactNode }) => (
  <th className={cn("px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider", className)} {...props}>
    {children}
  </th>
);

export const TD = ({ children, className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement> & { children?: React.ReactNode }) => (
  <td className={cn("px-6 py-4 text-zinc-600", className)} {...props}>
    {children}
  </td>
);
