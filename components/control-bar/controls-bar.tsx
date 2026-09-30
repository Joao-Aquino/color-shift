"use client";

import { ArrowLeftIcon } from "@phosphor-icons/react/ArrowLeft";
import { ArrowRightIcon } from "@phosphor-icons/react/ArrowRight";
import { ArrowUUpLeftIcon } from "@phosphor-icons/react/ArrowUUpLeft";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react/ArrowsClockwise";
import { ArrowsLeftRightIcon } from "@phosphor-icons/react/ArrowsLeftRight";
import { WrenchIcon } from "@phosphor-icons/react/Wrench";

import type { ControlBarState } from "@/types/color-shift";

import { IconButton } from "./icon-button";

interface ControlsBarProps {
  state?: ControlBarState;
  canGoPrevious: boolean;
  canGoNext: boolean;
  canUndo: boolean;
  canFix: boolean;
  disabled?: boolean;
  onPrevious: () => void;
  onUndo: () => void;
  onShuffle: () => void;
  onSwap: () => void;
  onFix: () => void;
  onNext: () => void;
}

export function ControlsBar({
  state = "default",
  canGoPrevious,
  canGoNext,
  canUndo,
  canFix,
  disabled,
  onPrevious,
  onUndo,
  onShuffle,
  onSwap,
  onFix,
  onNext,
}: ControlsBarProps) {
  if (state !== "default") return null;

  return (
    <div className="grid grid-cols-6 gap-1" aria-label="Photo controls">
      <IconButton
        disabled={disabled || !canGoPrevious}
        icon={ArrowLeftIcon}
        label="Previous photo (Left arrow)"
        onClick={onPrevious}
      />
      <IconButton
        disabled={disabled || !canUndo}
        icon={ArrowUUpLeftIcon}
        label="Undo color edit (Command or Control + Z)"
        onClick={onUndo}
      />
      <IconButton
        disabled={disabled}
        icon={ArrowsLeftRightIcon}
        label="New random photo (Space)"
        onClick={onShuffle}
      />
      <IconButton
        disabled={disabled}
        icon={ArrowsClockwiseIcon}
        label="Swap colors (S)"
        onClick={onSwap}
      />
      <IconButton
        data-fix-contrast
        disabled={disabled || !canFix}
        icon={WrenchIcon}
        label="Fix contrast to selected threshold"
        onClick={onFix}
      />
      <IconButton
        disabled={disabled || !canGoNext}
        icon={ArrowRightIcon}
        label="Next photo (Right arrow)"
        onClick={onNext}
      />
    </div>
  );
}
