import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export function ViewLoadingFallback() {
  return (
    <div className="w-full h-full min-h-[500px] flex flex-col p-4 sm:p-6 md:p-8 space-y-6 overflow-hidden animate-in fade-in duration-200">
      {/* Top Banner Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 sm:w-64 rounded-xl" />
          <Skeleton className="h-4 w-32 sm:w-44 rounded-lg" />
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Skeleton className="h-10 w-28 sm:w-36 rounded-xl flex-1 sm:flex-initial" />
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
        </div>
      </div>

      {/* 4 Metric Stat Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141418] border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-20 rounded-md" />
              <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-3 w-28 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main Workspace Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#141418] border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
          <div className="space-y-3 pt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/50 border border-zinc-100/80 dark:border-zinc-800/80">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                    <Skeleton className="h-3 w-1/2 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-7 w-20 rounded-full shrink-0 ml-3" />
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#141418] border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <Skeleton className="h-5 w-32 rounded-lg" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="space-y-4 flex-1">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-4 w-2/3 rounded-md" />
            </div>
            <div className="pt-2 flex gap-2">
              <Skeleton className="h-9 flex-1 rounded-xl" />
              <Skeleton className="h-9 flex-1 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
