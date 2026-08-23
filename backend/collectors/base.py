"""
Base Collector Interface & HTTP Client Utilities
=================================================
Provides unified HTTP fetching, 308/301/302 redirect resolution,
HTML cleaning, date parsing, and canonical URL normalization.
"""

import re
import ssl
import time
import email.utils
from datetime import datetime, timezone
import urllib.request
import urllib.parse
from typing import Dict, Any, List, Optional
import html


class SmartRedirectHandler(urllib.request.HTTPRedirectHandler):
    """
    Handles HTTP 308, 307, 301, 302 redirects with full path joining.
    """
    def http_error_308(self, req, fp, code, msg, headers):
        new_url = headers.get("Location")
        if new_url:
            full_url = urllib.parse.urljoin(req.full_url, new_url)
            new_req = urllib.request.Request(full_url, headers=dict(req.header_items()))
            return self.parent.open(new_req)
        return super().http_error_302(req, fp, code, msg, headers)

    def http_error_307(self, req, fp, code, msg, headers):
        return self.http_error_308(req, fp, code, msg, headers)


class BaseCollector:
    """
    Abstract base collector offering resilient networking, text extraction,
    and standardized schema emission.
    """

    USER_AGENT = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36 (ArgonNews AI Intelligence Bot/1.0)"
    )

    def __init__(self, timeout: int = 8):
        self.timeout = timeout
        self.ctx = ssl.create_default_context()
        self.ctx.check_hostname = False
        self.ctx.verify_mode = ssl.CERT_NONE

        self.opener = urllib.request.build_opener(
            SmartRedirectHandler,
            urllib.request.HTTPSHandler(context=self.ctx)
        )

    def fetch_url(self, url: str) -> Optional[bytes]:
        """Fetches raw bytes from a URL with timeout and error protection."""
        headers = {
            "User-Agent": self.USER_AGENT,
            "Accept": (
                "application/rss+xml, application/atom+xml, application/xml, "
                "text/xml, text/html, application/json, */*;q=0.9"
            ),
            "Accept-Language": "en-US,en;q=0.9"
        }
        req = urllib.request.Request(url, headers=headers)
        try:
            with self.opener.open(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    return resp.read()
                return None
        except Exception as e:
            raise RuntimeError(f"HTTP fetch failed for '{url}': {e}")

    @staticmethod
    def clean_html(text: str) -> str:
        """Strips HTML tags and unescapes HTML entities into clean plaintext."""
        if not text:
            return ""
        # Unescape entities first or replace script/style
        text = re.sub(r"<(script|style).*?>.*?</\1>", "", text, flags=re.DOTALL | re.IGNORECASE)
        # Strip all HTML tags
        text = re.sub(r"<[^>]+>", " ", text)
        # Unescape HTML entities (&amp;, &nbsp;, &#8217;, etc.)
        text = html.unescape(text)
        # Collapse whitespace
        text = re.sub(r"\s+", " ", text).strip()
        return text

    @staticmethod
    def canonicalize_url(url: str) -> str:
        """Removes tracking query parameters and fragments to produce canonical URL."""
        if not url:
            return ""
        parsed = urllib.parse.urlparse(url)
        # Filter out common tracking query params
        tracking_params = {
            "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
            "fbclid", "gclid", "ref", "source", "feed", "rss"
        }
        queries = urllib.parse.parse_qsl(parsed.query)
        clean_queries = [(k, v) for k, v in queries if k.lower() not in tracking_params]
        new_query = urllib.parse.urlencode(clean_queries)

        clean_url = urllib.parse.urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path.rstrip("/") if parsed.path != "/" else "/",
            "",
            new_query,
            ""
        ))
        return clean_url

    @staticmethod
    def parse_datetime(date_str: str) -> str:
        """Normalizes diverse date formats (RFC 2822, ISO 8601, etc.) to ISO 8601."""
        if not date_str:
            return datetime.now(timezone.utc).isoformat()

        date_str = date_str.strip()

        # 1. Try RFC 2822 (standard RSS: 'Fri, 22 Aug 2026 14:00:00 GMT')
        try:
            parsed_tuple = email.utils.parsedate_tz(date_str)
            if parsed_tuple:
                dt_timestamp = email.utils.mktime_tz(parsed_tuple)
                return datetime.fromtimestamp(dt_timestamp, tz=timezone.utc).isoformat()
        except Exception:
            pass

        # 2. Try ISO formats ('2026-08-22T14:00:00Z', '2026-08-22T14:00:00+00:00')
        iso_formats = [
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%dT%H:%M:%S%z",
            "%Y-%m-%dT%H:%M:%S.%fZ",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d"
        ]
        for fmt in iso_formats:
            try:
                dt = datetime.strptime(date_str, fmt)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt.isoformat()
            except Exception:
                continue

        # Fallback to current UTC
        return datetime.now(timezone.utc).isoformat()

    def collect(self, source_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Must be implemented by subclasses."""
        raise NotImplementedError
