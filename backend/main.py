"""
ArgonNews Backend Main CLI
==========================
Unified command-line interface for running pipelines, serving the API,
and diagnosing source connectivity.
"""

import sys
import argparse
from backend.pipeline import Pipeline
from backend.sources import SOURCES, get_enabled_sources
from backend.server import run_server


def main():
    parser = argparse.ArgumentParser(description="ArgonNews AI Intelligence Backend")
    parser.add_argument("--run-pipeline", action="store_true", help="Run ingestion and analysis pipeline")
    parser.add_argument("--serve", action="store_true", help="Start the REST API server")
    parser.add_argument("--port", type=int, default=8000, help="Port for the API server")
    parser.add_argument("--list-sources", action="store_true", help="List all configured sources")

    args = parser.parse_args()

    if args.list_sources:
        print("\n=== Configured ArgonNews Sources ===")
        for s in SOURCES:
            status = "ENABLED" if s.get("enabled", True) else "DISABLED"
            print(f"[{status:8s}] {s['name']:32s} | Type: {s['source_type']:10s} | Collector: {s['collector_type']:6s} | {s['url']}")
        print(f"\nTotal: {len(SOURCES)} sources ({len(get_enabled_sources())} enabled)")
        return

    if args.serve:
        run_server(args.port)
        return

    # Default action: run pipeline
    pipeline = Pipeline()
    pipeline.run()


if __name__ == "__main__":
    main()
