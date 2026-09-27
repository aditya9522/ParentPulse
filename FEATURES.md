# ParentPulse

ParentPulse is a family healthcare platform that connects parents, adult children, caregivers, and doctors in one secure place. It brings together medical profiles, health records, medicines, appointments, reminders, emergency information, family-care tasks, and nearby healthcare services.

The application is designed especially for families caring for parents from another city or country. It helps family members stay informed, coordinate day-to-day care, find nearby medical support, and share only the relevant health information with a doctor.

> ParentPulse organizes and summarizes health information. It does not diagnose medical conditions, prescribe treatment, or replace professional medical advice.

## Users and roles

- Parent or patient
- Son, daughter, or other family member
- Family caregiver
- Doctor
- Administrator

Each role has separate permissions so users see only the information required for their responsibilities.

## Authentication and accounts

- Email and password sign-up and login
- Google Sign-In
- Email-based password recovery
- Logout and session management
- Device and active-session management
- Trusted-family-member account recovery
- Account and data deletion

## Core application features

### Family profiles and care coordination

- Create a separate health profile for each parent
- Connect children, spouses, siblings, and caregivers
- Invite or remove family members
- Accept or reject family invitations
- Manage relationships and access permissions
- Support multiple parents, children, and caregivers in one family
- Assign healthcare tasks to a family member or caregiver

### Parent health profile

- Personal and emergency information
- Full name, date of birth, gender, preferred language, address, and contact details
- Blood group, allergies, disabilities, and chronic conditions
- Previous surgeries and family medical history
- Current treatments and important medical notes
- Emergency contacts
- Primary and emergency doctors
- Doctor specialty, hospital or clinic, address, consultation history, and contact details

### Medical documents

- Capture documents with the camera or upload them from the gallery or file manager
- Upload PDF and multi-page scanned documents
- Organize prescriptions, blood tests, X-rays, MRI and CT scans, ECGs, ultrasounds, discharge summaries, vaccination records, insurance documents, medical certificates, hospital bills, and other records
- Search, filter, preview, download, share, archive, or delete documents
- Extract text and important fields with OCR
- Automatically identify dates, doctors, medicines, and test results
- Generate medical-document, lab-report, prescription, consultation, and hospitalization summaries
- Rename, tag, sort, version, and archive documents

### Health timeline

- View doctor visits, diagnoses, medicines, reports, surgeries, hospitalizations, vaccinations, and follow-ups in chronological order
- Filter the timeline by event type
- Attach documents to individual events
- Create a concise health history for consultations

### Doctor brief and secure sharing

- Generate a consultation-ready summary containing conditions, allergies, medicines, recent reports, hospitalizations, and appointments
- Share selected records instead of the complete family account
- Create expiring, view-only links or QR codes
- Revoke access at any time
- Review document access history

### Appointment management

- Add and manage doctor appointments
- Store the doctor, hospital, date, time, appointment type, notes, and location
- View upcoming, completed, cancelled, and rescheduled appointments
- Receive one-day, two-hour, or custom reminders and follow-up notifications
- Assign transportation or appointment responsibility to a caregiver
- Attach related reports and prescriptions

### Medicine management

- Create medicine schedules with dosage and food instructions
- Store start and end dates, prescribing doctor, reason, and special instructions
- Record taken, missed, or skipped doses
- Receive dose and refill reminders
- Track medicine inventory and medication history
- Attach prescriptions
- Notify an authorized caregiver about missed medicines

### Health measurements

- Record blood pressure, blood sugar, heart rate, weight, temperature, and oxygen saturation
- View historical charts and trends
- Export measurements or share them with a doctor

## Google Maps and nearby healthcare

Google Maps helps parents and caregivers find healthcare services, plan visits, and keep an optional history of relevant places visited.

### Nearby search

- Search for nearby doctors, clinics, hospitals, pharmacies/medical stores, diagnostic laboratories, and emergency services
- Search by current location, typed address, or map area
- Filter doctors by specialty and places by category, distance, rating, or open status
- Show results as map markers and in a list
- Display the name, address, contact details, opening hours, rating, and approximate distance for each result
- Open turn-by-turn directions in Google Maps

### Distance and directions

- Calculate distance and estimated travel time from the parent's current location or home address
- Compare nearby results before choosing a location
- Support driving, walking, and other available travel modes
- Save a selected place to an appointment or health-timeline event

### Parent visit history

- Record a healthcare location when a parent checks in, confirms an appointment, or manually adds a visit
- Show visited doctors, hospitals, laboratories, and medical stores as markers on the map
- Display visit date, time, place, appointment, and related notes
- Filter visit history by parent, date range, and place type
- Let authorized family members view relevant visits on the family dashboard
- Allow users to correct or delete a recorded location

Location history is opt-in. ParentPulse must ask for location permission, explain how location data is used, and allow the parent to disable tracking or delete location history at any time. Background location should not be collected unless a future safety feature explicitly requires it and the user gives separate consent.

## Emergency features

- Emergency health card with blood group, allergies, critical conditions, medicines, contacts, and primary doctor
- Emergency profile or QR code
- One-tap emergency calling and contact actions
- SOS alerts to selected family members and caregivers
- Optional real-time location sharing during an active SOS
- Nearby hospital and emergency-service search on the map

## Family dashboard

The family dashboard provides an at-a-glance view of:

- Parent health status and recent events
- Upcoming appointments
- Medicine reminders and missed doses
- New reports and documents
- Follow-ups and assigned tasks
- Emergency alerts
- Recent healthcare visits and saved map locations

## AI health information assistant

The assistant answers questions using the family's stored and authorized health information.

Example questions:

- “What medicines does Dad currently take?”
- “Show Mom's latest blood reports.”
- “When was the last cardiology appointment?”
- “Find all prescriptions from Dr. Sharma.”
- “Which hospital did Dad visit last month?”

AI capabilities include:

- OCR and structured data extraction
- Document and consultation summaries
- Health-timeline generation
- Search across records, medicines, doctors, appointments, and bills
- Retrieval-augmented answers linked to the original records

AI responses should clearly separate stored facts from general health information and should never make independent clinical decisions.

## Accessibility and language support

- Simple, senior-friendly interface
- Large text and clear actions
- Voice input and voice-assisted search
- English, Hindi, and additional Indian regional languages
- Accessible colors and screen-reader labels

## Notifications

- Medicine and refill reminders
- Appointment and follow-up reminders
- Family invitations and assigned tasks
- New documents and reports
- Doctor-access notifications
- Emergency and missed-medicine alerts
- Daily summary of healthcare actions

## Privacy and security

- Encryption in transit and at rest
- Secure email and Google authentication
- Role-based and fine-grained access controls
- Expiring access and immediate revocation
- Audit logs and login history
- Secure document URLs
- Suspicious-login detection
- User-controlled location sharing and visit history
- Backup, export, recovery, and permanent data deletion

Users can export their profile, documents, medicine list, health timeline, map visit history, and a PDF health summary.

## Doctor portal

A web-based doctor portal can provide:

- Shared patient profiles and doctor briefs
- Authorized documents and health timelines
- Appointment and follow-up information
- Notes, prescription uploads, and document requests
- Report uploads, follow-up instructions, and access termination
- Time-limited access controlled by the patient or family

## Caregiver management

Parents can give different levels of access to each person helping with their care.

Available permissions include:

- View a parent profile
- View or upload documents
- View or manage medicines
- View or manage appointments
- Share selected information with a doctor
- View relevant map visits
- Use emergency access

For example, a child may have full access, a local caregiver may manage only appointments and medicines, and a doctor may see only shared medical records.

## Voice features

Voice support makes ParentPulse easier for older adults to use.

- Create appointments, reminders, and notes through voice input
- Ask for the next appointment or the current medicine schedule
- Retrieve a previous health measurement by speaking
- Support voice and text in the selected language

Example requests:

- “Meri kal doctor ki appointment hai.”
- “Meri next appointment kab hai?”
- “Meri kaunsi medicines morning mein hain?”

## Regional language support

Planned languages include:

- English
- Hindi
- Marathi
- Gujarati
- Tamil
- Telugu
- Bengali
- Kannada
- Malayalam
- Punjabi

## Prescription management

Doctors can create or upload a prescription containing:

- Medicine name and dosage
- Frequency and duration
- Before/after-food instructions
- Treatment notes
- Follow-up date

With the patient's approval, prescription details can automatically create a medicine schedule and reminders, reducing repeated manual entry.

## Follow-up management

- Store the next consultation date
- Add required tests and reports
- Record medicine continuation or changes
- Generate reminders automatically
- Link the follow-up to the original doctor visit and documents

## Hospitalization management

- Record hospital, doctor, admission and discharge dates, and reason for admission
- Attach reports, bills, prescriptions, and discharge summaries
- Add the hospitalization to the health timeline
- Generate a concise hospitalization summary

## Insurance management

- Store policy number, provider, coverage, documents, and expiry date
- Receive policy-renewal reminders
- Share selected insurance information when required
- Add future insurance-service integrations without making them an MVP dependency

## Family healthcare expenses

Families can record and review expenses for:

- Doctor consultations
- Medicines
- Laboratory tests
- Hospital care
- Insurance
- Home-care services

Monthly totals and category summaries help family members coordinate costs remotely.

## Medical bills and receipts

- Upload hospital, pharmacy, consultation, and laboratory receipts
- Extract the amount, date, provider, category, and patient
- Attach a receipt to an appointment, hospitalization, or expense
- Search and export previous bills

## Family communication

A health-focused family conversation keeps care updates together instead of scattering them across messaging apps.

- Discuss new reports and appointments
- Mention or notify a family member
- Link messages to a document, medicine, or task
- Keep healthcare discussions within the relevant parent profile

## Healthcare task management

- Create tasks such as booking a doctor, buying medicine, uploading a report, paying a bill, or arranging a follow-up
- Assign a task to a child, caregiver, or other authorized family member
- Add due dates, reminders, notes, and related documents
- Track pending and completed tasks

## Local caregiver and helper services

A future verified-services marketplace could help families find someone to:

- Accompany a parent to a hospital
- Collect medicine
- Arrange a home blood sample
- Help with medical documents
- Visit or assist a parent locally

This feature requires provider verification and operational support, so it is planned beyond the initial release.

## Family health reports

ParentPulse can generate a monthly family report showing:

- Doctor visits
- New reports and prescriptions
- Current medicines and missed doses
- Appointments and follow-ups
- Hospitalizations
- Completed and pending care tasks

Reports can be shared with authorized family members.

## AI monthly health summary

The application can summarize activity recorded during the month, including consultations, uploaded reports, prescription changes, follow-ups, and important recent documents. The summary describes stored records and does not make an independent diagnosis.

## Search and retrieval

Search is available across:

- Documents and reports
- Medicines and prescriptions
- Doctors and hospitals
- Appointments and follow-ups
- Health-timeline events
- Bills and expenses
- Saved and visited healthcare locations

Example searches include “Find all ECG reports,” “Show documents from 2025,” and “Find Dr. Sharma's prescriptions.”

## Account recovery

Account recovery can use:

- A verified recovery email
- A trusted family member
- Device re-verification
- Administrator-assisted recovery with identity and security checks

## Admin dashboard

The ParentPulse administration portal can manage:

- Users, families, parent profiles, and doctors
- Documents and processing status
- Subscriptions and payments
- Support tickets and reported issues
- Security events and audit records

Admin analytics can show new and active users, uploaded documents, doctor shares, appointments, retention, and subscription conversions without unnecessarily exposing sensitive health content.

## Customer support

- Help center and frequently asked questions
- In-app chat or support requests
- Account and access support
- Document-processing issue reporting
- Payment and subscription support

## Subscription and monetization

### Free plan

- One parent profile
- Basic health profile
- Limited document storage
- Basic family connection

### Premium plan

- Multiple parent profiles
- Expanded document storage
- AI extraction and summaries
- Health timeline and advanced search
- Doctor sharing and medicine reminders
- Family coordination and emergency features

### Family plan

- Multiple parents, children, and caregivers
- Shared family dashboard
- Expanded permissions and care coordination

### Doctor plan

- Patient and shared-profile management
- Authorized health timelines and documents
- Doctor briefs and AI-assisted summaries

## Product analytics

ParentPulse can measure product usage while avoiding unnecessary collection of sensitive health content. Useful events include registration completion, successful family linking, document uploads, doctor sharing, reminder usage, retention, and subscription conversion.

## Product roadmap

### MVP — Version 1

- Email/password and Google authentication
- Parent profiles and family linking
- Role-based family permissions
- Medical information, allergies, medicines, and emergency contacts
- Medical document upload, OCR, categorization, and search
- Health timeline and AI summaries
- Doctor brief and secure sharing
- Appointments and medicine reminders
- Emergency health card
- Google Maps nearby search for doctors, hospitals, medical stores, and laboratories
- Distance, travel-time estimate, directions, and saved healthcare places
- Consent-based parent healthcare visit history on the map

### Version 2

- Voice assistant and regional languages
- Health measurement charts
- Expanded family dashboard
- Doctor portal and prescription management
- Follow-up tracking and monthly health reports
- Family chat, shared tasks, and healthcare expense tracking
- Advanced map filters, appointment check-in, and caregiver visit coordination

### Version 3

- Verified local-caregiver services
- Hospital, pharmacy, laboratory, and insurance integrations
- Wearables and remote monitoring
- Teleconsultation
- Senior-care and NRI family plans
- Corporate health plans

## Suggested architecture

```text
React Native application
        |
        +-- Email/Google authentication
        +-- Family and health profiles
        +-- Documents and appointments
        +-- Medicines and notifications
        +-- Google Maps, Places, and Routes
        |
FastAPI backend
        |
        +-- Role-based authorization
        +-- Health and family services
        +-- Location consent and visit history
        +-- Secure sharing and audit logs
        |
PostgreSQL + secure object storage
        |
OCR + extraction + retrieval + summaries
```

Depending on the selected Google Maps Platform APIs, the map module may use Maps SDK, Places API, Geocoding API, and Routes API. API keys should be restricted by application, platform, and enabled API, and must never be committed to the repository.

## Product focus

ParentPulse is defined by seven connected capabilities:

1. A structured family health profile for every parent
2. Intelligent organization of medical documents
3. A chronological health timeline
4. Remote family care and task coordination
5. Doctor briefs and secure, selective sharing
6. An AI assistant grounded in stored health records
7. Google Maps discovery, directions, and consent-based healthcare visit history

Together, these features give families one secure place to understand a parent's health history, coordinate day-to-day care, and find the right healthcare service nearby.
gency        Sharing        Follow-up
        │              │              │
        └──────────────┼──────────────┘
                       │
                  AI HEALTH LAYER
                       │
        ┌──────────────┼──────────────┐
        │              │              │
      OCR          Extraction        RAG
        │              │              │
        └──────────────┼──────────────┘
                       │
               Structured Health Data
```

## The 6 features that define your product

If I had to reduce the entire product to **six core capabilities**, they would be:

**1. Family Health Profile**
One structured profile for each parent.

**2. Medical Document Intelligence**
Upload → OCR → extract → organize.

**3. Health Timeline**
Turn scattered medical history into one chronological view.

**4. Remote Family Care**
Children can manage appointments, medicines, tasks and information from anywhere.

**5. Doctor Brief & Secure Sharing**
Give doctors the relevant information without handing over the entire family account.

**6. AI Health Information Assistant**
Ask questions about the parent's stored health information and retrieve the relevant documents/facts.

That combination gives you a much stronger business proposition than simply **"React Native medical document app."**
gency        Sharing        Follow-up
        │              │              │
        └──────────────┼──────────────┘
                       │
                  AI HEALTH LAYER
                       │
        ┌──────────────┼──────────────┐
        │              │              │
      OCR          Extraction        RAG
        │              │              │
        └──────────────┼──────────────┘
                       │
               Structured Health Data
```

## The 6 features that define your product

If I had to reduce the entire product to **six core capabilities**, they would be:

**1. Family Health Profile**
One structured profile for each parent.

**2. Medical Document Intelligence**
Upload → OCR → extract → organize.

**3. Health Timeline**
Turn scattered medical history into one chronological view.

**4. Remote Family Care**
Children can manage appointments, medicines, tasks and information from anywhere.

**5. Doctor Brief & Secure Sharing**
Give doctors the relevant information without handing over the entire family account.

**6. AI Health Information Assistant**
Ask questions about the parent's stored health information and retrieve the relevant documents/facts.

That combination gives you a much stronger business proposition than simply **"React Native medical document app."**
