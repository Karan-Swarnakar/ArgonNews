/**
 * Cloudflare D1 Database Access Layer
 */

import { Article } from '../types';
import { D1Database } from './types';
import { decodeHtmlEntities } from '../utils/text';

export interface ArticleDbRow {
  id: string;
  url: string;
  title: string;
  source: string;
  source_type: string | null;
  reliability: number | null;
  category: string;
  published_at: string;
  collected_at: string;
  content: string | null;
  summary: string | null;
  why_it_matters: string | null;
  importance: number | null;
  companies: string | null;
  technologies: string | null;
  content_hash: string | null;
  image_url: string | null;
  other_sources: string | null;
}

/**
 * Converts a database row into the Article interface required by the ArgonNews frontend.
 */
export function rowToArticle(row: ArticleDbRow): Article {
  let companies: string[] = [];
  let technologies: string[] = [];
  let otherSources: any[] = [];

  try {
    if (row.companies) companies = JSON.parse(row.companies);
  } catch {
    companies = [];
  }

  try {
    if (row.technologies) technologies = JSON.parse(row.technologies);
  } catch {
    technologies = [];
  }

  try {
    if (row.other_sources) otherSources = JSON.parse(row.other_sources);
  } catch {
    otherSources = [];
  }

  const title = decodeHtmlEntities(row.title);
  const summary = decodeHtmlEntities(row.summary || 'Summary pending.');
  const whyItMatters = decodeHtmlEntities(
    row.why_it_matters || 'Strategic implications under analysis.'
  );

  return {
    id: row.id,
    title,
    url: row.url,
    source: row.source,
    source_type: row.source_type || undefined,
    reliability: row.reliability ?? 0.95,
    category: row.category,
    published_at: row.published_at,
    content: row.content ? decodeHtmlEntities(row.content) : undefined,
    image_url: row.image_url || undefined,
    other_sources: otherSources.length > 0 ? otherSources : undefined,
    analysis: {
      summary,
      why_it_matters: whyItMatters,
      importance: row.importance ?? 5,
      category: row.category,
      companies,
      technologies,
    },
  };
}

export interface GetArticlesQueryOptions {
  category?: string;
  source?: string;
  limit?: number;
  offset?: number;
  minImportance?: number;
  since?: string;
}

/**
 * Retrieves articles sorted strictly newest first (published_at DESC, collected_at DESC).
 */
export async function getArticlesFromD1(
  db: D1Database,
  options: GetArticlesQueryOptions = {}
): Promise<{ articles: Article[]; total: number }> {
  const limit = Math.min(250, Math.max(1, options.limit || 100));
  const offset = Math.max(0, options.offset || 0);

  const conditions: string[] = [];
  const params: any[] = [];

  if (options.category && options.category !== 'All' && options.category !== 'Today') {
    conditions.push('category LIKE ?');
    params.push(`%${options.category}%`);
  }

  if (options.source && options.source !== 'all') {
    conditions.push('source = ?');
    params.push(options.source);
  }

  if (options.minImportance && options.minImportance > 0) {
    conditions.push('importance >= ?');
    params.push(options.minImportance);
  }

  if (options.since) {
    conditions.push('published_at > ?');
    params.push(options.since);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `SELECT COUNT(*) as count FROM articles ${whereClause}`;
  const countStmt = db.prepare(countQuery);
  const countResult = await (params.length > 0 ? countStmt.bind(...params) : countStmt).first<{ count: number }>();
  const total = countResult?.count ?? 0;

  // Get articles sorted newest first
  const selectQuery = `
    SELECT * FROM articles
    ${whereClause}
    ORDER BY published_at DESC, collected_at DESC
    LIMIT ? OFFSET ?
  `;
  const selectStmt = db.prepare(selectQuery).bind(...params, limit, offset);
  const { results } = await selectStmt.all<ArticleDbRow>();

  const articles = (results || []).map(rowToArticle);
  return { articles, total };
}

/**
 * Inserts an article into D1 with automatic deduplication.
 * Returns true if article was newly inserted, false if it was a duplicate.
 */
export async function insertArticleToD1(db: D1Database, article: Article): Promise<boolean> {
  const query = `
    INSERT OR IGNORE INTO articles (
      id, url, title, source, source_type, reliability,
      category, published_at, collected_at, content,
      summary, why_it_matters, importance,
      companies, technologies, content_hash, image_url, other_sources
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const now = new Date().toISOString();
  const publishedAt = article.published_at || now;
  const companiesJson = JSON.stringify(article.analysis?.companies || []);
  const technologiesJson = JSON.stringify(article.analysis?.technologies || []);
  const otherSourcesJson = JSON.stringify(article.other_sources || []);

  const stmt = db.prepare(query).bind(
    String(article.id || `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    article.url,
    decodeHtmlEntities(article.title),
    article.source,
    article.source_type || 'Lab / Research',
    article.reliability ?? 0.95,
    article.category || article.analysis?.category || 'Research',
    publishedAt,
    now,
    article.content ? decodeHtmlEntities(article.content) : null,
    decodeHtmlEntities(article.analysis?.summary || ''),
    decodeHtmlEntities(article.analysis?.why_it_matters || ''),
    article.analysis?.importance ?? 5,
    companiesJson,
    technologiesJson,
    article.url,
    article.image_url || null,
    otherSourcesJson
  );

  const res = await stmt.run();
  return (res?.meta?.changes ?? 0) > 0;
}

/**
 * Batch-inserts a list of articles into D1 efficiently.
 */
export async function batchInsertArticlesToD1(db: D1Database, articles: Article[]): Promise<number> {
  if (articles.length === 0) return 0;

  const now = new Date().toISOString();
  const statements = articles.map((article) => {
    const query = `
      INSERT OR IGNORE INTO articles (
        id, url, title, source, source_type, reliability,
        category, published_at, collected_at, content,
        summary, why_it_matters, importance,
        companies, technologies, content_hash, image_url, other_sources
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return db.prepare(query).bind(
      String(article.id || `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      article.url,
      decodeHtmlEntities(article.title),
      article.source,
      article.source_type || 'Lab / Research',
      article.reliability ?? 0.95,
      article.category || article.analysis?.category || 'Research',
      article.published_at || now,
      now,
      article.content ? decodeHtmlEntities(article.content) : null,
      decodeHtmlEntities(article.analysis?.summary || ''),
      decodeHtmlEntities(article.analysis?.why_it_matters || ''),
      article.analysis?.importance ?? 5,
      JSON.stringify(article.analysis?.companies || []),
      JSON.stringify(article.analysis?.technologies || []),
      article.url,
      article.image_url || null,
      JSON.stringify(article.other_sources || [])
    );
  });

  // Execute in chunks of 50 to respect D1 batch limits
  const CHUNK_SIZE = 50;
  let insertedCount = 0;

  for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
    const chunk = statements.slice(i, i + CHUNK_SIZE);
    const results = await db.batch(chunk);
    for (const r of results) {
      if (r?.meta?.changes) {
        insertedCount += r.meta.changes;
      }
    }
  }

  return insertedCount;
}

/**
 * Gets the timestamp of the latest article in D1 and total count.
 */
export async function getLatestArticleInfo(
  db: D1Database
): Promise<{ latestPublishedAt: string | null; count: number }> {
  try {
    const countRes = await db.prepare('SELECT COUNT(*) as count FROM articles').first<{ count: number }>();
    const latestRes = await db
      .prepare('SELECT published_at FROM articles ORDER BY published_at DESC LIMIT 1')
      .first<{ published_at: string }>();

    return {
      count: countRes?.count ?? 0,
      latestPublishedAt: latestRes?.published_at ?? null,
    };
  } catch {
    return { count: 0, latestPublishedAt: null };
  }
}

/**
 * Returns diagnostic statistics for the status endpoint.
 */
export async function getDbStats(db: D1Database): Promise<any> {
  try {
    const countRes = await db.prepare('SELECT COUNT(*) as count FROM articles').first<{ count: number }>();
    const latestRes = await db
      .prepare('SELECT published_at, title, source FROM articles ORDER BY published_at DESC LIMIT 1')
      .first<any>();
    const sourcesRes = await db
      .prepare('SELECT COUNT(DISTINCT source) as count FROM articles')
      .first<{ count: number }>();
    const logRes = await db
      .prepare('SELECT * FROM ingestion_logs ORDER BY id DESC LIMIT 1')
      .first<any>();

    return {
      connected: true,
      articleCount: countRes?.count ?? 0,
      sourcesCount: sourcesRes?.count ?? 0,
      latestArticle: latestRes || null,
      lastIngestion: logRes || null,
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err.message || 'Database query failed',
    };
  }
}
