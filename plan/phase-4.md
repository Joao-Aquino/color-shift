# Color Shift — Phase 4 Spec (Draft)

*Status: Draft — not yet discussed/approved in detail*
*Written: 2026-09-26*

## Goal

Let people take a color pair out of the tool. Self-contained, low risk, no dependency on animation work — could be pulled earlier in the roadmap if desired.

## What gets built (proposed)

### 1. Copy to clipboard
- Copies markdown containing: both colors in all 5 formats (HEX, RGB, HSL, HSB, OKLCH), the active contrast score + grade, and photo credit.
- Clipboard API, no download involved.

### 2. Download .md
- Same content as copy, written to a downloadable `.md` file.
- Original spec notes "handler exists, not yet wired" — if any of that scaffolding survives into this phase's starting codebase, reuse it rather than rebuilding.

### 3. Export panel
- Slides in from the right, replacing the arrow navigation area. EXPORT button is the anchor (stays in place).
- Contains COPY and DOWNLOAD .MD actions.
- Plain show/hide for now — GSAP Flip animation for the WCAG/APCA button layout shift during export state is Phase 5.

## Explicitly out of scope for Phase 4
- GSAP Flip transition into/out of export state (Phase 5)
- Any additional export formats beyond markdown

## Done means
Click EXPORT → panel replaces arrow navigation → COPY puts full markdown (colors, formats, score, credit) on the clipboard → DOWNLOAD .MD saves the same content as a file.
