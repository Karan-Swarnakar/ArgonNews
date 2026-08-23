"""
Schema Normalization for ArgonNews Articles
===========================================
Ensures all ingested articles match the schema required by
analyzed_articles.json and frontend TypeScript contracts.
"""

from typing import Dict, Any, List
import re
import html


def normalize_title(title: str) -> str:
    """Cleans title by stripping date prefixes, publication tags, and excess punctuation."""
    if not title:
        return "Untitled AI Development"
    title = html.unescape(title)
    # Strip date prefixes like 'Jul 24, 2026 Product ' or '2026-08-22: '
    title = re.sub(r"^[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}\s+(Product|Research|Announcements|News)?\s*", "", title)
    title = re.sub(r"^\d{4}-\d{2}-\d{2}:?\s*", "", title)
    # Clean whitespace
    title = re.sub(r"\s+", " ", title).strip()
    return title


def normalize_article(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Standardizes a raw ingested article dictionary into canonical format."""
    title = normalize_title(raw.get("title", ""))
    url = raw.get("url", "").strip()
    source = raw.get("source", "Unknown Source").strip()
    source_type = raw.get("source_type", "journalism")
    reliability = float(raw.get("reliability", 1.0))
    content = raw.get("content", "").strip()
    published_at = raw.get("published_at", "")
    category = raw.get("category", "INDUSTRY").upper()

    # Map category to standard taxonomy
    valid_categories = {
        "RESEARCH", "MODEL", "INDUSTRY", "ETHICS",
        "HARDWARE", "POLICY", "OPEN_SOURCE", "TOOL"
    }
    if category not in valid_categories:
        if "MODEL" in category or "LLM" in category:
            category = "MODEL"
        elif "RESEARCH" in category or "ACADEMIC" in category or "PAPER" in category:
            category = "RESEARCH"
        elif "HARDWARE" in category or "GPU" in category or "CHIP" in category:
            category = "HARDWARE"
        elif "POLICY" in category or "SAFETY" in category or "SECURITY" in category or "GOV" in category:
            category = "POLICY"
        elif "ETHIC" in category or "ALIGNMENT" in category:
            category = "ETHICS"
        elif "OPEN" in category:
            category = "OPEN_SOURCE"
        else:
            category = "INDUSTRY"

    # Retain or initialize analysis block
    analysis = raw.get("analysis")
    if not isinstance(analysis, dict):
        analysis = {
            "summary": f"{title} reported by {source}.",
            "why_it_matters": "Key development in current artificial intelligence research and deployment.",
            "importance": 6,
            "category": category,
            "companies": [source] if source in {"Anthropic", "OpenAI", "Google DeepMind", "Meta AI", "Microsoft", "NVIDIA"} else [],
            "technologies": []
        }

    article_dict: Dict[str, Any] = {
        "title": title,
        "url": url,
        "source": source,
        "source_type": source_type,
        "reliability": reliability,
        "content": content,
        "category": category,
        "published_at": published_at,
        "analysis": analysis
    }

    # Optional metadata preserved if present
    if "authors" in raw and raw["authors"]:
        article_dict["authors"] = raw["authors"]
    if "arxiv_id" in raw and raw["arxiv_id"]:
        article_dict["arxiv_id"] = raw["arxiv_id"]
    if "other_sources" in raw and raw["other_sources"]:
        article_dict["other_sources"] = raw["other_sources"]

    return article_dict
