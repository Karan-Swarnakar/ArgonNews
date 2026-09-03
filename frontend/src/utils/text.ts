/**
 * Text processing, entity extraction, and robust HTML entity decoding.
 */

// Mapping of common and special HTML entities
const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
  '&mdash;': '—',
  '&#8212;': '—',
  '&ndash;': '–',
  '&#8211;': '–',
  '&hellip;': '…',
  '&#8230;': '…',
  '&lsquo;': '‘',
  '&#8216;': '‘',
  '&rsquo;': '’',
  '&#8217;': '’',
  '&ldquo;': '“',
  '&#8220;': '“',
  '&rdquo;': '”',
  '&#8221;': '”',
  '&bull;': '•',
  '&#8226;': '•',
  '&euro;': '€',
  '&#8364;': '€',
  '&pound;': '£',
  '&#163;': '£',
  '&yen;': '¥',
  '&#165;': '¥',
  '&sect;': '§',
  '&#167;': '§',
  '&cent;': '¢',
  '&#162;': '¢',
  '&laquo;': '«',
  '&#171;': '«',
  '&raquo;': '»',
  '&#187;': '»',
};

/**
 * Fully decodes all HTML entities (named, decimal &#123;, and hex &#x1F;)
 * and strips HTML tags/CDATA cleanly.
 */
export function decodeHtmlEntities(raw?: string | null): string {
  if (!raw) return '';
  let str = String(raw);

  // 1. Unwrap CDATA blocks
  str = str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');

  // 2. Remove script and style tags and contents
  str = str.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  str = str.replace(/<style[\s\S]*?<\/style>/gi, ' ');

  // 3. Strip general HTML tags
  str = str.replace(/<[^>]+>/g, ' ');

  // 4. Decode named entities
  for (const [entity, replacement] of Object.entries(HTML_ENTITIES)) {
    str = str.split(entity).join(replacement);
  }

  // 5. Decode decimal numeric entities like &#8217; or &#39;
  str = str.replace(/&#(\d+);/g, (_, dec) => {
    try {
      const code = parseInt(dec, 10);
      return String.fromCharCode(code);
    } catch {
      return _;
    }
  });

  // 6. Decode hex numeric entities like &#x2019;
  str = str.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    try {
      const code = parseInt(hex, 16);
      return String.fromCharCode(code);
    } catch {
      return _;
    }
  });

  // 7. Normalize multiple whitespaces
  return str.replace(/\s+/g, ' ').trim();
}

// Known timezone abbreviations mapped to standard numeric offsets (+HHMM / -HHMM)
const TIMEZONE_OFFSETS: Record<string, string> = {
  EDT: '-0400',
  EST: '-0500',
  CDT: '-0500',
  CST: '-0600',
  MDT: '-0600',
  MST: '-0700',
  PDT: '-0700',
  PST: '-0800',
  AKDT: '-0800',
  AKST: '-0900',
  HST: '-1000',
  BST: '+0100',
  CET: '+0100',
  CEST: '+0200',
  EET: '+0200',
  EEST: '+0300',
  MSK: '+0300',
  IST: '+0530',
  JST: '+0900',
  KST: '+0900',
  AEST: '+1000',
  AEDT: '+1100',
  NZST: '+1200',
  NZDT: '+1300',
  UTC: '+0000',
  GMT: '+0000',
  Z: '+0000',
};

/**
 * Robust ISO Date normalizer.
 * Correctly parses RSS pubDate, Atom published/updated, ISO-8601, RFC 822 / 2822,
 * and common timezone formats into a UTC ISO-8601 string (e.g. 2026-09-03T12:00:00.000Z).
 * Returns undefined if no valid publication date can be verified (avoiding fake dates).
 */
export function normalizeDate(rawDate?: string | null): string | undefined {
  if (!rawDate) return undefined;
  let clean = String(rawDate).trim();
  if (!clean) return undefined;

  // 1. Unwrap CDATA and decode HTML entities if present
  clean = clean.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
  clean = decodeHtmlEntities(clean);

  // 2. Replace textual timezone abbreviations with numeric offsets for consistent V8 parsing
  for (const [tz, offset] of Object.entries(TIMEZONE_OFFSETS)) {
    const tzRegex = new RegExp(`\\b${tz}\\b`, 'g');
    if (tzRegex.test(clean)) {
      clean = clean.replace(tzRegex, offset);
      break;
    }
  }

  // 3. Try standard Date.parse
  let timestamp = Date.parse(clean);

  // 4. Fallback: Check if it's format "YYYY-MM-DD HH:mm:ss" without T
  if (isNaN(timestamp)) {
    const matchYMD = clean.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-]\d{2}:?\d{2}))?$/);
    if (matchYMD) {
      const isoCandidate = `${matchYMD[1]}-${matchYMD[2]}-${matchYMD[3]}T${matchYMD[4]}:${matchYMD[5]}:${matchYMD[6]}${matchYMD[7] || 'Z'}`;
      timestamp = Date.parse(isoCandidate);
    }
  }

  // 5. Fallback: Pure date "YYYY-MM-DD"
  if (isNaN(timestamp)) {
    const matchDateOnly = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (matchDateOnly) {
      timestamp = Date.parse(`${clean}T00:00:00Z`);
    }
  }

  if (isNaN(timestamp)) {
    return undefined;
  }

  const d = new Date(timestamp);
  const timeMs = d.getTime();

  // Validate bounds: Must be a plausible modern date (e.g. >= 2018) and not > 2 days in the future
  const maxFuture = Date.now() + 2 * 24 * 60 * 60 * 1000;
  const minPast = new Date('2018-01-01T00:00:00Z').getTime();

  if (timeMs < minPast || timeMs > maxFuture) {
    return undefined;
  }

  return d.toISOString();
}

/**
 * Creates a clean unique content hash/slug for deduplication.
 */
export function generateArticleSlug(sourceId: string, url: string, title: string): string {
  const cleanUrl = url.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
  
  // Simple deterministic hash
  let hash = 0;
  for (let i = 0; i < cleanUrl.length; i++) {
    hash = (hash << 5) - hash + cleanUrl.charCodeAt(i);
    hash |= 0;
  }
  const hexHash = Math.abs(hash).toString(16);
  return `art-${sourceId.toLowerCase().replace(/[^a-z0-9]/g, '')}-${cleanTitle.slice(0, 24)}-${hexHash}`;
}

/**
 * List of recognized AI/ML Labs and Organizations
 */
export const KNOWN_ENTITIES: string[] = [
  'OpenAI',
  'Anthropic',
  'Google',
  'Google DeepMind',
  'DeepMind',
  'Meta',
  'Meta AI',
  'Microsoft',
  'NVIDIA',
  'Hugging Face',
  'Mistral',
  'Mistral AI',
  'xAI',
  'Cohere',
  'Amazon',
  'AWS',
  'Apple',
  'IBM',
  'Salesforce',
  'Stability AI',
  'Perplexity',
  'DeepSeek',
  'Alibaba',
  'Qwen',
  'AI21 Labs',
  'Databricks',
  'Together AI',
  'Allen Institute for AI',
  'EleutherAI',
  'Berkeley',
  'Stanford',
  'MIT',
  'Cornell',
  'Cerebras',
  'Groq',
  'Scale AI',
];

/**
 * List of recognized AI/ML Technologies and Paradigms
 */
export const KNOWN_TECHS: string[] = [
  'Reasoning Models',
  'Mixture-of-Experts (MoE)',
  'Reinforcement Learning',
  'RLHF',
  'GRPO',
  'Transformers',
  'Diffusion Models',
  'Vision-Language',
  'Multimodal AI',
  'Autonomous Agents',
  'RAG',
  'GraphRAG',
  'Inference Acceleration',
  'CUDA',
  'Blackwell',
  'TensorRT-LLM',
  'Synthetic Data',
  'Mechanistic Interpretability',
  'AI Safety',
  'Small Language Models (SLM)',
  'Chain-of-Thought',
  'Post-Training',
  'Fine-Tuning',
  'Edge AI',
  'On-Device AI',
  'Speech Recognition',
  'Code Generation',
  'Math Verification',
  'Liquid Neural Networks',
  'Silicon Accelerators',
];

/**
 * Extracts recognized companies and technologies from text
 */
export function extractEntities(text: string): { companies: string[]; technologies: string[] } {
  const companies: string[] = [];
  const technologies: string[] = [];
  const lower = text.toLowerCase();

  for (const c of KNOWN_ENTITIES) {
    if (lower.includes(c.toLowerCase()) && !companies.includes(c)) {
      companies.push(c);
    }
  }

  for (const t of KNOWN_TECHS) {
    if (lower.includes(t.toLowerCase()) && !technologies.includes(t)) {
      technologies.push(t);
    }
  }

  return {
    companies: companies.slice(0, 4),
    technologies: technologies.slice(0, 4),
  };
}

/**
 * Categorizes article based on title, summary, and default category
 */
export function categorizeArticle(
  title: string,
  content: string,
  defaultCategory: string = 'Research'
): 'Research' | 'Models' | 'Open Source' | 'Business' | 'Safety & Policy' {
  const t = `${title} ${content}`.toLowerCase();

  if (
    t.includes('safety') ||
    t.includes('alignment') ||
    t.includes('policy') ||
    t.includes('governance') ||
    t.includes('regulation') ||
    t.includes('ethics') ||
    t.includes('red team') ||
    t.includes('jailbreak') ||
    t.includes('copyright')
  ) {
    return 'Safety & Policy';
  }

  if (
    t.includes('open source') ||
    t.includes('open-source') ||
    t.includes('open weights') ||
    t.includes('github') ||
    t.includes('repository') ||
    t.includes('hugging face') ||
    t.includes('community') ||
    t.includes('ollama')
  ) {
    return 'Open Source';
  }

  if (
    t.includes('chip') ||
    t.includes('datacenter') ||
    t.includes('hardware') ||
    t.includes('nvidia') ||
    t.includes('gpu') ||
    t.includes('revenue') ||
    t.includes('enterprise') ||
    t.includes('commercial') ||
    t.includes('market') ||
    t.includes('cloud') ||
    t.includes('acquisition') ||
    t.includes('funding') ||
    t.includes('venture')
  ) {
    return 'Business';
  }

  if (
    t.includes('model') ||
    t.includes('weights') ||
    t.includes('llm') ||
    t.includes('sonnet') ||
    t.includes('grok') ||
    t.includes('claude') ||
    t.includes('gemini') ||
    t.includes('gpt') ||
    t.includes('deepseek-r1') ||
    t.includes('agent') ||
    t.includes('reasoning')
  ) {
    return 'Models';
  }

  if (
    t.includes('paper') ||
    t.includes('arxiv') ||
    t.includes('research') ||
    t.includes('benchmark') ||
    t.includes('algorithm') ||
    t.includes('theorem') ||
    t.includes('study')
  ) {
    return 'Research';
  }

  if (
    defaultCategory === 'Research' ||
    defaultCategory === 'Models' ||
    defaultCategory === 'Open Source' ||
    defaultCategory === 'Business' ||
    defaultCategory === 'Safety & Policy'
  ) {
    return defaultCategory;
  }

  return 'Research';
}

/**
 * Computes heuristic editorial importance score (1 to 10)
 */
export function computeImportance(title: string, summary: string, sourceReliability: number = 0.95): number {
  let score = sourceReliability > 0.97 ? 8 : 7;
  const t = `${title} ${summary}`.toLowerCase();

  if (
    t.includes('breakthrough') ||
    t.includes('frontier') ||
    t.includes('state of the art') ||
    t.includes('sota') ||
    t.includes('reasoning') ||
    t.includes('deepseek-r1') ||
    t.includes('claude 3.7') ||
    t.includes('gpt-5') ||
    t.includes('gemini 2') ||
    t.includes('o3') ||
    t.includes('o1')
  ) {
    score += 2;
  }

  if (
    t.includes('open source') ||
    t.includes('weights released') ||
    t.includes('grpo') ||
    t.includes('blackwell') ||
    t.includes('reinforcement learning')
  ) {
    score += 1;
  }

  if (
    t.includes('quarterly') ||
    t.includes('podcast') ||
    t.includes('digest') ||
    t.includes('webinar') ||
    t.includes('roundup')
  ) {
    score -= 2;
  }

  return Math.max(1, Math.min(10, Math.round(score)));
}
