# Color Shift — Style Guide

---

## Design DNA

The design DNA will come from the design system from Vercel called [Geist](https://vercel.com/geist/introduction), using [https://ui.shadcn.com/](https://ui.shadcn.com/) as source, and we need to use as many components as we can, but keep it simple and minimal as a principle.

---

## Core Principle

**The colors ARE the interface.** The tool doesn't show you colors. It puts you inside them. The specimen block is not a preview. It is the experience.

---

## Layout

### Specimen and Photo Panels

- Two large panels side by side, beside the sidebar. Rounded corners and page padding (Figma V6); no borders.
- Specimen: background color fills the panel. Foreground color renders "Aa" (or user-typed text) at massive scale, centered.
- The specimen is the hero. It dominates. Everything else serves it.
- Photo credit sits bottom-right on the photo: "Photographer, Unsplash", both linked.
- On mobile (Phase 5): specimen takes more vertical space (65-70%) and the sidebar becomes a bottom sheet.

### Sidebar (~320px, left)

- Lives on dark neutral chrome beside the panels.
- Sections stacked top to bottom, separated by whitespace and hairline dividers only where they separate functional groups.
- Order: logo + theme toggle | score tile (WCAG | APCA) | background and foreground rows | editor panel (when open) | action row | EXPORT.

---

## Color: The Chrome

### Dark Mode (default)

- Chrome background: #0A0A0A to #141414 range (near-black, not pure black)
- Text: muted white, ~60% opacity for labels, ~80% for values, 100% for WCAG badge
- Borders: only where they separate functional groups, ~8% white opacity
- Interactive elements: subtly lighter than background on hover (~12-15% white)
- The dark chrome makes the specimen colors pop. The contrast between the immersive specimen and the recessed controls is the visual hierarchy.

### Light Mode

- Chrome picks up a tint from the active background color
- Not pure white. Warm, slightly colored, responsive to the current palette.
- Text: dark, same opacity hierarchy as dark mode but inverted
- The specimen still dominates. Light mode is softer, the boundary between specimen and controls is less stark.

### Transitions Between Modes

- Smooth crossfade. No jarring snap. The chrome morphs.

---

## Typography

### Specimen

- "Aa" or user input at 200px+ on desktop. Scales down proportionally on mobile.
- Font: [https://fonts.google.com/specimen/Geist](https://fonts.google.com/specimen/Geist)
- Centered in the specimen block. Generous vertical centering. Floats in the color.

### Sidebar — Values

- Monospace for ALL numeric values: hex codes, RGB values, HSL values, OKLCH values, contrast ratio, slider numbers, threshold markers.
- Small size. Precise. Technical but not cold.

### Sidebar — Labels

- Clean sans-serif. Smaller than values. Muted opacity.
- Labels like "Background", "Foreground", "H", "S", "B" are functional, not decorative.
- The score tile is the most prominent element in the sidebar: a large monospace value with a grade badge, on a tinted tile.

### Hierarchy Rule

- Maximum 2 type sizes in the sidebar, plus the large score numeral as the single exception. Weight, opacity, and monospace/sans distinction create all remaining hierarchy.
- The Aa specimen is the only large type on the screen.

---

## Spacing

- Generous within the sidebar. Groups breathe.
- Tight within groups (hex pair + swap are close together, sliders are close together).
- Whitespace separates groups, not lines or dividers.
- Alignment to a baseline grid. Values line up. Labels line up.
- The specimen has no internal padding (the color goes edge to edge). The "Aa" sits centered with optical balance, not mathematical centering.

---

## Interactive Elements

### Color Rows and Editor

- Two rows, BACKGROUND and FOREGROUND: uppercase label left, monospace hex and swatch chip right, row tinted from its color.
- Clicking a row opens the editor panel for that color; clicking the other row switches it. Clicking outside the panel or pressing `Esc` closes it (no close button).
- The panel has five format tabs (HEX, RGB, HSL, HSB, OKLCH) that set both the sliders and the readout row.
- Sliders: three per-channel sliders with a labeled row, a gradient track at the current value of the other channels, and an editable number at the right end. No 2D picker, no alpha.
- Readout row: monospace, editable, paste any valid format and it auto-converts.

### Action Row

- Order: previous · undo · shuffle · swap · fix (wrench) · next, followed by the full-width EXPORT button.
- Swap flips foreground and background (animation TBD: simple masking + X/Y transforms likely). Shuffle is the discoverable fallback for Space. Fix snaps to the closest passing color at the selected threshold.

### Icon Controls

- Icons use Phosphor.
- Default icon weight is `regular`; use `fill` only for active or selected states.
- Use 16px icons for compact controls, 20px for primary toolbar buttons, and reserve 24px for larger touch/mobile controls.
- Icon-only controls require accessible labels, visible focus states, and non-color-only active/selected/disabled states.

### Score Tile

- Tabs WCAG | APCA (with info icons) select the algorithm. Large monospace value, grade badge, and a per-grade description.
- Every grade has its own state (AAA, AA, AA Large, Fail), from the Figma state components. Passing grades are never red; Fail is visually distinct. The badge is text, so meaning never depends on color alone.
- Clicking the tile expands the threshold row: 1.5 / 3.0 / 4.5 / 7.0 (APCA: 30 / 45 / 60 / 75). The active threshold (closest to the current score) is highlighted. Clicking one bumps the active color to that level with the minimal lightness change. This is the UseContrast DNA.

### Export (Copy + Download)

- A full-width EXPORT button at the bottom of the sidebar. Clicking it swaps the action row for COPY and DOWNLOAD .MD.
- Copy: all formats + WCAG data to clipboard. Download: markdown file with the same data.

---

## Animation

### Color Transitions

- When regenerating: smooth morph between old and new colors. Not a hard cut.
- Spring physics or ease-out curve. The colors settle into place.
- Duration: ~300-500ms. Fast enough to feel responsive, slow enough to feel intentional.

### Swap

- Foreground and background cross. Simple mask or translate.
- The Aa text and the background trade places.

### Slider Dragging

- Immediate. Zero perceptible delay between drag and specimen update.
- The specimen is a live preview, always reflecting the current slider state.

### Photo Mode Transition

- Photo loads in. Animated dissolution or extraction. Colors emerge from the photo and settle into the two-color specimen.
- The transition should feel like the tool is "reading" the photo and distilling it.

### General

- Smooth. Polished. Spring physics where appropriate.
- Animations are flair. They communicate quality. This is a Shift Nudge product.
- Respect prefers-reduced-motion.

---

## What This Is NOT

- Not clinical. Not a science tool with a UI bolted on.
- Not busy. Not a dashboard with 12 panels.
- Not trendy. No glassmorphism, no floating cards, no heavy gradients, no scattered accent colors. (Rounded panels are structural, not decorative.)
- Not generic. This should feel like it was designed by someone who has been thinking about color tools for a decade. Because it was.

---



## The Feel, In One Sentence

A premium instrument for color, where the specimen is the experience and everything else disappears.

---

*Created: 2026-03-25. Layout revised 2026-09-29 (sidebar, Figma V6).*
