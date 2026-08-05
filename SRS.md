# Software Requirements Specification (SRS)
## SurveyAgent - Mobile Field App v1.0

**Document Date:** August 2026  
**Target Platform:** React Native (iOS/Android), Realm DB (Local), Offline-First  
**Prepared by:** AI Development Team  

---

## 1. Executive Summary

SurveyAgent is an offline-first mobile field inspection application designed for insurance loss adjusters, surveyors, and field inspectors. The system enables field teams to create claims, capture geotagged evidence, record voice notes, complete smart checklists, and generate PDF reports—all without internet connectivity. All data persists locally until synced with the backend server.

**Core Value Proposition:**
- **100% Offline Capability**: All field operations function without internet
- **On-Device AI**: Local LLM and speech-to-text for intelligent analysis
- **Professional Reports**: Auto-generate PDF reports in 20-30 minutes
- **Evidence Integrity**: Immutable geotagged, timestamped photos with annotations

---

## 2. Functional Requirements by Screen

### 2.1 Case List Screen (`CaseListScreen.tsx`)

**Purpose:** Display all claim cases with filtering, search, and sync status visibility.

#### 2.1.1 Screen Components

| Component | Type | Description |
|-----------|------|-------------|
| **Header** | Navigation | App branding ("SurveyAgent Field"), online/offline status indicator, "Sync Now" button |
| **Search Bar** | Input | Real-time search across case number, insured name, policy number |
| **Claim Type Filter** | Chip Group | Horizontal scrollable filter: ALL, MOTOR, FIRE, MARINE, PROPERTY |
| **Status Filter** | Chip Group | Optional: ALL, DRAFT, IN_PROGRESS, REVIEW_PENDING, COMPLETED (expandable) |
| **Case Cards** | List | Repeating item displaying case metadata |
| **FAB** | Button | Floating action button (+) to create new case |
| **Empty State** | Placeholder | "No cases match your filters" message |

#### 2.1.2 Case Card Display (per item)

| Field | Source | Display Logic |
|-------|--------|----------------|
| **Claim Type Badge** | `claimType` | Left-aligned, colored pill (MOTOR=blue, FIRE=orange, etc.) |
| **Sync Status Badge** | `syncStatus` | Right-aligned, color-coded: SYNCED (green), PENDING (amber), OFFLINE_ONLY (indigo), ERROR (red) |
| **Case Number** | `caseNumber` | Large, bold heading (18px) |
| **Insured Name** | `insuredName` | Secondary text with prefix "Insured:" |
| **Policy Number** | `policyNumber` | Tertiary text with prefix "Policy:" (gray, 12px) |
| **Location** | `location` | 📍 icon + single-line location string |
| **Status** | `status` | Footer left: "Status: DRAFT/IN_PROGRESS/REVIEW_PENDING/COMPLETED" (green text) |
| **Priority** | `priority` | Footer right: "Priority: LOW/MEDIUM/HIGH/URGENT" (red/yellow text) |

#### 2.1.3 Interactions

| Action | Trigger | Behavior |
|--------|---------|----------|
| **Search** | Text input change | Filter cases in real-time; match against caseNumber, insuredName, policyNumber (case-insensitive) |
| **Filter by Claim Type** | Chip tap | Update `selectedClaimType` state; cards update immediately |
| **Sync Now** | Button tap | Call `syncEngine.syncNow()`, show loader, refresh case list, dismiss loader |
| **Pull-to-Refresh** | Swipe down | Trigger sync and reload cases |
| **Tap Case Card** | Card press | Navigate to `CaseDetail` screen with `caseId` parameter |
| **Tap FAB** | Button tap | Navigate to `CreateCase` screen |
| **Focus Event** | Screen focus | Re-load cases from Realm DB (to reflect changes from other screens) |

#### 2.1.4 UI/UX Requirements

- **Dark Theme**: Background #0f172a, cards #1e293b, text #f8fafc
- **Responsive Layout**: List cards occupy full width with 20px horizontal padding
- **Animations**: Card press opacity feedback (0.7), smooth list transitions
- **Accessibility**: High contrast text, semantic labeling for screen readers
- **Performance**: FlatList virtualization for 100+ cases

#### 2.1.5 Data Constraints

| Field | Type | Validation |
|-------|------|-----------|
| Search Query | string | Max 50 chars; trimmed, case-insensitive |
| Sync Status | enum | SYNCED \| PENDING \| OFFLINE_ONLY \| ERROR |
| Claim Type | enum | MOTOR \| FIRE \| MARINE \| PROPERTY \| ENGINEERING \| OTHER |
| Case Status | enum | DRAFT \| IN_PROGRESS \| REVIEW_PENDING \| COMPLETED \| SUBMITTED \| CLOSED |

---

### 2.2 Create Case Screen (`CreateCaseScreen.tsx`)

**Purpose:** Offline creation of new insurance claim cases with geolocation capture.

#### 2.2.1 Form Sections

##### Section 1: Claim Type Selection
| Field | Type | Required | Default | Options |
|-------|------|----------|---------|---------|
| **Claim Type** | Chip Group | Yes | MOTOR | MOTOR, FIRE, MARINE, ENGINEERING, PROPERTY, OTHER |

**Behavior:** Selecting a new claim type auto-generates a unique case number in format: `CAS-{YEAR}-{CLAIMTYPE}-{4-digit-random}`

##### Section 2: Claim Details
| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| **Case Reference Number** | Text Input | Yes | Auto-generated | 3–50 chars; alphanumeric + dashes |
| **Policy Number** | Text Input | Yes | Empty | 5–30 chars; alphanumeric + dashes/slashes |
| **Insured Name** | Text Input | Yes | Empty | 2–100 chars; letters, numbers, punctuation |
| **Insured Contact** | Text Input | No | Empty | Phone: E.164 format or email format |
| **Date of Loss** | Date Input | No | Today | Format: YYYY-MM-DD; cannot be future date |

##### Section 3: Site Location & GPS
| Field | Type | Required | Default | Behavior |
|-------|------|----------|---------|----------|
| **Inspection Site Address** | Text Area | No | Empty | Free text; 0–200 chars |
| **Latitude (Display)** | Numeric (Read-only) | No | "Not set" | Populated by "Auto-GPS" button; precision 6 decimals |
| **Longitude (Display)** | Numeric (Read-only) | No | "Not set" | Populated by "Auto-GPS" button; precision 6 decimals |
| **Auto-GPS Button** | Button | — | — | Simulates GPS fix: sets Lat/Lon to ~37.7749°, -122.4194°; populates location if empty |

**GPS Requirements:**
- GPS button fetches high-accuracy coordinate pair
- If location field is empty, auto-populate with reverse-geocoded address (simulated: "Market St & 4th St, San Francisco, CA")
- Show "Getting GPS..." state during acquisition
- Do NOT allow future-dated loss

##### Section 4: Priority & Status
| Field | Type | Required | Default | Options |
|-------|------|----------|---------|---------|
| **Priority** | Pill Buttons | No | MEDIUM | LOW, MEDIUM, HIGH, URGENT |
| **Initial Status** | Pill Buttons | No | DRAFT | DRAFT, IN_PROGRESS |

##### Section 5: Initial Loss Notes
| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| **Initial Notes** | Multiline Text Area | No | Empty | 0–1000 chars; free text |

#### 2.2.2 Interactions & Validation

| Action | Validation Logic | Error Behavior |
|--------|------------------|-----------------|
| **Submit / Create Case** | Case Number ✓, Policy ✓, Insured Name ✓ | Show Alert with missing field name; block submission |
| **Select Claim Type** | Auto-generate new Case Number | Update display immediately |
| **Tap Auto-GPS** | Simulate GPS fix | Show loader for 600ms; populate coordinates |
| **Edit GPS Coordinates** | Lat/Lon display only (read-only fields) | User must tap Auto-GPS to repopulate |

#### 2.2.3 Persistence & Navigation

1. Validate all required fields
2. Create UUID for `id` field using `createUuid()` utility
3. Set `organizationId` to hardcoded `'00000000-0000-0000-0000-000000000001'`
4. Set `syncStatus` to `'OFFLINE_ONLY'`
5. Set `createdAt` and `updatedAt` to current ISO timestamp
6. Persist to Realm DB via `realmManager.saveCase(newCase)`
7. On success: Show alert "Offline claim case created successfully!" with option to open Case Detail
8. Navigate to `CaseDetail` screen with `caseId` parameter

#### 2.2.4 UI/UX Requirements

- **Header**: Back (Cancel) button (left), Title "New Claim Case" (center), Create button (right)
- **Sections**: Each logical grouping in a card with gray background (#1e293b), border-radius 14px
- **Labels**: Small gray text (#94a3b8), uppercase for section headings
- **Inputs**: Dark background (#0f172a), cyan border (#334155), white text (#f8fafc)
- **Pills/Chips**: State-based coloring—inactive gray, active blue (#2563eb)
- **Disabled State**: Create button shows loader spinner during submission; 60% opacity

---

### 2.3 Case Detail Screen (`CaseDetailScreen.tsx`)

**Purpose:** View complete case metadata, evidence summary, and navigate to field modules.

#### 2.3.1 Screen Sections

##### Header Navigation
| Element | Behavior |
|---------|----------|
| Back Button | Navigate back to Case List |
| Case Number | Display bold heading (20px) |
| Claim Type Badge | Small pill with claim type value |

##### Claim Identification Card
| Field | Source | Display Format |
|-------|--------|-----------------|
| Insured Name | `case.insuredName` | "Insured: {value}" |
| Policy Number | `case.policyNumber` | "Policy: {value}" |
| Date of Loss | `case.dateOfLoss` | ISO date substring (YYYY-MM-DD) |
| Site Location | `case.location` | "Location: {value}" or "N/A" |

##### Field Modules Grid (2x2)
| Module | Icon | Count | Destination | Badge Data |
|--------|------|-------|-------------|-----------|
| **Camera & Evidence** | 📸 | `{medias.length}` | CameraEvidence screen | "Captured" |
| **Voice Notes** | 🎙️ | `{voiceNotes.length}` | VoiceNotes screen | "Audio Logs" |
| **Smart Checklist** | 📋 | Progress % | ChecklistForm screen | "Progress 75%" |
| **Export PDF** | 📄 | Action | ReportPreview screen | "Preview & Sign" |

##### Evidence Completeness Card (Conditional)
**Visibility:** Shown if `completeness` data is available from guided angles

| Element | Display Logic |
|---------|----------------|
| **Title** | "📷 Evidence Completeness" |
| **Fraction** | "{requiredCaptured}/{requiredTotal}" in color: green if complete, amber if incomplete |
| **Progress Bar** | Filled width = `(requiredCaptured / requiredTotal) * 100%` |
| **Detail Text** | If complete: "All compulsory angles captured — ready for report sign-off."<br/>If incomplete: "Missing: {angleLabels.join(', ')}" |

##### On-Device Local LLM Analysis Card
| Element | Behavior |
|---------|----------|
| **Title** | "⚡ On-Device Local LLM Analysis" |
| **Run AI Button** | Tap: Call `localLLMEngine.analyzeCaseOffline(case, medias, voiceNotes)` |
| **State: Empty** | Show placeholder text: "Tap 'Run AI Analysis' to execute..." |
| **State: Running** | Show spinner; button disabled |
| **State: Complete** | Display `caseItem.aiSummary` text + suggested severity + warnings |
| **Warnings** | Each missing info warning prefixed with ⚠️ |

#### 2.3.2 AI Analysis Result Structure

```typescript
{
  summary: string;  // Auto-drafted report overview
  suggestedDamageSeverity: 'MINOR' | 'MODERATE' | 'SEVERE' | 'TOTAL_LOSS';
  missingInformationWarnings: string[];  // e.g. "Front bumper angle not captured"
  confidence: number;  // 0–1
}
```

#### 2.3.3 Interactions

| Action | Trigger | Behavior |
|--------|---------|----------|
| **Tap Module Card** | Card press | Navigate to respective screen with `caseId` |
| **Run AI Analysis** | Button tap | Show loader; execute LLM analysis; persist result to case; display result in card |
| **Screen Focus** | Navigation focus event | Reload case data, media list, voice notes (to reflect captured evidence) |

#### 2.3.4 Data Loading

On component mount and on screen focus:
1. Load case item from Realm DB by `caseId`
2. Load all media records for case
3. Load all voice notes for case
4. Compute evidence coverage (guided angles completeness)
5. Display loaded state (or loading indicator if slow)

#### 2.3.5 UI/UX Requirements

- **Layout**: Scroll container for flexible content height
- **Cards**: Consistent styling—#1e293b background, 1px border #334155
- **Section Headings**: 16px, bold, white (#f8fafc), margin-bottom 12px
- **Info Rows**: Flex row with label (left) and value (right), border-bottom separator
- **Disabled AI Button**: Show spinner; prevent double-execution
- **Error Handling**: If case not found, show activity indicator

---

### 2.4 Camera Evidence Screen (`CameraEvidenceScreen.tsx`)

**Purpose:** Capture geotagged, timestamped evidence photos with guided angle prompts and quality analysis.

#### 2.4.1 Viewfinder Section

##### Live Camera Feed
| Element | Behavior |
|---------|----------|
| **Camera View** | Real-time video preview; Expo Camera integration |
| **Facing Toggle** | Flip between back and front camera (⟳ button in header) |
| **Torch Control** | Button to toggle flashlight; labeled "🔦 On" or "🔦 Off" |

##### Overlay Elements (Non-interactive)
| Element | Content | Behavior |
|---------|---------|----------|
| **GPS Pill (top-left)** | Status of GPS fix; green if READY, orange/red if warning | Text: "GPS READY: 37.7749° -122.4194°" or "Awaiting GPS fix..." |
| **Reticle (center)** | Red dashed circle crosshair | Visual aiming guide |
| **Bottom Overlay (translucent)** | Geotag watermark + case number + wizard prompt | Burned into every capture |

##### Watermark Content (Baked into Photo)
```
37.7749°, -122.4194°  ALT 85m
2026-08-04 • CAS-2026-MOTOR-1234
FRONT BUMPER IMPACT
Angle the camera to capture bumper edge and chassis mounting points.
```

#### 2.4.2 Guided Photo Wizard Card

| Component | Description |
|-----------|-------------|
| **Title** | "Guided Photo Wizard" with progress counter |
| **Progress Bar** | Visual fill bar: `{requiredCaptured}/{requiredTotal}` |
| **Angle Chips** | Horizontal grid of angle options (e.g., "✓ FRONT BUMPER", "• UNDERBODY LEAK", "○ AD-HOC") |
| **Missing List** | Red text listing outstanding compulsory angles: "Outstanding: Front Bumper, Interior Odometer" |

#### 2.4.3 Capture Workflow

| Step | UI State | User Action | System Response |
|------|----------|-------------|-----------------|
| **Ready** | Shutter button enabled | Tap "📸 Capture Evidence" | Launch camera, display live preview |
| **Photo Taken** | Modal opens: review sheet | Review capture preview | Show quality verdict + slot selector |
| **Review** | Quality card displayed | Select evidence slot (angle) or tap "Retake" | Update pending shot angle assignment |
| **Caption** | Text input visible | Tap caption field, type damage tag | Store caption text (e.g., "Radiator support crushed") |
| **Confirm** | "Save Evidence Offline" button enabled | Tap save | Flatten evidence (geotag watermark), persist to device storage, add to case media, close modal |

#### 2.4.4 Photo Quality Analysis

**On Capture:**
1. Run on-device blur/exposure analysis via `analyzePhoto(uri)`
2. Return verdict: "GOOD", "FAIR", "POOR"
3. Display quality score (0–100)
4. Show metrics: Sharpness (LOW/MEDIUM/HIGH), Brightness (LOW/MEDIUM/HIGH), Contrast (LOW/MEDIUM/HIGH)

**If POOR:**
- Display issues list (e.g., "Blurry", "Underexposed")
- Show confirmation alert: "Save this frame anyway?"
- Allow user to retake or force-save

| Verdict | Color | Trigger | User Action |
|---------|-------|---------|-------------|
| GOOD | Green (#22c55e) | Sharpness good, exposure balanced | Proceed to save |
| FAIR | Amber (#f59e0b) | Minor issues but usable | Proceed to save or retake |
| POOR | Red (#ef4444) | Major issues (blurry, dark) | Confirm override or retake |

#### 2.4.5 Media Gallery (Case Evidence List)

| Column | Layout | Item Display |
|--------|--------|--------------|
| **Tile Layout** | 2-column grid | Thumbnail image (120px height) |
| **Quality Badge** | Top-right corner | Score (e.g., "85") with background color (green/amber/red) |
| **Metadata** | Below thumbnail | Angle label, GPS coordinates (4 decimals), timestamp, annotation indicator (✏️) |
| **Interaction** | Long-press | Delete confirmation alert |
| **Navigation** | Tap tile | Navigate to PhotoAnnotation screen with `mediaId` |

#### 2.4.6 Geolocation Status

| Status | Visual | Message |
|--------|--------|---------|
| READY | Green pill | "GPS READY: 37.7749° -122.4194° ACC 10m" |
| ACQUIRING | Yellow pill | "GPS ACQUIRING..." |
| DENIED | Red banner | "⚠️ GPS Permission Denied. Tap to retry." |
| DISABLED | Red banner | "⚠️ Location Services Disabled. Tap to retry." |
| ERROR | Red banner | "⚠️ GPS Fix Failed. Tap to retry." |

**Ungeotagged Photos:** Tagged with AI label `'no_gps'`; flagged with ⚠️ in gallery

#### 2.4.7 Evidence Persistence

**File Structure (Device Storage):**
```
/storage/emulated/0/SurveyAgent/
  ├── cases/{caseId}/
  │   ├── evidence/       (annotated, geotagged JPEG)
  │   ├── original/       (pristine capture)
  │   ├── thumbnails/     (96px JPEG for gallery)
  │   └── annotations/    (vector JSON overlays)
```

**Media Record in Realm DB:**
```typescript
{
  id: UUID;
  caseId: UUID;
  localPath: string;      // File URI to stamped evidence JPEG
  originalPath: string;   // File URI to original capture
  thumbnailPath: string;  // File URI to gallery thumbnail
  fileType: 'PHOTO';
  latitude: number;
  longitude: number;
  altitude?: number;
  gpsAccuracy?: number;
  heading?: number;
  timestamp: ISO8601;
  angleId: string;        // e.g., 'front_bumper'
  angleLabel: string;     // e.g., 'FRONT BUMPER'
  quality: JSON string;   // Serialized PhotoQualityReport
  aiTags: string[];       // e.g., ['front_bumper', 'geotagged', 'high_confidence']
  caption?: string;
  annotations?: string;   // Serialized annotation array
  isSynced: boolean;
}
```

#### 2.4.8 UI/UX Requirements

- **Camera Permission**: Request on first load; show permission prompt if denied
- **Viewfinder**: 380px height, 16px border-radius, dark background
- **Responsiveness**: Adapt preview size to screen width (screenWidth - 32px padding)
- **Animations**: Shutter button visual feedback on press
- **Accessibility**: High-contrast text overlays, voice guidance in header
- **Performance**: Async quality analysis without blocking UI thread

---

### 2.5 Voice Notes Screen (`VoiceNotesScreen.tsx`)

**Purpose:** Record field audio dictation and perform on-device speech-to-text transcription.

#### 2.5.1 Record Control Panel

| Element | State | Display |
|---------|-------|---------|
| **Instruction Text** | Idle | "Tap mic button to start voice dictation" |
| **Instruction Text** | Recording | "🔴 RECORDING... Speak findings clearly" |
| **Instruction Text** | Transcribing | "⚡ Transcribing audio via Offline Whisper STT..." |
| **Mic Button** | Idle | 72×72px circle, blue (#2563eb), icon: 🎙️ |
| **Mic Button** | Recording | 72×72px circle, red (#ef4444), icon: ⏹️ (stop) |
| **Mic Button** | Transcribing | 72×72px circle, spinner animation (disabled) |
| **Whisper Tag** | Always | "Powered by On-Device Whisper Model (Offline)" (small, cyan text) |

#### 2.5.2 Record Workflow

| Step | Trigger | Behavior | Time |
|------|---------|----------|------|
| 1. **Start Record** | Tap mic button | Set recording=true; show red stop icon | — |
| 2. **Audio Capture** | Device microphone | Stream audio to native recorder | 0–300 seconds |
| 3. **Stop Record** | Tap stop button | Set recording=false; set transcribing=true; save audio to file | — |
| 4. **Transcribe** | Auto-triggered | Call `whisperSTTEngine.transcribeAudio(path)` | 5–30 seconds (on-device) |
| 5. **Save Transcript** | Transcription complete | Create VoiceNote object; persist to Realm DB; reload list | — |
| 6. **Complete** | Transcribe done | Show success alert; refresh voice notes list | — |

#### 2.5.3 Voice Note Record

| Field | Type | Description |
|-------|------|-------------|
| **id** | UUID | Unique identifier (format: `vnote-{timestamp}`) |
| **caseId** | UUID | Link to parent case |
| **localAudioPath** | file:// URI | Path to saved audio file (MP3) |
| **durationSeconds** | number | Length of recording (integer) |
| **transcript** | string | Full STT output text (0–5000 chars) |
| **isTranscribed** | boolean | Flag: true if STT processing complete |
| **createdAt** | ISO8601 | Timestamp when recording was finalized |

#### 2.5.4 Audio Transcripts List

| Display | Component |
|---------|-----------|
| **Section Title** | "Audio Logs & Transcripts ({count})" |
| **Card per Note** | Repeating list item |

**Card Layout:**
```
┌─────────────────────────────────────┐
│ Audio Note #1 (18s)  |  14:32:05   │
├─────────────────────────────────────┤
│ Inspected vehicle on-site. Moderate  │
│ frontal impact damage confirmed...   │
└─────────────────────────────────────┘
```

| Field | Source | Format |
|-------|--------|--------|
| Title | `#{index+1} ({durationSeconds}s)` | Bold cyan text (13px) |
| Timestamp | `createdAt` | Locale time string (right-aligned, gray) |
| Transcript | `transcript` | Body text (gray, 13px), break on word boundary |

#### 2.5.5 Constraints & Validation

| Constraint | Limit | Note |
|-----------|-------|------|
| Max Recording Duration | 300 seconds (5 min) | Stop recording auto-stop or user-initiated |
| Transcript Max Length | 5000 chars | Whisper output capped |
| Number of Notes per Case | Unlimited | Stored in Realm DB |
| Audio Format | MP3 | Stored on device |

#### 2.5.6 UI/UX Requirements

- **Container**: Full-width screen, dark background (#0f172a), padding 20px
- **Record Panel**: Card styled (#1e293b), centered, border-radius 16px, 24px padding
- **List Container**: Scrollable if >3 notes; card styling (#1e293b) for each note
- **Accessibility**: Large touch target for mic button (72×72px), voice feedback
- **Performance**: Async transcription without UI blocking; show spinner during processing

---

### 2.6 Checklist Form Screen

**Purpose:** Dynamic, claim-type-specific inspection checklists with conditional fields.

#### 2.6.1 Checklist Templates

**Motor Claims Checklist:**
- Vehicle Registration & VIN verification
- Exterior Damage Assessment (Front, Side, Rear)
- Glass Damage (Windshield, Side windows, Rear)
- Interior Damage (Seats, Dashboard, Controls)
- Mechanical Systems (Engine, Transmission, Brakes)
- Estimated Repair Cost Range
- Surveyor Notes

**Fire/Property Claims Checklist:**
- Extent of Damage (Minor, Moderate, Severe, Total Loss)
- Affected Areas (Roof, Walls, Interior, Contents)
- Cause of Fire (Electrical, Accidental, Undetermined, Other)
- Water Damage (Secondary)
- Salvage Assessment
- Estimated Rebuild Cost

**Marine Claims Checklist:**
- Vessel Hull Inspection
- Engine & Machinery Assessment
- Cargo Condition (if applicable)
- Seaworthiness Status
- Collision/Grounding Details

**Engineering Claims Checklist:**
- Boiler Inspection
- Pressure Equipment Assessment
- Safety Device Functionality
- Operational Status

#### 2.6.2 Field Types & Conditional Logic

| Field Type | Display | Behavior |
|-----------|---------|----------|
| **Text Input** | Single-line text box | Free text entry; optional max length |
| **Textarea** | Multi-line text area | Free text; 3–10 lines |
| **Checkbox** | Toggle checkbox | Binary yes/no; can trigger conditional fields |
| **Radio Group** | Vertical radio buttons | Single selection from options |
| **Dropdown/Picker** | Dropdown selector | Single selection from list |
| **Number Input** | Numeric spinner | Integer or decimal value |
| **Date Picker** | Date selector | YYYY-MM-DD format |

**Conditional Field Example:**
```
"Is there fluid leakage?" [Checkbox]
→ IF YES (checked):
  → Show: "Fluid Type" [Dropdown: Oil, Coolant, Transmission, Brake, Other]
  → Show: "Estimated Leakage Volume (liters)" [Number Input]
```

#### 2.6.3 Progress Tracking

| Component | Display | Calculation |
|-----------|---------|-------------|
| **Progress Bar** | Horizontal fill bar | `(completedFields / totalFields) * 100%` |
| **Progress Text** | "Progress: 75%" or "12/16 fields completed" | Update real-time as user fills fields |
| **Visual Indicator** | Filled portion color green (#22c55e) | Change color to amber if 50%, green if >75% |

#### 2.6.4 Data Persistence

**Checklist Item Record:**
```typescript
{
  id: string;
  caseId: UUID;
  claimType: ClaimType;
  fieldName: string;
  fieldValue: string | number | boolean | Date;
  fieldType: 'TEXT' | 'TEXTAREA' | 'CHECKBOX' | 'RADIO' | 'DROPDOWN' | 'NUMBER' | 'DATE';
  isRequired: boolean;
  isConditionMet: boolean;
  completedAt?: ISO8601;
  updatedAt: ISO8601;
}
```

**Persistence:** Auto-save to Realm DB on field blur or value change (debounced 500ms)

#### 2.6.5 UI/UX Requirements

- **Layout**: Scrollable card-based form; each field in light card (#1e293b)
- **Labels**: 12px gray text (#94a3b8); required fields marked with red asterisk (*)
- **Validation Feedback**: Inline error text below field if validation fails (red, 11px)
- **Disabled Conditional Fields**: Grayed out if condition not met; hidden from flow
- **Button**: "Save Checklist" button at bottom; shows completion status
- **Accessibility**: High-contrast labels, descriptive placeholder text

---

### 2.7 Report Preview Screen (`ReportPreviewScreen.tsx`)

**Purpose:** Preview, customize, and export professional PDF survey reports.

#### 2.7.1 Export Options Card

| Control | Type | Default | Behavior |
|---------|------|---------|----------|
| **Include Photo Proof** | Toggle Switch | ON | When OFF: omit photo grid from PDF |
| **Include GPS Coordinates** | Toggle Switch | ON | When OFF: omit geotag data from report |
| **Include Checklist** | Toggle Switch | ON | When OFF: omit checklist answers from report |

#### 2.7.2 Custom Fields

| Field | Type | Max Length | Description |
|-------|------|-----------|-------------|
| **Inspector Final Remarks** | Textarea | 1000 | Custom observations/conclusions at report end |
| **Digital Inspector Sign-Off** | Text Input | 100 | Inspector name or digital signature block |

#### 2.7.3 Report Structure (Generated HTML)

```
┌─────────────────────────────────────────────────┐
│         SURVEYAGENT LOSS REPORT                 │
│  Case: CAS-2026-MOTOR-1234                      │
│  Policy: POL-9948102 • Insured: John Doe       │
│  Date of Loss: 2026-08-04                       │
├─────────────────────────────────────────────────┤
│  1. CLAIM IDENTIFICATION                        │
│     ├─ Claim Type: MOTOR                        │
│     ├─ Priority: HIGH                           │
│     └─ Status: IN_PROGRESS                      │
├─────────────────────────────────────────────────┤
│  2. AI FINDINGS & DAMAGE SUMMARY                │
│     {aiSummary or default text}                 │
├─────────────────────────────────────────────────┤
│  3. EVIDENCE PHOTOS ({count} photos)            │
│     [Grid of geotagged photo thumbnails]        │
├─────────────────────────────────────────────────┤
│  4. VOICE TRANSCRIPTIONS                        │
│     {transcript[0] or default}                  │
├─────────────────────────────────────────────────┤
│  5. INSPECTION CHECKLIST                        │
│     [Completed checklist answers]               │
├─────────────────────────────────────────────────┤
│  6. INSPECTOR REMARKS & SIGN-OFF                │
│     {Inspector remarks text}                    │
│     Digital Signature: John Inspector           │
│     Generated: 2026-08-04 14:32:05              │
├─────────────────────────────────────────────────┤
│  Verified Geotagged Field Audit                 │
│  100% Offline Generation • SurveyAgent v1.0    │
└─────────────────────────────────────────────────┘
```

#### 2.7.4 Photo Grid in Report

| Spec | Value |
|------|-------|
| **Photo Count** | All media records for case (if includePhotos=true) |
| **Layout** | 2-column grid (for PDF, scales to 1 column on mobile) |
| **Thumbnail Size** | ~300×250px (aspect ratio preserved) |
| **Metadata per Photo** | Angle label, GPS coordinates (4 decimals), timestamp |
| **Data URI Embedding** | Photos inlined as base64 data URIs (self-contained PDF) |

#### 2.7.5 Export Flow

| Step | UI State | Action | Result |
|------|----------|--------|--------|
| 1. **Load Data** | Loading spinner | Fetch case, media, voice notes from Realm DB | Display preview HTML frame |
| 2. **Customize** | Editable form | User adjusts remarks, signature, toggles; modifies options | Preview updates in real-time |
| 3. **Preview** | Static HTML mock | Display styled preview frame (approximates PDF output) | User reviews before export |
| 4. **Export** | "📄 Export PDF Report" button | Tap button | Trigger native PDF render; save to device; show success alert |
| 5. **Success** | Alert notification | File saved to `/storage/emulated/0/SurveyAgent/reports/{caseNumber}_Report.pdf` | Prompt to navigate back or share |

#### 2.7.6 File Output

**Export Path:** `/storage/emulated/0/SurveyAgent/reports/{caseNumber}_Report.pdf`

**File Properties:**
- Format: PDF (binary)
- Encoding: UTF-8 with embedded base64 images
- Size: 2–15 MB (depending on photo count)
- Accessibility: Text-selectable, high-contrast styling

#### 2.7.7 UI/UX Requirements

- **Layout**: Full-width scroll container; cards for options and preview
- **Toggles**: Switch controls with clear labels
- **Textareas**: Multi-line inputs with placeholder text
- **Preview Frame**: Scrollable mock-up of PDF (not live rendering); shows representative sections
- **Export Button**: Large, prominent green button (#10b981) at bottom
- **Accessibility**: Keyboard navigation, high-contrast text, clear field labels

---

### 2.8 Photo Annotation Screen (`PhotoAnnotationScreen.tsx`)

**Purpose:** Add vector annotations (arrows, circles, text, measurements) to evidence photos.

#### 2.8.1 Drawing Tools

| Tool | Icon | Use Case | Input |
|------|------|----------|-------|
| **Arrow** | → | Point to damage/defect | Start/end points (2 taps) |
| **Circle** | ⭕ | Highlight area of interest | Center + radius (drag) |
| **Rectangle** | ▭ | Outline damage region | Diagonal corners (drag) |
| **Text** | T | Label findings | Touch point + keyboard input |
| **Measure** | ⧈ | Distance measurement | Start + end points + label |
| **Freehand** | ✎ | Sketch/annotation | Free drawing path |

#### 2.8.2 Tool Options

| Control | Type | Options | Default |
|---------|------|---------|---------|
| **Color Selector** | Pill Group | Red, Yellow, Green, Cyan, White, Black | Red |
| **Stroke Width** | Button Group | 2px, 4px, 7px | 4px |
| **Undo** | Button | Removes last annotation | — |
| **Clear All** | Button | Remove all annotations (with confirmation) | — |

#### 2.8.3 Annotation Record

```typescript
{
  tool: 'ARROW' | 'CIRCLE' | 'RECTANGLE' | 'TEXT' | 'MEASURE' | 'FREEHAND';
  color: string;  // Hex or CSS color
  strokeWidth: number;  // Pixels
  points: Array<{x: number; y: number}>;  // Normalized [0–1] coordinates
  label?: string;  // For TEXT and MEASURE
  timestamp: ISO8601;
}
```

**Serialization:** Annotations stored as JSON string in `media.annotations` field

#### 2.8.4 Canvas Interaction Modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Draft** | Tool selected, not on canvas | Cross-hair cursor; awaiting input |
| **Drawing** | Dragging on canvas | Real-time visual feedback of shape |
| **Labeling** | TEXT or MEASURE selected | After initial input, prompt modal for text label |
| **Commit** | Release drag or confirm label | Add annotation to list; update `dirty` flag |

#### 2.8.5 Persistence & Flattening

**Workflow:**
1. User edits annotations on canvas
2. Set `dirty = true`
3. On save: Call `flattenEvidence(composerRef, EXPORT_WIDTH, aspect)`
4. Flatten composite: original frame + vector annotations → new JPEG
5. Persist flattened image and annotation JSON to Realm DB
6. Re-flatten from original on subsequent edits (prevents JPEG artifact accumulation)

**File Naming:**
- `evidence_annotated_{timestamp}.jpg` (for storage)
- Original pristine frame retained in `originalPath`

#### 2.8.6 UI/UX Requirements

- **Canvas**: Full-width image preview (top 60% of screen)
- **Toolbar**: Horizontal scrollable strip of tool buttons
- **Color/Stroke Controls**: Horizontal option bar below canvas
- **Undo/Clear Buttons**: Action buttons below controls
- **Unsaved Changes**: Show alert if user attempts to navigate without saving
- **Label Prompt**: Modal dialog for TEXT/MEASURE labeling
- **Performance**: Canvas renders at 60 FPS; large images scaled for on-device processing

---

## 3. Non-Functional Requirements

### 3.1 Performance

| Metric | Target | Constraint |
|--------|--------|-----------|
| Case List Load | <500 ms | 100+ cases |
| Camera Capture | <2 seconds | Photo taken to preview modal |
| Quality Analysis | <3 seconds | On-device blur/exposure scan |
| Transcription | 5–30 seconds | On-device Whisper STT |
| PDF Export | <5 seconds | 20 photos, inline base64 encoding |
| App Startup | <2 seconds | Cold launch from kill state |

### 3.2 Offline Resilience

- **No Internet**: All screens remain functional; sync queues locally
- **Network Restore**: Auto-detect with NetInfo; queue flushes on reconnect
- **Sync Failures**: Retry logic with exponential backoff (max 5 retries)
- **Data Loss Prevention**: All mutations logged in SyncQueue before UI state update

### 3.3 Storage

| Resource | Limit | Rationale |
|----------|-------|-----------|
| Photos per Case | Unlimited | Device storage permitting |
| Photo Quality | 1440px max dimension | Balances quality & device memory |
| Realm DB | SQLite, <500 MB per case | On-device persistence layer |
| Audio Files | Unlimited | MP3 format, compress as stored |

### 3.4 Security & Data Integrity

- **Geotag Watermark**: Baked into JPEG pixels (immutable)
- **Timestamp Stamping**: ISO8601 embedded in EXIF + watermark
- **Synced Flag**: Tracks cloud upload status; prevents re-upload
- **Encryption at Rest**: Realm DB encrypted if OS-level encryption enabled
- **No Credentials Stored**: JWT tokens held in secure storage (OS keychain)

### 3.5 Accessibility

- **WCAG 2.1 AA**: High contrast ratios (4.5:1 text on background)
- **Screen Reader Support**: Semantic labels, descriptive button text
- **Touch Targets**: Minimum 44×44 pixels for interactive elements
- **Color Blind**: Do not rely on color alone for status indicators (also use icons/text)
- **Text Sizing**: Respect OS-level font size preferences

### 3.6 Localization

- **Language**: English (primary; extensible to Spanish, French, German)
- **Date Formats**: Locale-aware (e.g., MM/DD/YYYY vs. DD/MM/YYYY)
- **Currency**: USD (extensible to other currencies for international use)

---

## 4. UI/UX Design System

### 4.1 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `background-primary` | #0f172a | Screen background |
| `background-secondary` | #1e293b | Card, container background |
| `background-tertiary` | #0f172a | Input, nested container background |
| `border-default` | #334155 | Card borders, dividers |
| `text-primary` | #f8fafc | Main text (headings, body) |
| `text-secondary` | #94a3b8 | Labels, hints, secondary text |
| `text-tertiary` | #64748b | Muted text, timestamps |
| `status-success` | #22c55e | Positive actions, complete state |
| `status-warning` | #f59e0b | Caution, incomplete, pending |
| `status-danger` | #ef4444 | Errors, destructive actions |
| `status-info` | #38bdf8 | Informational, links, secondary CTA |
| `action-primary` | #2563eb | Primary buttons, active states |
| `action-secondary` | #334155 | Secondary buttons, inactive chips |

### 4.2 Typography

| Element | Font Size | Font Weight | Line Height | Color |
|---------|-----------|------------|------------|-------|
| **H1 (Screen Title)** | 22px | Bold (700) | 1.3 | text-primary |
| **H2 (Section Heading)** | 18px | Bold (700) | 1.3 | text-primary |
| **H3 (Card Heading)** | 16px | Bold (700) | 1.2 | text-primary |
| **Body (Large)** | 16px | Regular (400) | 1.5 | text-primary |
| **Body (Normal)** | 14px | Regular (400) | 1.5 | text-primary |
| **Body (Small)** | 12px | Regular (400) | 1.4 | text-secondary |
| **Caption** | 10px | Regular (400) | 1.3 | text-tertiary |
| **Label** | 12px | Semibold (600) | 1.4 | text-secondary |
| **Button Text** | 14px | Semibold (600) | 1.2 | (varies by button type) |

### 4.3 Spacing Scale

```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 20px
2xl: 24px
3xl: 32px
4xl: 40px
```

### 4.4 Border Radius

| Variant | Radius | Usage |
|---------|--------|-------|
| `rounded-sm` | 4px | Small buttons, badges |
| `rounded-md` | 8px | Input fields, chips |
| `rounded-lg` | 12px | Cards, modals, tabs |
| `rounded-xl` | 16px | Large components, full-width sections |
| `rounded-full` | 9999px | Circular elements (FAB, avatars) |

### 4.5 Component States

#### Button States
- **Default**: Primary color background, white text
- **Hover** (web): 10% darker tint
- **Pressed**: 15% darker tint, slight scale (0.98)
- **Disabled**: 60% opacity, pointer-events none
- **Loading**: Show spinner, text hidden

#### Input States
- **Idle**: Gray border (#334155), dark background (#0f172a)
- **Focus**: Cyan border (#38bdf8), slight shadow
- **Error**: Red border (#ef4444), error text below
- **Disabled**: 50% opacity, pointer-events none

#### Card States
- **Default**: #1e293b background, #334155 border
- **Hover**: Slight shadow lift (elevation 2)
- **Active/Selected**: Blue border (#2563eb)
- **Disabled**: 60% opacity

---

## 5. Data Models & Schemas

### 5.1 Case Schema (Realm DB)

```typescript
interface Case {
  id: string;  // UUID
  organizationId: string;  // UUID
  caseNumber: string;  // e.g., "CAS-2026-MOTOR-1234"
  claimType: 'MOTOR' | 'FIRE' | 'MARINE' | 'ENGINEERING' | 'PROPERTY' | 'OTHER';
  policyNumber: string;
  insuredName: string;
  insuredContact?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  dateOfLoss: ISO8601;
  assignedDate: ISO8601;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'DRAFT' | 'IN_PROGRESS' | 'REVIEW_PENDING' | 'COMPLETED' | 'SUBMITTED' | 'CLOSED';
  syncStatus: 'OFFLINE_ONLY' | 'PENDING' | 'SYNCED' | 'ERROR';
  notes?: string;
  aiSummary?: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}
```

### 5.2 Media Schema (Realm DB)

```typescript
interface Media {
  id: string;  // UUID
  caseId: string;  // UUID
  localPath: string;  // File URI to stamped evidence
  originalPath?: string;
  thumbnailPath?: string;
  fileType: 'PHOTO' | 'VIDEO' | 'AUDIO';
  latitude?: number;
  longitude?: number;
  altitude?: number;
  gpsAccuracy?: number;
  heading?: number;
  timestamp: ISO8601;
  angleId: string;
  angleLabel?: string;
  quality?: string;  // JSON serialized PhotoQualityReport
  aiTags: string[];
  caption?: string;
  annotations?: string;  // JSON serialized Annotation[]
  width: number;
  height: number;
  fileSize: number;
  isSynced: boolean;
}
```

### 5.3 VoiceNote Schema (Realm DB)

```typescript
interface VoiceNote {
  id: string;
  caseId: string;
  localAudioPath: string;  // file:// URI to MP3
  durationSeconds: number;
  transcript: string;
  isTranscribed: boolean;
  createdAt: ISO8601;
}
```

---

## 6. Error Handling & Edge Cases

### 6.1 Camera Failures

| Scenario | User Feedback | Recovery |
|----------|---------------|----------|
| Permission denied | Alert prompt | Redirect to OS settings or back to case |
| Camera not available | Alert + disable button | Disable capture button; show placeholder |
| Photo capture timeout | Alert | Retry capture or return to main screen |
| GPS fix unavailable | Yellow banner + flag | Proceed with capture; mark `no_gps` tag |

### 6.2 Sync Failures

| Scenario | User Feedback | Retry Logic |
|----------|---------------|------------|
| Network timeout | Show error badge on case | Retry on next sync attempt |
| Server error (5xx) | Toast notification | Exponential backoff (1s, 2s, 4s, 8s, 16s) |
| Validation error (4xx) | Alert with error details | Do not retry; require user correction |
| Partial sync failure | Update partial synced records | Retry unsynced mutations on next cycle |

### 6.3 Storage Edge Cases

| Scenario | Handling |
|----------|----------|
| Device storage full | Alert user; prevent new captures; cleanup old media if permitted |
| Corrupted media file | Skip file; log error; allow user to retake photo |
| Realm DB corruption | Offer factory reset; export case data if possible |

---

## 7. Acceptance Criteria

### 7.1 Case List Screen

- [ ] Display 50+ cases without lag
- [ ] Search filters across all three fields (case number, insured name, policy) in real-time
- [ ] Sync button triggers `syncEngine.syncNow()` and updates badges
- [ ] FAB navigates to CreateCase screen
- [ ] Case card tap navigates to CaseDetail with correct `caseId`
- [ ] Offline mode indicator shows correct network status

### 7.2 Create Case Screen

- [ ] All required fields (Case Number, Policy, Insured Name) validate on submit
- [ ] GPS button fetches simulated high-precision coordinates
- [ ] Case number auto-generates on claim type selection
- [ ] Case persists to Realm DB with UUID id and OFFLINE_ONLY sync status
- [ ] Post-creation, app navigates to CaseDetail screen
- [ ] Back button cancels creation without saving

### 7.3 Case Detail Screen

- [ ] Loads case metadata and displays all fields
- [ ] Evidence module shows count of captured media
- [ ] Voice notes module shows count of audio logs
- [ ] Checklist module shows progress percentage
- [ ] PDF export module is tappable
- [ ] Run AI Analysis button triggers LLM analysis and persists result
- [ ] On screen refocus, case data reloads to reflect captured evidence

### 7.4 Camera Evidence Screen

- [ ] Live camera preview displays with GPS/timestamp watermark
- [ ] Capture button takes photo, displays review modal
- [ ] Quality analysis runs on-device; verdict displayed (GOOD/FAIR/POOR)
- [ ] Guided angle wizard shows progress and missing angles
- [ ] Save Evidence persists media to device storage and Realm DB
- [ ] Retake discards photo without saving
- [ ] Gallery list displays 2-column grid with thumbnails
- [ ] Long-press on gallery tile shows delete confirmation

### 7.5 Voice Notes Screen

- [ ] Mic button toggles recording state (blue→red)
- [ ] Stop button triggers transcription via Whisper STT
- [ ] Transcription completes and displays in list
- [ ] Audio notes persist to Realm DB
- [ ] List displays all voice notes with timestamp and transcript

### 7.6 Report Preview Screen

- [ ] Report HTML preview displays all sections
- [ ] Toggles for photos, geotags, checklist work correctly
- [ ] Custom remarks and signature text update preview
- [ ] Export PDF button saves file locally and shows success alert
- [ ] File path shown in alert matches expected location

### 7.7 Photo Annotation Screen

- [ ] Canvas loads with evidence photo
- [ ] Drawing tools (arrow, circle, text, measure) respond to input
- [ ] Color and stroke width controls update drawn shapes
- [ ] Undo button removes last annotation
- [ ] Clear All shows confirmation alert
- [ ] Save flattens annotations into JPEG and persists to DB
- [ ] Back without save shows unsaved changes alert

---

## 8. Glossary

| Term | Definition |
|------|-----------|
| **Geotagged** | Photo with embedded GPS coordinates (latitude, longitude, altitude) |
| **Sync Status** | State of case/media regarding cloud upload (OFFLINE_ONLY, PENDING, SYNCED, ERROR) |
| **Watermark** | Baked-in text/GPS stamp in photo JPEG (immutable) |
| **Guided Angle** | Pre-defined photo pose (e.g., "FRONT BUMPER", "UNDERBODY LEAK") |
| **On-Device AI** | Local quantized LLM/STT models running without internet connectivity |
| **Delta Sync** | Incremental sync protocol: upload only changed records (CREATE/UPDATE/DELETE) |
| **SyncQueue** | Realm DB table tracking pending mutations awaiting cloud sync |
| **Verdict** | Photo quality assessment result (GOOD, FAIR, POOR) |
| **Flatten** | Rasterize vector annotations onto JPEG image |
| **Data URI** | Base64-encoded image embedded in HTML/PDF (self-contained) |

---

## 9. Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-08-04 | AI Development | Initial SRS creation covering v1.0 MVP features |

---

**Document Status:** APPROVED FOR DEVELOPMENT
**Next Review Date:** 2026-09-04
