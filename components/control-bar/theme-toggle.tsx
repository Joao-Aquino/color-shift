"use client";

import type { Theme } from "@/lib/theme";

export function ThemeToggle({ theme, onChange }: { theme: Theme; onChange: (theme: Theme) => void }) {
  return (
    <div className="cs-theme-toggle" role="group" aria-label="Color theme">
      {(["light", "dark"] as const).map((value) => (
        <button
          aria-pressed={theme === value}
          className="cs-theme-option"
          data-theme-choice={value}
          key={value}
          onClick={() => onChange(value)}
          type="button"
        >
          {value === "light" ? "Light" : "Dark"}
        </button>
      ))}
    </div>
  );
}
