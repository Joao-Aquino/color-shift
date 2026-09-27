# Color Shift — Phase 1 Spec

*Status: Approved, not yet started*
*Written: 2026-09-26*

## Goal

Prove the core loop — a random Unsplash photo yields an extracted, guaranteed-readable two-color pair, rendered full-scale as a specimen next to the photo. Everything else in the full vision (`specs-context/spec-color-shift.md`) — sliders, threshold bumping, export, APCA, light theme, DialKit, rotating fonts, mobile layout — is explicitly deferred to later phases (see `plan/roadmap.md`).

## What gets built

### 0. Dependencies installed now
- `node-vibrant`, `culori` — needed for extraction and the OKLCH lightness bump.
- `apca-w3` — installed now even though APCA scoring isn't wired up until Phase 3, so the tech stack setup happens once instead of piecemeal per phase.
- `shadcn/ui` — see §6.

### 1. Photo pipeline
- On launch, fetch a buffer of 10 random landscape photos via `GET /api/photos?count=N`, proxying the Unsplash API with `UNSPLASH_ACCESS_KEY`.
- Each photo runs through `node-vibrant` client-side to extract a 6-swatch palette (Vibrant, DarkVibrant, LightVibrant, Muted, DarkMuted, LightMuted).
- A scoring step picks the best background/foreground swatch pair (contrast + vibrancy + prominence).
- Foreground is auto-bumped so every pair guarantees WCAG AA (≥4.5:1) — no photo ever produces a failing pair. Build the bump as a generic `bumpToContrast(color, against, target)` binary-search-on-OKLCH-lightness function (not hardcoded to 4.5) — Phase 3's threshold bumping reuses this exact function against arbitrary WCAG/APCA targets instead of reimplementing it.
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

### 5. Control bar — built on the atomic component architecture
Follow the atomic breakdown from `specs-context/spec-color-shift.md` ("Control Bar Architecture" table) now, so Phases 2–4 add components and states into this structure instead of refactoring it. Phase 1 only *uses* a subset of the states/components; the rest are added later without touching what Phase 1 built:

- `ControlContainer` — orchestrates the slider-panel slide-up region + `ControlsBar`. The slide-up region exists structurally now (empty/unused) so Phase 2 can drop slider content into it without restructuring the container.
- `ControlsBar` — modeled as a state-driven component (`state: "default" | "score" | "export"`, more states addable later). Phase 1 implements and uses only the `default` state.
- `Swatches` — BG swatch + swap icon + FG swatch (functional). Swap button flips foreground/background (also bound to the `S` key).
- `Score` — contrast pill: rating + ratio (e.g. "AA · 4.50:1"). WCAG only in Phase 1 — no algorithm toggle, no click-to-expand threshold row (that's Phase 3's `ThresholdButtons`, added into this same component later).
- `Arrows` — left/right photo navigation (functional).
- `CSButton`, `IconButton`, `Swatch` — atomic building blocks used by the components above.
- `TubeText` — used now for the hex/score text, but rendered as plain text (no animation). Phase 7 swaps in the 3D-rotation implementation behind the same interface — call sites don't change.
- **Not built in Phase 1**, added in their own phases without touching the above: `ThresholdButtons` (Phase 3), `ExportPanel` (Phase 4), `ColorMode` / `ColorSliders` / `ColorSlider` (Phase 2).

### 6. Visual foundation
- Dark theme only (near-black chrome, muted text per the style guide's dark-mode spec), but expressed as semantic CSS custom property tokens from the start — e.g. `--color-chrome-bg`, `--color-chrome-border`, `--color-text-label`, `--color-text-value`, `--color-text-badge` — not hardcoded Tailwind dark-mode classes or raw hex values scattered through components. Phase 5's light theme becomes a token redefinition, not a restyle.
- Desktop split-screen layout only. Mobile responsiveness deferred.
- shadcn/ui gets installed and configured now (Geist/Vercel design DNA), so the control bar components (swatches, score pill, swap button) are built on it from the start rather than migrated later.

### 7. Figma design source
- Build directly from the existing Figma layout (file: `Color-Shift`, key `Fu0DGoLsLeY6wj7oLr5cVh`) instead of freehand-interpreting the style guide — pull exact spacing, colors, and component structure for the split-screen + control bar from the design.
- **Blocker to resolve before implementation:** the link recorded in `specs-context/spec-color-shift.md` (`node-id=0-1`) resolves only to a "Thumbnail" cover frame (900×540, a single placeholder image), not the actual UI frame. Need a node-specific link to the real Phase 1 screen (split-screen + control bar frame) before design context can be pulled.

## Explicitly out of scope for Phase 1
- Color sliders (OKLCH/HSB/RGB), threshold bumping UI, APCA scoring/toggle (`apca-w3` is installed per §0 but not wired up yet)
- Export (copy/download), GSAP animation polish (squish/pop/crossfade/TubeText/Flip)
- Light theme, DialKit integration, rotating specimen fonts, mobile layout
- Drag-and-drop custom photos, editable Aa text, iOS/macOS builds

## Done means
Load the app → see a real Unsplash photo with an extracted, always-AA-passing color pair rendered as a full-scale specimen → navigate photos with arrows/space → toggle Aa/circle → swap colors → see the live WCAG score update — all on a dark desktop split-screen, built on shadcn/ui components.

## Decisions made during scoping (for context in a future session)
- Auto-bump foreground to AA: **yes**, matches original spec's engine behavior, built as a generic reusable bump function (see §1).
- Layout/theme: desktop split-screen only, dark only.
- Control bar: built on the full atomic component architecture from the start (see §5), not a flat one-off bar — Phase 1 only activates the `default` state and the components it needs, but the structure is ready for Phases 2–4 to add into.
- Theming: dark-mode values expressed as semantic CSS custom property tokens from day one (see §6), so Phase 5's light theme is a token swap.
- `apca-w3`: installed in Phase 1 (see §0) even though unused until Phase 3, to do dependency setup once.
- Unsplash API key: already available, read from env.
- Photographer credit: **included**.
- Specimen font: Geist Sans only (rotating fonts deferred).
- shadcn/ui: set up now, not deferred.
- Figma: use the existing initial design as the visual/layout source for Phase 1 rather than building from the style guide text alone. Correct frame-level link still needed (see Figma design source section above).
