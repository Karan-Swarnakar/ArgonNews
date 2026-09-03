/**
 * ArgonNews - Cloudflare Worker Entry Point
 * Handles API requests, asset routing, and autonomous scheduled cron ingestion.
 */

import { Env, ScheduledEvent, ExecutionContext } from './types';
import { getArticlesFromD1, getLatestArticleInfo, getDbStats, batchInsertArticlesToD1 } from './db';
import { runIngestionPipeline } from './ingestion';
import { MOCK_ARTICLES } from '../data/mockArticles';
import { VERIFIED_TRANSACTIONS, INITIAL_TRANSACTION_DATASET, buildTransactionDataset } from '../data/mockTransactions';
import { extractTransactionFromArticle, mergeAndDeduplicateTransactions } from '../utils/transactionExtraction';
import { Article } from '../types';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

function jsonResponse(data: any, status: number = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

export default {
  /**
   * HTTP Request Handler
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const db = env.argonnews_db || env.DB;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // 1. GET /api/articles (or /articles) - Primary Feed API
    if (url.pathname === '/api/articles' || url.pathname === '/articles') {
      try {
        const category = url.searchParams.get('category') || undefined;
        const source = url.searchParams.get('source') || undefined;
        const rawSort = url.searchParams.get('sortBy') || url.searchParams.get('sort');
        const sortBy: 'newest' | 'importance-desc' =
          rawSort === 'impact' || rawSort === 'importance-desc' ? 'importance-desc' : 'newest';
        const search = url.searchParams.get('search') || url.searchParams.get('q') || undefined;
        const limit = parseInt(url.searchParams.get('limit') || '120', 10);
        const offset = parseInt(url.searchParams.get('offset') || '0', 10);
        const minImportance = parseInt(url.searchParams.get('minImportance') || '0', 10);
        const since = url.searchParams.get('since') || undefined;

        if (db) {
          const { articles, total } = await getArticlesFromD1(db, {
            category,
            source,
            sortBy,
            search,
            limit,
            offset,
            minImportance,
            since,
          });

          // If database is empty, auto-seed with verified baseline
          if (total === 0 && (!category || category === 'All') && !source) {
            ctx.waitUntil(batchInsertArticlesToD1(db, MOCK_ARTICLES));
            return jsonResponse(
              {
                articles: MOCK_ARTICLES.slice(offset, offset + limit),
                total: MOCK_ARTICLES.length,
                isLive: true,
                source: 'Cloudflare D1 (Auto-Seeded Baseline)',
                lastUpdated: new Date().toISOString(),
              },
              200,
              {
                'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300',
              }
            );
          }

          return jsonResponse(
            {
              articles,
              total,
              isLive: true,
              source: 'Cloudflare D1 Database (argonnews-db)',
              lastUpdated: new Date().toISOString(),
            },
            200,
            {
              'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300',
            }
          );
        }

        // Fallback if D1 binding is not yet attached
        return jsonResponse(
          {
            articles: MOCK_ARTICLES.slice(0, limit),
            total: MOCK_ARTICLES.length,
            isLive: false,
            source: 'Embedded Primary Catalog',
            lastUpdated: new Date().toISOString(),
          },
          200
        );
      } catch (err: any) {
        return jsonResponse(
          {
            error: err.message || 'Failed to query articles from D1',
            articles: MOCK_ARTICLES.slice(0, 100),
            total: MOCK_ARTICLES.length,
            isLive: false,
          },
          500
        );
      }
    }

    // 2. GET /api/latest-check - Lightweight non-disruptive polling endpoint
    if (url.pathname === '/api/latest-check') {
      try {
        const since = url.searchParams.get('since');
        if (db) {
          const info = await getLatestArticleInfo(db);
          let newArticlesCount = 0;

          if (since && info.latestPublishedAt) {
            const sinceDate = new Date(since).getTime();
            const latestDate = new Date(info.latestPublishedAt).getTime();
            if (latestDate > sinceDate) {
              const res = await db
                .prepare('SELECT COUNT(*) as c FROM articles WHERE published_at > ?')
                .bind(since)
                .first<{ c: number }>();
              newArticlesCount = res?.c ?? 1;
            }
          }

          return jsonResponse(
            {
              latestPublishedAt: info.latestPublishedAt,
              totalCount: info.count,
              hasNew: newArticlesCount > 0,
              newCount: newArticlesCount,
              checkedAt: new Date().toISOString(),
            },
            200,
            {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            }
          );
        }

        return jsonResponse(
          {
            latestPublishedAt: new Date().toISOString(),
            totalCount: MOCK_ARTICLES.length,
            hasNew: false,
            newCount: 0,
          },
          200,
          {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          }
        );
      } catch (err: any) {
        return jsonResponse({ error: err.message, hasNew: false }, 500);
      }
    }

    // 2b. GET /api/transactions - Real-time AI financial transactions & capital network
    if (url.pathname === '/api/transactions' || url.pathname === '/transactions') {
      try {
        let poolArticles: Article[] = MOCK_ARTICLES;
        if (db) {
          try {
            const { articles } = await getArticlesFromD1(db, { limit: 100, sortBy: 'newest' });
            if (articles && articles.length > 0) {
              poolArticles = articles;
            }
          } catch {
            // fallback to MOCK_ARTICLES
          }
        }

        const extracted = poolArticles
          .map(extractTransactionFromArticle)
          .filter((t): t is NonNullable<typeof t> => t !== null);

        const merged = mergeAndDeduplicateTransactions(VERIFIED_TRANSACTIONS, extracted);
        const dataset = buildTransactionDataset(merged);

        return jsonResponse(
          dataset,
          200,
          {
            'Cache-Control': 'public, max-age=60, s-maxage=180, stale-while-revalidate=300',
          }
        );
      } catch (err: any) {
        return jsonResponse(INITIAL_TRANSACTION_DATASET, 200);
      }
    }

    // 3. POST /api/ingest or GET /api/ingest - Manual/Webhook Ingestion Trigger
    if (url.pathname === '/api/ingest' || url.pathname === '/api/cron') {
      try {
        const authHeader = request.headers.get('Authorization');
        const cronSecret = env.CRON_SECRET;

        // Verify secret if configured
        if (cronSecret && authHeader !== `Bearer ${cronSecret}` && url.searchParams.get('key') !== cronSecret) {
          return jsonResponse({ error: 'Unauthorized. Invalid or missing CRON_SECRET key.' }, 401);
        }

        const specificSource = url.searchParams.get('source') || undefined;
        const result = await runIngestionPipeline(env, specificSource);

        return jsonResponse({
          message: 'Ingestion pipeline executed successfully',
          result,
        });
      } catch (err: any) {
        return jsonResponse({ error: err.message || 'Ingestion pipeline execution failed' }, 500);
      }
    }

    // 4. GET /api/status - Live System & Database Health
    if (url.pathname === '/api/status' || url.pathname === '/api/health') {
      try {
        let dbStats = null;
        if (db) {
          dbStats = await getDbStats(db);
        }

        return jsonResponse({
          status: 'ok',
          service: 'ArgonNews Autonomous Engine',
          version: '3.1.0',
          cronSchedule: '*/30 * * * * (Every 30 minutes)',
          d1Binding: env.argonnews_db ? 'argonnews_db' : env.DB ? 'DB' : 'none',
          database: dbStats || { connected: false, message: 'D1 binding not initialized' },
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        return jsonResponse({ status: 'error', message: err.message }, 500);
      }
    }

    // 5. POST /api/seed - Seed D1 with Verified Baseline
    if (url.pathname === '/api/seed') {
      try {
        if (!db) {
          return jsonResponse({ error: 'D1 database binding not found' }, 500);
        }
        const inserted = await batchInsertArticlesToD1(db, MOCK_ARTICLES);
        return jsonResponse({
          message: `Successfully seeded baseline archive into Cloudflare D1.`,
          inserted,
          totalBaseline: MOCK_ARTICLES.length,
        });
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // Default: Static Assets Router (SPA fallback)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('ArgonNews Worker is running. Frontend static assets building or not bound.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  },

  /**
   * Autonomous Cron Trigger Handler (Cloudflare Scheduled Event)
   * Runs every 30 minutes in production without user intervention.
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`[Cron Trigger] Autonomous ingestion triggered at ${new Date().toISOString()} (Cron: ${event?.cron || '*/30 * * * *'})`);
    const ingestionTask = (async () => {
      try {
        const result = await runIngestionPipeline(env);
        console.log(
          `[Cron Trigger] Pipeline finished: ${result.articlesInserted} new articles inserted, ${result.sourcesSucceeded}/${result.sourcesAttempted} sources succeeded.`
        );
        return result;
      } catch (err: any) {
        console.error(`[Cron Trigger Error] Pipeline encountered an error: ${err.message}`, err);
      }
    })();

    ctx.waitUntil(ingestionTask);
    await ingestionTask;
  },
};
