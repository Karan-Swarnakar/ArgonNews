import React from 'react';
import { ExternalLink, ArrowRight, Bookmark, Building2, Cpu } from 'lucide-react';
import { Article } from '../types';
import { ArticleImage } from './ArticleImage';

interface ArticleCardProps {
  article: Article;
  onSelect: (article: Article) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (article: Article) => void;
  onSelectEntity?: (entity: string) => void;
  layout?: 'editorial' | 'lead' | 'compact' | 'wire';
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

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onSelect,
  isBookmarked = false,
  onToggleBookmark,
  onSelectEntity,
  layout = 'editorial',
}) => {
  const importance = article.analysis?.importance ?? 5;
  const companies = article.analysis?.companies ?? [];
  const technologies = article.analysis?.technologies ?? [];
  const dateFormatted = formatDate(article.published_at);
  const summary = article.analysis?.summary || 'No summary available.';
  const whyItMatters = article.analysis?.why_it_matters;

  // 1. Ultra-Compact Wire Layout (High density line scan)
  if (layout === 'wire') {
    return (
      <article
        id={`article-wire-${article.id || encodeURIComponent(article.title).slice(0, 20)}`}
        className="group py-3.5 px-3 border-b border-[#21262d] hover:bg-[#12151a] transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs font-mono text-[#8b949e] mb-1 flex-wrap">
              <span className="font-semibold uppercase tracking-wider text-[#d1d5db] font-sans text-[11px]">
                {article.source}
              </span>
              {dateFormatted && (
                <>
                  <span className="text-[#3b434e]">•</span>
                  <span className="text-[#6e7681] text-[11px]">{dateFormatted}</span>
                </>
              )}
              <span className="text-[#3b434e]">•</span>
              <span className="text-[#8b949e] text-[11px] uppercase">{article.category}</span>
            </div>

            <h4
              onClick={() => onSelect(article)}
              className="cursor-pointer font-serif text-base font-normal text-[#f3f4f6] group-hover:text-amber-100 transition-colors leading-snug line-clamp-1"
            >
              {article.title}
            </h4>

            <p className="mt-1 text-xs text-[#94a3b8] line-clamp-1 leading-relaxed font-sans">
              {summary}
            </p>

            {whyItMatters && (
              <p className="mt-1 text-xs text-[#64748b] line-clamp-1 font-sans">
                <span className="text-[#94a3b8] font-medium italic mr-1">Why it matters:</span>
                {whyItMatters}
              </p>
            )}

            {/* Entities */}
            {(companies.length > 0 || technologies.length > 0) && (
              <div className="flex items-center gap-2 mt-1.5 font-sans text-[11px] text-[#6e7681]">
                {companies.length > 0 && (
                  <button
                    onClick={() => onSelectEntity && onSelectEntity(companies[0])}
                    className="hover:text-[#cbd5e1] transition-colors truncate max-w-[120px]"
                  >
                    {companies[0]}
                  </button>
                )}
                {technologies.length > 0 && (
                  <>
                    <span className="text-[#3b434e]">•</span>
                    <button
                      onClick={() => onSelectEntity && onSelectEntity(technologies[0])}
                      className="hover:text-[#cbd5e1] transition-colors truncate max-w-[120px]"
                    >
                      {technologies[0]}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Thumbnail & Quick Actions */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-1 sm:pt-0">
            {article.image_url && (
              <div className="w-16 h-12 hidden sm:block shrink-0">
                <ArticleImage
                  article={article}
                  aspectRatio="aspect-[4/3]"
                  onClick={() => onSelect(article)}
                  className="rounded-xs cursor-pointer"
                />
              </div>
            )}

            <div className="flex items-center gap-2 font-sans text-xs">
              {onToggleBookmark && (
                <button
                  onClick={() => onToggleBookmark(article)}
                  className={`p-1 text-[#6e7681] hover:text-amber-200 transition-colors ${
                    isBookmarked ? 'text-amber-400' : ''
                  }`}
                  title={isBookmarked ? 'Remove bookmark' : 'Bookmark entry'}
                >
                  <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
                </button>
              )}

              <button
                onClick={() => onSelect(article)}
                className="text-[11px] text-[#58a6ff] hover:text-[#79c0ff] hover:underline font-medium"
              >
                Dossier
              </button>

              {article.url && article.url !== '#' && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6e7681] hover:text-[#c9d1d9] transition-colors p-1"
                  title="Read original source"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  }

  // 2. Editorial Broadsheet Entry (Beside-image layout: Content + 220–280px Image)
  const isLead = layout === 'lead' || importance >= 9;

  return (
    <article
      id={`article-entry-${article.id || encodeURIComponent(article.title).slice(0, 20)}`}
      className={`group py-5 sm:py-6 border-b border-[#21262d] transition-colors flex flex-col md:flex-row md:items-start md:justify-between gap-5 md:gap-7`}
    >
      {/* Content Area (Takes remaining space) */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Editorial Header / Metadata Line */}
          <div className="flex items-center justify-between gap-2 mb-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-sans font-semibold text-[11px] tracking-wider uppercase text-[#e2e8f0]">
                {article.source}
              </span>
              {dateFormatted && (
                <>
                  <span className="text-[#3b434e]">•</span>
                  <span className="font-sans text-[11px] text-[#6e7681]">{dateFormatted}</span>
                </>
              )}
              <span className="text-[#3b434e]">•</span>
              <span className="font-sans text-[11px] uppercase tracking-wide text-[#8b949e]">
                {article.category}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onToggleBookmark && (
                <button
                  onClick={() => onToggleBookmark(article)}
                  className={`p-1 text-[#6e7681] hover:text-amber-200 transition-colors ${
                    isBookmarked ? 'text-amber-400' : ''
                  }`}
                  title={isBookmarked ? 'Saved to bookmarks' : 'Save article'}
                >
                  <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {/* Headline: Serif, high editorial contrast */}
          <h3
            onClick={() => onSelect(article)}
            className={`cursor-pointer font-serif font-normal text-[#f3f4f6] group-hover:text-amber-100 transition-colors tracking-tight leading-snug mb-2.5 ${
              isLead
                ? 'text-xl sm:text-2xl font-medium'
                : 'text-lg sm:text-[19px]'
            }`}
          >
            {article.title}
          </h3>

          {/* Concise AI-Generated Summary */}
          <p className="text-[13px] sm:text-sm leading-relaxed text-[#94a3b8] font-sans mb-3 line-clamp-3">
            {summary}
          </p>

          {/* Why It Matters: Editorial Analysis Callout */}
          {whyItMatters && (
            <div className="pl-3.5 border-l border-[#3b434e] py-0.5 my-3 text-xs">
              <span className="font-sans font-semibold text-[#cbd5e1] text-[11px] uppercase tracking-wider block mb-0.5">
                Why It Matters
              </span>
              <p className="text-[#94a3b8] leading-relaxed italic font-serif line-clamp-2">
                "{whyItMatters}"
              </p>
            </div>
          )}
        </div>

        {/* Editorial Footer: Entities & Primary Links */}
        <div className="mt-3 pt-2.5 flex items-center justify-between flex-wrap gap-2 text-xs font-sans border-t border-[#1c2128]">
          {/* Companies / Technologies */}
          <div className="flex items-center gap-2 flex-wrap">
            {companies.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#6e7681]">
                <Building2 className="h-3 w-3 text-[#64748b]" />
                {companies.slice(0, 2).map((comp, idx) => (
                  <React.Fragment key={comp}>
                    {idx > 0 && <span className="text-[#3b434e]">,</span>}
                    <button
                      onClick={() => onSelectEntity && onSelectEntity(comp)}
                      className="text-[#94a3b8] hover:text-[#f1f5f9] hover:underline transition-colors truncate max-w-[120px]"
                    >
                      {comp}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}

            {technologies.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#6e7681] border-l border-[#21262d] pl-2">
                <Cpu className="h-3 w-3 text-[#64748b]" />
                {technologies.slice(0, 2).map((tech, idx) => (
                  <React.Fragment key={tech}>
                    {idx > 0 && <span className="text-[#3b434e]">,</span>}
                    <button
                      onClick={() => onSelectEntity && onSelectEntity(tech)}
                      className="text-[#8b949e] hover:text-[#f1f5f9] hover:underline transition-colors truncate max-w-[120px]"
                    >
                      {tech}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Links: Original Publication & Complete Dossier */}
          <div className="flex items-center gap-3.5 ml-auto font-sans">
            {article.url && article.url !== '#' && (
              <a
                href={article.url}
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
              onClick={() => onSelect(article)}
              className="inline-flex items-center gap-1 text-[11px] text-[#58a6ff] hover:text-[#79c0ff] font-medium transition-colors"
            >
              <span>Full Dossier</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Verified Image Section (Desktop: ~240–260px wide beside content; Mobile: compact banner) */}
      <div className="w-full md:w-[240px] lg:w-[260px] shrink-0 order-first md:order-last">
        <ArticleImage
          article={article}
          aspectRatio="aspect-[16/10]"
          onClick={() => onSelect(article)}
          className="rounded-xs cursor-pointer w-full"
        />
      </div>
    </article>
  );
};
