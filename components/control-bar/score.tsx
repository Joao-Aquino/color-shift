"use client";

import { InfoIcon } from "@phosphor-icons/react/Info";
import { useEffect, useState, type CSSProperties, type TransitionEvent } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  ContrastAlgorithm,
  ContrastScore,
} from "@/types/color-shift";

import { Odometer } from "./odometer";
import { ThresholdButtons } from "./threshold-buttons";

const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

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

const gradeTabText: Record<ContrastScore["grade"], string> = {
  AAA: "text-[var(--color-score-good-text)]",
  AA: "text-[var(--color-score-good-text)]",
  "AA Large": "text-[var(--color-score-meh-text)]",
  Fail: "text-[var(--color-score-bad-text)]",
};

const gradeToneVars: Record<ContrastScore["grade"], CSSProperties> = {
  AAA: {
    "--score-border": "var(--color-score-good-border)",
    "--score-pill": "var(--color-score-good-pill)",
    "--score-pill-border": "var(--color-score-good-pill-border)",
    "--score-text": "var(--color-score-good-text)",
  } as CSSProperties,
  AA: {
    "--score-border": "var(--color-score-good-border)",
    "--score-pill": "var(--color-score-good-pill)",
    "--score-pill-border": "var(--color-score-good-pill-border)",
    "--score-text": "var(--color-score-good-text)",
  } as CSSProperties,
  "AA Large": {
    "--score-border": "var(--color-score-meh-border)",
    "--score-pill": "var(--color-score-meh-pill)",
    "--score-pill-border": "var(--color-score-meh-pill-border)",
    "--score-text": "var(--color-score-meh-text)",
  } as CSSProperties,
  Fail: {
    "--score-border": "var(--color-score-bad-border)",
    "--score-pill": "var(--color-score-bad-pill)",
    "--score-pill-border": "var(--color-score-bad-pill-border)",
    "--score-text": "var(--color-score-bad-text)",
  } as CSSProperties,
};

const algorithms: ContrastAlgorithm[] = ["WCAG", "APCA"];

const algorithmHelp: Record<ContrastAlgorithm, string> = {
  WCAG: "Web Content Accessibility Guidelines. A luminance ratio, such as 4.5:1, used by most accessibility requirements.",
  APCA: "Accessible Perceptual Contrast Algorithm. An Lc score for perceived contrast, including light text on dark and the reverse.",
};

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
  const [rendered, setRendered] = useState(expanded && !!score);
  const scoreBackground = score
    ? gradeBackgrounds[score.grade]
    : "bg-[var(--color-chrome-raised)]";
  const scoreLabel = score
    ? gradeLabels[score.grade]
    : "text-[var(--color-text-muted)]";
  const tabSelectedText = score
    ? gradeTabText[score.grade]
    : "text-[var(--color-text-muted)]";
  const showThresholds = (expanded || rendered) && !!score;
  const toneStyle = score ? gradeToneVars[score.grade] : undefined;

  useEffect(() => {
    if (expanded && score) {
      setRendered(true);
      return;
    }

    if (!expanded && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRendered(false);
    }

    if (!score) {
      setRendered(false);
    }
  }, [expanded, score]);

  function handleGridTransitionEnd(event: TransitionEvent<HTMLDivElement>) {
    if (event.propertyName !== "grid-template-rows") return;
    if (event.target !== event.currentTarget) return;
    if (!expanded) setRendered(false);
  }

  return (
    <section
      aria-label="Contrast score"
      className="flex flex-col gap-2.5"
      data-contrast-score
      style={{ "--field-ease": EASE_OUT, ...toneStyle } as CSSProperties}
    >
      <div>
        <div aria-label="Contrast method" className="flex" role="tablist">
          {algorithms.map((method) => {
            const selected = method === algorithm;

            return (
              <button
                aria-controls="contrast-score-panel"
                aria-selected={selected}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-1 py-2 text-sm font-medium tracking-[0.1em] uppercase transition-colors duration-300 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white",
                  method === "WCAG"
                    ? "justify-start rounded-t-[12px] pr-4 pl-6"
                    : "justify-end rounded-t-[12px] pr-6 pl-4",
                  selected
                    ? cn(scoreBackground, tabSelectedText)
                    : "bg-transparent text-[var(--color-text-value)]",
                )}
                id={`contrast-tab-${method.toLowerCase()}`}
                key={method}
                onClick={() => onAlgorithmChange(method)}
                role="tab"
                type="button"
              >
                <span>{method}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex cursor-help">
                      <InfoIcon
                        aria-hidden
                        className={cn(
                          "transition-colors duration-300",
                          selected ? "text-current" : "text-[#454545]",
                        )}
                        size={14}
                        weight="regular"
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    className="max-w-56 text-left leading-4 font-normal tracking-normal normal-case"
                    side="top"
                    sideOffset={8}
                  >
                    {algorithmHelp[method]}
                  </TooltipContent>
                </Tooltip>
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
            aria-label={
              score
                ? algorithm === "APCA"
                  ? `Lc ${score.value.toFixed(1)}, ${score.grade}`
                  : `${score.value.toFixed(2)} to 1, ${score.grade}`
                : undefined
            }
            className={cn(
              "flex w-full items-end gap-3 px-6 pt-8 text-left focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-current motion-safe:transition-[padding-bottom] motion-safe:ease-[var(--field-ease)]",
              expanded && score
                ? "pb-4 motion-safe:duration-200"
                : "pb-8 motion-safe:duration-150",
            )}
            disabled={!score}
            onClick={() => onExpandedChange(!expanded)}
            type="button"
          >
            {score ? (
              algorithm === "APCA" ? (
                <>
                  <span className="min-w-0 flex-1 text-[11px] leading-[11px] font-medium">
                    L<sup className="text-[7.1px]">C</sup>
                  </span>
                  <span className="flex min-w-0 flex-1 justify-end">
                    <Odometer
                      className="text-[56px] leading-none tracking-[-2.24px] text-[var(--color-text-value)] [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]"
                      value={score.value.toFixed(1)}
                    />
                  </span>
                </>
              ) : (
                <>
                  <span className="flex min-w-0 flex-1">
                    <Odometer
                      className="text-[56px] leading-none tracking-[-2.24px] text-[var(--color-text-value)] [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]"
                      value={score.value.toFixed(2)}
                    />
                  </span>
                  <span className="shrink-0 text-[11px] leading-[11px] font-medium whitespace-nowrap">
                    {score.grade}
                  </span>
                </>
              )
            ) : (
              <Skeleton className="h-14 w-full bg-white/8" />
            )}
          </button>

          <div
            className={cn(
              "grid motion-safe:transition-[grid-template-rows] motion-safe:ease-[var(--field-ease)]",
              expanded && score
                ? "grid-rows-[1fr] motion-safe:duration-200"
                : "grid-rows-[0fr] motion-safe:duration-150",
            )}
            id="contrast-thresholds"
            onTransitionEnd={handleGridTransitionEnd}
          >
            <div className="min-h-0 overflow-hidden">
              {showThresholds ? (
                <div
                  aria-hidden={!expanded}
                  className={cn(
                    "px-6 pb-6 motion-safe:transition-opacity motion-safe:ease-[var(--field-ease)]",
                    expanded
                      ? "opacity-100 motion-safe:duration-200"
                      : "opacity-0 motion-safe:duration-150",
                  )}
                  inert={!expanded ? true : undefined}
                >
                  <div
                    aria-hidden
                    className="h-px w-full rounded-[4px] bg-[var(--score-border)]"
                  />
                  <div className="mt-4">
                    <ThresholdButtons
                      algorithm={algorithm}
                      nearestThreshold={nearestThreshold}
                      onSelect={onThresholdSelect}
                      selectedThreshold={selectedThreshold}
                      thresholds={thresholds}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs leading-5 text-[var(--color-text-muted)]">
        {score?.description ?? "Extracting a readable color pair from the photo."}
      </p>
    </section>
  );
}
