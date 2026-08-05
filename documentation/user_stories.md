# User Stories & Acceptance Criteria
## SurveyAgent - Mobile Field App v1.0 (Revised MVP)

This document contains the user stories and detailed acceptance criteria for the different actors using the SurveyAgent platform under the revised hybrid online/offline-cached MVP requirements.

---

## 1. System Actors

- **Super Admin:** Manages overall platform health, firms (organizations), and global configuration.
- **Firm Admin:** Manages their firm's users, configurations (including model selection choice), and case allocations.
- **Senior Surveyor:** Reviews case files, edits checklist data, runs AI analysis, signs off, and exports report files.
- **Field Surveyor (Inspector):** Gathers evidence, writes local annotations, records audio logs, and fills in checklist forms on-site.

---

## 2. Core User Stories

### US-1: Multi-Tenant Login & Token Cache
**As a** Field Surveyor / Administrator,  
**I want to** authenticate securely with my email, password, and Organization ID,  
**So that** I can access my firm's assigned claims case list.

#### Acceptance Criteria
- **AC-1.1:** Verification endpoint is `/api/v1/auth/login`.
- **AC-1.2:** Token must be cached locally in `SecureStore` (keychain) to support auto-login on app start.
- **AC-1.3:** An invalid organization, email, or password shows an error message: `"Invalid Credentials. Please try again."`

---

### US-2: Cached Case Dashboard Viewing
**As a** Field Surveyor,  
**I want to** view my assigned cases in a dashboard,  
**So that** I know what loss inspections I need to complete, even when cell connection is unavailable.

#### Acceptance Criteria
- **AC-2.1:** If online, pulling to refresh fetches cases from `/api/v1/cases` and updates the local SQLite/AsyncStorage cache.
- **AC-2.2:** If offline, the case dashboard displays cached details. Shows a yellow badge: `"Offline Cache Mode"`.
- **AC-2.3:** Clicking a case card navigates the user to the Case Detail workspace.

---

### US-3: Create Case Offline
**As a** Senior Surveyor,  
**I want to** register a new case draft directly on the mobile app,  
**So that** I can start the inspection workflow immediately without waiting for network connectivity.

#### Acceptance Criteria
- **AC-3.1:** Tapping the FAB (+) opens the Create Case form.
- **AC-3.2:** Selecting a Claim Type auto-generates a unique Case ID string locally.
- **AC-3.3:** The "Auto-GPS" button captures coordinates and embeds them into the case metadata.
- **AC-3.4:** The new case is saved locally in draft state, syncs with backend when connection is active.

---

### US-4: Geotagged Media Capture & Local Storage
**As a** Field Surveyor,  
**I want to** snap damage photos with baked-in GPS coordinates,  
**So that** I can preserve verifiable proof of loss on my device's filesystem.

#### Acceptance Criteria
- **AC-4.1:** Captured photos are saved to local filesystem path: `cases/{caseId}/original/`.
- **AC-4.2:** Photo quality analysis runs locally. If blur or poor illumination is found, alerts user but allows saving.
- **AC-4.3:** Watermark overlay displaying latitude, longitude, altitude, case number, and timestamp is flattened onto the image.

---

### US-5: Photo Vector Annotation
**As a** Field Surveyor,  
**I want to** draw callout circles and pointers on my photos,  
**So that** I can highlight specific component damage.

#### Acceptance Criteria
- **AC-5.1:** Canvas allows selecting colors (Red, Yellow, Green, Cyan) and drawing shapes.
- **AC-5.2:** Tapping "Save" flattens the annotations onto a copy of the original image, preserving the original file.
- **AC-5.3:** The annotated file is saved to the local folder: `cases/{caseId}/evidence/`.

---

### US-6: Voice Notes Dictation
**As a** Field Surveyor,  
**I want to** record continuous audio notes at the damage site,  
**So that** I don't have to type detailed explanations while inspecting.

#### Acceptance Criteria
- **AC-6.1:** Pressing microphone initiates recording and captures audio into a compressed `.m4a` file.
- **AC-6.2:** Recordings are listed below the controls with duration details (e.g. `1m 24s`).
- **AC-6.3:** Audio notes can be played back locally via the media list.

---

### US-7: Dynamic Checklists Form
**As a** Field Surveyor,  
**I want to** fill in questionnaire inputs that correspond to the claim type,  
**So that** I capture all required inspection data points.

#### Acceptance Criteria
- **AC-7.1:** Selecting checkbox items displays nested conditional options dynamically.
- **AC-7.2:** Checklist progress updates the top progress bar calculation in real-time.
- **AC-7.3:** Data is auto-saved locally on field blur event to protect against app closure.

---

### US-8: Batch Upload & On-Demand Cloud AI Analysis
**As a** Field Surveyor / Reviewer,  
**I want to** trigger a batch upload of all local media assets and request AI analysis,  
**So that** the backend processes the STT transcriptions and drafts the report details.

#### Acceptance Criteria
- **AC-8.1:** Clicking "Run AI Analysis & Upload" checks for internet. If offline, blocks action.
- **AC-8.2:** If online, uploads local photos and audios to `/api/v1/cases/:id/upload-media` showing a progress bar.
- **AC-8.3:** Sends analysis request to `/api/v1/cases/:id/analyze`, passing the chosen AI model option.
- **AC-8.4:** Updates case details with the returned structured summary and flags missing details.

---

### US-9: Backend PDF Export
**As a** Senior Surveyor,  
**I want to** download the compiled PDF report from the server,  
**So that** I can sign off and email it to insurance adjusters immediately.

#### Acceptance Criteria
- **AC-9.1:** Clicking "Export PDF Report" sends comments and toggles configuration to `/api/v1/cases/:id/pdf`.
- **AC-9.2:** Backend converts report template into binary PDF format.
- **AC-9.3:** Client triggers native sharing option to send/view the PDF file.
