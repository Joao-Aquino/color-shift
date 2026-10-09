# Color Shift — Phase 1 Spec

*Status: Complete (2026-09-29)*
*Written: 2026-09-26. Revised 2026-09-29: control bar replaced by left sidebar per Figma "Controls V6" (see `roadmap.md` layout revision).*

## Goal

Prove the core loop — a random Unsplash photo yields an extracted, guaranteed-readable two-color pair, rendered full-scale as a specimen next to the photo. Everything else in the full vision (`specs-context/spec-color-shift.md`) — sliders, threshold bumping, export, APCA, light theme, DialKit, rotating fonts, mobile layout — is explicitly deferred to later phases (see `plan/roadmap.md`).

## What gets built

### 0. Dependencies installed now
- `node-vibrant`, `culori` — needed for extraction and the OKLCH lightness bump.
- `apca-w3` — installed now even though APCA scoring isn't wired up until Phase 3, so the tech stack setup happens once instead of piecemeal per phase.
- `@phosphor-icons/react` — icon source for all web UI icons, including swap, arrows, generate, export/copy/download, close, and future icon-only controls.
- `shadcn/ui` — see §6.

### 1. Photo pipeline
- On launch, fetch a buffer of 10 random landscape photos via `GET /api/photos?count=N`, proxying the Unsplash API with `UNSPLASH_ACCESS_KEY`.
- Each photo runs through `node-vibrant` client-side to extract a 6-swatch palette (Vibrant, DarkVibrant, LightVibrant, Muted, DarkMuted, LightMuted).
- A scoring step picks the best background/foreground swatch pair (contrast + vibrancy + prominence).
- Foreground is auto-bumped so every pair guarantees WCAG AA (≥4.5:1) — no photo ever produces a failing pair. The implemented generic `bumpToContrast(color, against, target)` samples OKLCH lightness and refines the best candidate (rather than using the originally proposed binary search). Phase 3's threshold bumping reuses it against arbitrary WCAG/APCA targets.
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

### 5. Sidebar — built on the atomic component architecture
Layout follows Figma "Controls V6": a left sidebar (~320px) beside the specimen and photo panels, with page padding and rounded panels. This replaces the earlier bottom control bar and its slide-up slider panel. Follow the atomic breakdown from `specs-context/spec-color-shift.md` ("Sidebar Architecture" table) now, so Phases 2–5 add components and states into this structure instead of refactoring it. Phase 1 only *uses* a subset:

- `ControlContainer` — the sidebar shell. Sections top to bottom: header (logo; theme toggle slot is empty until Phase 5), `Score`, `ColorFields`, editor region (structurally present but empty/unused so Phase 2 can drop the editor panel in without restructuring), `ControlsBar` action row, EXPORT slot (Phase 4).
- `Score` — tile with WCAG | APCA tabs, large monospace value, grade badge, and a per-grade description. Phase 1: WCAG only (no APCA tab, no tab switching, no click-to-expand threshold row — those are Phase 3). Must render all four grade states (AAA / AA / AA Large / Fail) from the start, using the Figma state components. Passing grades are never red.
- `ColorFields` — two rows, BACKGROUND and FOREGROUND: label left, monospace hex value and swatch chip right, row tinted from its color. Read-only in Phase 1; clicking opens the editor panel in Phase 2.
- `ControlsBar` — the action row, modeled as a state-driven component (`state: "default" | "export"`, more addable later). Phase 1 renders: previous, shuffle (new random photo, same as Space), swap (also `S`), next. Slots for undo (Phase 2) and fix/wrench (Phase 3) are reserved in the row order but not rendered. Full order: prev · undo · shuffle · swap · fix · next.
- `Arrows` — previous/next photo buttons at the outer ends of the action row, using Phosphor arrow icons.
- `CSButton`, `IconButton`, `Swatch` — atomic building blocks. `IconButton` renders Phosphor icons consistently across the app.
- Score values use a GSAP odometer. Hex values and color-editor readouts remain plain text; Phase 7 preserves this scope.
- **Not built in Phase 1**, added in their own phases without touching the above: editor panel (`FormatTabs`, `ColorSliders`, `ColorSlider`, readout row) and undo (Phase 2); APCA tab, `ThresholdButtons`, fix/wrench (Phase 3); `ExportPanel` and the EXPORT button (Phase 4); theme toggle (Phase 5).

### 5b. Loading and error states
- While the initial buffer loads or a photo is still extracting, show a skeleton in the specimen and photo panels; the sidebar renders disabled/neutral values.
- If `/api/photos` fails, show an inline message in the photo panel with a retry action (same as shuffle). No toast, no blocking modal.

### 5a. Data shapes
Name the shared TypeScript data shapes up front so the photo pipeline, scoring engine, controls, export, and later editing phases all use the same language:

- `Photo` — normalized Unsplash photo data used by the UI and buffer.
- `PaletteSwatch` — one extracted color candidate with metadata useful for ranking.
- `ExtractedPalette` — the set of named swatches extracted from a photo.
- `ColorPair` — selected foreground/background pair, including original and bumped values where relevant.
- `ContrastScore` — WCAG/APCA score value plus rating label.
- `ControlBarState` — current action-row mode (`default`, `export`, and future states).

### 6. Visual foundation
- Dark theme only (near-black chrome, muted text per the style guide's dark-mode spec), but expressed as semantic CSS custom property tokens from the start — e.g. `--color-chrome-bg`, `--color-chrome-border`, `--color-text-label`, `--color-text-value`, `--color-text-badge` — not hardcoded Tailwind dark-mode classes or raw hex values scattered through components. Phase 5's light theme becomes a token redefinition, not a restyle.
- Desktop layout only: sidebar + specimen + photo. Mobile responsiveness (bottom sheet) deferred to Phase 5. All numeric values (hex, score) in monospace.
- shadcn/ui gets installed and configured now (Geist/Vercel design DNA), so the sidebar components (color fields, score tile, action buttons) are built on it from the start rather than migrated later.

### 7. Figma design source
- Build from the Figma layout (file: `Color-Shift`, key `Fu0DGoLsLeY6wj7oLr5cVh`), latest iteration "Controls V6" (exported JPG; not yet linked by node). Pull exact spacing, colors, and component structure for the sidebar, specimen, and photo panels.
- **Numbers and hex values in the mockups are placeholders** (e.g. the V6 score and foreground hex do not match its own swatches). The engine is the source of truth; never copy mockup values into code or tests.
- The project-level Figma link and the exported V6 assets in `public/figma/` were used as the visual source for implementation. A node-specific V6 link would still improve future pixel-level comparison, but is no longer a Phase 1 blocker.

## Explicitly out of scope for Phase 1
- Color editing (format tabs, sliders, readout row), undo, fix/wrench, threshold bumping UI, APCA scoring/tab (`apca-w3` is installed per §0 but not wired up yet)
- EXPORT button and panel, GSAP animation polish (squish/pop, photo crossfade, score odometer, Flip)
- Light theme and theme toggle, DialKit integration, rotating specimen fonts, mobile layout
- Drag-and-drop custom photos, editable Aa text, iOS/macOS builds

## Done means
Load the app → see a real Unsplash photo with an extracted, always-AA-passing color pair rendered as a full-scale specimen → navigate photos with arrows/space → toggle Aa/circle → swap colors → see the live WCAG score update — all on a dark desktop sidebar + split-screen, built on shadcn/ui components.

## Decisions made during scoping (for context in a future session)
- Auto-bump foreground to AA: **yes**, matches original spec's engine behavior, built as a generic reusable bump function (see §1).
- Layout/theme: desktop split-screen only, dark only.
- Sidebar: built on the full atomic component architecture from the start (see §5), not a flat one-off bar — Phase 1 only activates the `default` state and the components it needs, but the structure is ready for Phases 2–4 to add into.
- Theming: dark-mode values expressed as semantic CSS custom property tokens from day one (see §6), so Phase 5's light theme is a token swap.
- `apca-w3`: installed in Phase 1 (see §0) even though unused until Phase 3, to do dependency setup once.
- Icons: use `@phosphor-icons/react` for the web UI icon system, rendered through the local `IconButton` wrapper for consistent sizing, weight, accessibility labels, and interaction states. Use `regular` weight for most controls and `fill` only for active/selected states. Standard icon sizes are 16px for compact controls, 20px for primary toolbar buttons, and 24px only for larger touch/mobile controls.
- Icon mapping: pull exact icon choices from Figma rather than preselecting specific Phosphor glyphs in the plan.
- Accessibility baseline: every icon-only button requires an accessible label, visible focus state, and a non-color-only indication for selected/active/disabled states.
- Data shapes: define shared TypeScript names up front as `Photo`, `PaletteSwatch`, `ExtractedPalette`, `ColorPair`, `ContrastScore`, and `ControlBarState` (see §5a).
- Structure: keep file organization boring and predictable (`components/control-bar/*`, `components/ui/*`, `lib/color/*`, `lib/photos/*`) unless implementation reveals a stronger local pattern.
- Keyboard shortcuts: keep Phase 1 simple with only arrows, spacebar, and `S` for swap.
- Unsplash API key: already available, read from env.
- Photographer credit: **included**.
- Specimen font: Geist Sans only (rotating fonts deferred).
- shadcn/ui: set up now, not deferred.
- Figma: use the existing initial design as the visual/layout source for Phase 1 rather than building from the style guide text alone. Correct frame-level link still needed (see Figma design source section above).
- Layout revision (2026-09-29): bottom control bar and slide-up slider panel replaced by a left sidebar (Figma V6). Component names: `Swatches` → `ColorFields`; the swap button moves from between the swatches to the action row; `ControlsBar` is now the action row.
- Phase 1 sidebar scope: score tile (WCAG, all four grade states), read-only color fields, prev/shuffle/swap/next. Undo, fix, editor, APCA, export, and theme toggle land in their own phases.
- Loading = skeleton panels; error = inline message with retry in the photo panel (§5b).
- Mockup numbers/hexes are placeholders; engine output is the source of truth.
