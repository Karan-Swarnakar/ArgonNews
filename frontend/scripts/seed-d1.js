/**
 * ArgonNews - Cloudflare D1 Migration & Seeding Tool
 * Generates SQL statements to insert the normalized baseline corpus into Cloudflare D1.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const JSON_PATH = path.resolve(ROOT_DIR, 'public', 'articles.json');

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

async function main() {
  console.log('=== ArgonNews D1 Database Seed Script ===');

  if (!fs.existsSync(JSON_PATH)) {
    console.error(`Baseline dataset not found at ${JSON_PATH}`);
    process.exit(1);
  }

  const rawJson = fs.readFileSync(JSON_PATH, 'utf-8');
  let articles = [];
  try {
    articles = JSON.parse(rawJson);
  } catch (e) {
    console.error(`JSON parse error: ${e.message}`);
    process.exit(1);
  }

  console.log(`Loaded ${articles.length} verified articles for D1 migration.`);

  // Generate SQL batch insert
  const sqlStatements = [
    '-- Automated ArgonNews Baseline Corpus Seed',
    '-- Target: argonnews-db (7723d17b-701c-4095-8b99-2f4441ae7190)',
  ];

  const now = new Date().toISOString();

  for (const a of articles) {
    const id = a.id || `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const url = a.url;
    const title = a.title;
    const source = a.source;
    const sourceType = a.source_type || 'Lab / Research';
    const reliability = typeof a.reliability === 'number' ? a.reliability : 0.95;
    const category = a.category || 'Research';
    const publishedAt = a.published_at || now;
    const discoveredAt = now;
    const collectedAt = now;
    const content = a.content || '';
    const analysisJson = JSON.stringify(a.analysis || {});
    const summary = a.analysis?.summary || '';
    const whyItMatters = a.analysis?.why_it_matters || '';
    const importance = typeof a.analysis?.importance === 'number' ? a.analysis.importance : 5;
    const companies = JSON.stringify(a.analysis?.companies || []);
    const technologies = JSON.stringify(a.analysis?.technologies || []);
    const imageUrl = a.image_url || null;
    const imageSource = a.image_source || null;
    const imageLicense = a.image_license || null;
    const imageCredit = a.image_credit || null;
    const imageAlt = a.image_alt || null;
    const contentHash = url;
    const otherSources = JSON.stringify(a.other_sources || []);

    const sql = `INSERT OR IGNORE INTO articles (
      id, url, title, source, source_type, reliability, content, category,
      published_at, discovered_at, updated_at, collected_at, analysis, summary, why_it_matters,
      importance, companies, technologies, image_url, image_source, image_license,
      image_credit, image_alt, content_hash, other_sources
    ) VALUES (
      ${escapeSql(id)}, ${escapeSql(url)}, ${escapeSql(title)}, ${escapeSql(source)},
      ${escapeSql(sourceType)}, ${reliability}, ${escapeSql(content)}, ${escapeSql(category)},
      ${escapeSql(publishedAt)}, ${escapeSql(discoveredAt)}, ${escapeSql(now)}, ${escapeSql(collectedAt)},
      ${escapeSql(analysisJson)}, ${escapeSql(summary)}, ${escapeSql(whyItMatters)},
      ${importance}, ${escapeSql(companies)}, ${escapeSql(technologies)},
      ${escapeSql(imageUrl)}, ${escapeSql(imageSource)}, ${escapeSql(imageLicense)},
      ${escapeSql(imageCredit)}, ${escapeSql(imageAlt)}, ${escapeSql(contentHash)},
      ${escapeSql(otherSources)}
    );`;

    sqlStatements.push(sql);
  }

  const outputSqlPath = path.resolve(ROOT_DIR, 'migrations', 'seed.sql');
  fs.writeFileSync(outputSqlPath, sqlStatements.join('\n'), 'utf-8');
  console.log(`✓ Generated ${sqlStatements.length - 2} SQL insert statements in migrations/seed.sql`);
  console.log('\nTo apply the initial schema:');
  console.log('  npx wrangler d1 execute argonnews-db --remote --file=migrations/0001_initial_schema.sql');
  console.log('\nTo seed initial baseline data:');
  console.log('  npx wrangler d1 execute argonnews-db --remote --file=migrations/seed.sql');
}

main().catch(console.error);
