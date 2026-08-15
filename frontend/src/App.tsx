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
import { getArticles, getCategories, getSources, API_BASE_URL, DEFAULT_USE_MOCK } from './api/articles';
import { Article, CategoryFilter, FilterState, ApiStatus } from './types';
import { Terminal, Shield, Sparkles, ExternalLink } from 'lucide-react';

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [useMock, setUseMock] = useState<boolean>(DEFAULT_USE_MOCK);
  
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    isMock: DEFAULT_USE_MOCK,
    connected: false,
    endpoint: API_BASE_URL,
    lastChecked: null,
    errorMessage: null,
    articleCount: 0,
  });

  const [filters, setFilters] = useState<FilterState>({
    category: 'All',
    searchQuery: '',
    minImportance: 0,
    source: 'all',
    sortBy: 'importance-desc',
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

  // Toggle between Mock Data and Real Backend
  const handleToggleDataSource = () => {
    const nextMockState = !useMock;
    setUseMock(nextMockState);
    loadArticles(nextMockState);
  };

  // Keyboard shortcut: close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedArticle(null);
        setIsDiagnosticsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute category counts for navigation badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    articles.forEach((a) => {
      const cat = a.category || a.analysis?.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [articles]);

  // Extract unique available sources for dropdown
  const availableSources = useMemo(() => {
    return getSources(articles);
  }, [articles]);

  // Update filter helper
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      category: 'All',
      searchQuery: '',
      minImportance: 0,
      source: 'all',
      sortBy: 'importance-desc',
    });
  };

  // Filter and sort articles based on user controls
  const filteredAndSortedArticles = useMemo(() => {
    let list = [...articles];

    // 1. Category Filter
    if (filters.category !== 'All') {
      if (filters.category === 'Today') {
        // In "Today", display all recent or top developments
        // Or if articles have date matching today, otherwise show all
        const todayIso = new Date().toISOString().split('T')[0];
        const matchingToday = list.filter(
          (a) => a.published_at && a.published_at.startsWith(todayIso)
        );
        if (matchingToday.length > 0) {
          list = matchingToday;
        }
      } else {
        list = list.filter(
          (a) =>
            a.category.toLowerCase() === filters.category.toLowerCase() ||
            a.analysis?.category?.toLowerCase() === filters.category.toLowerCase()
        );
      }
    }

    // 2. Minimum Importance Filter
    if (filters.minImportance > 0) {
      list = list.filter(
        (a) => (a.analysis?.importance ?? 5) >= filters.minImportance
      );
    }

    // 3. Source Filter
    if (filters.source !== 'all') {
      list = list.filter((a) => a.source === filters.source);
    }

    // 4. Text Search Query
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      list = list.filter((a) => {
        const titleMatch = a.title.toLowerCase().includes(q);
        const sourceMatch = a.source.toLowerCase().includes(q);
        const summaryMatch = (a.analysis?.summary || '').toLowerCase().includes(q);
        const whyMatch = (a.analysis?.why_it_matters || '').toLowerCase().includes(q);
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
          companyMatch ||
          techMatch
        );
      });
    }

    // 5. Sorting
    list.sort((a, b) => {
      if (filters.sortBy === 'importance-desc') {
        return (b.analysis?.importance ?? 5) - (a.analysis?.importance ?? 5);
      }
      if (filters.sortBy === 'importance-asc') {
        return (a.analysis?.importance ?? 5) - (b.analysis?.importance ?? 5);
      }
      if (filters.sortBy === 'source-asc') {
        return a.source.localeCompare(b.source);
      }
      if (filters.sortBy === 'newest') {
        const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
        const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });

    return list;
  }, [articles, filters]);

  // Separate Top Developments (Importance >= 8 or top 2 items when no filters active)
  const { topDevelopments, feedArticles } = useMemo(() => {
    // If the user has active filters (category, search, source), we treat all results in a single unified feed
    const hasSearchOrCategoryFilter =
      filters.searchQuery.trim().length > 0 ||
      filters.category !== 'All' ||
      filters.source !== 'all';

    if (hasSearchOrCategoryFilter) {
      return {
        topDevelopments: [],
        feedArticles: filteredAndSortedArticles,
      };
    }

    // Default view: highlight articles with importance >= 8 in Top Developments
    const top = filteredAndSortedArticles.filter(
      (a) => (a.analysis?.importance ?? 5) >= 8
    );
    const topIds = new Set(top.map((a) => a.id || a.url || a.title));
    const rest = filteredAndSortedArticles.filter(
      (a) => !topIds.has(a.id || a.url || a.title)
    );

    // If no articles have >= 8, take the first 2 as top
    if (top.length === 0 && filteredAndSortedArticles.length > 2) {
      return {
        topDevelopments: filteredAndSortedArticles.slice(0, 2),
        feedArticles: filteredAndSortedArticles.slice(2),
      };
    }

    return {
      topDevelopments: top,
      feedArticles: rest.length > 0 ? rest : [],
    };
  }, [filteredAndSortedArticles, filters]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      
      {/* 1. Header with Search, Date, Refresh & Data Source toggle */}
      <Header
        searchQuery={filters.searchQuery}
        onSearchChange={(q) => handleFilterChange({ searchQuery: q })}
        onRefresh={() => loadArticles(useMock)}
        isLoading={isLoading}
        apiStatus={apiStatus}
        onToggleDataSource={handleToggleDataSource}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
      />

      {/* 2. Navigation Category Tabs */}
      <Navigation
        currentCategory={filters.category}
        onSelectCategory={(cat) => handleFilterChange({ category: cat })}
        categoryCounts={categoryCounts}
      />

      {/* 3. Filter and Sort Controls */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        availableSources={availableSources}
        totalCount={articles.length}
        filteredCount={filteredAndSortedArticles.length}
        onResetFilters={handleResetFilters}
      />

      {/* 4. Main Content Canvas */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Backend Error Banner if live connection failed */}
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

        {/* Loading Skeleton */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Top Developments Section */}
            {topDevelopments.length > 0 && (
              <TopDevelopments
                articles={topDevelopments}
                onSelectArticle={(art) => setSelectedArticle(art)}
              />
            )}

            {/* Article Feed Section */}
            <ArticleFeed
              articles={feedArticles.length > 0 ? feedArticles : (topDevelopments.length === 0 ? filteredAndSortedArticles : [])}
              onSelectArticle={(art) => setSelectedArticle(art)}
              title={
                filters.category !== 'All'
                  ? `${filters.category} Developments`
                  : topDevelopments.length > 0
                  ? 'All Intelligence Developments'
                  : 'Distilled Developments'
              }
              onResetFilters={handleResetFilters}
            />
          </>
        )}

      </main>

      {/* 5. Clean Professional Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-300">ARGONNEWS</span>
            <span>•</span>
            <span>AI intelligence, distilled.</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <button
              onClick={() => setIsDiagnosticsOpen(true)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-300 transition-colors"
            >
              <Terminal className="h-3 w-3" />
              <span>Backend Contract & Integration Guide</span>
            </button>
            <span>•</span>
            <span className="text-slate-500">
              Source: <code className="text-slate-400">articles.json</code>
            </span>
          </div>
        </div>
      </footer>

      {/* 6. Article Detail Modal / Dossier */}
      <ArticleDetailModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
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
