/**
 * Autonomous Multi-Source Ingestion & Extraction Engine
 * Runs on Cloudflare Worker cron triggers or on-demand HTTP API triggers.
 */

import { Article } from '../types';
import { AI_SOURCES, SourceDefinition } from '../data/sources';
import {
  decodeHtmlEntities,
  normalizeDate,
  generateArticleSlug,
  extractEntities,
  categorizeArticle,
  computeImportance,
} from '../utils/text';
import { D1Database, Env } from './types';
import { batchInsertArticlesToD1, pruneOldArticles } from './db';

const BOT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (ArgonNewsAutonomousBot/3.1; +https://argonnews.org)';

/**
 * Strips tracking parameters for consistent URL canonicalization and deduplication.
 */
function canonicalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());
    const cleanParams = new URLSearchParams();
    for (const [k, v] of parsed.searchParams.entries()) {
      if (!k.startsWith('utm_') && k !== 'fbclid' && k !== 'gclid' && k !== 'ref' && k !== 'source') {
        cleanParams.append(k, v);
      }
    }
    parsed.search = cleanParams.toString();
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Extracts candidate image URL from XML item block or HTML content.
 */
function extractImageUrl(block: string): string | undefined {
  // 1. Check media:content or media:thumbnail
  const mediaMatch =
    block.match(/<media:content[^>]+url=["']([^"']+)["']/i) ||
    block.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch && mediaMatch[1] && mediaMatch[1].startsWith('http')) {
    return mediaMatch[1].trim();
  }

  // 2. Check enclosure of image type
  const enclosureMatch = block.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image\/[^"']+["']/i) ||
    block.match(/<enclosure[^>]+type=["']image\/[^"']+["'][^>]+url=["']([^"']+)["']/i);
  if (enclosureMatch && enclosureMatch[1] && enclosureMatch[1].startsWith('http')) {
    return enclosureMatch[1].trim();
  }

  // 3. Check <img> tag inside description or content
  const imgMatch = block.match(/<img[^>]+src=["'](https?:\/\/[^"'\s>]+)["']/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1].trim();
  }

  return undefined;
}

/**
 * Parses RSS / Atom XML string into normalized Article objects.
 */
export function parseRssOrAtomXml(xml: string, sourceDef: SourceDefinition): Article[] {
  const articles: Article[] = [];
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/gi) || [];
  const now = new Date().toISOString();

  for (const block of itemMatches) {
    try {
      // 1. Extract Title
      const titleMatch = block.match(/<title(?:[^>]*)>([\s\S]*?)<\/title>/i);
      const rawTitle = titleMatch ? titleMatch[1] : '';
      const title = decodeHtmlEntities(rawTitle);
      if (!title || title.length < 4) continue;

      // 2. Extract Link / URL
      let url = '';
      const linkHrefMatch =
        block.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']alternate["']/i) ||
        block.match(/<link[^>]*href=["']([^"']+)["']/i) ||
        block.match(/<link(?:[^>]*)>([\s\S]*?)<\/link>/i) ||
        block.match(/<guid[^>]*isPermaLink=["']true["']>([\s\S]*?)<\/guid>/i) ||
        block.match(/<guid(?:[^>]*)>([\s\S]*?)<\/guid>/i);

      if (linkHrefMatch) {
        url = canonicalizeUrl(decodeHtmlEntities(linkHrefMatch[1] || linkHrefMatch[2]).trim());
      }
      if (!url || !url.startsWith('http')) {
        url = sourceDef.url;
      }

      // 3. Extract Published Date (RFC 2822, Atom ISO, dc:date, etc.)
      const dateMatch = block.match(
        /<(?:pubDate|published|updated|dc:date|atom:published|atom:updated|date|lastBuildDate)(?:[^>]*)>([\s\S]*?)<\/(?:pubDate|published|updated|dc:date|atom:published|atom:updated|date|lastBuildDate)>/i
      );
      
      const parsedPubDate = dateMatch ? normalizeDate(dateMatch[1]) : undefined;
      // If the feed gave a valid date, use it; otherwise, use discovered timestamp
      const published_at = parsedPubDate || now;
      const discovered_at = now;

      // 4. Extract Description / Content
      const descMatch = block.match(
        /<(?:description|summary|content|content:encoded)(?:[^>]*)>([\s\S]*?)<\/(?:description|summary|content|content:encoded)>/i
      );
      let rawDesc = descMatch ? decodeHtmlEntities(descMatch[1]) : '';
      if (rawDesc.length > 800) {
        rawDesc = rawDesc.slice(0, 780) + '...';
      }

      const summary = rawDesc || `${sourceDef.name} dispatch on ${title}.`;
      const category = categorizeArticle(title, summary, sourceDef.category);
      const { companies, technologies } = extractEntities(`${title} ${summary}`);

      if (!companies.includes(sourceDef.organization)) {
        companies.unshift(sourceDef.organization);
      }

      const importance = computeImportance(title, summary, sourceDef.reliability);
      const id = generateArticleSlug(sourceDef.id, url, title);
      const imageUrl = extractImageUrl(block);

      const why_it_matters = `Key breakthrough in ${category.toLowerCase()} and frontier computing with direct implications for ${
        technologies[0] || 'foundation model deployment'
      }.`;

      articles.push({
        id,
        title,
        url,
        source: sourceDef.name,
        source_type: sourceDef.source_type,
        reliability: sourceDef.reliability,
        category,
        published_at,
        discovered_at,
        updated_at: now,
        content: rawDesc || summary,
        image_url: imageUrl,
        analysis: {
          summary: summary.length > 260 ? summary.slice(0, 250) + '...' : summary,
          why_it_matters,
          importance,
          category,
          companies: companies.slice(0, 4),
          technologies:
            technologies.length > 0
              ? technologies.slice(0, 4)
              : ['Machine Learning', 'Artificial Intelligence'],
        },
      });
    } catch {
      // Individual malformed item should not halt parsing
      continue;
    }
  }

  return articles;
}

/**
 * Fetches latest papers directly from the official Cornell arXiv API.
 */
async function fetchArxivPapers(sourceDef: SourceDefinition): Promise<Article[]> {
  try {
    const url =
      'https://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL&sortBy=submittedDate&sortOrder=descending&max_results=40';
    const res = await fetch(url, {
      headers: { 'User-Agent': BOT_USER_AGENT },
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) throw new Error(`arXiv HTTP ${res.status}`);
    const xml = await res.text();
    return parseRssOrAtomXml(xml, sourceDef);
  } catch (err: any) {
    console.warn(`[arXiv API] Warning: ${err.message}`);
    return [];
  }
}

/**
 * Ingests a single configured source safely with timeout and error handling.
 */
export async function ingestSource(sourceDef: SourceDefinition): Promise<Article[]> {
  if (sourceDef.id === 'arxiv-ai') {
    return fetchArxivPapers(sourceDef);
  }

  if (!sourceDef.feed_url) {
    return [];
  }

  try {
    const res = await fetch(sourceDef.feed_url, {
      headers: {
        'User-Agent': BOT_USER_AGENT,
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
      signal: AbortSignal.timeout(8000), // 8 second timeout per source
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const xml = await res.text();
    if (!xml || xml.length < 50) {
      throw new Error('Empty or invalid XML payload');
    }

    return parseRssOrAtomXml(xml, sourceDef);
  } catch (err: any) {
    console.warn(`[Source Ingest Failed] ${sourceDef.name} (${sourceDef.feed_url}): ${err.message}`);
    return [];
  }
}

export interface IngestionResult {
  success: boolean;
  startedAt: string;
  completedAt: string;
  sourcesAttempted: number;
  sourcesSucceeded: number;
  articlesFound: number;
  articlesInserted: number;
  errors: string[];
}

/**
 * Autonomous full pipeline runner: checks sources, parses, deduplicates, and saves to D1.
 */
export async function runIngestionPipeline(
  env: Env,
  specificSourceId?: string
): Promise<IngestionResult> {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];
  const db = env.argonnews_db || env.DB;

  let targetSources = AI_SOURCES.filter((s) => s.feed_url || s.id === 'arxiv-ai');
  if (specificSourceId) {
    targetSources = targetSources.filter((s) => s.id === specificSourceId);
  }

  let sourcesSucceeded = 0;
  let allFoundArticles: Article[] = [];

  // Concurrently fetch sources in batches of 6 to respect subrequest limits
  const BATCH_SIZE = 6;
  for (let i = 0; i < targetSources.length; i += BATCH_SIZE) {
    const batch = targetSources.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(batch.map((source) => ingestSource(source)));

    for (let j = 0; j < batchResults.length; j++) {
      const res = batchResults[j];
      const src = batch[j];
      if (res.status === 'fulfilled') {
        if (res.value.length > 0) {
          sourcesSucceeded++;
          allFoundArticles.push(...res.value);
        }
      } else {
        errors.push(`${src.name}: ${res.reason?.message || 'Unknown error'}`);
      }
    }
  }

  let articlesInserted = 0;

  // Insert into Cloudflare D1 if binding exists
  if (db && allFoundArticles.length > 0) {
    try {
      articlesInserted = await batchInsertArticlesToD1(db, allFoundArticles);
    } catch (err: any) {
      errors.push(`D1 Batch Insert Error: ${err.message}`);
    }

    // Safely prune old articles to maintain target 2,000 article retention limit
    try {
      await pruneOldArticles(db, 2000);
    } catch (err: any) {
      // Non-blocking prune warning
      console.warn(`[Retention Prune] Non-blocking warning: ${err?.message}`);
    }

    // Record audit log
    try {
      await db.prepare(`
        INSERT INTO ingestion_logs (
          started_at, completed_at, sources_attempted,
          sources_succeeded, articles_found, articles_inserted,
          status, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          startedAt,
          new Date().toISOString(),
          targetSources.length,
          sourcesSucceeded,
          allFoundArticles.length,
          articlesInserted,
          errors.length === 0 ? 'SUCCESS' : 'COMPLETED_WITH_WARNINGS',
          errors.length > 0 ? errors.slice(0, 5).join('; ') : null
        )
        .run();
    } catch {
      // Non-blocking log failure
    }
  }

  const completedAt = new Date().toISOString();

  return {
    success: errors.length === 0 || sourcesSucceeded > 0,
    startedAt,
    completedAt,
    sourcesAttempted: targetSources.length,
    sourcesSucceeded,
    articlesFound: allFoundArticles.length,
    articlesInserted,
    errors,
  };
}
