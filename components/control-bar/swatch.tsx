import { cn } from "@/lib/utils";

interface SwatchProps {
  color: string;
  className?: string;
}

function isDark(hex: string) {
  const value = hex.replace("#", "");
  if (value.length !== 6) return true;

  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 < 128;
}

export function Swatch({ color, className }: SwatchProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("size-8 shrink-0 rounded-full border", className)}
      style={{
        backgroundColor: color,
        borderColor: isDark(color)
          ? "rgba(255, 255, 255, 0.24)"
          : "rgba(0, 0, 0, 0.22)",
      }}
    />
  );
}
