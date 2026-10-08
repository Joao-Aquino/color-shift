# Browser and focused regression tests

Run the deterministic tests from the repository root:

```sh
npm test
```

Record physical-device and browser checks using [device-browser-log.md](device-browser-log.md).

For the Phase 5 integration test, start a production preview on port 3001:

```sh
npx next build --webpack
npm run start -- --hostname 127.0.0.1 --port 3001
```

In another terminal, with Playwright available and Google Chrome installed:

```sh
node tests/phase5-browser.test.cjs
node tests/phase6-browser.test.cjs
node tests/phase7-browser.test.cjs
node tests/ui-annotations.browser.cjs
```

If Playwright is provided by an external runtime, set `PLAYWRIGHT_MODULE` to
its absolute module path. `COLOR_SHIFT_TEST_URL` overrides the preview URL.
The integration test intentionally uses the production preview so development
overlays do not intercept the mobile controls.
Run the browser suites sequentially so competing Chrome processes do not distort
short animation timing measurements.

The browser test supplies deterministic photo API responses but loads a real
local bitmap through the app's image and palette pipeline. It checks themes,
storage failure, ten widths, theme padding/progressive footer, responsive
action groups on the specimen and photo, six actions, focus,
clipboard, Markdown download, short viewports, reduced motion, and specimen text fitting, reduced transparency, and recovery after an initial photo API failure.
Screenshots are written to `/tmp/color-shift-*.png`.

`phase6-browser.test.cjs` checks the Figma drag state at mobile and desktop widths, including the original upload asset, inset, blur, guidance, and temporarily hidden credit/actions. It drops a real local bitmap through the photo panel,
checks palette readiness, navigation, personal-photo export, invalid-file
errors, and recovery when the initial photo API fails. It also checks custom
specimen text, shortcut isolation, direct editing/caret behavior, and mobile/desktop
rendering.
It also checks rapid drag exit/reentry without remounting the target and the
opacity-only reduced-motion behavior.

`phase7-browser.test.cjs` verifies direct specimen editing, native caret retention,
automatic font fitting and the absence of an editor box or Aa/circle toggle.
It covers resolved Figma Light button/export colors, photo crossfade/rapid
navigation, slider easing versus immediate dragging, score-only numeral motion,
export cleanup, mobile reveal and live reduced motion. Rendered transforms and
settled editor height confirm ColorField/score scale changes and cleanup. Screenshots are written to `/tmp/color-shift-phase7`.
Development DialKit exposes Phase 7 timing, sidebar States → Easing (default
easeInOutQuart) and score numeral timing; production omits the panel.

Editor reveal checks cover both color fields and all five formats at 393 x 852
in both themes and motion preferences, the oversized-panel fallback at 320 x 320,
and unchanged desktop page scroll at 2520 x 1314.

The annotation suite checks the shared 74px editor label column in all five
formats at widths 2520/640/393/320, mobile action tooltips at 393/320,
Figma colors and original arrow assets in both themes, neighboring button clicks,
and preserved desktop tooltip placement. It uses the same runtime/preview
environment variables and writes screenshots under `/tmp/color-shift-*.png`.

These automated checks do not emulate a physical software keyboard or device
safe-area insets. On 2026-10-03, the user reported that physical-device checks
passed; the device, OS, and browser matrix was not recorded here.

## Coordinated editor reveal (2026-10-03)

`phase5-browser.test.cjs` also runs `mobile-editor-reveal.browser.cjs`.
The helper records app scroll writes and frame geometry to verify that actual
editors scale open and are revealed at 393 x 852. It covers Escape during the first
scroll write, visible raw field switches,
rapid keyboard reversal, trusted wheel/touch cancellation, footer/format/viewport
changes, renewed activation, live reduced motion, input-focus protection,
desktop-to-mobile entry and mobile/tablet reentry, and oversized manual scrolling.

Frame traces, timestamped Chrome frames and settled Dark/Light screenshots are
written to `/tmp/color-shift-007`; `COLOR_SHIFT_TEST_ARTIFACT_DIR` overrides that
directory. Combined original-checkout validation passed: webpack build with
TypeScript, lint, all deterministic tests, the annotation suite and the complete
Phase 5 suite exited 0 with no browser console errors. The combined reveal trace
shows movement at 57.1ms before settlement at 190.5ms; evidence is preserved in
`/tmp/color-shift-007-combined`. Physical keyboard and safe-area checks were
pending at that checkpoint; see the later user-reported result above.

## Theme wipe

`theme-wipe.browser.cjs` checks the supplied horizontal clip-path reveal at
700ms, synchronous React theme snapshots, both theme directions, capture/reveal
interruption, state/focus preservation, reduced motion, keyboard activation/T,
external storage, mobile resize, unavailable APIs and blocked storage.
Screenshots are written to `/tmp/color-shift-theme-wipe`. Use the same runtime
and preview environment variables as above.

The previous curtain component and its browser suite remain available on local
branch `codex/theme-curtain`, commit `4ac7b422a326`.

Desktop action geometry checks await three consecutive frames at the final
viewport with responsive transforms cleared, avoiding measurement before the
queued breakpoint Flip starts.

## Sidebar easing controls

`motion-devtools.browser.cjs` targets the development server (default localhost:3000),
where DialKit is available. It selects States → Easing, measures the actual
quartic and linear scale curves on ColorFields and score, and checks reload
persistence. Production suites check interrupted scale cleanup and mobile reveal.

Theme wipe directions are destination-specific: Dark reveals left → right;
Light reveals right → left.

## Specimen caret

`specimen-caret.browser.cjs` verifies first-click/focus-at-end behavior, free
subsequent caret placement, native selection and text navigation, proportional
Figma caret dimensions and alignment during automatic font fitting. It covers
empty/wrapped/trailing-newline/emoji text at desktop, tablet and mobile widths,
synthetic composition fallback, forced colors and reduced motion. Screenshots
are written to `/tmp/color-shift-specimen-caret`. Use the Chrome runtime and
`COLOR_SHIFT_TEST_URL` settings above.

## Score description wrapping

`score-description.browser.cjs` samples one/two-line wrapping to verify measured
height progression, unchanged text scale and continuous movement of following
controls. It covers reversal cleanup and live reduced motion. The theme-wipe
suite now verifies T/Enter animation parity, rapid keyboard reversal, repeat
protection and the shortcut tooltip.

## Boxed shortcut tooltips

`ui-annotations.browser.cjs` checks Figma shortcut box dimensions, typography,
Dark/Light borders and spacing, Phosphor icons, Command/Control platform
selection, theme T and mobile tooltip bounds at 393/320px. Screenshots include
`/tmp/color-shift-tooltip-command-dark.png`, its Light counterpart and
`/tmp/color-shift-tooltip-theme.png`. The caret suite also protects explicit
selection/replacement when focusing an unfocused textarea.

`action-shortcuts.browser.cjs` checks F correction/click parity, typing protection,
repeat/disabled state, Undo and Cmd/Ctrl+S export opening, focus, Escape, repeat
and reduced-motion behavior. The annotation suite additionally verifies
transparent numeric inputs and Light selected-format tokens in all formats.

## Theme-directed photo generation

`theme-pair.test.cjs` checks 162 light/dark combinations, including saturated,
neutral and identical colors: polarity, background/foreground tone bounds,
minimum WCAG contrast and immutable input/palette preservation.
`themed-photos-api.test.cjs` checks theme/default query construction, original
tracking/display quality, allowed theme values and count limits without API keys.
`themed-photos.browser.cjs` verifies actual pixel selection against misleading
metadata, failed-thumbnail priority/fallback, click/Space parity, history,
in-flight theme changes and mobile generation. Screenshots:
`/tmp/color-shift-themed-light.png` and `/tmp/color-shift-themed-dark.png`.
`unsplash-tracking.browser.cjs` checks that a completed Unsplash copy sends the
returned `download_location` through the tracking route and that a personal-photo
export does not call Unsplash.
