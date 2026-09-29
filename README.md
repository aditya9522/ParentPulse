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
| Authentication | Supabase email and native Google sign-in, account recovery, refresh-token rotation, isolated per-request Auth clients, ES256/RS256 JWKS verification, server-verified legacy sessions, and hardware-backed secure session storage |
| Authorization | Family membership and per-capability checks for document, medicine, appointment, and doctor-share mutations; owners can auditably invite, edit, and revoke individual care-circle memberships without deleting identities |
| Production data | Authenticated startup loads the current user, family memberships, parent profiles, and every care domain from the API; new accounts enter onboarding cleanly and optional service failures do not hide healthy live records |
| Offline writes | AES-GCM-encrypted, account-scoped mutation queue with atomic persistence, backoff, coalescing, visible Sync Center recovery, optimistic conflict resolution, stable client record IDs, and durable API idempotency |
| Medical vault | Camera, gallery, and file uploads; MIME/size validation; private Supabase Storage; real Gemini multimodal extraction; processing/failure/retry states; signed original downloads |
| Secure sharing | Server-issued scoped tokens, actual encoded QR codes, expiry, access counts, and immediate revocation |
| Reminders | Native daily medicine reminders and appointment reminders at 24 hours and 2 hours, enabled through explicit permission UI |
| Emergency delivery | Durable family SOS events, per-device Expo Push registration, high-priority alerts, actionable acknowledgements, explicit resolution, and honest provider-ticket reporting |
| Data integrity | Collision-resistant UUIDs, record-version concurrency checks, durable duplicate protection, production configuration validation, private storage paths, and capability-bound Storage/RLS policies |
| Account controls | Append-only versioned privacy choices, live account-wide JSON file export, deletion impact review, password re-verification, owned-circle erasure, shared-record anonymization, Supabase Auth revocation, and deleted-identity tombstones |
| Voice input | Native English/Hindi speech-to-text with separate append-only consent, OS permissions, non-persistent audio, visible listening state, and transcript review before submission |
| UI | Premium vault and sharing experiences, branded in-app feedback/dialogs, full-screen AI assistant, stable bottom navigation, back icons, glassmorphic surfaces, and predictable swipe dismissal |

The application contains no bundled family or clinical records. New accounts start with an empty care circle, and onboarding only completes after the production API persists the family and parent profile. See [FEATURE_STATUS.md](FEATURE_STATUS.md) for the evidence-based completion audit and remaining work.

Production API: [https://parentpulse-yjnj.onrender.com](https://parentpulse-yjnj.onrender.com). The `/health` endpoint was verified healthy with `environment: production` on 2026-09-27. Render free instances can require a cold start before the first response.

After authentication or API code changes, redeploy the Render backend before testing a new mobile build. The API accepts current Supabase asymmetric signing keys through JWKS and validates legacy HMAC sessions through Supabase Auth rather than treating an API key as a JWT secret.

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

The supported authentication methods are email/password and Google. Sign in with Apple is intentionally not implemented or included as a dependency. Apple Developer signing and APNs are platform requirements only when distributing the existing email/Google app to iPhone users; they do not enable Apple login.

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
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_oauth_client.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_oauth_client.apps.googleusercontent.com
EXPO_PUBLIC_SHARE_BASE_URL=https://parentpulse-yjnj.onrender.com/api/v1/sharing/doctor-brief
```

For an Android emulator, use `http://10.0.2.2:8000/api/v1`. A physical device must be able to reach the backend over the local network or HTTPS.

`EXPO_PUBLIC_` values are embedded into the client. Never put service-role, database, AI, or signing secrets in the mobile environment file.

Google authentication uses Android Credential Manager and the native iOS Google Sign-In SDK through `react-native-nitro-google-signin`. Register `com.parentpulse.app`, the EAS upload SHA-1, and the Google Play signing SHA-1 in Google Cloud; configure the same web client in Supabase Auth. The Google button is intentionally hidden when both public client IDs are not present. Production builds fail closed when either ID or the HTTPS API endpoint is missing.

## Android FCM and SOS setup

ParentPulse uses the Expo Push Service over FCM v1; the mobile app and backend registration/acknowledgement flow are already implemented. To enable Android delivery:

1. Create or open a Firebase project, add an Android app with package `com.parentpulse.app`, and download `google-services.json` into `apps/mobile/`.
2. The checked-in Expo configuration points Android builds to `./google-services.json`; keep that public Firebase app-registration file with the mobile project.
3. In Firebase **Project settings > Service accounts**, generate a private service-account JSON key. Never commit this private file.
4. From `apps/mobile`, run `npx eas-cli@latest credentials`, select **Android > production > Google Service Account > Manage ... FCM V1 > Upload a new service account key**, and upload the private JSON.
5. Create and install one Android development, preview, or store build. Expo Go cannot test remote push notifications on the current SDK.
6. In the installed app, sign in and enable notifications from Settings. This registers the device's Expo Push token with `POST /api/v1/push-devices`.

Validate SOS with two different users in the same care circle on two installed Android devices:

1. Allow notifications on both devices and open Settings once so each device is registered.
2. From device A, activate SOS for a parent. Confirm `recipients_registered` and `pushes_accepted` are non-zero.
3. With device B backgrounded or closed, confirm the high-priority emergency notification arrives.
4. Tap **I've seen this** and repeat with **I'm responding**. Confirm `POST /api/v1/sos/{event_id}/acknowledge` succeeds and the acknowledgement count increments only once per user.
5. Resolve the event and verify a second active SOS can then be created.

FCM and the Expo Push Service are no-cost, subject to Expo's service rate limits, and the current EAS free plan includes a limited monthly build allowance. iPhone delivery is optional and separately requires Apple Developer membership, an APNs key, an iOS build, and `eas credentials`; it still does not require Sign in with Apple.

Do not operate emergency delivery on a sleeping free backend. If the Render API uses a Free instance, it can spin down when idle and delay the SOS request while restarting; move the API to always-on production compute before relying on it for real users. ParentPulse remains a coordination aid, not a replacement for calling emergency services.

Voice input uses the native platform recognizer through `expo-speech-recognition`. Enabling it records a distinct `voice_input` consent event; during a rolling backend deployment, older API instances receive the same voice-specific policy version through the existing consent endpoint instead of granting microphone access from a generic AI consent. The microphone activates only after OS permission, raw audio is not persisted, and recognized text remains editable until the user explicitly sends it. Google sign-in and voice recognition both require a development, preview, or store build and do not run in Expo Go.

After adding native dependencies, create a development build:

```powershell
cd apps/mobile
npx expo run:android
# or: npx eas-cli@latest build --profile development
```

To create an Android APK that can be shared directly with testers:

```powershell
cd apps/mobile
npx eas-cli@latest build --platform android --profile preview
```

The `preview` profile uses internal distribution and embeds the production API URL. Configure `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in the EAS `preview` environment before building if live maps are required in the shared APK.

## Backend setup

```powershell
Copy-Item backend/.env.example backend/.env
python -m venv backend/.venv
backend\.venv\Scripts\python -m pip install -r backend/requirements.txt
npm run dev:backend
```

Apply every SQL migration in `backend/supabase/migrations/` in filename order. The latest migrations add durable expenses/insurance, remove former development identities, persist idempotent mutation results, harden capability-based family RLS, and add auditable account consent/deletion controls. Production migration execution never applies seed data. Configure at minimum:

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
202609280008_idempotency_records.sql
202609280009_harden_family_rls.sql
202609280010_account_controls.sql
202609290011_enforce_parent_family_integrity.sql
202609290012_voice_input_consent.sql
```

Migration `007` removes only the former fixed development family and the three exact development identities defined by both ID and known email. It does not broadly delete user data. Then deploy the current backend commit, verify `GET /health`, and create a new EAS build so the embedded `EXPO_PUBLIC_API_URL` points to the production API.

The migration runner now records applied filenames and safely baselines installations created before migration tracking was introduced:

```powershell
cd backend
.venv\Scripts\python scripts\run_migrations.py
```

After migration, run the rollback-only multi-user security matrix against the same database. It switches among temporary owner/member identities, verifies RLS isolation, capability enforcement, append-only consent, deletion boundaries, private tombstones, and cross-family integrity, then rolls every fixture back:

```powershell
cd backend
.venv\Scripts\python scripts\verify_rls_matrix.py
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

## Family access lifecycle

- Only the family owner can invite, edit, or remove care-circle members.
- The owner's membership and full access cannot be downgraded or removed.
- Role, relationship, medicine, appointment, document, doctor-share, and location-history capabilities are editable from one mobile access sheet.
- Removing a membership immediately revokes that family's records while preserving the person's Supabase account and memberships in other families.
- Permission changes and removals write security audit events without storing clinical content.

Relevant endpoints:

- `POST /api/v1/families/{family_id}/members`
- `PATCH /api/v1/families/{family_id}/members/{member_id}`
- `DELETE /api/v1/families/{family_id}/members/{member_id}`

## Account privacy controls

- Location-history and SOS-coordinate choices are stored as append-only, policy-versioned consent events. Defaults remain off when the server cannot verify a choice.
- SOS remains available without GPS consent; the API strips coordinates before persistence and delivery.
- Account export is generated from current authorized backend records, written to a JSON file in the app cache, and shared through the native file sheet. Internal storage paths, doctor-share tokens, push tokens, and document binaries are excluded.
- Account deletion requires the exact confirmation phrase plus a current password or fresh Google account selection matching the authenticated Supabase identity. Owned care circles and their stored documents are removed; memberships and private device/account data are erased. Records belonging to other families remain, with the deleted member pseudonymized for referential integrity.
- A minimal pseudonymous tombstone blocks stale JWTs or delayed provider cleanup from recreating a deleted application account.

Relevant endpoints:

- `GET /api/v1/users/me/consents`
- `PUT /api/v1/users/me/consents/{consent_type}`
- `GET /api/v1/users/me/export`
- `GET /api/v1/users/me/deletion-impact`
- `GET /api/v1/users/me/auth-methods`
- `DELETE /api/v1/users/me`

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

The current production-readiness pass has mobile strict TypeScript and lint green, 36 backend tests passing, and the configured-database rollback-only RLS matrix passing all six checks. Expo Doctor previously passed all 21 checks; rerun it after dependency or native-config changes.

## Remaining release gates

- Independent security/privacy review and penetration testing.
- Installed Android validation of native Google sign-in, refresh, sign-out, and Google-verified deletion. If an iOS release is planned, repeat this with Apple Developer signing; Sign in with Apple is outside the product scope.
- Android FCM v1 production credentials and mobile Firebase configuration are complete. A new installed artifact and two-device SOS delivery/acknowledgement validation remain; add APNs validation only when an iOS release is planned.
- Formal screen-reader, dynamic-type, reduced-motion, recovery, observability, and store-review checks.

The npm audit currently reports moderate findings in Expo CLI build tooling through `xcode`/`uuid`. The automated force fix proposes an unsafe Expo SDK downgrade and is intentionally not applied.

## Documentation

- [Feature implementation audit](FEATURE_STATUS.md)
- [Product specification](FEATURES.md)
- [Backend architecture and operations](backend/README.md)

## License

The mobile package includes [`apps/mobile/LICENSE`](apps/mobile/LICENSE). Confirm organization-wide licensing before external distribution.
