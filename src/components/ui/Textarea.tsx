import React from 'react';
import { cn } from '../../lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = ({ className, ...props }: TextareaProps) => (
  <textarea
    autoComplete="off"
    autoCorrect="off"
    spellCheck={false}
    translate="no"
    className={cn('w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm min-h-[100px] resize-y bg-white notranslate', className)}
    {...props}
  />
);
