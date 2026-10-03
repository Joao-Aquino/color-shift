"use client";

import { cn } from "@/lib/utils";
import type { ContrastAlgorithm } from "@/types/color-shift";

interface ThresholdButtonsProps {
  algorithm: ContrastAlgorithm;
  nearestThreshold: number;
  selectedThreshold: number;
  thresholds: readonly number[];
  onSelect: (threshold: number) => void;
}

function formatThreshold(value: number, algorithm: ContrastAlgorithm) {
  return algorithm === "WCAG" ? value.toFixed(1) : value.toString();
}

export function ThresholdButtons({
  algorithm,
  nearestThreshold,
  selectedThreshold,
  thresholds,
  onSelect,
}: ThresholdButtonsProps) {
  return (
    <div
      aria-label={`${algorithm} contrast thresholds`}
      className="flex gap-1"
      role="group"
    >
      {thresholds.map((threshold) => {
        const isSelected = threshold === selectedThreshold;
        const isNearest = threshold === nearestThreshold;

        return (
          <button
            aria-label={`Set ${algorithm} contrast to ${formatThreshold(threshold, algorithm)}`}
            aria-pressed={isSelected}
            className={cn(
              "relative flex h-8 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-full border font-mono text-xs tracking-[-0.48px] tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
              isSelected
                ? "border-[var(--score-pill-border)] bg-[var(--score-pill)] text-[var(--score-text)]"
                : "border-[var(--score-border)] bg-transparent text-[var(--score-text)]",
            )}
            key={threshold}
            onClick={() => onSelect(threshold)}
            type="button"
          >
            <span className="[text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
              {formatThreshold(threshold, algorithm)}
            </span>
            {isNearest && !isSelected ? (
              <span
                aria-label="Nearest to current score"
                className="absolute bottom-[3px] left-1/2 size-1 -translate-x-1/2 rounded-full bg-current"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
