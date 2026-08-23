"""
arXiv Academic Research Collector for ArgonNews
===============================================
Specialized collector for arXiv preprint feeds and API queries (cs.AI, cs.LG, cs.CL).
Preserves rich paper metadata: title, authors, abstract, arXiv ID, categories,
and submission dates.
"""

import xml.etree.ElementTree as ET
import re
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


class ArxivCollector(BaseCollector):
    """
    Dedicated arXiv collector designed specifically for scholarly preprints.
    Maintains research paper semantics and multi-author citation structures.
    """

    def collect(self, source_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        raw_bytes = self.fetch_url(source_config["url"])
        if not raw_bytes:
            return []

        try:
            root = ET.fromstring(raw_bytes)
        except Exception as e:
            raise RuntimeError(f"Failed to parse arXiv Atom payload: {e}")

        entries = get_children(root, "entry")
        if not entries:
            entries = root.findall(".//entry")

        results: List[Dict[str, Any]] = []

        for entry in entries:
            # 1. Title
            title_node = get_child(entry, "title")
            raw_title = "".join(title_node.itertext()) if title_node is not None else ""
            title = self.clean_html(raw_title)
            title = re.sub(r"^\s*Title:\s*", "", title, flags=re.IGNORECASE).strip()
            if not title:
                continue

            # 2. arXiv ID and Links
            id_node = get_child(entry, "id")
            raw_id = "".join(id_node.itertext()).strip() if id_node is not None else ""
            arxiv_match = re.search(r"abs/(\d+\.\d+(?:v\d+)?)", raw_id)
            arxiv_id = arxiv_match.group(1) if arxiv_match else raw_id.split("/")[-1]

            paper_url = f"https://arxiv.org/abs/{arxiv_id.split('v')[0]}" if arxiv_id else raw_id
            pdf_url = f"https://arxiv.org/pdf/{arxiv_id.split('v')[0]}.pdf" if arxiv_id else ""

            # 3. Authors
            authors: List[str] = []
            for author_node in get_children(entry, "author"):
                name_node = get_child(author_node, "name")
                if name_node is not None:
                    authors.append(self.clean_html("".join(name_node.itertext())))

            # 4. Abstract / Summary
            summary_node = get_child(entry, "summary")
            abstract = self.clean_html("".join(summary_node.itertext()) if summary_node is not None else "")

            # 5. Categories
            categories: List[str] = []
            primary_cat = get_child(entry, "primary_category")
            if primary_cat is not None and primary_cat.get("term"):
                categories.append(primary_cat.get("term"))
            for cat_node in get_children(entry, "category"):
                term = cat_node.get("term")
                if term and term not in categories:
                    categories.append(term)

            # 6. Dates
            published_node = get_child(entry, "published")
            updated_node = get_child(entry, "updated")
            published_at = self.parse_datetime(
                "".join(published_node.itertext()) if published_node is not None else ""
            )
            updated_at = self.parse_datetime(
                "".join(updated_node.itertext()) if updated_node is not None else ""
            )

            # Format research content clearly
            author_str = ", ".join(authors[:4]) + (" et al." if len(authors) > 4 else "")
            formatted_content = f"Authors: {author_str}\nPrimary Subject: {', '.join(categories)}\n\nAbstract: {abstract}"

            results.append({
                "title": title,
                "url": paper_url,
                "pdf_url": pdf_url,
                "source": source_config["name"],
                "source_type": "academic",
                "reliability": source_config.get("reliability", 0.95),
                "published_at": published_at,
                "updated_at": updated_at,
                "content": formatted_content,
                "abstract": abstract,
                "authors": authors,
                "arxiv_id": arxiv_id,
                "paper_categories": categories,
                "category": "RESEARCH"
            })

        return results
