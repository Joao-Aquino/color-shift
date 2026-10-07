# Color Shift — Phase 9 Spec (Draft)

*Status: Draft — likely a separate project/repo, not incremental on the Next.js phases*
*Written: 2026-09-26. Renumbered from Phase 8 to Phase 9 on 2026-10-07 (Phase 8 is now loose ends & hardening).*

## Goal

Bring the same two-color specimen + WCAG/APCA scoring experience to native platforms, with platform-specific color capture input.

## What gets built (proposed)

### iOS — Planned
- Camera as primary input (point at something, capture a color).
- Same two-color specimen + WCAG/APCA scoring as web.
- Calls web API routes, or runs color logic natively (decision needed).
- Built in Swift/SwiftUI.
- Skippable video for web-only students (this is a teaching product — see `specs-context/spec-color-shift.md` "Teaching Value").

### macOS — Planned
- Menu bar app with popover.
- Screen color picker (`NSColorSampler`).
- Same two-color specimen + WCAG/APCA scoring.
- Built in Swift/SwiftUI, native performance.
- Skippable video for web-only students.

## Open questions to resolve before building
- Separate repo(s) for iOS/macOS, or a monorepo alongside this Next.js app?
- Shared color/contrast logic: port the TypeScript (culori/apca-w3) logic to Swift, or call back into the web API routes for scoring?
- Does this phase start only after Phases 1–7 are fully done on web, or can native development run in parallel once the color/contrast API surface (Phase 1–3) is stable?

## Explicitly out of scope for Phase 9
- Feature parity with every web phase on day one — start with the core specimen + scoring experience, camera/screen-picker input, matching Phase 1's scope.

## Done means
(To be defined once repo/architecture questions above are resolved.)
