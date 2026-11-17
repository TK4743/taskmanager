import React from 'react';
import { cn } from '../../lib/utils';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  shimmer?: boolean;
};

export const Skeleton = ({ className, shimmer = true, ...props }: SkeletonProps) => (
  <div className={cn(shimmer ? "skeleton-shimmer" : "animate-pulse bg-zinc-200", "rounded-xl", className)} {...props} />
);
