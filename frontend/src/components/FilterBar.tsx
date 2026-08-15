import React from 'react';
import { Filter, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';
import { FilterState, SortOption } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  availableSources: string[];
  totalCount: number;
  filteredCount: number;
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  availableSources,
  totalCount,
  filteredCount,
  onResetFilters,
}) => {
  const isFiltered =
    filters.category !== 'All' ||
    filters.minImportance > 0 ||
    filters.source !== 'all' ||
    filters.searchQuery.trim().length > 0;

  const importancePills = [
    { label: 'All Scores', value: 0 },
    { label: '★ 7+ High', value: 7 },
    { label: '★ 8+ Major', value: 8 },
    { label: '★ 9+ Critical', value: 9 },
  ];

  return (
    <div className="border-b border-slate-800/40 bg-slate-950/20 py-3">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          
          {/* Left: Importance threshold pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <SlidersHorizontal className="h-3 w-3 text-slate-400" />
              Importance:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {importancePills.map((pill) => {
                const isSelected = filters.minImportance === pill.value;
                return (
                  <button
                    key={pill.value}
                    id={`filter-importance-${pill.value}`}
                    onClick={() => onFilterChange({ minImportance: pill.value })}
                    className={`rounded-md px-2.5 py-1 text-xs font-mono transition-all ${
                      isSelected
                        ? 'border border-cyan-500/50 bg-cyan-950/50 text-cyan-300 font-semibold'
                        : 'border border-slate-800/80 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Source filter & Sort & Reset */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Source dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 hidden sm:inline-flex items-center gap-1">
                <Filter className="h-3 w-3 text-slate-400" />
                Source:
              </span>
              <select
                id="source-filter-select"
                value={filters.source}
                onChange={(e) => onFilterChange({ source: e.target.value })}
                className="rounded-md border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
              >
                <option value="all">All Sources ({availableSources.length})</option>
                {availableSources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort by dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 hidden sm:inline-flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3 text-slate-400" />
                Sort:
              </span>
              <select
                id="sort-by-select"
                value={filters.sortBy}
                onChange={(e) => onFilterChange({ sortBy: e.target.value as SortOption })}
                className="rounded-md border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
              >
                <option value="importance-desc">Highest Importance</option>
                <option value="newest">Newest / Recent</option>
                <option value="importance-asc">Lowest Importance</option>
                <option value="source-asc">Source Name (A-Z)</option>
              </select>
            </div>

            {/* Active filters clear button */}
            {isFiltered && (
              <button
                id="reset-filters-btn"
                onClick={onResetFilters}
                className="flex items-center gap-1 rounded-md border border-rose-500/20 bg-rose-950/20 px-2 py-1 text-xs font-mono text-rose-300 hover:bg-rose-950/40 transition-colors"
                title="Reset all filters"
              >
                <X className="h-3 w-3" />
                <span>Reset ({filteredCount}/{totalCount})</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
