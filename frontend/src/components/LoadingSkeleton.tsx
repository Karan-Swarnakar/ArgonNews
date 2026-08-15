import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Top Developments Skeleton */}
      <div>
        <div className="h-6 w-48 bg-slate-800/80 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-28 bg-slate-800 rounded" />
                <div className="h-5 w-20 bg-slate-800 rounded-md" />
              </div>
              <div className="h-6 w-5/6 bg-slate-800/90 rounded" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-slate-800/60 rounded" />
                <div className="h-3 w-4/5 bg-slate-800/60 rounded" />
              </div>
              <div className="h-16 bg-slate-950/60 rounded-lg p-3" />
              <div className="flex gap-2">
                <div className="h-4 w-16 bg-slate-800 rounded" />
                <div className="h-4 w-20 bg-slate-800 rounded" />
                <div className="h-4 w-24 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feed Skeleton */}
      <div>
        <div className="h-6 w-36 bg-slate-800/80 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-slate-800 rounded" />
                <div className="h-5 w-16 bg-slate-800 rounded-md" />
              </div>
              <div className="h-5 w-4/5 bg-slate-800/90 rounded" />
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-slate-800/60 rounded" />
                <div className="h-3 w-3/4 bg-slate-800/60 rounded" />
              </div>
              <div className="flex gap-1.5 pt-2">
                <div className="h-4 w-14 bg-slate-800 rounded" />
                <div className="h-4 w-16 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
