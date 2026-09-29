# Color Shift — Phase 3 Spec (Draft)

*Status: Draft — layout decisions closed 2026-09-29 (Figma "Controls V6"); detail otherwise not yet approved*
*Written: 2026-09-26. Revised 2026-09-29 for the sidebar layout.*

## Goal

Add the second contrast algorithm (APCA), threshold bumping, and the fix (wrench) action, building on Phase 2's editing machinery and Phase 1's generic `bumpToContrast`.

## What gets built

### 1. Dual contrast algorithm
- **WCAG 2** (from Phase 1): ratio (e.g. "4.50"), grades AAA (≥7.0) / AA (≥4.5) / AA Large (≥3.0) / Fail.
- **APCA** (new): Lc value, grades AAA (≥75) / AA (≥60) / AA Large (≥45) / Fail.
- The WCAG | APCA tabs in the score tile switch the active algorithm. Score value, badge, description, and thresholds update accordingly. All four grade states are rendered for both algorithms (Figma state components).

### 2. Threshold bumping
- Thresholds: 1.5 / 3.0 / 4.5 / 7.0 (WCAG) or 30 / 45 / 60 / 75 (APCA).
- Clicking the score tile expands a threshold row inside it (the `Score` + `ThresholdButtons` design from the original spec).
- Click a threshold to bump the active color — the color whose editor panel is open, otherwise the foreground — to that exact contrast level.
- Binary search on OKLCH lightness for the minimal change, via the existing `bumpToContrast`.
- Active threshold (nearest to current score) is highlighted. The selected threshold is also the fix action's target (see §3).

### 3. Fix (wrench)
- Wrench button in the action row (slot reserved in Phase 1). Purpose: after the user has played with the colors, snap to the closest color that still passes.
- Target: the selected threshold, defaulting to AA (4.5 WCAG / 60 APCA) if none is selected. Applies to the open editor's color, otherwise the foreground. Uses `bumpToContrast`, so the change is the minimal lightness shift.
- Tooltip and aria-label ("Fix contrast" or similar). Pushes onto Phase 2's undo stack so it can be reversed.

## Explicitly out of scope for Phase 3
- Export (Phase 4)
- Animation polish for threshold/score transitions (Phase 7)

## Done means
Switch between WCAG and APCA tabs and see the score, badge, and thresholds update → expand the threshold row and click one → the active color snaps to that exact contrast via minimal lightness change → edit with sliders, press the wrench, and get the closest passing color → undo reverses it.
