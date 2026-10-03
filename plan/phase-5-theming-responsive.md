# Color Shift — Phase 5 Spec

*Status: Implemented and browser-verified 2026-10-02. Physical-device software-keyboard and safe-area checks remain pending. Interaction details below are implementation defaults, not Figma prototype behavior.*
*Written: 2026-09-26. Renumbered from Phase 6 on 2026-09-27. Revised 2026-10-01 after inspecting the mobile floating-action controls.*

## Goal

Add a neutral Light theme and mobile responsiveness with scrolling content, fixed export controls, and floating photo/color actions, preserving Phase 1-4 workflows.

## Design source and confirmed decisions

Use `Color-Shift`, file key `Fu0DGoLsLeY6wj7oLr5cVh`:

| Reference | Node | Purpose |
|---|---|---|
| [Dark mobile full](https://www.figma.com/design/Fu0DGoLsLeY6wj7oLr5cVh/Color-Shift?node-id=3387-311) | `3387:311` | 402 x 1152, closed action control |
| [Light mobile full](https://www.figma.com/design/Fu0DGoLsLeY6wj7oLr5cVh/Color-Shift?node-id=3387-482) | `3387:482` | Same content, open action control |
| Mobile viewport references | `3386:233`, `3387:428` | 402 x 874; crop the same expanded editor, not distinct closed-editor states |
| [ControlMobile variants](https://www.figma.com/design/Fu0DGoLsLeY6wj7oLr5cVh/Color-Shift?node-id=3389-788) | `3389:788` | Closed `3389:784`, Open `3389:789` |
| Footers | `3387:343`, `3389:891` | EXPORT alongside floating actions |

Confirmed with the user on 2026-10-01:
- White/neutral Light follows Figma; palette-tinted chrome is deferred.
- Scrolling content and fixed footer replace the expandable bottom-sheet proposal.
- Side-by-side preview replaces the 65-70% specimen-height proposal; mobile Aa is 48px rather than 80px.
- Swipe navigation is deferred; existing buttons and slider touch gestures remain.
- Keep the five-format editor; the Figma 2D picker is deferred and is an intentional visual exception.

## What gets built

### 1. Light theme
- Light | Dark toggle in desktop sidebar and mobile header. `T` respects existing editable-field, focused-control, and modifier guards.
- Redefine semantic tokens for chrome, borders, labels, values, focus, loading, popovers, and all good/meh/bad score states. Use Figma Light/Dark token modes, including neutral EXPORT/action surfaces; retain palette color only in specimen, swatches, and existing field treatments.
- Smooth color transition; no remount or reset of photo, colors, editor format, thresholds, undo, or export. Reduced motion switches immediately.
- Implementation default: Dark on first visit, persist explicit choice locally, resolve before paint, tolerate unavailable storage, and avoid hydration warnings. Automatic system theme is deferred.
- Accessible selected state and labels. Following the 2026-10-02 revision, use compact theme pills with 12px text and 4px vertical padding; intrinsic sizing replaces the previous 44px minimum targets at the user's request. Keep keyboard focus visible.

### 2. Responsive layout
- Engineering default: mobile below 640px; desktop sidebar at 1180px and above. Tablet between these existing boundaries uses preview above full-width controls and inline actions. Figma does not specify breakpoints.
- Mobile DOM/focus order: identity/theme, preview, credit, score/guidance, divider, color fields/inline editor, footer.
- At 402px: 24px gutters and major gaps, 354 x 240px preview, specimen 167px wide, photo 183px wide, 4px gap. Keep proportions fluid at other mobile widths; Aa is 48px.
- Preserve dynamic photos, Aa/circle toggle, loading/retry, and attribution links. Mobile credit sits below preview, aligned right, wrapping long names.
- Score fills content width and retains tabs, grade, description, and thresholds. Active editor expands inside its color field and scrolls with the page.
- Preserve plain editable numeric inputs, five formats, gradients, validation, gamut handling, and one undo entry per gesture. Do not add the 2D picker or replace live controls with images.
- Content determines page height. Reserve measured fixed-footer height plus safe-area inset so the last input/errors can scroll fully above it. Focused fields stay reachable with the software keyboard open.

### 3. Fixed footer and floating actions
- At 402px: 96px footer and 24px padding; the updated Figma removes the top divider and uses a transparent-to-theme gradient with progressive background blur. Add bottom safe-area inset without shrinking targets. Use solid chrome when blur/masks are unavailable or reduced transparency is requested.
- EXPORT fills remaining width (302px reference), followed by 4px gap and circular 48 x 48px trigger. Closed icon is a three-line menu; open icon is X. Reuse Phosphor icons and local button patterns.
- Open stack aligns above/right of trigger. Top-to-bottom: Undo, Shuffle, Swap, Fix, Previous, Next. Updated `ControlMobile` uses a single 48 x 310px capsule with shared fill, 1px border, and fully rounded ends. Its six borderless controls are 46 x 48px, with 20px icons and 4px gaps; the capsule sits 4px above the trigger.
- Overlay without reflow; allow footer overflow above, and keep fixed controls outside transformed/clipped responsive-motion ancestors. Constrain/scroll the stack on short viewports or with keyboard open so all actions remain reachable.
- Share current handlers, disabled/loading states, history, and active-color behavior. Opening must not dismiss editor, collapse thresholds, reset export, or change Fix's color target.
- Implementation defaults: trigger toggles; an enabled action closes the stack; outside pointer closes it without suppressing the outside action. Escape closes stack first and returns trigger focus; subsequent Escape can dismiss editor/threshold/export. Selection also restores trigger focus.
- Accessible non-modal disclosure/popover: `aria-expanded`, `aria-controls`, named buttons, visible focus, Tab access, keyboard opening focuses the stack, hidden actions not focusable. Use ARIA menu semantics only with full menu keyboard behavior.
- Leaving mobile closes stack and transfers focus to a corresponding visible control if trigger disappears. EXPORT remains usable while open; activating it closes stack.
- Brief transform/opacity entrance/exit with existing motion language; reduced motion skips movement. Broader polish remains Phase 7.

### 4. Export integration
- Reuse generator, loading sequence, COPY/DOWNLOAD, live status, and 1.5-second success reset.
- Replace EXPORT within its footer slot; trigger remains available. At narrow widths stack export actions and grow footer if needed; measure height for bottom reservation.
- Retain photo/color-change resets. Opening/closing floating actions alone must not reset export. Errors stay perceivable; restore valid focus when success returns to EXPORT.

## Implementation sequence

1. Read relevant bundled Next.js guides before application edits. Inspect current branch; lint corrections were handled in another chat.
2. Add theme tokens/state, pre-paint preference, toggle, and guarded `T`.
3. Separate header, preview, score/color content, and footer within existing app structure for correct mobile DOM/focus order. Reuse `ControlContainer`, `Score`, `ColorFields`, `ColorEditor`, `IconButton`, and `ExportControls`; avoid duplicate live editors/export state machines.
4. Add disclosure and vertical `ControlsBar` presentation. Coordinate outside-click/Escape in `ColorShiftApp` and `ExportControls` so dismissal does not close every panel.
5. Adapt export and footer/safe-area measurement. Review responsive motion targets for fixed overlays. Continuous-resize easing remains a separate follow-up; settled geometry and cleanup must work.
6. Validate below and record actual evidence before marking complete.

## Verification

- Compare Dark closed/Light open screenshots at 402 x 874 plus full content; deferred picker and enlarged toggle targets are documented exceptions.
- Check 320, 390, 402, 639, 640, 1024, 1179, 1180px and desktop for ordering, overflow, credit wrapping, anchoring, circle roundness, and breakpoint cleanup.
- Test six actions and disabled states with editor open/closed: Fix retains target, Swap follows active color, navigation resets history, Undo works.
- Test focus, outside interaction, Escape priority, export with stack open, leaving mobile with stack focus, and no hidden Tab stops.
- Test every export state at 320/402px, readable labels, full targets, and footer reservation after height changes.
- Check toggle/guarded `T`, persistence, blocked storage, all score states/algorithms, theme changes during editing/export, and reduced motion.
- Test short viewport and software keyboard, preferably on a device; record unavailable device checks. Last input must remain reachable.
- Run lint, production build, then TypeScript after Next types generation, plus existing presence/responsive-motion tests. Add focused behavioral tests for theme preference and overlay dismissal where they catch integration regressions. Inspect browser console.

## Out of scope

- Vertical gallery (Phase 6), swipe, expandable bottom sheet, system-theme mode
- Palette-tinted chrome and 2D picker
- Broader Phase 7 polish and continuous-resize retargeting

## Implementation evidence

- Neutral Light/Dark tokens, persisted pre-paint theme, compact intrinsically sized theme pills, and guarded `T` are implemented without resetting editing or export.
- Mobile footer is 96px with a measured bottom reservation and decorative masked blur layers behind its content. Floating actions retain their identity across export resets, photo loading, and color changes; keyboard focus transfers to equivalent inline actions at 640px.
- Production Chrome checks cover ten widths from 320 to 1360px, all six actions, editor/menu dismissal, real clipboard and Markdown download, blocked storage, score grades/APCA, short-viewport scrolling, reduced motion/transparency, and circle geometry. Photo API fixtures use the real local bitmap and palette pipeline, not a static UI mock. See `tests/README.md`.
- Full lint, TypeScript, webpack production build, three theme tests, six presence tests, and eight responsive-motion tests pass. The environment's Turbopack process/port restriction still requires the existing webpack fallback.
- The compact theme toggle uses the requested 4px vertical padding without a fixed height or 44px minimum. The five-format editor remains the agreed visual exception; no 2D picker was added.
- Browser tests do not prove physical keyboard or notch behavior. Verify iOS Safari/Android Chrome before mobile release. Existing continuous-resize easing cancellation remains outside this phase.

## Done means

Light/Dark and `T` switch neutral themes and retain explicit preference. Mobile header/side-by-side preview precede scrolling controls; EXPORT and floating trigger stay fixed below. Six actions support correct focus/dismissal and coexist with editing/export. Phase 1-4 workflows remain intact on mobile, tablet, desktop.
