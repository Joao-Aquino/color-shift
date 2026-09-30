# Color Shift — Phase 4 Spec

*Status: Approved — 2026-09-29*
*Written: 2026-09-26. Revised 2026-09-29 for the sidebar layout, approved export contract, and component-scoped motion.*

## Goal

Let people take a color pair out of the tool. Self-contained, low risk, no dependency on animation work — could be pulled earlier in the roadmap if desired.

## What gets built

### 1. Copy to clipboard
- Copies markdown containing: both colors in all 5 formats (HEX, RGB, HSL, HSB, OKLCH), WCAG and APCA scores with grades, and photo credit with link.
- Clipboard API, no download involved.
- After a successful copy, the action changes from COPY to COPIED with a check icon for 1.5 seconds without changing button dimensions.

### 2. Download .md
- Same content as copy, written to a downloadable `.md` file.
- Filename: `color-shift-<background-hex>-<foreground-hex>.md`, using uppercase six-digit hex values without `#`.
- Original spec notes "handler exists, not yet wired" — if any of that scaffolding survives, reuse it rather than rebuilding.

### 3. Export state
- The full-width EXPORT button sits at the bottom of the sidebar (added in this phase).
- Clicking it prepares the payload, then replaces the EXPORT button itself with COPY and DOWNLOAD .MD actions in the same 48 px slot.
- The six-button photo control row remains unchanged and visible in every export state.
- Plain show/hide for now — GSAP Flip for the layout shift is Phase 7.
- Export replaces the earlier per-field copy icons idea; the color rows have no copy buttons.

### 4. Component motion
- Animate the EXPORT progress bar through the two approved loading states while preparing the payload.
- Animate the local row transition and the icon/label swap for COPIED and DOWNLOADED.
- Success remains visible for 1.5 seconds, then the component returns to its default state.
- Respect `prefers-reduced-motion` by skipping non-essential movement and loading delays.

## Explicitly out of scope for Phase 4
- GSAP Flip or any structural animation outside the export component (Phase 7)
- Any additional export formats beyond markdown

## Done means
Click EXPORT → that button is replaced by COPY / DOWNLOAD .MD while the photo controls remain visible → COPY puts full markdown (colors, both contrast algorithms, credit) on the clipboard and briefly shows COPIED → DOWNLOAD .MD saves the same content using the approved filename → after either success, the actions return to EXPORT.
