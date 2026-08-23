import React from 'react';
import { CategoryFilter } from '../types';
import { Bookmark } from 'lucide-react';

interface NavigationProps {
  currentCategory: CategoryFilter;
  onSelectCategory: (category: CategoryFilter) => void;
  categoryCounts: Record<string, number>;
  savedCount?: number;
}

const DESK_SECTIONS: { id: CategoryFilter; label: string }[] = [
  { id: 'Today', label: 'Front Page' },
  { id: 'Research', label: 'Research & Papers' },
  { id: 'Models', label: 'Frontier Models' },
  { id: 'Open Source', label: 'Open Source' },
  { id: 'Business', label: 'Industry & Compute' },
  { id: 'Safety & Policy', label: 'Safety & Policy' },
  { id: 'All', label: 'All Dispatches' },
];

export const Navigation: React.FC<NavigationProps> = ({
  currentCategory,
  onSelectCategory,
  categoryCounts,
  savedCount = 0,
}) => {
  return (
    <nav className="border-b border-[#22272e] bg-[#0f1115]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
          {DESK_SECTIONS.map((desk) => {
            const isActive = currentCategory === desk.id;
            let count: number | undefined;

            if (desk.id === 'All') {
              count = (Object.values(categoryCounts) as number[]).reduce((a, b) => a + b, 0);
            } else if (desk.id === 'Today') {
              count = undefined;
            } else {
              count = categoryCounts[desk.id];
            }

            return (
              <button
                key={desk.id}
                id={`nav-desk-${desk.id.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => onSelectCategory(desk.id)}
                className={`group relative flex shrink-0 items-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#f0f6fc] font-semibold'
                    : 'text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                <span>{desk.label}</span>
                {typeof count === 'number' && count > 0 && (
                  <span
                    className={`font-sans text-[11px] px-1.5 py-0.2 rounded ${
                      isActive
                        ? 'bg-[#21262d] text-[#e6edf3] font-semibold'
                        : 'text-[#6e7681] group-hover:text-[#8b949e]'
                    }`}
                  >
                    {count}
                  </span>
                )}

                {/* Active desk bottom border underline indicator */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#e6edf3]" />
                )}
              </button>
            );
          })}

          {/* Bookmarked / Saved Articles Tab */}
          {savedCount > 0 && (
            <button
              id="nav-desk-saved"
              onClick={() => onSelectCategory('Saved')}
              className={`group relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
                currentCategory === 'Saved'
                  ? 'text-amber-200 font-semibold'
                  : 'text-[#8b949e] hover:text-amber-200'
              }`}
            >
              <Bookmark className="h-3 w-3 text-amber-400" />
              <span>Saved Reading List</span>
              <span className="font-sans text-[11px] px-1.5 py-0.2 rounded bg-amber-950/40 border border-amber-800/50 text-amber-300 font-medium">
                {savedCount}
              </span>
              {currentCategory === 'Saved' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-400" />
              )}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
