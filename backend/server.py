"""
ArgonNews Backend API Server
============================
Lightweight, zero-dependency REST server providing CORS-enabled endpoints
for /articles, /health, and pipeline execution.
"""

import json
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from backend.pipeline import Pipeline

PORT = 8000
PIPELINE = Pipeline()


class ArgonNewsHandler(BaseHTTPRequestHandler):
    """HTTP Request Handler for ArgonNews API endpoints."""

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept")

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]

        if path in ("/articles", "/api/articles", "/articles.json"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self._send_cors_headers()
            self.end_headers()

            articles_file = "analyzed_articles.json"
            if os.path.exists(articles_file):
                with open(articles_file, "r", encoding="utf-8") as f:
                    content = f.read()
                self.wfile.write(content.encode("utf-8"))
            else:
                self.wfile.write(b"[]")

        elif path in ("/health", "/api/health"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()

            article_count = 0
            if os.path.exists("analyzed_articles.json"):
                try:
                    with open("analyzed_articles.json", "r", encoding="utf-8") as f:
                        article_count = len(json.load(f))
                except Exception:
                    pass

            payload = {
                "status": "healthy",
                "service": "ArgonNews Python Intelligence Backend",
                "article_count": article_count,
                "version": "1.0.0"
            }
            self.wfile.write(json.dumps(payload, indent=2).encode("utf-8"))

        else:
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(b'{"error": "Not Found"}')

    def do_POST(self):
        path = self.path.split("?")[0]

        if path in ("/pipeline/run", "/api/pipeline/run"):
            result = PIPELINE.run()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "summary": {
                    "sources_attempted": result["total_sources_attempted"],
                    "articles_discovered": result["articles_discovered"],
                    "articles_accepted": result["articles_accepted"]
                }
            }).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Concise logging
        sys.stderr.write(f"[{self.log_date_time_string()}] {format % args}\n")


def run_server(port: int = PORT):
    server_address = ("", port)
    httpd = HTTPServer(server_address, ArgonNewsHandler)
    print(f"ArgonNews API Server running on port {port} (http://localhost:{port}/articles)...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        httpd.server_close()


if __name__ == "__main__":
    run_server()
