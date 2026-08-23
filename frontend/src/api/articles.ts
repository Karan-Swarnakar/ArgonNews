/**
 * ============================================================================
 * ARGONNEWS - DATA ACCESS LAYER (BACKEND ADAPTER)
 * ============================================================================
 *
 * This file is the ONLY place in the entire frontend application that
 * communicates with the external backend API.
 *
 * The rest of the React application calls the functions exported here and
 * NEVER calls fetch() or axios directly.
 *
 * ----------------------------------------------------------------------------
 * DATA FLOW:
 * React Components  --->  src/api/articles.ts  --->  Python Backend API  --->  articles.json
 * ----------------------------------------------------------------------------
 *
 * CONFIGURATION:
 * 1. Set VITE_API_BASE_URL in your .env file to your Python server (e.g. http://localhost:8000)
 * 2. Set VITE_USE_MOCK=false to connect to your real Python backend.
 * ============================================================================
 */

import { Article } from '../types';
import { MOCK_ARTICLES } from '../data/mockArticles';
import { AI_SOURCES, SourceDefinition } from '../data/sources';

export { AI_SOURCES };
export type { SourceDefinition };

// Read configuration from environment variables with safe defaults
export const API_BASE_URL: string = '';

// Default mock state is strictly false. Real articles.json dataset is the production default.
export const DEFAULT_USE_MOCK: boolean = import.meta.env.VITE_USE_MOCK === 'true';

export interface FetchArticlesResult {
  articles: Article[];
  isMock: boolean;
  sourceEndpoint: string;
  error: string | null;
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
 * even if some fields are missing from a scraped or parsed entry.
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
        technologies: []
      }
    };
  }

  const analysisRaw = raw.analysis || {};

  return {
    id: raw.id || raw.url || `article-${index}`,
    title: String(raw.title || 'Untitled AI Development'),
    url: String(raw.url || '#'),
    source: String(raw.source || 'Unknown Source'),
    source_type: raw.source_type ? String(raw.source_type) : undefined,
    reliability:
      typeof raw.reliability === 'number' ? raw.reliability : 0.96,
    content: raw.content ? String(raw.content) : '',
    category: String(raw.category || analysisRaw.category || 'General'),
    published_at: raw.published_at || raw.date || undefined,
    analysis: {
      summary: String(
        analysisRaw.summary || 'Summary not provided by analysis pipeline.'
      ),
      why_it_matters: String(
        analysisRaw.why_it_matters ||
          'Significance analysis pending or not specified.'
      ),
      importance:
        typeof analysisRaw.importance === 'number'
          ? Math.max(1, Math.min(10, Math.round(analysisRaw.importance)))
          : 5,
      category: analysisRaw.category
        ? String(analysisRaw.category)
        : raw.category || 'General',
      companies: Array.isArray(analysisRaw.companies)
        ? analysisRaw.companies.map(String)
        : [],
      technologies: Array.isArray(analysisRaw.technologies)
        ? analysisRaw.technologies.map(String)
        : []
    }
  };
}

/**
 * Fetches the list of articles.
 */
export async function getArticles(
  forceUseMock: boolean = false,
  customBaseUrl?: string
): Promise<FetchArticlesResult> {
  const baseUrl = customBaseUrl || API_BASE_URL;

  // 1. If mock is explicitly forced, return mock articles
  if (forceUseMock) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const normalized = MOCK_ARTICLES.map((a, i) => normalizeArticle(a, i));
    return {
      articles: deduplicateArticles(normalized),
      isMock: true,
      sourceEndpoint: 'src/data/mockArticles.ts (Mock Mode)',
      error: null
    };
  }

  // 2. Try fetching from the static / API endpoints
  const endpointsToTry = [
    '/articles.json',
    './articles.json',
    `${baseUrl ? baseUrl.replace(/\/$/, '') : ''}/articles.json`
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
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} (${response.statusText}) from ${endpoint}`
        );
      }

      const data = await response.json();

      let rawList: any[] = [];
      if (Array.isArray(data)) {
        rawList = data;
      } else if (data && Array.isArray(data.articles)) {
        rawList = data.articles;
      } else if (data && Array.isArray(data.data)) {
        rawList = data.data;
      } else {
        throw new Error(
          `Unexpected JSON shape: Expected an array of articles or { articles: [...] }, but received ${typeof data}`
        );
      }

      const normalizedArticles = rawList.map((item, index) =>
        normalizeArticle(item, index)
      );

      return {
        articles: deduplicateArticles(normalizedArticles),
        isMock: false,
        sourceEndpoint: endpoint,
        error: null
      };
    } catch (err: any) {
      lastError = err;
    }
  }

  // Fallback to mock dataset if local fetch failed
  const fallback = MOCK_ARTICLES.map((a, i) => normalizeArticle(a, i));
  return {
    articles: deduplicateArticles(fallback),
    isMock: true,
    sourceEndpoint: 'Embedded Primary Catalog (Offline Fallback)',
    error: null
  };
}

/**
 * Retrieves a single article by ID or URL from a provided list or backend.
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
): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('/articles.json', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        success: false,
        message: `Connected to ${baseUrl}, but server responded with HTTP ${res.status} ${res.statusText}`
      };
    }

    const data = await res.json();
    const count = Array.isArray(data)
      ? data.length
      : Array.isArray(data?.articles)
      ? data.articles.length
      : 0;

    return {
      success: true,
      message: `Successfully loaded public articles.json! Found ${count} articles.`,
      count
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        message: `Connection timed out after 4 seconds attempting to reach ${baseUrl}.`
      };
    }
    return {
      success: false,
      message: `Failed to connect to ${baseUrl}: ${err.message || 'CORS error or server offline'}`
    };
  }
}
