# SurveyAgent User Stories (Features Per Screen)

This document outlines the User Stories and corresponding Acceptance Criteria for the **SurveyAgent** mobile field application, structured by features per screen. All implementations must align with the **"Trust & Precision"** corporate design language and the revised hybrid client-cache/server-driven AI architecture.

---

## 1. Authentication & Login Screen (`LoginScreen.tsx`)

### Screen Overview
Secure portal for surveyors and loss adjusters to authenticate and access the application.

### User Stories & Acceptance Criteria

#### User Story 1.1: Secure Authentication
* **As a** Field Surveyor,
* **I want to** authenticate using my Email Address and Password,
* **So that** I can access my assigned cases, templates, and cloud storage folders.
* **Acceptance Criteria:**
  - **Inputs:** Displays text inputs for `Email Address` and a secure `Password` input field with a togglable lock/eye icon.
  - **Validation Rules:**
    * `Email Address` must validate against standard email formats (RFC 5322).
    * `Password` must be a minimum of 6 characters.
  - **Network Request:** Pressing "AUTHENTICATE & LOG IN" triggers a secure HTTPS `POST /api/v1/auth/login` payload containing credentials.
  - **Secure Token Storage:** On successful response (HTTP 200), the returned JWT access token, refresh token, and user profile metadata are stored in `SecureStore` (iOS Keychain / Android Keystore) and the user is navigated to the dashboard.
  - **Error Handling:** Displays a clear, non-intrusive alert banner at the top of the form in Damage Crimson (`#991B1B`) for incorrect credentials or server connectivity issues.

#### User Story 1.2: Visually Branding & Theme Compliance
* **As a** Surveyor,
* **I want** the login screen to present an authoritative and clean interface,
* **So that** it reflects professional stability and security.
* **Acceptance Criteria:**
  - **Background Canvas:** Solid matte Deep Slate Charcoal (`#0F172A`) with a dark, subtle geometric background vector in the upper third representing coordinates. No neon highlights or futuristic gradients.
  - **Branding Header:** Stylized vector logo (stylized camera lens intersecting a compass needle) in Steel Blue (`#2A4365`) next to the wordmark "SURVEYAGENT" in bold, tracking-spaced sans-serif off-white typography (`#F8FAF4`).
  - **Central Login Card:** Container styled in Navy-Slate (`#1E293B`) with a 1px solid border in Border Muted (`#334155`) and 16px rounded corners.
  - **Input States:** Active fields transition their border to Steel Blue (`#2A4365`) and show a blinking insertion cursor.
  - **Primary CTA:** Spans the card width, styled in solid Corporate Navy (`#0A1D37`) with text "AUTHENTICATE & LOG IN" in uppercase bold off-white.
  - **Footer:** Display a line of small, secondary text in muted gray reading: "Protected under secure credentials check. Contact firm administrator for login assistance." (Removing references to multi-tenant checks).

---

## 2. Case List Dashboard Screen (`CaseListScreen.tsx`)

### Screen Overview
The main master dashboard displaying assigned cases, claim filters, connection states, and sync indicators.

### User Stories & Acceptance Criteria

#### User Story 2.1: Hybrid Caching & Offline Reading
* **As a** Field Surveyor,
* **I want to** view my assigned active cases while working in remote locations without internet reception,
* **So that** I can access policy information and inspection scopes on-site.
* **Acceptance Criteria:**
  - **Local Database Read:** On mount, the app queries the local SQLite/AsyncStorage cache to render the list immediately.
  - **Connectivity Indicator:** Header displays a network status badge:
    * `ONLINE`: Styled in Compliance Teal (`#0F766E`) background with a solid teal border.
    * `OFFLINE`: Styled in Warning Amber (`#B45309`) background with a solid amber border.
  - **Local Cache Indicator:** Each case card displays a small green check/download icon if its full metadata and checklists are stored locally.

#### User Story 2.2: Pull-to-Refresh & Sync
* **As a** Field Surveyor,
* **I want to** trigger a manual pull-to-refresh when a cellular network is available,
* **So that** I can retrieve the latest case assignments and update the local SQLite database.
* **Acceptance Criteria:**
  - **Data Synchronisation:** Pull-to-refresh triggers a `GET /api/v1/cases` HTTP request with authorization headers.
  - **Cache Update:** Successfully returned payloads overwrite and update the local database.
  - **Visual Indicator:** Displays a standard native refresh indicator.

#### User Story 2.3: Case Sorting, Search, & Filtering
* **As a** Field Surveyor,
* **I want to** search and filter case cards by claim type or text matching,
* **So that** I can quickly locate specific claim records out of a long list.
* **Acceptance Criteria:**
  - **Real-Time Search Bar:** Real-time client-side text filter matching Case Number, Insured Name, and Policy Number.
  - **Horizontal Filter Chips:** A scrollable row of claim-type chips: `ALL` (active by default, styled in Steel Blue `#2A4365`), `MOTOR`, `FIRE`, `MARINE`, `PROPERTY` (inactive cards style `#1E293B`).
  - **Case Card Structure:** Cards display Case Number, Claim Type badge (color-coded), Insured Name, Date of Loss, Site Location, Status Chip (`DRAFT`, `IN_PROGRESS`, `REVIEW_PENDING`, `COMPLETED`), and local cache flag.
  - **Floating Action Button (FAB):** Floating action button with a "+" icon in Steel Blue (`#2A4365`) is anchored in the bottom right corner, routing to the Create Case Screen.

---

## 3. Create Case Screen (`CreateCaseScreen.tsx`)

### Screen Overview
Form-based data-entry workspace to register a new inspection claim case locally on the device.

### User Stories & Acceptance Criteria

#### User Story 3.1: Offline Case Registration & Draft Generation
* **As a** Field Surveyor,
* **I want to** create a new case draft record by entering the client's information,
* **So that** I can start collecting site photos and checklists immediately without needing an active internet connection.
* **Acceptance Criteria:**
  - **Form Fields:** Displays Claim Type selector chips, read-only Case Number (auto-generated draft ID format: `CAS-YYYY-CLAIMTYPE-RANDOM`), Policy Identifier, Primary Insured Name, Date of Loss calendar picker, and Site Address.
  - **Validation Rules:** Adds red asterisk markers (`*`) next to required labels. Validation prevents saving if Policy Identifier, Primary Insured Name, or Claim Type is missing.
  - **Date Picker Constraint:** Prevents selecting future dates.
  - **Local Persistence:** Saving stores the draft case row to the local SQLite cache and navigates the surveyor directly to the Case Detail screen. If online, a duplicate `POST /api/v1/cases` syncs it to the server.

#### User Story 3.2: Precise Geolocation Capture
* **As a** Field Surveyor,
* **I want to** lock in my exact GPS coordinates on the form with a single button tap,
* **So that** the location coordinates of the loss site are precisely verified.
* **Acceptance Criteria:**
  - **Auto-GPS Button:** Displays an "Auto-GPS" button styled in Steel Blue (`#2A4365`) with a satellite lock icon.
  - **GPS Accuracy Resolution:** Triggers the native OS location services and displays a modal loader until accuracy is locked within 15 meters.
  - **Coordinate Storage:** Populates read-only fields for Latitude and Longitude.
  - **Reverse Geocoding:** If coordinates are captured and the Site Address field is empty, the app calls the geo-API to auto-populate the address string.

---

## 4. Case Detail Screen (`CaseDetailScreen.tsx`)

### Screen Overview
The main hub for a single case, providing direct access to inspection sub-modules (Camera, Audio, Checklist) and triggering the cloud AI analysis uploader.

### User Stories & Acceptance Criteria

#### User Story 4.1: Module Navigation Grid
* **As a** Field Surveyor,
* **I want to** view a summary metadata card and a navigation grid showing the capture status of all sub-modules,
* **So that** I can track what evidence remains to be collected for this case.
* **Acceptance Criteria:**
  - **Metadata Summary Card:** Top-anchored card styled in Navy-Slate (`#1E293B`) showing Case Number, Policy ID, Insured Name, verified GPS coordinates, and date.
  - **2x2 Navigation Tiles:** Four cards mapping to:
    1. *Camera & Evidence:* Displays photo count (e.g. "Photos: 12") and a green checkmark if all wizard angles are captured.
    2. *Voice Dictation:* Displays audio notes count (e.g. "Notes: 3").
    3. *Checklist Form:* Displays Completion Percentage (e.g. "Progress: 80% Completed").
    4. *Report Preview:* Navigates to the Report & Export view.

#### User Story 4.2: On-Demand Batch Media Upload
* **As a** Field Surveyor,
* **I want to** explicitly trigger a batch upload of all gathered photos, drawings, and voice notes at the end of the survey,
* **So that** I can control cellular data consumption and verify files are sent to the cloud.
* **Acceptance Criteria:**
  - **Action Trigger:** "Run AI Analysis & Upload" button starts the batching.
  - **Connection Check:** If offline, displays a pop-up alert: "No Network Connection. Media assets cannot be uploaded. Please connect to internet to run AI analysis." in Crimson Red (`#991B1B`).
  - **Multi-Part Upload:** App compiles all original photos (`.jpg`), annotated drawings (`_annotated.jpg`), and compressed dictations (`.m4a`) for the active case ID and POSTs them as a multipart payload to `/api/v1/cases/:id/upload-media`.
  - **Upload Progress Bar:** Displays a horizontal progress bar tracking actual upload bytes percentage.

#### User Story 4.3: On-Demand Cloud AI Report Synthesis
* **As a** Field Surveyor,
* **I want to** select a specific cloud model and run automated analysis,
* **So that** my voice dictations are transcribed, damage severity is rated, and report comments are draft-compiled.
* **Acceptance Criteria:**
  - **Model Selection Dropdown:** Allows selection of cloud model options: `Gemini-1.5-Flash` (default), `Gemini-1.5-Pro`, or `GPT-4o-mini`.
  - **Backend AI Payload:** On successful batch upload, triggers an HTTP post to `/api/v1/cases/:id/analyze`, passing the chosen model string.
  - **AI Result Viewport:** Displays the returned markdown results containing:
    * Transcribed text of voice files.
    * Auto-generated loss estimate range and summary.
    * Severity badges: `MINOR` (Teal), `MODERATE` (Amber), `SEVERE` or `TOTAL LOSS` (Crimson).
    * Alert indicators highlighting missing checklist questions or photo tags.
  - **Cache Synced:** Stores AI results in local SQLite case cache.

---

## 5. Camera Evidence Screen (`CameraEvidenceScreen.tsx`)

### Screen Overview
High-precision viewfinder interface to capture geotagged, wizard-guided, and quality-controlled photos.

### User Stories & Acceptance Criteria

#### User Story 5.1: Legally Verifiable Watermark Flattening
* **As a** Compliance Manager,
* **I want** all captured case photos to bake in spatial and temporal metadata,
* **So that** evidence cannot be forged or altered.
* **Acceptance Criteria:**
  - **Watermark Text:** Applies a monospaced, high-contrast text overlay to the bottom of the camera image frame containing: Case ID, ISO Timestamp, Latitude/Longitude coordinates, Altitude, and Active Angle Label.
  - **Flattened Output:** The text watermark is hard-coded into the pixel buffer of the final exported JPEG, not just rendered as an overlay in the UI.

#### User Story 5.2: Wizard-Guided Angle Checklist
* **As a** Field Surveyor,
* **I want to** see a list of mandatory photo angles required for the current claim type,
* **So that** I collect all the necessary photographic evidence before leaving the site.
* **Acceptance Criteria:**
  - **Horizontal Chip Bar:** Renders target tags based on claim category:
    * *Motor:* `FRONT LEFT`, `FRONT RIGHT`, `ODOMETER`, `VIN PLATE`, `DASHBOARD`.
    * *Fire:* `POINT OF ORIGIN`, `FUSE BOX`, `STRUCTURAL EXT`, `INTERIOR ROOMS`.
  - **Visual States:** Checks (`✓`) on captured tags, amber bullet (`•`) on the current target angle prompt, and gray outline on outstanding tags.

#### User Story 5.3: Automated On-Device Exposure & Blur Checks
* **As a** Field Surveyor,
* **I want the camera interface to** run a real-time sanity check on the image buffer,
* **So that** I am alerted immediately if a photo is blurry, dark, or overexposed.
* **Acceptance Criteria:**
  - **Quality Check Algorithm:** Analyzes image buffers immediately post-capture:
    * *Under-exposure:* Average pixel brightness < 40/255.
    * *Over-exposure:* Average pixel brightness > 220/255.
    * *Blur:* Laplacian edge variance below threshold.
  - **Verdict Dialog Sheet:** Displays a slide-up menu with status colors:
    * **GOOD (Compliance Teal `#0F766E`):** Automatically saves.
    * **FAIR (Warning Amber `#B45309`):** Warns of minor issues, permits standard save.
    * **POOR (Damage Crimson `#991B1B`):** Strongly prompts retake; requires explicit override tap to save.
  - **Storage Targets:** Originals saved to `/cases/{id}/original/{photoId}.jpg` and thumbnails to `/cases/{id}/thumbnails/{photoId}.jpg`.

---

## 6. Voice Notes Screen (`VoiceNotesScreen.tsx`)

### Screen Overview
Voice recording screen to dictate inspection comments, featuring waveform visual feedback and local playbacks.

### User Stories & Acceptance Criteria

#### User Story 6.1: High-Fidelity Waveform Dictation
* **As a** Field Surveyor,
* **I want to** record verbal loss details using a visual wave monitor,
* **So that** I know the microphone is active and capturing my commentary.
* **Acceptance Criteria:**
  - **Waveform Canvas:** Renders a horizontal, glowing Steel Blue (`#2A4365`) frequency visualizer responding to mic input amplitude.
  - **Recording Toggle:** Large central button. Clicking it starts mic stream; background turns pulsating Damage Crimson (`#991B1B`) with a stop icon.
  - **Timer:** Displays elapsed duration as digital monospaced font `HH:MM:SS.hh`.
  - **File Saving:** Closes file stream and saves note as compressed `.m4a` file in `/cases/{id}/audio/{noteId}.m4a` on click.

#### User Story 6.2: Offline Audio Log Management
* **As a** Field Surveyor,
* **I want to** access a list of local recordings and play them back,
* **So that** I can review my dictations before uploading them for AI transcription.
* **Acceptance Criteria:**
  - **Audio List Feed:** Lists saved clips showing title (e.g. "Dictation #1"), timestamp, and file size.
  - **Local Playback controls:** Clicking a list card opens an inline audio player with Seek bar, Play/Pause toggle, and a Trash can delete button.

---

## 7. Checklist Form Screen (`ChecklistFormScreen.tsx`)

### Screen Overview
A structured form panel with input fields tailored dynamically to case claim domains, supporting offline auto-saving.

### User Stories & Acceptance Criteria

#### User Story 7.1: Dynamic Claim-Type Forms
* **As a** Field Surveyor,
* **I want** the checklist page to load specific form layouts tailored for the active claim type,
* **So that** I am not presented with irrelevant questions.
* **Acceptance Criteria:**
  - **Dynamic Loading:** Loads questionnaire configurations matching the case's claim type (e.g. Motor vehicle collision checklist vs Marine cargo inspection questions).
  - **Field Support:** Renders Text, Textarea, custom segmented Radio buttons, Date inputs, and Checkboxes.

#### User Story 7.2: Conditional Form Logic & Auto-Save
* **As a** Field Surveyor,
* **I want** the checklist inputs to expand conditionally and auto-save on change,
* **So that** I do not lose progress if my device shuts down or the app closes.
* **Acceptance Criteria:**
  - **Conditional Sections:** Trigger selections (e.g. toggling "Structural Damage" to YES) reveal nested sub-questions. Turning them off clears and hides nested answers.
  - **Auto-Save on Blur:** Checklist data is saved locally to SQLite/AsyncStorage on any input field `onBlur` event. Displays a temporary bottom toast: "✓ Checklist auto-saved locally on device".
  - **Progress Monitor:** The header progress bar in Compliance Teal (`#0F766E`) updates dynamically as required fields are filled.

---

## 8. Report Preview & Export Screen (`ReportPreviewScreen.tsx`)

### Screen Overview
Document compile screen to review layout settings, edit final remarks, and export the official PDF.

### User Stories & Acceptance Criteria

#### User Story 8.1: Report Compilation Config & Sign-off
* **As a** Field Surveyor,
* **I want to** toggle layout segments, input final remarks, and sign off digitally,
* **So that** I can curate what data and evidence are compiled into the official document.
* **Acceptance Criteria:**
  - **Configuration Toggles:** Checkboxes to "Attach Photos" (default ON), "Include GPS Coordinates" (default ON), and "Include Checklist Logs" (default OFF).
  - **Final Remarks Textarea:** Large input field for custom adjuster observations.
  - **Digital Sign-off Field:** Text input for inspector's signature name.
  - **Styled Document Webview:** Displays a high-contrast white document preview sheet matching the formal report layout template (letterhead, meta columns, photo grids, and signatures).

#### User Story 8.2: Server-Side PDF Compilation
* **As a** Field Surveyor,
* **I want to** trigger a server-side PDF render and download the file,
* **So that** I can share or email the document directly to the client before leaving the site.
* **Acceptance Criteria:**
  - **Action Trigger:** "Export PDF Report" sends remarks, signature, and configurations to `POST /api/v1/cases/:id/pdf`.
  - **Server PDF Generator:** Server merges case metadata, photo URLs, and signatures to compile a PDF binary.
  - **OS Sharing Integration:** On successful download of the PDF binary, the app triggers the native OS Share Sheet (permitting Mail, print, save, or WhatsApp export).

---

## 9. Photo Annotation Screen (`PhotoAnnotationScreen.tsx`)

### Screen Overview
Interactive canvas editor to draw overlay markings (arrows, shapes, text labels) directly on captured evidence photos.

### User Stories & Acceptance Criteria

#### User Story 9.1: Vector Annotation Overlay
* **As a** Field Surveyor,
* **I want to** draw circles, arrows, and write labels on a canvas over my captured photos,
* **So that** I can clearly point out scratches, cracks, or dent sizes in the final PDF.
* **Acceptance Criteria:**
  - **Interactive Toolbar:** Floating dock with Brush, Arrow, Circle, Rectangle, Text, Undo, and Clear tools.
  - **Active Tool highlight:** Steel Blue (`#2A4365`) highlights the currently active tool icon.
  - **Color Picker Swatches:** Solid color dots for Crimson Red (active default), Warning Amber, Cyan Blue, and Forest Teal.
  - **Canvas Response:** Captures touch drag gestures to render smooth vector lines and text overlays on top of the image container.

#### User Story 9.2: Double-Faceted Saving (Vector Cache & Flat JPEG)
* **As a** Field Surveyor,
* **I want to** save a flattened version of the annotated image for report printing while keeping the original vector layers editable,
* **So that** I can modify drawings later if needed.
* **Acceptance Criteria:**
  - **Relative Coordinates:** Stores all coordinates relative to image scale (0.0 to 1.0) inside the local database.
  - **Flattening Compositor:** Pressing "Save" merges the vector drawings with the original source image and writes the flat image to `/cases/{id}/evidence/{photoId}_annotated.jpg` (which is used in S3 uploads).
  - **Re-edit Capabilities:** Re-opening the screen retrieves the vector JSON coordinates, allowing the user to undo or adjust individual elements.
