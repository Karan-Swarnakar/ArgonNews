/**
 * Pexels Image Provider
 * Selects a relevant, licensed, landscape editorial photo for an article.
 * Never scrapes arbitrary web sources - only the official Pexels Search API.
 */

import { Article } from '../types';

const PEXELS_SEARCH_ENDPOINT = 'https://api.pexels.com/v1/search';

export interface PexelsImageMetadata {
  image_url: string;
  image_page_url: string;
  image_photographer_url: string;
  image_credit: string;
  image_source: string;
  image_license: string;
  image_alt?: string;
}

interface PexelsPhoto {
  url: string;
  photographer: string;
  photographer_url: string;
  alt?: string;
  src: {
    original?: string;
    large2x?: string;
    large?: string;
    medium?: string;
  };
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[];
}

// Curated, safely-photographable vocabulary per editorial category -
// deliberately avoids matching on noisy/unrelated title keywords.
const CATEGORY_VISUAL_TERMS: Record<string, string> = {
  Research: 'science research laboratory',
  Models: 'artificial intelligence technology',
  'Open Source': 'software programming code',
  Business: 'business technology office',
  'Safety & Policy': 'law policy government',
};

const DEFAULT_VISUAL_TERM = 'technology innovation';

// Fallback technology labels the ingestion pipeline uses when nothing specific
// was detected - too generic to usefully narrow an image search.
const GENERIC_TECH_TERMS = new Set(['Machine Learning', 'Artificial Intelligence']);

/**
 * Builds a concise, safe search query from fields the ingestion pipeline
 * already computed (category, extracted technologies) rather than raw
 * title text, to avoid picking images on incidental keyword overlap.
 */
export function buildImageSearchQuery(article: Article): string {
  const category = article.category || article.analysis?.category;
  const categoryTerm = (category && CATEGORY_VISUAL_TERMS[category]) || DEFAULT_VISUAL_TERM;
  const technologies = article.analysis?.technologies || [];
  const specificTech = technologies.find((t) => !GENERIC_TECH_TERMS.has(t));

  return specificTech ? `${specificTech} ${categoryTerm}` : categoryTerm;
}

async function runSearch(query: string, apiKey: string): Promise<PexelsPhoto | null> {
  const url = `${PEXELS_SEARCH_ENDPOINT}?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1&size=large`;

  const res = await fetch(url, {
    headers: { Authorization: apiKey },
    signal: AbortSignal.timeout(6000),
  });

  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as PexelsSearchResponse;
  const photo = data?.photos?.[0];
  if (!photo || !photo.src?.large2x && !photo.src?.large) {
    return null;
  }
  return photo;
}

/**
 * Searches Pexels for the most relevant landscape image for an article.
 * Returns null (never a forced/best-effort mismatch) if nothing relevant is found.
 */
export async function findPexelsImage(
  article: Article,
  apiKey: string
): Promise<PexelsImageMetadata | null> {
  const query = buildImageSearchQuery(article);
  if (!query) return null;

  try {
    let photo = await runSearch(query, apiKey);

    // One broader fallback: drop the specific technology term, keep category context.
    if (!photo) {
      const category = article.category || article.analysis?.category;
      const categoryTerm = (category && CATEGORY_VISUAL_TERMS[category]) || DEFAULT_VISUAL_TERM;
      if (categoryTerm !== query) {
        photo = await runSearch(categoryTerm, apiKey);
      }
    }

    if (!photo) return null;

    return {
      image_url: photo.src.large2x || photo.src.large || photo.src.original || '',
      image_page_url: photo.url,
      image_photographer_url: photo.photographer_url,
      image_credit: photo.photographer,
      image_source: 'Pexels',
      image_license: 'Pexels License',
      image_alt: photo.alt && photo.alt.trim() ? photo.alt.trim() : undefined,
    };
  } catch (err: any) {
    console.warn(`[Pexels] Image lookup failed: ${err?.message || err}`);
    return null;
  }
}
