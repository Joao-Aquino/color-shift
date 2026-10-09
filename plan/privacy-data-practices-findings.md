# Color Shift — Data Practices Investigation Findings

**Date:** 2026-10-09  
**Purpose:** Document actual data practices found in the codebase for privacy policy creation and App Store submission.

## Investigation Summary

This document records the complete investigation of Color Shift's data collection, storage, and third-party service usage. All findings are based on code review and verified against the actual implementation.

---

## Third-Party Services

### 1. Unsplash API
**Purpose:** Fetching random photos for color extraction

**Implementation:**
- Server-side API calls via `lib/photos/unsplash.ts` and `/api/photos` route
- Access key stored in `UNSPLASH_ACCESS_KEY` environment variable (server-side only, never exposed to client)
- UTM tracking parameters added to photographer/photo URLs (`utm_source=color_shift`, `utm_medium=referral`)
- Download tracking implemented via `/api/photos/download` route (calls Unsplash's `links.download_location` endpoint)
- Images hotlinked directly from `images.unsplash.com` CDN (not stored on Color Shift servers)

**Data sent to Unsplash:**
- Photo request parameters: count (number of photos), theme (light/dark), orientation (landscape), content filter (high)
- Download tracking: photo ID and download location URL (sent server-side when user exports/downloads a color pair)

**Data NOT sent:**
- No user-identifiable information
- No IP addresses from Color Shift (Unsplash may log requests from our server)
- No tracking cookies

**Files:**
- `lib/photos/unsplash.ts` (API client, download tracking)
- `app/api/photos/route.ts` (photo fetch endpoint)
- `app/api/photos/download/route.ts` (download tracking endpoint)
- `lib/photos/client.ts` (client-side API wrapper)
- `components/control-bar/export-controls.tsx` (calls `trackPhotoUse` on export)

**Unsplash Privacy Policy:** https://unsplash.com/privacy

---

### 2. Vercel (Hosting)
**Purpose:** Web hosting and serverless functions

**Implementation:**
- Next.js app deployed on Vercel
- Server-side API routes (`/api/photos`, `/api/photos/download`)
- Standard Vercel infrastructure (CDN, edge network, serverless runtime)

**Data logged:**
- Standard web server logs (IP addresses, user agents, request timestamps, response codes)
- Console logs from API routes (error messages, Unsplash API failures)
- Next.js build and runtime logs

**Data NOT logged:**
- User photos (never uploaded to server)
- Color values or user-generated content
- No custom analytics or tracking

**Files:**
- `next.config.ts` (Next.js configuration)
- All files under `app/api/` (server-side API routes)

**Vercel Privacy Policy:** https://vercel.com/legal/privacy-policy

---

### 3. Fonts (Self-Hosted)
**Typefaces:** Geist and Geist Mono

**Implementation:**
- Fonts loaded via Next.js's `next/font/google` system, which downloads fonts at build time and self-hosts them
- Fonts are served from the application's own domain (no runtime requests to Google)
- Fonts applied via CSS custom properties (`--font-geist-sans`, `--font-geist-mono`)

**Data sent to external services:**
- ❌ None — fonts are self-hosted and served from Color Shift's own domain
- ❌ No requests to Google Fonts servers at runtime
- ❌ No tracking or analytics from font loading

**Files:**
- `app/layout.tsx` (font imports via `next/font/google`)
- `app/globals.css` (font family declarations)

**Note:** While `next/font/google` downloads fonts from Google Fonts during the build process, the fonts are bundled with the application and served from the same domain at runtime. Users' browsers never communicate with Google's servers for font delivery.

---

## Local Data Storage

### 1. Theme Preference (localStorage)
**Key:** `color-shift-theme`

**Purpose:** Persist user's light/dark mode choice across sessions

**Storage location:** Browser localStorage (client-side only)

**Values:** `"light"` or `"dark"` (defaults to `"dark"` if not set)

**Data transmission:** Never leaves the user's device

**User control:** Cleared by clearing browser localStorage or site data

**Files:**
- `lib/theme.ts` (read/write theme preference)
- `lib/use-theme.ts` (React hook for theme management)
- `app/layout.tsx` (theme bootstrap script)

---

### 2. DialKit Motion Settings (localStorage, development only)
**Keys:** 
- `dialkit-state-color-shift-phase-7` (motion timing preferences)
- `dialkit-state-color-shift-odometer` (odometer animation preferences)

**Purpose:** Persist animation debugging settings during development

**Storage location:** Browser localStorage (client-side only)

**Production builds:** These settings are NOT present in production builds (DialKit UI only renders when `process.env.NODE_ENV === "development"`)

**Data transmission:** Never leaves the user's device

**Files:**
- `components/motion-devtools.tsx` (DialKit UI, development only)
- `lib/motion.ts` (motion constants and utilities)
- `lib/odometer.ts` (odometer timing constants)

---

## User-Generated Content

### Photos
**Source:** 
1. Unsplash API (fetched from server)
2. User file uploads (drag-and-drop, file picker, or paste)

**Processing:** 
- User-uploaded photos: Browser creates a local object URL (`URL.createObjectURL`) that references the file on the user's device
- Photos are processed entirely client-side using browser APIs
- Color extraction via `node-vibrant` library (runs in browser using the local object URL)
- Image decoding, canvas rendering, and color analysis all happen on the user's device

**Storage:** 
- Photos are NOT uploaded to Color Shift servers
- Photos are NOT stored in localStorage or IndexedDB
- User-uploaded photos exist only as local object URLs in memory during the current session
- Object URLs are revoked when the component unmounts or the page is closed

**Transmission:** 
- User-uploaded photos never leave the user's device (processed via local object URLs)
- Unsplash photos are loaded directly from `images.unsplash.com` (not proxied through Color Shift servers)

**Files:**
- `components/color-shift-app.tsx` (line 273: `URL.createObjectURL(file)`, lines 275-310: local photo handling)
- `lib/color/vibrant-browser.ts` (client-side color extraction)
- `components/photo-transition.tsx` (photo display and drag-drop)
- `lib/photos/client.ts` (Unsplash photo fetching)

---

### Specimen Text
**Purpose:** User can edit the specimen text ("Aa" by default) to test contrast with different characters

**Processing:** 
- Text editing happens entirely client-side
- Text is NOT stored (resets on page refresh)
- Text is NOT transmitted to servers

**Files:**
- `components/specimen.tsx` (specimen text editor)

---

## Exported Data

### Markdown Export
**Purpose:** User can copy or download a markdown file with color values, contrast scores, and photo attribution

**Content:** 
- Background/foreground colors (HEX, RGB, HSL, HSB, OKLCH formats)
- WCAG 2 and APCA contrast scores
- Photo attribution (photographer name, Unsplash link with UTM parameters)

**Transmission:** 
- Copy: uses browser's Clipboard API (`navigator.clipboard.writeText`)
- Download: creates a client-side blob and triggers browser download (no server involvement)

**Server-side effect:** 
- When user copies or downloads a color pair using an Unsplash photo, triggers Unsplash download tracking via `/api/photos/download` (required by Unsplash API guidelines)
- This sends a POST request to the Unsplash API with the photo ID and download location URL (server-side only, no user data)

**Files:**
- `lib/export.ts` (markdown generation)
- `components/control-bar/export-controls.tsx` (lines 197, 224: calls `trackPhotoUse` on copy/download)
- `lib/photos/client.ts` (line 26-34: `trackPhotoUse` function)
- `app/api/photos/download/route.ts` (server-side download tracking endpoint)

---

## Analytics and Tracking

**Current status:** 
- ❌ No Vercel Analytics
- ❌ No Vercel Speed Insights
- ❌ No Google Analytics
- ❌ No crash reporting (Sentry, Crashlytics, etc.)
- ❌ No error tracking services
- ❌ No custom telemetry or metrics

**Dependencies checked:**
- `package.json` has NO analytics or tracking packages
- `app/layout.tsx` has NO analytics scripts or tracking pixels
- Server routes (`app/api/`) have NO custom logging beyond console.error for debugging

**Files:**
- `package.json` (dependencies list)
- `app/layout.tsx` (root layout, no analytics)

---

## Cookies

**Current status:** 
- ❌ No cookies set by Color Shift
- ❌ No session cookies
- ❌ No authentication cookies
- ❌ No tracking cookies

**Third-party cookies:**
- Unsplash, Vercel, and Google Fonts may set their own cookies as part of their services
- Color Shift does not control or access these cookies

---

## iOS App Considerations (Phase 9/10)

### Planned iOS-Specific Permissions

#### Photo Library Access
**Purpose:** User can select a photo from their library for color extraction

**Permission:** `NSPhotoLibraryUsageDescription` (iOS permission prompt)

**Data handling:**
- Selected photos processed on-device (same as web)
- Photos NOT uploaded to servers
- Photos NOT stored in app data

#### Camera Access (if implemented)
**Purpose:** User can capture a photo with camera for color extraction

**Permission:** `NSCameraUsageDescription` (iOS permission prompt)

**Data handling:**
- Captured photos processed on-device
- Photos NOT uploaded to servers
- Photos NOT stored in app data

### iOS Data Practices
All data practices described above apply to the iOS app:
- Same Unsplash API integration (proxied through server)
- Same local storage (theme preference stored in UserDefaults or similar)
- Same "no analytics" policy (unless crash reporting is added)

### Open Question: Crash Reporting
If crash reporting (e.g., Crashlytics, Sentry) is added to the iOS app, it MUST be declared in:
1. Privacy policy
2. App Store Connect App Privacy questionnaire
3. iOS app's permission prompts (if applicable)

---

## App Store Privacy Questionnaire (Phase 10)

### Data Types to Declare

#### Photos
- ✅ **Collected:** No (user-selected, but not transmitted or stored by Color Shift)
- ✅ **Purpose:** Color extraction (on-device processing)
- ✅ **Linked to user:** No
- ✅ **Tracking:** No

#### Usage Data
- ✅ **Collected:** No (no analytics, no crash reporting as of now)
- **Note:** If crash reporting is added, this becomes YES

#### Identifiers
- ✅ **Collected:** No (no device IDs, no advertising IDs, no user accounts)

### Data NOT Collected
- Contact Info (email, phone, address)
- User Content (messages, audio, video)
- Browsing History
- Search History
- Location
- Contacts
- Health & Fitness
- Financial Info
- Purchase History
- Diagnostics (unless crash reporting is added)

---

## Summary for Privacy Policy

### What we DO
1. Fetch photos from Unsplash API (server-side)
2. Process photos on-device for color extraction using local object URLs
3. Store theme preference locally in browser localStorage
4. Track Unsplash photo usage when user copies/downloads color pairs (required by Unsplash API guidelines)
5. Host on Vercel (standard web infrastructure)
6. Self-host Geist typefaces (downloaded at build time, served from our domain)

### What we DON'T DO
1. ❌ Collect personal information
2. ❌ Require accounts or authentication
3. ❌ Upload user photos to servers (processed via local object URLs)
4. ❌ Use cookies
5. ❌ Track users with analytics
6. ❌ Store color values or user-generated content
7. ❌ Sell or share data with third parties (beyond Unsplash API usage)
8. ❌ Use advertising or tracking SDKs
9. ❌ Send font requests to Google (fonts are self-hosted)

---

## References

**Key files reviewed:**
- `app/layout.tsx` (root layout, fonts, analytics check)
- `app/api/photos/route.ts` (Unsplash photo fetch)
- `app/api/photos/download/route.ts` (Unsplash download tracking)
- `lib/photos/unsplash.ts` (Unsplash API client)
- `lib/theme.ts` (theme localStorage)
- `components/motion-devtools.tsx` (DialKit, dev-only)
- `package.json` (dependencies)
- `next.config.ts` (Next.js configuration)

**Third-party privacy policies:**
- Unsplash: https://unsplash.com/privacy
- Vercel: https://vercel.com/legal/privacy-policy

---

## Next Steps

1. John reviews this document and confirms accuracy
2. John answers open questions in `plan/privacy-policy-draft.md`
3. Implement `/privacy` route with finalized policy
4. Link privacy policy from web app footer
5. Use URL for App Store Connect submission (Phase 10)
6. Complete App Store Connect App Privacy questionnaire based on this investigation
