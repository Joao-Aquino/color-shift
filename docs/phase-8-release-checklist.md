# Phase 8 release checklist

## Unsplash production access

On 2026-10-08, a single authenticated `GET /photos/random?count=1` returned HTTP 200 with `X-Ratelimit-Limit: 50` and 49 requests remaining. This confirms the current Demo limit. It does not prove that every earlier 403 was caused by rate limiting; the app now distinguishes exhausted quota using the response header and also handles 429.

The web app displays images directly from `photo.urls`: the full image and tiny placeholder use `next/image` with `unoptimized`, so the browser requests the Unsplash URL instead of `/_next/image`. The app attributes the photographer and Unsplash with UTM links, and calls `links.download_location` through the server when a user copies or downloads a color export based on an Unsplash photo. That endpoint records a use event; the app does not offer an image-file download. The API key remains server-side. Personal photo imports do not trigger Unsplash tracking.

The Unsplash examples cover inserting, setting or remixing a photo; they do not expressly discuss a color palette extracted from a photo. We use the explicit copy/download of that palette as the tracking point. Describe this exact flow in the production application and ask Unsplash whether they expect the event earlier (for example, when a user chooses a photo for color extraction). If they do, move the tracking point before approval.

Application draft for the Unsplash developer account:

- **Title:** Color Shift
- **Description:** Color Shift is a photo-driven color and contrast tool. People explore abstract Unsplash photographs, extract a two-color pair, adjust it, compare WCAG 2 and APCA scores, and export the color values with photo credit. Users can also import their own photos locally. Images are hotlinked from Unsplash; visible credit links to the photographer and Unsplash. The app records a photo use event when a user copies or downloads a color export derived from that photo. It does not download image files.
- **Website:** https://colorshift.co-opstudio.com
- **Screenshots to attach:** Desktop and mobile views with a photo plus visible photographer/Unsplash credit; export panel and resulting Markdown credit; optional browser Network view showing the tracking request. Capture these from the deployment that includes the Phase 8 changes.

The tracking code was verified on the Phase 8 preview on 2026-10-08. Submit from the account that owns the access key, describe the palette-export tracking point to Unsplash, and record submission and approval dates here. The native app in Phase 9 must keep the same proxy, attribution, hotlinking and tracking behavior.

## Phase 8 preview verification

On 2026-10-08, the protected branch preview `color-shift-git-codex-phase-8-hardening-co-op-studio.vercel.app` (deployment `dpl_8Me76KdDAQCZhF3vysaSfZB8fwJN`, commit `2f1a671`) was opened in an authenticated browser. A photo and a replacement photo both loaded directly from `images.unsplash.com` at 2400 px width; visible credit linked the photographer and Unsplash with the expected UTM parameters. Random photo selection, previous-photo history, and Light/Dark switching worked.

The export offered Copy and Download .MD, with no image-file action. The downloaded Markdown contained the selected colors, contrast scores, and photographer/Unsplash attribution. Vercel request logs showed two `POST /api/photos/download` responses with HTTP 204 after the copy and Markdown download. The route returns 204 only after the Unsplash `download_location` request succeeds. The preview console reported no errors or warnings during this session. This verifies the published flow; Unsplash production approval and the exact interpretation of palette-use tracking remain pending.

## Dependency audit

On 2026-10-08, the browser palette pipeline was rebuilt from the four browser-only Vibrant packages, removing `node-vibrant`, its unused Node/Jimp backend, and the `file-type` advisory. The app used only six variants from `shadcn/tailwind.css`; those variants now live in `app/globals.css`, and the `shadcn` CLI and its dependency chain were removed. The full audit fell from 14 findings (9 high, 5 moderate) to 5 high findings, all in the development-only chain `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`. `npm audit --omit=dev` reports zero findings and now runs in CI.

The [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) affects every published `braces` version through 3.0.3 and lists no patched version. npm proposes downgrading `eslint-config-next` to 14.2.35, which is incompatible with this Next 16 app and would weaken its lint coverage. Retain the current Next lint configuration, keep glob patterns controlled by the repository rather than user input, and revisit this development-tool-only chain when upstream publishes a patch. Do not describe the full audit as clean.

## Manual repository tasks

- John: delete already-merged remote branches `codex/phase-6`, `codex/fix-initial-photo-retry`, `codex/document-phase6-browser-tests`, and `cursor/update-domain-metadata-246c`.
- John: change the GitHub repository homepage to https://colorshift.co-opstudio.com.

## Validation still needed

- Verify CI on a pull request and on `main` after this branch is reviewed and merged.
- After the dependency replacements, the themed-photo, Phase 5, Phase 6, Phase 7 and Unsplash tracking Chrome suites passed on the branch with no browser console errors. Lint, deterministic tests, TypeScript and the webpack production build also passed. The local Turbopack build still hits the environment's process/port restriction; verify the CI build on the PR and smoke-test the merged production deployment.
- Physical-device testing was confirmed by João on 2026-10-08 and recorded in `tests/device-browser-log.md` as user-reported evidence without device/version details.
- Plan 006 was dropped by product decision on 2026-10-08; its dedicated responsive motion code was removed while Phase 7 animations remain.
