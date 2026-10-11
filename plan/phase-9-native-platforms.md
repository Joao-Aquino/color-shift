# Color Shift — Phase 9 Spec

*Status: In progress — native foundation initialized in `Joao-Aquino/color-shift-apple` on 2026-10-11*
*Written: 2026-09-26. Renumbered from Phase 8 to Phase 9 on 2026-10-07 (Phase 8 is now loose ends & hardening).*

## Goal

Bring the same two-color specimen + WCAG/APCA scoring experience to native platforms, with platform-specific color capture input.

## What gets built (proposed)

### iOS — Planned
- Unsplash photos and user-selected Photo Library images as inputs.
- Same two-color specimen + WCAG/APCA scoring as web.
- Reuses the web photo API routes and runs color/contrast logic natively in a shared Swift package.
- Built in Swift/SwiftUI.
- Skippable video for web-only students (this is a teaching product — see `specs-context/spec-color-shift.md` "Teaching Value").

### macOS — Planned
- Menu bar app with popover.
- Screen color picker (`NSColorSampler`).
- Same two-color specimen + WCAG/APCA scoring.
- Built in Swift/SwiftUI, native performance.
- Skippable video for web-only students.

## App Store and Unsplash Production Access

**Goal:** Ship the iOS app to the App Store for public distribution (see Phase 10 for the full App Store submission process).

**Prerequisite:** Unsplash production access (addressed in Phase 8). The native app must follow the Unsplash API guidelines: proxy all API calls through the web server route (never embed the access key in the native app), track photo downloads via `links.download_location`, and display photographer/Unsplash attribution with UTM links. Production access approval covers both web and native apps.

**Privacy Policy:** Phase 8 includes a privacy policy covering both web and iOS app data practices. The current policy assumes no third-party analytics or crash reporting SDKs (only Apple's native crash reports, which are user opt-in). If any third-party analytics or crash reporting SDK (e.g., Crashlytics, Sentry) is added during development or post-launch, the privacy policy and App Store Connect App Privacy questionnaire MUST be updated before that release.

## Open questions to resolve before building
- Repository: resolved. Native development lives in `Joao-Aquino/color-shift-apple`; this repository retains the cross-project roadmap and product specification.
- Shared color/contrast logic: resolved. Port WCAG/APCA scoring to a shared Swift package and verify parity against golden values from the TypeScript implementation.
- Ordering: resolved. Native development can begin while Phase 8 awaits Unsplash production approval. Approval remains required before public release.

## Explicitly out of scope for Phase 9
- Camera capture on iOS.
- Feature parity with every web phase on day one — start with the core specimen + scoring experience, Photo Library/Unsplash input on iOS, and screen-picker input on macOS.
- App Store submission and launch logistics — handled in Phase 10.

## Done means
- The iOS app can load an Unsplash photo or a user-selected library image, derive a two-color pair, render the specimen, and report WCAG/APCA scores matching the web implementation's golden fixtures.
- Unsplash requests and tracking go through the web server routes; no Unsplash credential ships in the app.
- The macOS target provides a menu-bar experience and `NSColorSampler` input using the same shared contrast core.
- Unit tests cover the shared scoring core and the primary app state transitions.

Phase 10 covers App Store enrollment, metadata, privacy policy, TestFlight, submission, and release.
