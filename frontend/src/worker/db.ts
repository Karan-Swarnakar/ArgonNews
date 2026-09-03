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
  content: string | null;
  category: string;
  published_at: string;
  discovered_at: string | null;
  updated_at: string | null;
  collected_at: string;
  analysis: string | null;
  summary: string | null;
  why_it_matters: string | null;
  importance: number | null;
  companies: string | null;
  technologies: string | null;
  image_url: string | null;
  image_source: string | null;
  image_license: string | null;
  image_credit: string | null;
  image_alt: string | null;
  content_hash: string | null;
  other_sources: string | null;
}

/**
 * Converts a database row into the Article interface required by the ArgonNews frontend.
 */
export function rowToArticle(row: ArticleDbRow): Article {
  let analysisObj: any = null;
  if (row.analysis) {
    try {
      analysisObj = JSON.parse(row.analysis);
    } catch {
      analysisObj = null;
    }
  }

  let companies: string[] = analysisObj?.companies || [];
  let technologies: string[] = analysisObj?.technologies || [];
  let otherSources: any[] = [];

  if (companies.length === 0 && row.companies) {
    try {
      companies = JSON.parse(row.companies);
    } catch {
      companies = [];
    }
  }

  if (technologies.length === 0 && row.technologies) {
    try {
      technologies = JSON.parse(row.technologies);
    } catch {
      technologies = [];
    }
  }

  try {
    if (row.other_sources) otherSources = JSON.parse(row.other_sources);
  } catch {
    otherSources = [];
  }

  const title = decodeHtmlEntities(row.title);
  const summary = decodeHtmlEntities(
    analysisObj?.summary || row.summary || 'Summary pending analysis.'
  );
  const whyItMatters = decodeHtmlEntities(
    analysisObj?.why_it_matters || row.why_it_matters || 'Strategic implications under analysis.'
  );
  const importance =
    typeof analysisObj?.importance === 'number'
      ? analysisObj.importance
      : typeof row.importance === 'number'
      ? row.importance
      : 5;

  return {
    id: row.id,
    title,
    url: row.url,
    source: row.source,
    source_type: row.source_type || undefined,
    reliability: row.reliability ?? 0.95,
    category: row.category,
    published_at: row.published_at,
    discovered_at: row.discovered_at || undefined,
    updated_at: row.updated_at || undefined,
    content: row.content ? decodeHtmlEntities(row.content) : undefined,
    image_url: row.image_url || undefined,
    image_source: row.image_source || undefined,
    image_license: row.image_license || undefined,
    image_credit: row.image_credit || undefined,
    image_alt: row.image_alt || undefined,
    other_sources: otherSources.length > 0 ? otherSources : undefined,
    analysis: {
      summary,
      why_it_matters: whyItMatters,
      importance,
      category: analysisObj?.category || row.category,
      companies,
      technologies,
    },
  };
}

export interface GetArticlesQueryOptions {
  category?: string;
  source?: string;
  sortBy?: 'newest' | 'importance-desc';
  search?: string;
  limit?: number;
  offset?: number;
  minImportance?: number;
  since?: string;
}

/**
 * Retrieves articles sorted strictly newest first by default (published_at DESC, collected_at DESC).
 */
export async function getArticlesFromD1(
  db: D1Database,
  options: GetArticlesQueryOptions = {}
): Promise<{ articles: Article[]; total: number }> {
  const limit = Math.min(300, Math.max(1, options.limit || 120));
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

  if (options.search && options.search.trim().length > 0) {
    conditions.push('(title LIKE ? OR summary LIKE ? OR content LIKE ?)');
    const searchPattern = `%${options.search.trim()}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `SELECT COUNT(*) as count FROM articles ${whereClause}`;
  const countStmt = db.prepare(countQuery);
  const countResult = await (params.length > 0 ? countStmt.bind(...params) : countStmt).first<{ count: number }>();
  const total = countResult?.count ?? 0;

  // Determine sort order
  let orderByClause = 'ORDER BY published_at DESC, collected_at DESC';
  if (options.sortBy === 'importance-desc') {
    orderByClause = 'ORDER BY importance DESC, published_at DESC';
  }

  // Get articles sorted
  const selectQuery = `
    SELECT * FROM articles
    ${whereClause}
    ${orderByClause}
    LIMIT ? OFFSET ?
  `;
  const selectStmt = db.prepare(selectQuery).bind(...params, limit, offset);
  const { results } = await selectStmt.all<ArticleDbRow>();

  const articles = (results || []).map(rowToArticle);
  return { articles, total };
}

/**
 * Inserts an article into D1 with automatic deduplication and metadata enrichment.
 * If the URL already exists, it updates metadata if richer information is available.
 * Returns true if article was newly inserted or updated.
 */
export async function insertArticleToD1(db: D1Database, article: Article): Promise<boolean> {
  const query = `
    INSERT INTO articles (
      id, url, title, source, source_type, reliability,
      content, category, published_at, discovered_at, updated_at, collected_at,
      analysis, summary, why_it_matters, importance,
      companies, technologies, image_url, image_source,
      image_license, image_credit, image_alt, content_hash, other_sources
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(url) DO UPDATE SET
      title = excluded.title,
      content = COALESCE(excluded.content, articles.content),
      image_url = COALESCE(excluded.image_url, articles.image_url),
      image_source = COALESCE(excluded.image_source, articles.image_source),
      image_license = COALESCE(excluded.image_license, articles.image_license),
      image_credit = COALESCE(excluded.image_credit, articles.image_credit),
      image_alt = COALESCE(excluded.image_alt, articles.image_alt),
      updated_at = excluded.updated_at,
      collected_at = excluded.collected_at,
      analysis = CASE WHEN excluded.summary IS NOT NULL AND length(excluded.summary) > length(COALESCE(articles.summary, '')) THEN excluded.analysis ELSE articles.analysis END,
      summary = CASE WHEN excluded.summary IS NOT NULL AND length(excluded.summary) > length(COALESCE(articles.summary, '')) THEN excluded.summary ELSE articles.summary END,
      why_it_matters = CASE WHEN excluded.why_it_matters IS NOT NULL AND length(excluded.why_it_matters) > length(COALESCE(articles.why_it_matters, '')) THEN excluded.why_it_matters ELSE articles.why_it_matters END,
      importance = MAX(articles.importance, excluded.importance)
  `;

  const now = new Date().toISOString();
  const publishedAt = article.published_at || now;
  const discoveredAt = article.discovered_at || now;
  const analysisJson = JSON.stringify(article.analysis || {});
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
    article.content ? decodeHtmlEntities(article.content) : null,
    article.category || article.analysis?.category || 'Research',
    publishedAt,
    discoveredAt,
    now,
    now,
    analysisJson,
    decodeHtmlEntities(article.analysis?.summary || ''),
    decodeHtmlEntities(article.analysis?.why_it_matters || ''),
    article.analysis?.importance ?? 5,
    companiesJson,
    technologiesJson,
    article.image_url || null,
    article.image_source || null,
    article.image_license || null,
    article.image_credit || null,
    article.image_alt || null,
    article.url,
    otherSourcesJson
  );

  const res = await stmt.run();
  return (res?.meta?.changes ?? 0) > 0;
}

/**
 * Batch-inserts a list of articles into D1 efficiently.
 * Uses ON CONFLICT to update enriched articles while preventing duplicate rows.
 */
export async function batchInsertArticlesToD1(db: D1Database, articles: Article[]): Promise<number> {
  if (articles.length === 0) return 0;

  const now = new Date().toISOString();
  const statements = articles.map((article) => {
    const query = `
      INSERT INTO articles (
        id, url, title, source, source_type, reliability,
        content, category, published_at, discovered_at, updated_at, collected_at,
        analysis, summary, why_it_matters, importance,
        companies, technologies, image_url, image_source,
        image_license, image_credit, image_alt, content_hash, other_sources
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(url) DO UPDATE SET
        title = excluded.title,
        content = COALESCE(excluded.content, articles.content),
        image_url = COALESCE(excluded.image_url, articles.image_url),
        image_source = COALESCE(excluded.image_source, articles.image_source),
        image_license = COALESCE(excluded.image_license, articles.image_license),
        image_credit = COALESCE(excluded.image_credit, articles.image_credit),
        image_alt = COALESCE(excluded.image_alt, articles.image_alt),
        updated_at = excluded.updated_at,
        collected_at = excluded.collected_at,
        analysis = CASE WHEN excluded.summary IS NOT NULL AND length(excluded.summary) > length(COALESCE(articles.summary, '')) THEN excluded.analysis ELSE articles.analysis END,
        summary = CASE WHEN excluded.summary IS NOT NULL AND length(excluded.summary) > length(COALESCE(articles.summary, '')) THEN excluded.summary ELSE articles.summary END,
        why_it_matters = CASE WHEN excluded.why_it_matters IS NOT NULL AND length(excluded.why_it_matters) > length(COALESCE(articles.why_it_matters, '')) THEN excluded.why_it_matters ELSE articles.why_it_matters END,
        importance = MAX(articles.importance, excluded.importance)
    `;

    const publishedAt = article.published_at || now;
    const discoveredAt = article.discovered_at || now;
    const analysisJson = JSON.stringify(article.analysis || {});
    const companiesJson = JSON.stringify(article.analysis?.companies || []);
    const technologiesJson = JSON.stringify(article.analysis?.technologies || []);
    const otherSourcesJson = JSON.stringify(article.other_sources || []);

    return db.prepare(query).bind(
      String(article.id || `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      article.url,
      decodeHtmlEntities(article.title),
      article.source,
      article.source_type || 'Lab / Research',
      article.reliability ?? 0.95,
      article.content ? decodeHtmlEntities(article.content) : null,
      article.category || article.analysis?.category || 'Research',
      publishedAt,
      discoveredAt,
      now,
      now,
      analysisJson,
      decodeHtmlEntities(article.analysis?.summary || ''),
      decodeHtmlEntities(article.analysis?.why_it_matters || ''),
      article.analysis?.importance ?? 5,
      companiesJson,
      technologiesJson,
      article.image_url || null,
      article.image_source || null,
      article.image_license || null,
      article.image_credit || null,
      article.image_alt || null,
      article.url,
      otherSourcesJson
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
 * Safely prunes older articles to maintain target retention (e.g. 2,000 articles).
 * Never deletes recent articles and never wipes data during a run.
 */
export async function pruneOldArticles(db: D1Database, maxKeep: number = 2000): Promise<number> {
  try {
    const countRes = await db.prepare('SELECT COUNT(*) as count FROM articles').first<{ count: number }>();
    const total = countRes?.count ?? 0;
    if (total <= maxKeep + 50) {
      return 0;
    }

    const deleteCount = total - maxKeep;
    const res = await db
      .prepare(`
        DELETE FROM articles
        WHERE id IN (
          SELECT id FROM articles
          ORDER BY published_at ASC, collected_at ASC
          LIMIT ?
        )
      `)
      .bind(deleteCount)
      .run();

    // Prune old ingestion logs older than the last 100
    try {
      await db
        .prepare(`
          DELETE FROM ingestion_logs
          WHERE id NOT IN (
            SELECT id FROM ingestion_logs
            ORDER BY id DESC
            LIMIT 100
          )
        `)
        .run();
    } catch {
      // Ignored
    }

    return res?.meta?.changes ?? 0;
  } catch (err: any) {
    console.warn(`[Retention Prune Warning] ${err.message}`);
    return 0;
  }
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
