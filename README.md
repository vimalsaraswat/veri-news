# VeriNews

AI-powered news fact-checker. Paste any headline or article and receive a forensic verdict — backed by live web evidence — in real time.

Three AI agents run in sequence: one extracts verifiable claims, one searches the web for evidence, one weighs the evidence and delivers a structured verdict with a confidence score.

---

## Table of Contents

- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Architecture Deep Dive](#architecture-deep-dive)
- [API Reference](#api-reference)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## How It Works

```
User pastes article text
        │
        ▼
┌─────────────────────┐
│  1. Content Analyst │  ── Extracts 3–7 verifiable factual claims from the article.
│                     │     Detects the article's geography (India, US, UK, etc.).
│                     │     Falls back to first 2 sentences if no claims found.
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  2. Research Agent  │  ── Searches Tavily for evidence per claim.
│                     │     Uses a 4-level query cascade: exact → relaxed → topic → related.
│                     │     Scores relevance via TF-IDF + difflib (no keyword overlap).
│                     │     Classifies each source: corroborates / contradicts / neutral.
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  3. Forensic Judge  │  ── Streams a structured report (Key Claims → Evidence →
│                     │     Credibility Audit → Verdict).
│                     │     Second pass extracts JSON: verdict + confidence + summary.
└────────┬────────────┘
         │
         ▼
  Verdict: Real | Fake | Suspicious | Inconclusive
  + confidence score + evidence cards + diagnostics
```

All three agent outputs stream to the browser in real time over a single HTTP connection (Server-Sent Events).

---

## Tech Stack

| Layer | Technology |
|---|---|
| LLM | Google Gemini (via LangChain) |
| Agent orchestration | LangGraph |
| Web search | Tavily Search API |
| Backend framework | FastAPI + Uvicorn |
| Relevance scoring | scikit-learn TF-IDF + difflib |
| Search cache | cachetools TTLCache |
| Frontend framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Streaming | Server-Sent Events over `fetch` (POST-compatible) |
| Language | Python 3.10+ / TypeScript |

---

## Prerequisites

**Tools — install these first:**

| Tool | Minimum Version | Check |
|---|---|---|
| Python | 3.10 | `python --version` |
| Node.js | 18 | `node --version` |
| npm | 9 | `npm --version` |

**API Keys — you need two free accounts:**

- **Gemini API key** → [aistudio.google.com](https://aistudio.google.com) — click *Get API key*. Free tier is sufficient for development.
- **Tavily API key** → [app.tavily.com](https://app.tavily.com) — sign up, go to *API Keys*. Free tier includes 1,000 searches/month.

---

## Quick Start

If you just want it running as fast as possible:

```bash
# 1. Clone
git clone <your-repo-url>
cd veri-news

# 2. Backend
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# → Open .env and add your GEMINI_API_KEY and TAVILY_API_KEY

# 3. Start backend (keep this terminal open)
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# 4. Frontend (new terminal)
cd ../frontend
npm install
npm run dev
```

Open **http://localhost:3000** — paste any news article and click Investigate.

---

## Configuration

### Backend — `backend/.env`

Copy `.env.example` to `.env` and fill in your values. Every setting is optional except the two API keys.

```env
# ── Required ──────────────────────────────────────────────────────────────────

GEMINI_API_KEY=your_gemini_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here

# ── Gemini model ───────────────────────────────────────────────────────────────
# Controls which Gemini model ALL THREE agents use.
# Change this one line to switch models — no code changes needed.
#
# Options (fastest → most capable):
#   gemini-2.0-flash               (default, fast + capable)
#   gemini-2.5-flash-preview-04-17 (latest flash, extended thinking)
#   gemini-2.5-pro-preview-03-25   (pro, highest quality, slower)
#   gemini-1.5-pro                 (previous pro generation)
GEMINI_MODEL=gemini-2.0-flash

# ── CORS ───────────────────────────────────────────────────────────────────────
# Comma-separated list of allowed frontend origins.
# Add your production URL here when deploying.
CORS_ORIGINS=http://localhost:3000

# ── Search ─────────────────────────────────────────────────────────────────────
# How far back Tavily searches for articles (in days).
TAVILY_SEARCH_DAYS=30

# ── Cache ──────────────────────────────────────────────────────────────────────
# Tavily search results are cached in memory to avoid duplicate API calls.
CACHE_TTL_SECONDS=1800   # 30 minutes
CACHE_MAX_SIZE=256        # max cached queries

# ── Logging ────────────────────────────────────────────────────────────────────
LOG_LEVEL=INFO            # DEBUG | INFO | WARNING | ERROR

# ── LangSmith tracing (optional) ───────────────────────────────────────────────
# Set LANGSMITH_TRACING=true to trace agent runs in LangSmith.
LANGSMITH_TRACING=false
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=verinews
LANGCHAIN_TRACING_V2=false
LANGSMITH_ENDPOINT=
```

### Frontend — `frontend/.env.local`

The frontend only needs one variable (already defaulted in `next.config.ts`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

This is only required if your backend runs on a non-standard port. In development with the default port, you don't need to create this file at all — Next.js proxies `/api/*` to `localhost:8000` automatically via `next.config.ts`.

---

## Project Structure

```
veri-news/
│
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app factory, CORS, lifespan hooks
│   │   ├── config.py                  # Pydantic Settings — reads all env vars
│   │   │
│   │   ├── agents/
│   │   │   ├── state.py               # LangGraph state TypedDict
│   │   │   ├── controller.py          # Builds and wires the LangGraph pipeline
│   │   │   ├── content_analyst.py     # Agent 1: claim extraction + dedup + geo
│   │   │   ├── research_agent.py      # Agent 2: evidence search + classification
│   │   │   └── forensic_judge.py      # Agent 3: streaming report + structured verdict
│   │   │
│   │   ├── search/
│   │   │   ├── client.py              # Async Tavily wrapper with fallback cascade
│   │   │   ├── query_builder.py       # 4-level query generation
│   │   │   ├── relevance.py           # TF-IDF + difflib combined scorer
│   │   │   └── cache.py              # TTLCache wrapper
│   │   │
│   │   ├── geography/
│   │   │   ├── detector.py            # Detects article region from text markers
│   │   │   └── domains.py             # Maps regions → trusted news domains
│   │   │
│   │   ├── scoring/
│   │   │   └── confidence.py          # 4-signal confidence formula
│   │   │
│   │   ├── models/
│   │   │   ├── request.py             # InvestigateRequest (Pydantic)
│   │   │   └── response.py            # EvidenceItem, VerdictPayload, DiagnosticsPayload
│   │   │
│   │   ├── routers/
│   │   │   ├── investigate.py         # POST /api/investigate → SSE stream
│   │   │   └── health.py              # GET /api/health
│   │   │
│   │   ├── middleware/
│   │   │   └── error_handler.py       # Global exception handler + SSE error events
│   │   │
│   │   ├── utils/
│   │   │   ├── llm.py                 # Normalizes LLM response content to str
│   │   │   └── logging.py             # JSON logging setup
│   │   │
│   │   └── data/
│   │       └── geography.json         # Region config: markers, trusted domains, exclusions
│   │
│   ├── tests/
│   │   ├── conftest.py                # Shared fixtures (mock Tavily, mock Gemini)
│   │   ├── unit/                      # Pure logic tests — no API calls
│   │   │   ├── test_relevance.py
│   │   │   ├── test_geography.py
│   │   │   ├── test_confidence.py
│   │   │   ├── test_query_builder.py
│   │   │   └── test_cache.py
│   │   └── integration/               # Endpoint + pipeline tests (mocked APIs)
│   │       ├── test_investigate_endpoint.py
│   │       └── test_agent_pipeline.py
│   │
│   ├── requirements.txt
│   ├── .env.example
│   └── .env                           # Your local secrets — never commit this
│
└── frontend/
    ├── app/
    │   ├── layout.tsx                 # Root layout: fonts, Navbar, theme init script
    │   ├── page.tsx                   # Main page — wires hooks to components
    │   └── globals.css                # Tailwind v4 directives, card utilities, animations
    │
    ├── components/
    │   ├── investigation/
    │   │   ├── InvestigationForm.tsx  # Textarea + submit + char counter
    │   │   ├── ProgressStream.tsx     # Per-agent streaming panels
    │   │   └── AgentPhaseHeader.tsx   # Step indicator (pending/running/complete)
    │   │
    │   ├── results/
    │   │   ├── VerdictCard.tsx        # Verdict + confidence gauge + summary
    │   │   ├── ConfidenceGauge.tsx    # Animated progress bar
    │   │   ├── EvidenceList.tsx       # Grid of source cards + show more
    │   │   ├── SourceCard.tsx         # Domain, title, snippet, relevance bar
    │   │   ├── DiagnosticsPanel.tsx   # Collapsible debug info
    │   │   └── ExportButton.tsx       # Downloads full report as JSON
    │   │
    │   └── ui/
    │       ├── Navbar.tsx             # Site header with theme toggle
    │       ├── ThemeToggle.tsx        # Dark/light mode button
    │       ├── Markdown.tsx           # react-markdown with editorial styling
    │       ├── StatusBadge.tsx        # Reusable colored badge
    │       └── SkeletonCard.tsx       # Loading placeholder
    │
    ├── hooks/
    │   ├── useSSE.ts                  # POST-based SSE parser (EventSource is GET-only)
    │   ├── useInvestigation.ts        # State machine: idle → running → complete/error
    │   └── useTheme.ts                # Dark/light toggle + localStorage persistence
    │
    ├── lib/
    │   ├── types.ts                   # TypeScript interfaces — mirror backend Pydantic models exactly
    │   ├── api.ts                     # fetch wrapper + backend URL from env
    │   └── utils.ts                   # cn(), formatPercent(), truncate()
    │
    ├── next.config.ts                 # Rewrites /api/* → FastAPI (dev + prod proxy)
    ├── tailwind.config.ts
    └── package.json
```

---

## Architecture Deep Dive

### Agent Pipeline

The three agents are LangGraph nodes wired in a linear graph. LangGraph handles the execution and streams both token-level output (`messages` mode) and structured state updates (`updates` mode) simultaneously.

**Agent 1 — Content Analyst**

- Sends the full article to Gemini with a strict system prompt
- Extracts 3–7 independently verifiable factual claims (one per line, no bullets)
- Deduplicates claims using TF-IDF cosine similarity (drops if > 70% similar to an existing claim)
- Falls back to the first 2 sentences of the article if no claims are found (`fallback_used=true`)
- Runs `GeographyDetector` on the combined article + claims text to identify the region

**Agent 2 — Research Agent**

- Searches Tavily for each claim independently (max 4 claims to stay within rate limits)
- 4-level query cascade — tries the next level if fewer than 3 results have relevance > 0.25:
  1. Full claim + region + named entities
  2. First 8 words of claim only
  3. Top 3 nouns + "fact check verification"
  4. First 2 sentences of original article (topic discovery)
- Also runs one `search_related()` call to find related coverage on the topic
- Scores relevance per result: `0.6 × TF-IDF cosine + 0.4 × difflib sequence ratio`
- Classifies each result as corroborates / contradicts / neutral via a fast Gemini call

**Agent 3 — Forensic Judge**

- Streams a structured markdown report to the browser in real time (Key Claims → Evidence Review → Credibility Audit → Final Verdict)
- After the stream completes, makes a second non-streaming Gemini call to extract a clean JSON verdict: `{ verdict, summary, corroborating_count, contradicting_count }`
- This two-pass approach eliminates fragile regex parsing of free text

### Confidence Formula

The confidence score is geography-independent and built from four signals:

```
confidence = 0.35 × corroboration_score
           + 0.25 × mean_relevance
           + 0.25 × top5_weighted_credibility
           + 0.15 × claim_coverage

corroboration_score = clamp(0,1, ((corroborating - 0.5×contradicting) / total + 1) / 2)
top5_weighted_credibility = weighted average of top 5 sources by credibility (weights: 5,4,3,2,1)
claim_coverage = claims_with_evidence / claims_extracted

Label:  ≥ 0.70 → High  |  ≥ 0.45 → Medium  |  < 0.45 → Low
```

### SSE Streaming Protocol

The frontend uses a `fetch`-based SSE parser (not `EventSource`, which is GET-only). Events arrive as `text/event-stream` and are dispatched to the `useInvestigation` state machine:

| Event | Payload | Frontend action |
|---|---|---|
| `connected` | `{}` | — |
| `agent_start` | `{ agent, label }` | Sets `currentAgent` |
| `token` | `{ text, agent }` | Appends to `agentTokens[agent]` |
| `evidence` | `{ items: EvidenceItem[] }` | Updates evidence list |
| `related_articles` | `{ items: EvidenceItem[] }` | Updates related list |
| `diagnostics` | `DiagnosticsPayload` | Stores diagnostics |
| `verdict` | `VerdictPayload` | Transitions state to `complete` |
| `done` | `{}` | — |
| `error` | `{ message }` | Transitions state to `error` |

### Geography Detection

`geography.json` is the single source of truth for all region configuration — no geography logic is hardcoded in Python. Each region entry contains:
- `markers` — text patterns that indicate the region (e.g. `" ncb "`, `" delhi "`)
- `trusted_domains` — credibility bonus sources for this region
- `tld_patterns` — TLD hints (e.g. `.in`, `.co.uk`)
- `exclude_false_positives` — strings to strip before matching (e.g. `"indianapolis"` before checking for `" india "`)

To add a new region, add one entry to `geography.json` — no Python changes needed.

### Search Cache

Tavily results are cached in a `TTLCache` (default: 30-minute TTL, 256 entries) stored in `app.state.cache`. The cache key is an MD5 hash of `(query, max_results, include_domains, days)`. Cache hits skip the Tavily API call entirely.

---

## API Reference

### `GET /api/health`

Returns backend status and active model.

**Response:**
```json
{
  "status": "ok",
  "model": "gemini-2.0-flash",
  "cache_ttl_seconds": 1800
}
```

---

### `POST /api/investigate`

Streams a forensic investigation as Server-Sent Events.

**Request body:**
```json
{
  "text": "The article or headline text to investigate",
  "session_id": null
}
```

| Field | Type | Constraints |
|---|---|---|
| `text` | string | 10–15,000 characters, stripped of leading/trailing whitespace |
| `session_id` | string \| null | Optional, reserved for future use |

**Response:** `Content-Type: text/event-stream`

Events arrive in this order:

```
event: connected
data: {}

event: agent_start
data: {"agent": "content_analysis", "label": "Content Analyst"}

event: token
data: {"text": "...", "agent": "content_analysis"}

event: agent_start
data: {"agent": "source_credibility", "label": "Research Agent"}

event: evidence
data: {"items": [...]}

event: agent_start
data: {"agent": "reasoning_verdict", "label": "Forensic Judge"}

event: token
data: {"text": "...", "agent": "reasoning_verdict"}

event: related_articles
data: {"items": [...]}

event: diagnostics
data: {"detected_geography": "india", "geography_confidence": 0.8, ...}

event: verdict
data: {"verdict": "Real", "confidence": 0.74, "confidence_label": "High", ...}

event: done
data: {}
```

**Error responses:**
- `422 Unprocessable Entity` — text too short, too long, or missing
- `event: error` mid-stream — pipeline failed after the stream started (HTTP 200 already sent)

**Example — curl:**
```bash
curl -N -X POST http://localhost:8000/api/investigate \
  -H "Content-Type: application/json" \
  -d '{"text": "The government announced a new policy on renewable energy subsidies."}'
```

**VerdictPayload schema:**
```typescript
{
  verdict: "Real" | "Fake" | "Suspicious" | "Inconclusive"
  confidence: number            // 0.0–1.0
  confidence_label: "High" | "Medium" | "Low"
  summary: string               // 1-sentence explanation
  corroborating_count: number
  contradicting_count: number
  claim_verification_rate: number  // fraction of claims with evidence
}
```

**EvidenceItem schema:**
```typescript
{
  claim: string          // which claim this evidence addresses
  title: string
  url: string
  domain: string
  content: string        // article snippet
  score: number          // raw Tavily score
  relevance: number      // 0.0–1.0 (TF-IDF + difflib)
  credibility: number    // 0.0–1.0 (domain trust)
  published_date: string | null
  fallback_level: number // 0=primary query, 1=relaxed, 2=topic, 3=related
}
```

---

## Running Tests

```bash
cd backend
source .venv/bin/activate

# All tests
pytest tests/ -v

# Unit tests only — pure logic, no API calls, very fast
pytest tests/unit/ -v

# Integration tests — API calls are mocked via pytest fixtures
pytest tests/integration/ -v

# A specific test file
pytest tests/unit/test_relevance.py -v

# With coverage report
pytest tests/ --cov=app --cov-report=term-missing
```

Unit tests cover: relevance scoring, geography detection, confidence formula, query builder, cache key generation.

Integration tests cover: SSE event ordering, verdict JSON validity, request validation (422 errors), end-to-end pipeline with mocked Tavily and Gemini.

---

## Deployment

### Environment variables to update for production

```env
# Allow your production frontend domain
CORS_ORIGINS=https://yourdomain.com

# Set to WARNING or ERROR in production
LOG_LEVEL=WARNING
```

### Backend (FastAPI)

Run with `uvicorn` behind a reverse proxy (nginx, Caddy, etc.):

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
```

> **Note:** Use `--workers 1`. The in-memory `TTLCache` is not shared across processes. For multi-worker deployments, replace `SearchCache` with Redis.

**With Gunicorn + uvicorn workers:**
```bash
gunicorn app.main:app -k uvicorn.workers.UvicornWorker --workers 1 --bind 0.0.0.0:8000
```

### Frontend (Next.js)

```bash
cd frontend
npm run build
npm start           # serves on port 3000
```

For static hosting (Vercel, Netlify), set the `NEXT_PUBLIC_API_URL` environment variable to your backend URL. The `next.config.ts` proxy rewrite will forward `/api/*` requests there.

### SSE and proxies

If you put nginx in front, SSE requires specific headers to disable buffering:

```nginx
location /api/investigate {
    proxy_pass http://localhost:8000;
    proxy_buffering off;
    proxy_cache off;
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    chunked_transfer_encoding on;
}
```
