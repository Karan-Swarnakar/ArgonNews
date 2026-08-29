/**
 * ArgonNews - Cloudflare D1 Migration & Seeding Tool
 * Inserts the normalized baseline corpus into Cloudflare D1.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const MOCK_PATH = path.resolve(ROOT_DIR, 'src', 'data', 'mockArticles.ts');

function escapeSql(str) {
  if (!str) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

async function main() {
  console.log('=== ArgonNews D1 Database Seed Script ===');

  if (!fs.existsSync(MOCK_PATH)) {
    console.error(`Baseline dataset not found at ${MOCK_PATH}`);
    process.exit(1);
  }

  // Load articles from mockArticles.ts
  const mockContent = fs.readFileSync(MOCK_PATH, 'utf-8');
  const jsonMatch = mockContent.match(/export const MOCK_ARTICLES: Article\[\] = ([\s\S]*?);/);
  if (!jsonMatch) {
    console.error('Failed to parse MOCK_ARTICLES from mockArticles.ts');
    process.exit(1);
  }

  let articles = [];
  try {
    articles = JSON.parse(jsonMatch[1]);
  } catch (e) {
    console.error(`JSON parse error: ${e.message}`);
    process.exit(1);
  }

  console.log(`Loaded ${articles.length} verified articles for D1 migration.`);

  // Generate SQL batch insert
  const sqlStatements = [
    '-- Automated ArgonNews Baseline Corpus Seed',
  ];

  for (const a of articles) {
    const id = a.id || `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const url = a.url;
    const title = a.title;
    const source = a.source;
    const sourceType = a.source_type || 'Lab / Research';
    const reliability = a.reliability || 0.95;
    const category = a.category || 'Research';
    const publishedAt = a.published_at || new Date().toISOString();
    const collectedAt = new Date().toISOString();
    const content = a.content || '';
    const summary = a.analysis?.summary || '';
    const whyItMatters = a.analysis?.why_it_matters || '';
    const importance = a.analysis?.importance || 5;
    const companies = JSON.stringify(a.analysis?.companies || []);
    const technologies = JSON.stringify(a.analysis?.technologies || []);

    const sql = `INSERT OR IGNORE INTO articles (id, url, title, source, source_type, reliability, category, published_at, collected_at, content, summary, why_it_matters, importance, companies, technologies, content_hash) VALUES (${escapeSql(id)}, ${escapeSql(url)}, ${escapeSql(title)}, ${escapeSql(source)}, ${escapeSql(sourceType)}, ${reliability}, ${escapeSql(category)}, ${escapeSql(publishedAt)}, ${escapeSql(collectedAt)}, ${escapeSql(content)}, ${escapeSql(summary)}, ${escapeSql(whyItMatters)}, ${importance}, ${escapeSql(companies)}, ${escapeSql(technologies)}, ${escapeSql(url)});`;
    sqlStatements.push(sql);
  }

  const outputSqlPath = path.resolve(ROOT_DIR, 'migrations', 'seed.sql');
  fs.writeFileSync(outputSqlPath, sqlStatements.join('\n'), 'utf-8');
  console.log(`✓ Generated ${sqlStatements.length} SQL insert statements in migrations/seed.sql`);
  console.log('\nTo execute locally:');
  console.log('  npx wrangler d1 execute argonnews-db --local --file=migrations/seed.sql');
  console.log('\nTo execute in production:');
  console.log('  npx wrangler d1 execute argonnews-db --remote --file=migrations/seed.sql');
}

main().catch(console.error);
