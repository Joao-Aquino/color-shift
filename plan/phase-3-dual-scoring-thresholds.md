# Color Shift — Phase 3 Spec (Draft)

*Status: Draft — not yet discussed/approved in detail*
*Written: 2026-09-26*

## Goal

Add the second contrast algorithm (APCA) and threshold bumping, building on Phase 2's slider/lightness-adjustment machinery.

## What gets built (proposed)

### 1. Dual contrast algorithm
- **WCAG 2** (from Phase 1): ratio (e.g. "4.50:1"), grades AAA (≥7.0) / AA (≥4.5) / AA Large (≥3.0) / Fail.
- **APCA** (new): Lc value (e.g. "Lc 72.3"), grades AAA (≥75) / AA (≥60) / AA Large (≥45) / Fail.
- Toggle button in the control bar switches the active algorithm; score pill and thresholds update accordingly.

### 2. Threshold bumping
- Thresholds: 1.5 / 3.0 / 4.5 / 7.0 (WCAG) or 30 / 45 / 60 / 75 (APCA).
- Click a threshold button to bump the active color (fg by default, bg if its slider panel is open) to that exact contrast level.
- Binary search on OKLCH lightness to find the minimal change that hits the target — reuses the gamut/lightness logic introduced for sliders in Phase 2.
- Active threshold (nearest to current score) is visually highlighted.
- Score pill click expands to show the threshold row (per original control-bar spec: `Score` component).

## Explicitly out of scope for Phase 3
- Export (Phase 4)
- Animation polish for threshold/score transitions (Phase 7)

## Done means
Toggle between WCAG and APCA and see the score pill + thresholds update → click a threshold → active color snaps to that exact contrast level via minimal lightness change → active threshold stays highlighted as sliders move.
