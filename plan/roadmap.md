# Color Shift — Roadmap

*Status: Draft — phase ordering/grouping not yet confirmed*
*Written: 2026-09-26*

Full product vision lives in `specs-context/spec-color-shift.md` and `specs-context/style-guide-color-shift.md`. This roadmap breaks that vision into buildable phases. Each phase has its own file in this folder.

| Phase | File | Theme | Status |
|---|---|---|---|
| 1 | `phase-1-core-loop.md` | Core loop: photo → extraction → specimen | Complete |
| 2 | `phase-2-color-editing.md` | Color editing (sliders, 5 formats) | Complete |
| 3 | `phase-3-dual-scoring-thresholds.md` | Dual scoring (APCA) + threshold bumping | Complete |
| 4 | `phase-4-export.md` | Export (copy + download) | Complete |
| 5 | `phase-5-theming-responsive.md` | Theming (light mode) + responsive mobile | Implemented/browser-verified 2026-10-02; device checks pending |
| 6 | `phase-6-extended-input-layouts.md` | Personal photo input + editable specimen text | Implemented/browser-verified 2026-10-06 |
| 7 | `phase-7-animation-polish.md` | Animation polish (GSAP, score odometer, DialKit) | Implemented/browser-verified 2026-10-07 |
| 8 | `phase-8-loose-ends-hardening.md` | Loose ends & hardening (CI, deps, docs, fixes) | Proposed / Not Started |
| 9 | `phase-9-native-platforms.md` | Native platforms (iOS + macOS) | Draft |
| 10 | `phase-10-app-store-launch.md` | App Store launch (iOS, optional macOS) | Draft |
| — | `stretch.md` | Figma MCP export | Stretch, unscheduled |

*Animation Polish was moved from Phase 5 to Phase 7 on 2026-09-27, so it lands after all other web-feature phases are stable instead of in the middle of them.*

*Phase 8 (Loose Ends & Hardening) was inserted on 2026-10-07 to address infrastructure gaps, documentation, and deferred fixes before release. The native platforms phase was renumbered from Phase 8 to Phase 9. Phase 8 can run in parallel with or before Phase 7, depending on priorities.*

*Phase 10 (App Store Launch) was added on 2026-10-07 to cover iOS (and optional macOS) App Store submission, review, and release. It depends on Phase 9 (native app implementation) and Phase 8's Unsplash production access approval.*

The scrollable gallery layout and rotating specimen fonts were removed from Phase 6 on 2026-10-06; neither is scheduled in this roadmap.

## Layout revision (2026-09-29)
The bottom control bar with a slide-up slider panel was replaced by a **left sidebar** (Figma "Controls V6"): logo + theme toggle, score tile (WCAG | APCA), BACKGROUND/FOREGROUND rows, an editor panel (format tabs + sliders + readout), an action row (prev · undo · shuffle · swap · fix · next), and EXPORT. Specs and Phases 1–5 were updated accordingly. Feature placement by phase:

| Sidebar piece | Phase |
|---|---|
| Score tile (WCAG), color rows, prev/shuffle/swap/next, loading/error states | 1 |
| Editor panel, format tabs, sliders, readout row, undo | 2 |
| APCA tab, threshold row, fix (wrench) | 3 |
| EXPORT button + export state | 4 |
| Light/Dark toggle, mobile fixed footer + floating actions | 5 |

Mockup numbers and hex values are placeholders; the engine is the source of truth.

## Mobile revision (2026-10-01)
Phase 5 follows mobile frames `3387:311` (Dark) and `3387:482` (Light), plus `ControlMobile` variants `3389:788`. Mobile uses a side-by-side specimen/photo above scrolling score and color controls. A fixed footer places EXPORT beside a 48px trigger; opening it reveals six vertically stacked actions. This supersedes the bottom-sheet proposal. The user confirmed white/neutral Light chrome, deferred the 2D picker, and deferred swipe navigation. See `phase-5-theming-responsive.md` for measurements, interaction defaults, implementation evidence, and verification. The phase is implemented and browser-verified; physical software-keyboard and safe-area checks remain pending.

## Open questions (unresolved as of 2026-09-26)
1. **Ordering** — does Phase 2→9 order match priorities, or should something else be pulled forward/back? Specifically: should Phase 8 (loose ends & hardening) run before or after Phase 7 (animation polish), or in parallel? Phase 8 focuses on infrastructure and stability; Phase 7 is creative polish. They have minimal dependencies.
2. **Doc granularity** — keep all phases fully detailed now, or only flesh out the next phase in detail once we're about to start it (earlier phases stay as lighter sketches until then)?
3. **Native platforms** — should Phase 9 (iOS/macOS) stay tracked in this repo's `plan/` folder at all, or is it a separate project/repo to track elsewhere? Right now it's included for completeness but flagged as likely-separate.
4. **Figma source** — Phase 1 used the project-level file link and exported V6 assets. Later phases should still get node-specific frame references when available for tighter pixel-level comparison.
5. **Animation skills** — Phase 7 now specifies using the [emilkowalski/skills](https://github.com/emilkowalski/skills) animation skill set (`animate`, `emil-design-eng`, `animation-vocabulary`, `find-animation-opportunities`, `improve-animations`) alongside GSAP; see `phase-7-animation-polish.md` for how they're meant to be applied.

## How to resume this project in a new session
1. Read `specs-context/spec-color-shift.md` (full vision) and `specs-context/style-guide-color-shift.md` (visual language).
2. Read this file for current phase status.
3. Read the specific phase file being worked on for its detailed spec.
4. Read the completed Phase 1 implementation before extending its shared types and sidebar architecture.
