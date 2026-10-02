"use client";

import {
  cloneElement,
  isValidElement,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useCollapsiblePresence } from "@/lib/use-collapsible-presence";
import { cn } from "@/lib/utils";
import type { ColorFormat, ColorTarget } from "@/types/color-shift";

import { Swatch } from "./swatch";
import { TubeText } from "./tube-text";

const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

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
  const { present: showEditor, onTransitionEnd } = useCollapsiblePresence(active);
  const [cachedEditor, setCachedEditor] = useState(editor);

  if (editor != null && editor !== cachedEditor) {
    setCachedEditor(editor);
  }

  const editorContent = editor ?? cachedEditor;

  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-[24px] border motion-safe:transition-[background-color,border-color,padding,gap] motion-safe:ease-[var(--field-ease)]",
        active
          ? "gap-4 border-[var(--color-chrome-border)] p-2 motion-safe:duration-200"
          : "border-transparent motion-safe:duration-150 hover:border-[var(--color-chrome-border)]",
      )}
      data-color-field-shell={target}
      style={
        {
          "--field-ease": EASE_OUT,
          backgroundColor: active
            ? "var(--color-chrome-bg)"
            : `color-mix(in srgb, ${color} 15%, transparent)`,
        } as CSSProperties
      }
    >
      <button
        aria-controls="color-editor"
        aria-expanded={active}
        className={cn(
          "flex w-full items-center gap-2 text-left motion-safe:transition-[height,padding] motion-safe:ease-[var(--field-ease)] focus-visible:rounded-full focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:outline-none",
          active
            ? "h-8 pl-2 motion-safe:duration-200"
            : "h-12 py-2 pr-2 pl-4 motion-safe:duration-150",
        )}
        data-color-field={target}
        onClick={() => onSelect(target)}
        type="button"
      >
        <span className="text-xs font-medium tracking-[0.1em] text-[var(--color-text-label)] uppercase">
          {label}
        </span>
        <TubeText className="min-w-0 flex-1 text-right text-sm text-[var(--color-text-value)] tabular-nums">
          {color}
        </TubeText>
        <Swatch color={color} />
      </button>

      <div
        className={cn(
          "grid motion-safe:transition-[grid-template-rows] motion-safe:ease-[var(--field-ease)]",
          active
            ? "grid-rows-[1fr] motion-safe:duration-200"
            : "grid-rows-[0fr] motion-safe:duration-150",
        )}
        onTransitionEnd={onTransitionEnd}
      >
        <div className="min-h-0 overflow-hidden">
          {showEditor ? (
            <div
              aria-hidden={!active}
              className={cn(
                "motion-safe:transition-opacity motion-safe:ease-[var(--field-ease)]",
                active
                  ? "opacity-100 motion-safe:duration-200"
                  : "opacity-0 motion-safe:duration-150",
              )}
              id={active ? "color-editor" : undefined}
              inert={!active ? true : undefined}
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
