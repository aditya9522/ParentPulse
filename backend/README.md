# ParentPulse Backend Service

Production-ready asynchronous FastAPI backend powering **ParentPulse** — the remote-care family health coordination platform connecting aging parents, adult children living remotely, and attending physicians.

## Features

- **Asynchronous Architecture**: Built on FastAPI, SQLAlchemy 2.0 async, and asyncpg.
- **Supabase PostgreSQL & Storage**: Direct schema migrations under `supabase/migrations/` with Row Level Security (RLS) policies and private medical storage buckets.
- **Google Maps Platform Integration**: Healthcare discovery (nearby doctors, clinics, hospitals, pharmacies, diagnostic labs), distance & route estimates, and consent-based parent visit history.
- **AI Health Intelligence**: Gemini 1.5 Pro medical document extraction, summarization, and grounded RAG question answering with strict clinical safety disclaimers.
- **Semantic Search**: Pinecone vector embeddings filtered by authorized parent/family scopes.
- **Upstash Redis**: Response caching, rate limiting, and temporary state management.
- **Doctor Brief & QR Sharing**: Time-limited expiring access tokens with selective sharing scopes.

## Local Setup & Quickstart

### 1. Requirements
- Python 3.11+
- PostgreSQL & Redis (or run via Docker Compose)

### 2. Environment Configuration
Copy `.env.example` to `.env` and fill in credentials:
```bash
cp .env.example .env
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run Development Server
```bash
uvicorn app.main:app --reload --port 8000
```

Interactive API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 5. Running Tests
```bash
pytest
```
