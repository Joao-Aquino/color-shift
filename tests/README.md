# Browser and focused regression tests

Run the deterministic tests from the repository root:

```sh
node tests/theme.test.cjs
node tests/collapsible-presence.test.cjs
node tests/responsive-layout-motion.test.cjs
```

For the Phase 5 integration test, start a production preview on port 3001:

```sh
npx next build --webpack
npm run start -- --hostname 127.0.0.1 --port 3001
```

In another terminal, with Playwright available and Google Chrome installed:

```sh
node tests/phase5-browser.test.cjs
node tests/ui-annotations.browser.cjs
```

If Playwright is provided by an external runtime, set `PLAYWRIGHT_MODULE` to
its absolute module path. `COLOR_SHIFT_TEST_URL` overrides the preview URL.
The integration test intentionally uses the production preview so development
overlays do not intercept the mobile controls.

The browser test supplies deterministic photo API responses but loads a real
local bitmap through the app's image and palette pipeline. It checks themes,
storage failure, ten widths, theme padding/progressive footer, responsive
action groups on the specimen and photo, six actions, focus,
clipboard, Markdown download, short viewports, reduced motion, and circle
geometry and reduced transparency. Screenshots are written to `/tmp/color-shift-*.png`.

Editor reveal checks cover both color fields and all five formats at 393 x 852
in both themes and motion preferences, the oversized-panel fallback at 320 x 320,
and unchanged desktop page scroll at 2520 x 1314.

The annotation suite checks the shared 74px editor label column in all five
formats at widths 2520/640/393/320, mobile action tooltips at 393/320,
Figma colors and original arrow assets in both themes, neighboring button clicks,
and preserved desktop tooltip placement. It uses the same runtime/preview
environment variables and writes screenshots under `/tmp/color-shift-*.png`.

These checks do not emulate a physical software keyboard or device safe-area
insets. Confirm those on iOS Safari and Android Chrome before mobile release.

## Coordinated editor reveal (2026-10-03)

`phase5-browser.test.cjs` also runs `mobile-editor-reveal.browser.cjs`.
The helper records app scroll writes and frame geometry to verify that actual
scrolling overlaps expansion at 393 x 852. It covers Escape after the first
scroll write, pending-photo unmount/listener cleanup, visible raw field switches,
rapid keyboard reversal, trusted wheel/touch cancellation, footer/format/viewport
changes, renewed activation, live reduced motion, input-focus protection,
desktop-to-mobile entry and mobile/tablet reentry, and oversized manual scrolling.

Frame traces, timestamped Chrome frames and settled Dark/Light screenshots are
written to `/tmp/color-shift-007`; `COLOR_SHIFT_TEST_ARTIFACT_DIR` overrides that
directory. Combined original-checkout validation passed: webpack build with
TypeScript, lint, all deterministic tests, the annotation suite and the complete
Phase 5 suite exited 0 with no browser console errors. The combined reveal trace
shows movement at 57.1ms before settlement at 190.5ms; evidence is preserved in
`/tmp/color-shift-007-combined`. Physical keyboard and safe-area checks remain pending.
