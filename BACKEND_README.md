# ParentPulse Backend

This document defines the proposed backend architecture for ParentPulse. The backend uses FastAPI and asynchronous APIs to support family health profiles, medical documents, medicines, appointments, secure sharing, AI search, notifications, and Google Maps healthcare discovery.

## Technology stack

| Area | Technology | Purpose |
| --- | --- | --- |
| API framework | FastAPI | Async REST APIs, validation, dependency injection, and OpenAPI documentation |
| Application server | Uvicorn | ASGI server for local and production deployments |
| Primary database | Supabase PostgreSQL | Relational application and healthcare data |
| Authentication | Supabase Auth | Email/password and Google authentication |
| File storage | Supabase Storage | Medical documents, reports, and generated files |
| Database access | SQLAlchemy async + asyncpg | Async PostgreSQL queries and transactions |
| Schema management | Supabase SQL migrations | Database schema changes without Alembic |
| Cache | Upstash Redis | Response caching, rate limits, temporary state, and idempotency |
| Vector database | Pinecone | Medical-document embeddings and semantic retrieval |
| AI | Gemini API | Extraction, summarization, structured output, and grounded assistance |
| Maps | Google Maps Platform | Nearby healthcare search, place details, distance, routes, and geocoding |
| Configuration | Pydantic `BaseSettings` | Typed environment configuration and validation |
| HTTP client | HTTPX | Async calls to external APIs |
| Testing | Pytest + async test client | Unit, integration, and API tests |

## Architecture principles

- All network and database operations should be asynchronous.
- Routers handle HTTP concerns; business logic belongs in services.
- CRUD modules contain focused persistence operations.
- Schemas validate API input and output; models represent database tables.
- External providers are accessed through replaceable service adapters.
- Sensitive health and location data must use explicit authorization checks.
- Configuration comes from environment variables and is validated at startup.
- Secrets must never be committed to the repository.
- Slow AI and document-processing work should run outside request handlers.
- API responses should use consistent success and error structures.
- Database schema changes are managed by Supabase SQL, not Alembic.

## Suggested folder structure

```text
backend/
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── dependencies.py
│   │   └── v1/
│   │       ├── api.py
│   │       └── endpoints/
│   │           ├── auth.py
│   │           ├── users.py
│   │           ├── families.py
│   │           ├── parents.py
│   │           ├── caregivers.py
│   │           ├── doctors.py
│   │           ├── documents.py
│   │           ├── medicines.py
│   │           ├── appointments.py
│   │           ├── measurements.py
│   │           ├── timeline.py
│   │           ├── maps.py
│   │           ├── locations.py
│   │           ├── sharing.py
│   │           ├── notifications.py
│   │           ├── search.py
│   │           ├── ai.py
│   │           └── admin.py
│   ├── core/
│   │   ├── config.py
│   │   ├── constants.py
│   │   ├── exceptions.py
│   │   ├── logging.py
│   │   ├── security.py
│   │   └── permissions.py
│   ├── db/
│   │   ├── base.py
│   │   ├── session.py
│   │   └── repositories.py
│   ├── models/
│   │   ├── user.py
│   │   ├── family.py
│   │   ├── family_member.py
│   │   ├── parent_profile.py
│   │   ├── caregiver.py
│   │   ├── doctor.py
│   │   ├── document.py
│   │   ├── medicine.py
│   │   ├── appointment.py
│   │   ├── measurement.py
│   │   ├── timeline_event.py
│   │   ├── saved_place.py
│   │   ├── location_visit.py
│   │   ├── share.py
│   │   ├── notification.py
│   │   ├── task.py
│   │   └── audit_log.py
│   ├── schemas/
│   │   ├── common.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── family.py
│   │   ├── parent.py
│   │   ├── caregiver.py
│   │   ├── doctor.py
│   │   ├── document.py
│   │   ├── medicine.py
│   │   ├── appointment.py
│   │   ├── measurement.py
│   │   ├── timeline.py
│   │   ├── map.py
│   │   ├── location.py
│   │   ├── sharing.py
│   │   ├── search.py
│   │   └── ai.py
│   ├── crud/
│   │   ├── base.py
│   │   ├── users.py
│   │   ├── families.py
│   │   ├── parents.py
│   │   ├── documents.py
│   │   ├── medicines.py
│   │   ├── appointments.py
│   │   ├── timeline.py
│   │   ├── locations.py
│   │   ├── sharing.py
│   │   └── audit_logs.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── family_service.py
│   │   ├── document_service.py
│   │   ├── storage_service.py
│   │   ├── medicine_service.py
│   │   ├── appointment_service.py
│   │   ├── timeline_service.py
│   │   ├── maps_service.py
│   │   ├── location_service.py
│   │   ├── cache_service.py
│   │   ├── pinecone_service.py
│   │   ├── embedding_service.py
│   │   ├── gemini_service.py
│   │   ├── rag_service.py
│   │   ├── sharing_service.py
│   │   ├── notification_service.py
│   │   └── audit_service.py
│   ├── clients/
│   │   ├── supabase.py
│   │   ├── upstash.py
│   │   ├── pinecone.py
│   │   ├── gemini.py
│   │   └── google_maps.py
│   ├── helpers/
│   │   ├── document_parser.py
│   │   ├── prompt_builder.py
│   │   ├── pagination.py
│   │   └── response_builder.py
│   ├── utils/
│   │   ├── dates.py
│   │   ├── files.py
│   │   ├── hashing.py
│   │   ├── identifiers.py
│   │   ├── text.py
│   │   └── validators.py
│   ├── middleware/
│   │   ├── correlation_id.py
│   │   ├── error_handler.py
│   │   ├── request_logging.py
│   │   └── security_headers.py
│   └── workers/
│       ├── document_worker.py
│       ├── embedding_worker.py
│       └── notification_worker.py
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 202609260001_initial_schema.sql
│   │   ├── 202609260002_row_level_security.sql
│   │   └── 202609260003_storage_policies.sql
│   └── seed.sql
├── tests/
│   ├── conftest.py
│   ├── unit/
│   ├── integration/
│   └── api/
├── scripts/
│   ├── bootstrap.py
│   ├── seed_development.py
│   └── reindex_documents.py
├── .env.example
├── .gitignore
├── Dockerfile
├── pyproject.toml
└── README.md
```

## Responsibility of each layer

### Routers and endpoints

Routers define URLs, status codes, dependencies, request schemas, and response schemas. They should not contain database queries or provider-specific logic.

### Services

Services coordinate business rules and workflows. For example, `document_service.py` can upload a file, create its database record, enqueue extraction, store embeddings, update the health timeline, and write an audit event.

### CRUD

CRUD modules perform reusable database operations. They receive an async database session and should not know about FastAPI requests, Gemini, Pinecone, Redis, or Google Maps.

### Models

Models define SQLAlchemy mappings for Supabase PostgreSQL tables. Database constraints, indexes, triggers, RLS policies, and extensions remain defined in Supabase SQL migrations.

### Schemas

Pydantic schemas validate requests, responses, filters, pagination, and structured AI results. Separate create, update, internal, and response schemas where fields differ.

### Clients

Clients provide low-level access to external systems. They configure authentication, timeouts, retries, and connection reuse without adding application business rules.

### Helpers and utilities

- Helpers support a specific application workflow, such as building a Gemini prompt or parsing a medical document.
- Utilities are small provider-independent functions, such as date formatting, hashing, and filename validation.

## Configuration with BaseSettings

Use `pydantic-settings` to load and validate all configuration once. Import the cached settings dependency instead of reading environment variables throughout the application.

```python
# app/core/config.py
from functools import lru_cache
from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ParentPulse API"
    environment: Literal["local", "test", "staging", "production"] = "local"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    allowed_origins: list[str] = []

    supabase_url: str
    supabase_publishable_key: SecretStr
    supabase_secret_key: SecretStr
    supabase_jwks_url: str
    supabase_db_url: SecretStr

    upstash_redis_rest_url: str
    upstash_redis_rest_token: SecretStr

    pinecone_api_key: SecretStr
    pinecone_index_name: str
    pinecone_namespace: str = "parentpulse"

    gemini_api_key: SecretStr
    gemini_model: str
    embedding_model: str

    google_maps_api_key: SecretStr

    access_token_audience: str = "authenticated"
    request_timeout_seconds: float = 20.0
    cache_default_ttl_seconds: int = 300
    max_upload_size_mb: int = 20

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

Do not log `SecretStr` values or return configuration in an API response.

## Environment variables

Create a local `.env` from `.env.example`:

```dotenv
APP_NAME=ParentPulse API
ENVIRONMENT=local
DEBUG=true
API_V1_PREFIX=/api/v1
ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:8081"]

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace-me
SUPABASE_SECRET_KEY=sb_secret_replace-me
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_DB_URL=postgresql+asyncpg://user:password@host:5432/postgres

UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=replace-me

PINECONE_API_KEY=replace-me
PINECONE_INDEX_NAME=parentpulse-documents
PINECONE_NAMESPACE=parentpulse

GEMINI_API_KEY=replace-me
GEMINI_MODEL=replace-with-selected-model
EMBEDDING_MODEL=replace-with-selected-model

GOOGLE_MAPS_API_KEY=replace-me

REQUEST_TIMEOUT_SECONDS=20
CACHE_DEFAULT_TTL_SECONDS=300
MAX_UPLOAD_SIZE_MB=20
```

Use separate projects, credentials, Pinecone namespaces, and Redis instances for development, testing, staging, and production.

## FastAPI application setup

Use an application lifespan to initialize reusable clients and close them cleanly.

```python
# app/main.py
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1.api import api_router
from app.core.config import get_settings


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize shared HTTP, database, Redis, Pinecone,
    # Gemini, and Google Maps clients here.
    yield
    # Close shared clients and database connections here.


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
)
app.include_router(api_router, prefix=settings.api_v1_prefix)
```

## Async database access

Connect SQLAlchemy's async engine to the Supabase PostgreSQL connection string. Use one `AsyncSession` per request and keep transaction boundaries explicit.

```python
# app/db/session.py
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings


settings = get_settings()
engine = create_async_engine(
    settings.supabase_db_url.get_secret_value(),
    pool_pre_ping=True,
)
AsyncSessionFactory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db_session() -> AsyncIterator[AsyncSession]:
    async with AsyncSessionFactory() as session:
        yield session
```

Avoid synchronous database drivers and blocking calls inside async endpoints.

## Async provider clients

Every I/O integration should expose awaitable methods:

- Use SQLAlchemy `AsyncSession` with `asyncpg` for PostgreSQL.
- Use the asynchronous Supabase client for Auth or Storage operations.
- Reuse a shared `httpx.AsyncClient` for REST integrations.
- Use `upstash_redis.asyncio.Redis` for Upstash commands.
- Install Pinecone's asyncio extra and use `PineconeAsyncio`/`IndexAsyncio`.
- Use the Gemini SDK's asynchronous client through `gemini_service.py`.
- Call Google Maps web services through the shared async HTTP client.

Initialize long-lived clients in the FastAPI lifespan and close them at shutdown. If a required library exposes only a blocking method, run that work in a bounded worker thread or background worker instead of blocking the event loop.

## Supabase without Alembic

This project does not use Alembic.

Database changes should be written as versioned SQL files under `supabase/migrations/` and applied through the Supabase development and deployment workflow. SQL migrations should manage:

- Tables, relationships, constraints, and indexes
- PostgreSQL enums and extensions
- Triggers and database functions
- Row Level Security policies
- Storage buckets and access policies
- Seed data required by an environment

Keep SQLAlchemy models synchronized with the applied Supabase schema. Every schema change should include its SQL migration, model updates, schema updates, and relevant tests in the same change.

## Supabase authentication and authorization

- The client signs in with email/password or Google through Supabase Auth.
- FastAPI receives the bearer access token.
- A dependency verifies the token signature with the project's cached JWKS, validates issuer, audience, and expiry, and loads the current user claims.
- Permission dependencies verify family membership, parent access, and role capabilities.
- Supabase RLS provides a second protection layer for requests made with the user's Supabase authorization context.
- The Supabase secret key is backend-only and must never be sent to a mobile or web client.
- Admin, secret-key, and other RLS-bypassing operations must be isolated and create audit events.

Direct SQLAlchemy connections must use an intentionally restricted database role wherever possible. If a privileged database connection is used, RLS may be bypassed; application permission checks then become mandatory and must be covered by access-boundary tests.

Authorization must be checked for every parent profile, document, appointment, medicine, map visit, and shared record. Knowing an object ID must never be sufficient to access it.

## Upstash Redis cache

Use Upstash Redis for data that is safe to recreate:

- Nearby-place search results
- Google place details and route estimates
- Frequently requested non-sensitive reference data
- Rate-limit counters
- Request idempotency keys
- Short-lived job status
- Revoked share-link or session state

Recommended key patterns:

```text
maps:nearby:{geohash}:{category}:{radius}:{page}
maps:place:{place_id}
maps:route:{origin_hash}:{destination_place_id}:{mode}
rate_limit:{user_id}:{route}:{window}
idempotency:{user_id}:{request_key}
job:{job_id}:status
```

Cache entries must have a TTL. Do not place raw medical documents, complete AI prompts, access tokens, or unnecessary personal health information in Redis.

## Pinecone and semantic search

Pinecone stores embeddings for authorized medical-document chunks and health records. PostgreSQL remains the source of truth.

Suggested vector metadata:

```json
{
  "family_id": "uuid",
  "parent_id": "uuid",
  "document_id": "uuid",
  "chunk_id": "uuid",
  "document_type": "lab_report",
  "document_date": "2026-09-26",
  "visibility_scope": "family"
}
```

The retrieval flow should:

1. Authenticate the user.
2. Resolve the parent profiles and documents the user may access.
3. Build a Pinecone metadata filter from those permissions.
4. Retrieve a limited number of relevant chunks.
5. Re-check document authorization in PostgreSQL.
6. Pass only the authorized context to Gemini.
7. Return an answer with references to the source records.

Never trust a family or parent identifier supplied by the client without an authorization check.

## Gemini integration

Use Gemini for bounded tasks such as:

- Medical-document text extraction
- Structured prescription and report fields
- Document, consultation, and hospitalization summaries
- Health-timeline event suggestions
- Search-query rewriting
- Grounded answers from retrieved records

Use Pydantic schemas for structured results, validate every response, and retain the source record for traceability. The AI must not independently diagnose a condition or prescribe treatment.

AI requests should include:

- A clear task-specific system instruction
- Only the minimum required health context
- A structured output schema where applicable
- Safety boundaries and refusal rules
- Source identifiers used for the result

Do not send secrets, access tokens, unrelated family records, or unnecessary personal information to the model.

## Google Maps integration

Keep Google Maps calls in `clients/google_maps.py` and business rules in `services/maps_service.py`.

Supported backend capabilities include:

- Search nearby doctors, clinics, hospitals, pharmacies/medical stores, laboratories, and emergency services
- Search from the current location, home address, or selected map area
- Retrieve place details, opening hours, ratings, and contact information
- Calculate distance and estimated travel time
- Support available travel modes
- Geocode typed addresses and reverse-geocode coordinates
- Save a selected place to an appointment or timeline event
- Record a parent-confirmed healthcare visit
- Display authorized visited locations on the map

Example routes:

```text
GET    /api/v1/maps/nearby
GET    /api/v1/maps/places/{place_id}
POST   /api/v1/maps/distance
POST   /api/v1/maps/geocode
POST   /api/v1/parents/{parent_id}/locations/visits
GET    /api/v1/parents/{parent_id}/locations/visits
PATCH  /api/v1/parents/{parent_id}/locations/visits/{visit_id}
DELETE /api/v1/parents/{parent_id}/locations/visits/{visit_id}
```

Nearby search and route responses can be cached briefly in Redis. Location visit history belongs in PostgreSQL and must not be treated as a cache-only record.

Location collection must be opt-in. Store the consent time and purpose, permit deletion, and do not collect background location unless a separately approved feature requires it.

Restrict Google Maps API keys by environment, application, platform, and enabled API. A server key must not be bundled into the mobile app.

## Document-processing workflow

```text
Upload request
    -> validate file and authorization
    -> upload to private Supabase Storage bucket
    -> create PostgreSQL document record
    -> enqueue processing job
    -> extract text and structured fields
    -> split and embed authorized content
    -> upsert vectors to Pinecone
    -> update document status
    -> create timeline suggestions
    -> notify authorized family members
```

Do not keep an API request open while performing large OCR, extraction, or embedding jobs. Return an accepted response with a job identifier and expose a status endpoint or notification.

## API design

Use a versioned prefix:

```text
/api/v1
```

Example resource routes:

```text
/auth
/users
/families
/parents
/caregivers
/doctors
/documents
/medicines
/appointments
/measurements
/timeline
/maps
/locations
/sharing
/notifications
/search
/ai
/admin
```

API guidelines:

- Use nouns for resources and HTTP methods for actions.
- Use cursor or page-based pagination consistently.
- Support filtering and sorting through validated query schemas.
- Return UTC timestamps in ISO 8601 format.
- Use idempotency keys for retryable create operations.
- Add a correlation ID to logs and error responses.
- Do not expose provider exceptions or internal stack traces.

Example success response:

```json
{
  "data": {},
  "meta": {
    "request_id": "uuid"
  }
}
```

Example error response:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource was not found.",
    "details": null,
    "request_id": "uuid"
  }
}
```

## Error handling and retries

- Convert application exceptions to consistent HTTP responses in middleware.
- Set explicit connect, read, write, and pool timeouts for external requests.
- Retry only transient failures and use exponential backoff with jitter.
- Do not automatically retry non-idempotent operations without an idempotency key.
- Add circuit-breaking or temporary provider suppression when repeated failures occur.
- Log provider name, latency, status, and correlation ID without logging secrets or health content.

## Security and privacy

- Use private Supabase Storage buckets and short-lived signed URLs.
- Enforce Row Level Security and server-side authorization.
- Encrypt all traffic in transit.
- Restrict service credentials to the backend environment.
- Validate file type, size, extension, and content before processing uploads.
- Rate-limit authentication, AI, sharing, and map endpoints.
- Audit access to health records, documents, shares, and location history.
- Minimize data sent to Gemini, Pinecone, Redis, logs, and analytics.
- Support access revocation and permanent data deletion.
- Keep production health information out of local development and test fixtures.

## Logging and observability

Use structured logs containing:

- Timestamp and severity
- Environment and service name
- Correlation/request ID
- User ID when appropriate
- Route, method, status, and duration
- External provider and latency
- Background job ID and status

Never log authorization headers, API keys, document contents, AI prompts containing health data, precise location history, or raw database credentials.

## Testing strategy

### Unit tests

- Services and business rules
- Permission checks
- Pydantic schema validation
- Cache-key generation
- Prompt and document helpers
- Provider error mapping

### Integration tests

- Supabase PostgreSQL CRUD and transactions
- RLS and storage policies
- Redis caching and expiration
- Pinecone metadata filtering
- External client adapters with mocked provider responses

### API tests

- Authentication and authorization
- Family and parent access boundaries
- Document upload lifecycle
- Medicine and appointment operations
- Map search and location-consent behavior
- AI retrieval with authorized sources only
- Error and rate-limit responses

Tests must use isolated test resources and must never call production projects.

## Local setup

1. Install a supported Python release and the project dependencies.
2. Create `.env` from `.env.example`.
3. Add development credentials for Supabase, Upstash, Pinecone, Gemini, and Google Maps.
4. Apply the Supabase SQL migrations to the development project.
5. Start the API:

```bash
uvicorn app.main:app --reload
```

6. Open the generated API documentation:

```text
http://localhost:8000/docs
```

## Deployment checklist

- Disable debug mode.
- Use production-only provider credentials.
- Configure allowed origins explicitly.
- Apply pending Supabase SQL migrations before serving new code.
- Confirm RLS and storage policies are enabled.
- Restrict all provider API keys.
- Configure request timeouts, retries, and rate limits.
- Run tests and health checks.
- Verify logs do not contain sensitive information.
- Configure backups and recovery procedures.
- Test account deletion and location-history deletion.

## Initial implementation order

1. Create configuration, logging, errors, and the FastAPI application.
2. Configure Supabase Auth, async PostgreSQL sessions, RLS, and Storage.
3. Implement users, families, parent profiles, and permissions.
4. Add documents, medicines, appointments, and the health timeline.
5. Add Upstash caching and rate limiting.
6. Add Google Maps nearby search, distance, and visit history.
7. Add document extraction with Gemini.
8. Add embeddings, Pinecone retrieval, and grounded AI answers.
9. Add secure sharing, notifications, auditing, and admin APIs.
10. Add background workers, observability, and production hardening.

This structure keeps ParentPulse modular: FastAPI coordinates the API, Supabase owns relational data and authentication, Upstash handles temporary cached state, Pinecone provides semantic retrieval, Gemini processes authorized health information, and Google Maps supports nearby healthcare and consent-based visit history.
