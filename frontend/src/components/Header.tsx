import React from 'react';
import { Search, RefreshCw, Radio, Terminal, Settings, X } from 'lucide-react';
import { ApiStatus } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  apiStatus: ApiStatus;
  onToggleDataSource: () => void;
  onOpenDiagnostics: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onRefresh,
  isLoading,
  apiStatus,
  onToggleDataSource,
  onOpenDiagnostics
}) => {
  // Format current date nicely
  const currentDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between md:py-3.5">
          
          {/* Logo & Brand Tagline */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <a href="#" className="group flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 font-mono font-bold text-sm shadow-sm shadow-cyan-950">
                  Ar
                </div>
                <div className="flex items-baseline">
                  <span className="text-xl font-bold tracking-tight text-slate-100 group-hover:text-white transition-colors">
                    ARGON
                  </span>
                  <span className="text-xl font-extrabold tracking-tight text-cyan-400">
                    NEWS
                  </span>
                </div>
              </a>
              <span className="hidden sm:inline-block text-xs font-mono text-slate-400 border-l border-slate-800 pl-3">
                AI intelligence, distilled.
              </span>
            </div>

            {/* Mobile Data Source Badge */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={onToggleDataSource}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-mono border transition-colors ${
                  apiStatus.isMock
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    : apiStatus.connected
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${
                  apiStatus.isMock ? 'bg-amber-400 animate-pulse' : apiStatus.connected ? 'bg-emerald-400' : 'bg-rose-400'
                }`} />
                {apiStatus.isMock ? 'Mock Data' : 'Live Backend'}
              </button>
            </div>
          </div>

          {/* Search, Controls & Data Source Indicator */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Search Input */}
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search models, labs, topics..."
                className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-8 py-1.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 transition-colors focus:border-cyan-500 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 font-sans"
              />
              {searchQuery && (
                <button
                  id="clear-search-btn"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Date Badge */}
            <div className="hidden lg:flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900/50 px-2.5 py-1.5 text-xs font-mono text-slate-400">
              <span>{currentDate}</span>
            </div>

            {/* Refresh Button */}
            <button
              id="refresh-feed-btn"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-slate-100 active:scale-95 disabled:opacity-50"
              title="Refresh intelligence feed"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Data Source Toggle & Diagnostics Button (Desktop) */}
            <div className="hidden md:flex items-center gap-1.5">
              <button
                id="toggle-datasource-btn"
                onClick={onToggleDataSource}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-mono transition-all hover:opacity-90 ${
                  apiStatus.isMock
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                    : apiStatus.connected
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                }`}
                title="Click to switch between Live Python Backend and Mock Data"
              >
                <Radio className={`h-3.5 w-3.5 ${apiStatus.isMock ? 'text-amber-400' : apiStatus.connected ? 'text-emerald-400' : 'text-rose-400'}`} />
                <span>{apiStatus.isMock ? 'Mock Mode' : apiStatus.connected ? 'Backend Live' : 'Backend Offline'}</span>
              </button>

              <button
                id="open-diagnostics-btn"
                onClick={onOpenDiagnostics}
                className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-200 hover:bg-slate-800"
                title="Backend Integration & API Diagnostics"
              >
                <Terminal className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
