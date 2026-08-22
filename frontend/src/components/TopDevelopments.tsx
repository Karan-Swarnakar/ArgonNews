import React from 'react';
import { ExternalLink, ArrowRight, Bookmark, Building2, Cpu } from 'lucide-react';
import { Article, ViewMode } from '../types';
import { ArticleCard } from './ArticleCard';
import { ArticleImage } from './ArticleImage';

interface TopDevelopmentsProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  savedArticleIds?: Set<string | number>;
  onToggleBookmark?: (article: Article) => void;
  onSelectEntity?: (entity: string) => void;
  viewMode?: ViewMode;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return dateStr;
  }
}

export const TopDevelopments: React.FC<TopDevelopmentsProps> = ({
  articles,
  onSelectArticle,
  savedArticleIds = new Set(),
  onToggleBookmark,
  onSelectEntity,
  viewMode = 'editorial',
}) => {
  if (!articles || articles.length === 0) {
    return null;
  }

  const isBookmarked = (a: Article) => savedArticleIds.has(a.id || a.url || a.title);

  // If in wire mode, render as a compact list with subtle header
  if (viewMode === 'dense') {
    return (
      <section className="mb-8" id="top-developments-section">
        <div className="flex items-center justify-between border-b border-[#2d333b] pb-2 mb-1">
          <h2 className="font-mono text-xs uppercase font-semibold tracking-wider text-[#f0f6fc]">
            Key Dispatches
          </h2>
          <span className="font-mono text-[11px] text-[#6e7681]">
            Strategic priority
          </span>
        </div>

        <div className="divide-y divide-[#21262d]">
          {articles.map((article) => (
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
      </section>
    );
  }

  // Broadsheet Lead Package: 1 Lead Story + 2 Secondary Column Stories
  const leadArticle = articles[0];
  const secondaryArticles = articles.slice(1, 3);
  const remainingArticles = articles.slice(3, 5);

  const leadCompanies = leadArticle.analysis?.companies ?? [];
  const leadTechs = leadArticle.analysis?.technologies ?? [];
  const leadDate = formatDate(leadArticle.published_at);

  return (
    <section className="mb-10 pb-8 border-b-2 border-[#262c35]" id="top-developments-section">
      {/* Section Masthead Header */}
      <div className="flex items-center justify-between border-b border-[#2d333b] pb-2 mb-6">
        <div className="flex items-center gap-3">
          <span className="font-sans text-xs font-semibold uppercase tracking-widest text-[#cbd5e1]">
            Lead Analysis
          </span>
          <span className="text-[#3b434e]">•</span>
          <span className="font-sans text-[11px] text-[#6e7681]">
            Strategic Highlights
          </span>
        </div>
        <div className="font-sans text-[11px] text-[#6e7681]">
          Editorial Lead
        </div>
      </div>

      {/* Broadsheet Asymmetric Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 1. Primary Lead Story (Col 1 to 7) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            {/* Byline / Source header */}
            <div className="flex items-center justify-between gap-2 mb-2.5 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-sans font-semibold text-xs tracking-wider uppercase text-[#f1f5f9]">
                  {leadArticle.source}
                </span>
                {leadDate && (
                  <>
                    <span className="text-[#3b434e]">•</span>
                    <span className="font-sans text-[11px] text-[#6e7681]">{leadDate}</span>
                  </>
                )}
                <span className="text-[#3b434e]">•</span>
                <span className="font-sans text-[11px] uppercase tracking-wide text-[#8b949e]">
                  {leadArticle.category}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {onToggleBookmark && (
                  <button
                    onClick={() => onToggleBookmark(leadArticle)}
                    className={`p-1 text-[#6e7681] hover:text-amber-200 transition-colors ${
                      isBookmarked(leadArticle) ? 'text-amber-400' : ''
                    }`}
                    title={isBookmarked(leadArticle) ? 'Remove bookmark' : 'Bookmark entry'}
                  >
                    <Bookmark className={`h-4 w-4 ${isBookmarked(leadArticle) ? 'fill-amber-400' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Lead Story Layout: Headline + Lead Image + Summary */}
            <div className="flex flex-col md:flex-row md:items-start gap-5 mb-3.5">
              <div className="flex-1 min-w-0">
                {/* Prominent Lead Headline */}
                <h3
                  onClick={() => onSelectArticle(leadArticle)}
                  className="cursor-pointer font-serif text-2xl sm:text-3xl font-normal text-[#f8fafc] hover:text-amber-100 transition-colors leading-[1.2] tracking-tight mb-3"
                >
                  {leadArticle.title}
                </h3>

                {/* Lead Summary */}
                <p className="text-[14px] sm:text-[15px] leading-relaxed text-[#cbd5e1] font-sans mb-3 line-clamp-4">
                  {leadArticle.analysis?.summary}
                </p>
              </div>

              {/* Lead Story Verified Image */}
              <div className="w-full md:w-[260px] shrink-0">
                <ArticleImage
                  article={leadArticle}
                  aspectRatio="aspect-[16/10]"
                  priority={true}
                  onClick={() => onSelectArticle(leadArticle)}
                  className="rounded-xs shadow-md cursor-pointer w-full"
                />
              </div>
            </div>

            {/* Why It Matters: Analytical Box */}
            {leadArticle.analysis?.why_it_matters && (
              <div className="pl-4 border-l-2 border-[#4b5563] py-1 my-3 text-xs">
                <span className="font-sans font-semibold text-[#e2e8f0] text-[11px] uppercase tracking-wider block mb-1">
                  Why It Matters
                </span>
                <p className="text-[#94a3b8] leading-relaxed italic font-serif text-sm">
                  "{leadArticle.analysis.why_it_matters}"
                </p>
              </div>
            )}
          </div>

          {/* Lead Footer */}
          <div className="mt-4 pt-3 border-t border-[#21262d] flex items-center justify-between flex-wrap gap-2 text-xs font-sans">
            {/* Entities */}
            <div className="flex items-center gap-2 flex-wrap text-[11px] text-[#6e7681]">
              {leadCompanies.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3 w-3 text-[#64748b]" />
                  {leadCompanies.slice(0, 3).map((comp, idx) => (
                    <React.Fragment key={comp}>
                      {idx > 0 && <span className="text-[#3b434e]">,</span>}
                      <button
                        onClick={() => onSelectEntity && onSelectEntity(comp)}
                        className="text-[#94a3b8] hover:text-[#f1f5f9] hover:underline transition-colors"
                      >
                        {comp}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              )}
              {leadTechs.length > 0 && (
                <div className="flex items-center gap-1.5 border-l border-[#21262d] pl-2">
                  <Cpu className="h-3 w-3 text-[#64748b]" />
                  {leadTechs.slice(0, 2).map((tech, idx) => (
                    <React.Fragment key={tech}>
                      {idx > 0 && <span className="text-[#3b434e]">,</span>}
                      <button
                        onClick={() => onSelectEntity && onSelectEntity(tech)}
                        className="text-[#8b949e] hover:text-[#f1f5f9] hover:underline transition-colors"
                      >
                        {tech}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            {/* Links */}
            <div className="flex items-center gap-4 ml-auto font-sans">
              {leadArticle.url && leadArticle.url !== '#' && (
                <a
                  href={leadArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#6e7681] hover:text-[#cbd5e1] transition-colors"
                  title="Visit original publication"
                >
                  <span>Source</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}

              <button
                onClick={() => onSelectArticle(leadArticle)}
                className="inline-flex items-center gap-1 text-xs text-[#58a6ff] hover:text-[#79c0ff] font-medium transition-colors"
              >
                <span>Full Dossier</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Secondary Stack (Col 8 to 12) separated by hairline rule on desktop */}
        <div className="lg:col-span-5 lg:border-l lg:border-[#262c35] lg:pl-8 flex flex-col justify-between space-y-6">
          {secondaryArticles.map((article, index) => {
            const dateStr = formatDate(article.published_at);
            const imp = article.analysis?.importance ?? 8;
            return (
              <div
                key={article.id || article.url || article.title}
                className={`flex flex-col justify-between ${
                  index > 0 ? 'pt-6 border-t border-[#21262d]' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-semibold text-[11px] uppercase tracking-wider text-[#d1d5db]">
                        {article.source}
                      </span>
                      {dateStr && (
                        <>
                          <span className="text-[#3b434e]">•</span>
                          <span className="font-sans text-[11px] text-[#6e7681]">{dateStr}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4
                        onClick={() => onSelectArticle(article)}
                        className="cursor-pointer font-serif text-lg font-normal text-[#f3f4f6] hover:text-amber-100 transition-colors leading-snug tracking-tight mb-2 line-clamp-2"
                      >
                        {article.title}
                      </h4>

                      <p className="text-xs text-[#94a3b8] line-clamp-2 leading-relaxed font-sans mb-2">
                        {article.analysis?.summary}
                      </p>
                    </div>

                    <div className="w-24 shrink-0 hidden sm:block">
                      <ArticleImage
                        article={article}
                        aspectRatio="aspect-[4/3]"
                        onClick={() => onSelectArticle(article)}
                        className="rounded-xs cursor-pointer w-full"
                      />
                    </div>
                  </div>

                  {article.analysis?.why_it_matters && (
                    <p className="text-xs text-[#64748b] line-clamp-1 font-sans">
                      <span className="text-[#94a3b8] font-medium italic mr-1">Why it matters:</span>
                      {article.analysis.why_it_matters}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs font-sans">
                  {article.url && article.url !== '#' ? (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#6e7681] hover:text-[#cbd5e1] transition-colors"
                    >
                      <span>Source</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : <span />}

                  <div className="flex items-center gap-2.5">
                    {onToggleBookmark && (
                      <button
                        onClick={() => onToggleBookmark(article)}
                        className={`p-0.5 text-[#6e7681] hover:text-amber-200 transition-colors ${
                          isBookmarked(article) ? 'text-amber-400' : ''
                        }`}
                      >
                        <Bookmark className={`h-3 w-3 ${isBookmarked(article) ? 'fill-amber-400' : ''}`} />
                      </button>
                    )}
                    <button
                      onClick={() => onSelectArticle(article)}
                      className="text-[11px] text-[#58a6ff] hover:text-[#79c0ff]"
                    >
                      Full Dossier →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick fast wire line items if more items exist */}
          {remainingArticles.length > 0 && (
            <div className="pt-4 border-t border-[#21262d]">
              <div className="font-sans text-[11px] font-medium uppercase tracking-wider text-[#6e7681] mb-2">
                Also Notable
              </div>
              <div className="space-y-2">
                {remainingArticles.map((rem) => (
                  <div
                    key={rem.id || rem.url || rem.title}
                    onClick={() => onSelectArticle(rem)}
                    className="cursor-pointer group flex items-baseline justify-between gap-3 text-xs"
                  >
                    <span className="font-serif text-[#cbd5e1] group-hover:text-amber-100 line-clamp-1 transition-colors">
                      {rem.title}
                    </span>
                    <span className="font-sans text-[11px] text-[#6e7681] shrink-0">
                      {rem.source}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
