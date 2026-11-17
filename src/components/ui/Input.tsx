import React from 'react';
import { cn } from '../../lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ className, ...props }: InputProps) => (
  <input
    autoComplete="off"
    autoCorrect="off"
    spellCheck={false}
    translate="no"
    className={cn('w-full h-11 px-4 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm bg-white text-zinc-900 placeholder:text-zinc-400 truncate notranslate', className)}
    {...props}
  />
);
