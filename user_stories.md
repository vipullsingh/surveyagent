# User Stories & Acceptance Criteria
## SurveyAgent Mobile Field App v1.0

**Document Date:** August 2026  
**Epic:** Offline-First Field Inspection Application  
**Format:** User Story → Acceptance Criteria (AC) per screen

---

## CASE LIST SCREEN

### US-1.1: View All Assigned Claim Cases

**User Story:**
```
As a Field Surveyor
I want to see a list of all my assigned claim cases
So that I can prioritize which cases to inspect today
```

**Background:**
- Surveyor has 5–50 assigned cases across MOTOR, FIRE, MARINE, PROPERTY claim types
- Cases are stored locally in Realm DB
- Some cases have synced status (cloud), others are offline-only drafts

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-1.1.1 | Load case list on screen mount | FlatList renders all cases from `realmManager.getCases()` within 500ms |
| AC-1.1.2 | Display case card details | Each card shows: claim type badge, sync status badge, case number, insured name, policy number, location, status, priority |
| AC-1.1.3 | Sort cases by default | Cases appear in reverse chronological order (newest first) by `createdAt` |
| AC-1.1.4 | Show empty state | If no cases exist, display: "No cases match your filters." centered on screen |
| AC-1.1.5 | Non-blocking UI | Case list loads before evidence counts; show placeholder counts while loading media |
| AC-1.1.6 | Re-load on focus | When screen regains focus (e.g., returning from CaseDetail), call `loadCases()` to refresh |

**Notes:**
- Use FlatList for virtualization (100+ cases support)
- Dark theme: #0f172a background, #1e293b cards

---

### US-1.2: Search Cases by Multiple Fields

**User Story:**
```
As a Field Surveyor
I want to quickly search for a specific case by case number, insured name, or policy number
So that I can locate a case without scrolling through the entire list
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-1.2.1 | Real-time search filter | Type in search box → list updates immediately (no submit button) |
| AC-1.2.2 | Search fields | Match query against: `caseNumber`, `insuredName`, `policyNumber` (substring, case-insensitive) |
| AC-1.2.3 | Clear search | Tap "X" in search box (or delete all text) → list resets to full set |
| AC-1.2.4 | Combine with filters | Search results respect active claim type and status filters |
| AC-1.2.5 | Search on empty list | Typing in search box when no cases exist shows: "No cases match your filters." |
| AC-1.2.6 | Performance | Search on 100 cases completes in <50ms (no noticeable lag) |

**Example Flows:**
- Search "MOTOR-1234" → returns case with that number
- Search "John" → returns all cases insured by anyone named John
- Search "POL-9948" → returns case with matching policy number

---

### US-1.3: Filter Cases by Claim Type

**User Story:**
```
As a Field Surveyor
I want to filter cases by claim type (MOTOR, FIRE, MARINE, etc.)
So that I can focus on cases I'm trained to inspect
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-1.3.1 | Display filter chips | Horizontal scrollable row: ALL, MOTOR, FIRE, MARINE, PROPERTY chips |
| AC-1.3.2 | Tap to filter | Tap chip → `selectedClaimType` updates → list filtered immediately |
| AC-1.3.3 | Visual active state | Active chip: blue background (#2563eb), white text; inactive: gray background (#1e293b), gray text |
| AC-1.3.4 | Default selection | On screen load, "ALL" is active (no filter applied) |
| AC-1.3.5 | Filter + search stacking | Search term AND claim type filter work together |
| AC-1.3.6 | Refilter on return | Chip selection persists if user navigates away and back (within session) |

**Example Flow:**
- Tap "MOTOR" chip → case list shows only MOTOR claims
- Tap "FIRE" chip → case list updates to show only FIRE claims
- Tap "ALL" chip → full list restored

---

### US-1.4: View Online/Offline Status

**User Story:**
```
As a Field Surveyor
I want to see whether my phone is online or offline
So that I know if my field actions are being synced
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-1.4.1 | Display network status | Header shows: "🟢 Online Mode" (cyan text) if connected; "⚡ Offline Mode (Local AI Active)" if no internet |
| AC-1.4.2 | Real-time detection | Use NetInfo to detect network changes; update status indicator immediately |
| AC-1.4.3 | Sync button availability | "Sync Now" button is enabled when online; remains clickable offline (queues sync for later) |
| AC-1.4.4 | Visual distinction | Online: green dot + "Online"; Offline: lightning bolt + "Offline" |

**Notes:**
- NetInfo triggers callback on connectivity change
- Offline mode does not block any field operations

---

### US-1.5: Manually Trigger Sync

**User Story:**
```
As a Field Surveyor
I want to manually sync my offline cases with the backend server
So that my field work is uploaded when I have internet connection
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-1.5.1 | Sync button tap | Tap "Sync Now" → call `syncEngine.syncNow()` |
| AC-1.5.2 | Loading state | Button text changes to "Syncing..." with spinner; button disabled during sync |
| AC-1.5.3 | Completion | Sync completes → reload case list (call `loadCases()`) → update sync status badges |
| AC-1.5.4 | Sync queue | Only cases with `syncStatus !== 'SYNCED'` are uploaded |
| AC-1.5.5 | Badge updates | After sync: case badges update to reflect new sync status (PENDING → SYNCED or ERROR) |
| AC-1.5.6 | Pull-to-refresh | Pull down on case list → trigger sync via RefreshControl |
| AC-1.5.7 | Network offline | If tap sync while offline, show toast: "No internet connection. Sync queued for later." |

**Example Flow:**
1. Surveyor in field (offline) → captures photos, creates case → all marked OFFLINE_ONLY
2. Drives to site with WiFi → taps "Sync Now"
3. Button shows "Syncing..." for 3–5 seconds
4. Sync completes → case badges update to SYNCED (green) or PENDING (amber) or ERROR (red)
5. Toast confirms: "Sync completed: 3 cases uploaded"

---

### US-1.6: Tap Case to View Details

**User Story:**
```
As a Field Surveyor
I want to tap on a case in the list to view full details and access field modules
So that I can start inspecting that case
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-1.6.1 | Card press navigation | Tap case card → navigate to CaseDetail screen with `caseId` param |
| AC-1.6.2 | Navigation prop | Call `navigation.navigate('CaseDetail', { caseId: item.id })` |
| AC-1.6.3 | Visual feedback | Card opacity changes to 0.7 on press (activeOpacity) |
| AC-1.6.4 | Stack navigation | CaseDetail screen appears with back button to return to list |

---

### US-1.7: Create New Case via FAB

**User Story:**
```
As a Field Surveyor
I want to create a new claim case directly from the case list screen
So that I can start a new inspection without leaving the main list view
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-1.7.1 | FAB display | Blue circular button (+) positioned bottom-right; 56×56px |
| AC-1.7.2 | FAB tap | Tap FAB → navigate to CreateCase screen |
| AC-1.7.3 | Visual styling | FAB has shadow/elevation; active opacity feedback on press |
| AC-1.7.4 | Z-index | FAB renders above case list (not covered by list items) |
| AC-1.7.5 | Disable on create | FAB remains visible during sync (always accessible) |

**Notes:**
- FAB is floating action button per Material Design specs
- Icon: white "+" on blue (#2563eb) background

---

### US-1.8: View Sync Status Badges per Case

**User Story:**
```
As a Field Surveyor
I want to see the sync status of each case at a glance
So that I know which cases are offline-only, pending sync, or already uploaded
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-1.8.1 | Badge display | Each case card shows small badge (top-right) with sync status text |
| AC-1.8.2 | Status colors | SYNCED = green (#10b981), PENDING = amber (#f59e0b), OFFLINE_ONLY = indigo (#6366f1), ERROR = red (#ef4444) |
| AC-1.8.3 | Badge text | Text color: white; font: 10px bold uppercase; format: status name with underscores replaced by spaces (e.g., "OFFLINE ONLY") |
| AC-1.8.4 | Update on sync | After sync completes, badges re-render with updated status from Realm DB |
| AC-1.8.5 | Error state | If sync fails for a case, badge shows ERROR with red background |

**Visual Example:**
```
┌─────────────────────────────────┐
│ MOTOR       │ SYNCED            │ ← badges
│ CAS-2026-MOTOR-1234             │
│ Insured: John Doe               │
│ Policy: POL-9948102             │
│ 📍 San Francisco, CA            │
│ Status: IN_PROGRESS | HIGH      │
└─────────────────────────────────┘
```

---

## CREATE CASE SCREEN

### US-2.1: Create New Claim Case with Required Fields

**User Story:**
```
As a Field Surveyor
I want to create a new claim case with essential information (case number, policy, insured name)
So that I can start the inspection workflow offline
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-2.1.1 | Form displays | All input fields render: case number, policy, insured name, location, date of loss, priority, status, notes |
| AC-2.1.2 | Claim type selector | Chips for MOTOR, FIRE, MARINE, ENGINEERING, PROPERTY, OTHER (selectable) |
| AC-2.1.3 | Auto-generated case number | On load, generate: `CAS-{year}-MOTOR-{random 4-digit}` |
| AC-2.1.4 | Required field validation | Case Number, Policy Number, Insured Name are required (*) |
| AC-2.1.5 | Submit validation | Tap Create → check required fields non-empty → if missing, show alert: "Validation Error: {field} is required." |
| AC-2.1.6 | Submit success | All validations pass → save to Realm DB → show success alert → navigate to CaseDetail |
| AC-2.1.7 | Realm persistence | Case saved with: UUID id, OFFLINE_ONLY syncStatus, current ISO timestamp for createdAt/updatedAt |
| AC-2.1.8 | Organization ID | Set to hardcoded: `'00000000-0000-0000-0000-000000000001'` |

**Example Validation Flow:**
```
User: Tap Create without entering Policy Number
System: Alert appears: "Validation Error: Policy Number is required."
User: Enter policy, tap Create
System: Case saves → Alert: "Success! Offline claim case created."
          → Option: "Open Case Details" or "Close"
```

---

### US-2.2: Select Claim Type and Auto-Generate Case Number

**User Story:**
```
As a Field Surveyor
I want to select a claim type and have a case number auto-generated
So that each case has a unique reference tied to its type
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-2.2.1 | Claim type selector | Display 6 chips: MOTOR, FIRE, MARINE, ENGINEERING, PROPERTY, OTHER |
| AC-2.2.2 | Default selection | On load, MOTOR is pre-selected |
| AC-2.2.3 | Tap to select | Tap chip → update `claimType` state → **regenerate case number** |
| AC-2.2.4 | Auto-generate format | New case number: `CAS-{current year}-{selected type}-{random 4-digit}` (e.g., "CAS-2026-FIRE-5732") |
| AC-2.2.5 | Case number editable | User can still manually edit case number after auto-generation |
| AC-2.2.6 | Visual feedback | Selected chip: blue background (#0284c7), white text; inactive: gray |

**Example Flow:**
1. Default: Case number = "CAS-2026-MOTOR-7834"
2. User taps "FIRE" chip
3. Case number updates to: "CAS-2026-FIRE-3421" (random regenerated)
4. User can edit if desired

---

### US-2.3: Capture GPS Coordinates via Auto-GPS Button

**User Story:**
```
As a Field Surveyor
I want to capture the inspection site's GPS coordinates with one tap
So that I don't manually type latitude/longitude
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-2.3.1 | Auto-GPS button | Button displays: "📍 Auto-GPS" (cyan background) in "Site Location" section |
| AC-2.3.2 | Tap to fetch | Tap button → show "Getting GPS..." state → simulate GPS fix after 600ms |
| AC-2.3.3 | Set coordinates | After fix, populate Latitude and Longitude display fields (read-only) to 6 decimal places |
| AC-2.3.4 | Simulated coordinates | Use hardcoded high-precision: Lat 37.7749°, Lon -122.4194° (San Francisco) |
| AC-2.3.5 | Populate location | If location field is empty, auto-fill with: "Market St & 4th St, San Francisco, CA" |
| AC-2.3.6 | Display format | Latitude: "37.774900", Longitude: "-122.419400" (gray text in read-only boxes) |
| AC-2.3.7 | Coordinates immutable | Lat/Lon display fields are read-only; user must tap Auto-GPS again to update |
| AC-2.3.8 | Button disabled during fetch | While fetching, button shows spinner; tap does not trigger second request |

**Example Flow:**
```
1. GPS box shows: Latitude = "Not set", Longitude = "Not set"
2. Tap "📍 Auto-GPS"
3. Button shows "Getting GPS..." (200ms–600ms)
4. GPS box updates: Latitude = "37.774900", Longitude = "-122.419400"
5. Location field auto-filled: "Market St & 4th St, San Francisco, CA"
```

---

### US-2.4: Set Priority and Initial Case Status

**User Story:**
```
As a Field Surveyor
I want to set a priority level and initial status for the case
So that the case reflects urgency and current workflow state
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-2.4.1 | Priority selector | Pill buttons: LOW, MEDIUM (default), HIGH, URGENT |
| AC-2.4.2 | Status selector | Pill buttons: DRAFT (default), IN_PROGRESS |
| AC-2.4.3 | Visual feedback | Selected pill: blue background (#2563eb); inactive: gray (#0f172a) |
| AC-2.4.4 | Tap to select | Tap pill → update state immediately |
| AC-2.4.5 | Persistence | Selected priority/status persisted to case on create |
| AC-2.4.6 | Default values | Priority=MEDIUM, Status=DRAFT on load |

---

### US-2.5: Enter Insured Details and Loss Information

**User Story:**
```
As a Field Surveyor
I want to record the insured name, contact, and date of loss
So that all claim identification details are captured for the backend
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-2.5.1 | Insured Name field | Text input, required, max 100 chars; placeholder: "e.g. John Doe / ACME Corp" |
| AC-2.5.2 | Insured Contact field | Text input, optional; accepts phone or email; placeholder: "+1 (555) 019-2831" |
| AC-2.5.3 | Date of Loss field | Date input, optional; format: YYYY-MM-DD; default: today's date |
| AC-2.5.4 | Date validation | Cannot select future dates (if attempted, show validation message or revert) |
| AC-2.5.5 | Policy Number field | Text input, required, 5–30 chars; placeholder: "e.g. POL-9948102" |
| AC-2.5.6 | Validation | All required fields validated on submit; show alert if missing |
| AC-2.5.7 | Trimmed input | User input trimmed (leading/trailing whitespace removed) on persist |

---

### US-2.6: Enter Inspection Site Address

**User Story:**
```
As a Field Surveyor
I want to enter the physical address of the inspection site
So that the case record includes location context
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-2.6.1 | Location field | Text input (optional); max 200 chars; placeholder: "Address or location details..." |
| AC-2.6.2 | Auto-populate | Auto-GPS button can auto-fill this field if empty |
| AC-2.6.3 | Manual edit | User can type custom address (overrides auto-filled value) |
| AC-2.6.4 | Trimmed | Input trimmed on persist |
| AC-2.6.5 | Display | Location displayed in case list cards (truncated if >50 chars) |

---

### US-2.7: Enter Initial Field Notes

**User Story:**
```
As a Field Surveyor
I want to add initial observations or loss summary
So that early impressions are captured before detailed inspection
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-2.7.1 | Notes field | Multiline textarea (optional); max 1000 chars; placeholder: "Enter initial field observations..." |
| AC-2.7.2 | Line count | Show ~4 lines initially; expand as user types (or scrollable) |
| AC-2.7.3 | Trim on save | Whitespace trimmed on persist |
| AC-2.7.4 | Persistence | Notes field optional; case can be created without notes |

---

### US-2.8: Navigate Back and Cancel Case Creation

**User Story:**
```
As a Field Surveyor
I want to cancel and return to the case list without saving
So that I can discard a half-entered case if I change my mind
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-2.8.1 | Cancel button | Back button (← Cancel) in header (top-left) |
| AC-2.8.2 | Tap to navigate | Tap Cancel → navigate back to CaseList without saving |
| AC-2.8.3 | No validation | Cancel does not validate required fields; discard immediately |
| AC-2.8.4 | Unsaved state | No confirmation alert (cancellation is quick/reversible) |
| AC-2.8.5 | Android back button | Device back button also navigates back (same as Cancel) |

---

## CASE DETAIL SCREEN

### US-3.1: View Complete Case Information

**User Story:**
```
As a Field Surveyor
I want to see all details for a specific case
So that I have the full context before starting inspections
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-3.1.1 | Load case data | On mount, fetch case from Realm DB by caseId; display metadata |
| AC-3.1.2 | Claim identification card | Show: Insured Name, Policy Number, Date of Loss (YYYY-MM-DD), Site Location (or "N/A") |
| AC-3.1.3 | Header bar | Display: Back button, Case Number (bold), Claim Type badge |
| AC-3.1.4 | Scroll layout | All content in ScrollView for cases with large evidence counts |
| AC-3.1.5 | Case not found | If case doesn't exist, show loading spinner or "Case not found" message |
| AC-3.1.6 | Re-load on focus | When screen regains focus, call `loadCaseData()` to refresh (catches evidence captured on CameraEvidenceScreen) |

**Example Display:**
```
═══════════════════════════════════════
← Back    CAS-2026-MOTOR-1234    MOTOR
═══════════════════════════════════════

CLAIM IDENTIFICATION
Insured Name: John Doe
Policy Number: POL-9948102
Date of Loss: 2026-08-01
Site Location: Market St & 4th St, SF, CA

FIELD MODULES
[📸 Camera & Evidence] [🎙️ Voice Notes]
[📋 Smart Checklist]   [📄 Export PDF]

EVIDENCE COMPLETENESS
✓ 3/4 required
Progress: ▓▓▓░ 75%
Missing: Interior Odometer

⚡ ON-DEVICE LOCAL LLM ANALYSIS
[Run AI Analysis]
Placeholder: "Tap 'Run AI Analysis' to execute..."
```

---

### US-3.2: Navigate to Field Modules (Camera, Voice, Checklist, PDF)

**User Story:**
```
As a Field Surveyor
I want to navigate to different field modules from the case detail screen
So that I can capture evidence, record notes, fill checklists, and export reports
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-3.2.1 | Module grid | 2×2 grid of action cards: Camera & Evidence, Voice Notes, Smart Checklist, Export PDF |
| AC-3.2.2 | Camera & Evidence tap | Tap → navigate to CameraEvidence with `caseId` |
| AC-3.2.3 | Voice Notes tap | Tap → navigate to VoiceNotes with `caseId` |
| AC-3.2.4 | Checklist tap | Tap → navigate to ChecklistForm with `caseId` and `claimType` |
| AC-3.2.5 | PDF Export tap | Tap → navigate to ReportPreview with `caseId` |
| AC-3.2.6 | Visual feedback | Card press opacity feedback (0.7); smooth navigation |
| AC-3.2.7 | Icon + label | Each card shows emoji icon + title + count/status (e.g., "3 Captured", "Progress 75%") |

---

### US-3.3: View Evidence Completeness Progress

**User Story:**
```
As a Field Surveyor
I want to see which guided photo angles I've captured and which are still missing
So that I know if I have sufficient evidence before generating the report
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-3.3.1 | Completeness card | Display: "📷 Evidence Completeness" title + fraction (e.g., "3/4") on right |
| AC-3.3.2 | Progress bar | Visual fill bar; color: green (#22c55e) if complete, amber (#f59e0b) if incomplete |
| AC-3.3.3 | Fraction color | "3/4" text green if complete, amber if incomplete |
| AC-3.3.4 | Detail text | If complete: "All compulsory angles captured — ready for report sign-off." |
| AC-3.3.5 | Missing list | If incomplete: "Missing: {angleLabels}" (e.g., "Missing: Interior Odometer, Trunk") |
| AC-3.3.6 | Tap to navigate | Tap completeness card → navigate to CameraEvidence (to continue capturing) |
| AC-3.3.7 | Calculation | Completeness computed from guided angles utility: `computeCompleteness(claimType, medias)` |

---

### US-3.4: Run On-Device Local LLM Analysis

**User Story:**
```
As a Field Surveyor
I want to run AI analysis on my case
So that I get an auto-drafted summary, damage severity suggestion, and missing info warnings
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-3.4.1 | AI card display | Section: "⚡ On-Device Local LLM Analysis" with "Run AI Analysis" button |
| AC-3.4.2 | Button tap | Tap → call `localLLMEngine.analyzeCaseOffline(case, medias, voiceNotes)` |
| AC-3.4.3 | Loading state | Button shows spinner; disabled during analysis; text hidden |
| AC-3.4.4 | Analysis result | Returns object: `{ summary, suggestedDamageSeverity, missingInformationWarnings, confidence }` |
| AC-3.4.5 | Display result | Update card to show: |
|         |   | - AI summary text (gray, multi-line) |
|         |   | - "Suggested Severity: {MINOR/MODERATE/SEVERE/TOTAL_LOSS}" (cyan, bold) |
|         |   | - Each warning prefixed with ⚠️ (red text) |
| AC-3.4.6 | Persist result | Save `aiSummary` to case in Realm DB |
| AC-3.4.7 | Placeholder state | Before analysis: "Tap 'Run AI Analysis' to execute on-device LLM analysis..." (gray italic) |
| AC-3.4.8 | Rerun allowed | User can tap button again to re-run analysis (overwrites previous result) |

**Example Result Display:**
```
⚡ ON-DEVICE LOCAL LLM ANALYSIS
[Run AI Analysis] ← button, if no summary yet

OR (after running):

Moderate frontal impact with crushed radiator support. Estimated repair cost: $8,500–$12,000. Engine check complete; no fluid leaks detected. Recommend comprehensive structural assessment.

Suggested Severity: MODERATE
⚠️ Missing: Interior damage photos
⚠️ Missing: Undercarriage inspection notes
```

---

## CAMERA EVIDENCE SCREEN

### US-4.1: Capture Geotagged Evidence Photos

**User Story:**
```
As a Field Surveyor
I want to capture photos of the loss with automatic GPS coordinates and timestamps
So that every photo is immutably linked to location and time
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-4.1.1 | Camera view | Live camera preview (Expo Camera) with 380px height, rounded corners, dark background |
| AC-4.1.2 | Geotag watermark | Bottom overlay shows: Lat/Lon (6 decimals), ALT (if available), date, case number, angle prompt, hint |
| AC-4.1.3 | Shutter button | Large blue button: "📸 Capture Evidence"; disabled until camera ready |
| AC-4.1.4 | Camera ready state | Wait for `onCameraReady` callback; show "Starting camera..." until ready |
| AC-4.1.5 | Photo capture | Tap shutter → call `cameraRef.takePictureAsync()` → open review modal |
| AC-4.1.6 | Captured image | Save to temp URI; pass to review modal |
| AC-4.1.7 | Disable during review | Shutter button disabled while review modal open (prevent double-capture) |

---

### US-4.2: Receive GPS Fix and Show Geolocation Status

**User Story:**
```
As a Field Surveyor
I want to see GPS acquisition status
So that I know if my photos will be geotagged or flagged as missing location data
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-4.2.1 | GPS pill display | Top-left corner: colored pill showing GPS status |
| AC-4.2.2 | READY state | Green background; text: "GPS READY: 37.7749° -122.4194° ACC 10m" |
| AC-4.2.3 | ACQUIRING state | Yellow background; text: "GPS ACQUIRING..." (spinner) |
| AC-4.2.4 | DENIED state | Red background; text: "GPS Permission Denied. Tap to retry." |
| AC-4.2.5 | DISABLED state | Red background; text: "GPS Services Disabled. Tap to retry." |
| AC-4.2.6 | ERROR state | Red background; text: "GPS Fix Failed. Tap to retry." |
| AC-4.2.7 | Tap to retry | Tap banner → trigger `retryGeo()` to re-attempt GPS fix |
| AC-4.2.8 | No GPS fallback | If no fix acquired: watermark shows "Awaiting GPS fix — photo will be flagged as ungeotagged"; photo still capturable |
| AC-4.2.9 | Ungeotagged flag | Media saved without GPS gets `latitude=undefined` and AI tag: 'no_gps' |

---

### US-4.3: Review Photo Quality Before Saving

**User Story:**
```
As a Field Surveyor
I want to see photo quality metrics before committing the capture
So that I can retake blurry or poorly exposed photos
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-4.3.1 | Quality analysis trigger | On capture, run `analyzePhoto(uri)` asynchronously |
| AC-4.3.2 | Loading state | Show spinner + "Analysing sharpness and exposure on-device…" |
| AC-4.3.3 | Verdict card | Display: verdict pill (GOOD/FAIR/POOR) + score (0–100) |
| AC-4.3.4 | Metrics display | Show: Sharpness (LOW/MEDIUM/HIGH), Brightness, Contrast (metrics) |
| AC-4.3.5 | GOOD verdict | Green pill; issues: none; text: "✓ Sharp, well exposed and usable as evidence." |
| AC-4.3.6 | FAIR verdict | Amber pill; minor issues listed (e.g., "Slightly underexposed") |
| AC-4.3.7 | POOR verdict | Red pill; major issues listed (e.g., "Blurry", "Very dark"); show confirmation alert |
| AC-4.3.8 | POOR confirmation | Alert: "{issues.join('\n\n')}\n\nSave this frame anyway?" |
| AC-4.3.9 | POOR options | Two buttons: "Retake" (cancel), "Save Anyway" (force save) |
| AC-4.3.10 | Analysis unavailable | If analysis fails: "Quality analysis unavailable for this frame — review the preview manually." |

**Example Quality Card:**
```
QUALITY CHECK
┌──────────────────────────────────────┐
│ [GOOD] Score 92/100                  │
│ Sharpness MEDIUM • Brightness HIGH   │
│ Contrast MEDIUM                      │
│ ✓ Sharp, well exposed and usable.    │
└──────────────────────────────────────┘
```

---

### US-4.4: Assign Photo to Guided Angle Slot

**User Story:**
```
As a Field Surveyor
I want to categorize each photo (e.g., Front Bumper, Interior Odometer)
So that the report shows which angles were captured
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-4.4.1 | Angle selector | Review modal shows grid of angle chips: all required + optional angles + "Ad-Hoc" |
| AC-4.4.2 | Pre-selected angle | Default angle from wizard is pre-selected (blue background) |
| AC-4.4.3 | Tap to change | Tap different angle → update `pendingShot.angle` → chip highlights |
| AC-4.4.4 | Chip styling | Selected: blue (#1d4ed8); unselected: dark gray (#0f172a) |
| AC-4.4.5 | Ad-Hoc angle | "+ Ad-Hoc" chip always available for unlabeled photos |
| AC-4.4.6 | Persist angle | On save, media.angleId and media.angleLabel set from selected angle |

---

### US-4.5: Add Caption/Damage Tag to Photo

**User Story:**
```
As a Field Surveyor
I want to add a short description (damage tag) to each photo
So that I capture context without verbally recording
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-4.5.1 | Caption input | Text input in review modal; label: "Caption / damage tag"; placeholder: "e.g. Radiator support crushed, coolant on ground" |
| AC-4.5.2 | Max length | Caption: 200 chars max |
| AC-4.5.3 | Optional | Caption not required; photo can be saved without caption |
| AC-4.5.4 | Trim on save | Whitespace trimmed on persist |
| AC-4.5.5 | Display in gallery | If caption exists, show below angle label in gallery tile (truncated if >30 chars) |
| AC-4.5.6 | Multiline input | Input allows multiple lines (for longer captions) |

---

### US-4.6: Save Evidence Offline and Persist to Device Storage

**User Story:**
```
As a Field Surveyor
I want to save captured evidence photos to the device
So that they persist locally until synced to the cloud
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-4.6.1 | Save button | "Save Evidence Offline" button in review modal |
| AC-4.6.2 | Tap to save | Button press → validate angle (required) → call `handleSaveEvidence()` |
| AC-4.6.3 | Loading state | Button shows spinner during save; disabled |
| AC-4.6.4 | File storage | Save three versions to device: |
|        |   | - Stamped (geotag watermark): `{caseId}/evidence/` |
|        |   | - Original (pristine frame): `{caseId}/original/` |
|        |   | - Thumbnail (96px): `{caseId}/thumbnails/` |
| AC-4.6.5 | Flatten evidence | If composer loaded, flatten annotations onto geotag watermark (max 1440px width) |
| AC-4.6.6 | Realm DB record | Create Media record: id (UUID), caseId, all file URIs, geotag data, timestamp, angle, quality, caption, tags, isSynced=false |
| AC-4.6.7 | Success state | Close review modal; reset pending shot; reload case media; refresh gallery |
| AC-4.6.8 | Error handling | If save fails, show alert: "Save Failed: {error message}"; modal remains open (allow retry) |

**File Structure Created:**
```
/storage/emulated/0/SurveyAgent/
  └── cases/{caseId}/
      ├── evidence/photo_20260804_143205_xyz.jpg (stamped, annotated)
      ├── original/photo_20260804_143205_xyz.jpg (pristine)
      └── thumbnails/thumb_xyz.jpg (96px)
```

---

### US-4.7: Guided Photo Wizard with Progress Tracking

**User Story:**
```
As a Field Surveyor
I want guided prompts for which photos to capture
So that I capture all required angles systematically
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-4.7.1 | Wizard card | Section title: "Guided Photo Wizard"; shows progress counter |
| AC-4.7.2 | Progress bar | Visual fill: `(requiredCaptured / requiredTotal) * 100%` |
| AC-4.7.3 | Progress text | "{requiredCaptured}/{requiredTotal} required"; color: amber if incomplete, green if complete |
| AC-4.7.4 | Angle grid | Horizontal scrollable grid of angle chips for claim type |
| AC-4.7.5 | Chip status | Each chip shows: |
|        |   | - "✓ ANGLE" if captured (>0 photos) |
|        |   | - "• ANGLE" if required but not captured |
|        |   | - "○ ANGLE" if optional and not captured |
|        |   | - "✓ ANGLE ×2" if multiple captures of same angle |
| AC-4.7.6 | Chip colors | Captured: green border; required missing: red/amber; optional: gray |
| AC-4.7.7 | Tap chip | Tap angle → set as active angle; wizard auto-advances on capture |
| AC-4.7.8 | Ad-Hoc option | Always show "+ Ad-Hoc" chip for user-defined angles |
| AC-4.7.9 | Missing list | Red text below grid: "Outstanding: {angleLabels}" (only if missing required) |
| AC-4.7.10 | Auto-advance | If user hasn't manually selected angle, auto-advance to next pending required angle after save |

**Example Wizard Display:**
```
Guided Photo Wizard    3/4 required
├─ Progress: ▓▓▓░ 75%
├─ Chips: [✓ FRONT] [• SIDE] [✓ REAR] [○ UNDERBODY] [+ Ad-Hoc]
└─ Outstanding: Side bumper damage
```

---

### US-4.8: View and Manage Evidence Gallery

**User Story:**
```
As a Field Surveyor
I want to see all photos captured for this case
So that I can review evidence and delete unwanted photos
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-4.8.1 | Gallery grid | 2-column grid layout below wizard card |
| AC-4.8.2 | Gallery title | "Case Evidence ({count})" |
| AC-4.8.3 | Empty state | If no media: "No evidence captured yet. Follow the wizard prompts..." |
| AC-4.8.4 | Tile display | Each tile: thumbnail image (120px height), quality badge, angle label, GPS coords, timestamp, annotation indicator (✏️) |
| AC-4.8.5 | Quality badge | Top-right corner; background color (green/amber/red); score text (e.g., "85") |
| AC-4.8.6 | GPS display | "📍 37.7749°, -122.4194°" or "📍 No GPS fix" (cyan text) |
| AC-4.8.7 | Timestamp | Locale time format (e.g., "14:32:05") |
| AC-4.8.8 | Annotation marker | If annotations exist, show ✏️ icon (right-aligned) |
| AC-4.8.9 | Tap tile | Tap → navigate to PhotoAnnotation screen with `mediaId` (to edit annotations) |
| AC-4.8.10 | Long-press tile | Long-press → show delete confirmation alert |
| AC-4.8.11 | Delete confirm | Alert: "Delete '{angleLabel}' from the case file?" |
| AC-4.8.12 | Delete action | Confirm → remove Media record from Realm DB → delete file URIs from device storage → refresh gallery |

---

### US-4.9: Camera Controls (Flip Camera, Torch)

**User Story:**
```
As a Field Surveyor
I want to flip between front/back camera and toggle flashlight
So that I can capture evidence from different angles and in low light
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-4.9.1 | Flip button | "⟳ Flip" button in header (top-right) |
| AC-4.9.2 | Tap to flip | Tap → toggle `facing` from 'back' to 'front' (or vice versa) → camera feed switches |
| AC-4.9.3 | Torch button | "🔦 On" / "🔦 Off" button in GPS pill area (top-right, below flip) |
| AC-4.9.4 | Tap to toggle | Tap → toggle `torch` state → camera flashlight on/off |
| AC-4.9.5 | Styling | Torch button: dark background (semi-transparent), small text |
| AC-4.9.6 | Torch state | ON: yellow flashlight icon; OFF: gray flashlight icon |

---

## VOICE NOTES SCREEN

### US-5.1: Record Audio Dictation

**User Story:**
```
As a Field Surveyor
I want to record voice notes about the claim while inspecting
So that I capture findings hands-free without typing
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-5.1.1 | Mic button | Large circular button (72×72px), blue background, 🎙️ icon |
| AC-5.1.2 | Instruction text | Shows: "Tap mic button to start voice dictation" (when idle) |
| AC-5.1.3 | Tap to record | Tap mic button → start recording; button turns red (#ef4444), icon changes to ⏹️ |
| AC-5.1.4 | Recording state | Instruction changes to: "🔴 RECORDING... Speak findings clearly" |
| AC-5.1.5 | Tap to stop | Tap stop button (⏹️) → stop recording; begin transcription |
| AC-5.1.6 | Stop behavior | Trigger `handleToggleRecord()`; set `recording=false`, `transcribing=true` |
| AC-5.1.7 | Max duration | Recording capped at 300 seconds (5 minutes) per note; auto-stop if exceeded |
| AC-5.1.8 | Multiple notes | User can record multiple notes per case; each saved as separate VoiceNote |

**Example State Flow:**
```
IDLE:
  Button: Blue 🎙️
  Text: "Tap mic button to start voice dictation"

RECORDING:
  Button: Red ⏹️
  Text: "🔴 RECORDING... Speak findings clearly"

TRANSCRIBING:
  Button: Gray (disabled) with spinner
  Text: "⚡ Transcribing audio via Offline Whisper STT..."

SAVED:
  Button: Blue 🎙️ (ready for next recording)
  Text: "Tap mic button to start voice dictation"
  List: New note appears in Audio Logs list
```

---

### US-5.2: Perform On-Device Speech-to-Text Transcription

**User Story:**
```
As a Field Surveyor
I want audio automatically converted to text
So that I have searchable written records without manual typing
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-5.2.1 | Auto-transcribe | On stop, call `whisperSTTEngine.transcribeAudio(audioPath)` |
| AC-5.2.2 | Transcribing state | Button disabled, shows spinner; text: "⚡ Transcribing audio via Offline Whisper STT..." |
| AC-5.2.3 | Processing time | Transcription completes in 5–30 seconds on-device (no server call) |
| AC-5.2.4 | Transcript output | Returns full text transcription (up to 5000 chars) |
| AC-5.2.5 | Post-transcribe | Save VoiceNote: id, caseId, audioPath, durationSeconds, transcript, isTranscribed=true, createdAt |
| AC-5.2.6 | Success alert | Show alert: "Dictation Transcribed" + "Offline STT transcription complete and saved to case!" |
| AC-5.2.7 | Persist to DB | VoiceNote record saved to Realm DB |
| AC-5.2.8 | Reload list | After save, call `loadVoiceNotes()` to refresh audio logs display |

---

### US-5.3: View Audio Transcripts List

**User Story:**
```
As a Field Surveyor
I want to see a list of all recorded audio notes and their transcripts
So that I can review what I've dictated
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-5.3.1 | Section title | "Audio Logs & Transcripts ({count})" |
| AC-5.3.2 | Card per note | FlatList renders note card for each VoiceNote |
| AC-5.3.3 | Card header | "Audio Note #{index+1} ({durationSeconds}s)" (bold cyan) + timestamp (gray right-aligned) |
| AC-5.3.4 | Transcript text | Full transcript text displayed below header (gray, 13px); word-wrapped |
| AC-5.3.5 | Empty state | If no notes: "No audio logs yet." (or similar placeholder) |
| AC-5.3.6 | Card styling | #1e293b background, #334155 border, rounded corners (12px) |
| AC-5.3.7 | Scrollable list | List scrolls if >5 notes; non-interactive (read-only display) |
| AC-5.3.8 | Timestamp format | Locale time string (e.g., "2:32:05 PM") |

**Example Card:**
```
┌──────────────────────────────────────────────┐
│ Audio Note #1 (47s)       |     2:32:05 PM  │
├──────────────────────────────────────────────┤
│ Inspected vehicle on-site. Moderate frontal │
│ impact damage confirmed. Left side structural│
│ damage and twisted chassis. Engine check     │
│ complete; no fluid leaks detected yet.       │
└──────────────────────────────────────────────┘
```

---

### US-5.4: Header Navigation and Back Button

**User Story:**
```
As a Field Surveyor
I want to navigate back to case details from the voice notes screen
So that I can continue with other field modules
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-5.4.1 | Back button | "← Back" button in header (top-left, cyan) |
| AC-5.4.2 | Tap to navigate | Tap → `navigation.goBack()` → return to CaseDetail screen |
| AC-5.4.3 | Header title | Center: "Voice Notes & Dictation" (bold white) |
| AC-5.4.4 | Spacer element | Right placeholder (40px) to balance layout |

---

## REPORT PREVIEW SCREEN

### US-6.1: Configure Report Export Options

**User Story:**
```
As a Field Surveyor
I want to customize which content to include in the PDF report
So that I can tailor the document to my needs
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-6.1.1 | Options card | Section: "Export Preferences"; contains toggles and text inputs |
| AC-6.1.2 | Include Photos toggle | "Include Photo Proof ({count})" toggle switch (default ON) |
| AC-6.1.3 | Include Geotags toggle | "Include GPS Coordinates & Timestamp" toggle (default ON) |
| AC-6.1.4 | Include Checklist toggle | "Include Inspection Checklist" toggle (default ON) |
| AC-6.1.5 | Toggle interaction | Tap to toggle ON/OFF; state persists during session |
| AC-6.1.6 | Toggle styling | Thumb color blue (#2563eb) when ON, gray when OFF |

---

### US-6.2: Add Custom Inspector Remarks

**User Story:**
```
As a Field Surveyor
I want to add custom observations or conclusions to the report
So that my professional judgment is recorded in the final document
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-6.2.1 | Remarks input | Multiline textarea; label: "Inspector Final Remarks"; placeholder text provided |
| AC-6.2.2 | Default text | Populate with: "Inspected vehicle on-site. Moderate frontal impact damage confirmed." |
| AC-6.2.3 | Editable | User can clear and type custom remarks (max 1000 chars) |
| AC-6.2.4 | Preview update | As user types, preview frame updates in real-time (shows new remarks) |
| AC-6.2.5 | Trim on export | Remarks trimmed on PDF generation |

---

### US-6.3: Add Digital Inspector Signature

**User Story:**
```
As a Field Surveyor
I want to add my name or title as a digital signature on the report
So that the document is verified as my work
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-6.3.1 | Signature input | Text input; label: "Digital Inspector Sign-Off"; placeholder: "Your name or title" |
| AC-6.3.2 | Default text | Populate with: "John Inspector (Senior Surveyor)" |
| AC-6.3.3 | Editable | User can change to their own name/title (max 100 chars) |
| AC-6.3.4 | Preview update | As user types, signature appears in report preview footer |
| AC-6.3.5 | Trim on export | Signature trimmed on PDF generation |

---

### US-6.4: Preview Generated Report

**User Story:**
```
As a Field Surveyor
I want to see a preview of the PDF report before exporting
So that I can verify content and formatting
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-6.4.1 | Preview frame | Section: "PDF Page Preview"; mock-up of report structure in styled box |
| AC-6.4.2 | Preview title | "SURVEYAGENT LOSS REPORT" (bold heading) |
| AC-6.4.3 | Preview content | Show sections: |
|        |   | - Header: Case #, Policy, Insured |
|        |   | - AI Findings (aiSummary or default) |
|        |   | - Transcriptions (voiceNotes[0] or default) |
|        |   | - Footer: "Verified Geotagged Field Audit • 100% Offline Generation" |
| AC-6.4.4 | Real-time updates | Preview updates as user edits remarks, signature, toggles options |
| AC-6.4.5 | Scrollable preview | Preview content scrollable if tall; contained within screen bounds |
| AC-6.4.6 | Not interactive | Preview is read-only (informational only) |

---

### US-6.5: Export PDF Report Offline

**User Story:**
```
As a Field Surveyor
I want to export a PDF report and save it locally
So that I have a professional document to share with insurers
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-6.5.1 | Export button | Large green button (#10b981): "📄 Export PDF Report" at bottom |
| AC-6.5.2 | Button tap | Tap → call PDF export function → generate binary PDF file |
| AC-6.5.3 | File path | Save to: `/storage/emulated/0/SurveyAgent/reports/{caseNumber}_Report.pdf` |
| AC-6.5.4 | File format | Binary PDF with embedded base64 image data (self-contained) |
| AC-6.5.5 | Success alert | Show alert: "PDF Exported Successfully! Survey Report saved locally at: {file path}" |
| AC-6.5.6 | Alert action | Button options: "OK" (dismiss + navigate back) |
| AC-6.5.7 | Error handling | If export fails, show alert: "Export Failed: {error}" |
| AC-6.5.8 | Photo embedding | If includePhotos=true, embed all media as data URIs in PDF (high quality, auto-resized) |
| AC-6.5.9 | Geotag inclusion | If includeGeotags=true, show GPS coords and timestamp for each photo |
| AC-6.5.10 | Offline capable | Entire PDF generation runs locally; no network required |

**Report Sections Generated:**
1. Cover page: Case #, Policy, Insured, Date generated
2. Claim Identification: Claim type, priority, status
3. AI Findings & Damage Summary (from aiSummary)
4. Evidence Photo Grid (if includePhotos=true)
5. Voice Transcriptions (from voiceNotes list)
6. Inspection Checklist Answers (if includeChecklist=true)
7. Inspector Remarks & Sign-Off
8. Footer: Timestamp, "Verified Geotagged Field Audit • 100% Offline Generation"

---

## PHOTO ANNOTATION SCREEN

### US-7.1: Load Photo for Annotation

**User Story:**
```
As a Field Surveyor
I want to open a previously captured photo to add annotations
So that I can mark important features for the report
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-7.1.1 | Load media | On mount, fetch Media record from Realm DB by `mediaId` |
| AC-7.1.2 | Load case | Fetch parent Case by `caseId` |
| AC-7.1.3 | Image display | Load image from `media.originalPath` (pristine original, not stamped) |
| AC-7.1.4 | Canvas size | Fit image to screen width with aspect ratio preserved |
| AC-7.1.5 | Load existing | If media has `annotations` JSON, parse and render as overlay |
| AC-7.1.6 | Loading state | Show spinner while image loads |
| AC-7.1.7 | Not found | If media or case not found, show "Loading..." or error message |

---

### US-7.2: Select Drawing Tool and Options

**User Story:**
```
As a Field Surveyor
I want to select drawing tools and customize appearance
So that I can annotate photos clearly
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-7.2.1 | Tool selector | Horizontal bar of tool buttons: ARROW, CIRCLE, RECTANGLE, TEXT, MEASURE, FREEHAND |
| AC-7.2.2 | Tool icon | Each button shows emoji: →, ⭕, ▭, T, ⧈, ✎ |
| AC-7.2.3 | Active tool | Selected tool: blue background (#1d4ed8), white text |
| AC-7.2.4 | Inactive tool | Unselected: gray background (#0f172a), gray text |
| AC-7.2.5 | Tap to select | Tap tool → update `tool` state → canvas ready for that tool |
| AC-7.2.6 | Color selector | Horizontal pill group: Red, Yellow, Green, Cyan, White, Black |
| AC-7.2.7 | Active color | Selected color: highlighted pill with checkmark or border |
| AC-7.2.8 | Tap to select color | Tap pill → update `color` state |
| AC-7.2.9 | Stroke width | Button group: "2px", "4px", "7px" |
| AC-7.2.10 | Default stroke | Default 4px (medium); user can change |

---

### US-7.3: Draw Annotations on Image

**User Story:**
```
As a Field Surveyor
I want to draw arrows, circles, and text to highlight damage on photos
So that the report visually shows problem areas
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-7.3.1 | Arrow tool | Tap → draw from start point to end point (2 taps or drag); shows directional arrow |
| AC-7.3.2 | Circle tool | Tap center → drag to draw radius; shows circle outline |
| AC-7.3.3 | Rectangle tool | Drag from corner to opposite corner; shows rectangle outline |
| AC-7.3.4 | Text tool | Tap point → modal appears for text input; user types label; confirm → text appears at point |
| AC-7.3.5 | Measure tool | Tap start → tap end → modal for distance label; shows line with label |
| AC-7.3.6 | Freehand tool | Drag finger to draw free-form line; follows finger path |
| AC-7.3.7 | Real-time feedback | As user draws, live preview shows shape forming |
| AC-7.3.8 | Color applied | All shapes drawn in selected color; user can change color mid-session |
| AC-7.3.9 | Stroke applied | Line thickness matches selected width |
| AC-7.3.10 | Multi-annotation | User can draw multiple annotations on same photo |

---

### US-7.4: Undo and Clear Annotations

**User Story:**
```
As a Field Surveyor
I want to undo individual annotations or clear all markups
So that I can correct mistakes during annotation
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-7.4.1 | Undo button | Button: "↶ Undo" below toolbar |
| AC-7.4.2 | Undo behavior | Tap → remove last annotation from list; re-render canvas |
| AC-7.4.3 | Undo disabled | If no annotations, button disabled (grayed out) |
| AC-7.4.4 | Clear All button | Button: "⚠️ Clear All" next to Undo |
| AC-7.4.5 | Clear confirmation | Tap → alert: "Remove every mark from this photograph?" |
| AC-7.4.6 | Clear options | Buttons: "Cancel" (dismiss), "Clear" (destructive red) |
| AC-7.4.7 | Clear action | Confirm → empty annotations list → re-render blank canvas |
| AC-7.4.8 | Clear disabled | If no annotations, button disabled |

---

### US-7.5: Save Annotated Photo

**User Story:**
```
As a Field Surveyor
I want to save my annotations to the photo
So that the marked-up version is persisted in the case
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-7.5.1 | Save button | "💾 Save" or "Save Annotations" button in header |
| AC-7.5.2 | Unsaved flag | If `dirty=true` (annotations changed), button enabled; otherwise disabled |
| AC-7.5.3 | Tap to save | Tap → validate image loaded → call `handleSaveEvidence()` |
| AC-7.5.4 | Flatten process | Call `flattenEvidence(composerRef, EXPORT_WIDTH, aspect)` to rasterize |
| AC-7.5.5 | Save to storage | Persist flattened image to device storage; update thumbnail |
| AC-7.5.6 | Update Realm DB | Update Media record: |
|        |   | - annotations: serializeAnnotations(annotations) |
|        |   | - localPath: new flattened URI |
|        |   | - isSynced: false |
| AC-7.5.7 | Success state | Close screen; navigate back to CameraEvidence; gallery tile updates with new annotated image |
| AC-7.5.8 | Error handling | If save fails, show alert: "Save Failed: {error}"; screen remains open for retry |
| AC-7.5.9 | Original preserved | Original pristine frame saved to originalPath (never overwritten) |

---

### US-7.6: Navigate Back with Unsaved Changes Warning

**User Story:**
```
As a Field Surveyor
I want to be warned if I have unsaved annotations
So that I don't lose my work
```

**Acceptance Criteria:**

| # | Criterion | Expected Behavior |
|---|-----------|-------------------|
| AC-7.6.1 | Back button | "← Back" button in header |
| AC-7.6.2 | Check dirty flag | If `dirty=false`, navigate back immediately |
| AC-7.6.3 | Dirty flag set | If any annotation added/removed, set `dirty=true` |
| AC-7.6.4 | Unsaved warning | If `dirty=true` and tap back → alert: "Annotations on this photograph have not been saved." |
| AC-7.6.5 | Alert options | Two buttons: "Keep Editing" (cancel), "Discard" (destructive) |
| AC-7.6.6 | Discard action | Tap Discard → navigate back without saving; annotations lost |
| AC-7.6.7 | Keep editing | Tap Keep Editing → dismiss alert; stay on screen |
| AC-7.6.8 | Device back button | Device back button (Android) triggers same behavior |

---

## Cross-Screen Workflows

### WF-1: Complete Case Inspection & Report Export

**End-to-End User Story:**

```
As a Field Surveyor
I want to complete a full insurance claim inspection
So that I generate a professional report for submission

Scenario: Motor claim field inspection (offline)

1. Start: Case List Screen
   - See 10 assigned cases
   - Tap MOTOR case: "CAS-2026-MOTOR-1234"

2. Case Detail Screen
   - View insured name, policy, location
   - Tap "Camera & Evidence" module

3. Camera Evidence Screen
   - Camera opens; GPS acquires fix
   - Guided wizard prompts "FRONT BUMPER DAMAGE"
   - Capture 4 photos (angles: front, side, rear, engine)
   - Quality analysis passes all (GOOD verdicts)
   - For each photo: add caption, confirm angle, save

4. Back to Case Detail
   - Evidence completeness now shows 4/4 (complete)
   - Tap "Voice Notes" module

5. Voice Notes Screen
   - Record 2 audio notes (~45 seconds each)
   - Offline Whisper STT auto-transcribes
   - Transcripts saved to case

6. Back to Case Detail
   - Tap "Export PDF" module

7. Report Preview Screen
   - Customize remarks: "Moderate frontal impact with radiator support crush."
   - Set signature: "Jane Surveyor, Senior Inspector"
   - Tap "Export PDF Report"

8. Success
   - PDF saved: /SurveyAgent/reports/CAS-2026-MOTOR-1234_Report.pdf
   - Contains: photos, geotags, voice transcripts, remarks, signature
   - Navigate back to Case List

9. Optional: Sync (when online)
   - Tap "Sync Now"
   - All case data, media, voice notes uploaded to backend
   - Sync status updated to SYNCED
```

**Acceptance:**
- [ ] All 7 screens navigation flows work
- [ ] Data persists across navigation
- [ ] PDF contains all expected sections
- [ ] File saved to correct device path
- [ ] Offline mode maintains all functionality

---

## Data Flow & Persistence Diagram

```
CaseListScreen
  ├─ Realm DB: getCases() → Display cards
  ├─ NetInfo: Detect online/offline status
  ├─ SyncEngine: syncNow() → Flush SyncQueue
  │
  └─ → CreateCaseScreen
      ├─ User fills form
      ├─ Realm DB: saveCase() → New Case record
      ├─ SyncQueue: Enqueue CREATE mutation
      │
      └─ → CaseDetailScreen
          ├─ Realm DB: getCaseById() + getMediaForCase() + getVoiceNotesForCase()
          ├─ LLMEngine: analyzeCaseOffline() → AI analysis
          ├─ Realm DB: saveCase(updatedAiSummary)
          │
          ├─ → CameraEvidenceScreen
          │   ├─ Expo Camera: takePictureAsync() → Temp URI
          │   ├─ Device Storage: persistImage() × 3 (stamped, original, thumbnail)
          │   ├─ Realm DB: saveMedia() → Media record
          │   ├─ SyncQueue: Enqueue CREATE mutation
          │   │
          │   └─ → PhotoAnnotationScreen
          │       ├─ Realm DB: getMediaById()
          │       ├─ Canvas: drawAnnotations()
          │       ├─ Device Storage: flattenEvidence() → Annotated JPEG
          │       ├─ Realm DB: saveMedia(annotations + new URI)
          │       └─ SyncQueue: Enqueue UPDATE mutation
          │
          ├─ → VoiceNotesScreen
          │   ├─ Expo Audio: recordAsync() → Audio file
          │   ├─ Device Storage: Save MP3
          │   ├─ WhisperSTT: transcribeAudio() → Text
          │   ├─ Realm DB: saveVoiceNote()
          │   └─ SyncQueue: Enqueue CREATE mutation
          │
          └─ → ReportPreviewScreen
              ├─ Realm DB: getCaseById() + getMediaForCase() + getVoiceNotesForCase()
              ├─ Device Storage: buildPhotoDataUris() → Base64 images
              ├─ PDFExporter: generateReportHTML() → HTML string
              ├─ PDFRenderer: rasterize() → Binary PDF
              ├─ Device Storage: Save PDF file
              └─ (Optional) SyncEngine: syncNow() → Upload all queued mutations
```

---

## Glossary of Terms

| Term | Definition | Example |
|------|-----------|---------|
| **Case** | Insurance claim record with metadata (policy, insured, location) | CAS-2026-MOTOR-1234 |
| **Sync Status** | State of case/media regarding cloud upload | OFFLINE_ONLY, PENDING, SYNCED, ERROR |
| **Media** | Captured photo with geotag, timestamp, angle, quality metadata | Photo at 37.77°N, 122.41°W |
| **Guided Angle** | Pre-defined photo pose category | FRONT BUMPER, INTERIOR ODOMETER |
| **Watermark** | Immutable GPS/timestamp baked into JPEG pixels | Visible in bottom-right of photo |
| **Verdict** | Photo quality assessment result | GOOD (92/100), FAIR (68/100), POOR (32/100) |
| **Annotation** | Vector drawing (arrow, circle, text) on photo | Arrow pointing to crushed bumper |
| **Flatten** | Rasterize vector annotations onto JPEG | Converts overlay to pixels; permanent |
| **SyncQueue** | Realm DB table tracking pending mutations for upload | CREATE, UPDATE, DELETE operations |
| **Data URI** | Base64-encoded image embedded in HTML/PDF | `data:image/jpeg;base64,/9j/4AAQ...` |
| **STT** | Speech-to-Text; converts audio to text | Whisper model offline transcription |
| **LLM** | Large Language Model; AI for analysis | Local quantized LLaMA for report drafting |

---

## Revision History

| Date | Version | Author | Change |
|------|---------|--------|--------|
| 2026-08-04 | 1.0 | AI Development | Initial user stories for v1.0 MVP |

---

**Document Status:** READY FOR QA & TESTING
**Estimated Effort:** 120–160 Story Points (Agile estimation)
**Next Review:** 2026-09-04
