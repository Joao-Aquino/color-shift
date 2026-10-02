---
name: Export button chrome
overview: Match the EXPORT trigger’s hover, focus, and press treatment to the control-bar icon buttons, while keeping the loading fill and the open/close swap with the copy and download actions.
todos:
  - id: align-export-chrome
    content: Update the EXPORT trigger classes in export-controls.tsx to match IconButton hover, focus ring, 160ms transition, and 0.97 press scale
    status: completed
isProject: false
---

# Match EXPORT button to icon-button chrome

The EXPORT trigger in [`components/control-bar/export-controls.tsx`](components/control-bar/export-controls.tsx) is a raw button. The swap control in [`components/control-bar/icon-button.tsx`](components/control-bar/icon-button.tsx) is the reference.

## What changes

On the closed-state EXPORT button only, replace the interaction classes with the icon-button set:

- Hover: `hover:border-[var(--color-chrome-border-strong)]` plus the existing raised background
- Focus: `outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]` in place of the dashed inset outline
- Press: `motion-safe:active:scale-[0.97]` in place of `scale-[0.99]`
- Motion: `duration-[160ms]` and `transition-[border-color,background-color,opacity,transform]` with the same ease curve

Keep export-only behavior:

- Progress fill while `phase === "loading"`
- Fade-in when the trigger returns after the action row closes
- `disabled:cursor-wait` during loading, and `opacity-30` when export is unavailable

Copy and download stay as they are. The progress bar, payload flow, and Escape-to-close stay as they are.
