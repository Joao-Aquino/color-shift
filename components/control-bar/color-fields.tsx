"use client";

import {
  cloneElement,
  isValidElement,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useFlipPresence } from "@/lib/use-flip-presence";
import type { ColorFormat, ColorTarget } from "@/types/color-shift";

import { Swatch } from "./swatch";
import { TubeText } from "./tube-text";

interface ColorFieldProps {
  active: boolean;
  label: string;
  color: string;
  target: ColorTarget;
  editor: ReactNode;
  onSelect: (target: ColorTarget) => void;
}

function ColorField({
  active,
  label,
  color,
  target,
  editor,
  onSelect,
}: ColorFieldProps) {
  const [cachedEditor, setCachedEditor] = useState(editor);
  const shellRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const showEditor = useFlipPresence(active);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    const content = contentRef.current;
    if (!active || !shell || !content) return;

    const mobile = window.matchMedia("(max-width: 639px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const viewport = window.visualViewport;
    const footer = document.querySelector<HTMLElement>("[data-control-footer]");
    let frame = 0;
    let cancelled = false;

    function pause() {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    function cancel() {
      cancelled = true;
      pause();
    }

    function reveal() {
      frame = 0;
      if (cancelled || !mobile.matches || !shell?.isConnected || !content || !footer) return;
      if (shell.querySelector("[data-color-field]")?.getAttribute("aria-expanded") !== "true") return;
      if (getComputedStyle(footer).position !== "fixed") return;
      if (document.activeElement instanceof HTMLInputElement && document.activeElement.closest("[data-color-editor]")) {
        cancel();
        return;
      }

      const top = (viewport?.offsetTop ?? 0) + 16;
      const bottom = Math.min(
        (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight),
        footer.getBoundingClientRect().top,
      ) - 16;
      const bounds = shell.getBoundingClientRect();
      // offsetHeight measures natural content, unaffected by Flip transforms.
      // Add the 32px header, 16px gap, 8px padding on each side and borders.
      const style = getComputedStyle(shell);
      const expandedHeight = content.offsetHeight + 32 + 16 + 16
        + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
      const delta = expandedHeight > bottom - top || bounds.top < top
        ? bounds.top - top
        : Math.max(0, bounds.bottom - bottom);
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const nextScroll = Math.min(maxScroll, Math.max(0, window.scrollY + delta));
      if (Math.abs(nextScroll - window.scrollY) < 0.5) return;
      window.scrollTo({ top: nextScroll, behavior: "instant" });
    }

    function schedule() {
      if (!cancelled && mobile.matches && !frame) frame = requestAnimationFrame(reveal);
    }
    function onMobileChange() {
      pause();
      if (mobile.matches) schedule();
    }
    function onMotionChange() {
      pause();
      schedule();
    }
    function onFocus(event: FocusEvent) {
      if (event.target instanceof HTMLInputElement && event.target.closest("[data-color-editor]")) cancel();
      else if (event.target instanceof Element && shell?.contains(event.target)) schedule();
    }
    const observer = new ResizeObserver(schedule);
    // A closing sibling moves this shell even when its own height is unchanged.
    shell.parentElement?.querySelectorAll("[data-color-field-shell]").forEach((field) => observer.observe(field, { box: "border-box" }));
    observer.observe(content);
    if (footer) observer.observe(footer, { box: "border-box" });
    mobile.addEventListener("change", onMobileChange);
    motion.addEventListener("change", onMotionChange);
    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    document.addEventListener("cs:layout-motion", schedule);
    window.addEventListener("wheel", cancel, { passive: true, capture: true });
    window.addEventListener("touchmove", cancel, { passive: true, capture: true });
    document.addEventListener("focusin", onFocus);
    schedule();
    return () => {
      cancel();
      observer.disconnect();
      mobile.removeEventListener("change", onMobileChange);
      motion.removeEventListener("change", onMotionChange);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("cs:layout-motion", schedule);
      window.removeEventListener("wheel", cancel, true);
      window.removeEventListener("touchmove", cancel, true);
      document.removeEventListener("focusin", onFocus);
    };
  }, [active]);

  if (editor != null && editor !== cachedEditor) {
    setCachedEditor(editor);
  }

  const editorContent = editor ?? cachedEditor;

  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-[24px] border transition-[background-color,border-color] ease-[var(--ease-out)]",
        active
          ? "gap-4 border-[var(--color-chrome-border)] p-2 duration-[var(--enter-duration)]"
          : "border-transparent duration-[var(--exit-duration)] hover:border-[var(--color-chrome-border)]",
      )}
      data-color-field-shell={target}
      data-sidebar-layout
      ref={shellRef}
      style={
        {
          backgroundColor: active
            ? "var(--color-chrome-bg)"
            : `color-mix(in srgb, ${color} var(--color-field-tint), transparent)`,
        }
      }
    >
      <button
        aria-controls="color-editor"
        aria-expanded={active}
        className={cn(
          "flex w-full items-center gap-2 text-left outline-none focus-visible:outline-none transition-none",
          active
            ? "h-8 pl-2"
            : "h-12 py-2 pr-2 pl-4",
        )}
        data-color-field={target}
        data-sidebar-layout
        onClick={() => onSelect(target)}
        onFocus={(e) => {
          const shell = e.currentTarget.closest('[data-color-field-shell]');
          if (shell && e.currentTarget.matches(':focus-visible')) {
            shell.setAttribute('data-focus-within', 'true');
          }
        }}
        onBlur={(e) => {
          const shell = e.currentTarget.closest('[data-color-field-shell]');
          if (shell) shell.removeAttribute('data-focus-within');
        }}
        type="button"
      >
        <span className="text-xs font-medium tracking-[0.1em] text-[var(--color-text-muted)] uppercase">
          {label}
        </span>
        <span className="min-w-0 flex-1 text-right">
          <TubeText className="text-sm text-[var(--color-text-value)] tabular-nums">{color}</TubeText>
        </span>
        <span className="inline-flex shrink-0"><Swatch color={color} /></span>
      </button>

      <div
        className={cn(
          "grid",
          active
            ? "grid-rows-[1fr]"
            : "grid-rows-[0fr]",
        )}
      >
        <div className="cs-layout-clip min-h-0 overflow-hidden">
          {showEditor ? (
            <div
              aria-hidden={!active}
              className="cs-layout-content"
              id={active ? "color-editor" : undefined}
              inert={!active ? true : undefined}
              data-open={active}
              data-sidebar-layout
              ref={contentRef}
            >
              {editorContent}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface ColorEditorBindProps {
  format: ColorFormat;
  onFormatChange: (format: ColorFormat) => void;
  fallbackHue: number;
  onFallbackHueChange: (hue: number) => void;
}

interface ColorFieldsProps {
  activeTarget: ColorTarget | null;
  background: string | null;
  foreground: string | null;
  editor: ReactNode;
  onSelect: (target: ColorTarget) => void;
}

export function ColorFields({
  activeTarget,
  background,
  foreground,
  editor,
  onSelect,
}: ColorFieldsProps) {
  const [format, setFormat] = useState<ColorFormat>("HEX");
  const [fallbackHue, setFallbackHue] = useState(0);
  const [previousTarget, setPreviousTarget] = useState(activeTarget);

  if (previousTarget !== activeTarget) {
    setPreviousTarget(activeTarget);
    if (!activeTarget) {
      setFormat("HEX");
      setFallbackHue(0);
    }
  }

  const boundEditor =
    editor && isValidElement(editor)
      ? cloneElement(editor as ReactElement<ColorEditorBindProps>, {
          format,
          onFormatChange: setFormat,
          fallbackHue,
          onFallbackHueChange: setFallbackHue,
        })
      : editor;

  return (
    <section className="flex flex-col gap-4 sm:gap-3" aria-label="Selected colors">
      {background && foreground ? (
        <>
          <ColorField
            active={activeTarget === "background"}
            color={background}
            editor={activeTarget === "background" ? boundEditor : null}
            label="Background"
            onSelect={onSelect}
            target="background"
          />
          <ColorField
            active={activeTarget === "foreground"}
            color={foreground}
            editor={activeTarget === "foreground" ? boundEditor : null}
            label="Foreground"
            onSelect={onSelect}
            target="foreground"
          />
        </>
      ) : (
        <>
          <Skeleton className="h-12 rounded-full bg-[var(--color-chrome-raised)]" />
          <Skeleton className="h-12 rounded-full bg-[var(--color-chrome-raised)]" />
        </>
      )}
    </section>
  );
}
