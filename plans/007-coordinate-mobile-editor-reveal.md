# 007 - Coordinate and interrupt mobile editor reveal

- **Status**: DONE
- **Commit**: f432d6a (plan targets the current dirty working tree, not bare HEAD)
- **Severity**: MEDIUM
- **Category**: Interruptibility / Easing and duration
- **Estimated scope**: ColorField reveal logic, focused regression tests, progress documentation

## Problem

In `/Users/joaoaquino/Projects/color-shift/components/control-bar/color-fields.tsx:68`, opening the inline editor currently finishes its CSS expansion before requesting an independent native smooth scroll:

```tsx
window.scrollBy({
  top: delta,
  behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "instant"
    : "smooth",
});
```

The ResizeObserver callback at line 76 waits another 80ms after the last size notification:

```tsx
function schedule() {
  clearTimeout(timer);
  timer = setTimeout(reveal, 80);
}
```

Cleanup clears the timer and disconnects observation, but cannot stop native scrolling already in progress. A Chrome trace at 393 x 852 showed the shell reaching full size at approximately 199ms, while visible scrolling began at 334ms. A separate Escape interruption trace showed scrolling continuing during collapse. These findings share the same reveal controller and should be fixed together.

## Target

- Keep the existing inline CSS morph: open 200ms, close 150ms, `cubic-bezier(0.23, 1, 0.32, 1)`. Do not add GSAP Flip to editor open/close or extend broader Phase 7 scope.
- Replace the 80ms settle timer and native smooth scrolling with geometry-following corrections, scheduled at most once per animation frame from ResizeObserver notifications. Corrections use `behavior: "instant"`: their progression follows the existing CSS expansion rather than creating a second independent animation.
- Begin correcting during expansion, not after it. Only scroll when necessary to reveal the active field. Keep at least 16px above the fixed footer and 16px below the visual viewport top. Preserve bounds based on `visualViewport.offsetTop/height`, footer geometry and document scroll limits.
- When the final panel cannot fit, align its top and leave normal manual scrolling available. Avoid switching abruptly between bottom-alignment and top-alignment halfway through expansion; assess the fully expanded content height before choosing the alignment policy.
- Switching Background/Foreground must stop the old reveal and follow the new active field. Preserve format state, cached exit content, selected colors and input focus.
- Close, unmount, departure from `(max-width: 639px)`, and manual wheel/touch scrolling cancel pending frames. Manual interaction wins: do not restart auto-reveal from remaining size notifications for that same opening. A new field activation may reveal again.
- Reduced-motion uses immediate reveal without introducing a tween. Live preference changes must not leave stale callbacks or scroll work.
- Keyboard opening must not add a scroll tween. Retain focus ownership and existing semantics.
- Give existing focused-input/virtual-keyboard protection priority over whole-panel reveal. Do not fight `/Users/joaoaquino/Projects/color-shift/components/control-bar/control-footer.tsx:22`, which already corrects a covered focused input instantly. Keep physical-device keyboard verification explicitly pending.

## Repo conventions to follow

- The `ColorField` shell and its grid already use `--field-ease` and motion-safe CSS transitions in `components/control-bar/color-fields.tsx:100` and `:140`.
- The `ControlFooter` coalesces measurements through one cancellable requestAnimationFrame, listens to visual viewport events and cleans up listeners in `components/control-bar/control-footer.tsx:27`.
- `lib/use-collapsible-presence.ts` retains closing content and handles live reduced-motion state. Preserve it, do not replace its lifecycle.
- Existing browser test: `/Users/joaoaquino/Projects/color-shift/tests/phase5-browser.test.cjs`. Uses an actual local bitmap and deterministic photo API with installed system Chrome.
- Next.js local rules require reading relevant guides under `node_modules/next/dist/docs/` before editing application code.

## Steps

1. Execute in an isolated temporary worktree that includes the current tracked dirty changes, this plan and the plans index. Bare HEAD does not contain the mobile reveal/footer refinements. Do not commit, push, revert original changes or recreate an unrelated app. Use existing dependencies, with isolated build output.
2. Replace ColorField's timer-driven reveal with cancellable frame-coalesced observation and explicit reveal ownership. Keep the implementation scoped; introduce a local helper/hook only if it meaningfully clarifies ownership across the two fields.
3. Measure the expanded editor's natural content height and final shell spacing when deciding oversized alignment. Do not flash the expanded panel or repeatedly force layout by temporarily toggling classes on every frame.
4. Cancel stale scheduled work before field changes and on user interruption. Remove all listeners on cleanup. Do not rely on scroll events alone to distinguish user scrolling from the controller's own scrolling.
5. Preserve virtual-keyboard input protection. Only change ControlFooter if a small coordination mechanism is necessary; do not redesign its layout or safe-area behavior.
6. Extend browser coverage with a frame/timestamp trace proving actual scroll movement overlaps shell expansion at 393 x 852, not just that final geometry is correct. Use real pointer/touch interactions and avoid Playwright auto-scrolling masking the result.
7. Test Escape and Background/Foreground switches mid-expansion, manual wheel/touch cancellation, live reduced-motion changes, mobile-to-tablet crossings, keyboard focus and field state preservation. Assertions should tolerate scheduler jitter and inspect ordering/absence of stale scroll rather than exact wall-clock millisecond equality.
8. Preserve existing final-geometry tests for both fields, all five formats, both themes and motion preferences, oversized fallback at 320 x 320, and no page scrolling at desktop 2520 x 1314.
9. Report changed paths, isolated workspace path, test outputs and reviewable patch. After coordinator review, integrate only this task's patch into the original checkout, checking for drift. Update progress and test documentation only after validation. The coordinator updates the plan's status/index after completion.

## Boundaries

- Do NOT modify app colors, theme pills, footer visuals, actions, photo behavior, slider semantics, editor structure or existing plan contents.
- Do NOT add dependencies or start unrelated Phase 6/7 work. Preserve CSS expansion as the deliberate interim morph.
- Do NOT run builds in the original checkout during isolated implementation. Do not stop the user's port 3000 server. The existing original production preview on port 3001 may be refreshed only after integration.
- Do NOT overwrite existing local changes when integrating. If source drift invalidates the plan, report the concrete mismatch.
- No artificial loading phases, bounce, decorative stagger or delayed focus.

## Verification

- **Mechanical**: `npm run lint`; `npx tsc --noEmit --incremental false`; `node tests/collapsible-presence.test.cjs`; `node tests/responsive-layout-motion.test.cjs`; `git diff --check`; `npx next build --webpack`. All must pass. Webpack is the established fallback for the environment's Turbopack restrictions.
- **Browser**: run a production server on an unused port in the isolated worktree. Set `COLOR_SHIFT_TEST_URL` accordingly and run `tests/phase5-browser.test.cjs` with `PLAYWRIGHT_MODULE=/Users/joaoaquino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`.
- **Feel check**: at 393 x 852, open Foreground from the unscrolled initial page. Expansion and viewport correction should read as one continuous movement. Inspect normal-speed and frame-by-frame samples, plus Dark/Light settled screenshots. Repeat rapid field switches and close mid-motion: no late automatic scroll after cancellation. Manually scroll while opening: the user's gesture wins. At 320 x 320 the oversized panel aligns by its top and every input remains manually reachable. At >=640px do not scroll the page for editor reveal.
- **Reduced motion**: test both initial and live preference changes. No new position tween; final content and focus remain usable.
- **Done when**: scroll visibly starts before expansion finishes, final bounds clear the fixed footer, interruption leaves no stale correction, browser console errors are absent, all regression checks pass, and original unrelated working changes survive integration.
