# 002 — Shorten score odometer to UI duration budget

- **Status**: DONE
- **Commit**: e91e58c
- **Severity**: HIGH
- **Category**: Easing & duration
- **Estimated scope**: 1 file, tiny

## Problem

Score odometer defaulted to `duration: 1` (1s). Under slider drag, retarget restarted a full second of roll on every update — outside the UI budget (&lt;300ms).

```ts
/* lib/odometer.ts — was */
duration: 1,
digitStagger: 0.04,
revealDuration: 0.5,
```

## Target

```ts
duration: 0.22,
digitStagger: 0.02,
revealDuration: 0.2,
ease: "power3.out", // unchanged
```

## Steps

1. Update `defaults` in `lib/odometer.ts` as above.
2. Leave `odometer.tsx` and kill/retarget / reduced-motion paths unchanged.

## Verification

- Drag a color slider: score digits keep up without a ~1s hang.
- Photo nav still shows a short readable roll.
