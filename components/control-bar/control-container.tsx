import { ColorFields } from "./color-fields";
import { ControlsBar } from "./controls-bar";
import { ExportControls } from "./export-controls";
import { Score } from "./score";
import { ControlFooter } from "./control-footer";
import { MobileActions } from "./mobile-actions";
import { ThemeToggle } from "./theme-toggle";
import type { Theme } from "@/lib/theme";
import type {
  ColorTarget,
  ContrastAlgorithm,
  ContrastScore,
  Photo,
} from "@/types/color-shift";

interface ControlContainerProps {
  preview: React.ReactNode;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  activeTarget: ColorTarget | null;
  algorithm: ContrastAlgorithm;
  scoreExpanded: boolean;
  nearestThreshold: number;
  selectedThreshold: number;
  thresholds: readonly number[];
  score: ContrastScore | null;
  background: string | null;
  foreground: string | null;
  photo: Photo | null;
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
  preview,
  theme,
  onThemeChange,
  activeTarget,
  algorithm,
  scoreExpanded,
  nearestThreshold,
  selectedThreshold,
  thresholds,
  score,
  background,
  foreground,
  photo,
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
  const actions = {
    canFix, canGoNext, canGoPrevious, canUndo, disabled,
    onFix, onNext, onPrevious, onUndo, onShuffle, onSwap,
  };
  return (
    <>
      <header className="cs-header">
        <h1 className="font-medium text-[var(--color-text-value)] uppercase">
          Color<span className="font-black">Shift</span>
        </h1>
        <ThemeToggle onChange={onThemeChange} theme={theme} />
      </header>
      {preview}
      <aside
        aria-label="Color Shift controls"
        data-responsive-motion="controls"
        className="cs-controls"
      >
        <div className="hidden desktop:block"><Divider /></div>
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
          editor={editor}
          foreground={foreground}
          onSelect={onSelectColor}
        />
      </aside>
      <ControlFooter>
        <ExportControls
          background={background}
          disabled={disabled}
          foreground={foreground}
          photo={photo}
        >
          <div className="cs-inline-actions"><ControlsBar {...actions} /></div>
          <MobileActions>
            <ControlsBar {...actions} vertical />
          </MobileActions>
        </ExportControls>
      </ControlFooter>
    </>
  );
}
