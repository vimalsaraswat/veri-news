from __future__ import annotations

import logging
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

    _SKLEARN_AVAILABLE = True
except ImportError:
    _SKLEARN_AVAILABLE = False
    logger.warning("scikit-learn not available; falling back to difflib-only relevance")


def tfidf_scores(claim: str, candidate_texts: list[str]) -> list[float]:
    if not candidate_texts or not _SKLEARN_AVAILABLE:
        return [0.0] * len(candidate_texts)
    try:
        corpus = [claim] + candidate_texts
        vec = TfidfVectorizer(ngram_range=(1, 2), stop_words="english", max_features=5000)
        matrix = vec.fit_transform(corpus)
        scores = cosine_similarity(matrix[0:1], matrix[1:]).flatten()
        return [float(s) for s in scores]
    except ValueError:
        return [0.0] * len(candidate_texts)


def seq_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower()[:500], b.lower()[:500]).ratio()


def compute_relevance(claim: str, candidate_texts: list[str]) -> list[float]:
    """Combined TF-IDF + difflib relevance for a claim against multiple texts."""
    if not candidate_texts:
        return []

    tfidf = tfidf_scores(claim, candidate_texts)
    results = []
    for i, text in enumerate(candidate_texts):
        seq = seq_similarity(claim, text[:300])
        combined = round(0.6 * tfidf[i] + 0.4 * seq, 4)
        results.append(combined)
    return results


def single_relevance(claim: str, text: str) -> float:
    scores = compute_relevance(claim, [text])
    return scores[0] if scores else 0.0
