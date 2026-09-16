"""
News router — proxies external RSS/JSON feeds so the frontend
doesn't run into CORS issues. Caches results for 30 minutes.
"""

import time
import logging
import re
from typing import List, Dict, Any
from datetime import datetime
import urllib.request
import urllib.error
import json as _json
import xml.etree.ElementTree as ET

from fastapi import APIRouter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/news", tags=["News"])

# ── In-memory cache ────────────────────────────────────────────────────────────
_CACHE: Dict[str, Any] = {}
CACHE_TTL = 1800  # 30 minutes


def _cached(key: str):
    entry = _CACHE.get(key)
    if entry and time.time() - entry["ts"] < CACHE_TTL:
        return entry["data"]
    return None


def _store(key: str, data: Any):
    _CACHE[key] = {"ts": time.time(), "data": data}


# ── RSS helpers ────────────────────────────────────────────────────────────────

def _fetch_url(url: str, timeout: int = 8) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "EduAuditBot/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", errors="replace")


def _parse_rss(xml_text: str, source: str, category: str, limit: int = 8) -> List[Dict]:
    items = []
    try:
        root = ET.fromstring(xml_text)
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        # Handle both RSS 2.0 and Atom
        entries = root.findall(".//item") or root.findall(".//atom:entry", ns)
        for entry in entries[:limit]:
            def g(tag):
                el = entry.find(tag) or entry.find(f"atom:{tag}", ns)
                return el.text.strip() if el is not None and el.text else ""
            title = g("title")
            link  = g("link") or g("id")
            desc  = re.sub(r"<[^>]+>", "", g("description") or g("summary") or "")[:220]
            pub   = g("pubDate") or g("published") or g("updated")
            if title:
                items.append({
                    "title": title, "url": link,
                    "description": desc, "published": pub,
                    "source": source, "category": category,
                })
    except Exception as e:
        logger.warning(f"RSS parse error ({source}): {e}")
    return items


# ── Feed definitions ───────────────────────────────────────────────────────────

FEEDS = [
    # AI / Tech research
    {
        "url": "https://arxiv.org/rss/cs.AI",
        "source": "arXiv – AI",
        "category": "ai_research",
        "limit": 6,
    },
    {
        "url": "https://arxiv.org/rss/cs.LG",
        "source": "arXiv – Machine Learning",
        "category": "ai_research",
        "limit": 5,
    },
    # EdTech / University news
    {
        "url": "https://www.timeshighereducation.com/feeds/all",
        "source": "Times Higher Education",
        "category": "university_news",
        "limit": 6,
    },
    {
        "url": "https://www.edsurge.com/feed.xml",
        "source": "EdSurge",
        "category": "edtech",
        "limit": 5,
    },
    # General AI news
    {
        "url": "https://feeds.feedburner.com/venturebeat/SZYF",
        "source": "VentureBeat AI",
        "category": "ai_news",
        "limit": 5,
    },
]

# Fallback static articles (shown when all feeds fail / offline)
FALLBACK_ARTICLES = [
    {"title":"GPT-4o Mini Achieves State-of-the-Art on Educational QA Benchmarks","url":"#","description":"Researchers report that compact LLMs now rival larger models on structured pedagogical question-answering tasks, opening doors for cost-effective EdTech deployment.","published":"2026-07-01","source":"arXiv – AI","category":"ai_research"},
    {"title":"Bloom's Taxonomy in the Age of Generative AI","url":"#","description":"A new study examines how AI-generated content aligns with higher-order thinking skills, revealing gaps in Evaluate and Create levels.","published":"2026-06-28","source":"EdSurge","category":"edtech"},
    {"title":"Honoris United Universities Expands AI Literacy Programme","url":"#","description":"The Honoris network announces a continent-wide AI literacy initiative for faculty, targeting 5,000 instructors across 12 countries by 2027.","published":"2026-06-20","source":"Times Higher Education","category":"university_news"},
    {"title":"RAG-Based Systems Improve Curriculum Coherence Detection by 40%","url":"#","description":"Retrieval-augmented generation pipelines show significant improvements over baseline LLMs when tasked with detecting misaligned learning objectives.","published":"2026-06-15","source":"arXiv – Machine Learning","category":"ai_research"},
    {"title":"EdTech Startups Raise Record $4.2B in H1 2026","url":"#","description":"AI-powered personalized learning tools dominated EdTech investment rounds, with pedagogical audit platforms emerging as a notable new category.","published":"2026-06-10","source":"VentureBeat AI","category":"ai_news"},
    {"title":"UNESCO Report: AI Can Narrow Education Quality Gaps","url":"#","description":"The latest UNESCO global education report highlights AI auditing tools as a key lever for improving teaching quality in emerging economies.","published":"2026-06-05","source":"Times Higher Education","category":"university_news"},
    {"title":"LLaMA 4 Outperforms GPT-4 on French Academic Text Analysis","url":"#","description":"Meta's latest open model shows superior performance on French-language pedagogical documents, making it a strong candidate for Francophone institutions.","published":"2026-05-30","source":"arXiv – AI","category":"ai_research"},
    {"title":"Automated Essay Scoring: From NLP to LLM-Driven Rubric Alignment","url":"#","description":"A comprehensive survey of 120 papers tracks the evolution from rule-based graders to modern LLM approaches that reason about rubric criteria.","published":"2026-05-25","source":"arXiv – Machine Learning","category":"ai_research"},
]


@router.get("/feed", summary="Get latest university & AI news")
def get_news_feed():
    cached = _cached("news_feed")
    if cached:
        return cached

    articles = []
    for feed in FEEDS:
        try:
            xml = _fetch_url(feed["url"], timeout=6)
            parsed = _parse_rss(xml, feed["source"], feed["category"], feed.get("limit", 6))
            articles.extend(parsed)
            logger.info(f"Fetched {len(parsed)} items from {feed['source']}")
        except Exception as e:
            logger.warning(f"Feed failed ({feed['source']}): {e}")

    if len(articles) < 4:
        logger.info("Using fallback articles (feeds unavailable)")
        articles = FALLBACK_ARTICLES

    result = {
        "total": len(articles),
        "articles": articles,
        "fetched_at": datetime.utcnow().isoformat(),
        "is_live": len(articles) > len(FALLBACK_ARTICLES) or len(articles) == 0,
    }
    _store("news_feed", result)
    return result


@router.get("/feed/{category}", summary="Get news by category")
def get_news_by_category(category: str):
    data = get_news_feed()
    filtered = [a for a in data["articles"] if a.get("category") == category]
    return {"total": len(filtered), "articles": filtered, "category": category}
