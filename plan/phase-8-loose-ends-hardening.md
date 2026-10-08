# Color Shift — Phase 8 Spec

*Status: In progress — implementation on `codex/phase-8-hardening`; see `docs/phase-8-release-checklist.md` for results and remaining work.*
*Written: 2026-10-07*

## Goal

Harden the existing web implementation by filling infrastructure gaps, addressing known issues, and bringing documentation up to production standards. This phase collects loose ends deferred during Phases 1–6 before finalizing the web app for release.

## What gets built

### 1. Continuous Integration
**Why:** No automated checks currently block regressions or enforce code quality on pull requests.

**Scope:**
- GitHub Actions workflow running on pull requests and pushes to `main`.
- Job steps: `npm run lint`, `next typegen` followed by `tsc --noEmit --incremental false`, `next build`, and `npm test` (the deterministic test suite).
- Add `npm test` script to `package.json` that runs the deterministic tests (currently run manually via direct Node invocation).

**Done when:** Pull requests display passing/failing CI status; the workflow runs on every push; all four checks (lint, types, build, tests) execute successfully on clean `main`.

**Note:** `tsc` currently requires `next typegen` to run first; the workflow must preserve this order.

### 2. Unsplash Production Access
**Why:** The Unsplash API is currently in demo mode (50 requests/hour). Intermittent 403 responses noted in `progress.md` are likely rate-limit failures. Production access raises the limit and is required before public release — John intends to ship the iOS app to the App Store, which requires production Unsplash access.

**Scope:**
- Confirm the current access tier and 403 root cause (demo-tier rate limits).
- Implement missing API guideline requirements per https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines:
  - **Hotlinking images** — already done.
  - **Attribution with UTM links** — already done in `lib/photos/unsplash.ts`.
  - **Download tracking** — **not yet implemented.** When a user effectively uses a photo (likely when a color pair is exported, copied, or downloaded — implementer should verify the best trigger against the guidelines), call the photo's `links.download_location` endpoint server-side via the API route to keep the access key private. This is scoped as a standalone task within this item.
- Apply for production access with accurate app title, description, and screenshots showing attribution/hotlinking in action.
- Improve client-side error handling: better retry logic, user-facing messages distinguishing rate-limit failures from other API errors.
- Consider response caching to reduce API call volume during development.

**Done when:** Download tracking is implemented and verified; production access is applied for with complete guideline compliance; improved error handling is in place.

**Note:** The native iOS/macOS app (Phase 9) must follow the same guidelines: proxy API calls through the server route (never embed the key in the native app), track downloads, and show attribution. Production access approval covers both web and native apps.

### 3. Dependency Updates & Security
**Why:** `npm audit` reports 13 vulnerabilities (8 high severity), mostly via `node-vibrant`'s transitive dependencies (`sharp`, `jimp`, `braces`, `source-map-js`). Minor package updates are also available (Next.js 16.4.0, React 19.3.0, Radix UI 1.7.0, and others).

**Scope:**
- Update direct and transitive dependencies to their latest compatible versions.
- Run `npm audit` and address reported vulnerabilities through updates or documented risk acceptance if no fix is available.
- Test the updated dependency stack: lint, TypeScript, production build, deterministic tests, and a focused browser regression covering core workflows (photo extraction, color editing, export, theming, mobile layout).

**Done when:** Dependencies are updated on a branch, `npm audit` shows zero or only accepted/documented vulnerabilities, and all validation steps pass. Changes are merged after review.

### 4. Responsive Resize Easing (Plan 006)
**Why:** Plan 006 (responsive resize easing) is marked PARTIAL in `progress.md`. Continuous drag-resize cancels the layout animation, so the intended easing is barely visible. The feature is incomplete as designed.

**Scope:**
- Revisit the continuous-resize cancellation issue: investigate GSAP Flip retargeting or alternative motion approaches that preserve easing during live window resize.
- Either complete the feature as originally intended (visible easing during all resize interactions), or formally drop it and document the decision.
- If dropped, remove or simplify the related code in `lib/use-responsive-layout-motion.ts` and update the plan status and `progress.md`.

**Done when:** Resize easing works as intended across all resize interactions, **or** the feature is formally dropped with updated documentation and cleaned-up code.

### 5. README Rewrite
**Why:** The current `README.md` is unmodified `create-next-app` boilerplate and does not describe the actual project.

**Scope:**
- Replace boilerplate with a real README covering:
  - **What it is:** Brief description of Color Shift (photo-driven contrast tool, two-color extraction, WCAG/APCA scoring).
  - **Setup:** Clone, `npm install`, `UNSPLASH_ACCESS_KEY` environment variable (`.env.local` template or instructions).
  - **Scripts:** `npm run dev`, `npm run build`, `npm start`, `npm run lint`, `npm test`.
  - **Tests:** Note the deterministic test suite location (`tests/*.cjs`) and browser-based validation approach.
  - **Deployment:** Current production URL (https://colorshift.co-opstudio.com) if appropriate, or Vercel deployment instructions.
- Match the repo's existing tone: clear, direct, no marketing fluff.

**Done when:** `README.md` accurately describes the project, setup steps, and available scripts. A new contributor can clone, configure `UNSPLASH_ACCESS_KEY`, and run the app from the README alone.

### 6. Repository Housekeeping
**Why:** Four already-merged branches remain in the remote repository, and the GitHub repo homepage link points to a dead deployment URL.

**Scope (manual tasks for John; document but do not execute):**
- **Delete merged branches:** `codex/phase-6`, `codex/fix-initial-photo-retry`, `codex/document-phase6-browser-tests`, `cursor/update-domain-metadata-246c`. These are confirmed merged and safe to delete from the remote.
- **Fix repository homepage link:** Update the GitHub repository settings to point to the live production URL (https://colorshift.co-opstudio.com) instead of the old `color-shift-peach.vercel.app` domain.

**Done when:** This phase document lists the required manual actions. The actual branch deletion and settings change are John's responsibility and are not automated by this phase.

**Note:** Agents implementing this phase should **not** delete branches or modify GitHub repository settings directly. List these tasks as pending manual steps in the phase completion report.

### 7. Device/Browser Testing Documentation
**Why:** Physical-device and browser checks have been reported verbally but not formally recorded in the codebase. Results should be documented for future reference and release certification.

**Scope:**
- Create a testing log or checklist in `tests/` or `docs/` that records:
  - Device/OS/browser combinations tested (e.g., iPhone 15 Pro / iOS 17.5 / Safari, Pixel 8 / Android 14 / Chrome).
  - Key interaction checks: software keyboard behavior, safe-area insets, touch target sizing, photo navigation, color editing, export, theme toggle.
  - Pass/fail status, observed issues, and screenshots or video evidence (if available).
- Backfill known testing outcomes from `progress.md` references (e.g., "physical-device checks passed" entries).
- Establish a reusable template for future device/browser testing sessions.

**Done when:** A device/browser testing document exists, includes backfilled historical results, and provides a template for future test sessions.

### 8. Specification Drift
**Why:** Minor inconsistencies between the original spec (`specs-context/spec-color-shift.md`) and the implemented app have accumulated during Phases 1–6.

**Scope:**
- **Local fonts:** Spec mentions fonts in `src/fonts/`, but the app uses Geist from `next/font`. Update the spec to reflect the actual Geist usage, or clarify the fonts directory is unused.
- **URL typo:** Spec lists "Potential URL: coloshift.co-opstudio.com/color" (missing 'r' in 'coloshift'). Correct to `colorshift.co-opstudio.com` or note it as an alternate/typo.
- **Contrast algorithm description:** One doc describes the contrast adjustment as a "binary search," but the implementation uses a sample sweep + refinement approach. Align the doc with the actual algorithm or correct the implementation reference.
- **APCA grading labels:** APCA scores are presented with WCAG-style "AA" / "AAA" labels. Decide whether this is an intentional design choice (to provide familiar reference points) or spec drift. If intentional, document the rationale in the spec. If drift, update the UI or the spec to align.

**Done when:** All identified spec/implementation inconsistencies are resolved: either the spec is updated to match the implementation, the implementation is corrected, or the design decision is explicitly documented. No open discrepancies remain.

## Explicitly out of scope for Phase 8
- New features (e.g., 2D color picker, swipe navigation, palette-tinted chrome) — those belong to future phases or stretch goals.
- The full GSAP animation polish (Phase 7) — this phase only addresses the incomplete Plan 006 resize easing.
- Native iOS/macOS app (Phase 9) — that remains a separate track.

## Parallel / ordering flexibility
This phase can run in parallel with or before Phase 7 (animation polish). The ordering is left as an open question for John to decide based on priorities. Phase 8 focuses on stability and infrastructure, while Phase 7 is a creative/polish pass; they do not have strong dependencies on each other.

## Done means
- CI workflow is active and passing on `main`.
- Unsplash 403s are investigated, root cause documented, and handling improved.
- Dependencies are updated, `npm audit` is clean or documented, and validation passes.
- Plan 006 is either completed or formally dropped with updated docs.
- README accurately describes the project and setup steps.
- Repository housekeeping tasks are listed for John (branches, homepage link).
- Device/browser testing is documented with backfilled and template content.
- Spec/implementation drift items are resolved and documented.

The web app is production-ready from an infrastructure, stability, and documentation perspective.
