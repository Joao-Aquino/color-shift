import { ColorFields } from "./color-fields";
import { ControlsBar } from "./controls-bar";
import { Score } from "./score";
import type { ContrastScore } from "@/types/color-shift";

interface ControlContainerProps {
  score: ContrastScore | null;
  background: string | null;
  foreground: string | null;
  canGoPrevious: boolean;
  canGoNext: boolean;
  disabled?: boolean;
  onPrevious: () => void;
  onShuffle: () => void;
  onSwap: () => void;
  onNext: () => void;
}

function Divider() {
  return <div className="h-px bg-[var(--color-chrome-divider)]" />;
}

export function ControlContainer({
  score,
  background,
  foreground,
  canGoPrevious,
  canGoNext,
  disabled,
  onPrevious,
  onShuffle,
  onSwap,
  onNext,
}: ControlContainerProps) {
  return (
    <aside
      aria-label="Color Shift controls"
      className="flex h-full w-[320px] shrink-0 flex-col"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1">
        <header className="flex h-6 items-center">
          <h1 className="text-base font-medium text-[var(--color-text-value)] uppercase">
            Color<span className="font-black">Shift</span>
          </h1>
        </header>
        <Divider />
        <Score score={score} />
        <Divider />
        <ColorFields background={background} foreground={foreground} />
        <div data-slot="editor-region" className="min-h-0 flex-1" aria-hidden />
      </div>

      <div className="shrink-0 pt-6">
        <ControlsBar
          canGoNext={canGoNext}
          canGoPrevious={canGoPrevious}
          disabled={disabled}
          onNext={onNext}
          onPrevious={onPrevious}
          onShuffle={onShuffle}
          onSwap={onSwap}
        />
        <div data-slot="export-region" className="h-0" aria-hidden />
      </div>
    </aside>
  );
}
