"use client";

import { ArrowLeftIcon } from "@phosphor-icons/react/ArrowLeft";
import { ArrowRightIcon } from "@phosphor-icons/react/ArrowRight";
import { ShuffleIcon } from "@phosphor-icons/react/Shuffle";
import { SwapIcon } from "@phosphor-icons/react/Swap";

import type { ControlBarState } from "@/types/color-shift";

import { IconButton } from "./icon-button";

interface ControlsBarProps {
  state?: ControlBarState;
  canGoPrevious: boolean;
  canGoNext: boolean;
  disabled?: boolean;
  onPrevious: () => void;
  onShuffle: () => void;
  onSwap: () => void;
  onNext: () => void;
}

export function ControlsBar({
  state = "default",
  canGoPrevious,
  canGoNext,
  disabled,
  onPrevious,
  onShuffle,
  onSwap,
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
      <span aria-hidden />
      <IconButton
        disabled={disabled}
        icon={ShuffleIcon}
        label="New random photo (Space)"
        onClick={onShuffle}
      />
      <IconButton
        disabled={disabled}
        icon={SwapIcon}
        label="Swap colors (S)"
        onClick={onSwap}
      />
      <span aria-hidden />
      <IconButton
        disabled={disabled || !canGoNext}
        icon={ArrowRightIcon}
        label="Next photo (Right arrow)"
        onClick={onNext}
      />
    </div>
  );
}
