from __future__ import annotations

import re
from datetime import datetime

# Words that add noise without helping Tavily find better results
_NOISE_WORDS = {
    "the", "a", "an", "is", "are", "was", "were", "will", "be", "been",
    "do", "did", "does", "have", "has", "had", "can", "could", "would",
    "of", "in", "on", "at", "by", "for", "with", "as", "from", "into",
    "to", "and", "or", "but", "not", "no", "it", "its", "this", "that",
    "these", "those", "there", "their", "they", "we", "our", "us",
    "allegedly", "reportedly", "secretly", "apparently", "supposedly",
    "claim", "claims", "claimed", "claimed", "said", "says", "according",
    "announced", "confirmed", "revealed", "declared",
    "last", "week", "month", "year", "yesterday", "today", "recently",
    "just", "now", "new", "latest",
}


def _clean_words(text: str, max_words: int) -> list[str]:
    """Return meaningful tokens, stripped of punctuation and noise."""
    tokens = re.findall(r"\b\w[\w'-]*\b", text)
    out: list[str] = []
    for tok in tokens:
        clean = tok.strip("'-")
        if clean.lower() not in _NOISE_WORDS and len(clean) > 1:
            out.append(clean)
        if len(out) >= max_words:
            break
    return out


def _extract_key_nouns(text: str) -> list[str]:
    """Crude named-entity extraction via Title-Case heuristic."""
    words = re.findall(r"\b[A-Z][a-z]{2,}\b", text)
    seen: set[str] = set()
    out: list[str] = []
    for w in words:
        if w.lower() not in _NOISE_WORDS and w not in seen:
            seen.add(w)
            out.append(w)
    return out[:5]


def build_primary(claim: str, region: str | None) -> str:
    """
    Short, punchy query from the core claim terms.
    Strips filler/temporal words so Tavily gets signal, not noise.
    """
    words = _clean_words(claim, max_words=9)
    query = " ".join(words)

    # Append region only when it's not already implied
    if region and region.lower() not in query.lower():
        query = f"{region.title()} {query}"

    return query.strip()


def build_relaxed(claim: str) -> str:
    """Just the first 6 meaningful content words."""
    words = _clean_words(claim, max_words=6)
    return " ".join(words)


def build_topic(claim: str) -> str:
    """Named-entity + 'fact check' for maximum-fallback coverage."""
    nouns = _extract_key_nouns(claim)
    base = " ".join(nouns[:4]) if nouns else " ".join(_clean_words(claim, 4))
    return f"{base} fact check"


def build_related_articles(article_text: str, region: str | None) -> str:
    sentences = [s.strip() for s in article_text.split(".") if len(s.strip()) > 20]
    topic = ". ".join(sentences[:2])[:180]
    prefix = f"{region.title()} " if region else ""
    return (prefix + topic).strip()


def estimate_search_days(article_text: str) -> int | None:
    """
    Returns a days value for the Tavily news search, or None to skip date-filtering.
    Only restrict by date when the claim explicitly references a recent time window.
    """
    text = article_text.lower()
    if any(w in text for w in ("yesterday", "today", "breaking", "just in", "hours ago")):
        return 3
    if any(w in text for w in ("last week", "this week", "past week")):
        return 10
    if any(w in text for w in ("last month", "this month", "past month")):
        return 45
    # No strong temporal signal → don't restrict by date
    return None
