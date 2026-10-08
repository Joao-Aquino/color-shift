"use client";

import type { Icon } from "@phosphor-icons/react/lib";

import { Button } from "@/components/ui/button";
import { ShortcutKey, type Shortcut } from "@/components/ui/shortcut-key";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface IconButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "children"> {
  icon: Icon;
  iconSize?: number;
  label: string;
  tooltipLabel?: string;
  shortcut?: Shortcut;
  tooltipSide?: React.ComponentProps<typeof TooltipContent>["side"];
}

export function IconButton({
  icon: IconComponent,
  iconSize = 20,
  label,
  tooltipLabel = label,
  shortcut,
  tooltipSide = "top",
  className,
  ...props
}: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          className={cn(
            "h-12 w-full rounded-full border border-[var(--color-chrome-border)] bg-transparent text-[var(--color-text-value)] transition-[border-color,background-color,opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[var(--color-chrome-border-strong)] hover:bg-[var(--color-chrome-raised)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] active:translate-y-0 motion-safe:active:scale-[0.97] disabled:opacity-30",
            className,
          )}
          size="icon"
          variant="outline"
          {...props}
        >
          <IconComponent aria-hidden size={iconSize} weight="regular" />
        </Button>
      </TooltipTrigger>
      <TooltipContent className={shortcut ? "cs-shortcut-tooltip" : undefined} side={tooltipSide} sideOffset={8}>
        <span>{tooltipLabel}</span>
        {shortcut && <ShortcutKey shortcut={shortcut} />}
      </TooltipContent>
    </Tooltip>
  );
}
