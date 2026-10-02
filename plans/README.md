# Animation plans

Plans from `improve-animations`. Execute with an agent (`improve-animations execute <plan>` or hand the plan file to Agent mode).

| # | Title | Severity | Status |
|---|---|---|---|
| 001 | Snap ColorField shell to a single border-radius | HIGH | DONE |
| 002 | Shorten score odometer to UI duration budget | HIGH | DONE |
| 003 | IconButton named transitions + press scale | MEDIUM | DONE |
| 004 | Score threshold accordion (CSS interim) | MEDIUM | DONE |
| 005 | Fix EXPORT trigger progress + entrance motion | HIGH | DONE |
| 006 | Ease responsive layout changes | MEDIUM | PARTIAL |

## Execution order

1. `001-color-field-radius-morph.md` — done
2. `002-odometer-duration.md` — done
3. `003-icon-button-press.md` — done
4. `004-score-threshold-accordion.md` — done (interim; Phase 7 Flip may replace)
5. `005-export-button-motion.md` — done
6. `006-responsive-layout-motion.md` - implemented; continuous-drag retargeting needs follow-up

## Notes

- Product roadmap lives in `plan/` (singular). These motion plans live in `plans/` (plural) so they stay separate.
- DialKit development controls and a focused responsive GSAP Flip hook are already present. Phase 7 still owns photo crossfade, TubeText, specimen squish/pop, and broader layout polish.
- `improve-animations` only writes plans; it does not edit app source. Implement via `improve-animations execute plans/005-export-button-motion.md` or Agent mode with that file.
