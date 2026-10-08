# Color Shift — App Spec

**Name:** Color Shift
**Tagline:** Two colors. One photo. Feel the contrast.
**Potential URL:** [coloshift.co-opstudio.com/color](http://coloshift.co-opstudio.com/color)  
**Created by:** John Aquino ([joao@co-opstudio.com](mailto:joao@co-opstudio.com))  
**Repo:** `color-shift` (Next.js 16 + Tailwind v4 (or latesst) + TypeScript)

---

## What It Is

A photo-driven contrast tool that extracts color pairs from Unsplash photography and lets you evaluate, nudge, and export them. Each photo becomes a two-color relationship: background and foreground. The tool puts you inside the color combination at full scale, with professional-grade contrast scoring (WCAG 2 and APCA), threshold bumping, and sliders in three color spaces.

Not a 5-color palette generator. Not a color theory teaching tool. Two colors, one photo, felt at full scale.

---



## Design Philosophy

- **The colors ARE the interface.** The specimen block and the photo share the screen. You're living inside the combination, not looking at swatches.
- **Photo-driven discovery.** Random Unsplash photography is the entry point. Each photo arrives with extracted color pairs, ready to evaluate. Navigate through photos with arrow keys to discover new palettes.
- **Discoverable, not labeled.** No dropdowns of color theory terms. Harmony rules power the engine invisibly.
- **Minimal chrome.** One compact sidebar holds every control. Everything else is color and photography.
- **Buttery smooth.** GSAP animations on every interaction. Color transitions ease between states. Slider updates are instant. Specimen typing is immediate; score/ColorField layout uses Flip scale with easeInOutQuart. This is a Shift Nudge product.



### Visual DNA (MDS's own work)

- **Vercel Design System (Geist): dark, clean, professional, and minimal**



### Figma File for this project

- Color shift: [https://www.figma.com/design/Fu0DGoLsLeY6wj7oLr5cVh/Color-Shift?node-id=0-1&m=dev](https://www.figma.com/design/Fu0DGoLsLeY6wj7oLr5cVh/Color-Shift?node-id=0-1&m=dev)

---



## Layout



### Sidebar + Split Screen (desktop)

- **Left sidebar (~320px):** logo and theme toggle, score tile, background/foreground color rows, editor panel (when open), action row, EXPORT. See "Sidebar Architecture".
- **Specimen panel:** Aa specimen. Background color fills the panel. Foreground color renders "Aa" at massive scale, centered. Click/tap the text to edit it directly, with only a native caret and automatic font fitting.
- **Photo panel:** Unsplash photo, full-bleed within its panel. Credit at bottom-right, "Photographer, Unsplash", both linking out.
- Panels have page padding and rounded corners (Figma V6).
- Mobile (Phase 5, implemented): header and side-by-side specimen/photo precede scrolling score and inline editing; a fixed footer holds EXPORT and a floating trigger. Six actions expand vertically above it. See `plan/phase-5-theming-responsive.md` for the confirmed design, browser verification, and pending device checks.

> Numbers and hex values in the Figma mockups are placeholders. The engine is the source of truth.



### Planned: Scrollable Layout Mode

A second layout option where color + photo pairs stack vertically in a scrollable gallery. Details TBD in design phase.

---



## Core Features (Built)



### 1. Photo-Driven Color Extraction

- App loads 10 random Unsplash landscape photos on launch
- Each photo is processed through node-vibrant (browser-side) to extract a VibrantPalette (6 swatches: Vibrant, DarkVibrant, LightVibrant, Muted, DarkMuted, LightMuted)
- Engine scores all swatch pairs by contrast ratio + vibrancy + prominence, picks the best bg/fg pair
- Foreground is auto-bumped to guarantee AA contrast (4.5 WCAG or 60 APCA)
- Buffer auto-refills when you get within 3 photos of the end (always 10 ahead)
- Photo images are preloaded (full + thumb + 32px tiny placeholder)



### 2. The Specimen

- Left half of the screen. Background color fills the panel edge to edge.
- "Aa" rendered in the foreground color at massive scale (48px mobile per the confirmed Phase 5 Figma reference; desktop sizing follows the existing implementation)
- Click the text to edit directly. No visible editing box or separate button; font size fits the panel automatically. Escape blurs the input. Text persists while navigating/importing photos.



### 3. Photo Navigation

- Arrow keys (left/right) navigate through the photo buffer
- Spacebar injects a fresh random photo at the next position and navigates to it
- Photos crossfade with GSAP (configurable duration via CSS custom property `--photo-duration`)
- Tiny 32px placeholder loads first (pixelated), full image loads on top



### 4. Contrast Scoring (Dual Algorithm)

- **WCAG 2:** contrast ratio (e.g. "4.50:1"), grades: AAA (≥7.0), AA (≥4.5), AA Large (≥3.0), Fail
- **APCA:** Lc value (e.g. "Lc 72.3"), grades: AAA (≥75), AA (≥60), AA Large (≥45), Fail
- Toggle between algorithms with the WCAG | APCA tabs at the top of the score tile
- WCAG and APCA score values use the existing GSAP odometer animation on value change. Other numeric values remain unanimated.



### 5. Threshold Bumping

- Thresholds: 1.5, 3.0, 4.5, 7.0 (WCAG) or 30, 45, 60, 75 (APCA)
- Click the score tile to expand the threshold row. Click a threshold to bump the active color (fg by default, bg if its editor panel is open) to that exact contrast level
- Binary search on OKLCH lightness to find the minimal color change that hits the target
- Active threshold (nearest to current score) is visually highlighted



### 6. Color Editor (Format Tabs + Sliders)

- Click the BACKGROUND or FOREGROUND row to open the editor panel for that color; clicking the other row switches it. Closes on click outside or `Esc` (no close button).
- Five format tabs: **HEX / RGB / HSL / HSB / OKLCH**. The active tab sets the slider set and the readout row.
  - HEX and RGB: R/G/B (0-255). HSL: H/S/L. HSB: H/S/B. OKLCH: L (0-100), C (0-max gamut), H (0-360).
- Each slider has a gradient track for its channel at the current values of the other channels, with an editable number at its right end. Tracks crossfade when the tab changes.
- A monospace readout row shows the color in the active format. Editable; paste any valid format and it auto-converts.
- No 2D picker, no alpha (transparency is out of scope).
- Slider values are normalized to 0-100 internally. GSAP animates slider positions when the photo changes (power4.inOut). During manual drag, animation is killed and updates are instant.
- All sliders update the specimen and score in real time. Zero perceptible lag.
- OKLCH chroma slider uses binary search gamut mapping to find the maximum in-gamut chroma for the current L and H values.



### 7. Swap

- Button in the action row
- Flips foreground and background colors
- If the editor panel is open, its target swaps too (bg becomes fg, fg becomes bg)
- Keyboard shortcut: S



### 8. Color Format Display

- Color rows show plain monospace hex values; editor readouts and slider numbers remain unanimated.
- Export includes all five formats: HEX, RGB, HSL, HSB, OKLCH



### 9. Export

- **Copy:** copies markdown with both colors in all 5 formats + contrast score + grade + photo credit to clipboard
- **Download .MD:** planned (handler exists, not yet wired)
- The EXPORT button (bottom of the sidebar) switches the action row to COPY / DOWNLOAD .MD. EXPORT is the anchor (never moves). GSAP Flip animates the layout shift.



### 10. Dark / Light Theme

- Light | Dark segmented toggle in the sidebar/mobile header; explicit preference persists locally and resolves before paint.
- Dark mode (default): black chrome (#000), muted text (#a39f9f), subtle borders (#2B2727)
- Light mode (Phase 5, implemented): white/neutral chrome following Figma; palette tinting is deferred. The guarded `T` shortcut switches themes without resetting current work.
- Keyboard shortcut: T
- Light/Dark pointer clicks use the supplied horizontal theme wipe: Dark reveals left to right and Light right to left, 700ms ease-in-out, tunable as Theme Wipe → Duration Ms in development DialKit. Existing controls/theme persistence remain; keyboard activation/T, reduced motion and unsupported APIs are immediate. The earlier vertical curtain is archived in local branch `codex/theme-curtain` (`4ac7b422a326`).



### 11. DialKit Integration

- All motion parameters exposed as CSS custom properties on `:root`
- `--color-duration`, `--photo-duration`, `--photo-opacity`, `--theme-wipe-duration`, `--exit-duration`, `--enter-duration`, `--sidebar-easing`
- DialKit can live-tune any of these during development or demonstration
- Specimen squish/pop controls were removed. The subsequent review restores ColorField/score scale with development DialKit States → Easing (default easeInOutQuart).



### 12. Undo

- Undo button in the action row. History stack of color edits (slider changes, threshold bumps, fix) for the current photo. Resets when the photo changes.
- Shortcut: `Cmd/Ctrl+Z`.



### 13. Fix (wrench)

- Snaps the active color to the closest color that still passes the selected threshold (default: AA, 4.5 WCAG / 60 APCA), via the same minimal-lightness `bumpToContrast`. Undoable.



### 14. Loading and Error States

- Skeleton panels while photos load or extract. If the photo API fails, an inline message in the photo panel with retry.

---



## Sidebar Architecture

The sidebar is a Figma-matched component system built from atomic pieces:


| Component          | What It Does                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `ControlContainer` | Sidebar shell: header, score, color rows, editor region, action row, export                                |
| `Score`            | Tile with WCAG/APCA tabs, large monospace value, grade badge, per-grade description. Click expands thresholds |
| `ThresholdButtons` | Row of contrast thresholds inside the expanded score tile. Click to bump. Active threshold highlighted    |
| `ColorFields`      | BACKGROUND and FOREGROUND rows: label, monospace hex, swatch chip. Clicking opens the editor              |
| `EditorPanel`      | Format tabs + sliders + readout row for the selected color. Closes on outside click / Esc                 |
| `ControlsBar`      | Action row: prev, undo, shuffle, swap, fix, next. States: `default`, `export`                              |
| `Arrows`           | Previous/next photo buttons (outer ends of the action row)                                                |
| `ExportPanel`      | COPY + DOWNLOAD .MD buttons. Replaces the action row in export state; EXPORT button stays                 |
| `CSButton`         | Atomic button with optional swatch chip                                                                    |
| `Odometer`         | GSAP animation for WCAG and APCA score numerals only                                                        |
| `TubeText`         | Plain monospace value wrapper; no character animation                                                      |
| `FormatTabs`       | HEX / RGB / HSL / HSB / OKLCH tab row                                                                     |
| `ColorSliders`     | Three gradient-tracked sliders with numeric values, one per channel of the active format                  |
| `ColorSlider`      | Single slider with gradient layers (crossfade on tab change)                                              |
| `Swatch`           | Color chip with adaptive inner border (white for dark colors, black for light)                            |
| `IconButton`       | Wrapper for Phosphor icon-only interactive elements                                                       |


Phosphor icons use `regular` weight for most controls and `fill` only for active/selected states. Standard sizes are 16px for compact controls, 20px for primary action-row buttons, and 24px only for larger touch/mobile controls. Exact glyph choices come from the Figma design.

Every icon-only button must have an accessible label, visible focus state, and a non-color-only indication for selected, active, and disabled states. The theme toggle and score-tab info icons meet the same minimums (no sub-16px targets).

**State transitions** for EXPORT ↔ COPY/DOWNLOAD use GSAP Flip with ease-out-quint: exit 150ms, entrance 200ms. Score threshold expansion and ColorField opening/closing use Flip scale with easeInOutQuart (power3.inOut), adjustable through DialKit States → Easing (subsequent browser review, 2026-10-07). Light action buttons use #F2F2F2 / #EBEBEB / #171717; EXPORT uses the explicit dark button style from Figma in both themes.

---



## Shared Data Shapes

| Type               | Purpose                                                                   |
| ------------------ | ------------------------------------------------------------------------- |
| `Photo`            | Normalized Unsplash photo data used by the UI and photo buffer            |
| `PaletteSwatch`    | One extracted color candidate with metadata useful for ranking            |
| `ExtractedPalette` | Named swatches extracted from a photo                                     |
| `ColorPair`        | Selected foreground/background pair, including original and bumped values |
| `ContrastScore`    | WCAG/APCA score value plus rating label                                   |
| `ControlBarState`  | Current action-row mode (`default`, `export`, and future states)          |

---



## Tech Stack (Web)


| Package                  | Job                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `next` 16.2.1            | App framework                                                                       |
| `react` 19.2.4           | UI                                                                                  |
| `tailwindcss` v4         | Styling                                                                             |
| `culori`                 | OKLCH/HSB/RGB color engine (perceptually uniform conversions, gamut mapping)        |
| `apca-w3`                | APCA contrast algorithm (Lc values)                                                 |
| `@phosphor-icons/react`  | Web UI icon library for swap, arrows, generate, export/copy/download, close controls |
| `gsap`                  | Score odometer, photo transitions, slider easing, Flip export layout |
| `node-vibrant` (browser) | Photo color extraction (VibrantPalette: 6 swatches per image)                       |
| `dialkit`                | Live motion parameter tuning via CSS custom properties                              |
| `motion`                 | Available (Framer Motion), not currently primary                                    |
| `opentype.js`            | Font path data for SVG text rendering                                               |
| `interface-kit`          | UI primitives                                                                       |




### Custom Fonts (local, in `src/fonts/`)

- **Geist Sans: [https://fonts.google.com/specimen/Geist](https://fonts.google.com/specimen/Geist)**



### API Route

- `GET /api/photos?count=N` — proxies Unsplash random photos (landscape orientation). Returns id, url, thumbUrl, tinyUrl (32px), color, photographer, photographerUrl, photoUrl, alt. Requires `UNSPLASH_ACCESS_KEY` in env.

---



## Keyboard Shortcuts


| Key   | Action                       |
| ----- | ---------------------------- |
| ← / → | Navigate photos              |
| Space | Inject new random photo      |
| S     | Swap foreground / background |
| Cmd/Ctrl+Z | Undo color edit         |
| Esc   | Close editor panel           |
| T     | Toggle dark / light theme    |


---



## Platform Specs



### Web — Built

Full experience as described above. Next.js 16 + Tailwind v4, deployed on Vercel.

### iOS — Planned

- Camera as primary input (point at something, capture a color)
- Same two-color specimen + WCAG/APCA scoring
- Calls web API routes OR runs color logic natively
- Built in Swift/SwiftUI
- Skippable video for web-only students



### macOS — Planned

- Menu bar app with popover
- Screen color picker (NSColorSampler)
- Same two-color specimen + WCAG/APCA scoring
- Built in Swift/SwiftUI, native performance
- Skippable video for web-only students

---



## Planned / In Progress


| Feature                           | Status         | Notes                                                                                                               |
| --------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------- |
| Scrollable layout mode            | Planned        | Vertical gallery of color + photo pairs                                                                             |
| Photo drag-and-drop (web)         | Implemented    | Drop an image onto the photo area to extract colors locally. macOS follows with the native app in Phase 9.          |
| Camera / photo capture (iOS)      | Planned        | Alternate input to Unsplash: take a photo, extract colors from your own image                                       |
| Download .MD button               | Implemented    | Real Markdown file download and success reset verified in the browser                                               |
| Editable Aa text                  | Implemented    | Type custom text to test real content; the text persists across photo navigation                                   |
| Tile/grid photo transitions       | Researched     | 9 animation patterns documented in `transitions.md`                                                                 |
| Responsive mobile layout          | Implemented    | Browser-verified; physical software-keyboard and safe-area checks pending                                            |
| Vercel deployment                 | Planned        |                                                                                                                     |
| iOS build                         | Planned        | Full native Swift app                                                                                               |
| macOS build                       | Planned        | Full native menu bar app                                                                                            |
| Figma MCP export                  | Stretch        | Push swatches directly into a Figma file                                                                            |


---



## What This Is NOT

- Not a 5-color palette generator (coolors clone)
- Not a color theory teaching tool (no harmony labels in UI)
- Not a design system token generator
- Not a backend app (no auth, no database, no user accounts)
- Not an Electron wrapper for native platforms

---



## Teaching Value (for the course)


| Feature                   | What Students Learn                                         |
| ------------------------- | ----------------------------------------------------------- |
| Photo color extraction    | node-vibrant, Canvas API, image processing                  |
| OKLCH color engine        | culori library, perceptual color spaces, gamut mapping      |
| Color formats             | HEX/RGB/HSL/HSB/OKLCH translation, modern CSS color spaces  |
| Unsplash API              | API integration with env keys, proxy routes                 |
| WCAG + APCA scoring       | Dual accessibility algorithms, contrast math                |
| Threshold bumping         | Binary search, algorithmic color adjustment                 |
| Three slider modes        | Real-time state management, normalized value mapping        |
| GSAP animations           | Timeline sequencing, Flip layout, score odometer, spring physics |
| DialKit integration       | CSS custom properties as a design-engineering workflow      |
| Score odometer            | GSAP digit animation limited to WCAG and APCA scores         |
| Figma-matched components  | Translating a design system into atomic React components    |
| Sidebar state machine     | GSAP-driven UI state transitions (action row, score, editor) |
| Export (markdown)         | File generation, clipboard API                              |
| Responsive design         | Tailwind v4 responsive patterns                             |
| Native builds             | Swift/SwiftUI (iOS + macOS)                                 |


---



## Design Decisions Log


| Decision                                 | Date    | Rationale                                                                                               |
| ---------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| Photo-driven (not random-color-driven)   | 2026-03 | Unsplash photos make every palette feel grounded and real. Random generation felt clinical.             |
| Split screen (specimen + photo)          | 2026-03 | The photo IS the context. Showing it alongside the extracted colors tells a story.                      |
| Dual contrast algorithms (WCAG 2 + APCA) | 2026-03 | APCA is the future of contrast scoring. Teaching both positions students ahead of the industry.         |
| GSAP over CSS animations                 | 2026-03 | Complex choreography (Flip layout, score odometer, timeline sequencing) needs a real animation library. |
| Three slider modes (OKLCH/HSB/RGB)       | 2026-03 | Designers think in HSB. Code uses RGB. Modern CSS uses OKLCH. Show all three, explain why OKLCH wins.   |
| Score-only odometer animation            | 2026-10 | Keep motion on WCAG and APCA scores; color-editor values stay plain and editable. Supersedes the earlier TubeText proposal. |
| 20 rotating specimen fonts               | 2026-03 | Each photo gets a different typeface. Keeps the experience fresh. Only Aa glyphs loaded (~1-2KB each).  |
| DialKit CSS custom properties            | 2026-03 | Demonstrates the designer's fine-tuning workflow. Students see animation parameters they can touch.     |
| Left sidebar replaces bottom bar         | 2026-09 | Figma V6: all controls in one column keep both panels full height and give the editor room to grow.     |
| Format tabs drive sliders (no picker/alpha) | 2026-09 | One control sets format and sliders; per-channel sliders work in every space, a 2D picker does not.  |
| Aa ↔ Circle toggle on specimen           | 2026-03 | Shows the color relationship as both typography and pure form. The interaction itself teaches contrast. |


---

*Spec rewritten: 2026-03-28 (from codebase, replaces 2026-03-25 original). Layout revised 2026-09-29 (sidebar, Figma V6).*
