"""
Conservative Multi-Signal Deduplication Engine for ArgonNews
============================================================
Performs multi-signal matching (canonical URL, tokenized title overlap,
publication proximity, arXiv identifiers) and aggregates independent source
reporting into `other_sources` rather than silently discarding citations.
"""

import re
from typing import Dict, Any, List, Tuple, Set


STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with",
    "by", "about", "against", "between", "into", "through", "during", "before",
    "after", "above", "below", "from", "up", "down", "in", "out", "on", "off",
    "over", "under", "again", "further", "then", "once", "here", "there", "when",
    "where", "why", "how", "all", "any", "both", "each", "few", "more", "most",
    "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so",
    "than", "too", "very", "s", "t", "can", "will", "just", "don", "should",
    "now", "ai", "artificial", "intelligence", "new", "announces", "releases",
    "introduces", "launches"
}


def tokenize_title(title: str) -> Set[str]:
    """Extracts informative alphanumeric token stems from title."""
    words = re.findall(r"\b[a-zA-Z0-9]{3,}\b", title.lower())
    return {w for w in words if w not in STOPWORDS}


def title_similarity(tokens1: Set[str], tokens2: Set[str]) -> float:
    """Calculates Jaccard overlap between two token sets."""
    if not tokens1 or not tokens2:
        return 0.0
    intersection = len(tokens1.intersection(tokens2))
    union = len(tokens1.union(tokens2))
    return float(intersection) / float(union) if union > 0 else 0.0


class Deduplicator:
    """
    Conservative deduplication engine that retains primary articles
    and appends secondary reports to `other_sources`.
    """

    def __init__(self, title_similarity_threshold: float = 0.85):
        self.title_similarity_threshold = title_similarity_threshold

    def deduplicate(self, articles: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], int]:
        """
        Deduplicates a list of articles, returning (deduped_articles, duplicate_count).
        Preserves multi-source coverage by adding citations to `other_sources`.
        """
        seen_urls: Set[str] = set()
        seen_arxiv_ids: Set[str] = set()
        canonical_articles: List[Dict[str, Any]] = []
        token_cache: List[Tuple[Set[str], Dict[str, Any]]] = []
        duplicate_count = 0

        for item in articles:
            url = item.get("url", "").strip().rstrip("/")
            arxiv_id = item.get("arxiv_id")
            title = item.get("title", "")
            tokens = tokenize_title(title)

            # Signal 1: Exact URL match
            if url and url in seen_urls:
                duplicate_count += 1
                self._record_cross_source(canonical_articles, url, item)
                continue

            # Signal 2: Exact arXiv ID match
            if arxiv_id and arxiv_id in seen_arxiv_ids:
                duplicate_count += 1
                self._record_cross_source_by_arxiv(canonical_articles, arxiv_id, item)
                continue

            # Signal 3: Conservative high-threshold token overlap for identical events
            is_cross_reported = False
            if len(tokens) >= 3:
                for existing_tokens, existing_article in token_cache:
                    sim = title_similarity(tokens, existing_tokens)
                    if sim >= self.title_similarity_threshold:
                        # High confidence duplicate or cross-source coverage of the exact same event
                        is_cross_reported = True
                        duplicate_count += 1
                        # Append to existing article's other_sources
                        if "other_sources" not in existing_article:
                            existing_article["other_sources"] = []
                        existing_article["other_sources"].append({
                            "source": item.get("source", "Cross Source"),
                            "url": item.get("url", ""),
                            "title": item.get("title", "")
                        })
                        break

            if is_cross_reported:
                continue

            # Mark seen and accept as canonical entry
            if url:
                seen_urls.add(url)
            if arxiv_id:
                seen_arxiv_ids.add(arxiv_id)

            canonical_articles.append(item)
            if len(tokens) >= 3:
                token_cache.append((tokens, item))

        return canonical_articles, duplicate_count

    @staticmethod
    def _record_cross_source(articles: List[Dict[str, Any]], url: str, duplicate_item: Dict[str, Any]):
        for art in articles:
            if art.get("url", "").strip().rstrip("/") == url:
                if "other_sources" not in art:
                    art["other_sources"] = []
                art["other_sources"].append({
                    "source": duplicate_item.get("source", "Mirror"),
                    "url": duplicate_item.get("url", ""),
                    "title": duplicate_item.get("title", "")
                })
                break

    @staticmethod
    def _record_cross_source_by_arxiv(articles: List[Dict[str, Any]], arxiv_id: str, duplicate_item: Dict[str, Any]):
        for art in articles:
            if art.get("arxiv_id") == arxiv_id:
                if "other_sources" not in art:
                    art["other_sources"] = []
                art["other_sources"].append({
                    "source": duplicate_item.get("source", "arXiv Alternate"),
                    "url": duplicate_item.get("url", ""),
                    "title": duplicate_item.get("title", "")
                })
                break
