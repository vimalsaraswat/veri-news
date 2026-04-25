import pytest

from app.geography.detector import GeographyDetector


@pytest.fixture
def detector():
    return GeographyDetector()


def test_india_detection_basic(detector):
    result = detector.detect("NCB arrested suspects in Mumbai drug raid")
    assert result.region == "india"
    assert result.confidence > 0.0


def test_indianapolis_not_india(detector):
    result = detector.detect("A shooting occurred in Indianapolis, Indiana")
    assert result.region != "india"


def test_indiana_not_india(detector):
    result = detector.detect("Indiana Governor signs new legislation")
    assert result.region != "india"


def test_usa_detection(detector):
    result = detector.detect("FBI arrested suspects in Washington DC near the White House")
    assert result.region == "usa"


def test_uk_detection(detector):
    result = detector.detect("Parliament debated the NHS funding bill in London")
    assert result.region == "uk"


def test_no_region_returns_none(detector):
    result = detector.detect("Scientists discovered a new species of beetle in a forest")
    assert result.region is None
    assert result.confidence == 0.0


def test_confidence_scales_with_marker_count(detector):
    few_markers = detector.detect("India is a country")
    many_markers = detector.detect("NCB arrested suspects in Mumbai Delhi Kolkata India")
    assert many_markers.confidence >= few_markers.confidence


def test_detection_result_bool_true(detector):
    result = detector.detect("NCB raid in Delhi")
    assert bool(result) is True


def test_detection_result_bool_false(detector):
    result = detector.detect("Scientists discovered a mineral")
    assert bool(result) is False
