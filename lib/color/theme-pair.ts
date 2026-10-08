import { clampChroma, converter, formatHex } from "culori";

import { bumpToContrast } from "./contrast";
import type { Theme } from "@/lib/theme";
import type { ColorPair } from "@/types/color-shift";

const toOklch = converter("oklch");

/** Preserve the photograph's hues while giving generated pairs theme polarity. */
export function adaptColorPairToTheme(pair: ColorPair, theme: Theme): ColorPair {
  const a = toOklch(pair.background)!;
  const b = toOklch(pair.foreground)!;
  const lighter = a.l >= b.l ? a : b;
  const darker = lighter === a ? b : a;
  const backgroundSeed = theme === "light" ? lighter : darker;
  const foregroundSeed = theme === "light" ? darker : lighter;
  const background = formatHex(clampChroma({
    ...backgroundSeed,
    l: theme === "light" ? Math.max(backgroundSeed.l, 0.82) : Math.min(backgroundSeed.l, 0.28),
  }, "oklch", "rgb")).toUpperCase();
  const originalForeground = formatHex(foregroundSeed).toUpperCase();
  const foregroundTone = formatHex(clampChroma({
    ...foregroundSeed,
    l: theme === "light" ? Math.min(foregroundSeed.l, 0.35) : Math.max(foregroundSeed.l, 0.82),
  }, "oklch", "rgb")).toUpperCase();
  const foreground = bumpToContrast(foregroundTone, background, 4.5);
  return { ...pair, background, foreground, originalForeground, wasBumped: foreground !== originalForeground };
}
