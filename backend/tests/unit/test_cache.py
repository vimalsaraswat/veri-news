from app.search.cache import SearchCache, make_cache_key


def test_cache_hit_returns_same_object():
    cache = SearchCache(maxsize=10, ttl=60)
    results = [{"url": "http://test.com"}]
    cache.set("drug raid", 5, None, 30, results)
    hit = cache.get("drug raid", 5, None, 30)
    assert hit == results


def test_cache_miss_on_different_params():
    cache = SearchCache(maxsize=10, ttl=60)
    cache.set("drug raid", 5, None, 30, [{"url": "a"}])
    miss = cache.get("drug raid", 10, None, 30)  # different max_results
    assert miss is None


def test_cache_miss_returns_none():
    cache = SearchCache(maxsize=10, ttl=60)
    assert cache.get("completely new query", 5, None, 7) is None


def test_key_normalization_strips_whitespace():
    k1 = make_cache_key("  drug raid  ", 5, None, 30)
    k2 = make_cache_key("drug raid", 5, None, 30)
    assert k1 == k2


def test_key_domain_order_invariant():
    k1 = make_cache_key("query", 5, ["bbc.com", "reuters.com"], 30)
    k2 = make_cache_key("query", 5, ["reuters.com", "bbc.com"], 30)
    assert k1 == k2


def test_key_differs_with_different_domains():
    k1 = make_cache_key("query", 5, ["bbc.com"], 30)
    k2 = make_cache_key("query", 5, ["reuters.com"], 30)
    assert k1 != k2
