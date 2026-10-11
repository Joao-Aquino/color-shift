# 008 - Polish mobile EXPORT drawer motion

- **Status**: DONE
- **Commit**: 2a2504a (plan targets the current dirty working tree, not bare HEAD)
- **Implemented against**: 9d2c295 plus the preserved dirty footer/drawer work
- **Severity**: MEDIUM
- **Category**: Easing and duration / Accessibility / Physicality
- **Estimated scope**: 1 file, small CSS-only change

## Problem

The mobile EXPORT footer currently uses the same **300ms** transform in both directions when the legal drawer opens and closes:

```css
/* app/globals.css:343-345 - current */
@media (max-width: 639px) {
  .cs-footer { transition: transform 300ms var(--ease-out), background-color 200ms, color 200ms, border-color 200ms; }
  body[data-menu-status="open"] .cs-footer { transform: translateY(100%); pointer-events: none; }
}
```

That makes the dismissal feel slower than it needs to, while the return lacks a softer arrival. The motion also relies on position alone, so the footer remains visually prominent through most of the trip below the viewport.

The global reduced-motion rule then removes every transition duration, which turns this state change into a hard teleport:

```css
/* app/globals.css:361-365 - current */
@media (prefers-reduced-motion: reduce) {
  .cs-specimen-caret { animation: none; }
  html[data-theme-ready] *, html[data-theme-ready] *::before, html[data-theme-ready] *::after { transition-duration: 0s !important; animation-duration: 0s !important; }
  html[data-theme-ready] .cs-photo-drop { transform: none !important; transition: opacity 150ms var(--ease-out), visibility 0s linear 150ms !important; }
  html[data-theme-ready] .cs-photo-drop[data-active="true"] { transition: opacity 150ms var(--ease-out), visibility 0s !important; }
}
```

The current interaction already has the correct semantic protection in `components/control-bar/control-footer.tsx:77-84`: while the drawer is open, the footer receives `aria-hidden` and `inert`. Preserve that behavior.

## Target

### Normal motion - fast exit, softer return

At widths up to 639px, use asymmetric durations and pair the translation with a short fade:

```css
@media (max-width: 639px) {
  html[data-theme-ready] .cs-footer {
    opacity: 1;
    transition:
      transform 250ms var(--ease-out),
      opacity 150ms var(--ease-out),
      background-color 200ms,
      color 200ms,
      border-color 200ms;
  }

  html[data-theme-ready] body[data-menu-status="open"] .cs-footer {
    opacity: 0;
    transform: translateY(100%);
    pointer-events: none;
    transition:
      transform 200ms var(--ease-out),
      opacity 150ms var(--ease-out),
      background-color 200ms,
      color 200ms,
      border-color 200ms;
  }
}
```

- Opening the drawer dismisses EXPORT in **200ms**.
- Closing the drawer returns EXPORT in **250ms**.
- Opacity uses **150ms** in both directions and runs concurrently with the transform.
- Use the existing strong `--ease-out`; do not introduce a new curve or delay.
- Keep `pointer-events: none` only in the open state.
- The `closing` body state intentionally resolves to the base footer rule, so the return begins when drawer closing starts.
- Keep the `html[data-theme-ready]` qualifier: without it, the existing global theme-transition selector has higher specificity and suppresses the mobile transform/opacity transition.

### Reduced motion - fade only

After the existing reduced-motion rules, add a mobile-specific override that removes the positional movement but retains a short opacity transition:

```css
@media (prefers-reduced-motion: reduce) and (max-width: 639px) {
  html[data-theme-ready] .cs-footer {
    transform: none !important;
    transition: opacity 150ms var(--ease-out) !important;
  }

  html[data-theme-ready] body[data-menu-status="open"] .cs-footer {
    opacity: 0;
  }
}
```

- Never translate the footer for reduced motion.
- Preserve a **150ms** opacity fade so the control does not teleport.
- Do not alter the existing `aria-hidden`, `inert`, or pointer-event timing.

## Repo conventions to follow

- The shared strong ease-out is `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` in `app/globals.css:68`.
- The photo drop already pairs `opacity` and `transform` with 150-200ms strong ease-out transitions in `app/globals.css:274-279`.
- The reduced-motion block already preserves a 150ms opacity-only transition for `.cs-photo-drop` in `app/globals.css:361-366`; the footer should follow the same local convention.
- `components/control-bar/control-footer.tsx:20-22` derives `drawerOpen` from the mobile breakpoint and `body[data-menu-status="open"]`. Its semantic hiding logic is not part of this plan.
- Next.js project rules require reading the relevant guide under `node_modules/next/dist/docs/` before editing application code.

## Steps

1. In `app/globals.css`, replace the current mobile `.cs-footer` transition at lines 343-345 with the normal-motion target above, including the `html[data-theme-ready]` specificity qualifier.
2. Keep the existing `.underlay-nav__header` and `.underlay-nav__inner` rules in the same media query unchanged.
3. After the existing `@media (prefers-reduced-motion: reduce)` block, add the combined reduced-motion/mobile override shown above. It must appear after the broad `transition-duration: 0s !important` rule so its explicit `transition` wins.
4. Do not modify the React portal, keyboard-offset measurements, semantic hiding, or drawer animation code.

## Boundaries

- Modify only `app/globals.css`.
- Do NOT change `components/control-bar/control-footer.tsx`, `components/legal-underlay.tsx`, or the drawer's GSAP durations/easing.
- Do NOT add Motion, GSAP calls, keyframes, JavaScript timers, dependencies, or a return delay.
- Do NOT change desktop/tablet behavior at 640px or wider.
- Do NOT change fixed positioning, safe-area padding, keyboard-offset handling, footer backdrop, export action behavior, or legal-footer layout.
- Preserve all unrelated dirty working-tree changes. If the selectors or body status lifecycle no longer match this plan, STOP and report the drift instead of broadening scope.

## Verification

- **Mechanical**: run `git diff --check`; `npm run lint`; `npx tsc --noEmit --incremental false`; `npm test`; `npx next build --webpack`.
- **Mobile feel check (430 x 932)**:
  - Open Privacy Policy, Terms of Service, and Shortcuts independently. EXPORT moves below the viewport and fades out; the movement reads as a quick dismissal at 200ms.
  - Close the drawer by the close button, Escape, and a click on main content. EXPORT rises from below and fades in over the 250ms return without covering the drawer while it is open.
  - Switch directly between legal documents while the drawer remains open. EXPORT stays hidden and does not replay.
  - Rapidly alternate open/close. The CSS transition retargets from the current visual state without snapping, restarting from an endpoint, or leaving the footer invisible.
  - Confirm computed transitions: open state has transform 200ms and opacity 150ms; base/closing state has transform 250ms and opacity 150ms.
  - Confirm the footer is `aria-hidden="true"`, inert, and non-interactive while open, then restored when closing begins/completes according to the existing logic.
- **Reduced motion**:
  - With `prefers-reduced-motion: reduce`, open and close the drawer. Computed `transform` remains `none`; only opacity transitions for 150ms.
  - Confirm focus, Escape, outside click, and document switching still work and no hidden EXPORT action can be activated.
- **Desktop regression**: at 640px and 2520 x 1314, footer position and motion are unchanged.
- **Done when**: normal motion exits in 200ms and returns in 250ms with a concurrent 150ms fade; reduced motion uses opacity only; semantic hiding and Export behavior remain intact; all mechanical checks pass.
