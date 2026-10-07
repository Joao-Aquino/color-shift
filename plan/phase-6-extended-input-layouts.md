# Color Shift — Phase 6 Spec

*Status: Implemented and browser-verified 2026-10-06*
*Written: 2026-09-26. Renumbered from Phase 7 to Phase 6 on 2026-09-27 (Animation Polish moved to the end).*

## Goal

Add ways to use a personal photo and test custom text in the existing specimen.

## What gets built (proposed)

### 1. Photo drag-and-drop
- Hidden/discoverable feature (not labeled in UI): drop an image onto the photo area to extract colors from your own photo, same node-vibrant pipeline as Unsplash photos.
- Web in Phase 6; carry this input forward to the native macOS app in Phase 8.

### 2. Editable Aa text
- Type custom text into the specimen to test real content instead of the default "Aa".

## Explicitly out of scope for Phase 6
- Native camera capture (iOS-specific, Phase 8)
- Figma MCP export (stretch, see `stretch.md`)

## Done means
Drop a custom image onto the photo area and see its extracted colors → type custom text into the specimen to test the color pair with real content.

## Implementation notes
- Dropped JPEG, PNG, WebP, AVIF, and GIF files up to 20 MB use the browser-side palette extraction pipeline and join the photo navigation history. Their object URLs remain available while the app is open and are revoked on unmount.
- The edit control opens an inline textarea. Custom text persists while browsing photos, and Escape exits editing. The Aa/circle toggle remains available.
- Local photo credits and Markdown export identify the image as personal without creating Unsplash links.
- The drag state follows Figma Source Photograph variant `3409:1053`: inset dashed target, blurred translucent backdrop, original upload icon, supported-format guidance, and temporarily hidden photo credit/actions.
- The drop target uses reversible 200ms entry/150ms exit transitions on opacity and scale, with a short icon/text stagger. Reduced motion keeps only opacity.
