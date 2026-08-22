import React from 'react';
import { Search, RefreshCw, X, Bookmark } from 'lucide-react';
import { ApiStatus } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  apiStatus: ApiStatus;
  onToggleDataSource: () => void;
  onOpenDiagnostics?: () => void;
  savedCount: number;
  onOpenSaved: () => void;
  isSavedActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onRefresh,
  isLoading,
  apiStatus,
  onToggleDataSource,
  savedCount,
  onOpenSaved,
  isSavedActive,
}) => {
  // Format current date in classic broadsheet style
  const currentDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="border-b border-[#22272e] bg-[#0c0e11] text-[#e2e8f0]">
      {/* 1. Top Utility / Edition Bar */}
      <div className="border-b border-[#1c2128] bg-[#090a0d] px-4 py-2 text-xs text-[#94a3b8]">
        <div className="mx-auto flex max-w-7xl items-center justify-between font-sans text-xs">
          {/* Left: Date */}
          <div className="flex items-center">
            <span className="text-[#94a3b8] font-normal tracking-normal">{currentDate}</span>
          </div>

          {/* Right: Active Feeds and Saved */}
          <div className="flex items-center gap-4">
            {/* Active Feed Status */}
            <button
              onClick={onToggleDataSource}
              id="header-toggle-backend"
              className="flex items-center gap-1.5 text-[#94a3b8] hover:text-[#f0f6fc] transition-colors"
              title="Intelligence feed status"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  apiStatus.isMock
                    ? 'bg-amber-400'
                    : apiStatus.connected
                    ? 'bg-emerald-400'
                    : 'bg-rose-400'
                }`}
              />
              <span className="font-normal">
                {apiStatus.isMock
                  ? 'Dev Mock'
                  : apiStatus.connected
                  ? `Active Feeds (${apiStatus.articleCount.toLocaleString()})`
                  : 'Feed Offline'}
              </span>
            </button>

            <span className="text-[#2d333b]">•</span>

            {/* Saved Dispatches Counter */}
            <button
              onClick={onOpenSaved}
              id="header-saved-articles-btn"
              className={`flex items-center gap-1.5 transition-colors ${
                isSavedActive ? 'text-amber-300 font-medium' : 'text-[#94a3b8] hover:text-[#f0f6fc]'
              }`}
              title="View saved dispatches"
            >
              <Bookmark className={`h-3.5 w-3.5 ${isSavedActive ? 'fill-amber-300' : ''}`} />
              <span className="font-normal">Saved ({savedCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Masthead Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          
          {/* Logo & Headline */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-sans text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-[#161b22] text-[#94a3b8] border border-[#2d333b]">
                Research & Industry Digest
              </span>
            </div>
            <a href="#" className="group block">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#f0f6fc] group-hover:text-amber-100 transition-colors">
                ARGON NEWS
              </h1>
            </a>
            <p className="mt-1 text-xs sm:text-sm text-[#8b949e] font-sans max-w-xl">
              Distilled intelligence on frontier models, machine learning breakthroughs, compute infrastructure, and algorithmic safety.
            </p>
          </div>

          {/* Search Bar & Refresh */}
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6e7681] pointer-events-none" />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search models, labs, topics (e.g. Qwen, ArXiv)..."
                className="w-full rounded border border-[#30363d] bg-[#14161a] pl-8 pr-7 py-1.5 text-xs text-[#e2e8f0] placeholder-[#6e7681] transition-colors focus:border-[#58a6ff] focus:bg-[#161b22] focus:outline-none font-sans"
              />
              {searchQuery && (
                <button
                  id="clear-search-btn"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6e7681] hover:text-[#c9d1d9] p-0.5"
                  title="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <button
              id="refresh-feed-btn"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded border border-[#30363d] bg-[#161b22] px-3 py-1.5 text-xs font-medium text-[#c9d1d9] hover:bg-[#21262d] hover:text-white disabled:opacity-50 transition-colors shrink-0 font-sans"
              title="Refresh intelligence feed"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
