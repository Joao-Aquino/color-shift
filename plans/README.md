# Animation plans

Plans from `improve-animations`. Execute with an agent (`improve-animations execute <plan>` or hand the plan file to Agent mode).

| # | Title | Severity | Status |
|---|---|---|---|
| 001 | Snap ColorField shell to a single border-radius | HIGH | DONE |
| 002 | Shorten score odometer to UI duration budget | HIGH | DONE |
| 003 | IconButton named transitions + press feedback | MEDIUM | DONE |
| 004 | Score threshold accordion (CSS interim) | MEDIUM | DONE |
| 005 | Fix EXPORT trigger progress + entrance motion | HIGH | DONE |
| 006 | Ease responsive layout changes | MEDIUM | DROPPED |
| 007 | Coordinate and interrupt mobile editor reveal | MEDIUM | DONE |
| 008 | Polish mobile EXPORT drawer motion | MEDIUM | DONE |

## Execution order

1. `001-color-field-radius-morph.md` — done
2. `002-odometer-duration.md` — done
3. `003-icon-button-press.md` — done
4. `004-score-threshold-accordion.md` — done (interim; Phase 7 Flip may replace)
5. `005-export-button-motion.md` — done
6. `006-responsive-layout-motion.md` - dropped; dedicated breakpoint motion removed
7. `007-coordinate-mobile-editor-reveal.md` - done; coordinated reveal and interruption verified after integration, preserving the existing CSS editor morph
8. `008-polish-mobile-export-drawer-motion.md` - done; asymmetric mobile footer exit/return with an opacity-only reduced-motion path

## Notes

- Product roadmap lives in `plan/` (singular). These motion plans live in `plans/` (plural) so they stay separate.
- DialKit development controls and the Phase 7 animations remain. The separate responsive GSAP Flip hook from Plan 006 was removed.
- Phase 7 is complete: sidebar state changes use real box resizing with easeOutQuart, 0.3s enter and 0.25s exit timing; Export uses the same timing.
- Phase 8 is nearly complete. Unsplash production approval is the only pending item; the application was submitted on 2026-10-11.
- `improve-animations` only writes plans; it does not edit app source. Implement via `improve-animations execute plans/005-export-button-motion.md` or Agent mode with that file.
