import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Article, ViewMode } from '../types';
import { ArticleCard } from './ArticleCard';

interface ArticleFeedProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  savedArticleIds?: Set<string | number>;
  onToggleBookmark?: (article: Article) => void;
  onResetFilters?: () => void;
  title?: string;
  onSelectEntity?: (entity: string) => void;
  viewMode?: ViewMode;
}

const PAGE_SIZE = 30;

export const ArticleFeed: React.FC<ArticleFeedProps> = ({
  articles,
  onSelectArticle,
  savedArticleIds = new Set(),
  onToggleBookmark,
  onResetFilters,
  title = 'Intelligence Dispatches',
  onSelectEntity,
  viewMode = 'editorial',
}) => {
  const [displayCount, setDisplayCount] = useState<number>(PAGE_SIZE);

  // Reset display count whenever the dataset/filtering changes
  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [articles.length, title]);

  const isBookmarked = (a: Article) => savedArticleIds.has(a.id || a.url || a.title);

  if (articles.length === 0) {
    return null;
  }

  const visibleArticles = articles.slice(0, displayCount);
  const hasMore = displayCount < articles.length;

  return (
    <section id="article-feed-section" className="mb-14">
      {/* Editorial Section Header */}
      <div className="flex items-baseline justify-between border-b border-[#2d333b] pb-2 mb-4">
        <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#f0f6fc]">
          {title}
        </h2>
        <div className="font-mono text-[11px] text-[#6e7681]">
          Showing {visibleArticles.length} of {articles.length.toLocaleString()} {articles.length === 1 ? 'dispatch' : 'dispatches'}
        </div>
      </div>

      {/* Article List / Editorial Broadsheet Feed */}
      {viewMode === 'dense' ? (
        /* High-density Wire */
        <div className="divide-y divide-[#21262d] border-t border-[#21262d]">
          {visibleArticles.map((article) => (
            <ArticleCard
              key={article.id || article.url || article.title}
              article={article}
              onSelect={onSelectArticle}
              isBookmarked={isBookmarked(article)}
              onToggleBookmark={onToggleBookmark}
              onSelectEntity={onSelectEntity}
              layout="wire"
            />
          ))}
        </div>
      ) : viewMode === 'magazine' ? (
        /* 2-Column Magazine Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          {visibleArticles.map((article) => (
            <ArticleCard
              key={article.id || article.url || article.title}
              article={article}
              onSelect={onSelectArticle}
              isBookmarked={isBookmarked(article)}
              onToggleBookmark={onToggleBookmark}
              onSelectEntity={onSelectEntity}
              layout="editorial"
            />
          ))}
        </div>
      ) : (
        /* Default: Broadsheet (1-Column with image) */
        <div className="divide-y divide-[#21262d]">
          {visibleArticles.map((article) => (
            <ArticleCard
              key={article.id || article.url || article.title}
              article={article}
              onSelect={onSelectArticle}
              isBookmarked={isBookmarked(article)}
              onToggleBookmark={onToggleBookmark}
              onSelectEntity={onSelectEntity}
              layout="editorial"
            />
          ))}
        </div>
      )}

      {/* Incremental Loading Controls */}
      {hasMore && (
        <div className="mt-10 pt-6 border-t border-[#21262d] flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            id="load-more-articles-btn"
            onClick={() => setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, articles.length))}
            className="flex items-center gap-2 border border-[#30363d] bg-transparent px-5 py-2.5 text-xs font-mono font-medium text-[#cbd5e1] hover:bg-[#161b22] hover:text-white transition-colors cursor-pointer rounded"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            <span>Load More Dispatches (+{Math.min(PAGE_SIZE, articles.length - displayCount)})</span>
          </button>

          {articles.length - displayCount > PAGE_SIZE && (
            <button
              onClick={() => setDisplayCount(articles.length)}
              className="text-xs font-mono text-[#6e7681] hover:text-[#cbd5e1] transition-colors underline underline-offset-4 cursor-pointer"
            >
              Show all remaining ({articles.length - displayCount})
            </button>
          )}
        </div>
      )}
    </section>
  );
};
