# Color Shift — Phase 6 Spec (Draft)

*Status: Draft — not yet discussed/approved in detail*
*Written: 2026-09-26. Renumbered from Phase 7 to Phase 6 on 2026-09-27 (Animation Polish moved to the end).*

## Goal

Add the secondary discovery/layout modes and inputs beyond the core Unsplash-driven split-screen — features the original spec marks "Planned" rather than describing in full build detail.

## What gets built (proposed)

### 1. Scrollable layout mode
- Second layout option: color + photo pairs stack vertically in a scrollable gallery, instead of the single split-screen pair.
- Details TBD in design phase — original spec explicitly defers the design of this.

### 2. Photo drag-and-drop
- Hidden/discoverable feature (not labeled in UI): drop an image onto the photo area to extract colors from your own photo, same node-vibrant pipeline as Unsplash photos.
- Web + macOS.

### 3. Editable Aa text
- Type custom text into the specimen to test real content instead of the default "Aa".

### 4. Rotating specimen fonts
- Each photo gets a different typeface for the specimen (20 fonts total), Aa-only glyphs loaded (~1–2KB each) to keep this cheap.
- Supersedes Phase 1's Geist-only specimen font.

## Explicitly out of scope for Phase 6
- Native camera capture (iOS-specific, Phase 8)
- Figma MCP export (stretch, see `stretch.md`)

## Done means
Switch to the scrollable gallery layout and browse stacked color+photo pairs → drop a custom image onto the photo area and see its extracted colors → type custom text into the specimen → notice each photo carries a different specimen typeface.
