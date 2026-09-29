import { Skeleton } from "@/components/ui/skeleton";

import { Swatch } from "./swatch";
import { TubeText } from "./tube-text";

interface ColorFieldProps {
  label: string;
  color: string;
}

function ColorField({ label, color }: ColorFieldProps) {
  return (
    <div
      className="flex h-12 items-center gap-2 rounded-full border border-transparent py-2 pr-2 pl-4 transition-colors duration-300"
      style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}
    >
      <span className="text-xs font-medium tracking-[0.1em] text-[var(--color-text-label)] uppercase">
        {label}
      </span>
      <TubeText className="min-w-0 flex-1 text-right text-sm text-[var(--color-text-value)] tabular-nums">
        {color}
      </TubeText>
      <Swatch color={color} />
    </div>
  );
}
interface ColorFieldsProps {
  background: string | null;
  foreground: string | null;
}

export function ColorFields({ background, foreground }: ColorFieldsProps) {
  return (
    <section className="flex flex-col gap-3" aria-label="Selected colors">
      {background && foreground ? (
        <>
          <ColorField color={background} label="Background" />
          <ColorField color={foreground} label="Foreground" />
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
