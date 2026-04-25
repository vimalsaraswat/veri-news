from app.scoring.confidence import (
    compute_confidence,
    corroboration_score,
    coverage_score,
)


def _ev(relevance=0.5, credibility=0.5):
    return {"relevance": relevance, "credibility": credibility, "url": "http://test.com"}


def test_zero_evidence_returns_zero_low():
    score, label = compute_confidence([], 0, 0, 3, 0)
    assert score == 0.0
    assert label == "Low"


def test_high_corroboration_high_confidence():
    evidence = [_ev(0.8, 0.8) for _ in range(8)]
    score, label = compute_confidence(evidence, 8, 0, 3, 3)
    assert score >= 0.60


def test_all_contradicting_lowers_confidence():
    evidence = [_ev(0.7, 0.7) for _ in range(8)]
    score_corr, _ = compute_confidence(evidence, 8, 0, 3, 3)
    score_cont, _ = compute_confidence(evidence, 0, 8, 3, 3)
    assert score_corr > score_cont


def test_low_coverage_reduces_confidence():
    evidence = [_ev(0.7, 0.7) for _ in range(5)]
    score_full, _ = compute_confidence(evidence, 3, 0, 5, 5)
    score_low, _ = compute_confidence(evidence, 3, 0, 5, 1)
    assert score_full > score_low


def test_score_clamped_to_one():
    evidence = [_ev(1.0, 0.99) for _ in range(10)]
    score, _ = compute_confidence(evidence, 10, 0, 5, 5)
    assert score <= 1.0


def test_no_india_ratio_in_signature():
    import inspect
    sig = inspect.signature(compute_confidence)
    assert "india" not in str(sig)
    assert "india_ratio" not in sig.parameters


def test_corroboration_score_balanced():
    # equal corr and contra → around 0.5
    score = corroboration_score(5, 5, 10)
    assert 0.3 <= score <= 0.7


def test_coverage_score_zero_claims():
    assert coverage_score(0, 0) == 0.0


def test_label_thresholds():
    ev = [_ev(0.9, 0.9) for _ in range(10)]
    _, label_h = compute_confidence(ev, 10, 0, 5, 5)
    _, label_l = compute_confidence([], 0, 0, 1, 0)
    assert label_h == "High"
    assert label_l == "Low"
