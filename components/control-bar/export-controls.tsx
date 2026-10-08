"use client";

import { CheckIcon } from "@phosphor-icons/react/Check";
import { CopyIcon } from "@phosphor-icons/react/Copy";
import { DownloadSimpleIcon } from "@phosphor-icons/react/DownloadSimple";
import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ShortcutKey } from "@/components/ui/shortcut-key";

import { createColorShiftExport, type ColorShiftExport } from "@/lib/export";
import { cn } from "@/lib/utils";
import { useFlipLayoutMotion } from "@/lib/use-flip-layout-motion";
import { useFlipPresence } from "@/lib/use-flip-presence";
import { motionValue, prefersReducedMotion } from "@/lib/motion";
import type { Photo } from "@/types/color-shift";

type ExportPhase = "closed" | "loading" | "open";
type ExportSuccess = "copy" | "download" | null;

interface ExportControlsProps {
  background: string | null;
  disabled?: boolean;
  foreground: string | null;
  photo: Photo | null;
}

const SUCCESS_DELAY_MS = 1500;

function ExportAction({
  kind,
  success,
  disabled,
  onClick,
}: {
  kind: "copy" | "download";
  success: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = success
    ? CheckIcon
    : kind === "copy"
      ? CopyIcon
      : DownloadSimpleIcon;
  const label = success
    ? kind === "copy"
      ? "COPIED"
      : "DOWNLOADED"
    : kind === "copy"
      ? "COPY"
      : "DOWNLOAD .MD";

  return (
    <button
      className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full border border-[var(--color-chrome-border)] px-3 text-[11px] leading-4 font-medium tracking-[0.02em] text-[var(--color-text-value)] transition-[border-color,background-color,transform,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[var(--color-chrome-border-strong)] hover:bg-[var(--color-chrome-raised)] focus-visible:outline-1 focus-visible:outline-offset-[-4px] focus-visible:outline-dashed focus-visible:outline-[var(--color-focus)] motion-safe:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span
        className="flex items-center gap-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200"
        key={label}
      >
        <Icon aria-hidden size={20} weight="regular" />
        <span className="whitespace-nowrap">{label}</span>
      </span>
    </button>
  );
}

function ExportSlot({
  background,
  disabled,
  foreground,
  photo,
}: ExportControlsProps) {
  const [phase, setPhase] = useState<ExportPhase>("closed");
  const [progress, setProgress] = useState(0);
  const [payload, setPayload] = useState<ColorShiftExport | null>(null);
  const [success, setSuccess] = useState<ExportSuccess>(null);
  const [actionPending, setActionPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timersRef = useRef<number[]>([]);
  const focusActionsRef = useRef(false);
  const shortcutFocusRef = useRef<Element | null>(null);
  const restoreFocusRef = useRef(false);
  const slotRef = useRef<HTMLDivElement>(null);
  const prepareMotion = useFlipLayoutMotion(slotRef, phase, Number(phase === "open"));
  const actionsPresent = useFlipPresence(phase === "open");

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const closeExport = useCallback(() => {
    const focused = document.activeElement;
    const returnFocus = (focused instanceof HTMLElement && !!focused.closest("[data-export-slot]")) ||
      (restoreFocusRef.current && focused === document.body);
    focusActionsRef.current = false;
    shortcutFocusRef.current = null;
    restoreFocusRef.current = false;
    clearTimers();
    if (returnFocus) timersRef.current.push(window.setTimeout(() => {
      const active = document.activeElement;
      if (active === document.body || active?.closest("[data-export-slot]")) {
        slotRef.current?.querySelector<HTMLButtonElement>("[data-export-button]")?.focus({ preventScroll: true });
      }
    }, prefersReducedMotion() ? 0 : motionValue("--exit-duration") * 1000 + 32));
    prepareMotion();
    setPhase("closed");
    setProgress(0);
    setPayload(null);
    setSuccess(null);
    setActionPending(false);
    setErrorMessage(null);
  }, [clearTimers, prepareMotion]);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (phase !== "open") return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeExport();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeExport, phase]);

  function schedule(callback: () => void, delay: number) {
    timersRef.current.push(window.setTimeout(callback, delay));
  }

  function openExport(focusActions = false) {
    if (!background || !foreground || !photo || disabled) return;
    focusActionsRef.current = focusActions || (document.activeElement?.hasAttribute("data-export-button") ?? false);
    shortcutFocusRef.current = focusActions ? document.activeElement : null;

    clearTimers();
    setErrorMessage(null);
    setSuccess(null);
    setPayload(createColorShiftExport({ background, foreground, photo }));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      prepareMotion();
      setProgress(100);
      setPhase("open");
      return;
    }

    setPhase("loading");
    setProgress(0);
    schedule(() => setProgress(40), 16);
    schedule(() => setProgress(90), 140);
    schedule(() => {
      prepareMotion();
      setProgress(100);
      setPhase("open");
    }, 260);
  }

  const openFromShortcut = useEffectEvent(() => {
    if (phase === "closed") openExport(true);
  });

  useEffect(() => {
    function handleExportShortcut(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.shiftKey ||
        !(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      if (!event.repeat) openFromShortcut();
    }
    window.addEventListener("keydown", handleExportShortcut);
    return () => window.removeEventListener("keydown", handleExportShortcut);
  }, []);

  function completeAction(kind: Exclude<ExportSuccess, null>) {
    clearTimers();
    setSuccess(kind);
    schedule(closeExport, SUCCESS_DELAY_MS);
  }

  async function copyMarkdown() {
    if (!payload || actionPending) return;
    restoreFocusRef.current = !!document.activeElement?.closest("[data-export-slot]");

    setActionPending(true);
    setErrorMessage(null);
    try {
      await navigator.clipboard.writeText(payload.content);
      completeAction("copy");
    } catch {
      setErrorMessage("Unable to copy. Check the browser clipboard permission.");
    } finally {
      setActionPending(false);
    }
  }

  function downloadMarkdown() {
    if (!payload || actionPending) return;
    restoreFocusRef.current = !!document.activeElement?.closest("[data-export-slot]");

    setActionPending(true);
    setErrorMessage(null);
    try {
      const blob = new Blob([payload.content], {
        type: "text/markdown;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = payload.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      completeAction("download");
    } catch {
      setErrorMessage("Unable to download the Markdown file.");
    } finally {
      setActionPending(false);
    }
  }

  const exportOpen = phase === "open";
  useLayoutEffect(() => {
    if (phase === "open" && focusActionsRef.current &&
      (document.activeElement === document.body || document.activeElement?.hasAttribute("data-export-button") ||
        document.activeElement === shortcutFocusRef.current)) {
      slotRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true });
    }
    if (phase === "open") {
      focusActionsRef.current = false;
      shortcutFocusRef.current = null;
    }
  }, [phase]);
  return (
    <div ref={slotRef} className="cs-export-slot" data-export-slot data-state={phase}>
        {actionsPresent ? (
          <div
            aria-label="Export actions"
            className="cs-export-actions cs-layout-content"
            data-layout-item
            data-open={exportOpen}
            aria-hidden={!exportOpen}
            inert={!exportOpen ? true : undefined}
            id="export-actions"
          >
            <ExportAction
              disabled={actionPending}
              kind="copy"
              onClick={() => void copyMarkdown()}
              success={success === "copy"}
            />
            <ExportAction
              disabled={actionPending}
              kind="download"
              onClick={downloadMarkdown}
              success={success === "download"}
            />
          </div>
        ) : null}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              data-export-button
              data-layout-item
              data-open={!exportOpen}
              aria-controls="export-actions"
              aria-keyshortcuts="Meta+S Control+S"
              className={cn(
                "cs-layout-content relative flex h-12 w-full items-center justify-center overflow-hidden rounded-full border border-[var(--color-export-border)] bg-[var(--color-export-bg)] px-2 text-sm leading-5 font-medium text-[var(--color-export-text)] transition-[border-color,background-color,opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[var(--color-chrome-border-strong)] hover:bg-[var(--color-export-bg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] motion-safe:active:scale-[0.97] disabled:cursor-wait",
                disabled && "cursor-not-allowed opacity-30",
              )}
              disabled={disabled || phase === "loading"}
              onClick={() => openExport()}
              type="button"
            >
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-full origin-left bg-[var(--color-chrome-divider)] transition-transform duration-200 ease-linear motion-reduce:transition-none"
                style={{
                  transform: `scaleX(${phase === "loading" ? progress / 100 : 0})`,
                }}
              />
              <span className="relative">EXPORT</span>
            </button>
          </TooltipTrigger>
          <TooltipContent className="cs-shortcut-tooltip" side="top" sideOffset={8}>
            <span>Export colors</span><ShortcutKey shortcut="Export" />
          </TooltipContent>
        </Tooltip>
      <p aria-live="polite" className="sr-only" role="status">
        {errorMessage ??
          (phase === "loading"
            ? "Preparing export"
            : success === "copy"
              ? "Markdown copied"
              : success === "download"
                ? "Markdown downloaded"
                : "")}
      </p>
    </div>
  );
}

export function ExportControls(props: ExportControlsProps) {
  return (
    <div className="cs-export-controls" data-export-controls>
      <ExportSlot
        {...props}
        key={`${props.photo?.id ?? "empty"}-${props.background}-${props.foreground}`}
      />
    </div>
  );
}
