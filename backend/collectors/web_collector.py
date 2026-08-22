"""
Conservative Web Portal Collector for ArgonNews
===============================================
Extracts published articles and research posts from official first-party websites
that lack public RSS feeds (e.g. Anthropic News, Mistral AI, Cohere, AI21,
Stanford HAI, Allen Institute, The Batch).
"""

import re
import urllib.parse
from typing import Dict, Any, List
from backend.collectors.base import BaseCollector


class WebCollector(BaseCollector):
    """
    Conservative, polite first-party HTML page parser.
    Extracts high-signal announcements and links matching official publication routes.
    """

    ROUTE_FILTERS = {
        "anthropic": [r"/news/[a-z0-9\-]+", r"/research/[a-z0-9\-]+"],
        "mistral": [r"/news/[a-z0-9\-]+", r"/technology/[a-z0-9\-]+"],
        "cohere": [r"/blog/[a-z0-9\-]+", r"/research/[a-z0-9\-]+"],
        "ai21": [r"/blog/[a-z0-9\-]+", r"/research/[a-z0-9\-]+"],
        "allen": [r"/research", r"/news/[a-z0-9\-]+"],
        "stanford": [r"/news/[a-z0-9\-]+"],
        "deeplearning": [r"/the-batch/[a-z0-9\-]+"]
    }

    BLACKLIST_PATHS = {
        "/tag/", "/category/", "/author/", "/page/", "/contact", "/careers",
        "/about", "/privacy", "/terms", "/pricing", "/login", "/signup",
        "/search", "/courses", "/events", "facebook.com", "twitter.com", "x.com",
        "linkedin.com", "github.com", "mailto:", "bit.ly"
    }

    def collect(self, source_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        raw_bytes = self.fetch_url(source_config["url"])
        if not raw_bytes:
            return []

        html_text = raw_bytes.decode("utf-8", errors="replace")
        base_url = source_config["url"]
        source_name = source_config["name"]

        # Determine domain key for route filters
        domain_key = "general"
        for key in self.ROUTE_FILTERS:
            if key in base_url.lower():
                domain_key = key
                break

        patterns = self.ROUTE_FILTERS.get(domain_key, [r"/[a-z0-9\-]+/[a-z0-9\-]+"])

        # Extract all <a> anchor tags with their href and inner text
        link_matches = re.findall(
            r"<a\s+(?:[^>]*?\s+)?href=([\"\'])(.*?)\1[^>]*>(.*?)</a>",
            html_text,
            re.IGNORECASE | re.DOTALL
        )

        seen_urls = set()
        results: List[Dict[str, Any]] = []

        for quote, raw_href, raw_inner in link_matches:
            if not raw_href or any(bp in raw_href.lower() for bp in self.BLACKLIST_PATHS):
                continue

            full_url = self.canonicalize_url(urllib.parse.urljoin(base_url, raw_href))
            if full_url in seen_urls:
                continue

            url_path = urllib.parse.urlparse(full_url).path
            matches_pattern = any(re.search(pat, url_path, re.IGNORECASE) for pat in patterns)
            if not matches_pattern:
                continue

            clean_title = self.clean_html(raw_inner)
            clean_title = re.sub(r"^(Read more|Learn more|Read article|View post|Explore)\s*", "", clean_title, flags=re.IGNORECASE).strip()

            # Fallback title from slug if empty
            if len(clean_title) < 10:
                slug = url_path.rstrip("/").split("/")[-1]
                if len(slug) >= 6:
                    clean_title = slug.replace("-", " ").title()

            if len(clean_title) < 10 or len(clean_title) > 280:
                continue

            published_at = self.parse_datetime("")
            seen_urls.add(full_url)

            results.append({
                "title": clean_title,
                "url": full_url,
                "source": source_name,
                "source_type": source_config.get("source_type", "official"),
                "reliability": source_config.get("reliability", 1.0),
                "published_at": published_at,
                "content": f"{clean_title} - Official intelligence report from {source_name}.",
                "category": source_config.get("category", "MODEL"),
                "authors": []
            })

            # Cap at 8 recent articles per portal
            if len(results) >= 8:
                break

        return results
