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
