# Color Shift — Phase 5 Spec (Draft)

*Status: Draft — not yet discussed/approved in detail*
*Written: 2026-09-26. Renumbered from Phase 6 to Phase 5 on 2026-09-27 (Animation Polish moved to the end).*

## Goal

Extend the tool beyond the desktop-dark-only baseline: light theme and mobile responsiveness.

## What gets built (proposed)

### 1. Light theme
- Chrome picks up a tint from the active background color — not pure white, warm and responsive to the current palette (per style guide).
- Same text opacity hierarchy as dark mode, inverted.
- Smooth crossfade between dark/light, no jarring snap.
- Keyboard shortcut: `T`.

### 2. Responsive mobile layout
- Specimen takes more vertical space on mobile (65–70%), controls collapse below.
- Aa specimen text scales down proportionally (80px mobile vs 200px desktop per original spec).
- Control bar groups likely need to wrap or condense — exact behavior TBD in design phase (Figma may or may not cover mobile; check before building).

## Open questions to resolve before building
- Does the existing Figma file include mobile frames, or does mobile layout need fresh design work first?
- Should touch interactions (tap-and-hold for sliders, swipe for photo nav) be added here, or is mobile just a responsive reflow of the same click/drag interactions?

## Explicitly out of scope for Phase 5
- Scrollable vertical gallery layout mode (that's a distinct layout mode, Phase 6)

## Done means
Toggle `T` → chrome crossfades to a palette-tinted light theme and back → resize to mobile width → specimen and control bar reflow to the mobile spec without breaking any Phase 1–4 functionality.
