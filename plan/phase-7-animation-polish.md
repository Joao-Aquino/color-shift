# Color Shift — Phase 7 Spec

*Status: Implemented / browser-verified (2026-10-07)*
*Written: 2026-09-26. Moved from Phase 5 to Phase 7 (last of the web-feature phases) on 2026-09-27.*

## Goal

Layer GSAP-driven motion polish onto the now-feature-complete tool (Phases 1–6), matching the "buttery smooth... this is a Shift Nudge product" design philosophy. Deliberately sequenced last among all the web-feature phases (after Color Editing, Dual Scoring, Export, Theming/Responsive, and personal photo/text input) so animation isn't fought for while the underlying interactions are still changing shape.

## Animation skill requirement

Use the animation skills installed from [emilkowalski/skills](https://github.com/emilkowalski/skills) when implementing this phase, rather than freehand GSAP:
- **`animate`** — for building each new animation from scratch (photo crossfade, export state transitions, slider easing): the ordered decisions (should it animate, which properties, which curve/duration, how it interrupts, how it exits) apply on top of the GSAP tool choice already locked in by the original spec's Design Decisions Log.
- **`emil-design-eng`** — overall polish philosophy governing this phase's feel.
- **`animation-vocabulary`** — reference for naming/discussing specific effects (e.g. confirming what "back-ease overshoot" or "rubber-band" style effects are actually called) when refining the spec further.
- **`find-animation-opportunities`** / **`improve-animations`** — run once this phase's first pass is in, to catch anything in Phases 1–6 that should animate but doesn't, or to audit/prioritize fixes across the whole motion system.
- GSAP remains the execution tool per the original spec's decision ("GSAP over CSS animations... complex choreography needs a real animation library") — these skills inform *how* to use it well, they don't replace it.

## What gets built

### 1. Direct specimen editing
- Click the specimen text to edit it directly; only the native text caret appears.
- No separate edit button or Aa/circle toggle. Text persists through photo navigation.
- Font size automatically fits the available width and height, with plain-text input capped at 120 characters.

### 2. Photo transitions
- Crossfade between photos on navigation (configurable duration via `--photo-duration` CSS custom property).
- Tiny 32px placeholder loads first (pixelated), full image loads on top.

### 3. Score numerals
- Keep the existing GSAP odometer animation on the WCAG and APCA score values. Tune or refine it only as needed for this phase's motion polish.
- Hex values, color-editor readouts, and slider numbers remain plain text. Do not add TubeText or SplitText animation to them.

### 4. Sidebar state transitions
- GSAP Flip animates EXPORT ↔ COPY/DOWNLOAD in the existing export slot.
- Exit 150ms, entrance 200ms, ease-out-quint.
- Score threshold expansion and ColorField opening, switching and closing animate real box dimensions with easeOutQuart (power3.out), following the merged real-resize update (#9). DialKit States → Easing selects the curve for both. Mobile reveal follows animation frames and respects footer geometry and manual scrolling.

### 5. Slider easing
- GSAP animates slider handle position when the underlying color changes programmatically (e.g. photo navigation, threshold bump) — power4.inOut.
- Manual drag kills any running animation and updates instantly (no fighting the user's input).

### 6. DialKit integration
- All motion parameters exposed as CSS custom properties on `:root`: `--color-duration`, `--photo-duration`, `--photo-opacity`, `--theme-wipe-duration`, `--exit-duration`, `--enter-duration`, `--sidebar-easing`, `--score-description-duration`.
- DialKit live-tunes these during development/demonstration.
- Removed specimen squish/pop controls. Sidebar box resizing uses a shared easing selector.

## Explicitly out of scope for Phase 7
- Features beyond the explicitly approved browser-review and final-polish requests documented below.

## Done means
Photo navigation, WCAG/APCA numerals, export states and programmatic slider changes have the agreed motion. Score/ColorField layout uses tunable box resizing; specimen typing is immediate. Remaining motion parameters are DialKit-tunable in development.

## Current implementation (browser review, 2026-10-07)

- Specimen is a persistent transparent textarea with native caret, no border/outline/background, mirrored text measurement and automatic font fitting. Escape blurs it; custom text persists through photo navigation/imports. Removed the Aa/circle toggle and separate Edit text button.
- Sidebar dimensions and delayed presence for Score and ColorFields use easeOutQuart; glyphs and borders are not scaled. Color/border transitions remain. Mobile reveal follows layout-motion frames and cancels on manual touch/wheel gestures or editor input focus.
- Photo layers retain the previous blend under a pixelated tiny placeholder until the next photo is ready. Incoming layers crossfade over 200ms and interrupted layers are cleaned up.
- Export retains interruptible Flip enter/exit motion and inert decorative exit copies, with cleanup for resize, reduced motion and unmount.
- Slider thumb easing uses `power4.inOut` over 200ms for programmatic changes; manual pointer/keyboard/typed changes remain immediate.
- Light panel actions follow resolved Figma tokens at `3404:1738`: #F2F2F2 background, #EBEBEB border, #171717 icons. EXPORT at `3404:1737` explicitly retains #1A1A1A / #2E2E2E / #EDEDED in both themes.
- Development DialKit exposes motion timing, States → Easing for ColorFields/score, and the score numeral timing panel. Specimen controls remain removed.

### Review history

The initial Phase 7 implementation included specimen squish/pop and Aa/circle rotation plus sidebar Flip. The first review replaced ColorField scaling with box resizing; a later review exposed a 0–1 resize intensity control in DialKit. The browser review initially made score and ColorFields immediate and changed specimen click to direct editing. The subsequent review restores scale on both sidebar components with easeInOutQuart and a development DialKit easing selector.

### Verification

Lint, TypeScript and webpack production build pass. Chrome covers direct text editing/caret/font fit, photo transitions, ColorField/score resize states, Figma Light colors, export cleanup, local-photo import/navigation/export, responsive layouts and mobile reveal. Physical-device feel has not been rechecked for this phase.

### Theme transition revisions (2026-10-07)

The first supplied 21st.dev animation used a vertical curtain with 550ms fall/rise stages. After validation, the user requested that version be saved separately for reuse. Its complete implementation and browser suite are archived locally in **`codex/theme-curtain`**, commit **`4ac7b422a326`**, including `components/ui/curtain-theme-toggle.tsx` and `tests/theme-curtain.browser.cjs`.

The active implementation uses the second supplied animation: `components/ui/theme-wipe-toggle.tsx` reveals the new theme horizontally with the native View Transition API. Dark reveals left → right; Light reveals right → left. Duration is 700ms and the supplied ease-in-out curve. The existing Light/Dark pills and persisted theme state remain the controls. Snapshot styles disable the browser's default fade/blending; a synchronous theme event lets React finish updating selected controls before capture.

Development DialKit exposes **Theme Wipe → Duration Ms** through `--theme-wipe-duration`. Rapid requests invalidate skipped snapshot callbacks and cancel earlier animations. Keyboard activation/T shares the pointer wipe; reduced motion and unavailable APIs switch immediately; resize, visibility and storage changes clean up pending snapshots. No extra icon or animation dependencies are needed for the existing controls.

## Final specimen caret / motion sweep (2026-10-08)

The editing caret follows Figma `3416:366`: first activation/focus starts at the
end, subsequent selection remains native, and a foreground-colored decorative
caret uses 14/240 width and 202/240 height relative to the fitted font. Native
composition/forced-colors fallback and a stationary reduced-motion caret are
included. See [final motion review](phase-7-motion-review.md) for measured
validation and separate animation proposals.

## Description wrapping and shortcut parity (2026-10-08)

The score description measures its natural text height and animates one/two-line
changes over 200ms without glyph scaling. Interrupted changes resume from the
rendered height, emit mobile-reveal frames, and settle immediately under reduced
motion. DialKit exposes Score Description → Duration Ms; easing uses States.

Per the user’s explicit request, action shortcuts share pointer animations.
Theme T/Enter/Space now triggers the same wipe, including T with a theme button
focused. Text-input protection remains; key repeats do not continuously toggle
the theme. Both theme pills expose a Toggle theme T tooltip. See the complete
[shortcut reference](../specs-context/keyboard-shortcuts.md).

## Shortcut tooltip design (2026-10-08)

Figma `3396:988` defines the shared boxed shortcut treatment. Theme and action tooltips render the key separately from the label, with a 1px border, 4px radius and 2px padding. Shortcut typography remains Geist 13px/16px. Command/Control and arrow icons use Phosphor at 16px; the undo modifier adapts to the platform and shares one box with Z. Dark label-to-box spacing is 4px; Light is 8px. Existing accessible button names and tooltip arrows remain. Fix contrast shows F; Export shows Command/Control + S. Both shortcuts call the same action and motion paths as clicking, ignore repeats, and respect unavailable state. F remains a typed character in editors; modified S opens export while preserving the text and focuses COPY.
