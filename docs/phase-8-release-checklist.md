# Phase 8 release checklist

## Unsplash production access

On 2026-10-08, a single authenticated `GET /photos/random?count=1` returned HTTP 200 with `X-Ratelimit-Limit: 50` and 49 requests remaining. This confirms the current Demo limit. It does not prove that every earlier 403 was caused by rate limiting; the app now distinguishes exhausted quota using the response header and also handles 429.

The web app hotlinks images from `photo.urls`, attributes the photographer and Unsplash with UTM links, and calls `links.download_location` through the server when a user copies or downloads a color export based on an Unsplash photo. The API key remains server-side. Personal photo imports do not trigger Unsplash tracking.

Application draft for the Unsplash developer account:

- **Title:** Color Shift
- **Description:** Color Shift is a photo-driven color and contrast tool. People explore abstract Unsplash photographs, extract a two-color pair, adjust it, compare WCAG 2 and APCA scores, and export the color values with photo credit. Users can also import their own photos locally. Images are hotlinked from Unsplash; visible credit links to the photographer and Unsplash. The app records a photo download event when a user copies or downloads a color export derived from that photo.
- **Website:** https://colorshift.co-opstudio.com
- **Screenshots to attach:** Desktop and mobile views with a photo plus visible photographer/Unsplash credit; export panel and resulting Markdown credit; optional browser Network view showing the tracking request. Capture these from the deployment that includes the Phase 8 changes.

Submit from the account that owns the access key after the tracking code is deployed and verified with a real export. Record submission and approval dates here. The native app in Phase 9 must keep the same proxy, attribution, hotlinking and tracking behavior.

## Dependency audit

On 2026-10-08, compatible dependency updates and `npm audit fix` reduced the report from 16 to 14 vulnerabilities: 9 high and 5 moderate. Remaining high alerts come from `braces` → `micromatch` → `fast-glob` → `@next/eslint-plugin-next` / `eslint-config-next` and `shadcn` tooling. The latest published `braces` is 3.0.3 and npm suggests incompatible tool downgrades. `shadcn` remains necessary for the `shadcn/tailwind.css` import. Remaining moderate alerts come from `file-type` → Jimp → `@vibrant/image-node` → `node-vibrant`. The app imports `node-vibrant/browser`; forcing the proposed `node-vibrant` 3.1.6 downgrade would change the extraction API. These are provisionally accepted until compatible upstream fixes are available. Re-run `npm audit` before release and review advisories if the dependency graph changes.

## Manual repository tasks

- John: delete already-merged remote branches `codex/phase-6`, `codex/fix-initial-photo-retry`, `codex/document-phase6-browser-tests`, and `cursor/update-domain-metadata-246c`.
- John: change the GitHub repository homepage to https://colorshift.co-opstudio.com.

## Validation still needed

- Verify CI on a pull request and on `main` after this branch is reviewed and merged.
- The themed-photo, Phase 5, Phase 6 and Unsplash tracking Chrome suites passed locally on the updated stack. Repeat after deployment if the deployed environment differs.
- Record a new physical-device test session in `tests/device-browser-log.md`.
- Decide whether to complete or drop continuous resize easing (Plan 006); document and implement that decision.
