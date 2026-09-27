# Color Shift — Phase 1 Spec

*Status: Approved, not yet started*
*Written: 2026-09-26*

## Goal

Prove the core loop — a random Unsplash photo yields an extracted, guaranteed-readable two-color pair, rendered full-scale as a specimen next to the photo. Everything else in the full vision (`specs-context/spec-color-shift.md`) — sliders, threshold bumping, export, APCA, light theme, DialKit, rotating fonts, mobile layout — is explicitly deferred to later phases (see `plan/roadmap.md`).

## What gets built

### 1. Photo pipeline
- On launch, fetch a buffer of 10 random landscape photos via `GET /api/photos?count=N`, proxying the Unsplash API with `UNSPLASH_ACCESS_KEY`.
- Each photo runs through `node-vibrant` client-side to extract a 6-swatch palette (Vibrant, DarkVibrant, LightVibrant, Muted, DarkMuted, LightMuted).
- A scoring step picks the best background/foreground swatch pair (contrast + vibrancy + prominence).
- Foreground is auto-bumped (OKLCH lightness adjustment) so every pair guarantees WCAG AA (≥4.5:1) — no photo ever produces a failing pair.
- Buffer refills automatically once you're within 3 photos of the end, always keeping 10 ahead.

### 2. Specimen (left half, desktop split-screen)
- Background color fills the panel edge-to-edge, no radius/border/padding.
- "Aa" renders centered at large scale in the foreground color, set in Geist Sans.
- Click toggles between "Aa" text and a filled circle (same foreground color). Plain CSS transition for the swap — no GSAP polish yet.

### 3. Photo (right half, desktop split-screen)
- Full-bleed Unsplash photo.
- Photographer credit, bottom-left, linking out (satisfies Unsplash attribution requirements).

### 4. Navigation
- Left/Right arrow keys move through the 10-photo buffer.
- Spacebar injects a fresh random photo and navigates to it.
- Instant/CSS-transition swap between photos — no crossfade animation yet.

### 5. Bottom control bar (minimal)
- BG hex swatch, swap icon, FG hex swatch.
- Swap button flips foreground/background (also bound to the `S` key).
- WCAG contrast score pill: ratio (e.g. "4.50:1") + grade (AAA/AA/Fail). APCA is not included yet — WCAG only.
- No sliders, no threshold bumping, no export panel in this phase.

### 6. Visual foundation
- Dark theme only (near-black chrome, muted text per the style guide's dark-mode spec). Light theme deferred.
- Desktop split-screen layout only. Mobile responsiveness deferred.
- shadcn/ui gets installed and configured now (Geist/Vercel design DNA), so the control bar components (swatches, score pill, swap button) are built on it from the start rather than migrated later.

### 7. Figma design source
- Build directly from the existing Figma layout (file: `Color-Shift`, key `Fu0DGoLsLeY6wj7oLr5cVh`) instead of freehand-interpreting the style guide — pull exact spacing, colors, and component structure for the split-screen + control bar from the design.
- **Blocker to resolve before implementation:** the link recorded in `specs-context/spec-color-shift.md` (`node-id=0-1`) resolves only to a "Thumbnail" cover frame (900×540, a single placeholder image), not the actual UI frame. Need a node-specific link to the real Phase 1 screen (split-screen + control bar frame) before design context can be pulled.

## Explicitly out of scope for Phase 1
- Color sliders (OKLCH/HSB/RGB), threshold bumping, APCA algorithm/toggle
- Export (copy/download), GSAP animation polish (squish/pop/crossfade/TubeText/Flip)
- Light theme, DialKit integration, rotating specimen fonts, mobile layout
- Drag-and-drop custom photos, editable Aa text, iOS/macOS builds

## Done means
Load the app → see a real Unsplash photo with an extracted, always-AA-passing color pair rendered as a full-scale specimen → navigate photos with arrows/space → toggle Aa/circle → swap colors → see the live WCAG score update — all on a dark desktop split-screen, built on shadcn/ui components.

## Decisions made during scoping (for context in a future session)
- Auto-bump foreground to AA: **yes**, matches original spec's engine behavior.
- Layout/theme: desktop split-screen only, dark only.
- Control bar: minimal (swatches + score pill) **plus** swap button.
- Unsplash API key: already available, read from env.
- Photographer credit: **included**.
- Specimen font: Geist Sans only (rotating fonts deferred).
- shadcn/ui: set up now, not deferred.
- Figma: use the existing initial design as the visual/layout source for Phase 1 rather than building from the style guide text alone. Correct frame-level link still needed (see Figma design source section above).
