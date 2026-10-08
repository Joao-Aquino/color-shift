"use client";

import type { Theme } from "@/lib/theme";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ShortcutKey } from "@/components/ui/shortcut-key";

export function ThemeToggle({ theme, onChange }: { theme: Theme; onChange: (theme: Theme) => void }) {
  return (
    <div className="cs-theme-toggle" role="group" aria-label="Color theme">
      {(["light", "dark"] as const).map((value) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <button
              aria-pressed={theme === value}
              aria-keyshortcuts="T"
              className="cs-theme-option"
              data-theme-choice={value}
              onClick={() => onChange(value)}
              type="button"
            >
              {value === "light" ? "Light" : "Dark"}
            </button>
          </TooltipTrigger>
          <TooltipContent className="cs-shortcut-tooltip" side="bottom" sideOffset={8}>
            <span>Toggle theme</span><ShortcutKey shortcut="T" />
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
