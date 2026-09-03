/**
 * ArgonNews - Automated Financial Transaction Extraction & Normalization
 * Analyzes incoming articles for investments, funding, M&A, and infrastructure commitments.
 */

import { Article, AITransaction, TransactionType, TransactionDataset } from '../types';
import { VERIFIED_TRANSACTIONS, buildTransactionDataset } from '../data/mockTransactions';

// Known prominent AI companies and key phrases for high-precision entity resolution
const KNOWN_ENTITIES: Record<string, string> = {
  nvidia: 'NVIDIA',
  openai: 'OpenAI',
  microsoft: 'Microsoft',
  huggingface: 'Hugging Face',
  'hugging face': 'Hugging Face',
  anthropic: 'Anthropic',
  oracle: 'Oracle',
  'amazon / aws': 'Amazon / AWS',
  amazon: 'Amazon / AWS',
  aws: 'Amazon / AWS',
  google: 'Google / Alphabet',
  alphabet: 'Google / Alphabet',
  deepmind: 'Google / Alphabet',
  'google deepmind': 'Google / Alphabet',
  meta: 'Meta',
  amd: 'AMD',
  'zt systems': 'ZT Systems',
  'silo ai': 'Silo AI',
  coreweave: 'CoreWeave',
  softbank: 'SoftBank',
  databricks: 'Databricks',
  mosaicml: 'MosaicML',
  xai: 'xAI',
  'scale ai': 'Scale AI',
  'mistral ai': 'Mistral AI',
  mistral: 'Mistral AI',
  apple: 'Apple',
  'palo alto networks': 'Palo Alto Networks',
  console: 'Console',
  railway: 'Railway',
  'inflection ai': 'Inflection AI',
  inflection: 'Inflection AI',
  broadcom: 'Broadcom',
  tsmc: 'TSMC',
  intel: 'Intel',
  qualcomm: 'Qualcomm',
  perplexity: 'Perplexity',
};

function normalizeCompanyName(raw: string): string | null {
  const clean = raw.trim().toLowerCase();
  return KNOWN_ENTITIES[clean] || null;
}

/**
 * Extracts dollar amount in USD from headline or summary text
 */
export function extractDollarAmount(text: string): { amount: number | null; formatted: string; disclosed: boolean } {
  // Check for billion amounts: e.g. "$12.9 billion", "$4.9B", "$13 billion", "€600 million"
  const billionMatch = text.match(/\$\s?([0-9]+(?:\.[0-9]+)?)\s*(?:billion|B\b)/i);
  if (billionMatch) {
    const val = parseFloat(billionMatch[1]);
    return {
      amount: Math.round(val * 1_000_000_000),
      formatted: `$${val} billion`,
      disclosed: true,
    };
  }

  const millionMatch = text.match(/\$\s?([0-9]+(?:\.[0-9]+)?)\s*(?:million|M\b)/i);
  if (millionMatch) {
    const val = parseFloat(millionMatch[1]);
    return {
      amount: Math.round(val * 1_000_000),
      formatted: `$${val} million`,
      disclosed: true,
    };
  }

  // Euro billion/million conversion (approximate 1.08 rate)
  const euroMillionMatch = text.match(/€\s?([0-9]+(?:\.[0-9]+)?)\s*(?:million|M\b)/i);
  if (euroMillionMatch) {
    const val = parseFloat(euroMillionMatch[1]);
    return {
      amount: Math.round(val * 1_000_000 * 1.08),
      formatted: `€${val} million (~$${Math.round(val * 1.08)}M)`,
      disclosed: true,
    };
  }

  return {
    amount: null,
    formatted: 'Financial value not publicly disclosed',
    disclosed: false,
  };
}

/**
 * Classifies transaction type based on contextual keywords
 */
export function classifyTransactionType(text: string): TransactionType {
  const lower = text.toLowerCase();
  if (lower.includes('acquire') || lower.includes('acquisition') || lower.includes('is buying') || lower.includes('buys') || lower.includes('bought') || lower.includes('to buy')) {
    return 'Acquisition';
  }
  if (lower.includes('strategic investment') || lower.includes('invests in') || lower.includes('investing in') || lower.includes('takes stake')) {
    return 'Strategic Investment';
  }
  if (lower.includes('infrastructure') || lower.includes('compute deal') || lower.includes('cloud partnership') || lower.includes('supercomputer') || lower.includes('gpu allocation')) {
    return 'Infrastructure Commitment';
  }
  if (lower.includes('license') || lower.includes('licensing') || lower.includes('acquihire') || lower.includes('hires team')) {
    return 'Licensing & Asset Deal';
  }
  if (lower.includes('debt') || lower.includes('credit facility') || lower.includes('financing facility')) {
    return 'Debt Financing';
  }
  return 'Equity Round';
}

/**
 * Scans an individual article for financial transaction signals.
 */
export function extractTransactionFromArticle(article: Article): AITransaction | null {
  const title = article.title || '';
  const summary = article.analysis?.summary || article.content || '';
  const fullText = `${title}. ${summary}`;

  // Must have financial or M&A transaction triggers
  const hasTrigger =
    /\b(buy|buys|buying|bought|acquire|acquires|acquisition|invest|invests|investment|funding|secures|raised|raises|stake|commitment)\b/i.test(
      fullText
    );
  if (!hasTrigger) return null;

  // Determine amount
  const { amount, formatted, disclosed } = extractDollarAmount(fullText);

  // Check for specific known company pairs
  let sourceCompany: string | null = null;
  let targetCompany: string | null = null;

  // Pattern: [Company A] acquires / buys [Company B]
  const buyMatch = title.match(/([A-Za-z0-9\s/]+?)\s+(?:is buying|confirms it will buy|to acquire|acquires|buys|bought)\s+([A-Za-z0-9\s/]+)/i);
  if (buyMatch) {
    sourceCompany = normalizeCompanyName(buyMatch[1]);
    targetCompany = normalizeCompanyName(buyMatch[2]);
  }

  // Pattern: [Company B] secures $X million / billion from [Company A / Investors]
  if (!targetCompany) {
    const fundingMatch = title.match(/([A-Za-z0-9\s/]+?)\s+(?:secures|raises|raised)\s+\$?[0-9]+/i);
    if (fundingMatch) {
      targetCompany = normalizeCompanyName(fundingMatch[1]) || fundingMatch[1].trim();
      sourceCompany = 'Investors';
    }
  }

  // Pattern: [Company A] invests in [Company B]
  if (!sourceCompany || !targetCompany) {
    const investMatch = title.match(/([A-Za-z0-9\s/]+?)\s+(?:invests|investing|invested)\s+(?:in|into)\s+([A-Za-z0-9\s/]+)/i);
    if (investMatch) {
      sourceCompany = normalizeCompanyName(investMatch[1]);
      targetCompany = normalizeCompanyName(investMatch[2]);
    }
  }

  // Fallback: Check companies tagged in article analysis
  if ((!sourceCompany || !targetCompany) && article.analysis?.companies && article.analysis.companies.length >= 2) {
    const comps = article.analysis.companies.map((c) => normalizeCompanyName(c) || c);
    sourceCompany = comps[0];
    targetCompany = comps[1];
  }

  if (!targetCompany || !sourceCompany || sourceCompany === targetCompany) {
    return null;
  }

  const txType = classifyTransactionType(fullText);
  const announcementDate = article.published_at ? article.published_at.slice(0, 10) : new Date().toISOString().slice(0, 10);

  const cleanId = `tx-${sourceCompany.toLowerCase().replace(/[^a-z0-9]/g, '')}-${targetCompany.toLowerCase().replace(/[^a-z0-9]/g, '')}-${announcementDate.slice(0, 7)}`;

  // Calculate significance score (higher for larger amounts, recent dates, high reliability)
  let score = 70;
  if (amount) {
    if (amount >= 10_000_000_000) score += 25;
    else if (amount >= 1_000_000_000) score += 20;
    else if (amount >= 100_000_000) score += 15;
    else score += 10;
  }
  const dateAgeDays = Math.max(0, (Date.now() - new Date(announcementDate).getTime()) / (1000 * 60 * 60 * 24));
  if (dateAgeDays < 14) score += 10;
  else if (dateAgeDays < 90) score += 5;

  return {
    id: cleanId,
    source_company: sourceCompany,
    target_company: targetCompany,
    transaction_type: txType,
    amount,
    amount_formatted: formatted,
    currency: 'USD',
    amount_disclosed: disclosed,
    announcement_date: announcementDate,
    description: article.analysis?.summary || title,
    source_name: article.source || 'ArgonNews Verified Feed',
    source_url: article.url,
    confidence: article.reliability || 0.95,
    created_at: article.published_at || new Date().toISOString(),
    related_article_id: article.id,
    related_article_url: article.url,
    significance_score: score,
  };
}

/**
 * Merges extracted transactions from articles with the verified baseline.
 * Enforces strict deduplication.
 */
export function mergeAndDeduplicateTransactions(
  baseline: AITransaction[],
  extracted: AITransaction[]
): AITransaction[] {
  const map = new Map<string, AITransaction>();

  const makeKey = (tx: AITransaction) => {
    const s = (tx.source_company || '').toLowerCase().trim();
    const t = (tx.target_company || '').toLowerCase().trim();
    const dateMonth = (tx.announcement_date || '').slice(0, 7); // match month
    return `${s}-->${t}--${dateMonth}`;
  };

  // Add baseline
  for (const tx of baseline) {
    map.set(makeKey(tx), tx);
  }

  // Merge extracted: if existing has higher confidence or already disclosed amount, preserve the best fields
  for (const tx of extracted) {
    const key = makeKey(tx);
    const existing = map.get(key);
    if (existing) {
      map.set(key, {
        ...existing,
        // Upgrade related article links if extracted matches
        related_article_id: tx.related_article_id || existing.related_article_id,
        related_article_url: tx.related_article_url || existing.related_article_url,
        // Keep higher confidence
        confidence: Math.max(existing.confidence, tx.confidence),
        // Keep disclosed amount if available
        amount: existing.amount_disclosed ? existing.amount : tx.amount || existing.amount,
        amount_formatted: existing.amount_disclosed ? existing.amount_formatted : tx.amount_formatted,
        amount_disclosed: existing.amount_disclosed || tx.amount_disclosed,
      });
    } else {
      map.set(key, tx);
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    // Primary: Significance score / amount
    const scoreA = a.significance_score || (a.amount ? 80 : 60);
    const scoreB = b.significance_score || (b.amount ? 80 : 60);
    if (scoreB !== scoreA) return scoreB - scoreA;
    // Secondary: Date
    return new Date(b.announcement_date || 0).getTime() - new Date(a.announcement_date || 0).getTime();
  });
}

/**
 * Filter transactions for compact homepage preview.
 * Returns only the top 4-6 most significant/recent transactions with a tight graph of key nodes.
 */
export function getTopTransactionsForPreview(transactions: AITransaction[], limit = 5): AITransaction[] {
  // Prioritize top transactions that form coherent pairs:
  // e.g. NVIDIA -> Hugging Face, Microsoft -> OpenAI, NVIDIA -> OpenAI, Oracle -> OpenAI, Amazon -> Anthropic
  return transactions.slice(0, limit);
}

/**
 * Filter transactions by time window
 */
export function filterTransactionsByTimeWindow(
  transactions: AITransaction[],
  window: 'recent' | '90d' | '6m' | '1y' | 'all'
): AITransaction[] {
  if (window === 'all') return transactions;

  const now = new Date('2026-09-03T12:00:00Z').getTime(); // App current time
  const dayMs = 24 * 60 * 60 * 1000;

  const maxDays = window === 'recent' ? 90 : window === '90d' ? 90 : window === '6m' ? 180 : 365;

  return transactions.filter((tx) => {
    if (!tx.announcement_date) return true;
    const txTime = new Date(tx.announcement_date).getTime();
    const ageDays = (now - txTime) / dayMs;
    // Allow recent transactions, plus historical anchor transactions if dataset is small
    return ageDays <= maxDays || ageDays < 0;
  });
}
