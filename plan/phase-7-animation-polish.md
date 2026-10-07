# Color Shift — Phase 7 Spec (Draft)

*Status: Draft — not yet discussed/approved in detail*
*Written: 2026-09-26. Moved from Phase 5 to Phase 7 (last of the web-feature phases) on 2026-09-27.*

## Goal

Layer GSAP-driven motion polish onto the now-feature-complete tool (Phases 1–6), matching the "buttery smooth... this is a Shift Nudge product" design philosophy. Deliberately sequenced last among all the web-feature phases (after Color Editing, Dual Scoring, Export, Theming/Responsive, and personal photo/text input) so animation isn't fought for while the underlying interactions are still changing shape.

## Animation skill requirement

Use the animation skills installed from [emilkowalski/skills](https://github.com/emilkowalski/skills) when implementing this phase, rather than freehand GSAP:
- **`animate`** — for building each new animation from scratch (specimen squish/pop, photo crossfade, sidebar state transitions, slider easing): the ordered decisions (should it animate, which properties, which curve/duration, how it interrupts, how it exits) apply on top of the GSAP tool choice already locked in by the original spec's Design Decisions Log.
- **`emil-design-eng`** — overall polish philosophy governing this phase's feel.
- **`animation-vocabulary`** — reference for naming/discussing specific effects (e.g. confirming what "back-ease overshoot" or "rubber-band" style effects are actually called) when refining the spec further.
- **`find-animation-opportunities`** / **`improve-animations`** — run once this phase's first pass is in, to catch anything in Phases 1–6 that should animate but doesn't, or to audit/prioritize fixes across the whole motion system.
- GSAP remains the execution tool per the original spec's decision ("GSAP over CSS animations... complex choreography needs a real animation library") — these skills inform *how* to use it well, they don't replace it.

## What gets built (proposed)

### 1. Specimen micro-interactions
- Squish on press (scale 0.85), pop on release (scale 1.05).
- Active element (Aa or circle) rotates out, alternate rotates in with back-ease overshoot.

### 2. Photo transitions
- Crossfade between photos on navigation (configurable duration via `--photo-duration` CSS custom property).
- Tiny 32px placeholder loads first (pixelated), full image loads on top.

### 3. TubeText
- 3D per-character rotation animation (GSAP SplitText) on any changing numeric/text value: hex swatches, score value, slider numbers.

### 4. Sidebar state transitions
- GSAP Flip animation for layout shifts: action row ↔ export state, score tile ↔ expanded threshold row, and editor panel open/close (including switching between the BG and FG editor).
- Ease-out-quint curves; exit animations (150ms) faster than entrance (200ms); only transform + opacity animated (GPU-composited).

### 5. Slider easing
- GSAP animates slider handle position when the underlying color changes programmatically (e.g. photo navigation, threshold bump) — power4.inOut.
- Manual drag kills any running animation and updates instantly (no fighting the user's input).

### 6. DialKit integration
- All motion parameters exposed as CSS custom properties on `:root`: `--color-duration`, `--photo-duration`, `--photo-opacity`, `--squish-scale`, `--squish-duration`, `--pop-scale`, `--pop-duration`, `--exit-duration`, `--enter-duration`, `--enter-overshoot`.
- DialKit live-tunes these during development/demonstration.

## Explicitly out of scope for Phase 7
- Any new interactive features — this phase only adds motion to what Phases 1–6 already built.

## Done means
Every interaction (specimen toggle, photo nav, value changes, sidebar state changes, slider updates) has the GSAP-driven motion described in the original spec, and every motion parameter is DialKit-tunable via CSS custom properties.
