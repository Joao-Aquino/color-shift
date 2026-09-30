# 005 — Fix EXPORT trigger progress + entrance motion

- **Status**: DONE
- **Commit**: 677d8d9
- **Severity**: HIGH
- **Category**: Performance / Purpose & frequency / Easing & duration / Physicality
- **Estimated scope**: 1 file, small

## Problem

The closed-state EXPORT trigger in `components/control-bar/export-controls.tsx` has three motion problems:

1. **Layout thrash on the loading fill** — the fill animates `width`, which triggers layout + paint:

```tsx
/* components/control-bar/export-controls.tsx:222-226 — current */
<span
  aria-hidden
  className="absolute inset-y-0 left-0 bg-[var(--color-chrome-divider)] transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
  style={{ width: phase === "loading" ? `${progress}%` : "0%" }}
/>
```

2. **Fake loading exceeds the UI duration budget** — `createColorShiftExport` is synchronous, but `openExport` still stages progress over **620ms** before revealing actions. UI motion should stay under **300ms**. Progress / constant motion should also use **linear**, not ease-out:

```tsx
/* components/control-bar/export-controls.tsx:130-137 — current */
setPhase("loading");
setProgress(0);
schedule(() => setProgress(33), 20);
schedule(() => setProgress(94), 280);
schedule(() => {
  setProgress(100);
  setPhase("open");
}, 620);
```

3. **Pure-fade remount** — when the trigger returns after close, it only fades in (nothing in the real world appears from opacity alone):

```tsx
/* components/control-bar/export-controls.tsx:215 — current (entrance fragment) */
motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200
```

Press / hover chrome on this button is already correct (`duration-[160ms]`, `ease-[cubic-bezier(0.23,1,0.32,1)]`, `motion-safe:active:scale-[0.97]`) — do not change those.

## Target

### Progress fill — transform only, linear

```tsx
/* target fill */
<span
  aria-hidden
  className="absolute inset-y-0 left-0 w-full origin-left bg-[var(--color-chrome-divider)] transition-transform duration-200 ease-linear motion-reduce:transition-none"
  style={{
    transform: `scaleX(${phase === "loading" ? progress / 100 : 0})`,
  }}
/>
```

- Full-width element, grow via `scaleX` from `origin-left` (`transform-origin: left`).
- `transition-transform` only (never `width` / `transition-all`).
- Duration **200ms**, easing **`linear`** (progress / constant motion).
- Keep `motion-reduce:transition-none` (reduced-motion path already snaps open in JS).

### Loading schedule — under 300ms total

```tsx
/* target openExport loading branch */
setPhase("loading");
setProgress(0);
schedule(() => setProgress(40), 16);
schedule(() => setProgress(90), 140);
schedule(() => {
  setProgress(100);
  setPhase("open");
}, 260);
```

- Total time to `phase === "open"`: **260ms** (under 300ms UI budget).
- Keep the existing reduced-motion branch that skips loading and opens immediately.
- Keep progress as a 0–100 number; only the schedule timings change.

### EXPORT remount entrance — opacity + scale

On the closed-state EXPORT `<button>` className, replace the entrance fragment with:

```
motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-[0.97] motion-safe:duration-150
```

- Enter with opacity + `scale(0.97)` → `1` (never `scale(0)`).
- Duration **150ms** (tooltips / small UI band: 125–200ms).
- Keep all other button classes (border, hover, focus ring, press scale, disabled) exactly as they are after the chrome pass.

## Repo conventions to follow

- Strong ease-out for UI (already on this button for hover/press): `cubic-bezier(0.23, 1, 0.32, 1)` — do not apply that curve to the progress fill.
- Press feedback exemplar: `components/control-bar/icon-button.tsx` — `duration-[160ms]`, `motion-safe:active:scale-[0.97]`.
- Reduced motion: keep JS skip in `openExport` + `motion-reduce:transition-none` on the fill; keep `motion-safe:` on entrance/press.
- Tailwind `animate-in` / `fade-in` / `zoom-in-*` pattern already used in `components/ui/tooltip.tsx` (`zoom-in-95`). Prefer `zoom-in-[0.97]` here to match press scale language.

## Steps

1. In `components/control-bar/export-controls.tsx`, update the loading fill `<span>` to the target above (`w-full origin-left`, `transition-transform duration-200 ease-linear`, `transform: scaleX(...)`).
2. In the same file, change the three `schedule(...)` delays in `openExport` to `16` / `140` / `260` and the intermediate progress values to `40` / `90` (final still `100`).
3. On the closed-state EXPORT button `className`, replace  
   `motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200`  
   with  
   `motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-[0.97] motion-safe:duration-150`.
4. Do not edit Copy/Download (`ExportAction`), the action-row entrance, payload/clipboard logic, Escape handler, or `SUCCESS_DELAY_MS`.

## Boundaries

- Do NOT touch `components/control-bar/icon-button.tsx`, `components/ui/button.tsx`, or other control-bar files.
- Do NOT add Framer Motion / GSAP / new dependencies.
- Do NOT change export payload, copy, or download behavior.
- Do NOT reintroduce `transition-[width]` or animate layout properties.
- If the EXPORT button className no longer matches the chrome pass (ring / 160ms / scale 0.97), STOP and report drift instead of rewriting chrome.

## Verification

- **Mechanical**: `npx tsc --noEmit` (or project lint) — no new errors in `export-controls.tsx`.
- **Feel check**:
  - Click EXPORT: fill grows left→right via transform (DevTools: no `width` transition on the fill; computed `transform` changes). Progress feels even (linear), and Copy/Download appear by **~260ms**, not ~620ms.
  - Animations panel at 10% playback: fill scales from the left edge; EXPORT remount after Escape scales from ~0.97 with fade, not opacity-only.
  - Spam Escape after open: EXPORT returns with a short 150ms entrance; no width layout jank.
  - Enable `prefers-reduced-motion: reduce`: loading fill does not animate; actions open immediately (existing JS branch).
- **Done when**: fill uses `scaleX` + linear 200ms; loading opens by 260ms; EXPORT entrance is fade + zoom-in 0.97 at 150ms; press/hover chrome unchanged.
