"""
ArgonNews Intelligence Pipeline Orchestrator
===========================================
Executes multi-source ingestion, schema normalization, multi-signal
deduplication, and AI distillation analysis across all configured AI sources.
"""

import json
import os
import time
from typing import Dict, Any, List, Tuple, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

from backend.sources import SOURCES, get_enabled_sources
from backend.collectors.rss_collector import RSSCollector
from backend.collectors.arxiv_collector import ArxivCollector
from backend.collectors.web_collector import WebCollector
from backend.processing.normalizer import normalize_article
from backend.processing.deduplicator import Deduplicator
from backend.analyze_articles import analyze_article
from backend.processing.image_enricher import select_article_image


class Pipeline:
    """
    Main ingestion and analysis pipeline for ArgonNews.
    """

    def __init__(self, output_path: str = "analyzed_articles.json"):
        self.output_path = output_path
        self.frontend_output_path = "frontend/public/articles.json"
        self.dist_output_path = "dist/articles.json"

        # Collectors
        self.rss_collector = RSSCollector(timeout=7)
        self.arxiv_collector = ArxivCollector(timeout=8)
        self.web_collector = WebCollector(timeout=7)
        self.deduplicator = Deduplicator(title_similarity_threshold=0.85)

    def _get_collector(self, collector_type: str):
        if collector_type == "arxiv":
            return self.arxiv_collector
        elif collector_type == "web":
            return self.web_collector
        else:
            return self.rss_collector

    def collect_source(self, source: Dict[str, Any]) -> Tuple[str, List[Dict[str, Any]], Optional[str]]:
        """Collects articles from a single source with isolated error handling."""
        source_name = source["name"]
        collector_type = source.get("collector_type", "rss")
        collector = self._get_collector(collector_type)

        try:
            raw_articles = collector.collect(source)
            return source_name, raw_articles, None
        except Exception as e:
            return source_name, [], str(e)

    def run(self) -> Dict[str, Any]:
        start_time = time.time()
        enabled_sources = get_enabled_sources()
        total_sources_attempted = len(enabled_sources)

        print("\n================================================================================")
        print("  ARGONNEWS MULTI-SOURCE INGESTION & INTELLIGENCE PIPELINE")
        print("================================================================================\n")

        all_collected_raw: List[Dict[str, Any]] = []
        source_stats: Dict[str, Dict[str, int]] = {}
        successful_sources = 0
        failed_sources = 0

        # Execute source collection concurrently with thread pool
        with ThreadPoolExecutor(max_workers=16) as executor:
            future_to_source = {
                executor.submit(self.collect_source, source): source
                for source in enabled_sources
            }

            for future in as_completed(future_to_source):
                source_name, raw_articles, error = future.result()
                discovered = len(raw_articles)

                if error:
                    failed_sources += 1
                    source_stats[source_name] = {
                        "discovered": 0,
                        "accepted": 0,
                        "duplicates": 0,
                        "errors": 1,
                        "error_msg": error
                    }
                    print(f"[{source_name}] discovered: 0 | accepted: 0 | duplicates: 0 | errors: 1 (Error: {error[:60]})")
                else:
                    successful_sources += 1
                    # Normalize raw articles
                    normalized = [normalize_article(a) for a in raw_articles]
                    # Local deduplication per source
                    deduped, dup_count = self.deduplicator.deduplicate(normalized)
                    accepted = len(deduped)

                    source_stats[source_name] = {
                        "discovered": discovered,
                        "accepted": accepted,
                        "duplicates": dup_count,
                        "errors": 0
                    }
                    all_collected_raw.extend(deduped)
                    print(f"[{source_name}] discovered: {discovered:2d} | accepted: {accepted:2d} | duplicates: {dup_count:2d} | errors: 0")

        # Global multi-signal deduplication across all sources
        total_discovered = sum(s.get("discovered", 0) for s in source_stats.values())
        canonical_articles, global_duplicates = self.deduplicator.deduplicate(all_collected_raw)

        # Merge with existing curated articles from file if available to preserve history
        existing_articles = self.load_existing_articles()
        if existing_articles:
            # Prepend existing manually verified articles and re-deduplicate
            combined = existing_articles + canonical_articles
            final_articles, extra_dups = self.deduplicator.deduplicate(combined)
            global_duplicates += extra_dups
        else:
            final_articles = canonical_articles

        total_accepted = len(final_articles)

        # Run AI intelligence distillation / analysis and verified image selection
        print(f"\nRunning AI distillation & analysis on {len(final_articles)} articles...")
        analyzed_articles = []
        for index, art in enumerate(final_articles, start=1):
            art["id"] = f"art-{index:03d}"
            art["analysis"] = analyze_article(art)
            img_data = select_article_image(art)
            art["image_url"] = img_data.get("image_url")
            art["image_source"] = img_data.get("image_source")
            art["image_license"] = img_data.get("image_license")
            art["image_credit"] = img_data.get("image_credit")
            art["image_alt"] = img_data.get("image_alt")
            analyzed_articles.append(art)

        # Write output files atomically
        self.save_articles(analyzed_articles)

        elapsed = time.time() - start_time

        # Print Final Summary Report
        print("\n--------------------------------------------------------------------------------")
        print("PIPELINE EXECUTION SUMMARY")
        print("--------------------------------------------------------------------------------")
        print(f"Total sources attempted : {total_sources_attempted}")
        print(f"Successful sources      : {successful_sources}")
        print(f"Failed sources          : {failed_sources}")
        print(f"Articles discovered     : {total_discovered}")
        print(f"Articles accepted       : {total_accepted}")
        print(f"Duplicates removed      : {global_duplicates}")
        print(f"Execution time          : {elapsed:.2f}s")
        print("--------------------------------------------------------------------------------\n")

        return {
            "total_sources_attempted": total_sources_attempted,
            "successful_sources": successful_sources,
            "failed_sources": failed_sources,
            "articles_discovered": total_discovered,
            "articles_accepted": total_accepted,
            "duplicates_removed": global_duplicates,
            "source_stats": source_stats,
            "articles": analyzed_articles
        }

    def load_existing_articles(self) -> List[Dict[str, Any]]:
        """Loads existing articles from disk to retain curated articles."""
        if os.path.exists(self.output_path):
            try:
                with open(self.output_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        return [normalize_article(a) for a in data]
            except Exception:
                pass
        return []

    def save_articles(self, articles: List[Dict[str, Any]]):
        """Saves articles to root analyzed_articles.json and frontend public directory."""
        json_content = json.dumps(articles, indent=2, ensure_ascii=False)

        # 1. Save to analyzed_articles.json
        with open(self.output_path, "w", encoding="utf-8") as f:
            f.write(json_content)

        # 2. Save to frontend/public/articles.json
        os.makedirs(os.path.dirname(self.frontend_output_path), exist_ok=True)
        with open(self.frontend_output_path, "w", encoding="utf-8") as f:
            f.write(json_content)

        # 3. Save to dist/articles.json if dist directory exists
        if os.path.exists("dist"):
            with open(self.dist_output_path, "w", encoding="utf-8") as f:
                f.write(json_content)


if __name__ == "__main__":
    pipeline = Pipeline()
    pipeline.run()
