# Color Shift — Phase 10 Spec (Draft)

*Status: Draft — depends on Phase 9 (native iOS/macOS app) and Phase 8 (Unsplash production access)*
*Written: 2026-10-07*

## Goal

Publish the Color Shift iOS app (and optionally macOS) on the Apple App Store for public distribution.

## What gets built

### 1. Apple Developer Program Enrollment
**Why:** Required to distribute apps on the App Store and access signing/provisioning infrastructure.

**Scope:**
- Enroll in the Apple Developer Program as an **individual** (João Aquino, not CO-OP Studio organization) at US$99/year. Individual enrollment allows reusing the developer profile across multiple personal apps without organization constraints.
- **Decision made:** Individual account. The App Store will list João Aquino's personal name as the seller. No D-U-N-S number or organizational verification is required for individual enrollment.

**Done when:** Apple Developer Program membership is active under João Aquino's individual account.

### 2. App Store Connect Configuration
**Why:** App Store Connect is the portal for managing app metadata, builds, and releases.

**Scope:**
- Create App Store Connect app record with unique bundle identifier (e.g., `com.co-opstudio.colorshift`).
- Configure bundle ID in Xcode project to match.
- Set up signing certificates and provisioning profiles (development and distribution).
- Register test devices for development/TestFlight internal testing.

**Done when:** App record exists in App Store Connect; bundle ID and signing are configured; provisioning profiles are valid.

### 3. App Metadata & Discoverability
**Why:** App Store listing content determines discoverability and conversion.

**Scope:**
- **App name:** "Color Shift" (check availability; fallback variants if taken).
- **Subtitle:** Short tagline (e.g., "Two colors. One photo." — max 30 characters).
- **Keywords:** Comma-separated search terms (max 100 characters). Consider: contrast, accessibility, WCAG, APCA, color palette, design tool, photography.
- **Description:** Full-length App Store description covering what it does, teaching value, camera input, contrast scoring, and export. Match the tone of `specs-context/spec-color-shift.md`.
- **Promotional text:** Optional 170-character updatable marketing copy (can change without app review).
- **Category:** Primary (e.g., Graphics & Design or Developer Tools) + optional secondary.
- **Age rating:** Complete the App Store Connect questionnaire. Likely 4+ (no objectionable content).

**Done when:** All text fields are finalized and entered in App Store Connect; category and age rating are set.

### 4. Screenshots & App Preview
**Why:** Visuals are the primary conversion driver on the App Store.

**Scope:**
- **Screenshots:** Required for multiple device sizes (6.9", 6.7", 6.5", 5.5" iPhone; 13" and 12.9" iPad if supporting iPad). Show camera capture, specimen + scoring, color editing, export. Follow App Store Screenshot specifications.
- **App icon:** 1024×1024 PNG, no transparency, no alpha channel. Must match in-app icon. Design consistent with Color Shift visual identity.
- **App preview video (optional):** 15–30 second demo video showing core workflow. Must use actual app footage; no third-party content. Follow App Store App Preview specifications.

**Done when:** Screenshots are captured/designed for all required device sizes; app icon is finalized; optional app preview video is created (if pursuing). All assets are uploaded to App Store Connect.

### 5. Privacy Policy & App Privacy Details
**Why:** Required by App Store Review Guidelines and user transparency.

**Scope:**
- **Privacy policy URL:** Prerequisite completed in Phase 8. The privacy policy is hosted at `colorshift.co-opstudio.com/privacy` and covers data collection, Unsplash API usage, on-device photo processing, and third-party services. The policy already addresses both web and iOS app practices, including Apple's native crash reports.
- **App Privacy nutrition labels:** Complete App Store Connect's App Privacy questionnaire consistently with the Phase 8 privacy policy. Declare:
  - **Photos:** User-selected photos from library are processed on-device; not collected, not transmitted to Color Shift servers.
  - **Unsplash API requests:** Proxied through server; no user-identifiable data sent; access key remains server-side.
  - **Diagnostics:** No third-party crash reporting or analytics SDKs. Apple's native crash reports are platform-level (user opt-in via iOS settings) and not declared as "data collected by the app."
  - **Usage Data / Identifiers:** None collected.
- **Important:** If any third-party analytics or crash reporting SDK is added post-launch, the privacy policy and App Privacy questionnaire MUST be updated before that release.
- Ensure accuracy: privacy labels are user-facing and binding; inaccuracies risk rejection or post-launch enforcement action.

**Done when:** App Privacy labels are completed accurately in App Store Connect, matching the Phase 8 privacy policy (no data collection, no tracking).

**Note:** The privacy policy page is implemented and linked from the web app as part of Phase 8, item 8.

### 6. Third-Party Content & Attribution Compliance
**Why:** Unsplash API guidelines require attribution; App Store Review validates licensing and third-party content compliance.

**Scope:**
- Verify in-app attribution for Unsplash photos matches guideline requirements (photographer name, "Unsplash" link with UTM parameters) as implemented in Phase 9.
- Confirm download tracking (`links.download_location`) is functional and server-side.
- Ensure Unsplash production access is approved (Phase 8 prerequisite) before submission.
- Prepare reviewer notes in App Store Connect explaining Unsplash integration, attribution, and compliance if helpful for review.

**Done when:** In-app attribution and download tracking are verified; Unsplash production access is confirmed; reviewer notes (if needed) are prepared.

### 7. App Review Guidelines Risk Check
**Why:** Proactively address common rejection reasons before submission.

**Scope:**
- **Minimum Functionality (4.2):** Verify the native app provides value beyond a web wrapper. Native camera capture, `NSColorSampler` on macOS, platform-specific UI, and offline color logic (if ported natively) differentiate it from the web app.
- **User Interface (4.0):** Follow Human Interface Guidelines; ensure native controls, gestures, and platform conventions.
- **Performance (2.3):** Test app launch time, responsiveness, memory usage, battery impact on actual devices.
- **Permissions (5.1.1):** If accessing Photos or Camera, provide clear purpose strings (`NSPhotoLibraryUsageDescription`, `NSCameraUsageDescription`).
- **Data Use & Privacy (5.1):** Match privacy policy and labels; no undisclosed data transmission.
- **Legal (5.0):** Verify all third-party content (Unsplash photos) is properly licensed and attributed.

**Done when:** App is tested against relevant guidelines; known risks are mitigated or documented; permissions and purpose strings are in place.

### 8. TestFlight Beta Testing
**Why:** Validate the app on real devices with internal and external testers before public release.

**Scope:**
- **Internal testing:** Distribute to up to 100 App Store Connect users (team members). No App Review required; immediate access after build processing.
- **External testing:** Distribute to up to 10,000 external testers via email or public link. Requires App Review for first build per version; subsequent builds in the same version auto-distribute.
- Collect feedback on camera capture, scoring accuracy, export workflow, and any crashes or edge cases.
- Iterate on bugs and UX issues; upload new builds as needed.

**Done when:** Internal testing is complete; external beta (if pursued) has cycled through at least one round of feedback; app is stable and ready for submission.

### 9. Submission & Review
**Why:** Final gate before public availability.

**Scope:**
- Select a build in App Store Connect, complete all metadata fields, and submit for review.
- Monitor App Store Connect for status updates: Waiting for Review → In Review → Pending Developer Release (if approved) or Rejected (if issues found).
- If rejected: address feedback, upload a new build or update metadata, resubmit.
- **Phased release (optional):** Enable phased release to roll out the app to a percentage of users over 7 days, reducing risk of widespread issues.

**Done when:** App is approved by App Review and either released immediately or held for manual release.

### 10. Post-Launch Operations
**Why:** Maintain app health, collect feedback, and plan updates.

**Scope:**
- **Crash reporting:** Integrate crash reporting SDK (e.g., Crashlytics, Sentry) or use Xcode Organizer for crash logs. Monitor and fix critical crashes.
- **Ratings prompt:** Use `SKStoreReviewController` to request ratings at appropriate times (e.g., after successful export, not on first launch). Follow App Store guidelines (max 3 prompts per year per device).
- **Versioning:** Follow semantic versioning (e.g., 1.0.0, 1.1.0, 2.0.0). Increment appropriately for bug fixes, features, breaking changes.
- **Support URL:** Provide a support URL in App Store Connect (e.g., `colorshift.co-opstudio.com/support`) with FAQs, contact info, and known issues.
- **Update cadence:** Plan for regular updates with bug fixes, new features, and iOS compatibility (e.g., annual iOS major version support).

**Done when:** Crash reporting is active; ratings prompt is implemented; versioning and support infrastructure are in place; post-launch monitoring begins.

## macOS Mac App Store (Optional)
If pursuing macOS distribution through the Mac App Store:
- Same metadata, privacy, and review requirements as iOS.
- macOS-specific screenshots and app preview.
- macOS app sandboxing and entitlements (stricter than iOS in some areas).
- Universal Binary (Apple Silicon + Intel) or Apple Silicon-only decision.
- TestFlight for Mac available for beta testing.

**Decision needed:** Distribute macOS via Mac App Store, direct download from website, or both?

## Explicitly out of scope for Phase 10
- In-app purchases or subscriptions (app is free/one-time purchase; monetization not yet defined).
- Localization (launch in English first; additional languages are a future phase).
- Apple Watch, Apple TV, or visionOS versions.

## Done means
- Apple Developer Program enrollment is complete (account type decided).
- App Store Connect app record is configured with bundle ID, signing, and provisioning.
- All metadata (name, description, keywords, category, age rating) is finalized.
- Screenshots, app icon, and optional app preview are designed and uploaded.
- Privacy policy is hosted and App Privacy labels are complete.
- Unsplash attribution and download tracking are verified (Phase 8 prerequisite met).
- App Review guidelines risk check is complete; known issues are addressed.
- TestFlight beta testing is complete (at least internal testing).
- App is submitted, approved, and released on the App Store.
- Post-launch crash reporting, ratings prompt, versioning, and support infrastructure are operational.

The iOS app is live on the App Store and available for public download.
