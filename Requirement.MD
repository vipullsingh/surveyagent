# SurveyAgent (Insurance Surveyor / Loss Adjuster Field App)
## Product Requirements Document, Development Roadmap & Continuous AI Development Framework

**Product Name:** SurveyAgent  
**Target Platform:** Mobile Field App (React Native + Realm DB) & Cloud API (Golang)  
**Target Users:** Independent Insurance Surveyors, Loss Adjusters, Field Inspectors, and Adjusting Firms (Motor, Fire, Marine, Engineering, Property)  
**Core Promise:** 100% Offline Field Capability with On-Device AI Assistance & Instant PDF Report Generation.

---

## 1. Executive Summary & Target Goals

SurveyAgent is an offline-first, mobile-first field inspection application designed specifically for insurance loss adjusters. In field operations, internet connectivity is frequently unreliable or unavailable at loss sites (e.g., remote industrial sites, basements, accident zones). SurveyAgent eliminates field downtime by storing all case data, geotagged evidence, audio notes, and checklists locally using Realm DB and processing on-device AI analysis using quantized Local LLMs.

### Primary Goals & KPIs
1. **Report Generation Speed**: Reduce time from site visit to finished, insurer-ready PDF report from hours to **under 20–30 minutes**.
2. **Evidence Integrity**: Ensure 100% of captured evidence photos are automatically geotagged (GPS coordinates) and timestamped with real-time vector annotations.
3. **Full Field Independence**: Guarantee that 100% of core field actions (creating cases, photo evidence capture, audio dictation, checklist completion, local AI analysis, and PDF report export) function flawlessly without internet connectivity.
4. **Data Sync Reliability**: Provide atomic, queue-based delta synchronization when network connectivity is restored, ensuring zero data loss across multi-surveyor firms.

---

## 2. Technology Stack & Architectural Specifications

```
                           +------------------------------------------+
                           |           SurveyAgent System             |
                           +------------------------------------------+
                                                |
               +--------------------------------+--------------------------------+
               |                                                                 |
               v                                                                 v
+-----------------------------+                                   +-----------------------------+
|    Mobile Field App (RN)    |                                   |     Golang Backend Server     |
+-----------------------------+                                   +-----------------------------+
| • React Native (TS)         |                                   | • Go (Gin Framework)        |
| • Realm DB (Offline Local)  | <======== Sync Engine ========>   | • PostgreSQL Database       |
| • Local LLM (llama.rn)      |        (HTTP Delta Queue)         | • S3/MinIO Media Storage    |
| • Local STT (whisper.rn)    |                                   | • JWT & Multi-Tenant RBAC   |
| • Skia Canvas Annotations   |                                   | • PDF Template Compiler     |
+-----------------------------+                                   +-----------------------------+
```

- **Mobile Client**: React Native (TypeScript), `@realm/react` (Local Realm DB), `react-native-vision-camera`, `@shopify/react-native-skia`.
- **Backend API Service**: Golang (Gin Framework), PostgreSQL / In-Memory Store, MinIO / S3 Object Storage for media assets.
- **On-Device Offline AI**: Local quantized LLM (`LLaMA 3.2 1B` / `Phi-3-mini` via ONNX/GGUF runtime) + Local Speech-To-Text (`Whisper-Tiny/Base`).
- **Authorization & Security**: Multi-tenant Organizational Role-Based Access Control (RBAC) with JWT bearer tokens.

---

## 3. Comprehensive Organizational RBAC Matrix

SurveyAgent enforces strict firm-level multi-tenancy and role permissions:

| System Feature / Action | Super Admin | Firm Admin | Senior Surveyor / Reviewer | Field Surveyor |
| :--- | :---: | :---: | :---: | :---: |
| Platform Analytics & Firm Management | ✅ | ❌ | ❌ | ❌ |
| Manage Firm Users & Credentials | ❌ | ✅ | ❌ | ❌ |
| Create & Assign Claim Cases | ❌ | ✅ | ✅ | ❌ |
| Create & Edit Assigned Field Cases | ❌ | ✅ | ✅ | ✅ |
| Capture Photos, Geotags & Voice Notes | ❌ | ❌ | ✅ | ✅ |
| Execute On-Device Local LLM Analysis | ❌ | ❌ | ✅ | ✅ |
| Approve / Reject Final Claim Reports | ❌ | ✅ | ✅ | ❌ |
| Generate & Export PDF Reports | ❌ | ✅ | ✅ | ✅ |
| Perform Background / Manual Delta Sync | ❌ | ✅ | ✅ | ✅ |

---

## 4. Functional Requirements & Feature Breakdown

### 4.1 Case (Claims) Management – Offline CRUD
- **Case Creation**: Ability to create new claims offline with fields: Case Reference Number, Claim Type (`MOTOR`, `FIRE`, `MARINE`, `ENGINEERING`, `PROPERTY`, `OTHER`), Policy Number, Insured Name, Insured Contact, Location Address, GPS Coordinates, Date of Loss, Assigned Date, Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), and Status (`DRAFT`, `IN_PROGRESS`, `REVIEW_PENDING`, `COMPLETED`, `SUBMITTED`, `CLOSED`).
- **List & Search**: Filter cases locally by status, claim type, priority, and date range; instant search across case numbers, policy numbers, and insured names.
- **Status Workflow**: Enforce state transition checks from `DRAFT` → `IN_PROGRESS` → `REVIEW_PENDING` → `COMPLETED` → `SYNCED`.
- **Soft Delete & Recovery**: Support local soft-delete with restore options prior to sync.

### 4.2 Camera & Evidence Capture Engine
- **Geotagged Multi-Shot Camera**: Automatic high-accuracy GPS geotagging (Latitude, Longitude, Altitude) and immutable timestamp embedded on every captured photo.
- **Guided Photo Wizard**: Compulsory angle prompts tailored per claim type (e.g., Motor: Front Bumper, Chassis VIN, Dashboard Odometer, Underbody Leak).
- **Interactive Annotation Tools**: Touch screen canvas overlay (arrows, callouts, text labels, damage circles, measurement lines).
- **Photo Quality & Completeness Checker**: Instant on-device verification warning for blurry photos, low lighting, or missing compulsory angles.

### 4.3 Voice Dictation & Local Speech-To-Text (STT)
- **Continuous Field Audio Recording**: Record voice notes while inspecting physical damage.
- **On-Device Whisper STT**: Automatic offline conversion of voice recordings into structured text transcripts attached to the case.

### 4.4 Local LLM (On-Device Offline AI)
- **Voice Transcript Synthesis**: Auto-extract key findings from voice transcripts.
- **Report Auto-Drafting**: Combine checklist fields, metadata, audio transcripts, and photo tags to generate structured report sections (*Incident Overview*, *Scope of Damage*, *Surveyor Remarks*, *Estimated Repair Range*).
- **Damage Severity Classifier**: Suggest initial damage severity rating (`MINOR`, `MODERATE`, `SEVERE`, `TOTAL_LOSS`).
- **Missing Information Auditor**: Highlight missing compulsory fields or missing photo evidence prior to report sign-off.

### 4.5 Dynamic Smart Checklists
- **Pre-Built Domain Templates**: Templates for Motor, Fire/Property, Marine, and Engineering claims.
- **Conditional & Required Fields**: Dynamic field display based on user selections (e.g., if "Fluid Leak" is True, mandate "Fluid Type" field).
- **Progress Tracking**: Real-time percentage indicator showing checklist completion status.

### 4.6 PDF Report Generator & Exporter
- **One-Tap PDF Export**: On-device rendering of professional PDF reports.
- **Corporate Styling**: Header banner with firm branding/logo, policy details matrix, itemized damage assessment, geotagged photo proof grid, and inspector digital sign-off block.
- **Local Storage & Sharing**: Save generated PDF files locally on the device; share via email or messaging when online.

### 4.7 Offline Delta Sync Engine
- **Queue-Based Change Log**: Record all offline entity mutations (`CREATE`, `UPDATE`, `DELETE`) inside a dedicated local `SyncQueue` in Realm DB.
- **Automated Network Monitor**: Detect network state transitions via NetInfo.
- **Atomic Sync Execution**: Upload queued deltas to `/api/v1/sync`, upload media assets to S3/MinIO, process server updates, and update local entity sync status to `SYNCED`.

---

## 5. Development Roadmap & Execution Phases

```
+-----------------------------------------------------------------------------------+
|                            SURVEYAGENT ROADMAP                                   |
+-----------------------------------------------------------------------------------+
  Phase 1: Foundation Setup [COMPLETED]
  ├── Go Backend REST API Framework & In-Memory/DB Layer
  ├── React Native Architecture & Realm DB Schema Setup
  └── Automated Test Suites (Go unit tests & TS compilation checks)

  Phase 2: Offline Case CRUD & Dynamic Checklist Engine [COMPLETED]
  ├── Local Realm DB persistence & case list filters
  ├── Dynamic checklist engine for Motor, Fire, Property claims
  └── Case status workflow transitions

  Phase 3: Evidence Capture & Media File Manager [COMPLETED]
  ├── Geotagged camera view with GPS & timestamp overlay
  ├── Interactive photo annotation canvas
  └── Per-case media manager gallery

  Phase 4: Local LLM AI & Speech-to-Text Pipeline [COMPLETED]
  ├── On-device Whisper STT voice transcription bridge
  └── Local LLM report auto-drafting & damage severity analysis

  Phase 5: PDF Report Generator & Delta Sync Engine [COMPLETED]
  ├── On-device PDF rendering with corporate branding
  ├── Background sync queue worker & Golang /api/v1/sync handler
  └── Android 10.0.2.2 emulator bridge configuration

  Phase 6: Multi-Tenant RBAC & Field Deployment Polish [IN PROGRESS]
  ├── Admin user management endpoints & JWT token verification
  ├── End-to-end field testing on Android Studio Emulator
  └── Production build optimization
```

---

## 6. Comprehensive Task Breakdown Checklist

### Phase 1: Core System Setup
- [x] Initialize Golang module `surveyagent-backend` with Gin, JWT, and bcrypt.
- [x] Create domain models (`Organization`, `User`, `Case`, `Media`, `VoiceNote`, `SyncQueue`).
- [x] Initialize React Native client (`mobile/`) with TypeScript and Realm DB schemas.
- [x] Implement JWT authentication and RBAC middleware (`SUPER_ADMIN`, `FIRM_ADMIN`, `SENIOR_SURVEYOR`, `SURVEYOR`).

### Phase 2: Offline Case Management
- [x] Implement local Realm DB storage manager (`RealmManager.ts`).
- [x] Build `CaseListScreen` with search, claim type chips, and sync status badges.
- [x] Build `CaseDetailScreen` displaying case metadata and module shortcuts.
- [x] Implement dynamic checklist form engine in `ChecklistFormScreen.tsx`.

### Phase 3: Camera & Evidence Engine
- [x] Build `CameraEvidenceScreen` with simulated viewfinder, GPS coordinates, and timestamps.
- [x] Implement photo captioning, tagging, and local media gallery list.
- [x] Implement evidence annotation canvas support.

### Phase 4: Local LLM & Voice Dictation
- [x] Build `WhisperSTT.ts` for on-device voice dictation transcription.
- [x] Build `VoiceNotesScreen.tsx` with audio log recorder and transcript display.
- [x] Build `LLMEngine.ts` for offline report auto-drafting, severity assessment, and missing evidence warnings.

### Phase 5: PDF Exporter & Delta Sync Engine
- [x] Build `PDFExporter.ts` for compiling structured HTML/PDF reports.
- [x] Build `ReportPreviewScreen.tsx` with export options and PDF layout preview.
- [x] Build `SyncEngine.ts` for flushing `SyncQueue` deltas to Golang `/api/v1/sync`.
- [x] Configure Android Emulator bridge (`http://10.0.2.2:8080`).

### Phase 6: Testing & Android Studio Deployment
- [x] Run Go test suite (`go test ./...`) covering login, cases, and sync handlers.
- [x] Run TypeScript compiler (`tsc --noEmit`) to verify 0 mobile compilation errors.
- [x] Setup Android Gradle wrapper (`mobile/android/gradlew`) and Android Manifest permissions.
- [x] Launch Android Emulator (`Pixel_Fold_API_35`) and Android Studio project.

---

## 7. Special Prompts for Continuous AI Development

To ensure seamless, error-free continuous development of SurveyAgent by AI pair-programmers and human engineers, follow these strict prompts and operational guidelines:

### Prompt 1: New Feature Implementation Prompt
```markdown
System Persona: Senior React Native & Golang Architect specializing in Offline-First Mobile Systems.

Task: Implement [FEATURE_NAME] for SurveyAgent.

Strict Guidelines:
1. Client-Side (React Native + Realm DB):
   - All data modifications MUST write to the local Realm DB first.
   - Enqueue a SyncQueue item (CREATE, UPDATE, DELETE) for every offline mutation.
   - Ensure UI reactivity using local state and RealmListeners.
2. Server-Side (Golang Backend):
   - Always enforce tenant isolation via claims.OrganizationID in middleware context.
   - Enforce RBAC permission checks before modifying DB state.
   - Return clean JSON error structures with standard HTTP status codes.
3. Verification:
   - Run `go test ./...` in `/backend` to verify zero regression.
   - Run `./node_modules/.bin/tsc --noEmit` in `/mobile` to verify zero TypeScript errors.
```

### Prompt 2: Bug Fix & Crash Resolution Prompt
```markdown
System Persona: Mobile Field Debugging Expert.

Task: Debug and fix [CRASH_OR_ISSUE_DESCRIPTION].

Diagnostic Checklist:
1. If the crash occurs on Android Emulator:
   - Check if network requests use `10.0.2.2:8080` instead of `localhost:8080`.
   - Inspect `adb logcat -d *:E` for native exception stack traces.
2. If the issue relates to Offline Persistence:
   - Verify Realm schema version and primary key uniqueness (`id`).
   - Check `SyncQueueManager` delta serialization/deserialization.
3. Resolution:
   - Apply minimal, clean edits without modifying unrelated comments or business logic.
   - Re-run type checks and unit tests to validate fix.
```

### Prompt 3: Code Refactoring & System Optimization Prompt
```markdown
System Persona: Performance Optimization Engineer for Quantized On-Device AI Models.

Task: Optimize [COMPONENT_NAME] performance in SurveyAgent.

Optimization Directives:
1. Local AI Execution:
   - Ensure LLM inference runs asynchronously on background threads without blocking React Native UI thread (60 FPS main thread goal).
   - Use quantized GGUF/ONNX weights (Q4_K_M) to maintain RAM memory footprint under 500 MB.
2. Media & Storage:
   - Compress photo evidence assets before saving local URI.
   - Include EXIF geotag metadata (Latitude, Longitude, Timestamp) embedded directly in JPEG header.
3. Code Cleanliness:
   - Maintain full TypeScript interface coverage in `/mobile/src/types/index.ts`.
   - Keep Golang domain logic strictly separated into `/domain`, `/service`, and `/handler`.
```

---

*Document compiled and verified for SurveyAgent v1.0. All core requirements, schemas, offline guarantees, and roadmaps are codified in the repository.*
