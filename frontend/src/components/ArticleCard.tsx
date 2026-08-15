import React from 'react';
import { ExternalLink, ArrowRight, ShieldCheck, Building2, Cpu } from 'lucide-react';
import { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  onSelect: (article: Article) => void;
  featured?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onSelect,
  featured = false,
}) => {
  const importance = article.analysis?.importance ?? 5;
  const companies = article.analysis?.companies ?? [];
  const technologies = article.analysis?.technologies ?? [];

  // Determine badge styling by importance score
  const getImportanceBadge = (score: number) => {
    if (score >= 9) {
      return {
        label: `CRITICAL ${score}/10`,
        classes: 'border-rose-500/40 bg-rose-950/40 text-rose-300 shadow-sm shadow-rose-950/50',
        barColor: 'bg-rose-500'
      };
    }
    if (score >= 8) {
      return {
        label: `MAJOR ${score}/10`,
        classes: 'border-amber-500/40 bg-amber-950/40 text-amber-300 shadow-sm shadow-amber-950/50',
        barColor: 'bg-amber-500'
      };
    }
    if (score >= 7) {
      return {
        label: `HIGH ${score}/10`,
        classes: 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300 shadow-sm shadow-cyan-950/50',
        barColor: 'bg-cyan-500'
      };
    }
    return {
      label: `SCORE ${score}/10`,
      classes: 'border-slate-700 bg-slate-900 text-slate-300',
      barColor: 'bg-slate-500'
    };
  };

  const badge = getImportanceBadge(importance);

  return (
    <article
      id={`article-card-${article.id || encodeURIComponent(article.title).slice(0, 20)}`}
      className={`group relative flex flex-col justify-between rounded-xl border bg-slate-900/60 p-5 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/90 ${
        featured
          ? 'border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/80 shadow-md shadow-black/40'
          : 'border-slate-800/80'
      }`}
    >
      {/* Top Meta Bar */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Source & Reliability */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-semibold text-slate-300">
              {article.source}
            </span>
            {typeof article.reliability === 'number' && (
              <span
                className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400/90 bg-emerald-950/30 border border-emerald-500/20 px-1.5 py-0.5 rounded"
                title={`Source Reliability Score: ${Math.round(article.reliability * 100)}%`}
              >
                <ShieldCheck className="h-3 w-3" />
                {Math.round(article.reliability * 100)}%
              </span>
            )}
            <span className="rounded bg-slate-800/80 px-2 py-0.5 font-mono text-[11px] text-slate-400">
              {article.category}
            </span>
          </div>

          {/* Importance Indicator */}
          <div
            className={`flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide ${badge.classes}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${badge.barColor}`} />
            {badge.label}
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelect(article)}
          className="cursor-pointer text-base sm:text-lg font-bold leading-snug tracking-tight text-slate-100 group-hover:text-cyan-300 transition-colors"
        >
          {article.title}
        </h3>

        {/* Distilled Summary */}
        <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-300/90 line-clamp-3">
          {article.analysis?.summary || 'No summary available.'}
        </p>

        {/* Why it Matters Callout */}
        {article.analysis?.why_it_matters && (
          <div className="mt-3.5 rounded-lg border border-cyan-900/30 bg-cyan-950/20 p-3 text-xs leading-relaxed">
            <span className="font-mono font-semibold uppercase tracking-wider text-cyan-400 block mb-1">
              Why It Matters
            </span>
            <p className="text-slate-300">
              {article.analysis.why_it_matters}
            </p>
          </div>
        )}
      </div>

      {/* Footer: Companies, Technologies & Outbound links */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/60 flex flex-col gap-3">
        {/* Entity Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {companies.slice(0, 3).map((company) => (
            <span
              key={company}
              className="inline-flex items-center gap-1 rounded bg-slate-800/90 px-2 py-0.5 font-mono text-[10px] text-slate-300 border border-slate-700/50"
            >
              <Building2 className="h-2.5 w-2.5 text-cyan-400" />
              {company}
            </span>
          ))}

          {technologies.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="inline-flex items-center gap-1 rounded bg-slate-800/60 px-2 py-0.5 font-mono text-[10px] text-slate-400 border border-slate-700/40"
            >
              <Cpu className="h-2.5 w-2.5 text-slate-400" />
              {tech}
            </span>
          ))}
          {(companies.length + technologies.length > 6) && (
            <span className="font-mono text-[10px] text-slate-500">
              +{companies.length + technologies.length - 6} more
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={() => onSelect(article)}
            className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>Full Intelligence Dossier</span>
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </button>

          {article.url && article.url !== '#' && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              title="Read original source"
              onClick={(e) => e.stopPropagation()}
            >
              <span>Read Original</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
};
