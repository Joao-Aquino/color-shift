import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ColorTarget } from "@/types/color-shift";

import { Swatch } from "./swatch";
import { TubeText } from "./tube-text";

interface ColorFieldProps {
  active: boolean;
  label: string;
  color: string;
  target: ColorTarget;
  onSelect: (target: ColorTarget) => void;
}

function ColorField({ active, label, color, target, onSelect }: ColorFieldProps) {
  return (
    <button
      aria-controls="color-editor"
      aria-expanded={active}
      className={cn(
        "flex h-12 w-full items-center gap-2 rounded-full border py-2 pr-2 pl-4 text-left transition-[background-color,border-color] duration-200 focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:outline-none",
        active
          ? "border-[var(--color-chrome-border-strong)]"
          : "border-transparent hover:border-[var(--color-chrome-border)]",
      )}
      data-color-field={target}
      onClick={() => onSelect(target)}
      style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}
      type="button"
    >
      <span className="text-xs font-medium tracking-[0.1em] text-[var(--color-text-label)] uppercase">
        {label}
      </span>
      <TubeText className="min-w-0 flex-1 text-right text-sm text-[var(--color-text-value)] tabular-nums">
        {color}
      </TubeText>
      <Swatch color={color} />
    </button>
  );
}
interface ColorFieldsProps {
  activeTarget: ColorTarget | null;
  background: string | null;
  foreground: string | null;
  onSelect: (target: ColorTarget) => void;
}

export function ColorFields({
  activeTarget,
  background,
  foreground,
  onSelect,
}: ColorFieldsProps) {
  return (
    <section className="flex flex-col gap-3" aria-label="Selected colors">
      {background && foreground ? (
        <>
          <ColorField
            active={activeTarget === "background"}
            color={background}
            label="Background"
            onSelect={onSelect}
            target="background"
          />
          <ColorField
            active={activeTarget === "foreground"}
            color={foreground}
            label="Foreground"
            onSelect={onSelect}
            target="foreground"
          />
        </>
      ) : (
        <>
          <Skeleton className="h-12 rounded-full bg-[var(--color-chrome-raised)]" />
          <Skeleton className="h-12 rounded-full bg-[var(--color-chrome-raised)]" />
        </>
      )}
    </section>
  );
}
