# 004 — Score threshold accordion (CSS interim)

- **Status**: DONE
- **Commit**: e91e58c
- **Severity**: MEDIUM
- **Category**: Interruptibility / missed opportunity
- **Estimated scope**: 1 file, small

## Problem

`score.tsx` mounted/unmounted `ThresholdButtons` with `{expanded && score ? … : null}` — hard height cut. Phase 7 Flip still deferred.

## Target

Same pattern as ColorField morph:

- Always-present `#contrast-thresholds` grid wrapper
- `grid-rows-[0fr]` ↔ `grid-rows-[1fr]` + opacity
- Open 200ms / close 150ms, `cubic-bezier(0.23, 1, 0.32, 1)`, `motion-safe:`
- Keep content mounted while `expanded || rendered`; clear on `transitionend` of `grid-template-rows`
- Reduced motion: unmount immediately on close

## Steps

1. Add `rendered` state + exit cache in `components/control-bar/score.tsx`.
2. Replace hard conditional with grid accordion wrapping `ThresholdButtons`.
3. Preserve `aria-expanded` / `aria-controls="contrast-thresholds"`.

## Verification

- Toggle score tile: thresholds expand/collapse without layout jump.
- Spam toggle: CSS transition retargets.
- `prefers-reduced-motion: reduce`: instant close.
- No GSAP Flip (Phase 7).
