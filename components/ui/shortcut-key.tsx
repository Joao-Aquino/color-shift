"use client";

import { useSyncExternalStore } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react/ArrowLeft";
import { ArrowRightIcon } from "@phosphor-icons/react/ArrowRight";
import { CommandIcon } from "@phosphor-icons/react/Command";
import { ControlIcon } from "@phosphor-icons/react/Control";

export type Shortcut = "B" | "C" | "F" | "H" | "S" | "T" | "Space" | "ArrowLeft" | "ArrowRight" | "Undo" | "Export";

const subscribe = () => () => {};
const isApplePlatform = () => /Mac|iPhone|iPad|iPod/.test(navigator.platform);
const serverPlatform = () => false;

export function ShortcutKey({ shortcut, withModifier }: { shortcut: Shortcut; withModifier?: boolean }) {
  const apple = useSyncExternalStore(subscribe, isApplePlatform, serverPlatform);
  const ModifierIcon = apple ? CommandIcon : ControlIcon;
  const modified = withModifier || shortcut === "Undo" || shortcut === "Export";
  const key = shortcut === "Undo" ? "Z" : shortcut === "Export" ? "S" : shortcut;
  const label = modified ? `${apple ? "Command" : "Control"} + ${key}`
    : shortcut === "ArrowLeft" ? "Left arrow"
    : shortcut === "ArrowRight" ? "Right arrow" : shortcut;

  return (
    <kbd aria-label={label} className="cs-shortcut-key" data-slot="shortcut-key">
      {modified ? <><ModifierIcon aria-hidden size={16} weight="regular" /><span>{key}</span></>
        : shortcut === "ArrowLeft" ? <ArrowLeftIcon aria-hidden size={16} weight="regular" />
        : shortcut === "ArrowRight" ? <ArrowRightIcon aria-hidden size={16} weight="regular" />
        : shortcut}
    </kbd>
  );
}
