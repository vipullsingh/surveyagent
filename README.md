# SurveyAgent (Insurance Surveyor / Loss Adjuster Field App)
## Product Requirements Document, Development Roadmap & Continuous AI Development Framework

**Product Name:** SurveyAgent  
**Target Platform:** Mobile Field App (React Native + Local SQLite/AsyncStore Cache) & Cloud API (Golang)  
**Target Users:** Independent Insurance Surveyors, Loss Adjusters, Field Inspectors, and Adjusting Firms (Motor, Fire, Marine, Engineering, Property)  
**Core Promise:** On-Demand Cloud AI Loss Adjustment, Local Evidence Preservation, and Instant Server-Rendered PDF Reports.

---

## 1. Executive Summary & Target Goals

SurveyAgent is a hybrid mobile-first field inspection application designed specifically for insurance loss adjusters. Recognizing that surveyors collect dense media evidence and detailed notes in the field, SurveyAgent stores all captured media files and checklist states locally on the device first. When ready, the surveyor triggers a single upload and analysis action, dispatching the data to the Golang backend, which orchestrates cloud AI transcription and report synthesis.

### Primary Goals & KPIs
1. **Report Generation Speed**: Reduce time from site visit to finished, insurer-ready PDF report from hours to **under 15–20 minutes**.
2. **Evidence Integrity**: Ensure 100% of captured evidence photos are automatically geotagged (GPS coordinates) and timestamped with vector annotations, saved locally on the device prior to batch upload.
3. **Robust Field Caching**: Cache assigned cases and checklist forms locally so the surveyor can work seamlessly during network drops, loading cached data in read-only mode if completely offline.
4. **Selectable Backend AI**: Enable firm admins to configure which cloud AI models (Gemini-1.5-Flash, Gemini-1.5-Pro, GPT-4o-mini) analyze the case data and transcribe the voice dictation.

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
| • Local Filesystem Storage  | <======== REST API Clients ======>| • PostgreSQL (GORM) DB      |
| • SQLite / AsyncStorage Cache|        (JSON + Multipart File)    | • S3/MinIO Media Storage    |
| • Canvas Photo Annotations  |                                   | • Cloud AI API Gateway      |
| • Audio Dictation (.m4a)    |                                   | • PDF Report Compiler       |
+-----------------------------+                                   +-----------------------------+
```

- **Mobile Client**: React Native (TypeScript), Expo FileSystem (Local Media files), SQLite / AsyncStorage (Local Cache), Expo Camera, `@shopify/react-native-skia` or Standard Canvas.
- **Backend API Service**: Golang (Gin Framework), PostgreSQL (GORM), MinIO / S3 Object Storage for media assets.
- **Cloud AI Orchestrator**: Go-based gateway integrations for Speech-To-Text (Whisper API / Gemini Multimodal) and LLM analysis (Gemini Flash/Pro, GPT-4o-mini).
- **Authorization & Security**: Multi-tenant Organizational Role-Based Access Control (RBAC) with JWT bearer tokens.

---

## 3. Comprehensive Organizational RBAC Matrix

SurveyAgent enforces strict firm-level multi-tenancy and role permissions:

| System Feature / Action | Super Admin | Firm Admin | Senior Surveyor / Reviewer | Field Surveyor |
| :--- | :---: | :---: | :---: | :---: |
| Platform Analytics & Firm Management | ✅ | ❌ | ❌ | ❌ |
| Manage Firm Users & Credentials | ❌ | ✅ | ❌ | ❌ |
| Create & Assign Claim Cases | ❌ | ✅ | ✅ | ❌ |
| View Assigned Cases (Online & Cached) | ❌ | ✅ | ✅ | ✅ |
| Save Local Photos, Checklists & Voice Notes | ❌ | ❌ | ✅ | ✅ |
| Trigger Batch Media Upload & Cloud AI Analysis | ❌ | ❌ | ✅ | ✅ |
| Configure Default Cloud AI Models | ❌ | ✅ | ❌ | ❌ |
| Approve / Reject Final Claim Reports | ❌ | ✅ | ✅ | ❌ |
| Generate & Export PDF Reports (via Backend) | ❌ | ✅ | ✅ | ✅ |

---

## 4. Functional Requirements & Feature Breakdown

### 4.1 Case (Claims) Management – Cache & CRUD
- **Case Creation**: Created via the mobile app or backend admin console. Fields include: Case Reference Number, Claim Type (`MOTOR`, `FIRE`, `MARINE`, `ENGINEERING`, `PROPERTY`, `OTHER`), Policy Number, Insured Name, Insured Contact, Location Address, GPS Coordinates, Date of Loss, Assigned Date, Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), and Status (`DRAFT`, `IN_PROGRESS`, `REVIEW_PENDING`, `COMPLETED`, `SUBMITTED`, `CLOSED`).
- **Read-Only Caching**: The mobile client caches case lists and metadata locally. If network connection is lost, surveyors can view their assigned cases and navigate active cases.
- **Case Status Workflow**: Transition checks from `DRAFT` → `IN_PROGRESS` → `REVIEW_PENDING` → `COMPLETED` → `CLOSED`.

### 4.2 Camera & Local Evidence Storage
- **Geotagged Multi-Shot Camera**: High-accuracy GPS geotagging (Latitude, Longitude, Altitude) and immutable timestamp overlay embedded on every captured photo. Saved directly to the mobile device's local documents directory.
- **Guided Photo Wizard**: Compulsory angle prompts tailored per claim type (e.g., Motor: Front Bumper, Chassis VIN, Dashboard Odometer, Underbody Leak).
- **Interactive Annotation Tools**: Touch-screen drawing canvas overlay (arrows, callouts, text labels, damage circles). Annotations are flattened onto a local copy of the image.
- **On-Device Quality Checker**: Instant on-device verification warning for blurry photos, low lighting, or missing compulsory angles before local saving.

### 4.3 Voice Dictation & Audio Storage
- **Continuous Field Audio Recording**: Record voice notes describing the loss site, saved as local audio files (`.m4a` or `.mp3`) in the device's storage.

### 4.4 On-Demand Batch Upload & Cloud AI Engine
- **Batch Upload Trigger**: A prominent "Run AI Analysis & Upload" button on the Case Detail Screen uploads all locally stored photo files, annotated photo files, and voice recordings to the backend.
- **Cloud STT**: The backend routes the uploaded audio to Whisper API or Gemini Multimodal to generate text transcripts.
- **LLM Report Synthesis**: The backend passes transcripts, checklist fields, and case metadata to the selected cloud LLM (Gemini-1.5-Flash, Gemini-1.5-Pro, GPT-4o-mini) to generate report drafts (*Incident Overview*, *Scope of Damage*, *Surveyor Remarks*, *Estimated Repair Range*).
- **Missing Information Auditor**: Highlight missing checklist fields or missing compulsory photo evidence prior to report sign-off.

### 4.5 Dynamic Smart Checklists
- **Pre-Built Domain Templates**: Templates for Motor, Fire/Property, Marine, and Engineering claims.
- **Conditional & Required Fields**: Dynamic field display based on user selections. Checklists are auto-saved to local memory/SQLite cache.
- **Progress Tracking**: Real-time percentage indicator showing checklist completion status.

### 4.6 Server-Side PDF Report Generator
- **HTML-to-PDF Rendering**: The backend compiles case metadata, checklists, uploaded geotagged photo grids, and surveyor signatures into a styled PDF.
- **Mobile Export & Sharing**: The mobile client downloads the compiled PDF or triggers the native OS Share Sheet (to email, print, or send via messenger).

---

## 5. Quick Start & Execution Commands

### Running Backend Service (Golang)
Ensure database credentials are set in your environment or `.env` configuration.
```bash
cd backend
go run cmd/api/main.go
```
*Health Check*: `curl http://localhost:8080/health`

### Running Mobile Field Client (React Native)
```bash
cd mobile
npm install
npm start
```

---

## 6. Development Roadmap & Execution Phases

```
+-----------------------------------------------------------------------------------+
|                            SURVEYAGENT ROADMAP                                   |
+-----------------------------------------------------------------------------------+
  Phase 1: Backend Foundation & DB Schema Setup
  ├── Go Backend REST API Framework, JWT Auth & RBAC Setup
  └── GORM PostgreSQL Schemas (Organizations, Users, Cases, Media, Checklist)

  Phase 2: Mobile Setup & Local Storage Layout
  ├── React Native Navigation Setup & UI Screens Layout (direct API CRUD)
  └── Local SQLite/AsyncStorage read-only cache layer & Local Filesystem Directories

  Phase 3: Camera Evidence & Media Saving
  ├── Geotagged camera view with GPS & timestamp overlay
  ├── Interactive photo annotation canvas
  └── Local media manager (saving image files to device filesystem)

  Phase 4: Voice Notes & Dynamic Checklists
  ├── Audio recorder saving voice note files locally
  └── Dynamic checklist form engine auto-saving to local cache

  Phase 5: Batch Upload, Cloud AI & PDF Compilation
  ├── Batch media upload client and backend /upload-media endpoints
  ├── Cloud AI STT (Whisper/Gemini) & LLM Analysis (Gemini/OpenAI) on Backend
  └── Backend HTML-to-PDF compiler and Mobile PDF Viewer/Share Sheet
```

---

## 7. Comprehensive Task Breakdown Checklist

### Phase 1: Core System Setup
- [ ] Initialize Golang module `surveyagent-backend` with Gin, JWT, and bcrypt.
- [ ] Create domain models (`Organization`, `User`, `Case`, `Media`, `VoiceNote`, `Checklist`).
- [ ] Setup GORM database migration scripts targeting PostgreSQL.
- [ ] Implement JWT authentication and RBAC middleware.

### Phase 2: Mobile UI & Caching
- [ ] Build `LoginScreen.tsx` with organization, email, and password fields.
- [ ] Build `CaseListScreen.tsx` with search, filters, and local caching read-back.
- [ ] Build `CaseDetailScreen.tsx` displaying case details and module navigation tiles.
- [ ] Build `CreateCaseScreen.tsx` capturing metadata and Auto-GPS coordinate acquisition.

### Phase 3: Evidence Capture & Media
- [ ] Build `CameraEvidenceScreen.tsx` with simulated view, GPS watermark, and quality analysis.
- [ ] Create local directory paths for saving original/annotated photos and thumbnails.
- [ ] Build `PhotoAnnotationScreen.tsx` with drawing canvas overlay (arrow, circle, text).

### Phase 4: Voice Notes & Checklist Form
- [ ] Build `VoiceNotesScreen.tsx` saving audio files to local directories.
- [ ] Implement dynamic checklist form engine in `ChecklistFormScreen.tsx`.

### Phase 5: Upload, AI Integration & PDF
- [ ] Create batch upload client script in React Native.
- [ ] Setup backend integrations for Gemini API and OpenAI APIs.
- [ ] Build backend PDF generator rendering structured reports with embedded base64 photos.
- [ ] Build `ReportPreviewScreen.tsx` displaying toggles, custom remarks editor, and triggers.

---

## 8. Special Prompts for Continuous AI Development

To ensure seamless, error-free continuous development of SurveyAgent by AI pair-programmers and human engineers, follow these strict prompts:

### Prompt 1: New Feature Implementation Prompt
```markdown
System Persona: Senior React Native & Golang Architect specializing in API-Driven Field Systems.

Task: Implement [FEATURE_NAME] for SurveyAgent.

Strict Guidelines:
1. Client-Side (React Native):
   - Store captured images and voice audio files locally on the device filesystem.
   - Cache JSON metadata (cases, checklists) locally in SQLite/AsyncStorage for read-only access.
   - Interact with the backend via standard HTTP REST API endpoints.
2. Server-Side (Golang Backend):
   - Enforce tenant isolation via organization claims in middleware context.
   - Run AI processing (transcription, report drafting) on the server using cloud APIs.
   - Compile PDF reports on the server and return downlodable links.
```

### Prompt 2: Bug Fix & Crash Resolution Prompt
```markdown
System Persona: Mobile Field Debugging Expert.

Task: Debug and fix [CRASH_OR_ISSUE_DESCRIPTION].

Diagnostic Checklist:
1. If the crash occurs on Android Emulator:
   - Ensure REST client hits `10.0.2.2:8080` instead of `localhost`.
2. If the issue relates to Media:
   - Verify local filesystem paths (`file://`) and permissions for camera/microphone.
   - Ensure the image flattener uses local URI inputs.
```
