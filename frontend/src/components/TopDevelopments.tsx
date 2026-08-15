import React from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { Article } from '../types';
import { ArticleCard } from './ArticleCard';

interface TopDevelopmentsProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
}

export const TopDevelopments: React.FC<TopDevelopmentsProps> = ({
  articles,
  onSelectArticle,
}) => {
  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <section className="mb-10" id="top-developments-section">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-4 mb-4 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Flame className="h-3.5 w-3.5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
              Top Developments
              <span className="rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11px] font-mono text-amber-300 font-normal">
                High Impact
              </span>
            </h2>
          </div>
        </div>
        <div className="text-xs font-mono text-slate-500">
          Ranked by distilled importance score
        </div>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {articles.map((article) => (
          <ArticleCard
            key={article.id || article.url || article.title}
            article={article}
            onSelect={onSelectArticle}
            featured={true}
          />
        ))}
      </div>
    </section>
  );
};
