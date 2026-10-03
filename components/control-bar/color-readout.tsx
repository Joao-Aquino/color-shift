"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  formatColorReadout,
  parseColorReadout,
} from "@/lib/color/editor";
import type { ColorFormat } from "@/types/color-shift";

interface ColorReadoutProps {
  color: string;
  format: ColorFormat;
  fallbackHue: number;
  onCommit: (color: string) => void;
}

export function ColorReadout({
  color,
  format,
  fallbackHue,
  onCommit,
}: ColorReadoutProps) {
  const descriptionId = useId();
  const cancelCommit = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const displayValue = formatColorReadout(color, format, fallbackHue);
  const [draft, setDraft] = useState(displayValue);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (inputRef.current && document.activeElement === inputRef.current) return;
    setDraft(displayValue);
    setInvalid(false);
  }, [displayValue]);

  function commit(value = draft) {
    const parsed = parseColorReadout(value);
    if (!parsed) {
      setInvalid(true);
      return;
    }

    setInvalid(false);
    setDraft(formatColorReadout(parsed, format, fallbackHue));
    if (parsed !== color) onCommit(parsed);
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-9 items-center gap-2 rounded-full bg-[var(--color-chrome-raised)] pr-2 pl-3">
        <span className="w-[74px] shrink-0 text-xs font-medium text-[var(--color-text-muted)] uppercase">
          {format}
        </span>
        <div className="min-w-0 flex-1">
          <Input
            aria-describedby={invalid ? descriptionId : undefined}
            aria-invalid={invalid}
            aria-label={`${format} color value`}
            className="h-7 w-full rounded-full border-0 bg-transparent px-2 text-right font-mono text-xs text-[var(--color-text-value)] tabular-nums focus-visible:ring-1 md:text-xs"
            onBlur={() => {
              if (cancelCommit.current) {
                cancelCommit.current = false;
                setDraft(displayValue);
                setInvalid(false);
              } else {
                commit();
              }
            }}
            onChange={(event) => {
              setDraft(event.target.value);
              if (invalid) setInvalid(false);
            }}
            onFocus={(event) => {
              setDraft(displayValue);
              event.currentTarget.select();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") {
                cancelCommit.current = true;
                event.currentTarget.blur();
              }
            }}
            onPaste={(event) => {
              const pasted = event.clipboardData.getData("text");
              const parsed = parseColorReadout(pasted);
              if (!parsed) return;
              event.preventDefault();
              setDraft(formatColorReadout(parsed, format, fallbackHue));
              setInvalid(false);
              if (parsed !== color) onCommit(parsed);
            }}
            ref={inputRef}
            spellCheck={false}
            value={draft}
          />
        </div>
      </div>
      {invalid ? (
        <p
          className="px-3 text-[11px] text-[var(--color-score-bad-label)]"
          id={descriptionId}
          role="alert"
        >
          Enter a valid HEX, RGB, HSL, HSB, or OKLCH color.
        </p>
      ) : null}
    </div>
  );
}
