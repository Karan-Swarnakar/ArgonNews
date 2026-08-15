import React from 'react';
import { Newspaper, SearchX, RotateCcw } from 'lucide-react';
import { Article } from '../types';
import { ArticleCard } from './ArticleCard';

interface ArticleFeedProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  title?: string;
  onResetFilters?: () => void;
}

export const ArticleFeed: React.FC<ArticleFeedProps> = ({
  articles,
  onSelectArticle,
  title = 'Intelligence Feed',
  onResetFilters,
}) => {
  if (articles.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-10 text-center my-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/60 text-slate-400 mb-3">
          <SearchX className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">
          No articles match your criteria
        </h3>
        <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
          Try clearing your search query or relaxing your importance and category filters.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-950/70 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset all filters
          </button>
        )}
      </div>
    );
  }

  return (
    <section id="article-feed-section" className="mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-4 mb-4 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Newspaper className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-100">
            {title}
          </h2>
        </div>
        <div className="text-xs font-mono text-slate-400">
          {articles.length} {articles.length === 1 ? 'article' : 'articles'}
        </div>
      </div>

      {/* Grid of articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {articles.map((article) => (
          <ArticleCard
            key={article.id || article.url || article.title}
            article={article}
            onSelect={onSelectArticle}
          />
        ))}
      </div>
    </section>
  );
};
