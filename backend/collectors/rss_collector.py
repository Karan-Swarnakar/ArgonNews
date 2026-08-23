"""
RSS / Atom XML Feed Collector for ArgonNews
==========================================
Parses RSS 2.0 and Atom feeds with namespace-agnostic resolution,
fallback date handling, and HTML content cleaning.
"""

import xml.etree.ElementTree as ET
from typing import Dict, Any, List, Optional
from backend.collectors.base import BaseCollector


def get_child(elem: ET.Element, name: str) -> Optional[ET.Element]:
    """Finds a child element matching tag name suffix (namespace-agnostic)."""
    name_lower = name.lower()
    for child in elem:
        tag_suffix = child.tag.split("}")[-1].lower() if "}" in child.tag else child.tag.lower()
        if tag_suffix == name_lower:
            return child
    return None


def get_children(elem: ET.Element, name: str) -> List[ET.Element]:
    """Finds all child elements matching tag name suffix (namespace-agnostic)."""
    name_lower = name.lower()
    matches = []
    for child in elem:
        tag_suffix = child.tag.split("}")[-1].lower() if "}" in child.tag else child.tag.lower()
        if tag_suffix == name_lower:
            matches.append(child)
    return matches


class RSSCollector(BaseCollector):
    """Universal XML feed collector supporting RSS 2.0 and Atom feeds."""

    def collect(self, source_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        raw_bytes = self.fetch_url(source_config["url"])
        if not raw_bytes:
            return []

        try:
            root = ET.fromstring(raw_bytes)
        except Exception:
            try:
                cleaned_text = raw_bytes.decode("utf-8", errors="replace")
                root = ET.fromstring(cleaned_text.encode("utf-8"))
            except Exception as e2:
                raise RuntimeError(f"XML parse failure for {source_config['name']}: {e2}")

        tag = root.tag.lower()
        if "feed" in tag or get_children(root, "entry"):
            return self._parse_atom(root, source_config)
        else:
            return self._parse_rss(root, source_config)

    def _parse_rss(self, root: ET.Element, source_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        # Look for channel or find items anywhere
        channel = get_child(root, "channel")
        target_container = channel if channel is not None else root
        items = get_children(target_container, "item")
        if not items:
            items = root.findall(".//item")

        results: List[Dict[str, Any]] = []

        for item in items:
            title_elem = get_child(item, "title")
            raw_title = "".join(title_elem.itertext()) if title_elem is not None else ""
            title = self.clean_html(raw_title)
            if not title:
                continue

            # Link extraction
            link_elem = get_child(item, "link")
            link = ""
            if link_elem is not None:
                link = (link_elem.text or link_elem.get("href", "") or "").strip()
            if not link:
                guid_elem = get_child(item, "guid")
                if guid_elem is not None and guid_elem.text and guid_elem.text.startswith("http"):
                    link = guid_elem.text.strip()

            canonical_url = self.canonicalize_url(link)
            if not canonical_url:
                continue

            # Date extraction
            date_elem = get_child(item, "pubDate") or get_child(item, "date")
            raw_date = "".join(date_elem.itertext()) if date_elem is not None else ""
            published_at = self.parse_datetime(raw_date)

            # Content extraction
            content_elem = get_child(item, "encoded") or get_child(item, "description")
            raw_content = "".join(content_elem.itertext()) if content_elem is not None else ""
            clean_content = self.clean_html(raw_content)

            # Author extraction
            creator_elem = get_child(item, "creator") or get_child(item, "author")
            author = self.clean_html("".join(creator_elem.itertext())) if creator_elem is not None else None

            results.append({
                "title": title,
                "url": canonical_url,
                "source": source_config["name"],
                "source_type": source_config.get("source_type", "journalism"),
                "reliability": source_config.get("reliability", 1.0),
                "published_at": published_at,
                "content": clean_content,
                "category": source_config.get("category", "INDUSTRY"),
                "authors": [author] if author else []
            })

        return results

    def _parse_atom(self, root: ET.Element, source_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        entries = get_children(root, "entry")
        if not entries:
            entries = root.findall(".//entry")

        results: List[Dict[str, Any]] = []

        for entry in entries:
            title_elem = get_child(entry, "title")
            raw_title = "".join(title_elem.itertext()) if title_elem is not None else ""
            title = self.clean_html(raw_title)
            if not title:
                continue

            # Link extraction
            link = ""
            for link_node in get_children(entry, "link"):
                rel = link_node.get("rel", "alternate")
                href = link_node.get("href", "")
                if rel in ("alternate", "") and href:
                    link = href
                    break
                elif href and not link:
                    link = href

            if not link:
                id_elem = get_child(entry, "id")
                raw_id = (id_elem.text or "").strip() if id_elem is not None else ""
                if raw_id.startswith("http"):
                    link = raw_id

            canonical_url = self.canonicalize_url(link)
            if not canonical_url:
                continue

            # Date extraction
            date_elem = (
                get_child(entry, "published")
                or get_child(entry, "updated")
            )
            raw_date = "".join(date_elem.itertext()) if date_elem is not None else ""
            published_at = self.parse_datetime(raw_date)

            # Content / Summary extraction
            content_elem = (
                get_child(entry, "content")
                or get_child(entry, "summary")
            )
            raw_content = "".join(content_elem.itertext()) if content_elem is not None else ""
            clean_content = self.clean_html(raw_content)

            # Author extraction
            author_names = []
            for author_node in get_children(entry, "author"):
                name_elem = get_child(author_node, "name")
                if name_elem is not None:
                    author_names.append(self.clean_html("".join(name_elem.itertext())))

            results.append({
                "title": title,
                "url": canonical_url,
                "source": source_config["name"],
                "source_type": source_config.get("source_type", "research"),
                "reliability": source_config.get("reliability", 1.0),
                "published_at": published_at,
                "content": clean_content,
                "category": source_config.get("category", "RESEARCH"),
                "authors": author_names
            })

        return results
