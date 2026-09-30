"use client";

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
      className="grid grid-cols-4 gap-1 border-t border-white/10 px-3 py-3"
      role="group"
    >
      {thresholds.map((threshold) => {
        const isSelected = threshold === selectedThreshold;
        const isNearest = threshold === nearestThreshold;

        return (
          <button
            aria-label={`Set ${algorithm} contrast to ${formatThreshold(threshold, algorithm)}`}
            aria-pressed={isSelected}
            className={`relative h-9 rounded-[4px] border text-xs font-medium tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${
              isSelected
                ? "border-current bg-white/10"
                : "border-white/10 hover:border-current hover:bg-white/5"
            }`}
            key={threshold}
            onClick={() => onSelect(threshold)}
            type="button"
          >
            {formatThreshold(threshold, algorithm)}
            {isNearest ? (
              <span
                aria-label="Nearest to current score"
                className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-current"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
