from __future__ import annotations

import json
from pathlib import Path

from app.geography.detector import GeographyDetector

DATA_PATH = Path(__file__).parent.parent / "data" / "geography.json"


class DomainResolver:
    def __init__(self, detector: GeographyDetector) -> None:
        with open(DATA_PATH, encoding="utf-8") as f:
            self._data: dict = json.load(f)

    def get_trusted_domains(self, region: str | None) -> list[str]:
        if region and region in self._data["regions"]:
            return self._data["regions"][region]["trusted_domains"]
        return self._data["global_trusted_domains"]

    def get_tld_patterns(self, region: str | None) -> list[str]:
        if region and region in self._data["regions"]:
            return self._data["regions"][region]["tld_patterns"]
        return []

    def get_global_trusted(self) -> list[str]:
        return self._data["global_trusted_domains"]

    def is_regional_source(self, domain: str, region: str | None) -> bool:
        if not region:
            return False
        cfg = self._data["regions"].get(region, {})
        tlds = cfg.get("tld_patterns", [])
        trusted = cfg.get("trusted_domains", [])
        return any(domain.endswith(tld.lstrip(".")) for tld in tlds) or any(
            t in domain for t in trusted
        )

    def is_global_trusted(self, domain: str) -> bool:
        return any(t in domain for t in self._data["global_trusted_domains"])

    def credibility_score(self, domain: str, region: str | None) -> float:
        base = 0.4
        if self.is_global_trusted(domain):
            base += 0.3
        elif self.is_regional_source(domain, region):
            base += 0.2
        return min(0.99, base)
