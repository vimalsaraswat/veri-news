from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture
def mock_tavily_results():
    return [
        {
            "url": "https://reuters.com/test-article",
            "title": "Test Article About Claims",
            "content": "Officials confirmed the arrest of suspects in a major drug raid operation.",
            "score": 0.85,
            "published_date": "2024-01-01",
        },
        {
            "url": "https://apnews.com/another-article",
            "title": "Follow-up Investigation Report",
            "content": "Authorities seized a significant quantity of contraband during the operation.",
            "score": 0.72,
            "published_date": "2024-01-02",
        },
    ]


@pytest.fixture
def mock_tavily(mock_tavily_results):
    with patch("app.search.client.TavilyClient") as mock_cls:
        instance = MagicMock()
        instance.search.return_value = {"results": mock_tavily_results}
        mock_cls.return_value = instance
        yield instance


@pytest.fixture
def mock_gemini():
    with patch("langchain_google_genai.ChatGoogleGenerativeAI") as mock_cls:
        instance = MagicMock()

        async def fake_ainvoke(messages, *args, **kwargs):
            msg = MagicMock()
            msg.content = "Officials arrested five suspects in the drug raid.\nAuthorities seized 10 kg of contraband."
            return msg

        instance.ainvoke = fake_ainvoke
        mock_cls.return_value = instance
        yield instance


@pytest.fixture
async def test_client(mock_tavily, mock_gemini):
    from app.main import create_app
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client
