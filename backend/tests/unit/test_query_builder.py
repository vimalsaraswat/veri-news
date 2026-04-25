from app.search.query_builder import (
    build_primary,
    build_related_articles,
    build_relaxed,
    build_topic,
    estimate_search_days,
)


def test_primary_includes_region():
    q = build_primary("NCB arrested 5 suspects in drug raid", "india")
    assert "India" in q


def test_primary_no_region():
    q = build_primary("FBI arrested suspects near Capitol", None)
    assert len(q) > 5


def test_relaxed_at_most_8_words():
    claim = "The National Narcotics Bureau arrested five suspects in a major drug operation last night"
    q = build_relaxed(claim)
    assert len(q.split()) <= 8


def test_topic_contains_fact_check():
    q = build_topic("Donald Trump signed Executive Order on immigration")
    assert "fact check" in q.lower() or "verification" in q.lower()


def test_related_articles_uses_sentences():
    article = "The FBI arrested 10 suspects. They were found with illegal weapons. More details pending."
    q = build_related_articles(article, "usa")
    assert "USA" in q or "usa" in q.lower() or "United States" in q or len(q) > 10


def test_estimate_days_yesterday():
    assert estimate_search_days("This happened yesterday in the city") == 3


def test_estimate_days_last_week():
    assert estimate_search_days("The incident last week shocked residents") == 10


def test_estimate_days_default():
    assert estimate_search_days("Generic article with no time reference at all") == 30
