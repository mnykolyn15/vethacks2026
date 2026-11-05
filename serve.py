#!/usr/bin/env python3
"""Static file server for local development: like `python3 -m http.server`, but tells the browser
never to cache, so edits show up on a normal refresh. Usage: python3 serve.py [port]"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"Serving on http://localhost:{port} (Ctrl+C to stop)")
    ThreadingHTTPServer(("", port), NoCache).serve_forever()
