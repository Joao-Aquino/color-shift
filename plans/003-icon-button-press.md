# 003 — IconButton named transitions + press scale

- **Status**: DONE
- **Commit**: e91e58c
- **Severity**: MEDIUM
- **Category**: Performance / Physicality
- **Estimated scope**: 1 file, tiny

## Problem

Action-row `IconButton` inherited shadcn `Button` `transition-all` and `active:translate-y-px`.

## Target

Override on `components/control-bar/icon-button.tsx` only (do not edit `components/ui/button.tsx`):

- `transition-[border-color,background-color,opacity,transform]`
- `duration-[160ms]`
- `ease-[cubic-bezier(0.23,1,0.32,1)]`
- `active:translate-y-0 motion-safe:active:scale-[0.97]`

## Steps

1. Add the override classes to the `Button` `className` in `IconButton`.
2. Keep border/hover/disabled/tooltip as-is.

## Verification

- Press an action icon: subtle squash, no 1px nudge down.
- Hover still changes border/background smoothly.
