import React from 'react';
import { cn } from '../../lib/utils';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  children?: React.ReactNode;
};

export const Select = ({ className, children, ...props }: SelectProps) => (
  <select
    className={cn('w-full h-11 px-4 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm bg-white text-zinc-900 font-semibold cursor-pointer', className)}
    {...props}
  >
    {children}
  </select>
);
