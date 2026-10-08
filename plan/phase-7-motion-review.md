# Phase 7 — final caret and motion review

2026-10-08. Inspected the current implementation after PR #6 and the real-resize ColorField update (#9). Applied `figma-design-to-code`, `find-animation-opportunities` and `review-animations`. The image error-banner opportunity remains a proposal. The user subsequently requested animated description wrapping and keyboard animation parity; those are implemented in this follow-up.

## Specimen caret implemented

Figma `Fu0DGoLsLeY6wj7oLr5cVh`, frame `3416:366`, caret `3416:378`: 14px wide and 202px high at a 240px font size. The decorative caret preserves these ratios as automatic text fitting changes font size and inherits the selected foreground color.

First pointer activation or keyboard focus places the insertion point at the end. Later clicks, arrow keys, native range selection, paste and text editing retain the textarea's native behavior. Hidden mirror measurement positions the caret across wrapping, empty text and trailing newlines. The mirror/caret are aria-hidden and cannot capture pointer events. Selection hides the decorative caret; composition and forced-colors use the native caret. Reduced motion keeps the caret stationary. Escape and blur hide it.

## Opportunities

| # | Location | Today | Purpose | Frequency | Suggested motion |
| --- | --- | --- | --- | --- | --- |
| 1 | `components/control-bar/score-description.tsx` | A one/two-line description used to change occupied space instantly | Spatial consistency and preventing a jarring change | Occasional grade/wrapping changes | Implemented: measured height transition over 200ms using the shared States easing (default easeOutQuart). Text is not scaled; interruption starts at the rendered height. Mobile reveal receives layout-motion frames. Reduced motion settles immediately. |
| 2 | `components/color-shift-app.tsx:699` and `:706` | Image import/fetch error banners mount and unmount instantly | Feedback and preventing a jarring change | Rare; only on an error | Enter: opacity 0→1 and translateY(-4px)→0 over 200ms; exit: opacity 1→0 and translateY(0)→-4px over 150ms, both using existing `--ease-out` (cubic-bezier(0.23,1,0.32,1)). Interruptible presence; keep Retry/dismiss immediately usable. Reduced motion: opacity only over 150ms. Keyboard dismissal uses the same transition, per the user’s subsequent request. |

### Deliberately rejected

- Specimen typing/font fit (`components/specimen.tsx`) — functional text input; delaying cursor or glyph placement would hinder reading and editing. Keep position and fitting immediate.
- HEX/readout/slider numbers (`components/control-bar/tube-text.tsx`, `color-readout.tsx`) — the approved numeral animation scope is WCAG/APCA; extra moving data would add distraction.
- Photo action buttons (`components/control-bar/icon-button.tsx`) — already have subtle 0.97 press scale over 160ms and photo transition feedback. No extra bounce or icon rotation.
- Copy/download feedback (`components/control-bar/export-controls.tsx:58`) — already swaps its icon/label with a 200ms entrance. No missing feedback gap.
- Photo loading — crossfade and the tiny placeholder already bridge loading. The previously discarded loading effect is not proposed again.

### Verdict

The core interactions already have sufficient motion. The description wrapping transition requested by the user is implemented. The remaining optional addition is the image error-banner transition, an occasional state that currently appears abruptly. Suggested handoff: `improve-animations plan image error-banner transitions`.

## Keyboard policy — explicit user override

The animation skills recommend immediate keyboard actions. The user explicitly
requested the same animations for keyboard and pointer actions on 2026-10-08.
This preference supersedes the skill rule and the earlier keyboard refinement.

| Before | After | Why |
| --- | --- | --- |
| Theme T/Enter bypassed the wipe | Pointer click, T, Enter and Space share the theme animation path | Explicit user request for parity; native text editing remains protected |
| Theme controls did not reveal their shortcut | Both pills show “Toggle theme T” tooltips and aria-keyshortcuts=T | Make the available shortcut discoverable |

**Decision:** approve the requested description/caret/keyboard changes under the
user's explicit motion preference. Reduced motion, interruptions and unavailable
API fallbacks remain honored.

## Shortcut tooltip design

Applied Figma `3396:988` to every existing shortcut tooltip. Boxes have a 1px border, 4px radius, 2px padding and inherited Geist 13px/16px typography. Phosphor Command/Control icons adapt Undo/Export to the platform and sit beside Z/S in one box; arrow shortcuts use 16px icons. Dark/Light spacing and border tokens match the design. Accessible button labels remain intact; action controls expose aria-keyshortcuts.

## Validation

- Lint and webpack production build with TypeScript.
- Dedicated Chrome caret regression: first/later click, keyboard focus, insertion, arrows, selection, Escape, wrapping, emoji, trailing newline and empty text across 1440/640/393/320px widths.
- Chrome synthetic composition fallback, forced-colors and reduced-motion behavior.
- Screenshots in `/tmp/color-shift-specimen-caret`; physical IME/mobile device behavior has not been exercised in this test.

- Final Chrome suites passed: action-shortcuts, ui-annotations, theme-wipe, Phase 7 and complete Phase 5/mobile reveal, plus score-description and specimen-caret. Checks include both theme directions from keyboard, repeat protection, Fix parity, export keyboard focus and Command/Control icons.
