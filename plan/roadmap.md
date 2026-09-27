# Color Shift — Roadmap

*Status: Draft — phase ordering/grouping not yet confirmed*
*Written: 2026-09-26*

Full product vision lives in `specs-context/spec-color-shift.md` and `specs-context/style-guide-color-shift.md`. This roadmap breaks that vision into buildable phases. Each phase has its own file in this folder.

| Phase | File | Theme | Status |
|---|---|---|---|
| 1 | `phase-1.md` | Core loop: photo → extraction → specimen | Approved, not started |
| 2 | `phase-2.md` | Color editing (sliders, 5 formats) | Draft |
| 3 | `phase-3.md` | Dual scoring (APCA) + threshold bumping | Draft |
| 4 | `phase-4.md` | Export (copy + download) | Draft |
| 5 | `phase-5.md` | Animation polish (GSAP, TubeText, DialKit) | Draft |
| 6 | `phase-6.md` | Theming (light mode) + responsive mobile | Draft |
| 7 | `phase-7.md` | Extended input & layout modes | Draft |
| 8 | `phase-8.md` | Native platforms (iOS + macOS) | Draft |
| — | `stretch.md` | Figma MCP export | Stretch, unscheduled |

## Open questions (unresolved as of 2026-09-26)
1. **Ordering** — does Phase 2→8 order match priorities, or should something be pulled forward (e.g. export before animation polish, theming earlier)?
2. **Doc granularity** — keep all phases fully detailed now, or only flesh out the next phase in detail once we're about to start it (earlier phases stay as lighter sketches until then)?
3. **Native platforms** — should Phase 8 (iOS/macOS) stay tracked in this repo's `plan/` folder at all, or is it a separate project/repo to track elsewhere? Right now it's included for completeness but flagged as likely-separate.
4. **Figma source** — Phase 1 now depends on a specific Figma frame link (see `phase-1.md` §7); once that's resolved, later phases should each get their own frame reference too, if the Figma file covers them.

## How to resume this project in a new session
1. Read `specs-context/spec-color-shift.md` (full vision) and `specs-context/style-guide-color-shift.md` (visual language).
2. Read this file for current phase status.
3. Read the specific phase file being worked on for its detailed spec.
4. Check `plan/phase-1.md` §7 for the Figma dependency status before starting UI work.
