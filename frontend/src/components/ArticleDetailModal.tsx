import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Building2,
  Cpu,
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  Sparkles,
} from 'lucide-react';
import { Article } from '../types';
import { ArticleImage } from './ArticleImage';

interface ArticleDetailModalProps {
  article: Article | null;
  onClose: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (article: Article) => void;
  onSelectEntity?: (entity: string) => void;
}

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  article,
  onClose,
  isBookmarked = false,
  onToggleBookmark,
  onSelectEntity,
}) => {
  const [showRawContent, setShowRawContent] = useState<boolean>(false);
  const [copiedCitation, setCopiedCitation] = useState<boolean>(false);

  if (!article) return null;

  const importance = article.analysis?.importance ?? 5;
  const companies = article.analysis?.companies ?? [];
  const technologies = article.analysis?.technologies ?? [];

  const handleCopyCitation = () => {
    const text = `"${article.title}" — Source: ${article.source}. Intelligence Summary: ${article.analysis?.summary}\nURL: ${article.url}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCitation(true);
      setTimeout(() => setCopiedCitation(false), 2200);
    }
  };

  return (
    <div
      id="article-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="article-detail-modal-card"
        className="relative w-full max-w-3xl border border-[#2d333b] bg-[#0e1013] my-6 overflow-hidden text-[#e2e8f0] shadow-2xl rounded-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Top Dossier Header Bar */}
        <div className="flex items-center justify-between border-b border-[#21262d] bg-[#090a0d] px-6 py-3 text-xs font-sans">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-bold uppercase tracking-widest text-[#cbd5e1] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Intelligence Dossier
            </span>
            <span className="text-[#3b434e]">•</span>
            <span className="text-[#8b949e] font-medium">
              {article.category}
            </span>
            {importance >= 8 && (
              <span className="text-[10px] font-sans font-semibold px-2 py-0.2 rounded-full bg-amber-950/40 text-amber-300 border border-amber-800/40">
                Impact {importance}/10
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onToggleBookmark && (
              <button
                onClick={() => onToggleBookmark(article)}
                className={`p-1.5 rounded hover:bg-[#1c2128] text-[#8b949e] hover:text-[#f0f6fc] transition-colors cursor-pointer ${
                  isBookmarked ? 'text-amber-400' : ''
                }`}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark entry'}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
              </button>
            )}

            <button
              onClick={handleCopyCitation}
              className="p-1.5 rounded hover:bg-[#1c2128] text-[#8b949e] hover:text-[#f0f6fc] transition-colors cursor-pointer"
              title="Copy citation"
            >
              {copiedCitation ? (
                <Check className="h-4 w-4 text-[#7ee787]" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>

            <button
              id="close-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[#1c2128] text-[#8b949e] hover:text-white transition-colors ml-1 cursor-pointer"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 2. Scrollable Body Content */}
        <div className="p-6 sm:p-8 max-h-[78vh] overflow-y-auto space-y-6">
          
          {/* Main Title & Byline */}
          <div>
            <div className="flex items-center gap-2.5 text-xs text-[#8b949e] font-sans mb-3 flex-wrap">
              <span className="font-sans font-bold text-xs tracking-wider uppercase text-[#f1f5f9]">
                {article.source}
              </span>
              {article.published_at && (
                <>
                  <span className="text-[#3b434e]">•</span>
                  <span>{new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </>
              )}
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#f8fafc] leading-tight tracking-tight mb-4">
              {article.title}
            </h1>

            {/* Featured Image in Modal */}
            <div className="my-4 max-h-64 overflow-hidden rounded">
              <ArticleImage
                article={article}
                aspectRatio="aspect-[21/9]"
                showCredit={true}
                className="w-full"
              />
            </div>
          </div>

          {/* Section: Distilled Executive Summary */}
          <div className="border-t border-b border-[#21262d] py-5">
            <h2 className="font-sans text-xs uppercase font-bold tracking-wider text-[#cbd5e1] mb-2.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-[#94a3b8]" />
              Distilled Summary
            </h2>
            <p className="text-[15px] leading-relaxed text-[#cbd5e1] font-sans">
              {article.analysis?.summary || 'No summary available.'}
            </p>
          </div>

          {/* Section: Strategic Implications & Why It Matters */}
          {article.analysis?.why_it_matters && (
            <div className="pl-4 border-l-2 border-[#4b5563] py-2 rounded-r text-xs">
              <h2 className="font-sans font-bold text-xs uppercase tracking-wider text-[#e2e8f0] mb-1">
                Why It Matters
              </h2>
              <p className="text-[14px] leading-relaxed text-[#94a3b8] italic font-serif">
                "{article.analysis.why_it_matters}"
              </p>
            </div>
          )}

          {/* Section: Key Actors & Technologies */}
          {(companies.length > 0 || technologies.length > 0) && (
            <div className="pt-2 text-xs font-sans space-y-3">
              {companies.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#6e7681] uppercase text-[11px] font-semibold flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Actors:
                  </span>
                  {companies.map((comp) => (
                    <button
                      key={comp}
                      onClick={() => {
                        if (onSelectEntity) {
                          onSelectEntity(comp);
                          onClose();
                        }
                      }}
                      className="text-[#94a3b8] hover:text-[#f8fafc] hover:underline cursor-pointer"
                    >
                      {comp}
                    </button>
                  ))}
                </div>
              )}

              {technologies.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#6e7681] uppercase text-[11px] font-semibold flex items-center gap-1">
                    <Cpu className="h-3 w-3" /> Domains:
                  </span>
                  {technologies.map((tech) => (
                    <button
                      key={tech}
                      onClick={() => {
                        if (onSelectEntity) {
                          onSelectEntity(tech);
                          onClose();
                        }
                      }}
                      className="text-[#8b949e] hover:text-[#f8fafc] hover:underline cursor-pointer"
                    >
                      {tech}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section: Raw Source Transcript (Collapsible) */}
          {article.content && (
            <div className="border-t border-[#21262d] pt-4">
              <button
                onClick={() => setShowRawContent(!showRawContent)}
                className="flex items-center justify-between w-full text-left font-sans text-xs font-medium text-[#8b949e] hover:text-[#cbd5e1] py-1 cursor-pointer"
              >
                <span>Raw Source Text ({article.content.length} chars)</span>
                {showRawContent ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              {showRawContent && (
                <div className="mt-2.5 p-3.5 font-sans text-xs text-[#8b949e] bg-[#08090b] border border-[#21262d] max-h-48 overflow-y-auto leading-relaxed whitespace-pre-wrap rounded">
                  {article.content}
                </div>
              )}
            </div>
          )}

        </div>

        {/* 3. Modal Bottom Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#21262d] bg-[#0e1013] px-6 py-3.5 text-xs font-sans">
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-[#cbd5e1] transition-colors cursor-pointer font-medium"
          >
            ← Close Dossier
          </button>

          {article.url && article.url !== '#' ? (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#58a6ff] hover:text-[#79c0ff] hover:underline font-semibold transition-colors"
            >
              <span>Open on {article.source}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-[#6e7681]">
              Source URL not specified
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
