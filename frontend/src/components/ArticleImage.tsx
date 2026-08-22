import React, { useState } from 'react';
import { Info, ExternalLink } from 'lucide-react';
import { Article } from '../types';
import { CategoryVisualFallback } from './CategoryVisualFallback';

interface ArticleImageProps {
  article: Article;
  className?: string;
  aspectRatio?: string;
  showCredit?: boolean;
  priority?: boolean;
  onClick?: () => void;
}

export const ArticleImage: React.FC<ArticleImageProps> = ({
  article,
  className = '',
  aspectRatio = 'aspect-[16/10]',
  showCredit = false,
  priority = false,
  onClick,
}) => {
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const imageUrl = article.image_url;
  const imageSource = article.image_source || 'Verified Source';
  const imageLicense = article.image_license || 'Public Domain / Open License';
  const imageCredit = article.image_credit || imageSource;
  const imageAlt = article.image_alt || `${article.title} - ${article.category} intelligence visual`;

  if (!imageUrl || hasError) {
    return (
      <div
        className={`relative overflow-hidden rounded-xs cursor-pointer ${aspectRatio} ${className}`}
        onClick={onClick}
      >
        <CategoryVisualFallback
          category={article.category}
          title={article.title}
          className="w-full h-full"
        />
      </div>
    );
  }

  return (
    <div
      className={`group relative overflow-hidden bg-[#0a0c0f] border border-[#21262d] transition-colors hover:border-[#38414e] ${aspectRatio} ${className}`}
      onClick={onClick}
    >
      {/* Loading Skeleton Pulse before image loads */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-[#161b22] animate-pulse flex items-center justify-center">
          <span className="font-mono text-[10px] text-[#484f58] uppercase tracking-wider">
            Loading Visual...
          </span>
        </div>
      )}

      {/* Main Image with lazy loading & cover fit */}
      <img
        src={imageUrl}
        alt={imageAlt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-transform duration-500' : 'opacity-0'
        }`}
      />

      {/* Subtle Attribution Info Trigger on Hover / Focus */}
      <div
        className="absolute bottom-1 right-1 z-10"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label={`Image details: ${imageCredit}, ${imageLicense}`}
          className="p-1 rounded bg-black/70 text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-black/90 backdrop-blur-xs transition-colors"
          onClick={() => setShowTooltip(!showTooltip)}
          title={`Image: ${imageCredit} (${imageLicense})`}
        >
          <Info className="h-3 w-3" />
        </button>

        {/* Attribution Tooltip Card */}
        {showTooltip && (
          <div className="absolute bottom-6 right-0 z-30 w-56 p-2.5 bg-[#0d1117] border border-[#30363d] shadow-xl text-[11px] font-mono text-[#cbd5e1] leading-tight space-y-1">
            <div className="text-[#8b949e] uppercase text-[9px] font-semibold tracking-wider">
              Image Attribution & License
            </div>
            <div className="text-[#f0f6fc] font-sans font-medium line-clamp-1">
              {imageCredit}
            </div>
            <div className="flex items-center justify-between text-[#8b949e] pt-1 border-t border-[#21262d] text-[10px]">
              <span>{imageLicense}</span>
              <span className="text-[#58a6ff]">{imageSource}</span>
            </div>
          </div>
        )}
      </div>

      {/* Optional In-Card Subtle Credit Bar if requested */}
      {showCredit && (
        <div className="absolute bottom-0 inset-x-0 bg-black/75 backdrop-blur-xs px-2 py-1 flex items-center justify-between text-[10px] font-mono text-[#8b949e]">
          <span className="truncate max-w-[160px]">{imageCredit}</span>
          <span className="text-[#58a6ff] shrink-0">{imageLicense}</span>
        </div>
      )}
    </div>
  );
};
