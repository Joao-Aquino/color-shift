"use client";

import type { Icon } from "@phosphor-icons/react/lib";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface IconButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "children"> {
  icon: Icon;
  label: string;
  tooltipSide?: React.ComponentProps<typeof TooltipContent>["side"];
}

export function IconButton({
  icon: IconComponent,
  label,
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
          <IconComponent aria-hidden size={20} weight="regular" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide} sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
