"""
Firecrawl Service
------------------
Fetches educational resources for a given topic using a simple web search
approach. If a FIRECRAWL_API_KEY env var is present it uses the Firecrawl
REST API; otherwise it falls back to scraping public Wikipedia / DuckDuckGo
Instant Answer API so the system still works without an API key.
"""

import os
import re
import requests

FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "")
FIRECRAWL_BASE = "https://api.firecrawl.dev/v0"


def fetch_resources(topic: str, max_chars: int = 2000) -> str:
    """
    Return a text block of additional learning material for `topic`.
    Tries Firecrawl first, then falls back to Wikipedia summary.
    """
    if FIRECRAWL_API_KEY:
        return _firecrawl_search(topic, max_chars)
    return _wikipedia_fallback(topic, max_chars)


# ── Firecrawl API ─────────────────────────────────────────────────────────────

def _firecrawl_search(topic: str, max_chars: int) -> str:
    try:
        resp = requests.post(
            f"{FIRECRAWL_BASE}/search",
            headers={"Authorization": f"Bearer {FIRECRAWL_API_KEY}"},
            json={"query": f"{topic} educational explanation", "limit": 3},
            timeout=15,
        )
        data = resp.json()
        texts = []
        for result in data.get("data", []):
            content = result.get("markdown") or result.get("content") or ""
            texts.append(content[:800])
        combined = "\n\n---\n\n".join(texts)
        return combined[:max_chars] if combined else _wikipedia_fallback(topic, max_chars)
    except Exception as e:
        return _wikipedia_fallback(topic, max_chars)


# ── Wikipedia fallback ────────────────────────────────────────────────────────

def _wikipedia_fallback(topic: str, max_chars: int) -> str:
    try:
        url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + requests.utils.quote(topic)
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            extract = data.get("extract", "")
            return extract[:max_chars] if extract else ""
    except Exception:
        pass
    return ""
