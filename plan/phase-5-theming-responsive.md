# Color Shift — Phase 5 Spec (Draft)

*Status: Draft — layout decisions closed 2026-09-29 (Figma "Controls V6"); detail otherwise not yet approved*
*Written: 2026-09-26. Renumbered from Phase 6 to Phase 5 on 2026-09-27. Revised 2026-09-29 for the sidebar layout.*

## Goal

Extend the tool beyond the desktop-dark-only baseline: light theme and mobile responsiveness.

## What gets built

### 1. Light theme
- Light | Dark segmented toggle in the sidebar header (slot reserved in Phase 1). Shortcut: `T`.
- Chrome picks up a tint from the active background color — not pure white, warm and responsive to the current palette (per style guide).
- Same text opacity hierarchy as dark mode, inverted. Implemented as a token redefinition (Phase 1 semantic tokens), not a restyle.
- Smooth crossfade between dark/light, no jarring snap.
- Toggle is at least 16px-icon/label scale with an adequate touch target and an accessible label.

### 2. Responsive mobile layout
- The sidebar becomes a bottom sheet. Specimen takes more vertical space on mobile (65–70%), photo below/behind per design.
- Aa specimen text scales down proportionally (80px mobile vs 200px desktop).
- The editor panel and score tile need mobile behavior defined; exact layout TBD in design phase (Figma may or may not cover mobile; check before building).

## Open questions to resolve before building
- Does the Figma file include mobile frames, or does mobile need fresh design work first?
- Should touch interactions (swipe for photo nav) be added here, or is mobile just a responsive reflow of the same click/drag interactions?

## Explicitly out of scope for Phase 5
- Scrollable vertical gallery layout mode (Phase 6)

## Done means
Toggle Light/Dark or press `T` → chrome crossfades to a palette-tinted light theme and back → resize to mobile width → sidebar becomes a bottom sheet and the specimen reflows without breaking any Phase 1–4 functionality.
