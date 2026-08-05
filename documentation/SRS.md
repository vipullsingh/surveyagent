# Software Requirements Specification (SRS)
## SurveyAgent - Mobile Field App v1.0 (Revised MVP)

**Document Date:** August 2026  
**Target Platform:** React Native (iOS/Android), SQLite/AsyncStorage (Local Caching), Cloud REST API (Golang)  
**Prepared by:** AI Development Team  

---

## 1. Executive Summary

SurveyAgent is a mobile field inspection application designed for insurance loss adjusters, surveyors, and field inspectors. The system enables field teams to record cases, capture geotagged evidence, write annotations, record voice dictations, and complete inspection checklists—all preserved locally on the device's storage and state. When connected, the surveyor triggers a single upload and analysis step. The backend server processes the media, transcribes the voice notes via cloud APIs, executes LLM report drafting, and renders a professional PDF document.

**Core Value Proposition:**
- **Local-First Saving:** Save high-res images, canvas drawing annotations, and audio recording files directly to the device filesystem.
- **On-Demand Batch Upload:** Control when data is synced to the server with a single click.
- **Hybrid Offline Caching:** Cache active cases and checklists locally so details remain readable even when cell reception is dropped.
- **Cloud-Backed AI Engine:** The backend orchestrates Speech-to-Text and LLM analysis using configurable cloud models (e.g. Gemini, OpenAI) to automate report drafting.
- **Server-Side PDF Compiling:** PDF files are generated on the server and downloaded/shared directly on the mobile app.

---

## 2. Functional Requirements by Screen

### 2.1 Login Screen (`LoginScreen.tsx`)

**Purpose:** Secure, multi-tenant portal for users to authenticate into their respective adjusting firm.

#### 2.1.1 Screen Components
- **Background Container:** Dark mode slate gradient.
- **Brand Logo:** Central SVG icon representing the SurveyAgent brand.
- **Organization ID Field:** Text input for firm slug (used to identify multi-tenant routing).
- **Email Field:** Text input for user authentication.
- **Password Field:** Text input with secure text entry toggle (eye icon).
- **Submit Button:** Glowing primary CTA.

#### 2.1.2 Interactions & Validation
- **Authentication Action:** Tapping the Login button triggers a POST request to `/api/v1/auth/login`.
- **Token Storage:** On HTTP 200, the app stores the returned JWT access token and user profile inside `SecureStore` (iOS Keychain / Android Keystore) and redirects to the Case List Screen.
- **Validation Rules:**
  - Organization ID must not be blank.
  - Email must follow standard email syntax.
  - Password must be at least 6 characters.
- **Error Feedback:** Displays a red alert banner if authentication fails (e.g. invalid credentials or server unreachable).

---

### 2.2 Case List Screen (`CaseListScreen.tsx`)

**Purpose:** Master dashboard showing all assigned inspectable cases, status chips, and offline cache flags.

#### 2.2.1 Screen Components
- **Header:** Title ("SurveyAgent Field"), Online Status Indicator (Green: Online, Yellow: Offline), App Settings cog.
- **Search Input:** Search box with real-time client-side filter.
- **Filters Row:** Scrollable row of claim type buttons (`ALL`, `MOTOR`, `FIRE`, `MARINE`, `PROPERTY`).
- **Case Cards List:** FlatList containing detailed cards for each case.
- **FAB:** Floating Action Button (+) styled with a glowing gradient.

#### 2.2.2 Case Card Fields
- **Case Number:** Bold white heading (e.g. `CAS-2026-MOTOR-0301`).
- **Claim Type Chip:** Color-coded pill based on claims metadata.
- **Insured Name:** "Insured: John Doe".
- **Date of Loss:** "Date: YYYY-MM-DD".
- **Location:** Landmark or address details.
- **Status Chip:** Status indicator (`DRAFT`, `IN_PROGRESS`, `REVIEW_PENDING`, `COMPLETED`).
- **Cache Indicator:** Icon indicating if case checklist and metadata are cached locally.

#### 2.2.3 Interactions & Cache Logic
- **Offline Reading:** App checks local SQLite/AsyncStorage cache. If offline, loads the cached case list.
- **Pull-To-Refresh:** If online, queries `/api/v1/cases` and updates the local cache.
- **Filtering & Search:** Real-time character matching across case number, insured name, and policy number fields.
- **Tap Card:** Navigates to the Case Detail Screen with the `caseId` parameter.

---

### 2.3 Create Case Screen (`CreateCaseScreen.tsx`)

**Purpose:** Metadata form to register a new inspection claim case.

#### 2.3.1 Form Fields
- **Claim Type Selector:** horizontal chips representing claims domains.
- **Case Number:** Read-only auto-generated string (format: `CAS-{YEAR}-{CLAIMTYPE}-{RANDOM}`).
- **Policy Number:** Text input.
- **Insured Name:** Text input.
- **Date of Loss:** Calendar selector (prevents selecting future dates).
- **Auto-GPS Button:** Location trigger showing coordinate lock indicators.
- **Site Address:** Textarea box for address input.
- **Priority Selector:** Segmented control (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).

#### 2.3.2 GPS Capturing Requirements
- Tapping "Auto-GPS" queries the native location API.
- Shows a loader overlay while resolving coordinate accuracy (within 15 meters).
- Once locked, populates the read-only Latitude and Longitude displays.
- Saves reverse-geocoded address into the Site Address field if it was empty.

#### 2.3.3 Persistence
- Saving stores the draft case to the local database cache and navigates to the Case Detail screen.
- Synchronizes with the backend via `POST /api/v1/cases` when online.

---

### 2.4 Case Detail Screen (`CaseDetailScreen.tsx`)

**Purpose:** Surveyor's inspection dashboard for case metadata, launching sub-modules, and triggering uploads/AI.

#### 2.4.1 Layout Sections
- **Metadata Card:** Summary details block (Insured, Policy, Date, GPS, Status).
- **Inspection Modules Grid (2x2):**
  1. **Camera & Evidence:** Tile showing count of local photos.
  2. **Voice Dictation:** Tile showing count of local audio files.
  3. **Checklist Form:** Tile showing percentage of checklist answered.
  4. **Report Preview:** Link to generate and share the PDF.
- **AI Analysis & Upload Card:**
  - **AI Model Dropdown:** Selects target LLM (Gemini-1.5-Flash, Gemini-1.5-Pro, GPT-4o-mini).
  - **Upload Progress Progress-bar:** Shows progress during file batch upload.
  - **"Run AI Analysis & Upload" Button:** Main button.
  - **Result Area:** Markdown text field containing generated report text, estimated loss range, severity warning indicators (`MINOR`, `MODERATE`, `SEVERE`), and missing details alerts.

#### 2.4.2 Batch Upload & AI Action Flow
1. User taps "Run AI Analysis & Upload".
2. Application checks for internet connection. If offline, displays warning alert.
3. If online, starts reading local documents folder:
   - Gathers all captured original photos, annotated photos, and voice note audio files for this case.
   - Uploads files in a multipart payload to `/api/v1/cases/:id/upload-media` with progress tracking.
4. After files upload successfully, client hits `/api/v1/cases/:id/analyze`, passing the chosen AI model.
5. The backend calls Cloud STT and LLM endpoints to transcribe audio and synthesize the report.
6. The client receives the structured analysis JSON, updates the local case cache, and displays the summary report, severity index, and missing evidence warnings in the card.

---

### 2.5 Camera Evidence Screen (`CameraEvidenceScreen.tsx`)

**Purpose:** High-resolution capture of geotagged inspectable images.

#### 2.5.1 Layout & Overlay
- **Live Viewfinder:** Video feed from native camera.
- **Watermark Layer:** Renders on screen and is flattened into the saved JPEG. Content includes:
  - Latitude, Longitude, Altitude.
  - Timestamp (ISO format).
  - Current required angle label.
- **Guided Wizard Chip Bar:** Horizontal strip showing mandatory angles depending on claim type (e.g. Motor: "FRONT BUMPER", "ODOMETER", "VIN").
- **Shutter Control:** Central capture button.

#### 2.5.2 On-Device Quality Analysis
- Immediately after capture, the app reads the image file buffer.
- Performs calculations checking brightness average (under-exposed < 40/255, over-exposed > 220/255) and edge variance (blurry detection).
- Renders a preview overlay sheet with a quality verdict:
  - **GOOD (Green):** Free to save.
  - **FAIR (Amber):** Warning shown, allows save.
  - **POOR (Red):** Action required (blurry/dark), prompts retake but allows override save.

#### 2.5.3 Local Storage Paths
- Saved original captures go to: `FileSystem.documentDirectory + 'cases/{caseId}/original/{photoId}.jpg'`.
- Renders thumbnails to: `FileSystem.documentDirectory + 'cases/{caseId}/thumbnails/{photoId}.jpg'`.

---

### 2.6 Voice Notes Screen (`VoiceNotesScreen.tsx`)

**Purpose:** Local recording of verbal inspector notes for transcription later.

#### 2.6.1 Layout Elements
- **Waveform Canvas:** Visual indicator showing audio volume input levels.
- **Record Button:** Glowing circle (blue when idle, pulsating red when recording).
- **Saved Audio Logs List:** Scrollable list showing locally cached recordings.

#### 2.6.2 Recording Workflow
- Press record: starts audio recording using native microphone stream. Saves as a `.m4a` file locally in `cases/{caseId}/audio/{noteId}.m4a`.
- Press stop: closes the audio writer stream and displays note detail in list.
- Local playback: User can tap any saved item in the list to play back the audio locally.

---

### 2.7 Checklist Form Screen (`ChecklistFormScreen.tsx`)

**Purpose:** Dynamic inspection forms with conditional field rendering and progress tracking.

#### 2.7.1 Form Capabilities
- Dynamically loads questionnaire structure depending on case `claimType`.
- Inputs supported: Text, Textarea, Checkbox, Dropdowns, Date pickers, Numbers.
- **Conditional Logic Rules:**
  - If a master trigger field is checked (e.g. "Airbag Deployed" = True), render nested sub-questions (e.g. "Steering Airbag", "Passenger Airbag"). If unchecked, clear and hide nested inputs.
- **Progress Calculations:**
  - Computes `(completedRequiredFields / totalRequiredFields) * 100%`.
  - Updates progress bar in header dynamically on field value change.
- **Auto-Save:** Saves form inputs locally to SQLite/AsyncStorage on field blur events.

---

### 2.8 Report Preview & Export Screen (`ReportPreviewScreen.tsx`)

**Purpose:** Customize layout settings, view HTML report mockup, and generate the final PDF from the server.

#### 2.8.1 Layout Elements
- **Layout Toggles:** Checkboxes to "Include Photos", "Include Geotag Details", "Include Checklist".
- **Remarks Field:** Large text area to write final remarks.
- **Digital Sign-off Block:** Text input field for the inspector's name.
- **Report Webview Preview:** Displays a styled HTML preview reflecting case contents.
- **Export Button:** Floating action button in emerald green.

#### 2.8.2 PDF Export Workflow
1. User taps "Export PDF Report".
2. Client sends remarks, toggle configurations, and digital signature to the backend endpoint `POST /api/v1/cases/:id/pdf`.
3. Backend merges data, maps checklist fields, inserts S3 photo URLs, and compiles the layout into a PDF binary.
4. Mobile client receives the PDF binary or download URL.
5. Invokes native OS Sharing sheets so the user can email, print, or save the PDF report.

---

### 2.9 Photo Annotation Screen (`PhotoAnnotationScreen.tsx`)

**Purpose:** Add touch drawings (arrows, circles, text labels) directly onto evidence photos.

#### 2.9.1 Drawing Toolbar
- **Tools:** Brush, Arrow, Circle, Rectangle, Text, Undo, Clear.
- **Stroke Color Selection:** Red, Yellow, Cyan, Green.
- **Canvas View:** Visual overlay scaling the image to fit the container.

#### 2.9.2 Canvas Flattening
- Drawing coordinates are captured relative to image proportions (0.0 to 1.0).
- Tapping "Save" uses a canvas compositor:
  - Merges the original image background with vector drawings.
  - Exports a new flattened copy to `cases/{caseId}/evidence/{photoId}_annotated.jpg` (used during final PDF generation).
  - Retains original paths for re-editing.

---

## 3. Non-Functional Requirements

### 3.1 Network Resiliency
- **Offline Caching:** The app must load cached metadata when cell reception is absent.
- **Network Indicator:** Displays connection status inside the header.
- **Upload Queue:** Prevent UI blocking during batch file uploads; show explicit percentage progress loader.

### 3.2 Storage Specifications
- Original, annotated, and thumbnail photos are organized within isolated directories per case.
- Audio note files must be compressed (.m4a / AAC format) to optimize storage capacity on the device.

### 3.3 Security & Multi-Tenancy
- **JWT Protection:** All backend endpoints require verification of organizational tokens.
- **Media Exclusivity:** Handlers isolate file uploads and DB rows using organization claims.

---

## 4. UI/UX Design System

### 4.1 Theme Palette
- `background-main`: Deep Slate Charcoal `#0F172A`
- `background-card`: Card Navy-Slate `#1E293B`
- `border-card`: Border Muted `#334155`
- `text-bright`: Primary Legibility Text `#F8FAF4`
- `text-muted`: Secondary Accent Text `#94A3B8`
- `status-success`: Compliance Teal `#0F766E`
- `status-warning`: Warning Amber `#B45309`
- `status-danger`: Damage Crimson `#991B1B`
- `accent-action`: Corporate Navy `#0A1D37`
- `accent-highlight`: Steel Blue `#2A4365`

### 4.2 Typography
- H1 Header: 22px bold.
- Card Title: 16px semibold.
- Body Copy: 14px regular.
- Field labels: 12px uppercase.

---

## 5. Data Models & Schemas

### 5.1 Case GORM Model (PostgreSQL)
```go
type Case struct {
    ID             uuid.UUID `gorm:"type:uuid;primaryKey"`
    OrganizationID uuid.UUID `gorm:"type:uuid;index"`
    CaseNumber     string    `gorm:"type:varchar(50);unique"`
    ClaimType      string    `gorm:"type:varchar(20)"` // MOTOR, FIRE, MARINE, PROPERTY
    PolicyNumber   string    `gorm:"type:varchar(50)"`
    InsuredName    string    `gorm:"type:varchar(100)"`
    InsuredContact string    `gorm:"type:varchar(100)"`
    Location       string    `gorm:"type:text"`
    Latitude       float64
    Longitude      float64
    DateOfLoss     time.Time
    Priority       string    `gorm:"type:varchar(20)"` // LOW, MEDIUM, HIGH, URGENT
    Status         string    `gorm:"type:varchar(20)"` // DRAFT, IN_PROGRESS, REVIEW_PENDING, COMPLETED
    AISummary      string    `gorm:"type:text"`
    AISeverity     string    `gorm:"type:varchar(20)"` // MINOR, MODERATE, SEVERE, TOTAL_LOSS
    AIWarnings     string    `gorm:"type:text"`       // JSON serialized string array
    ChecklistData  string    `gorm:"type:text"`       // JSON serialized answers
    CreatedAt      time.Time
    UpdatedAt      time.Time
}
```

### 5.2 Media Asset GORM Model (PostgreSQL)
```go
type Media struct {
    ID             uuid.UUID `gorm:"type:uuid;primaryKey"`
    CaseID         uuid.UUID `gorm:"type:uuid;index"`
    OriginalURL    string    `gorm:"type:text"` // S3 secure link
    AnnotatedURL   string    `gorm:"type:text"` // S3 secure link
    ThumbnailURL   string    `gorm:"type:text"` // S3 secure link
    FileType       string    `gorm:"type:varchar(20)"` // PHOTO, AUDIO
    Latitude       float64
    Longitude      float64
    Timestamp      time.Time
    AngleLabel     string    `gorm:"type:varchar(50)"`
    Caption        string    `gorm:"type:text"`
    Annotations    string    `gorm:"type:text"` // Vector JSON coordinates
    CreatedAt      time.Time
}
```

---

## 6. Error Handling & Edge Cases

### 6.1 Network Disconnection
- If the user clicks "Run AI Analysis & Upload" while offline:
  - App interrupts execution and launches a dialog: "No Network Connection. Media assets cannot be uploaded. Please connect to internet to run AI analysis."
- If checklists fail to save due to API outages, the values remain saved in local cache.

### 6.2 Upload Failures
- The app checks response codes for uploaded files. If an item fails:
  - Retries upload up to 3 times.
  - If fails permanently, resets the upload bar and alerts: "Upload Failed. Please check network connectivity and try again."

---

## 7. Acceptance Criteria

### 7.1 Authentication & Login
- [ ] Displays organization, email, and password fields.
- [ ] Tapping Login routes to backend authentication endpoint.
- [ ] Saves credentials/tokens securely on success and redirects.

### 7.2 Case List Screen
- [ ] Loads list from SQLite/AsyncStorage cache if offline.
- [ ] Standard pull-to-refresh fetches cases and updates cache when online.
- [ ] Tapping card navigates to Case Detail screen.

### 7.3 Create Case Screen
- [ ] Auto-generates Case Number string on Claim Type change.
- [ ] Validates all fields on save.
- [ ] Auto-GPS locks lat/lon values within acceptable accuracy thresholds.

### 7.4 Case Detail Screen
- [ ] Lists metadata, showing modules grid with counts (photos, voice notes, progress).
- [ ] Model selector dropdown updates the selected AI model state.
- [ ] "Run AI Analysis & Upload" button uploads all local photos and audio notes in batch, calling the backend for transcription and analysis.
- [ ] Displays returned AI summary, severity warnings, and checklist warnings on success.

### 7.5 Camera Evidence Screen
- [ ] Live camera feed showing GPS/timestamp overlay text.
- [ ] Wizard bar updates missing required photo indicators.
- [ ] Photo quality checker returns alert banner if blur/darkness is detected.
- [ ] Saves images locally to device directories.

### 7.6 Voice Notes Screen
- [ ] Recording creates `.m4a` files in local folder directory.
- [ ] Voice notes display in local audio log list with play triggers.

### 7.7 Checklist Form Screen
- [ ] Conditional fields hide/display based on checkbox/trigger settings.
- [ ] Form completion updates header progress bar dynamically.
- [ ] Edits auto-save to local memory cache on blur events.

### 7.8 Report Preview & Export Screen
- [ ] Multi-layout config toggles alter preview layout settings.
- [ ] Digital signature and remarks validate on submit.
- [ ] Tapping Export sends compilation arguments to backend, downloading the compiled PDF binary and triggering OS Share Sheet.

### 7.9 Photo Annotation Screen
- [ ] Canvas overlay responds to drag gestures for arrows, circles, and shapes.
- [ ] Save composite combines drawing vectors onto the local photo.

---

## 8. Glossary
- **Local-First Saving:** Preserving original binary assets on the device's storage before upload.
- **Batch Upload:** Packaging files and triggering a single batch upload process.
- **On-Demand AI:** Execution of cloud model logic triggered by user click.
- **Hybrid Caching:** Keeping JSON records synced to local SQLite cache for access during signal dropouts.

---

## 9. Revision History
- **August 2026:** Revised requirements from offline-first local AI architectures to hybrid client-cache and server-driven AI models.
