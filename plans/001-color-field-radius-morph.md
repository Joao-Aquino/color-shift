# 001 — Snap ColorField shell to a single border-radius

- **Status**: DONE
- **Commit**: e91e58c
- **Severity**: HIGH
- **Category**: Physicality & origin / Easing (morph intermediate)
- **Estimated scope**: 1 file, small

## Problem

Opening or closing a ColorField morphs `border-radius` from Tailwind `rounded-full` (`9999px`) to `rounded-[24px]` while height grows via `grid-template-rows`. CSS interpolates radius in absolute pixels, so mid-transition the shell sits at hundreds of px of radius on a mid-height box — a fat stadium / sausage that is neither pill nor card.

```tsx
/* components/control-bar/color-fields.tsx:69-75 — current */
<div
  className={cn(
    "flex w-full flex-col overflow-hidden border motion-safe:transition-[background-color,border-color,border-radius,padding,gap] motion-safe:ease-[var(--field-ease)]",
    active
      ? "gap-4 rounded-[24px] border-[var(--color-chrome-border)] p-2 motion-safe:duration-200"
      : "rounded-full border-transparent motion-safe:duration-150 hover:border-[var(--color-chrome-border)]",
  )}
```

Closed row height is `h-12` (48px). A radius of `24px` already makes a true pill (half the height). `rounded-full` is unnecessary and is what creates the bad intermediate.

## Target

One radius for both states. Do not transition `border-radius`.

```tsx
/* target — shell always */
className={cn(
  "flex w-full flex-col overflow-hidden rounded-[24px] border motion-safe:transition-[background-color,border-color,padding,gap] motion-safe:ease-[var(--field-ease)]",
  active
    ? "gap-4 border-[var(--color-chrome-border)] p-2 motion-safe:duration-200"
    : "border-transparent motion-safe:duration-150 hover:border-[var(--color-chrome-border)]",
)}
```

- Closed: height 48px + `border-radius: 24px` → pill (same look as today).
- Open: taller + `border-radius: 24px` → Figma card.
- Transition list: `background-color, border-color, padding, gap` only (no `border-radius`).
- Keep existing durations and curve: open `200ms`, close `150ms`, `--field-ease: cubic-bezier(0.23, 1, 0.32, 1)` (strong ease-out).

## Repo conventions to follow

- Motion on this shell already uses inline `--field-ease` with `cubic-bezier(0.23, 1, 0.32, 1)` and `motion-safe:` prefixes in `components/control-bar/color-fields.tsx` — keep that pattern; do not add global tokens for this one-line fix.
- Open card radius `24px` matches the Figma expanded ColorValue (`border-radius/xl`).

## Steps

1. In `components/control-bar/color-fields.tsx`, on the `data-color-field-shell` div:
   - Move `rounded-[24px]` into the shared (always-on) class string.
   - Remove `rounded-full` from the inactive branch.
   - Remove `border-radius` from the `motion-safe:transition-[...]` list so only `background-color,border-color,padding,gap` transition.
2. Leave grid height, opacity, header height/padding, and exit-cache logic untouched.

## Boundaries

- Do NOT touch `color-editor.tsx`, `control-container.tsx`, or `color-shift-app.tsx`.
- Do NOT change durations, easing, or the exit `rendered` / cache behavior.
- Do NOT add dependencies or GSAP.
- Do NOT replace the shell with a different expand pattern (FLIP, scale, etc.).
- If the closed button height is no longer `h-12` (48px) when you open the file, STOP — `24px` only equals a pill when height is `48px`.

## Verification

- **Mechanical**: `npx tsc --noEmit` (or the repo’s existing typecheck) — expect clean. Lint the edited file.
- **Feel check**:
  - Click Background, then Foreground, then Esc. At 10% playback in the Animations panel, the shell must never show a stadium wider-than-card radius mid-open; corners stay visually ~24px the whole time while height and tint change.
  - Collapsed row must still read as a pill (fully rounded ends), not a rounded rectangle with flat sides.
  - Toggle `prefers-reduced-motion: reduce` — radius still correct (static); height/opacity motion drops via existing `motion-safe:` classes.
- **Done when**: open and close morphs keep a constant 24px radius; collapsed and expanded end states match Figma (pill vs card) with no intermediate sausage.
