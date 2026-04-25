from app.search.relevance import compute_relevance, seq_similarity, single_relevance


def test_identical_strings_high_similarity():
    score = single_relevance("drug raid arrests suspects", "drug raid arrests suspects")
    assert score > 0.8


def test_empty_candidates_returns_empty():
    result = compute_relevance("some claim", [])
    assert result == []


def test_single_empty_candidate():
    result = compute_relevance("drug raid", [""])
    assert len(result) == 1
    assert result[0] >= 0.0


def test_relevance_scores_in_range():
    texts = ["police arrested 5 suspects", "weather forecast for tomorrow", "drug seizure in city"]
    scores = compute_relevance("police arrested drug suspects", texts)
    assert len(scores) == 3
    assert all(0.0 <= s <= 1.0 for s in scores)


def test_seq_similarity_identical():
    assert seq_similarity("hello world", "hello world") == 1.0


def test_seq_similarity_different():
    assert seq_similarity("apple", "banana") < 0.5


def test_relevant_text_scores_higher_than_unrelated():
    claim = "police arrested drug dealers"
    relevant = "Authorities nabbed several drug suspects in a city raid"
    irrelevant = "The stock market rose by 2 percent today"
    rel_score = single_relevance(claim, relevant)
    irrel_score = single_relevance(claim, irrelevant)
    assert rel_score > irrel_score
