# SurveyAgent UI/UX Design & Screen Generation Prompts

This document details the UI layouts, component specifications, and comprehensive design generation prompts for all **9 screens** of the SurveyAgent mobile field application. 

All designs must strictly align with the **"Trust & Precision"** corporate theme (deep corporate navy, steel blue, and dark slate charcoals) to present an authoritative, professional look tailored for insurance adjusters and field surveyors.

---

## Design System Reference (Tokens)

- **Canvas Background:** Deep Slate Charcoal (`#0F172A`)
- **Card Background:** Navy-Slate (`#1E293B`)
- **Branding Header/Primary CTA:** Corporate Navy (`#0A1D37`)
- **Interactive Accents/Active Hover:** Steel Blue (`#2A4365`)
- **Success/Verified Pill:** Compliance Teal (`#0F766E`)
- **Caution/Pending Pill:** Warning Amber (`#B45309`)
- **Severe/Urgent Pill:** Damage Crimson (`#991B1B`)
- **Main Text:** Off-white (`#F8FAF4`)
- **Sub-labels/Secondary Text:** Muted steel gray (`#94A3B8`)

---

## 1. Authentication / Login Screen (`LoginScreen.tsx`)

### Structural Layout & Components
- **Container:** Full-screen slate charcoal background (`#0F172A`) with a subtle, non-intrusive navy blue header curve gradient.
- **Top Branding Area:** Geometric, professional company emblem placeholder resembling a compass or camera lens, next to bold title text: `SURVEYAGENT` (all-caps, modern sans-serif).
- **Glassmorphism Form Card:** Centered card container (`#1E293B`) with a fine border (`#334155`) containing:
  - Input field for **Email Address** with a subtle inline envelope icon.
  - Input field for **Password** with a togglable lock icon and eye visibility button.
  - **Login Button:** Prominent solid Corporate Navy CTA (`#0A1D37`) spanning the full width of the card.
  - Secondary text at the bottom: "Contact administrator for password reset."

### Comprehensive Screen Generation Prompt
```markdown
[ROLE & CONTEXT]
You are a premium Mobile UI/UX Designer specialized in creating secure corporate enterprise application designs.

[TASK & DEVICE SPECIFICATION]
Generate a high-fidelity, production-grade mobile mockup of a secure Login Screen for an insurance adjusting app called "SurveyAgent".
- Screen Frame: Match a modern bezel-less smartphone (e.g., iPhone 15 Pro / Google Pixel 8) with status bar icons visible at the top (WiFi, Battery, Time).
- Spacing & Grid: Use a structured vertical stack with 24px side margins. Center the content vertically to focus the inspector's attention.

[DETAILED COMPONENT SPECIFICATIONS]
1. Canvas Background: Solid matte Deep Slate Charcoal (#0F172A) with a subtle, dark geometric background vector in the upper third representing risk coordinates. No bright neon elements.
2. Top Branding: Renders a sleek, sharp, vector logo composed of a stylized camera lens intersecting with a compass needle in Steel Blue (#2A4365). Beside it, the brand name "SURVEYAGENT" in bold, tracking-spaced sans-serif off-white typography (#F8FAF4).
3. Central Login Form Card:
   - Background: Dark Navy-Slate (#1E293B) with a 1px solid border (#334155) and rounded corners (16px radius).
   - Form Fields: Two input fields stacked vertically with 16px spacing:
     * Field 1: "Email Address" — features an envelope icon, placeholder text "surveyor@firm.com".
     * Field 2: "Password" — features a lock icon, placeholder text "••••••••", and an eye-crossed icon on the right representing password visibility toggle.
   - Field State: The "Email Address" input field is shown in the active/focused state with a crisp, solid Steel Blue (#2A4365) border and a tiny, blinking insertion cursor.
4. Primary Action Button: A wide, solid Corporate Navy (#0A1D37) button spanning the card width. Text reads "AUTHENTICATE & LOG IN" in uppercase bold off-white, centered, with a small arrow icon on the right.
5. Footer: A line of small, secondary text in muted gray reading: "Protected under secure credentials check. Contact administrator for login assistance."

[VISUAL STYLE & AESTHETIC PRINCIPLES]
- Style: Corporate, stable, authoritative, and clean. Understated risk-management style.
- Color Restrictions: Strictly limit the color palette to the designated hex codes. Do NOT use bright purples, magenta, glowing space gradients, or futuristic cyber-punk elements.
```

---

## 2. Case List Dashboard Screen (`CaseListScreen.tsx`)

### Structural Layout & Components
- **Top Sticky Header:** Corporate Navy background (`#0A1D37`) containing:
  - Hamburger menu icon (left).
  - Screen title: "Active Inspections".
  - Status pill: "ONLINE" in Compliance Teal (`#0F766E`) or "OFFLINE" in Warning Amber (`#B45309`).
  - Search trigger icon (right).
- **Search & Filters Block:** Located below the header.
  - A clean search input field with an inline search magnifying glass icon.
  - A scrollable chip selector row with claim filters: `All`, `Motor`, `Fire`, `Marine`, `Property`. Active filter has a Steel Blue background; inactive chips have card backgrounds.
- **Case Cards List:** Scrollable list of structured items. Each card displays:
  - Case Number (bold heading, e.g. `CAS-2026-MOTOR-0301`).
  - Claim Type Badge (e.g. "MOTOR" or "FIRE" color-coded pill).
  - Secondary metadata lines: Insured party name, Policy number, Date of Loss.
  - Offline local cache indicator icon (small green download/check icon).
- **Bottom-Right FAB:** Floating Action Button (+) with solid Steel Blue background (`#2A4365`).

### Comprehensive Screen Generation Prompt
```markdown
[ROLE & CONTEXT]
You are a senior Mobile Dashboard Designer specializing in structured master-detail layouts for field operations.

[TASK & DEVICE SPECIFICATION]
Create a high-fidelity mobile dashboard UI representing the "Case List" screen of the SurveyAgent app.
- Device Viewport: Bezier-bezel smartphone. Renders a long scrollable list container.
- Layout Strategy: Top sticky navigation bar, search and horizontal filters sub-header, and a main body area containing a list of assigned cases.

[DETAILED COMPONENT SPECIFICATIONS]
1. Navigation Bar (Top):
   - Background: Solid Corporate Navy (#0A1D37).
   - Left Side: A hamburger drawer icon.
   - Center: Title text "SurveyAgent Dashboard" in clean semibold off-white typography.
   - Right Side: A status pill showing connectivity: "ONLINE" styled in a translucent Compliance Teal (#0F766E) container with green text.
2. Search & Filter Bar:
   - Spacing: 16px margins, placed directly below the header.
   - Input Box: A search bar containing a magnifying glass icon, reading "Search by Case, Insured, or Policy...".
   - Filter Carousel: A horizontal row of rounded select chips: "ALL" (active, colored in solid Steel Blue #2A4365), "MOTOR" (inactive), "FIRE" (inactive), "MARINE" (inactive).
3. Scrollable Cases Feed:
   - Card 1 (Active/Draft): Case Number "CAS-2026-MOTOR-0301". Displays a label "DRAFT" in a muted gray chip, Insured name "John Doe", Policy "POL-88220", and Date "2026-08-04". Contains a green "Stored in Local Cache" indicator icon in the bottom right.
   - Card 2 (In Progress): Case Number "CAS-2026-FIRE-0419". Displays a label "IN PROGRESS" in a Warning Amber (#B45309) chip, Insured name "Acme Logistics", Policy "POL-99100", and a red alert badge warning "Missing Photo Angle: VIN".
   - Card 3 (Pending Sync): Case Number "CAS-2026-MARINE-0112". Displays a label "SYNC REQUIRED" in a light blue chip.
4. Floating Action Button (FAB): Placed in the bottom-right corner. It is a perfect circular button in Steel Blue (#2A4365) containing a clean "+" symbol.

[VISUAL STYLE & AESTHETIC PRINCIPLES]
- Tone: Clean, informative, prioritizing list density and immediate legibility over empty spaces.
- Colors: Main background is Deep Slate Charcoal (#0F172A), cards are Navy-Slate (#1E293B) with thin borders (#334155).
- Exclusions: No neon glowing accents, no space/neon purple highlights. Clean corporate styling only.
```

---

## 3. Create Case Screen (`CreateCaseScreen.tsx`)

### Structural Layout & Components
- **Header Navigation Bar:** Deep Slate background with a left "Cancel" button, a centered title "Create Inspection Case", and a right "Save" text action button.
- **Form Card Groups:**
  - **Section 1: Claims Scope:** Contains a horizontal chip grid to choose the claim domain (Motor, Fire, Marine, Property).
  - **Section 2: Case Profile:** Text fields for "Case Reference ID" (auto-generated draft format), "Policy Number", "Insured Name", and a calendar picker for "Date of Loss".
  - **Section 3: Geolocation:** Read-only fields for Latitude and Longitude coordinates, styled next to a prominent "Auto-GPS" button with a satellite lock icon.
  - **Section 4: Priority Levels:** Segmented controls to select case urgency: `Low`, `Medium`, `High`, `Urgent`.

### Comprehensive Screen Generation Prompt
```markdown
[ROLE & CONTEXT]
You are a senior Form Layout and Data Input UX Designer specializing in enterprise mobile interfaces.

[TASK & DEVICE SPECIFICATION]
Create a high-fidelity mobile UI mockup for the "Create Case Form" screen of the SurveyAgent app.
- Device Bezel: Standard modern smartphone viewport.
- Layout Strategy: Top action header, vertically scrollable form sections grouped in logical outline panels.

[DETAILED COMPONENT SPECIFICATIONS]
1. Header Bar:
   - Background: Dark slate background matching the canvas (#0F172A).
   - Left Side: "Cancel" action link in muted steel gray.
   - Center: Title "New Case Registry" in bold off-white.
   - Right Side: A prominent "Create" action link in Compliance Teal (#0F766E).
2. Form Panels (Navy-Slate cards #1E293B, 12px vertical gaps):
   - Group 1: "CLAIM CATEGORY" — A row of 4 square selectors: "Motor" (active with a Steel Blue border), "Fire", "Marine", and "Property" (each with clean outline icons).
   - Group 2: "POLICY HOLDER PROFILE" — Stacked input fields:
     * "Case Reference Number" (Pre-filled read-only text input "CAS-2026-DRAFT-XXXX" in muted font).
     * "Policy Identifier *" (Text input with active focus outline).
     * "Primary Insured Name *" (Standard text input).
     * "Date of Loss Incident *" (Input field displaying a mini calendar icon on the right).
   - Group 3: "SITE GEOLOCATION" — Contains two read-only coordinate boxes displaying "Latitude: Pending" and "Longitude: Pending" in a monospaced font. Next to them is a wide button styled in solid Steel Blue (#2A4365) labeled "Lock Auto-GPS Location" featuring a satellite radar icon.
   - Group 4: "CASE PRIORITY" — A segmented toggle bar divided into 4 parts: "LOW", "MEDIUM" (active highlight), "HIGH", and "URGENT".
3. Visual Validation: Add red asterisk markers (*) next to required labels to emphasize form validation rules.

[VISUAL STYLE & AESTHETIC PRINCIPLES]
- Tone: Highly ordered, functional, prioritizing field grid alignment and readable input placeholders.
- Colors: Main background #0F172A, card outlines #334155, field text #F8FAF4.
```

---

## 4. Case Detail Screen (`CaseDetailScreen.tsx`)

### Structural Layout & Components
- **Header:** Left back arrow, screen title displays the active Case Number.
- **Summary Metadata Panel:** A card displaying key metrics: Insured Name, Date of Loss, Site Location, and Coordinate locks.
- **2x2 Navigation Grid Tiles:** Solid Navy-Slate cards with centered icons:
  1. **Camera & Evidence** (Camera icon, caption showing "Photos: 12").
  2. **Voice Dictation** (Microphone icon, caption showing "Notes: 3").
  3. **Checklist Form** (Form icon, progress indicator: "80% Complete").
  4. **Report Preview** (Document icon, badge reading "Draft Ready").
- **AI Integration Card:**
  - Dropdown box to select target model: `Gemini-1.5-Flash`, `Gemini-1.5-Pro`, `GPT-4o-mini`.
  - A primary **"Run AI Analysis & Upload"** button with a loading/upload progress indicator.
  - A summary markdown viewport displaying auto-generated reports, damage ratings, and warnings.

### Comprehensive Screen Generation Prompt
```markdown
[ROLE & CONTEXT]
You are a senior Workspace UI/UX Architect specializing in multi-module dashboards and mobile data visualization.

[TASK & DEVICE SPECIFICATION]
Generate a mobile layout design for the "Case Detail Workspace" screen inside the SurveyAgent application.
- Device: High-resolution smartphone bezel.
- Layout Strategy: Vertically scrollable. Displays a top case summary card, a central navigation grid of inspection modules, and a bottom section for batch uploads and cloud AI triggers.

[DETAILED COMPONENT SPECIFICATIONS]
1. Header Bar: Left-aligned back button arrow, center title reads "CAS-2026-MOTOR-0301", right-aligned setting cog.
2. Metadata Summary Card:
   - Background: Dark Navy-Slate (#1E293B) with slate outline.
   - Fields: Shows "Insured: John Doe", "Policy: POL-88220", "GPS: 37.7749, -122.4194 (Verified)", and "Date: 2026-08-04".
3. Workspace Navigation Grid:
   - Layout: A 2-column, 2-row square grid.
   - Tile 1: "Camera & Evidence" — Features a camera icon, a subtitle showing "14 Images Captured", and a small green checkmark indicating all mandatory angles have been captured.
   - Tile 2: "Voice Notes" — Features a microphone icon and subtitle "3 Recordings Stored".
   - Tile 3: "Field Checklist" — Features a clipboard checklist icon and a circular progress tracker reading "85% Completed".
   - Tile 4: "Report Preview" — Features a document preview icon and status badge "DRAFT COMPILED".
4. Batch Upload & Cloud AI Panel (Bottom Card):
   - Elements: A dropdown selection field showing "AI Engine: Gemini-1.5-Flash".
   - Action Button: A wide button styled in solid Corporate Navy (#0A1D37) with the text "RUN BATCH UPLOAD & AI SYNTHESIS". Show a loading spinner next to the text.
   - Output Viewport: A dark text area displaying simulated markdown AI results:
     * Heading: "### 1. Initial Assessment Summary"
     * Text: "Severe impact damage detected on front bumper assembly. Estimate: $2,400."
     * Alert Badge: "Severity: MODERATE" in Warning Amber (#B45309).

[VISUAL STYLE & AESTHETIC PRINCIPLES]
- Tone: Technical, dense workspace, highly readable coordinates, and clean status badges.
- Colors: Main background #0F172A, card backgrounds #1E293B, text colors #F8FAF4 and #94A3B8.
```

---

## 5. Camera Evidence Screen (`CameraEvidenceScreen.tsx`)

### Structural Layout & Components
- **Camera Viewfinder:** Renders the active live camera preview in the center with a thin reticle grid overlay.
- **Floating Controls (Top):**
  - Flash button (Flash Off / Flash On) on the left.
  - Camera switch icon on the right.
- **Baked Watermark Overlay (Bottom):** Translucent gray bar displaying latitude/longitude details, UTC timestamp, case ID, and active target angle prompt.
- **Guided Angle Wizard Panel:** Card situated above the shutter button.
  - Displays a horizontal list of required photo tags: e.g. `[✓ Front Bumper]`, `[• Odometer]`, `[○ Vehicle VIN]`.
  - Missing required tag warnings.
- **Shutter Dock:** Floating circular shutter trigger flanked by a thumbnail gallery preview button.

### Comprehensive Screen Generation Prompt
```markdown
[ROLE & CONTEXT]
You are a specialized Camera & Overlay Interface UI Designer creating software for high-precision field data collection.

[TASK & DEVICE SPECIFICATION]
Generate a mobile UI screen mockup for the "Camera Evidence Collector" screen in the SurveyAgent app.
- Device: Full-screen display showing active camera viewfinder canvas.
- Layout Strategy: Live camera view in the center, translucent overlay elements at the top, bottom, and bottom control bar.

[DETAILED COMPONENT SPECIFICATIONS]
1. Viewfinder Screen Area (Takes up 75% of vertical height):
   - Overlaid with a thin, dashed grid lines reticle (Rule of Thirds).
   - Top Bar: Floating translucent buttons for Flash (Toggle to Flash On) and Camera Flip.
   - Location Status: A tiny badge reading "GPS Locked (Accuracy: 3 meters)" in Compliance Teal (#0F766E).
2. Metadata Watermark (Baked-in translucent strip at the bottom of the camera viewfinder):
   - Text: "CASE: CAS-2026-MOTOR-0301 | TIME: 2026-08-05 17:34:00 UTC | GPS: 37.7749° N, 122.4194° W | ALT: 112m | ANGLE: FRONT BUMPER".
   - Font: Monospaced, high-contrast white text (#F8FAF4) with a clean drop-shadow.
3. Guided Angle Wizard (Situated directly below the viewfinder):
   - Background: Solid Card Navy-Slate (#1E293B).
   - Content: A horizontal scroll view of required camera angles:
     * "[✓] Front Left" (Teal check icon).
     * "[•] Odometer" (Amber indicator dot showing active angle).
     * "[○] VIN Plate" (Gray circle outline showing incomplete).
4. Shutter Controls:
   - Left Side: Small thumbnail box showing a preview of the last captured photo of a car bumper scratch.
   - Center: A large, professional white shutter trigger button with a double-ring bezel.
   - Right Side: A gallery folder icon.

[VISUAL STYLE & AESTHETIC PRINCIPLES]
- Tone: Highly functional, clean, mimicking professional survey equipment rather than standard consumer camera apps.
- Colors: Main background #0F172A, card backgrounds #1E293B.
```

---

## 6. Voice Notes Screen (`VoiceNotesScreen.tsx`)

### Structural Layout & Components
- **Waveform Area:** Horizontal line rendering audio waves during recording, styled in Steel Blue.
- **Record Controller:**
  - A large circular record button (Idle: Blue / Recording: Pulsating Crimson Red with standard stop icon).
  - Time elapsed counter (format: `00:00:00`).
- **Saved Audio Logs List:** Vertical collection of cards below the recorder, showing:
  - Audio file title: e.g., "Dictation #1 (12s)".
  - Timestamp of capture.
  - Playback timeline slider and play trigger icon.

### Comprehensive Screen Generation Prompt
```markdown
[ROLE & CONTEXT]
You are a senior Audio Utility & Recorder UX Designer specializing in clean voice capture interfaces.

[TASK & DEVICE SPECIFICATION]
Create a high-fidelity mobile UI mockup for the "Voice Note Dictations" screen in the SurveyAgent app.
- Device: Standard smartphone viewport.
- Layout Strategy: Top visualization section showing live recording feedback, middle recording controls, and bottom list showing saved audio notes.

[DETAILED COMPONENT SPECIFICATIONS]
1. Header Bar: Left back arrow, center title "Voice Dictation Logs", right delete icon.
2. Waveform Visualizer (Top Container):
   - Background: Dark Navy-Slate (#1E293B) with a subtle grid background.
   - Visualization: A glowing Steel Blue (#2A4365) digital audio waveform displaying frequency spikes.
   - Timer: Below the wave, show "02:14.05" in a bold digital monospaced font.
3. Recording Controls (Middle):
   - Start/Stop Button: A large circular recording button styled in a pulsating Damage Crimson (#991B1B) color, containing a white square stop icon inside.
   - Micro-indicators: Small text reading "Recording saved in local m4a format at cases/CAS-0301/audio/".
4. Saved Audio Logs Feed (Bottom Scrollable area):
   - Item 1: "Site Overview Dictation" — Duration: "1m 45s" | Timestamp: "10 mins ago". Displays a mini seek bar with a slider thumb, a play arrow button, and a trash can delete icon.
   - Item 2: "Damage Detail: Front Grille" — Duration: "0m 42s" | Timestamp: "20 mins ago". Displays a play icon and duration badge.
   - Background: Cards are styled in Navy-Slate (#1E293B) with fine Slate outlines (#334155).

[VISUAL STYLE & AESTHETIC PRINCIPLES]
- Tone: Clean, flat, utilitarian. Dark mode focus.
- Colors: Main background is Deep Slate Charcoal (#0F172A). Text colors are F8FAF4 for headings and 94A3B8 for labels.
```

---

## 7. Checklist Form Screen (`ChecklistFormScreen.tsx`)

### Structural Layout & Components
- **Top Header Progress Dock:**
  - Back arrow, Checklist Title.
  - A horizontal progress bar in Compliance Teal showing checklist completion percentage (e.g. `Progress: 75%`).
- **Checklist Sections:** Vertical cards displaying grouped fields:
  - Text input boxes with clear headers and required asterisk marks (*).
  - Radio groups and toggles for binary queries (e.g. "Structural Damage Detected?").
  - Nested conditional containers that expand smoothly on selection.

### Comprehensive Screen Generation Prompt
```markdown
[ROLE & CONTEXT]
You are a senior Form Systems and Survey Logic UX Designer specializing in mobile compliance checklist engines.

[TASK & DEVICE SPECIFICATION]
Generate a mobile layout design for the "Checklist Form" screen of the SurveyAgent app.
- Device Viewport: High-resolution mobile bezel.
- Layout Strategy: Top sticky progress indicator header and a vertically scrollable body containing structured checklist inputs.

[DETAILED COMPONENT SPECIFICATIONS]
1. Progress Header Block:
   - Background: Solid Corporate Navy (#0A1D37).
   - Elements: A back button, title "Motor Claim Checklist", and a wide, horizontal progress bar styled in Compliance Teal (#0F766E) showing "Progress: 65% (13 of 20 completed)".
2. Checklist Form Panel (Grouped in Navy-Slate cards #1E293B, 16px gaps):
   - Question 1: "Is the vehicle driveable?" — Renders a custom segmented button selector: "YES" (inactive) | "NO" (active with a Steel Blue highlight and border).
   - Question 2: "Airbag deployment detected?" — Renders a simple check slider toggle (active).
   - Nested Conditional Sub-Question (Indented by 16px, grouped within a dashed border container):
     * "Select deployed airbags (Select all):" — A list of checkboxes: "[✓] Driver Airbag", "[ ] Passenger Airbag", "[✓] Side Curtain Airbag".
   - Question 3: "Engine Bay Inspection Comments" — A large multiline textarea input box containing placeholder text "Write specific engine damage, fluid leaks, or block cracks...".
3. Auto-Save Toast: A small, non-obvious status tag at the bottom reading "✓ Checklist auto-saved locally on device".

[VISUAL STYLE & AESTHETIC PRINCIPLES]
- Tone: Structured, clinical, clean inputs, and clear conditional indentations.
- Colors: Main background #0F172A, card outlines #334155, checkbox details in Steel Blue.
```

---

## 8. Report Preview & Export Screen (`ReportPreviewScreen.tsx`)

### Structural Layout & Components
- **Export Config Card (Top):**
  - Switches to toggle including photos, GPS watermarks, and checklist results.
- **Custom Summary Remarks Input:** A large multi-line textarea box to type final adjuster notes.
- **Digital Sign-off Block:** Signature text input field.
- **HTML Report Mock Frame:** A preview window showing the compiled document:
  - Formal letterhead logo and metadata columns.
  - Grid list of captured geotagged photos.
  - Signed validator names.
- **Export CTA:** Floating bottom button in Compliance Teal (`#0F766E`) labeled "Export PDF Report".

### Comprehensive Screen Generation Prompt
```markdown
[ROLE & CONTEXT]
You are a senior Document Layout and Report Generation UX Architect.

[TASK & DEVICE SPECIFICATION]
Generate a mobile mockup representing the "Report Export & Preview" workspace in the SurveyAgent app.
- Device: Bezier-bezel smartphone.
- Layout Strategy: Top options panel, centered document Webview frame showing a preview sheet, and a sticky primary export button at the bottom.

[DETAILED COMPONENT SPECIFICATIONS]
1. Header Bar: Left back arrow, center title "Report Preview & Export".
2. Export Configuration Card (Navy-Slate #1E293B):
   - Content: A row of three switches: "Attach Photos" (ON), "Include GPS Coordinates" (ON), "Include Checklist Logs" (OFF).
3. Remarks Input Box: A text box with a light background outline labeled "Adjuster Summary Notes" containing some typed text.
4. Document Preview Sheet (Takes up 50% of screen height):
   - Background: Pristine paper-white background card with a dark gray header block.
   - Text: Simulates a structured formal layout containing a logo watermark, columns reading "Case File CAS-0301", "Claim: Motor Loss", and a table showing vehicle inspection results.
   - Attachments: A 2-column grid showing small thumbnails of annotated damage photos.
   - Sign-off: Displays "Digital Sign-off: VIPUL SINGH (Senior Inspector)".
5. Export Action Dock (Bottom):
   - Background: Dark slate canvas (#0F172A).
   - Button: A wide button styled in a deep Compliance Teal (#0F766E) gradient reading "EXPORT & COMPILE PDF REPORT" featuring a PDF file icon.

[VISUAL STYLE & AESTHETIC PRINCIPLES]
- Tone: Clean, corporate report preview, high contrast between dark app frame and white document preview sheet.
- Colors: App frame #0F172A, document preview page #FFFFFF.
```

---

## 9. Photo Annotation Screen (`PhotoAnnotationScreen.tsx`)

### Structural Layout & Components
- **Main Canvas Workspace:** Displays the selected case image, centered and scaled.
- **Drawing Vector Overlay:** Captures touch points to render geometric annotation overlays.
- **Floating Toolbar (Bottom/Top):**
  - Tools row: `Arrow`, `Circle`, `Rectangle`, `Text Label`, `Brush`, `Undo`.
  - Color picker row: Solid circles representing Red, Yellow, Cyan, Green.
  - Thickness controls: Small icon markers representing pixel widths.
- **Footer CTAs:** Floating "Cancel" and "Save Annotations" buttons.

### Comprehensive Screen Generation Prompt
```markdown
[ROLE & CONTEXT]
You are a senior Mobile Graphic Editor and Canvas Tooling UX Specialist.

[TASK & DEVICE SPECIFICATION]
Generate a mobile screen mockup for the "Photo Annotations Utility" canvas workspace in the SurveyAgent app.
- Device Viewport: High-resolution modern smartphone screen.
- Layout Strategy: The top 75% contains the photo drawing canvas. The bottom 25% contains the toolbar controls and action footer.

[DETAILED COMPONENT SPECIFICATIONS]
1. Annotation Canvas Workspace (Top):
   - Background Image: A photo of a silver car's front bumper showing dent scrapes.
   - Vector Overlay:
     * A sharp Crimson Red (#991B1B) circle drawn around a deep dent scrape.
     * A Crimson Red arrow pointing directly to the circle.
     * A text label above reading "Dent: 45cm".
2. Annotation Toolbar:
   - Background: Solid Card Navy-Slate (#1E293B) with a sharp border.
   - Row 1 (Drawing Tools): Interactive outline icons: "Brush", "Arrow" (active state with a Steel Blue highlight), "Circle", "Rectangle", "Text Block", and "Undo".
   - Row 2 (Color Selection): Four round color dots: Crimson Red (active checkmark), Warning Amber, Cyan Blue, and Forest Teal.
3. Footer Controls:
   - Left Side: "Discard Changes" button styled in gray.
   - Right Side: A prominent button styled in solid Corporate Navy (#0A1D37) labeled "SAVE ANNOTATIONS".

[VISUAL STYLE & AESTHETIC PRINCIPLES]
- Tone: Professional image annotation utility, flat controls, clean drawing vector line rendering.
- Colors: Main background #0F172A, toolbar cards #1E293B.
```
