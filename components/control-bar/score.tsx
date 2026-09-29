import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ContrastScore } from "@/types/color-shift";

import { TubeText } from "./tube-text";

const gradeStyles: Record<ContrastScore["grade"], string> = {
  AAA: "bg-[var(--color-score-strong)] text-[var(--color-score-label)]",
  AA: "bg-[var(--color-score-pass)] text-[var(--color-score-label)]",
  "AA Large": "bg-[var(--color-score-large)] text-[var(--color-score-large-label)]",
  Fail: "bg-[var(--color-score-fail)] text-[var(--color-score-fail-label)]",
};

interface ScoreProps {
  score: ContrastScore | null;
}

export function Score({ score }: ScoreProps) {
  return (
    <section className="flex flex-col gap-2.5" aria-label="Contrast score">
      <div className="overflow-hidden rounded-[8px]">
        <div className="flex h-9 items-center rounded-t-[8px] bg-[var(--color-score-tab)] px-6">
          <span className="text-xs font-medium tracking-[0.1em] text-[var(--color-text-value)] uppercase">
            WCAG
          </span>
        </div>
        <div
          className={cn(
            "flex h-[128px] items-end gap-3 rounded-br-[16px] rounded-bl-[16px] px-6 py-7 transition-colors duration-300",
            score
              ? gradeStyles[score.grade]
              : "bg-[var(--color-chrome-raised)] text-[var(--color-text-muted)]",
          )}
        >
          {score ? (
            <>
              <TubeText className="min-w-0 flex-1 text-[52px] leading-none tabular-nums">
                {score.value.toFixed(2)}
              </TubeText>
              <span className="max-w-16 pb-1 text-right text-[11px] leading-3 font-semibold">
                {score.grade}
              </span>
            </>
          ) : (
            <Skeleton className="h-14 w-full bg-white/8" />
          )}
        </div>
      </div>
      <p className="min-h-10 text-xs leading-5 text-[var(--color-text-muted)]">
        {score?.description ?? "Extracting a readable color pair from the photo."}
      </p>
    </section>
  );
}
