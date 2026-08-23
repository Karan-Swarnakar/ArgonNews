import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Top Editorial Skeleton */}
      <div className="pb-8 border-b-2 border-slate-200 dark:border-[#262c35]">
        <div className="h-4 w-40 bg-slate-200 dark:bg-[#21262d] mb-6 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-3 w-32 bg-slate-200 dark:bg-[#21262d] rounded" />
              <div className="h-3 w-20 bg-slate-200 dark:bg-[#21262d] rounded" />
            </div>
            <div className="h-8 w-5/6 bg-slate-200 dark:bg-[#21262d] rounded" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-slate-100 dark:bg-[#1c2128] rounded" />
              <div className="h-3 w-4/5 bg-slate-100 dark:bg-[#1c2128] rounded" />
            </div>
            <div className="h-16 bg-slate-50 dark:bg-[#161a22] p-3 border-l-2 border-slate-300 dark:border-[#3b434e] rounded-r" />
            <div className="flex gap-4 pt-2 border-t border-slate-200 dark:border-[#21262d]">
              <div className="h-3 w-24 bg-slate-200 dark:bg-[#21262d] rounded" />
              <div className="h-3 w-24 bg-slate-200 dark:bg-[#21262d] rounded" />
            </div>
          </div>

          <div className="lg:col-span-5 lg:border-l lg:border-slate-200 dark:lg:border-[#262c35] lg:pl-8 flex flex-col justify-between space-y-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className={`space-y-3 ${i > 1 ? 'pt-6 border-t border-slate-200 dark:border-[#21262d]' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <div className="h-3 w-28 bg-slate-200 dark:bg-[#21262d] rounded" />
                  <div className="h-3 w-16 bg-slate-200 dark:bg-[#21262d] rounded" />
                </div>
                <div className="h-5 w-4/5 bg-slate-200 dark:bg-[#21262d] rounded" />
                <div className="h-3 w-full bg-slate-100 dark:bg-[#1c2128] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* List Skeleton */}
      <div>
        <div className="h-4 w-36 bg-slate-200 dark:bg-[#21262d] mb-4 border-b border-slate-200 dark:border-[#2d333b] pb-2 rounded" />
        <div className="divide-y divide-slate-200 dark:divide-[#21262d]">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="py-5 space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="h-3 w-28 bg-slate-200 dark:bg-[#21262d] rounded" />
                <div className="h-3 w-16 bg-slate-200 dark:bg-[#21262d] rounded" />
              </div>
              <div className="h-5 w-4/5 bg-slate-200 dark:bg-[#21262d] rounded" />
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-slate-100 dark:bg-[#1c2128] rounded" />
                <div className="h-3 w-3/4 bg-slate-100 dark:bg-[#1c2128] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
