# Color Shift — Phase 4 Spec (Draft)

*Status: Draft — layout decisions closed 2026-09-29 (Figma "Controls V6"); detail otherwise not yet approved*
*Written: 2026-09-26. Revised 2026-09-29 for the sidebar layout.*

## Goal

Let people take a color pair out of the tool. Self-contained, low risk, no dependency on animation work — could be pulled earlier in the roadmap if desired.

## What gets built

### 1. Copy to clipboard
- Copies markdown containing: both colors in all 5 formats (HEX, RGB, HSL, HSB, OKLCH), the active contrast score + grade, and photo credit.
- Clipboard API, no download involved.

### 2. Download .md
- Same content as copy, written to a downloadable `.md` file.
- Original spec notes "handler exists, not yet wired" — if any of that scaffolding survives, reuse it rather than rebuilding.

### 3. Export state
- The full-width EXPORT button sits at the bottom of the sidebar (added in this phase).
- Clicking it switches `ControlsBar` to the `export` state: the action row is replaced by COPY and DOWNLOAD .MD actions. EXPORT stays in place as the anchor.
- Plain show/hide for now — GSAP Flip for the layout shift is Phase 7.
- Export replaces the earlier per-field copy icons idea; the color rows have no copy buttons.

## Explicitly out of scope for Phase 4
- GSAP Flip transition into/out of export state (Phase 7)
- Any additional export formats beyond markdown

## Done means
Click EXPORT → action row is replaced by COPY / DOWNLOAD .MD → COPY puts full markdown (colors, formats, score, credit) on the clipboard → DOWNLOAD .MD saves the same content as a file → clicking EXPORT again returns the action row.
