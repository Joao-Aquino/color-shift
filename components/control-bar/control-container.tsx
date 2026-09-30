import { ColorFields } from "./color-fields";
import { ControlsBar } from "./controls-bar";
import { Score } from "./score";
import type {
  ColorTarget,
  ContrastAlgorithm,
  ContrastScore,
} from "@/types/color-shift";

interface ControlContainerProps {
  activeTarget: ColorTarget | null;
  algorithm: ContrastAlgorithm;
  scoreExpanded: boolean;
  nearestThreshold: number;
  selectedThreshold: number;
  thresholds: readonly number[];
  score: ContrastScore | null;
  background: string | null;
  foreground: string | null;
  editor: React.ReactNode;
  canGoPrevious: boolean;
  canGoNext: boolean;
  canUndo: boolean;
  canFix: boolean;
  disabled?: boolean;
  onSelectColor: (target: ColorTarget) => void;
  onAlgorithmChange: (algorithm: ContrastAlgorithm) => void;
  onScoreExpandedChange: (expanded: boolean) => void;
  onThresholdSelect: (threshold: number) => void;
  onPrevious: () => void;
  onUndo: () => void;
  onShuffle: () => void;
  onSwap: () => void;
  onFix: () => void;
  onNext: () => void;
}

function Divider() {
  return <div className="h-px bg-[var(--color-chrome-divider)]" />;
}

export function ControlContainer({
  activeTarget,
  algorithm,
  scoreExpanded,
  nearestThreshold,
  selectedThreshold,
  thresholds,
  score,
  background,
  foreground,
  editor,
  canGoPrevious,
  canGoNext,
  canUndo,
  canFix,
  disabled,
  onSelectColor,
  onAlgorithmChange,
  onScoreExpandedChange,
  onThresholdSelect,
  onPrevious,
  onUndo,
  onShuffle,
  onSwap,
  onFix,
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
        <Score
          algorithm={algorithm}
          expanded={scoreExpanded}
          nearestThreshold={nearestThreshold}
          onAlgorithmChange={onAlgorithmChange}
          onExpandedChange={onScoreExpandedChange}
          onThresholdSelect={onThresholdSelect}
          score={score}
          selectedThreshold={selectedThreshold}
          thresholds={thresholds}
        />
        <Divider />
        <ColorFields
          activeTarget={activeTarget}
          background={background}
          foreground={foreground}
          onSelect={onSelectColor}
        />
        <div className="min-h-0" data-slot="editor-region" id="color-editor">
          {editor}
        </div>
        <div className="min-h-0 flex-1" aria-hidden />
      </div>

      <div className="shrink-0 pt-6">
        <ControlsBar
          canFix={canFix}
          canGoNext={canGoNext}
          canGoPrevious={canGoPrevious}
          canUndo={canUndo}
          disabled={disabled}
          onFix={onFix}
          onNext={onNext}
          onPrevious={onPrevious}
          onUndo={onUndo}
          onShuffle={onShuffle}
          onSwap={onSwap}
        />
        <div data-slot="export-region" className="h-0" aria-hidden />
      </div>
    </aside>
  );
}
