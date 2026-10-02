"use client";

import { ArrowLeftIcon } from "@phosphor-icons/react/ArrowLeft";
import { ArrowRightIcon } from "@phosphor-icons/react/ArrowRight";
import { ArrowUUpLeftIcon } from "@phosphor-icons/react/ArrowUUpLeft";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react/ArrowsClockwise";
import { ArrowsLeftRightIcon } from "@phosphor-icons/react/ArrowsLeftRight";
import { WrenchIcon } from "@phosphor-icons/react/Wrench";

import type { ControlBarState } from "@/types/color-shift";

import { IconButton } from "./icon-button";
import { cn } from "@/lib/utils";

interface ControlsBarProps {
  vertical?: boolean;
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
  vertical = false,
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

  const actions = {
    previous: { icon: ArrowLeftIcon, label: "Previous photo (Left arrow)", disabled: !canGoPrevious, run: onPrevious },
    undo: { icon: ArrowUUpLeftIcon, label: "Undo color edit (Command or Control + Z)", disabled: !canUndo, run: onUndo },
    shuffle: { icon: vertical ? ArrowsClockwiseIcon : ArrowsLeftRightIcon, label: "New random photo (Space)", disabled: false, run: onShuffle },
    swap: { icon: vertical ? ArrowsLeftRightIcon : ArrowsClockwiseIcon, label: "Swap colors (S)", disabled: false, run: onSwap },
    fix: { icon: WrenchIcon, label: "Fix contrast to selected threshold", disabled: !canFix, run: onFix },
    next: { icon: ArrowRightIcon, label: "Next photo (Right arrow)", disabled: !canGoNext, run: onNext },
  };
  const order: (keyof typeof actions)[] = vertical
    ? ["undo", "shuffle", "swap", "fix", "previous", "next"]
    : ["previous", "undo", "shuffle", "swap", "fix", "next"];

  return (
    <div className={cn("grid gap-1", vertical ? "grid-cols-1" : "grid-cols-6")} aria-label="Photo controls">
      {order.map((key) => {
        const action = actions[key];
        return <IconButton
          data-action={key}
          data-fix-contrast={key === "fix" ? true : undefined}
          disabled={disabled || action.disabled}
          icon={action.icon}
          key={key}
          label={action.label}
          onClick={action.run}
        />;
      })}
    </div>
  );
}
