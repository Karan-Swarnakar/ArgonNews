/**
 * ============================================================================
 * ARGONNEWS - DATA ACCESS LAYER (BACKEND ADAPTER)
 * ============================================================================
 *
 * Communicates with Cloudflare Workers API & D1 Database in production.
 * Supports live dynamic queries, scheduled cron ingestion updates, and
 * graceful fallbacks.
 *
 * DATA FLOW:
 * React Components ---> src/api/articles.ts ---> Cloudflare Worker API (/api/articles) ---> Cloudflare D1
 * ============================================================================
 */

import { Article } from '../types';
import { MOCK_ARTICLES } from '../data/mockArticles';
import { AI_SOURCES, SourceDefinition } from '../data/sources';
import { decodeHtmlEntities } from '../utils/text';

export { AI_SOURCES };
export type { SourceDefinition };

// Read configuration from environment variables with safe defaults
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '';

// Default mock state
export const DEFAULT_USE_MOCK: boolean = import.meta.env.VITE_USE_MOCK === 'true';

export interface FetchArticlesResult {
  articles: Article[];
  isMock: boolean;
  sourceEndpoint: string;
  error: string | null;
  total?: number;
  lastUpdated?: string;
}

/**
 * Deduplicates articles by unique URL and normalized title.
 */
export function deduplicateArticles(articles: Article[]): Article[] {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const result: Article[] = [];

  for (const article of articles) {
    const cleanUrl = article.url ? article.url.trim().toLowerCase().replace(/\/$/, '') : '';
    const cleanTitle = article.title
      ? article.title.toLowerCase().replace(/[^a-z0-9]/g, '')
      : '';

    if (cleanUrl && cleanUrl !== '#' && seenUrls.has(cleanUrl)) {
      continue;
    }
    if (cleanTitle && seenTitles.has(cleanTitle)) {
      continue;
    }

    if (cleanUrl && cleanUrl !== '#') seenUrls.add(cleanUrl);
    if (cleanTitle) seenTitles.add(cleanTitle);

    result.push(article);
  }

  return result;
}

/**
 * Normalizes an article object to guarantee all expected fields exist
 * and all HTML entities (‘, ’, “, ”, &, etc.) are properly decoded.
 */
export function normalizeArticle(raw: any, index: number): Article {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `article-${index}`,
      title: 'Untitled Article',
      url: '#',
      source: 'Unknown Source',
      category: 'General',
      analysis: {
        summary: 'No summary available.',
        why_it_matters: 'Details pending analysis.',
        importance: 5,
        companies: [],
        technologies: [],
      },
    };
  }

  const analysisRaw = raw.analysis || {};
  const rawTitle = raw.title || 'Untitled AI Development';
  const rawSummary = analysisRaw.summary || raw.summary || 'Summary not provided by analysis pipeline.';
  const rawWhy =
    analysisRaw.why_it_matters ||
    raw.why_it_matters ||
    'Significance analysis pending or not specified.';

  return {
    id: raw.id || raw.url || `article-${index}`,
    title: decodeHtmlEntities(rawTitle),
    url: String(raw.url || '#'),
    source: decodeHtmlEntities(raw.source || 'Unknown Source'),
    source_type: raw.source_type ? String(raw.source_type) : undefined,
    reliability: typeof raw.reliability === 'number' ? raw.reliability : 0.96,
    content: raw.content ? decodeHtmlEntities(raw.content) : '',
    category: String(raw.category || analysisRaw.category || 'General'),
    published_at: raw.published_at || raw.date || undefined,
    discovered_at: raw.discovered_at || undefined,
    updated_at: raw.updated_at || undefined,
    image_url: raw.image_url || undefined,
    other_sources: Array.isArray(raw.other_sources) ? raw.other_sources : undefined,
    analysis: {
      summary: decodeHtmlEntities(rawSummary),
      why_it_matters: decodeHtmlEntities(rawWhy),
      importance:
        typeof analysisRaw.importance === 'number'
          ? Math.max(1, Math.min(10, Math.round(analysisRaw.importance)))
          : typeof raw.importance === 'number'
          ? Math.max(1, Math.min(10, Math.round(raw.importance)))
          : 5,
      category: analysisRaw.category ? String(analysisRaw.category) : raw.category || 'General',
      companies: Array.isArray(analysisRaw.companies)
        ? analysisRaw.companies.map((c: any) => decodeHtmlEntities(String(c)))
        : Array.isArray(raw.companies)
        ? raw.companies.map((c: any) => decodeHtmlEntities(String(c)))
        : [],
      technologies: Array.isArray(analysisRaw.technologies)
        ? analysisRaw.technologies.map((t: any) => decodeHtmlEntities(String(t)))
        : Array.isArray(raw.technologies)
        ? raw.technologies.map((t: any) => decodeHtmlEntities(String(t)))
        : [],
    },
  };
}

/**
 * Fetches the list of articles from Cloudflare API / D1 database.
 */
export async function getArticles(
  forceUseMock: boolean = false,
  customBaseUrl?: string
): Promise<FetchArticlesResult> {
  const baseUrl = customBaseUrl !== undefined ? customBaseUrl : API_BASE_URL;

  // 1. If mock is explicitly forced, return mock articles
  if (forceUseMock) {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const normalized = MOCK_ARTICLES.map((a, i) => normalizeArticle(a, i));
    return {
      articles: deduplicateArticles(normalized),
      isMock: true,
      sourceEndpoint: 'Embedded Primary Catalog (Offline Mode)',
      error: null,
      total: normalized.length,
    };
  }

  // 2. Production endpoints cascade: /api/articles -> /articles -> /articles.json
  const cleanBase = baseUrl ? baseUrl.replace(/\/$/, '') : '';
  const endpointsToTry = [
    `${cleanBase}/api/articles?limit=150`,
    `${cleanBase}/articles?limit=150`,
    '/api/articles?limit=150',
    '/articles',
    '/articles.json',
    './articles.json',
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  let lastError: Error | null = null;

  for (const endpoint of endpointsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} (${response.statusText}) from ${endpoint}`);
      }

      const data = await response.json();

      let rawList: any[] = [];
      let isLiveEndpoint = true;

      if (Array.isArray(data)) {
        rawList = data;
        isLiveEndpoint = endpoint.includes('/api/') || endpoint === '/articles';
      } else if (data && Array.isArray(data.articles)) {
        rawList = data.articles;
        isLiveEndpoint = data.isLive !== false;
      } else if (data && Array.isArray(data.data)) {
        rawList = data.data;
      } else {
        throw new Error(`Unexpected JSON shape from ${endpoint}`);
      }

      const normalizedArticles = rawList.map((item, index) => normalizeArticle(item, index));
      const deduplicated = deduplicateArticles(normalizedArticles);

      // Ensure chronological ordering (newest first)
      deduplicated.sort((a, b) => {
        const timeA = a.published_at ? new Date(a.published_at).getTime() : 0;
        const timeB = b.published_at ? new Date(b.published_at).getTime() : 0;
        return timeB - timeA;
      });

      return {
        articles: deduplicated,
        isMock: !isLiveEndpoint,
        sourceEndpoint: endpoint,
        error: null,
        total: data.total || deduplicated.length,
        lastUpdated: data.lastUpdated,
      };
    } catch (err: any) {
      lastError = err;
    }
  }

  // 3. Fallback to embedded verified baseline if all network fetches fail
  const fallback = MOCK_ARTICLES.map((a, i) => normalizeArticle(a, i));
  return {
    articles: deduplicateArticles(fallback),
    isMock: true,
    sourceEndpoint: 'Embedded Primary Catalog (Offline Fallback)',
    error: lastError ? lastError.message : null,
    total: fallback.length,
  };
}

/**
 * Checks for newly available articles since a given ISO timestamp.
 * Lightweight polling method for background updates.
 */
export async function checkForNewArticles(
  latestPublishedAt?: string | null
): Promise<{ hasNew: boolean; newCount: number; latestPublishedAt?: string }> {
  try {
    const url = latestPublishedAt
      ? `/api/latest-check?since=${encodeURIComponent(latestPublishedAt)}`
      : '/api/latest-check';

    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      return { hasNew: false, newCount: 0 };
    }

    const data = await res.json();
    return {
      hasNew: Boolean(data.hasNew),
      newCount: typeof data.newCount === 'number' ? data.newCount : 0,
      latestPublishedAt: data.latestPublishedAt || undefined,
    };
  } catch {
    return { hasNew: false, newCount: 0 };
  }
}

/**
 * Triggers manual ingestion execution on the server/worker.
 */
export async function triggerManualIngestion(
  sourceId?: string
): Promise<{ success: boolean; message: string; result?: any }> {
  try {
    const url = sourceId ? `/api/ingest?source=${encodeURIComponent(sourceId)}` : '/api/ingest';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      return {
        success: false,
        message: `Server returned HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      message: data.message || 'Ingestion executed successfully',
      result: data.result,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to trigger ingestion',
    };
  }
}

/**
 * Retrieves a single article by ID or URL.
 */
export function getArticleById(
  articles: Article[],
  idOrUrl: string | number
): Article | undefined {
  return articles.find(
    (a) =>
      String(a.id) === String(idOrUrl) ||
      a.url === idOrUrl ||
      a.title.toLowerCase() === String(idOrUrl).toLowerCase()
  );
}

/**
 * Extracts all unique categories present in the articles dataset.
 */
export function getCategories(articles: Article[]): string[] {
  const categories = new Set<string>();
  articles.forEach((a) => {
    if (a.category) categories.add(a.category);
    if (a.analysis?.category) categories.add(a.analysis.category);
  });
  return Array.from(categories);
}

/**
 * Extracts all unique sources present in the articles dataset.
 */
export function getSources(articles: Article[]): string[] {
  const sources = new Set<string>();
  articles.forEach((a) => {
    if (a.source) sources.add(a.source);
  });
  return Array.from(sources);
}

/**
 * Tests direct backend connectivity for user diagnostics.
 */
export async function testBackendConnection(
  baseUrl: string = API_BASE_URL
): Promise<{ success: boolean; message: string; count?: number; details?: any }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const cleanBase = baseUrl ? baseUrl.replace(/\/$/, '') : '';
    const statusUrl = cleanBase ? `${cleanBase}/api/status` : '/api/status';

    const res = await fetch(statusUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const statusData = await res.json();
      return {
        success: true,
        message: `Connected to Cloudflare Autonomous Engine! Database status: OK`,
        count: statusData?.database?.articleCount || 0,
        details: statusData,
      };
    }

    // Fallback check to /api/articles or /articles.json
    const feedRes = await fetch(cleanBase ? `${cleanBase}/api/articles` : '/api/articles', {
      headers: { Accept: 'application/json' },
    });
    if (feedRes.ok) {
      const feedData = await feedRes.json();
      const count = Array.isArray(feedData)
        ? feedData.length
        : Array.isArray(feedData?.articles)
        ? feedData.articles.length
        : 0;
      return {
        success: true,
        message: `Connected to ArgonNews API (${count} articles available).`,
        count,
      };
    }

    return {
      success: false,
      message: `Server responded with HTTP ${res.status} ${res.statusText}`,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        message: `Connection timed out after 4 seconds attempting to reach ${baseUrl || 'local endpoint'}.`,
      };
    }
    return {
      success: false,
      message: `Failed to connect: ${err.message || 'Network error'}`,
    };
  }
}
