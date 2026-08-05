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
  - Input field for **Organization ID** (unique tenant name).
  - Input field for **Email Address** with a subtle inline envelope icon.
  - Input field for **Password** with a togglable lock icon and eye visibility button.
  - **Login Button:** Prominent solid Corporate Navy CTA (`#0A1D37`) spanning the full width of the card.
  - Secondary text at the bottom: "Contact IT administrator for password reset."

### Comprehensive Screen Generation Prompt
```markdown
System Persona: Premium Mobile UI/UX Designer.
Task: Generate a high-fidelity mobile mockup of a secure Login Screen for an insurance adjusting app called "SurveyAgent".
- Device Frame: Modern iPhone/Android bezel, clean screen layout.
- Theme & Colors: Background is a matte Deep Slate Charcoal (#0F172A). Card container is a solid Navy-Slate (#1E293B) with a sharp border (#334155). Text colors are F8FAF4 for headings and 94A3B8 for labels.
- Layout: In the upper third, show a clean, professional corporate branding logo (geometric compass/camera lens) in Steel Blue (#2A4365) and clean typography. Below, place three text fields: "Organization ID", "Email Address", and "Password" (with a clean secure-eye icon). The active field has a solid Steel Blue outline. The primary button is styled in solid Corporate Navy (#0A1D37) with bold white text.
- Aesthetics: High-contrast, clean, flat corporate design. Strictly avoid neon purple/pink/magenta glowing lights or glass-glowing gradients. The interface must look highly professional, trustworthy, and corporate.
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
System Persona: Dashboard UI/UX Designer.
Task: Create a premium Case List Dashboard mobile UI for SurveyAgent.
- Colors: Main background Deep Slate Charcoal (#0F172A). Dashboard cards are Navy-Slate (#1E293B) with fine Slate outlines (#334155). 
- Header: A solid Corporate Navy (#0A1D37) top navigation bar. Includes an Online/Offline status badge styled in Compliance Teal (#0F766E) or Warning Amber (#B45309).
- Main Body: A search input bar followed by a horizontal row of filter chips (Motor, Fire, Marine). Below this, show a list of three case cards. Each card displays a bold white case number, metadata labels in muted gray (#94A3B8), and a color-coded status badge (e.g., "MOTOR" pill, "FIRE" pill). Highlight one card with a green "Cached Locally" indicator icon.
- Floating Button: Place an emerald-green or steel-blue round floating action button (+) in the bottom right corner.
- Overall feel: Trustworthy risk-management corporate interface, high contrast, clean typography (Roboto or Inter), zero generic glowing AI gradients.
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
System Persona: Business Form Layout Specialist.
Task: Generate a high-fidelity UI design for the "Create Case" screen of the SurveyAgent app.
- Layout: Form screen. Background is deep charcoal gray (#0F172A). Form inputs are grouped into cards using Navy-Slate (#1E293B) with thin borders (#334155).
- Fields: Upper section contains a Claim Type selection grid (horizontal chips). Middle section contains standard text inputs ("Policy Number", "Insured Name") with thin placeholder text. Below this, show the GPS coordinate inputs which are read-only gray next to a solid Steel Blue (#2A4365) button containing a location pin icon labeled "Auto-GPS".
- Priority Selector: Urgency segmented controls colored in gray for inactive and deep Crimson Red (#991B1B) for the "Urgent" option.
- Feel: Extremely structured, corporate compliance look, crisp lines, clear visual division, and readable typography.
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
System Persona: Mobile App Workspace UI Architect.
Task: Generate a mobile screen mockup for the "Case Detail Workspace" in the SurveyAgent app.
- Base Theme: Deep Slate Charcoal (#0F172A) canvas.
- Summary Area: A neat metadata info card at the top displaying names and numbers in off-white (#F8FAF4) with clear gray labels (#94A3B8).
- Action Tiles: A 2x2 grid of buttons styled in Navy-Slate (#1E293B) with light borders. Each tile contains a clean vector icon (Camera, Mic, Clipboard, PDF) and micro-status texts.
- AI Analysis Section: A card at the bottom containing a model selection dropdown menu (showing "Gemini 1.5 Flash") next to a primary action button styled in a solid Corporate Navy (#0A1D37) gradient. Show a markdown preview box displaying mock AI output sections like "Incident Overview" and "Damage Severity: MODERATE" in Warning Amber (#B45309).
- Feel: Professional, clinical, and structured.
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
System Persona: Camera Interface UX Engineer.
Task: Create a camera interface overlay screen for the SurveyAgent app.
- Interface: A full-screen live video viewfinder mockup with a central dashed aiming circle.
- Overlays: Renders a clean status bar at the top displaying "GPS Lock: Strong (5m)" in Compliance Teal (#0F766E). A translucent black strip at the bottom of the viewfinder displays metadata: "LAT: 37.7749 | LON: -122.4194 | ALT: 112m" in bold monospaced typography.
- Wizard Dock: Below the viewfinder, show a horizontal strip of target angles with checkboxes (e.g., "[✓] FRONT BUMPER", "[ ] ODOMETER" highlighted in Warning Amber).
- Shutter Button: A solid double-ring white and gray shutter button centered at the bottom.
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
System Persona: Audio Interface Designer.
Task: Generate a mockup of the Voice Notes Recorder screen for SurveyAgent.
- Theme: Dark slate background (#0F172A).
- Visualization: A waveform graph showing audio frequencies in Steel Blue (#2A4365) in the top half of the screen. Underneath, show a digital stopwatch timer showing "01:24".
- Controller: A large circular recording button styled in deep Crimson Red (#991B1B) indicating active state.
- List: A vertical list of two saved notes in Card Navy-Slate (#1E293B) with mini timeline progress bars, timestamps, and play triangle icons.
- Feel: Clean utility app, high usability, corporate dark theme.
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
System Persona: Dynamic Forms UX Specialist.
Task: Create a Checklist Form interface design for the SurveyAgent app.
- Theme: Matte Slate gray (#0F172A). Forms are nested in structured cards (#1E293B) with borders (#334155).
- Progress Header: A thin compliance-teal progress line (#0F766E) runs across the top of the form, displaying a bold text caption: "Section 2: Hull Integrity (8 of 10 fields)".
- Field Types: Renders a checkbox list, text description inputs, and a custom segmented toggle button for "Damage Severity: Low | Medium | High".
- Layout: Structured spacing, labels placed above input controls in muted gray (#94A3B8), inputs containing clear placeholder text.
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
System Persona: Document Interface UI Designer.
Task: Generate a high-fidelity screen design for the "Report Export & Preview" dashboard in the SurveyAgent app.
- Colors: Canvas background is Deep Slate (#0F172A). The side controller cards are Navy-Slate (#1E293B).
- Preview: In the center, render a clean, high-contrast, structured white paper report mockup with a dark header block, metadata columns, an itemized checklist summary table, and a 2-column grid of image attachments.
- Action Buttons: Place a prominent "Export PDF Report" button in the bottom dock, styled in a solid Compliance Teal (#0F766E) gradient with a PDF document icon.
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
System Persona: Graphics Editor UI Specialist.
Task: Create a mobile Photo Annotation Canvas interface for SurveyAgent.
- Layout: The canvas occupies the upper 70% of the screen, showing a car fender damage photo with a red circle drawn around a scratch and a red pointer arrow pointing to the circle.
- Toolbar: Below the canvas, render a sleek toolbar containing tool icons (Brush, Pointer Arrow, Shape Circle, Text Input, Eraser). Underneath the tools, show a row of four color choice buttons (Red, Yellow, Blue, Green).
- Action Buttons: A gray "Discard" button and a solid Corporate Navy (#0A1D37) "Save Flattened Image" button in the bottom footer.
```
