"use client";

import { InfoIcon } from "@phosphor-icons/react/Info";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type {
  ContrastAlgorithm,
  ContrastScore,
} from "@/types/color-shift";

import { ThresholdButtons } from "./threshold-buttons";
import { TubeText } from "./tube-text";

const gradeBackgrounds: Record<ContrastScore["grade"], string> = {
  AAA: "bg-[var(--color-score-good)]",
  AA: "bg-[var(--color-score-good)]",
  "AA Large": "bg-[var(--color-score-meh)]",
  Fail: "bg-[var(--color-score-bad)]",
};

const gradeLabels: Record<ContrastScore["grade"], string> = {
  AAA: "text-[var(--color-score-good-label)]",
  AA: "text-[var(--color-score-good-label)]",
  "AA Large": "text-[var(--color-score-meh-label)]",
  Fail: "text-[var(--color-score-bad-label)]",
};

const algorithms: ContrastAlgorithm[] = ["WCAG", "APCA"];

interface ScoreProps {
  algorithm: ContrastAlgorithm;
  expanded: boolean;
  nearestThreshold: number;
  score: ContrastScore | null;
  selectedThreshold: number;
  thresholds: readonly number[];
  onAlgorithmChange: (algorithm: ContrastAlgorithm) => void;
  onExpandedChange: (expanded: boolean) => void;
  onThresholdSelect: (threshold: number) => void;
}

export function Score({
  algorithm,
  expanded,
  nearestThreshold,
  score,
  selectedThreshold,
  thresholds,
  onAlgorithmChange,
  onExpandedChange,
  onThresholdSelect,
}: ScoreProps) {
  const scoreBackground = score
    ? gradeBackgrounds[score.grade]
    : "bg-[var(--color-chrome-raised)]";
  const scoreLabel = score
    ? gradeLabels[score.grade]
    : "text-[var(--color-text-muted)]";

  return (
    <section
      aria-label="Contrast score"
      className="flex flex-col gap-2.5"
      data-contrast-score
    >
      <div className="overflow-hidden rounded-[4px]">
        <div aria-label="Contrast method" className="flex h-9" role="tablist">
          {algorithms.map((method) => {
            const selected = method === algorithm;

            return (
              <button
                aria-controls="contrast-score-panel"
                aria-selected={selected}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-1 text-sm font-medium tracking-[0.1em] text-white uppercase focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white",
                  method === "WCAG"
                    ? "justify-start rounded-t-[12px] pr-4 pl-6"
                    : "justify-end rounded-t-[12px] pr-6 pl-4",
                  selected ? scoreBackground : "bg-transparent",
                )}
                id={`contrast-tab-${method.toLowerCase()}`}
                key={method}
                onClick={() => onAlgorithmChange(method)}
                role="tab"
                title={`${method} contrast method`}
                type="button"
              >
                <span>{method}</span>
                <InfoIcon
                  aria-hidden
                  className={selected ? scoreLabel : "text-[#454545]"}
                  size={14}
                  weight="regular"
                />
              </button>
            );
          })}
        </div>

        <div
          aria-labelledby={`contrast-tab-${algorithm.toLowerCase()}`}
          className={cn(
            "overflow-hidden rounded-b-[16px] transition-colors duration-300",
            algorithm === "WCAG" ? "rounded-tr-[8px]" : "rounded-tl-[8px]",
            scoreBackground,
            scoreLabel,
          )}
          id="contrast-score-panel"
          role="tabpanel"
        >
          <button
            aria-controls="contrast-thresholds"
            aria-expanded={expanded}
            className="flex h-[102px] w-full items-end gap-3 px-6 pb-6 text-left focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-current"
            disabled={!score}
            onClick={() => onExpandedChange(!expanded)}
            type="button"
          >
            {score ? (
              algorithm === "APCA" ? (
                <>
                  <span className="min-w-0 flex-1 text-[11px] leading-none font-medium">
                    L<sup className="text-[7px]">C</sup>
                  </span>
                  <TubeText className="min-w-0 flex-1 text-right text-[56px] leading-none text-[var(--color-text-value)] tabular-nums">
                    {score.value.toFixed(1)}
                  </TubeText>
                </>
              ) : (
                <>
                  <TubeText className="min-w-0 flex-1 text-[56px] leading-none text-[var(--color-text-value)] tabular-nums">
                    {score.value.toFixed(2)}
                  </TubeText>
                  <span className="max-w-16 text-right text-[11px] leading-3 font-medium">
                    {score.grade}
                  </span>
                </>
              )
            ) : (
              <Skeleton className="h-14 w-full bg-white/8" />
            )}
          </button>

          {expanded && score ? (
            <div id="contrast-thresholds">
              <ThresholdButtons
                algorithm={algorithm}
                nearestThreshold={nearestThreshold}
                onSelect={onThresholdSelect}
                selectedThreshold={selectedThreshold}
                thresholds={thresholds}
              />
            </div>
          ) : null}
        </div>
      </div>

      <p className="min-h-10 text-xs leading-5 text-[var(--color-text-muted)]">
        {score?.description ?? "Extracting a readable color pair from the photo."}
      </p>
    </section>
  );
}
