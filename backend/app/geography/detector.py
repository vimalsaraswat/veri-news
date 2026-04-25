from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path

DATA_PATH = Path(__file__).parent.parent / "data" / "geography.json"

logger = logging.getLogger(__name__)


@dataclass
class DetectionResult:
    region: str | None
    confidence: float
    matched_markers: list[str] = field(default_factory=list)

    def __bool__(self) -> bool:
        return self.region is not None


class GeographyDetector:
    def __init__(self, data_path: Path = DATA_PATH) -> None:
        with open(data_path, encoding="utf-8") as f:
            self._data: dict = json.load(f)

    def detect(self, text: str) -> DetectionResult:
        padded = f" {text.lower()} "

        scores: dict[str, int] = {}
        matched: dict[str, list[str]] = {}

        for region, cfg in self._data["regions"].items():
            working = padded
            for fp in cfg.get("exclude_false_positives", []):
                working = working.replace(fp.lower(), " ")

            hits = [m for m in cfg["markers"] if m.lower() in working]
            if hits:
                scores[region] = len(hits)
                matched[region] = hits

        if not scores:
            return DetectionResult(region=None, confidence=0.0)

        best = max(scores, key=lambda r: scores[r])
        total_markers = len(self._data["regions"][best]["markers"])
        confidence = min(1.0, scores[best] / max(3, total_markers * 0.3))

        logger.debug(
            "Geography detected: region=%s confidence=%.2f markers=%s",
            best,
            confidence,
            matched[best][:3],
        )
        return DetectionResult(
            region=best,
            confidence=round(confidence, 3),
            matched_markers=matched[best],
        )
