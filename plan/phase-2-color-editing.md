# Color Shift — Phase 2 Spec (Draft)

*Status: Draft — not yet discussed/approved in detail*
*Written: 2026-09-26*

## Goal

Turn the tool from view-only into a "nudge" instrument. Add manual color editing so any extracted pair can be adjusted by hand, in the color space that makes sense for the task.

## What gets built (proposed)

### 1. Color sliders — three modes
- **OKLCH:** L (0–100), C (0–max in-gamut chroma for current L/H), H (0–360).
- **HSB:** H (0–360), S (0–100), B (0–100).
- **RGB:** R/G/B (0–255 each).
- Toggle between modes (OKLCH / HSB / RGB buttons in the control bar).
- Slider panel opens when a swatch (bg or fg) is clicked; closes with a close button.
- Values normalized internally to 0–100 for consistent slider behavior across modes.
- OKLCH chroma slider gamut-maps via binary search (max in-gamut chroma for current L/H).

### 2. Real-time updates
- Specimen updates live while dragging, zero perceptible lag.
- No animation requirement yet beyond what Phase 1 already has — GSAP easing for slider repositioning is Phase 7.

### 3. Five-format value display
- HEX, RGB, HSL, HSB, OKLCH all viewable for the active color (extends the Phase 1 hex-only swatch display).
- Plain text updates on change — TubeText 3D animation is Phase 7.

## Open questions to resolve before building
- Does opening a slider panel replace the bottom control bar, or slide up above it (per original spec: "slides up to reveal sliders")?
- Which color's slider opens by default when a swatch is clicked — always that swatch's own color (bg swatch → bg sliders, fg swatch → fg sliders)?
- Do all 5 formats need to be simultaneously visible, or cycle-through via click (style guide suggests click-to-cycle)?

## Explicitly out of scope for Phase 2
- Threshold bumping, APCA (Phase 3)
- Export (Phase 4)
- GSAP slider easing, TubeText animation (Phase 7)

## Done means
Click a swatch → slider panel opens → drag OKLCH/HSB/RGB sliders → specimen updates live with zero lag → switch slider mode without losing the edit → see the color's value in all 5 formats.
