/**
 * ArgonNews - Editorial transaction detail card.
 * Shared compact/full presentation for a single AI Money Flow deal, used both
 * as a hover tooltip and as the persistent selected-deal panel.
 */

import React from 'react';
import { ArrowRight, ExternalLink, Newspaper, X } from 'lucide-react';
import { AITransaction, Article } from '../types';
import { CompanyLogoIcon } from '../assets/companyLogos';

function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

interface TransactionCardProps {
  tx: AITransaction;
  variant?: 'compact' | 'full';
  onClose?: () => void;
  matchingArticle?: Article | null;
  onOpenArticle?: (article: Article) => void;
  className?: string;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  tx,
  variant = 'full',
  onClose,
  matchingArticle,
  onOpenArticle,
  className = '',
}) => {
  const isCompact = variant === 'compact';

  return (
    <div className={`rounded-xl border border-[#2a313c] bg-[#12161d]/[0.98] shadow-2xl backdrop-blur-md ${isCompact ? 'p-3.5' : 'p-5'} ${className}`}>
      {/* Header row: companies + optional close */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
          <span className="flex items-center gap-1.5 min-w-0">
            <CompanyLogoIcon name={tx.source_company} size={isCompact ? 15 : 17} monoColor="#e6edf3" />
            <span className="truncate font-semibold text-[#f0f6fc]">{tx.source_company}</span>
          </span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#38bdf8]" />
          <span className="flex items-center gap-1.5 min-w-0">
            <CompanyLogoIcon name={tx.target_company} size={isCompact ? 15 : 17} monoColor="#e6edf3" />
            <span className="truncate font-semibold text-[#f0f6fc]">{tx.target_company}</span>
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-[#6e7681] transition-colors hover:bg-white/5 hover:text-[#f0f6fc] cursor-pointer"
            aria-label="Close transaction details"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mt-0.5 text-[11px] font-medium text-[#6e7681]">{tx.transaction_type}</div>

      {/* Amount - the clear focal figure */}
      <div className={`mt-2.5 font-mono font-semibold text-[#f0f6fc] ${isCompact ? 'text-base' : 'text-xl'}`}>
        {tx.amount_disclosed ? tx.amount_formatted : 'Financial value not publicly disclosed'}
      </div>

      {/* Description */}
      {!isCompact && (
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#9ba5b0] line-clamp-3">{tx.description}</p>
      )}

      {/* Meta row: date + source */}
      <div className={`flex items-center justify-between gap-3 text-[11px] text-[#6e7681] ${isCompact ? 'mt-2' : 'mt-3.5 border-t border-white/[0.06] pt-3'}`}>
        <span>{formatMonthYear(tx.announcement_date)}</span>
        <a
          href={tx.source_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-[#7dd3fc] hover:underline"
        >
          <span>{tx.source_name}</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Related ArgonNews coverage */}
      {!isCompact && matchingArticle && (
        <div className="mt-3 rounded-lg border border-[#38bdf8]/25 bg-[#38bdf8]/[0.06] p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#7dd3fc]">
            <Newspaper className="h-3.5 w-3.5" />
            ArgonNews coverage
          </div>
          <div className="mt-1 text-[13px] font-medium text-[#f0f6fc] line-clamp-2">{matchingArticle.title}</div>
          <button
            type="button"
            onClick={() => {
              if (onOpenArticle) onOpenArticle(matchingArticle);
              else window.open(matchingArticle.url, '_blank');
            }}
            className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-[#38bdf8] hover:text-[#7dd3fc] cursor-pointer"
          >
            Read the story <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};
