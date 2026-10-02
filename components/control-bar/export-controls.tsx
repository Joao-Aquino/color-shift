"use client";

import { CheckIcon } from "@phosphor-icons/react/Check";
import { CopyIcon } from "@phosphor-icons/react/Copy";
import { DownloadSimpleIcon } from "@phosphor-icons/react/DownloadSimple";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { createColorShiftExport, type ColorShiftExport } from "@/lib/export";
import { cn } from "@/lib/utils";
import type { Photo } from "@/types/color-shift";

type ExportPhase = "closed" | "loading" | "open";
type ExportSuccess = "copy" | "download" | null;

interface ExportControlsProps {
  background: string | null;
  children: React.ReactNode;
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
}: Omit<ExportControlsProps, "children">) {
  const [phase, setPhase] = useState<ExportPhase>("closed");
  const [progress, setProgress] = useState(0);
  const [payload, setPayload] = useState<ColorShiftExport | null>(null);
  const [success, setSuccess] = useState<ExportSuccess>(null);
  const [actionPending, setActionPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timersRef = useRef<number[]>([]);
  const focusActionsRef = useRef(false);
  const restoreFocusRef = useRef(false);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const closeExport = useCallback(() => {
    const focused = document.activeElement;
    if ((focused instanceof HTMLElement && focused.closest("[data-export-slot]")) ||
      (restoreFocusRef.current && focused === document.body)) {
      requestAnimationFrame(() => document.querySelector<HTMLButtonElement>("[data-export-button]")?.focus({ preventScroll: true }));
    }
    focusActionsRef.current = false;
    restoreFocusRef.current = false;
    clearTimers();
    setPhase("closed");
    setProgress(0);
    setPayload(null);
    setSuccess(null);
    setActionPending(false);
    setErrorMessage(null);
  }, [clearTimers]);

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

  function openExport() {
    if (!background || !foreground || !photo || disabled) return;
    focusActionsRef.current = document.activeElement?.hasAttribute("data-export-button") ?? false;

    clearTimers();
    setErrorMessage(null);
    setSuccess(null);
    setPayload(createColorShiftExport({ background, foreground, photo }));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(100);
      setPhase("open");
      return;
    }

    setPhase("loading");
    setProgress(0);
    schedule(() => setProgress(40), 16);
    schedule(() => setProgress(90), 140);
    schedule(() => {
      setProgress(100);
      setPhase("open");
    }, 260);
  }

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
      (document.activeElement === document.body || document.activeElement?.hasAttribute("data-export-button"))) {
      document.querySelector<HTMLButtonElement>('[data-export-slot] button:not(:disabled)')?.focus({ preventScroll: true });
    }
    if (phase === "open") focusActionsRef.current = false;
  }, [phase]);
  return (
    <div className="cs-export-slot" data-export-slot data-state={phase}>
        {exportOpen ? (
          <div
            aria-label="Export actions"
            className="cs-export-actions motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200"
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
        ) : (
          <button
            data-export-button
            aria-controls="export-actions"
            className={cn(
              "relative flex h-12 w-full items-center justify-center overflow-hidden rounded-full border border-[var(--color-chrome-border)] bg-[var(--color-chrome-raised)] px-2 text-sm leading-5 font-medium text-[var(--color-text-value)] transition-[border-color,background-color,opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[var(--color-chrome-border-strong)] hover:bg-[var(--color-chrome-raised)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-[0.97] motion-safe:duration-150 motion-safe:active:scale-[0.97] disabled:cursor-wait",
              disabled && "cursor-not-allowed opacity-30",
            )}
            disabled={disabled || phase === "loading"}
            onClick={openExport}
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
        )}
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

export function ExportControls({ children, ...props }: ExportControlsProps) {
  return (
    <div className="cs-export-controls" data-export-controls>
      <div className="cs-export-photo-actions" data-photo-actions>{children}</div>
      <ExportSlot
        {...props}
        key={`${props.photo?.id ?? "empty"}-${props.background}-${props.foreground}`}
      />
    </div>
  );
}
