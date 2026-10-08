"use client";

import { ArrowLeftIcon } from "@phosphor-icons/react/ArrowLeft";
import { ArrowRightIcon } from "@phosphor-icons/react/ArrowRight";
import { ArrowUUpLeftIcon } from "@phosphor-icons/react/ArrowUUpLeft";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react/ArrowsClockwise";
import { ArrowsLeftRightIcon } from "@phosphor-icons/react/ArrowsLeftRight";
import { WrenchIcon } from "@phosphor-icons/react/Wrench";

import { IconButton } from "./icon-button";
import type { Shortcut } from "@/components/ui/shortcut-key";

const shortcuts: Partial<Record<"previous" | "undo" | "shuffle" | "swap" | "fix" | "next", { key: Shortcut; label: string; aria: string }>> = {
  previous: { key: "ArrowLeft", label: "Previous photo", aria: "ArrowLeft" },
  undo: { key: "Undo", label: "Undo color edit", aria: "Meta+Z Control+Z" },
  shuffle: { key: "Space", label: "New random photo", aria: "Space" },
  swap: { key: "S", label: "Swap colors", aria: "S" },
  next: { key: "ArrowRight", label: "Next photo", aria: "ArrowRight" },
  fix: { key: "F", label: "Fix contrast to selected threshold", aria: "F" },
};

interface ControlsBarProps {
  group: "specimen" | "photo";
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
  group,
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
  const actions = {
    previous: { icon: ArrowLeftIcon, label: "Previous photo (Left arrow)", disabled: !canGoPrevious, run: onPrevious },
    undo: { icon: ArrowUUpLeftIcon, label: "Undo color edit (Command or Control + Z)", disabled: !canUndo, run: onUndo },
    shuffle: { icon: ArrowsClockwiseIcon, label: "New random photo (Space)", disabled: false, run: onShuffle },
    swap: { icon: ArrowsLeftRightIcon, label: "Swap colors (S)", disabled: false, run: onSwap },
    fix: { icon: WrenchIcon, label: "Fix contrast to selected threshold", disabled: !canFix, run: onFix },
    next: { icon: ArrowRightIcon, label: "Next photo (Right arrow)", disabled: !canGoNext, run: onNext },
  };
  const order: (keyof typeof actions)[] = group === "specimen"
    ? ["undo", "swap", "fix"]
    : ["previous", "shuffle", "next"];

  return (
    <div
      aria-label={group === "specimen" ? "Color actions" : "Photo controls"}
      className="cs-panel-actions"
      data-photo-actions
    >
      {order.map((key) => {
        const action = actions[key];
        return <IconButton
          className="cs-panel-action"
          data-action={key}
          data-fix-contrast={key === "fix" ? true : undefined}
          disabled={disabled || action.disabled}
          icon={action.icon}
          iconSize={16}
          key={key}
          label={action.label}
          tooltipLabel={shortcuts[key]?.label}
          shortcut={shortcuts[key]?.key}
          aria-keyshortcuts={shortcuts[key]?.aria}
          onClick={action.run}
        />;
      })}
    </div>
  );
}
