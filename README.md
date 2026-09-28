<div align="center">
  <img src="apps/mobile/assets/icon.png" width="112" alt="ParentPulse app icon" />
  <h1>ParentPulse</h1>
  <p><strong>Private, coordinated eldercare for families, caregivers, and doctors.</strong></p>
  <p>
    <img alt="Expo SDK 57" src="https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo" />
    <img alt="React Native 0.86" src="https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react" />
    <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-async-009688?logo=fastapi" />
    <img alt="TypeScript strict" src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript" />
  </p>
</div>

ParentPulse combines medical records, medicines, appointments, health measurements, family tasks, expenses, emergency information, secure doctor briefs, and nearby healthcare in one mobile-first care workspace.

> ParentPulse organizes health information. It does not diagnose, prescribe, or replace a qualified medical professional.

## Product experience

<div align="center">
  <img src="apps/mobile/assets/walkthrough/walkthrough_care.jpg" width="30%" alt="Family care coordination" />
  <img src="apps/mobile/assets/walkthrough/walkthrough_doctor.jpg" width="30%" alt="Doctor brief sharing" />
  <img src="apps/mobile/assets/walkthrough/walkthrough_maps.jpg" width="30%" alt="Nearby healthcare" />
</div>

The Expo application uses responsive glass surfaces, safe-area-aware navigation, senior mode, large touch targets, haptics, native reminders, animated full-screen flows, and downward-dismissable sheets. Android, iOS, and web share the same typed application layer.

## Production foundations implemented

| Area | Implementation |
| --- | --- |
| Authentication | Supabase email signup/sign-in, account recovery, refresh-token rotation, strict JWT verification, and hardware-backed secure session storage |
| Authorization | Family membership and per-capability checks for document, medicine, appointment, and doctor-share mutations |
| Production data | Authenticated startup loads the current user, family memberships, parent profiles, and every care domain from the API; unavailable services show explicit empty/error states instead of sample records |
| Offline writes | An ordered mutation queue retries user-entered writes after connectivity or authentication changes without substituting clinical data |
| Medical vault | Camera, gallery, and file uploads; MIME/size validation; private Supabase Storage; real Gemini multimodal extraction; processing/failure/retry states; signed original downloads |
| Secure sharing | Server-issued scoped tokens, actual encoded QR codes, expiry, access counts, and immediate revocation |
| Reminders | Native daily medicine reminders and appointment reminders at 24 hours and 2 hours, enabled through explicit permission UI |
| Emergency delivery | Durable family SOS events, per-device Expo Push registration, high-priority alerts, actionable acknowledgements, explicit resolution, and honest provider-ticket reporting |
| Data integrity | Collision-resistant UUIDs, production configuration validation, private storage paths, and family-bound Storage/RLS policies |
| UI | Premium vault and sharing experiences, full-screen AI assistant, stable bottom navigation, back icons, glassmorphic surfaces, and predictable swipe dismissal |

The application contains no bundled family or clinical records. New accounts start with an empty care circle, and onboarding only completes after the production API persists the family and parent profile. See [FEATURE_STATUS.md](FEATURE_STATUS.md) for the evidence-based completion audit and remaining work.

Production API: [https://parentpulse-yjnj.onrender.com](https://parentpulse-yjnj.onrender.com). The `/health` endpoint was verified healthy with `environment: production` on 2026-09-27. Render free instances can require a cold start before the first response.

## Architecture

```text
Expo / React Native
  ├─ SecureStore session
  ├─ AsyncStorage state + mutation queue
  ├─ Native notifications
  └─ REST / multipart upload
             │
             ▼
FastAPI async API
  ├─ Supabase Auth / PostgreSQL / private Storage
  ├─ Gemini multimodal document extraction
  ├─ Pinecone family-scoped retrieval
  ├─ Google Maps / Places
  └─ Upstash Redis
```

```text
ParentPulse/
├── apps/mobile/              Expo SDK 57 application
├── backend/                  FastAPI API, services, tests, and Supabase migrations
├── packages/shared-types/    Shared domain contracts
├── FEATURES.md               Product specification
├── FEATURE_STATUS.md         Verified implementation audit
└── docker-compose.yml        Local infrastructure
```

## Requirements

- Node.js 22.13 or newer and npm
- Python 3.11 or newer
- A Supabase project for authenticated, persistent workflows
- Android Studio/emulator, iOS development environment, or an Expo development build
- Gemini, Maps, Pinecone, and Upstash credentials for their respective production integrations

Remote push notifications require a development/store build and platform notification credentials. Local reminders work through `expo-notifications`; remote Android push is not available in Expo Go on current SDKs.

Run `eas init` for the production Expo project, configure APNs/FCM credentials, and use a development or store build. The app obtains the EAS project ID from the signed build configuration; it does not embed a placeholder project identifier.

## Mobile setup

```powershell
npm install
Copy-Item apps/mobile/.env.example apps/mobile/.env
npm run dev:mobile
```

Configure public mobile values:

```dotenv
EXPO_PUBLIC_API_URL=https://parentpulse-yjnj.onrender.com/api/v1
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_restricted_client_key
EXPO_PUBLIC_SHARE_BASE_URL=https://your-doctor-portal.example/share/brief
```

For an Android emulator, use `http://10.0.2.2:8000/api/v1`. A physical device must be able to reach the backend over the local network or HTTPS.

`EXPO_PUBLIC_` values are embedded into the client. Never put service-role, database, AI, or signing secrets in the mobile environment file.

After adding native dependencies, create a development build:

```powershell
cd apps/mobile
npx expo run:android
# or: npx eas-cli@latest build --profile development
```

## Backend setup

```powershell
Copy-Item backend/.env.example backend/.env
python -m venv backend/.venv
backend\.venv\Scripts\python -m pip install -r backend/requirements.txt
npm run dev:backend
```

Apply every SQL migration in `backend/supabase/migrations/` in filename order. The latest migrations add durable expenses/insurance and remove the former fixed development identities. Production migration execution never applies seed data. Configure at minimum:

```dotenv
ENVIRONMENT=production
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
SUPABASE_JWKS_URL=https://YOUR_PROJECT.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_DB_URL=postgresql+asyncpg://...
GEMINI_API_KEY=...
PINECONE_API_KEY=...
GOOGLE_MAPS_API_KEY=...
```

Staging and production startup fail when required Supabase or external-provider values are missing, mocked, or invalid.

### Deploying the current release to Render

Before redeploying the API, apply these new migrations to the same Supabase project used by Render:

```text
202609270004_harden_medical_storage.sql
202609270005_push_and_sos.sql
202609270006_persistent_expenses.sql
202609270007_remove_development_seed.sql
```

Migration `007` removes only the former fixed development family and the three exact development identities defined by both ID and known email. It does not broadly delete user data. Then deploy the current backend commit, verify `GET /health`, and create a new EAS build so the embedded `EXPO_PUBLIC_API_URL` points to the production API.

The migration runner now records applied filenames and safely baselines installations created before migration tracking was introduced:

```powershell
cd backend
.venv\Scripts\python scripts\run_migrations.py
```

API documentation:

- Swagger: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health: `http://localhost:8000/health`

## Medical-document lifecycle

1. The authenticated mobile client sends a multipart PDF/image upload.
2. The API verifies parent access, upload permission, family ownership, MIME type, and the 20 MB application limit.
3. The original is stored in the private `medical-documents` bucket under `<family>/<parent>/<random>-<safe-name>`.
4. A database record is returned with `pending` status.
5. Gemini receives the actual file bytes and returns factual JSON extraction. Unknown values must be omitted rather than invented.
6. The record moves through `processing` to `extracted`, or `failed` with an explicit retry action.
7. Originals open only through short-lived signed URLs.

Relevant endpoints:

- `POST /api/v1/documents/upload`
- `GET /api/v1/documents/parent/{parent_id}`
- `GET /api/v1/documents/{document_id}`
- `POST /api/v1/documents/{document_id}/retry`
- `GET /api/v1/documents/{document_id}/download-url`
- `DELETE /api/v1/documents/{document_id}`

## Emergency alert lifecycle

1. An authenticated native client registers its Expo Push token against the current user.
2. Starting SOS verifies access to the parent and creates one durable active event for that parent.
3. The API records in-app notifications and sends a high-priority push to active devices belonging to other family members.
4. Notification actions post `acknowledged` or `responding` against the event; acknowledgements are idempotent per user.
5. An authorized family member explicitly resolves the event.

Relevant endpoints:

- `POST /api/v1/push-devices`
- `DELETE /api/v1/push-devices`
- `POST /api/v1/sos`
- `POST /api/v1/sos/{event_id}/acknowledge`
- `POST /api/v1/sos/{event_id}/resolve`

An accepted Expo push ticket means the provider accepted the request. It is not evidence that the device received the message or that a person saw it. ParentPulse reports acknowledgements separately and continues to tell users to call emergency services for immediate help.

## Verification

```powershell
node_modules\.bin\tsc.cmd -p apps/mobile/tsconfig.json --noEmit
node_modules\.bin\tsc.cmd -p packages/shared-types/tsconfig.json --noEmit
backend\.venv\Scripts\python -m pytest backend/tests
cd apps/mobile
npx expo lint
npx expo-doctor
npx expo export --platform web
```

The repository currently passes mobile strict TypeScript, mobile lint, five backend tests, Expo Doctor's 21 checks, and a production web export.

## Remaining production work

- Visible per-record sync/conflict resolution controls
- Real speech recognition and voice-consent workflow
- Persistent location consent plus server-generated export/deletion jobs
- Authorization/RLS integration tests against a deployed Supabase instance
- Accessibility, penetration, recovery, observability, privacy, and store-release reviews

The npm audit currently reports moderate findings in Expo CLI build tooling through `xcode`/`uuid`. The automated force fix proposes an unsafe Expo SDK downgrade and is intentionally not applied.

## Documentation

- [Feature implementation audit](FEATURE_STATUS.md)
- [Product specification](FEATURES.md)
- [Backend architecture](BACKEND_README.md)
- [Backend service guide](backend/README.md)

## License

The mobile package includes [`apps/mobile/LICENSE`](apps/mobile/LICENSE). Confirm organization-wide licensing before external distribution.
