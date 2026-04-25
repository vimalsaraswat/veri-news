from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_health_endpoint(test_client):
    resp = await test_client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_empty_text_returns_422(test_client):
    resp = await test_client.post("/api/investigate", json={"text": ""})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_text_too_short_returns_422(test_client):
    resp = await test_client.post("/api/investigate", json={"text": "short"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_text_too_long_returns_422(test_client):
    resp = await test_client.post("/api/investigate", json={"text": "x" * 16000})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_investigate_returns_event_stream(test_client):
    resp = await test_client.post(
        "/api/investigate",
        json={"text": "The FBI arrested 10 suspects near the White House after a major sting operation."},
        headers={"Accept": "text/event-stream"},
    )
    assert resp.status_code == 200
    assert "text/event-stream" in resp.headers.get("content-type", "")
