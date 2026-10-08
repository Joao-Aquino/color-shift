# Color Shift — Phase 2 Spec

*Status: Complete (2026-09-29)*
*Written: 2026-09-26. Revised 2026-09-29 for the sidebar layout.*

*Figma source: [`Color-Shift`, editor frame `3359:1654`](https://www.figma.com/design/Fu0DGoLsLeY6wj7oLr5cVh/Color-Shift?node-id=3359-1654&m=dev).*

## Goal

Turn the tool from view-only into a "nudge" instrument. Add manual color editing so any extracted pair can be adjusted by hand, in the color space that makes sense for the task.

## What gets built

### 1. Editor panel (in the sidebar)
- Clicking the BACKGROUND or FOREGROUND row opens the editor panel for that color, in the editor region Phase 1 reserved. Clicking the other row switches the panel to that color.
- Closes on click outside the panel or `Esc`. No close button. Focus returns to the row that opened it.
- No 2D picker square and no alpha slider. Per-channel sliders only.

### 2. Format tabs drive the sliders
Five tabs: HEX · RGB · HSL · HSB · OKLCH. The active tab sets both the slider set and the readout row.

| Tab | Sliders |
|---|---|
| HEX | R / G / B (hex is RGB encoded) |
| RGB | R / G / B (0–255) |
| HSL | H / S / L |
| HSB | H / S / B (0–100 for S and B, 0–360 for H) |
| OKLCH | L (0–100) / C (0–max in-gamut for current L/H) / H (0–360) |

- Each slider has a gradient track for its channel at the current values of the other channels (e.g. Brightness runs black → full-brightness color at current H and S). Tracks crossfade when the tab changes.
- Each slider shows an editable numeric value at its right end.
- Switching tabs never loses the edit; values convert through the OKLCH engine.
- OKLCH chroma gamut-maps via binary search (max in-gamut chroma for current L/H).

### 3. Readout row
- Below the sliders: a monospace row showing the active color in the active tab's format. Editable; paste any valid color format, auto-detect and convert.
- If the entered value is invalid, preserve the last valid color and show an inline error on the field.
- The color field row above (hex) always updates live.

### 4. Real-time updates
- Specimen and score update live while dragging, zero perceptible lag.
- No animation requirement beyond Phase 1 — GSAP slider easing is Phase 7.

### 5. Undo
- Undo button in the action row (slot reserved in Phase 1). History stack of color edits for the current photo; resets when the photo changes.
- A complete slider gesture creates exactly one history entry, regardless of how many intermediate values it emits while dragging.
- Shortcut: `Cmd/Ctrl+Z`. Disabled (with a non-color-only cue) when the stack is empty.
- Phase 3's fix/wrench and threshold bumps push onto the same stack.

## Explicitly out of scope for Phase 2
- Alpha / transparency (not in the product; contrast against transparency is undefined)
- Threshold bumping, fix/wrench, APCA (Phase 3)
- Export (Phase 4)
- GSAP easing for programmatic slider updates (Phase 7); editor values remain unanimated

## Done means
Click a color row → editor panel opens → switch tabs and drag sliders → specimen and score update live with zero lag → edit the value in the readout row → undo steps back → click outside or `Esc` closes the panel.
