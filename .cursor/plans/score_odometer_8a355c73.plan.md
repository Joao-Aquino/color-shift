---
name: Score odometer
overview: Add the Osmo number odometer to the contrast score and the editor value fields, including while a slider is dragging, by porting the programmatic updater and retargeting an in-flight roll instead of rebuilding it from corrupted text.
todos:
  - id: port-odometer
    content: "Add gsap and a client odometer module: Osmo helpers, logical-string retarget, reduced motion, Odometer span"
    status: completed
  - id: wire-score
    content: Replace the score TubeText number with Odometer; keep grade static and name the button accessibly
    status: completed
  - id: wire-inputs
    content: Overlay Odometer on channel inputs and the format readout; hide it only while the field is focused
    status: completed
isProject: false
---

# Odometer on score and editor values

The Osmo resource rolls each digit down a vertical strip. Non-digits (`.`, `#`, `%`, hex letters) stay put. Use that behavior on the contrast number and the editor readouts. Do not use the scroll/`ScrollTrigger` path — these values change from app state, not viewport entry.

## Where it goes

- Score number in [`components/control-bar/score.tsx`](components/control-bar/score.tsx) (`TubeText` showing `3.51` / `72.3`). The grade label stays static.
- Channel value in [`components/control-bar/color-slider.tsx`](components/control-bar/color-slider.tsx) (the `w-14` input).
- Format readout in [`components/control-bar/color-readout.tsx`](components/control-bar/color-readout.tsx) (HEX and the other formats).

Background/Foreground rows stay on the current plain `TubeText`. Phase 7’s 3D TubeText does not also run on these three spots.

## Why the stock updater cannot be called on every drag tick

`updateOdometer` reads `el.textContent` as the start value. Mid-roll, that text is the whole `0…9` strip, not the visible number. A pointermove would restart from garbage.

Adaptation, only for that case: remember the logical string per element. If the next string has the same digit/static pattern, leave the rollers in the DOM and retarget each GSAP `y` from its current position toward the new digit (still forward-only, same `digitCycles: 2`, `power3.out`, `duration: 1`, right-to-left `digitStagger: 0.04`). Rebuild the roller DOM only when the pattern changes (`9.9` → `10.0`, or a new prefix). On rebuild, write the logical string back before parsing — never parse the strip.

`prefers-reduced-motion`: set the final text and skip the tween (same rule as the resource’s scroll path, and the style guide).

## Inputs stay editable

An `<input>` cannot hold the roller spans. Keep the real input for focus, typing, paste, and Enter/Escape. Lay a `pointer-events-none` odometer over it. While idle, the input text is transparent and the odometer shows the formatted value. On focus, hide the odometer and show the draft. On blur, show the odometer again and roll from the pre-edit string to the committed one.

The odometer is `aria-hidden`. The input keeps its `aria-label` and `value`. The score button gets an accessible name from the formatted score plus grade so the roller strip is not announced.

## Files

- Add `gsap` (npm, not the CDN). No ScrollTrigger.
- New client module for the ported helpers plus the retarget path, and a small `Odometer` span that sets the first value with no roll (so opening the editor or switching HEX/RGB/… does not count up from zero) and animates after that.
- CSS from the resource (`[data-odometer-element]`, mask, roller, static) in [`app/globals.css`](app/globals.css). Skip `.odometer-h1`. Existing type sizes stay (`text-[56px]` on the score, `text-xs` on the fields).
- Wrap the score odometer in the current `flex-1` span so the resource’s width tween does not pull the grade badge inward.

Hex letters do not roll (`B0` only rolls `0`). That is the resource: only `\d` is a digit.
