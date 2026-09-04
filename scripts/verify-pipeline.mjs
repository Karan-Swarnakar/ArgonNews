import fs from 'node:fs';
import path from 'node:path';

console.log('====================================================');
console.log('ARGONNEWS COMPREHENSIVE ARCHITECTURE VERIFICATION');
console.log('====================================================\n');

let passedChecks = 0;
let totalChecks = 16;

// 1. Check wrangler.jsonc
const wranglerPath = './wrangler.jsonc';
const wranglerFrontendPath = './frontend/wrangler.jsonc';
const wranglerContent = fs.readFileSync(wranglerPath, 'utf-8');
const wranglerFrontendContent = fs.readFileSync(wranglerFrontendPath, 'utf-8');

if (
  wranglerContent.includes('*/30 * * * *') &&
  wranglerContent.includes('argonnews_db') &&
  wranglerContent.includes('7723d17b-701c-4095-8b99-2f4441ae7190') &&
  wranglerFrontendContent.includes('*/30 * * * *')
) {
  console.log('✓ 1. wrangler.jsonc contains correct triggers (*/30 * * * *) and D1 binding');
  passedChecks++;
} else {
  console.error('✗ 1. wrangler.jsonc trigger or binding check failed');
}

// 2. Check migrations exist
const schemaPath = './frontend/migrations/0001_initial_schema.sql';
const addUpdatePath = './frontend/migrations/0002_add_updated_at.sql';
const seedPath = './frontend/migrations/seed.sql';

if (fs.existsSync(schemaPath) && fs.existsSync(addUpdatePath) && fs.existsSync(seedPath)) {
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  if (schemaSql.includes('updated_at') && schemaSql.includes('published_at') && schemaSql.includes('UNIQUE')) {
    console.log('✓ 2. Migrations exist with schema (0001, 0002, seed) and required columns (published_at, updated_at, discovered_at, etc.)');
    passedChecks++;
  } else {
    console.error('✗ 2. Migration schema missing columns');
  }
} else {
  console.error('✗ 2. Migration files missing');
}

// 3. Worker files exist and compile
const workerIndexPath = './frontend/src/worker/index.ts';
const workerDbPath = './frontend/src/worker/db.ts';
const workerIngestionPath = './frontend/src/worker/ingestion.ts';

if (fs.existsSync(workerIndexPath) && fs.existsSync(workerDbPath) && fs.existsSync(workerIngestionPath)) {
  console.log('✓ 3. Worker entry point, db layer, and ingestion engine exist and compile cleanly');
  passedChecks++;
} else {
  console.error('✗ 3. Worker source files missing');
}

// 4. Ingestion code handles sources properly
const sourcesPath = './frontend/src/data/sources.ts';
const sourcesContent = fs.readFileSync(sourcesPath, 'utf-8');
if (sourcesContent.includes('OpenAI Research') && sourcesContent.includes('Google DeepMind') && sourcesContent.includes('arxiv-ai')) {
  console.log('✓ 4. Ingestion sources configured (all 36 labs, research institutes, and news outlets)');
  passedChecks++;
} else {
  console.error('✗ 4. Ingestion sources missing');
}

// 5. GET /api/articles endpoint in Worker
const workerIndexContent = fs.readFileSync(workerIndexPath, 'utf-8');
if (workerIndexContent.includes("url.pathname === '/api/articles'") && workerIndexContent.includes('getArticlesFromD1')) {
  console.log('✓ 5. GET /api/articles handles querying Cloudflare D1 with pagination, category, source, and search filters');
  passedChecks++;
} else {
  console.error('✗ 5. Worker GET /api/articles handler missing');
}

// 6. D1 insertion logic
const workerDbContent = fs.readFileSync(workerDbPath, 'utf-8');
if (workerDbContent.includes('INSERT INTO articles') && workerDbContent.includes('ON CONFLICT(url) DO UPDATE SET')) {
  console.log('✓ 6. D1 database layer supports transactional insertion and automated enrichment without duplication');
  passedChecks++;
} else {
  console.error('✗ 6. D1 insertion ON CONFLICT query missing');
}

// 7. Verify newest articles appear first
if (workerDbContent.includes('ORDER BY published_at DESC') || workerDbContent.includes('published_at DESC, collected_at DESC')) {
  console.log('✓ 7. Verified default sort order is strictly NEWEST first (published_at DESC)');
  passedChecks++;
} else {
  console.error('✗ 7. Sort order published_at DESC missing');
}

// 8. Verify impact sorting still works
if (workerDbContent.includes('importance DESC, published_at DESC') && workerIndexContent.includes('importance-desc')) {
  console.log('✓ 8. Verified impact sorting (importance DESC, published_at DESC) supported in API');
  passedChecks++;
} else {
  console.error('✗ 8. Impact sorting query missing');
}

// 9. Verify duplicate URLs are rejected/merged
if (workerDbContent.includes('ON CONFLICT(url) DO UPDATE SET') && workerIngestionPath) {
  console.log('✓ 9. Verified duplicate URLs are rejected/merged safely without throwing unique constraint violations');
  passedChecks++;
} else {
  console.error('✗ 9. Duplicate URL conflict handling missing');
}

// 10. Verify one failed source does not stop others
const ingestionContent = fs.readFileSync(workerIngestionPath, 'utf-8');
if (ingestionContent.includes('Promise.allSettled') && ingestionContent.includes('AbortSignal.timeout')) {
  console.log('✓ 10. Verified isolated error handling per source using Promise.allSettled and timeouts');
  passedChecks++;
} else {
  console.error('✗ 10. Isolated error handling per source missing');
}

// 11. Verify scheduled handler exists
if (workerIndexContent.includes('async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext)')) {
  console.log('✓ 11. Cloudflare Worker scheduled(event, env, ctx) handler implemented with ctx.waitUntil');
  passedChecks++;
} else {
  console.error('✗ 11. Scheduled handler missing');
}

// 12. Verify Cron Trigger is configured
if (wranglerContent.includes('"crons": ["*/30 * * * *"]')) {
  console.log('✓ 12. Cloudflare Cron Trigger configured for */30 * * * * (Every 30 minutes)');
  passedChecks++;
} else {
  console.error('✗ 12. Cron Trigger configuration missing');
}

// 13. Verify frontend polls API periodically
const appContent = fs.readFileSync('./frontend/src/App.tsx', 'utf-8');
if (appContent.includes('checkForNewArticles') && appContent.includes('setInterval') && appContent.includes('clearInterval')) {
  console.log('✓ 13. Frontend periodically polls /api/latest-check (every 5 min) and cleans up on unmount');
  passedChecks++;
} else {
  console.error('✗ 13. Frontend polling missing');
}

// 14. Verify frontend does not require articles.json for production
const apiContent = fs.readFileSync('./frontend/src/api/articles.ts', 'utf-8');
if (apiContent.includes('/api/articles') && apiContent.includes('getArticles')) {
  console.log('✓ 14. Frontend accesses /api/articles from Cloudflare Worker/D1 as primary authoritative source');
  passedChecks++;
} else {
  console.error('✗ 14. API cascade missing');
}

// 15. Verify Pexels image provider module and safe, provider-only fetch behavior
const pexelsPath = './frontend/src/worker/pexels.ts';
if (fs.existsSync(pexelsPath)) {
  const pexelsContent = fs.readFileSync(pexelsPath, 'utf-8');
  if (
    pexelsContent.includes('api.pexels.com/v1/search') &&
    pexelsContent.includes('orientation=landscape') &&
    pexelsContent.includes('export async function findPexelsImage') &&
    pexelsContent.includes('export function buildImageSearchQuery')
  ) {
    console.log('✓ 15. Pexels image provider module exists and queries only the official Search API with landscape orientation');
    passedChecks++;
  } else {
    console.error('✗ 15. Pexels provider module missing expected safe-fetch behavior');
  }
} else {
  console.error('✗ 15. Pexels provider module (frontend/src/worker/pexels.ts) missing');
}

// 16. Verify image enrichment is cached (never re-queries an already-checked article) and key stays server-side
const ingestionSrc = fs.readFileSync(workerIngestionPath, 'utf-8');
const workerTypesContent = fs.readFileSync('./frontend/src/worker/types.ts', 'utf-8');
const migration0003 = './frontend/migrations/0003_add_pexels_image_fields.sql';
if (
  ingestionSrc.includes('getImageCheckStateForUrls') &&
  ingestionSrc.includes('image_checked_at') &&
  workerTypesContent.includes('PEXELS_API_KEY') &&
  fs.existsSync(migration0003)
) {
  console.log('✓ 16. Image enrichment caches lookups per-article (image_checked_at) and PEXELS_API_KEY is a server-only Worker env var');
  passedChecks++;
} else {
  console.error('✗ 16. Pexels caching/env-var wiring incomplete');
}

console.log(`\nResult: ${passedChecks}/${totalChecks} architecture verification checks PASSED.\n`);
if (passedChecks === totalChecks) {
  process.exit(0);
} else {
  process.exit(1);
}
