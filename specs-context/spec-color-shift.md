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
- **Minimal chrome.** The control bar is a single compact row at the bottom. Everything else is color and photography.
- **Buttery smooth.** GSAP animations on every interaction. Color transitions ease between states. Slider updates are instant. The specimen squishes on press and pops on release. This is a Shift Nudge product.



### Visual DNA (MDS's own work)

- **Vercel Design System (Geist): dark, clean, professional, and minimal**



### Figma File for this project

- Color shift: [https://www.figma.com/design/Fu0DGoLsLeY6wj7oLr5cVh/Color-Shift?node-id=0-1&m=dev](https://www.figma.com/design/Fu0DGoLsLeY6wj7oLr5cVh/Color-Shift?node-id=0-1&m=dev)

---



## Layout



### Split Screen (desktop)

- **Left half:** Aa specimen. Background color fills the panel. Foreground color renders "Aa" at massive scale, centered. Click/tap toggles between Aa text and a filled circle (same foreground color).
- **Right half:** Unsplash photo. Full-bleed, edge to edge. Photographer credit at bottom-left.
- **Bottom:** Control bar. Single row of compact controls on black chrome. Slides up to reveal sliders when a swatch is clicked.



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
- "Aa" rendered in the foreground color at massive scale (80px mobile, 200px desktop)
- Click toggles between Aa text and a filled circle. GSAP squish on press (scale 0.85), pop on release (scale 1.05), then the active element rotates out and the alternate rotates in with back-ease overshoot.



### 3. Photo Navigation

- Arrow keys (left/right) navigate through the photo buffer
- Spacebar injects a fresh random photo at the next position and navigates to it
- Photos crossfade with GSAP (configurable duration via CSS custom property `--photo-duration`)
- Tiny 32px placeholder loads first (pixelated), full image loads on top



### 4. Contrast Scoring (Dual Algorithm)

- **WCAG 2:** contrast ratio (e.g. "4.50:1"), grades: AAA (≥7.0), AA (≥4.5), AA Large (≥3.0), Fail
- **APCA:** Lc value (e.g. "Lc 72.3"), grades: AAA (≥75), AA (≥60), AA Large (≥45), Fail
- Toggle between algorithms with a button in the control bar
- Score component uses TubeText (3D per-character rotation animation on value change)



### 5. Threshold Bumping

- Thresholds: 1.5, 3.0, 4.5, 7.0 (WCAG) or 30, 45, 60, 75 (APCA)
- Click a threshold button to bump the active color (fg by default, bg if its slider is open) to that exact contrast level
- Binary search on OKLCH lightness to find the minimal color change that hits the target
- Active threshold (nearest to current score) is visually highlighted



### 6. Color Sliders (Three Modes)

- **OKLCH:** L (lightness 0-100), C (chroma 0-max gamut), H (hue 0-360)
- **HSB:** H (hue 0-360), S (saturation 0-100), B (brightness 0-100)
- **RGB:** R (0-255), G (0-255), B (0-255)
- Toggle between modes with OKLCH / HSB / RGB buttons. Close button collapses the panel.
- Each slider has three gradient layers (one per color space), all always rendered. Active mode at opacity 1, others at 0. CSS transition crossfades between them when switching modes.
- Slider values are normalized to 0-100 percentages internally. GSAP animates slider positions when the photo changes (power4.inOut). During manual drag, animation is killed and updates are instant.
- All sliders update the specimen in real time. Zero perceptible lag.
- OKLCH chroma slider uses binary search gamut mapping to find the maximum in-gamut chroma for the current L and H values.



### 7. Swap

- Button between bg and fg swatches in the control bar
- Flips foreground and background colors
- If sliders are open, the slider target swaps too (bg becomes fg, fg becomes bg)
- Keyboard shortcut: S



### 8. Color Format Display

- Swatch buttons show hex values with animated TubeText (3D character rotation on change)
- Export includes all five formats: HEX, RGB, HSL, HSB, OKLCH



### 9. Export

- **Copy:** copies markdown with both colors in all 5 formats + contrast score + grade + photo credit to clipboard
- **Download .MD:** planned (handler exists, not yet wired)
- Export panel slides in from the right, replacing the arrow navigation. EXPORT button is the anchor (never moves). GSAP Flip animates the WCAG/APCA button layout shift.



### 10. Dark / Light Theme

- Dark mode (default): black chrome (#000), muted text (#a39f9f), subtle borders (#2B2727)
- Light mode: planned tinting from active palette (currently functional toggle)
- Keyboard shortcut: T



### 11. DialKit Integration

- All motion parameters exposed as CSS custom properties on `:root`
- `--color-duration`, `--photo-duration`, `--photo-opacity`, `--squish-scale`, `--squish-duration`, `--pop-scale`, `--pop-duration`, `--exit-duration`, `--enter-duration`, `--enter-overshoot`
- DialKit can live-tune any of these during development or demonstration

---



## Control Bar Architecture

The control bar is a Figma-matched component system built from atomic pieces:


| Component          | What It Does                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `ControlContainer` | Orchestrates slider panel (animated slide-up) + controls bar                                             |
| `ControlsBar`      | Full toolbar: swatches, score, algorithm, arrows, export. Three animated states (default, score, export) |
| `Swatches`         | BG swatch + swap icon + FG swatch. Clicking a swatch opens its slider panel                              |
| `Score`            | Contrast pill: rating (AAA/AA/Fail) + value (ratio or Lc). Click expands threshold buttons               |
| `ThresholdButtons` | Row of contrast thresholds. Click to bump. Active threshold highlighted                                  |
| `Arrows`           | Left/right photo navigation. Hidden during export state                                                  |
| `ExportPanel`      | COPY URL + DOWNLOAD .MD buttons. Visible during export state                                             |
| `CSButton`         | Atomic button with optional swatch chip + TubeText label                                                 |
| `TubeText`         | 3D per-character rotation animation using GSAP SplitText                                                 |
| `ColorMode`        | OKLCH / HSB / RGB toggle row with optional CLOSE button                                                  |
| `ColorSliders`     | Three gradient-tracked sliders, one per channel                                                          |
| `ColorSlider`      | Single slider with triple gradient layers (crossfade on mode change)                                     |
| `Swatch`           | 12x12 color chip with adaptive inner border (white for dark colors, black for light)                     |
| `IconButton`       | Wrapper for icon-only interactive elements                                                               |


**State transitions** between default/score/export use GSAP with ease-out-quint curves. Exit animations (150ms) run faster than entrance animations (200ms). Only transform + opacity are animated (GPU-composited).

---



## Tech Stack (Web)


| Package                  | Job                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `next` 16.2.1            | App framework                                                                       |
| `react` 19.2.4           | UI                                                                                  |
| `tailwindcss` v4         | Styling                                                                             |
| `culori`                 | OKLCH/HSB/RGB color engine (perceptually uniform conversions, gamut mapping)        |
| `apca-w3`                | APCA contrast algorithm (Lc values)                                                 |
| `gsap` + `@gsap/react`   | All animations: color transitions, slider easing, TubeText, Flip layout, squish/pop |
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
| Photo drag-and-drop (web + macOS) | Planned        | Hidden feature: drop an image onto the photo area to extract colors from your own photo. Discoverable, not labeled. |
| Camera / photo capture (iOS)      | Planned        | Alternate input to Unsplash: take a photo, extract colors from your own image                                       |
| Download .MD button               | Handler exists | Not yet wired to file download                                                                                      |
| Editable Aa text                  | Considered     | Type custom text to test real content                                                                               |
| Tile/grid photo transitions       | Researched     | 9 animation patterns documented in `transitions.md`                                                                 |
| Responsive mobile layout          | Planned        |                                                                                                                     |
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
| GSAP animations           | Timeline sequencing, Flip layout, SplitText, spring physics |
| DialKit integration       | CSS custom properties as a design-engineering workflow      |
| TubeText component        | 3D CSS transforms, per-character animation                  |
| Figma-matched components  | Translating a design system into atomic React components    |
| Control bar state machine | GSAP-driven UI state transitions (default/score/export)     |
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
| GSAP over CSS animations                 | 2026-03 | Complex choreography (Flip layout, SplitText, timeline sequencing) needs a real animation library.      |
| Three slider modes (OKLCH/HSB/RGB)       | 2026-03 | Designers think in HSB. Code uses RGB. Modern CSS uses OKLCH. Show all three, explain why OKLCH wins.   |
| TubeText (3D character rotation)         | 2026-03 | Values change constantly. Smooth per-character animation makes it feel alive, not flickering.           |
| 20 rotating specimen fonts               | 2026-03 | Each photo gets a different typeface. Keeps the experience fresh. Only Aa glyphs loaded (~1-2KB each).  |
| DialKit CSS custom properties            | 2026-03 | Demonstrates the designer's fine-tuning workflow. Students see animation parameters they can touch.     |
| Aa ↔ Circle toggle on specimen           | 2026-03 | Shows the color relationship as both typography and pure form. The interaction itself teaches contrast. |


---

*Spec rewritten: 2026-03-28 (from codebase, replaces 2026-03-25 original)*