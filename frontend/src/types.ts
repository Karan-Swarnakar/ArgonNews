/**
 * Data structures matching ArgonNews articles.json schema
 * Contract established by the Python extraction, cleaning & Ollama/Qwen 2.5 analysis pipeline.
 */

export interface ArticleAnalysis {
  summary: string;
  why_it_matters: string;
  importance: number; // 1 to 10 scale
  category?: string;
  companies: string[];
  technologies: string[];
}

export interface Article {
  id?: string | number;
  title: string;
  url: string;
  source: string;
  source_type?: string;
  reliability?: number; // 0.0 to 1.0
  content?: string; // Raw scraped text (available on demand in dossier)
  category: string;
  published_at?: string; // ISO string or human readable date
  discovered_at?: string; // Ingestion discovery timestamp
  updated_at?: string; // Last metadata update timestamp
  analysis: ArticleAnalysis;
  image_url?: string;
  image_source?: string;
  image_license?: string;
  image_credit?: string;
  image_alt?: string;
  other_sources?: Array<{
    source: string;
    url: string;
    title: string;
  }>;
}

export type CategoryFilter =
  | 'All'
  | 'Today'
  | 'Research'
  | 'Models'
  | 'Open Source'
  | 'Business'
  | 'Safety & Policy'
  | 'Saved';

export type SortOption = 'newest' | 'importance-desc';

export type ViewMode = 'editorial' | 'dense' | 'magazine';

export interface FilterState {
  category: CategoryFilter;
  searchQuery: string;
  minImportance: number; // 0 (all), 7 (high), 8 (very high), 9 (critical)
  source: string; // 'all' or specific source
  selectedEntity?: string; // Filter by company / lab / technology
  sortBy: SortOption;
  viewMode: ViewMode;
}

export interface ApiStatus {
  isMock: boolean;
  connected: boolean;
  endpoint: string;
  lastChecked: Date | null;
  errorMessage: string | null;
  articleCount: number;
}

/**
 * AI Financial Ecosystem Transaction Model
 * Represents real, primary-sourced capital events (investments, M&A, infrastructure commitments).
 */
export type TransactionType =
  | 'Acquisition'
  | 'Strategic Investment'
  | 'Equity Round'
  | 'Infrastructure Commitment'
  | 'Debt Financing'
  | 'Licensing & Asset Deal';

export interface AITransaction {
  id: string;
  source_company: string; // e.g. "NVIDIA", "Microsoft", "Amazon / AWS"
  target_company: string; // e.g. "Hugging Face", "OpenAI", "Anthropic"
  transaction_type: TransactionType;
  amount: number | null; // numeric USD if disclosed, e.g. 12900000000
  amount_formatted: string; // e.g. "$12.9 billion" or "Financial value not publicly disclosed"
  currency: string; // "USD"
  amount_disclosed: boolean;
  announcement_date: string; // YYYY-MM-DD
  description: string;
  source_name: string; // e.g. "NVIDIA Press Release", "SEC 10-K", "TechCrunch AI"
  source_url: string;
  confidence: number; // 0.0 - 1.0
  created_at: string; // ISO string
  related_article_id?: string | number;
  related_article_url?: string;
  significance_score?: number; // Calculated rank (size, recency, confidence)
}

export interface AICompanyProfile {
  id: string;
  name: string;
  role: string; // e.g. "AI Hardware & Compute", "Frontier Foundation Models", "Hyperscale Cloud"
  tier: 'hyperscaler' | 'frontier-lab' | 'hardware' | 'open-source' | 'infrastructure';
  total_invested_usd: number;
  total_received_usd: number;
  transactions_count: number;
  key_developments: string[];
}

export interface TransactionDataset {
  transactions: AITransaction[];
  companies: AICompanyProfile[];
  last_updated: string;
  total_disclosed_volume_usd: number;
  version: string;
}

