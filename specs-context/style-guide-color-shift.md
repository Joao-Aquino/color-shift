# Color Shift — Style Guide

---

## Design DNA

The design DNA will come from the design system from Vercel called [Geist](https://vercel.com/geist/introduction), using [https://ui.shadcn.com/](https://ui.shadcn.com/) as source, and we need to use as many components as we can, but keep it simple and minimal as a principle.

---

## Core Principle

**The colors ARE the interface.** The tool doesn't show you colors. It puts you inside them. The specimen block is not a preview. It is the experience.

---

## Layout

### Specimen Block (top 55-60% of viewport)

- Full-bleed, edge to edge. No border-radius. No border. No visible padding around the color.
- Background color fills the entire block.
- Foreground color renders "Aa" (or user-typed text) at massive scale, centered.
- The specimen is the hero. It dominates. Everything else serves it.
- On mobile: specimen takes more vertical space (65-70%). Controls collapse below.

### Control Strip (bottom 40-45%)

- Lives beneath the specimen on dark neutral chrome.
- Horizontally organized groups, separated by whitespace (not dividers).
- Compact. Dense information, generous spacing between groups.
- Groups in order: hex pair + swap | WCAG badge + ratio + threshold markers | sliders | export

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

### Control Strip — Values

- Monospace for ALL numeric values: hex codes, RGB values, HSL values, OKLCH values, contrast ratio, slider numbers, threshold markers.
- Small size. Precise. Technical but not cold.

### Control Strip — Labels

- Clean sans-serif. Smaller than values. Muted opacity.
- Labels like "Background", "Foreground", "H", "S", "B" are functional, not decorative.
- WCAG badge (AAA, AA, AA+, Fail) is the most prominent element in the control strip: slightly larger, bolder, possibly with a subtle background shape.

### Hierarchy Rule

- Maximum 2 type sizes in the control strip. Weight, opacity, and monospace/sans distinction create all remaining hierarchy.
- The Aa specimen is the only large type on the screen.

---

## Spacing

- Generous within the control strip. Groups breathe.
- Tight within groups (hex pair + swap are close together, sliders are close together).
- Whitespace separates groups, not lines or dividers.
- Alignment to a baseline grid. Values line up. Labels line up.
- The specimen has no internal padding (the color goes edge to edge). The "Aa" sits centered with optical balance, not mathematical centering.

---

## Interactive Elements

### Hex Values

- Editable on click. Hover shows text cursor.
- Click the format label beneath (HEX, RGB, HSL, HSB, OKLCH) to cycle through formats.
- Paste any valid color format. Auto-detect and convert.

### Swap Button

- Between the two hex values. Bi-directional arrows.
- Click flips foreground and background.
- Animation: TBD (simple masking + X/Y transforms likely).

### Threshold Markers (1.5, 3.0, 4.5, 7.0)

- Horizontal segmented row.
- The active threshold (closest to current ratio) is visually highlighted.
- Up/down chevrons bump the color to the next threshold.
- This is the UseContrast DNA: tap up, color shifts just enough to pass. Minimal change, maximum impact.

### HSB Sliders

- Two groups: Background and Foreground.
- Three sliders each: H (0-360), S (0-100), B (0-100).
- Numeric value visible at each end or beside the slider.
- Real-time specimen update as you drag. No lag.
- Slider track could be colored (hue slider shows the spectrum, saturation slider shows gray-to-saturated, brightness slider shows dark-to-light).

### Generate Button

- Subtle, not primary. Shuffle or dice icon. Small.
- The real generate action is spacebar. The button is the discoverable fallback.

### Export (Copy + Download)

- Small icons, side by side.
- Copy: all formats + WCAG data to clipboard.
- Download: markdown file with same data.
- Positioned at the bottom of controls. Not prominent. Functional.

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
- Not trendy. No glassmorphism, no floating cards, no heavy gradients, no scattered accent colors.
- Not generic. This should feel like it was designed by someone who has been thinking about color tools for a decade. Because it was.

---



## The Feel, In One Sentence

A premium instrument for color, where the specimen is the experience and everything else disappears.

---

*Created: 2026-03-25*