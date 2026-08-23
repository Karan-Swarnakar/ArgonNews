import React from 'react';
import { X, Grid, List, Columns } from 'lucide-react';
import { FilterState, SortOption, ViewMode } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  availableSources: string[];
  sourceCounts?: Record<string, number>;
  totalCount: number;
  filteredCount: number;
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  availableSources,
  sourceCounts = {},
  totalCount,
  filteredCount,
  onResetFilters,
}) => {
  const isFiltered =
    (filters.category !== 'All' && filters.category !== 'Today') ||
    filters.source !== 'all' ||
    Boolean(filters.selectedEntity) ||
    filters.searchQuery.trim().length > 0 ||
    filters.sortBy !== 'newest';

  const viewModes: { id: ViewMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'editorial', label: 'Broadsheet (Image + Story)', icon: Columns },
    { id: 'magazine', label: '2-Col Grid', icon: Grid },
    { id: 'dense', label: 'Wire Scan', icon: List },
  ];

  return (
    <div className="border-b border-[#22272e] bg-[#0c0e11] py-2.5 text-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          
          {/* Left: Active Entity Pill or Status */}
          <div className="flex items-center gap-2 flex-wrap min-h-[28px]">
            {filters.selectedEntity ? (
              <span className="inline-flex items-center gap-1.5 rounded bg-[#1c2128] border border-[#38414e] px-2.5 py-1 text-[11px] font-sans text-amber-200">
                <span className="text-[#8b949e]">Filtered by:</span>
                <span className="font-semibold text-[#f1f5f9]">{filters.selectedEntity}</span>
                <button
                  onClick={() => onFilterChange({ selectedEntity: undefined })}
                  className="hover:text-white ml-1 text-[#8b949e] cursor-pointer"
                  title="Clear filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : (
              <div className="text-[11px] font-sans text-[#6e7681]">
                <span>Showing {filteredCount} of {totalCount} verified intelligence dispatches</span>
              </div>
            )}
          </div>

          {/* Right: Source filter, Sort order, View mode toggle & Reset */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Source select */}
            <div className="flex items-center gap-1.5">
              <span className="font-sans text-[11px] font-medium uppercase text-[#6e7681] hidden sm:inline">
                Source:
              </span>
              <select
                id="source-filter-select"
                value={filters.source}
                onChange={(e) => onFilterChange({ source: e.target.value })}
                className="rounded border border-[#30363d] bg-[#14161a] px-2.5 py-1 text-xs text-[#c9d1d9] focus:border-[#58a6ff] focus:outline-none font-sans max-w-[200px] truncate cursor-pointer"
              >
                <option value="all">All Sources ({availableSources.length})</option>
                {availableSources.map((source) => {
                  const count = sourceCounts[source];
                  return (
                    <option key={source} value={source}>
                      {source} {count ? `(${count})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Sort order select */}
            <div className="flex items-center gap-1.5">
              <span className="font-sans text-[11px] font-medium uppercase text-[#6e7681] hidden sm:inline">
                Sort:
              </span>
              <select
                id="sort-by-select"
                value={filters.sortBy}
                onChange={(e) => onFilterChange({ sortBy: e.target.value as SortOption })}
                className="rounded border border-[#30363d] bg-[#14161a] px-2.5 py-1 text-xs font-medium text-[#c9d1d9] focus:border-[#58a6ff] focus:outline-none font-sans cursor-pointer"
              >
                <option value="newest">Latest (Newest First)</option>
                <option value="importance-desc">Greatest Impact</option>
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="hidden sm:inline-flex rounded border border-[#30363d] bg-[#14161a] p-0.5">
              {viewModes.map((mode) => {
                const Icon = mode.icon;
                const isSelected = filters.viewMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    id={`view-mode-${mode.id}`}
                    onClick={() => onFilterChange({ viewMode: mode.id })}
                    className={`rounded p-1 text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#21262d] text-[#f0f6fc]'
                        : 'text-[#6e7681] hover:text-[#c9d1d9]'
                    }`}
                    title={mode.label}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                );
              })}
            </div>

            {/* Reset Filters */}
            {isFiltered && (
              <button
                id="reset-filters-btn"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 rounded border border-[#38414e] bg-[#1c2128] px-2.5 py-1 text-[11px] font-sans font-medium text-[#c9d1d9] hover:text-white transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <X className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
