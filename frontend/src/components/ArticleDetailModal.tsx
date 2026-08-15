import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  Building2,
  Cpu,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Share2,
  Check
} from 'lucide-react';
import { Article } from '../types';

interface ArticleDetailModalProps {
  article: Article | null;
  onClose: () => void;
}

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  article,
  onClose,
}) => {
  const [showRawContent, setShowRawContent] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!article) return null;

  const importance = article.analysis?.importance ?? 5;
  const companies = article.analysis?.companies ?? [];
  const technologies = article.analysis?.technologies ?? [];

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${article.title}\n${article.url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      id="article-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="article-detail-modal-card"
        className="relative w-full max-w-3xl rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/80 my-8 overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xs font-semibold text-cyan-400">
              ARGON DOSSIER
            </span>
            <span className="text-slate-600">•</span>
            <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-300">
              {article.category}
            </span>
            {article.source_type && (
              <span className="hidden sm:inline-block rounded bg-slate-800/60 px-2 py-0.5 font-mono text-[11px] text-slate-400">
                {article.source_type}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
              title="Copy article link"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
            </button>
            <button
              id="close-modal-btn"
              onClick={onClose}
              className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
              title="Close dossier (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 max-h-[78vh] overflow-y-auto space-y-6">
          
          {/* Main Title & Source Metadata */}
          <div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mb-2.5">
              <span className="font-semibold text-slate-200 text-sm">
                {article.source}
              </span>
              {typeof article.reliability === 'number' && (
                <span className="inline-flex items-center gap-1 font-mono text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                  <ShieldCheck className="h-3 w-3" />
                  Reliability: {Math.round(article.reliability * 100)}%
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
              {article.title}
            </h1>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <div>
              <div className="text-[11px] font-mono uppercase text-slate-400">
                Importance
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono text-cyan-400">
                  {importance}
                </span>
                <span className="text-xs font-mono text-slate-400">/ 10</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-mono uppercase text-slate-400">
                Category
              </div>
              <div className="mt-1 text-xs font-medium text-slate-200 truncate">
                {article.category}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-mono uppercase text-slate-400">
                Entities
              </div>
              <div className="mt-1 text-xs font-mono text-slate-200">
                {companies.length} Organizations
              </div>
            </div>

            <div>
              <div className="text-[11px] font-mono uppercase text-slate-400">
                Tech Domains
              </div>
              <div className="mt-1 text-xs font-mono text-slate-200">
                {technologies.length} Areas
              </div>
            </div>
          </div>

          {/* 1. What Happened? (Distilled Summary) */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-200">
                Distilled Summary
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-slate-200">
              {article.analysis?.summary || 'No summary available.'}
            </p>
          </div>

          {/* 2. Why Does It Matter? */}
          <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-cyan-300">
                Why It Matters & Strategic Implications
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-slate-100">
              {article.analysis?.why_it_matters || 'Strategic analysis not specified.'}
            </p>
          </div>

          {/* 3. Companies & Research Organizations */}
          {companies.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Building2 className="h-4 w-4 text-slate-400" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Involved Companies & Research Labs
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {companies.map((company) => (
                  <span
                    key={company}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-mono text-slate-200"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    {company}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 4. Technologies & Domains Affected */}
          {technologies.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Cpu className="h-4 w-4 text-slate-400" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Affected Technologies & AI Research Domains
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {technologies.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-mono text-slate-300"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 5. Optional Scraped Source Preview (Collapsible disclosure, hidden by default) */}
          {article.content && (
            <div className="border-t border-slate-800/80 pt-4">
              <button
                id="toggle-raw-content-btn"
                onClick={() => setShowRawContent(!showRawContent)}
                className="flex items-center justify-between w-full text-left text-xs font-mono text-slate-400 hover:text-slate-200 py-1"
              >
                <span>Raw Scraped Content ({article.content.length} chars)</span>
                {showRawContent ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {showRawContent && (
                <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-400 max-h-48 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                  {article.content}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/90 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            Close Dossier
          </button>

          {article.url && article.url !== '#' ? (
            <a
              id="read-original-article-link"
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-cyan-900/50 hover:bg-cyan-500 transition-colors"
            >
              <span>Read Original Article</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <span className="text-xs text-slate-500">
              No outbound URL provided
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
