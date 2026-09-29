# ParentPulse Backend Service

Asynchronous FastAPI backend for ParentPulse family health coordination.

## Implemented foundations

- SQLAlchemy 2 async and asyncpg
- Supabase authentication, PostgreSQL, RLS, and private Storage
- Strict JWT audience/algorithm verification
- Family membership and capability authorization
- Validated multipart medical-document uploads
- Gemini multimodal extraction from actual PDF/image bytes
- Pinecone retrieval filtered by family and parent identifiers
- Scoped, expiring, revocable doctor-share tokens
- Durable SOS events, registered mobile push devices, actionable acknowledgements, and explicit resolution
- PostgreSQL-backed healthcare expenses and insurance policies
- Supabase Auth-backed family invitations rather than locally fabricated members
- Audited owner-only family member permission editing and membership revocation with owner self-protection
- Provider failures that fail explicitly instead of returning invented AI, map, OCR, or vector data
- Google Maps healthcare discovery and visit history
- Upstash Redis integration
- Production configuration validation that rejects mock credentials

## Local setup

```powershell
Copy-Item .env.example .env
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

API documentation:

- Swagger: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

Run tests:

```powershell
.venv\Scripts\python -m pytest -q
```

## Medical-document lifecycle

`POST /api/v1/documents/upload` accepts a PDF/image and multipart metadata. The API verifies:

- authenticated family membership;
- document-upload capability;
- parent/family ownership;
- supported MIME type;
- the configured application size limit.

The original is stored privately under `<family>/<parent>/<random>-<safe-name>`. Extraction records `pending`, `processing`, `extracted`, or `failed`; it never substitutes sample clinical content.

Lifecycle endpoints:

- `POST /api/v1/documents/upload`
- `GET /api/v1/documents/parent/{parent_id}`
- `GET /api/v1/documents/{document_id}`
- `POST /api/v1/documents/{document_id}/retry`
- `GET /api/v1/documents/{document_id}/download-url`
- `DELETE /api/v1/documents/{document_id}`

## SOS and remote notification lifecycle

The native app registers an Expo Push token with `POST /api/v1/push-devices`. Creating an SOS event verifies parent access, prevents a second active event for the same parent, records in-app notifications for family members, and submits high-priority pushes to their active devices.

Recipients can acknowledge an event as `acknowledged` or `responding`. The unique event/user constraint makes repeated notification actions idempotent. An authorized family member must explicitly resolve the active event.

- `POST /api/v1/push-devices`
- `DELETE /api/v1/push-devices`
- `POST /api/v1/sos`
- `POST /api/v1/sos/{event_id}/acknowledge`
- `POST /api/v1/sos/{event_id}/resolve`

`pushes_accepted` counts successful Expo push tickets only. It must not be presented as device delivery or human acknowledgement.

Android FCM v1 credentials are assigned to the EAS application `com.parentpulse.app`, and the Expo mobile configuration includes its matching `google-services.json`. A newly built artifact and two registered physical devices are still required to validate provider delivery and notification-action acknowledgements end to end.

## Family access lifecycle

Owners manage each membership independently through `POST`, `PATCH`, and `DELETE /api/v1/families/{family_id}/members[/{member_id}]`. Updates validate supported roles and granular capabilities, forbid owner downgrade/removal, scope the member identifier to the requested family, and write audit events. Removing a membership does not delete the Supabase identity or memberships in other care circles.

## Database and storage

Apply every migration in `supabase/migrations/`. `202609270004_harden_medical_storage.sql` hardens private medical storage; `202609270005_push_and_sos.sql` adds push and SOS state; `202609270006_persistent_expenses.sql` adds durable expenses and insurance; and `202609270007_remove_development_seed.sql` removes only the former fixed development identities. Security migrations `008` through `010` add idempotency, family RLS, consent, and deletion controls. Migration `011` rejects existing cross-family parent references and permanently enforces that every dual-scoped care record's `parent_id` belongs to its `family_id`; migration `012` adds distinct append-only consent for native voice input. A failure from an integrity migration must be investigated; never rewrite affected clinical records automatically. The migration runner serializes concurrent deployments with a PostgreSQL advisory lock, records SHA-256 checksums to detect migration drift, and never executes seed data.

The backend service role performs private uploads and creates short-lived signed URLs. Never expose the service key to the mobile app.

## Production configuration

Set `ENVIRONMENT=production` and provide real Supabase URL, publishable key, service key, JWKS URL, async database URL, Gemini key, Pinecone key, and Google Maps key. Startup fails closed if a required provider value is mocked or missing.

Gemini credentials are required for document extraction. Failed extraction leaves the original intact and exposes a retry workflow instead of inventing results.

Native Google authentication also requires the Google provider to be enabled in the Supabase dashboard with the Google Web OAuth client ID and secret. The mobile EAS environment must define `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`; production app configuration fails closed when either value or the HTTPS API URL is absent. Register `com.parentpulse.app` with the EAS and Play signing SHA-1 fingerprints as Android OAuth clients in the same Google Cloud project.

Sign in with Apple is intentionally unsupported and no Apple-auth provider or dependency is required. Apple Developer/APNs credentials are needed only if the same email/Google application will be distributed with remote notifications on iOS.
