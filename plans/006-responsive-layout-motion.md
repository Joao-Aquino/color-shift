# 006 - Ease responsive layout changes

- **Status**: PARTIAL - continuous dragging needs follow-up
- **Baseline commit**: 53a21f8 (implementation added in the following session)
- **Severity**: MEDIUM
- **Category**: Missed opportunities / interruptibility / accessibility
- **Estimated scope**: A focused responsive-motion hook/helper and wiring in two components; no dependencies.
- **Baseline**: The current working tree includes uncommitted responsive and editor fixes. Preserve them; the commit alone is not the implementation baseline.

## Problem

`components/color-shift-app.tsx:506` switches the controls/preview from column to row at 1180px:

```tsx
<main className="flex min-h-svh w-full min-w-0 flex-col gap-6 bg-[var(--color-chrome-bg)] p-4 sm:p-6 desktop:h-screen desktop:min-h-[720px] desktop:flex-row desktop:gap-12 desktop:overflow-hidden desktop:p-10">
```

`components/color-shift-app.tsx:547` switches the preview from column to row at 640px:

```tsx
<div className="flex h-[640px] w-full min-w-0 shrink-0 flex-col gap-1 overflow-hidden rounded-[12px] sm:h-[560px] sm:flex-row desktop:h-auto desktop:min-h-0 desktop:w-auto desktop:flex-1">
```

`components/color-shift-app.tsx:562` changes the Aa font size from 80px to 160px to 220px. `components/control-bar/control-container.tsx:76` changes the controls from full width to 320px. These deliberate responsive arrangements are correct, but their discontinuities are visually abrupt. CSS cannot interpolate flex-direction.

## Target

- Animate only crossing `(min-width: 40rem)` or `(min-width: 73.75rem)`, matching Tailwind sm and the desktop token in `app/globals.css:59`.
- Duration **0.2 seconds**, no delay, bounce, or stagger.
- Easing **cubic-bezier(0.77, 0, 0.175, 1)** for movement. Use installed GSAP CustomEase to implement this exact curve.
- GSAP Flip with `scale: true`, `nested: true` for the preview and its nested targets; tween transforms, not width/height. Controls animate position only on the same timeline so labels and inputs never stretch. Their CSS dimensions update immediately. Do not take layout containers out of document flow.
- Smooth controls/preview placement and the specimen/photo arrangement, including the specimen size change where feasible without interfering with its active-press transform.
- Continuous resizing inside a breakpoint band must remain immediate, with no trailing animation or queued transitions.
- If a new resize interrupts a transition, either retarget from its visible state for another breakpoint crossing, or cancel promptly to the live layout for same-band dragging. Never force completion to a stale endpoint before retargeting.
- Skip responsive movement with `(prefers-reduced-motion: reduce)`, including when that preference changes mid-animation. Preserve unrelated color/opacity feedback.
- No initial-load animation, no animation when editors open, photos load, or score panels change. Keep all existing responsive sizes, scroll behavior, content, and controls.

## Repo conventions to follow

- This is a Next.js 16.3.6 App Router app. Read relevant local guides under `node_modules/next/dist/docs/` before editing.
- GSAP 3.15 is already installed; `lib/odometer.ts` imports GSAP and checks reduced motion using matchMedia. Motion is installed for DialKit, but do not introduce a second responsive animation stack.
- The main app is already a client component. Keep browser measurements in effects and use refs, not React state updates on every resize.
- Keep animation logic in a small scoped helper/hook rather than expanding the photo/history logic.
- Preserve the user's removal of odometers from all color-editor inputs and the score's natural description height.

## Steps

1. Create a scoped responsive-layout helper/hook, e.g. `lib/use-responsive-layout-motion.ts`, using GSAP Flip and CustomEase. Wire a root ref on the main element in `components/color-shift-app.tsx`. Mark only the intended layout targets with stable data attributes; add one to the existing aside in `components/control-bar/control-container.tsx`, without adding a decorative wrapper.
2. Cache the last settled Flip state and breakpoint band. Resize/media-query callbacks run after CSS reflow, so measuring only inside a breakpoint-change callback cannot recover the previous layout. Refresh the cached baseline on ordinary resizes and non-resize content changes without playing motion. Coalesce multiple resize notifications in a single frame and avoid an idle rAF polling loop. Use observers only as needed, disconnect them on cleanup, and avoid caching transformed intermediate states as settled baselines.
3. On an actual band change, animate from the cached state into the current CSS layout with the exact target values. Account for nested transforms and scroll offsets. Skip when targets are not ready/connected or measurement is invalid; then refresh the baseline. Do not use `absolute: true` on flow containers. If animated children would be clipped by the preview's overflow, handle its clipping temporarily and restore its original styles on every completion, interruption, reduced-motion change, and unmount. Do not leave a page-wide overflow workaround installed.
4. Smooth the Aa size transition with a dedicated measured wrapper only if necessary; keep its existing inner press feedback separate from Flip transforms. Do not animate font-size itself, add viewport-scaled typography, or change final font sizes.
5. Handle rapid reversals, same-band dragging during motion, reduced-motion preference changes, React Strict Mode, HMR/unmount, and fresh targets after loading. Kill/revert owned animations and restore only styles this helper owns. Never overwrite independent transforms/styles on descendants.
6. Verify in the running app at both breakpoints and with the editor open; revise implementation if it stretches text excessively, clips a panel, or leaves transient overflow. Update this plan and `plans/README.md` to DONE only after verification.

## Boundaries

- No dependency/package changes, commits, photo-fetch/history refactors, new UI, or production devtools changes.
- Do not undo any existing uncommitted edits. The executor works in an isolated worktree populated from the current working-tree baseline and returns only its own patch.
- Do not animate every pixel of resizing, use transition-all, animate width/height/padding, or reintroduce numeric odometers.
- Preserve accessible names, keyboard behavior, focus, final geometry, mobile page scrolling, and desktop sidebar scrolling.
- Stop and report if the cited responsive markup has incompatible drift.

## Verification

- **Mechanical**: `npx tsc --noEmit --incremental false`, ESLint on changed files, and `node tests/responsive-layout-motion.test.cjs` must pass. No new browser console errors. The Node tests mock React/GSAP/DOM/media queries; they do not replace visual browser verification.
- **Breakpoint motion**: resize 1181 -> 1179 -> 1181 and 641 -> 639 -> 641. Confirm a brief transform transition, final styles restored, correct directions, and no blank preview or stranded panels. Test reversal before 200ms completes.
- **Continuous resize**: resize several times inside desktop, tablet, and mobile bands. Confirm no newly started responsive animation; resize again inside a band during an active crossing and verify it does not trail a stale layout.
- **Content changes**: open/close both editors, expand/collapse the score, switch specimen, and change photos without resizing. These must not trigger responsive motion or poison the next breakpoint baseline.
- **Responsive geometry**: widths 1360, 1180, 1179, 1024, 640, 639, 390, 320; no settled horizontal overflow, no overlapping controls, photo loaded, credit readable. Repeat scrolled into the preview.
- **Accessibility**: emulate reduced motion, cross both breakpoints, and confirm no responsive movement; switch the preference while moving and verify clean cancellation and usable controls.
- **Feel check**: record frames at a breakpoint and inspect the trajectory, cropping, Aa scaling, and interruptions. GSAP timelines are not visible in the CSS Animations panel; use a browser recording rather than claiming that panel controls JS playback.
- **Done when**: breakpoint jumps are visibly eased, live resizing remains immediate, all verification cases pass, and cleanup leaves the original CSS layout intact.

## References

- [GSAP Flip](https://gsap.com/docs/v3/Plugins/Flip/) documents transform scaling and nested targets.
- [Flip.getState](https://gsap.com/docs/v3/Plugins/Flip/static.getState()/) documents active-animation capture/kill behavior; do not accidentally force a stale completion.

## Implementation Results

- **Known limitation confirmed on 2026-10-01:** the next same-band resize cancels an active breakpoint transition. Transforms are active when a breakpoint is crossed, but normal continuous window dragging makes the easing nearly invisible. This follows the original cancellation rule above but does not meet the user's practical expectation of smooth resizing. Follow-up should revise that rule and retarget from the visible state during dragging; no retargeting fix was made before the Phase 5 handoff.
- Implemented in `lib/use-responsive-layout-motion.ts`, with scoped targets in the app and control container. Controls translate without scaling. A separate circle counter-scale wrapper preserves roundness without changing press feedback.
- `npx tsc --noEmit --incremental false`, targeted ESLint, and eight deterministic tests in `tests/responsive-layout-motion.test.cjs` passed.
- Browser verified both breakpoint transitions, rapid reversals, same-band cancellation, non-resize content changes, and a scrolled crossing. Measured circle width/height stayed within 0.0002 of 1 during sampled motion and returned to 1 after cleanup.
- With an editor open, widths 1360, 1180, 1179, 1024, 640, 639, 390, and 320 had the intended settled directions/heights, loaded photos, restored clipping, and no horizontal overflow. No browser console errors.
- Live reduced-motion changes and unmount cleanup passed mocked tests. Browser reduced-motion emulation was unavailable; no real-device verification is claimed.
