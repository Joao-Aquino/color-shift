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
```

If Playwright is provided by an external runtime, set `PLAYWRIGHT_MODULE` to
its absolute module path. `COLOR_SHIFT_TEST_URL` overrides the preview URL.
The integration test intentionally uses the production preview so development
overlays do not intercept the mobile controls.

The browser test supplies deterministic photo API responses but loads a real
local bitmap through the app's image and palette pipeline. It checks themes,
storage failure, nine widths, menu/editor coordination, six actions, focus,
clipboard, Markdown download, short viewports, reduced motion, and circle
geometry. Screenshots are written to `/tmp/color-shift-*.png`.

These checks do not emulate a physical software keyboard or device safe-area
insets. Confirm those on iOS Safari and Android Chrome before mobile release.
