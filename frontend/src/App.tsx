/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { FilterBar } from './components/FilterBar';
import { TopDevelopments } from './components/TopDevelopments';
import { ArticleFeed } from './components/ArticleFeed';
import { ArticleDetailModal } from './components/ArticleDetailModal';
import { BackendStatusModal } from './components/BackendStatusModal';
import { ErrorBanner } from './components/ErrorBanner';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { getArticles, getCategories, getSources, checkForNewArticles, API_BASE_URL, DEFAULT_USE_MOCK } from './api/articles';
import { Article, CategoryFilter, FilterState, ApiStatus } from './types';
import { Terminal, Shield, Sparkles, ExternalLink, Bookmark, Activity, Building2, ArrowUpCircle } from 'lucide-react';

const SAVED_STORAGE_KEY = 'argon_saved_article_ids';

function parseTimestamp(dateStr?: string): number {
  if (!dateStr) return 0;
  const time = new Date(dateStr).getTime();
  return isNaN(time) ? 0 : time;
}

function matchesCategory(articleCategory: string, filterCategory: CategoryFilter): boolean {
  if (filterCategory === 'All' || filterCategory === 'Today' || filterCategory === 'Saved') return true;
  const cat = articleCategory.toLowerCase().trim();
  const filter = filterCategory.toLowerCase().trim();
  if (filter === 'research') return cat.includes('research') || cat.includes('paper') || cat.includes('academic') || cat.includes('theory');
  if (filter === 'models') return cat.includes('model') || cat.includes('llm') || cat.includes('weights') || cat.includes('agent');
  if (filter === 'open source') return cat.includes('open source') || cat.includes('open-source') || cat.includes('opensource') || cat.includes('repo');
  if (filter === 'business') return cat.includes('business') || cat.includes('industry') || cat.includes('compute') || cat.includes('hardware') || cat.includes('enterprise');
  if (filter === 'safety & policy') return cat.includes('safety') || cat.includes('policy') || cat.includes('ethic') || cat.includes('govern') || cat.includes('regulation') || cat.includes('alignment');
  return cat === filter || cat.includes(filter);
}

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [useMock, setUseMock] = useState<boolean>(DEFAULT_USE_MOCK);
  const [newAvailableArticles, setNewAvailableArticles] = useState<number>(0);
  
  // Bookmarked article IDs persisted in browser localStorage
  const [savedArticleIds, setSavedArticleIds] = useState<Set<string | number>>(() => {
    try {
      const stored = localStorage.getItem(SAVED_STORAGE_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (e) {
      // Fallback
    }
    return new Set();
  });

  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    isMock: DEFAULT_USE_MOCK,
    connected: false,
    endpoint: API_BASE_URL,
    lastChecked: null,
    errorMessage: null,
    articleCount: 0,
  });

  const [filters, setFilters] = useState<FilterState>({
    category: 'Today',
    searchQuery: '',
    minImportance: 0,
    source: 'all',
    selectedEntity: undefined,
    sortBy: 'newest',
    viewMode: 'editorial',
  });

  // Load articles from the API layer (src/api/articles.ts)
  const loadArticles = useCallback(async (forceMock: boolean = useMock) => {
    setIsLoading(true);
    try {
      const result = await getArticles(forceMock);
      setArticles(result.articles);
      setApiStatus({
        isMock: result.isMock,
        connected: !result.error && !result.isMock,
        endpoint: result.sourceEndpoint,
        lastChecked: new Date(),
        errorMessage: result.error,
        articleCount: result.articles.length,
      });
    } catch (err: any) {
      setApiStatus((prev) => ({
        ...prev,
        isMock: forceMock,
        connected: false,
        lastChecked: new Date(),
        errorMessage: err.message || 'Failed to load articles',
        articleCount: 0,
      }));
    } finally {
      setIsLoading(false);
    }
  }, [useMock]);

  // Initial load
  useEffect(() => {
    loadArticles(useMock);
  }, [useMock, loadArticles]);

  // Periodic background check for newly published articles (every 5 minutes)
  useEffect(() => {
    if (useMock) return;

    const checkInterval = setInterval(async () => {
      try {
        const latestTimestamp = articles[0]?.published_at || null;
        const result = await checkForNewArticles(latestTimestamp);
        if (result.hasNew && result.newCount > 0) {
          setNewAvailableArticles(result.newCount);
        }
      } catch {
        // Quiet failure in background without disrupting reader
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(checkInterval);
  }, [useMock, articles]);

  // Apply new live updates to feed without losing scroll context
  const handleApplyNewArticles = async () => {
    setNewAvailableArticles(0);
    await loadArticles(useMock);
  };

  // Toggle bookmark helper
  const handleToggleBookmark = useCallback((article: Article) => {
    const key = article.id || article.url || article.title;
    setSavedArticleIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      try {
        localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch (e) {
        // Ignored
      }
      return next;
    });
  }, []);

  // Toggle between Mock Data and Real Backend
  const handleToggleDataSource = () => {
    const nextMockState = !useMock;
    setUseMock(nextMockState);
    loadArticles(nextMockState);
  };

  // Keyboard shortcut: close modal on Escape, search focus on '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedArticle(null);
        setIsDiagnosticsOpen(false);
      }
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute category counts for navigation badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Research: 0,
      Models: 0,
      'Open Source': 0,
      Business: 0,
      'Safety & Policy': 0,
      All: articles.length,
    };
    articles.forEach((a) => {
      const cat = a.category || a.analysis?.category || '';
      if (matchesCategory(cat, 'Research')) counts.Research++;
      if (matchesCategory(cat, 'Models')) counts.Models++;
      if (matchesCategory(cat, 'Open Source')) counts['Open Source']++;
      if (matchesCategory(cat, 'Business')) counts.Business++;
      if (matchesCategory(cat, 'Safety & Policy')) counts['Safety & Policy']++;
    });
    return counts;
  }, [articles]);

  // Extract unique available sources for dropdown
  const availableSources = useMemo(() => {
    return getSources(articles);
  }, [articles]);

  // Compute article counts per source
  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    articles.forEach((a) => {
      if (a.source) {
        counts[a.source] = (counts[a.source] || 0) + 1;
      }
    });
    return counts;
  }, [articles]);

  // Compute top active entities / labs across the corpus
  const topEntities = useMemo(() => {
    const counts: Record<string, number> = {};
    articles.forEach((a) => {
      (a.analysis?.companies ?? []).forEach((c) => {
        counts[c] = (counts[c] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([name, count]) => ({ name, count }));
  }, [articles]);

  // Update filter helper
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      category: 'Today',
      searchQuery: '',
      minImportance: 0,
      source: 'all',
      selectedEntity: undefined,
      sortBy: 'newest',
      viewMode: 'editorial',
    });
  };

  // Filter and sort articles based on user controls
  const filteredAndSortedArticles = useMemo(() => {
    let list = [...articles];

    // 1. Saved Reading List Filter
    if (filters.category === 'Saved') {
      list = list.filter((a) => savedArticleIds.has(a.id || a.url || a.title));
    }
    // 2. Category Filter
    else if (filters.category !== 'All' && filters.category !== 'Today') {
      list = list.filter((a) => {
        const cat = a.category || a.analysis?.category || '';
        return matchesCategory(cat, filters.category);
      });
    }

    // 3. Entity Filter (Company / Lab / Tech)
    if (filters.selectedEntity) {
      const entity = filters.selectedEntity.toLowerCase();
      list = list.filter(
        (a) =>
          (a.analysis?.companies ?? []).some((c) => c.toLowerCase() === entity) ||
          (a.analysis?.technologies ?? []).some((t) => t.toLowerCase() === entity)
      );
    }

    // 4. Minimum Importance Filter
    if (filters.minImportance > 0) {
      list = list.filter(
        (a) => (a.analysis?.importance ?? 5) >= filters.minImportance
      );
    }

    // 5. Source Filter
    if (filters.source !== 'all') {
      list = list.filter((a) => a.source === filters.source);
    }

    // 6. Text Search Query
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      list = list.filter((a) => {
        const titleMatch = a.title.toLowerCase().includes(q);
        const sourceMatch = a.source.toLowerCase().includes(q);
        const summaryMatch = (a.analysis?.summary || '').toLowerCase().includes(q);
        const whyMatch = (a.analysis?.why_it_matters || '').toLowerCase().includes(q);
        const categoryMatch = (a.category || '').toLowerCase().includes(q);
        const companyMatch = (a.analysis?.companies || []).some((c) =>
          c.toLowerCase().includes(q)
        );
        const techMatch = (a.analysis?.technologies || []).some((t) =>
          t.toLowerCase().includes(q)
        );
        return (
          titleMatch ||
          sourceMatch ||
          summaryMatch ||
          whyMatch ||
          categoryMatch ||
          companyMatch ||
          techMatch
        );
      });
    }

    // 7. Sorting: strictly 'newest' (Newest First) or 'importance-desc' (Impactful)
    list.sort((a, b) => {
      if (filters.sortBy === 'newest') {
        const dateA = parseTimestamp(a.published_at);
        const dateB = parseTimestamp(b.published_at);
        if (dateB !== dateA) {
          return dateB - dateA;
        }
        return (b.analysis?.importance ?? 5) - (a.analysis?.importance ?? 5);
      }
      // 'importance-desc' (Impactful)
      const impA = a.analysis?.importance ?? 5;
      const impB = b.analysis?.importance ?? 5;
      if (impB !== impA) {
        return impB - impA;
      }
      const dateA = parseTimestamp(a.published_at);
      const dateB = parseTimestamp(b.published_at);
      return dateB - dateA;
    });

    return list;
  }, [articles, filters, savedArticleIds]);

  // Separate Top Developments (Importance >= 8 or top 3 items when viewing Front Page / All without narrow filters)
  const { topDevelopments, feedArticles } = useMemo(() => {
    const isSpecialView =
      filters.searchQuery.trim().length > 0 ||
      filters.category === 'Saved' ||
      filters.selectedEntity !== undefined ||
      filters.minImportance > 0 ||
      filters.source !== 'all';

    if (isSpecialView) {
      return {
        topDevelopments: [],
        feedArticles: filteredAndSortedArticles,
      };
    }

    // On Front Page or All: separate top developments
    const top = filteredAndSortedArticles.filter(
      (a) => (a.analysis?.importance ?? 5) >= 8
    );
    const topIds = new Set(top.map((a) => a.id || a.url || a.title));
    const rest = filteredAndSortedArticles.filter(
      (a) => !topIds.has(a.id || a.url || a.title)
    );

    // If no articles are >= 8, take the first 3 as lead
    if (top.length === 0 && filteredAndSortedArticles.length > 3) {
      return {
        topDevelopments: filteredAndSortedArticles.slice(0, 3),
        feedArticles: filteredAndSortedArticles.slice(3),
      };
    }

    return {
      topDevelopments: top.slice(0, 5),
      feedArticles: rest.length > 0 ? rest : [],
    };
  }, [filteredAndSortedArticles, filters]);

  return (
    <div className="min-h-screen bg-[#0e1013] text-[#e2e8f0] font-sans flex flex-col selection:bg-amber-500/20 selection:text-amber-200">
      
      {/* 1. Header Masthead with Edition, Search & Status */}
      <Header
        searchQuery={filters.searchQuery}
        onSearchChange={(q) => handleFilterChange({ searchQuery: q })}
        onRefresh={() => loadArticles(useMock)}
        isLoading={isLoading}
        apiStatus={apiStatus}
        onToggleDataSource={handleToggleDataSource}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        savedCount={savedArticleIds.size}
        onOpenSaved={() => handleFilterChange({ category: 'Saved' })}
        isSavedActive={filters.category === 'Saved'}
      />

      {/* 2. Editorial Desks Navigation */}
      <Navigation
        currentCategory={filters.category}
        onSelectCategory={(cat) => handleFilterChange({ category: cat, selectedEntity: undefined })}
        categoryCounts={categoryCounts}
        savedCount={savedArticleIds.size}
      />

      {/* 3. Filter and Density Controls */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        availableSources={availableSources}
        sourceCounts={sourceCounts}
        totalCount={articles.length}
        filteredCount={filteredAndSortedArticles.length}
        onResetFilters={handleResetFilters}
      />

      {/* 4. Main Broadsheet Canvas */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
        
        {/* Backend Error Banner if live wire fails */}
        {!apiStatus.isMock && apiStatus.errorMessage && (
          <ErrorBanner
            errorMessage={apiStatus.errorMessage}
            onRetry={() => loadArticles(false)}
            onUseMock={() => {
              setUseMock(true);
              loadArticles(true);
            }}
            onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
          />
        )}

        {/* Intelligence Pulse Radar Strip */}
        {topEntities.length > 0 && filters.category !== 'Saved' && (
          <div className="mb-6 flex items-center justify-between border-b border-[#22272e] pb-3 text-xs overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[#6e7681] flex items-center gap-1">
                <Activity className="h-3 w-3 text-amber-400" />
                Active Radar:
              </span>
              <div className="flex items-center gap-1.5">
                {topEntities.map((ent) => {
                  const isSelected = filters.selectedEntity === ent.name;
                  return (
                    <button
                      key={ent.name}
                      onClick={() =>
                        handleFilterChange({
                          selectedEntity: isSelected ? undefined : ent.name,
                        })
                      }
                      className={`rounded px-2 py-0.5 font-mono text-[11px] transition-colors ${
                        isSelected
                          ? 'bg-amber-950/50 border border-amber-600/60 text-amber-200 font-semibold'
                          : 'bg-[#14161a] border border-[#22272e] text-[#8b949e] hover:border-[#30363d] hover:text-[#c9d1d9]'
                      }`}
                    >
                      {ent.name}
                      <span className="ml-1 text-[10px] text-[#6e7681]">({ent.count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="hidden lg:block font-mono text-[11px] text-[#6e7681] shrink-0">
              {articles.length} dispatches analyzed across {availableSources.length} sources
            </div>
          </div>
        )}

        {/* Loading State or Rendered Sections */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Live New Updates Pill Banner */}
            {newAvailableArticles > 0 && (
              <div className="mb-5">
                <button
                  onClick={handleApplyNewArticles}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer shadow-lg shadow-amber-950/20 text-xs sm:text-sm group"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                    <span className="font-sans">
                      <strong>{newAvailableArticles} new intelligence dispatch{newAvailableArticles === 1 ? '' : 'es'}</strong> ready
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[11px] bg-amber-500/20 px-2.5 py-1 rounded border border-amber-500/40 text-amber-300 group-hover:bg-amber-500/30 transition-colors">
                    <span>Load updates</span>
                    <ArrowUpCircle className="h-3.5 w-3.5" />
                  </span>
                </button>
              </div>
            )}

            {/* Top Critical Developments Section */}
            {topDevelopments.length > 0 && (
              <TopDevelopments
                articles={topDevelopments}
                onSelectArticle={(art) => setSelectedArticle(art)}
                savedArticleIds={savedArticleIds}
                onToggleBookmark={handleToggleBookmark}
                onSelectEntity={(ent) => handleFilterChange({ selectedEntity: ent })}
                viewMode={filters.viewMode}
              />
            )}

            {/* General Article Feed Section */}
            <ArticleFeed
              articles={
                feedArticles.length > 0
                  ? feedArticles
                  : topDevelopments.length === 0
                  ? filteredAndSortedArticles
                  : []
              }
              onSelectArticle={(art) => setSelectedArticle(art)}
              title={
                filters.category === 'Saved'
                  ? 'Saved Reading List'
                  : filters.selectedEntity
                  ? `Dispatches referencing "${filters.selectedEntity}"`
                  : filters.category !== 'All' && filters.category !== 'Today'
                  ? `${filters.category} Desk`
                  : topDevelopments.length > 0
                  ? 'All Intelligence Dispatches'
                  : 'Distilled Intelligence Feed'
              }
              onResetFilters={handleResetFilters}
              savedArticleIds={savedArticleIds}
              onToggleBookmark={handleToggleBookmark}
              onSelectEntity={(ent) => handleFilterChange({ selectedEntity: ent })}
              viewMode={filters.viewMode}
            />
          </>
        )}

      </main>

      {/* 5. Clean Broadsheet Footer */}
      <footer className="border-t border-[#22272e] bg-[#090b0e] py-6 text-xs text-[#8b949e]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-semibold text-[#f0f6fc] tracking-tight">ARGON NEWS</span>
            <span>•</span>
            <span className="text-[#6e7681]">Daily AI Intelligence & Research Briefing</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <button
              onClick={() => setIsDiagnosticsOpen(true)}
              className="flex items-center gap-1 text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
            >
              <Terminal className="h-3 w-3" />
              <span>Backend Contract</span>
            </button>
            <span className="text-[#30363d]">•</span>
            <span className="text-[#6e7681]">
              Engine: <code className="text-[#8b949e]">articles.json</code>
            </span>
          </div>
        </div>
      </footer>

      {/* 6. Article Detail Dossier Modal */}
      <ArticleDetailModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        isBookmarked={
          selectedArticle
            ? savedArticleIds.has(selectedArticle.id || selectedArticle.url || selectedArticle.title)
            : false
        }
        onToggleBookmark={handleToggleBookmark}
        onSelectEntity={(ent) => handleFilterChange({ selectedEntity: ent })}
      />

      {/* 7. Backend Diagnostics Modal */}
      <BackendStatusModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        apiStatus={apiStatus}
        onToggleDataSource={handleToggleDataSource}
        onRefresh={() => loadArticles(useMock)}
      />

    </div>
  );
}
