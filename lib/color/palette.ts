import { wcagContrast } from "culori";
import { Vibrant } from "node-vibrant/browser";

import { bumpToContrast } from "@/lib/color/contrast";
import type {
  ColorPair,
  ExtractedPalette,
  PaletteName,
  PaletteSwatch,
} from "@/types/color-shift";

const PALETTE_NAMES: PaletteName[] = [
  "Vibrant",
  "DarkVibrant",
  "LightVibrant",
  "Muted",
  "DarkMuted",
  "LightMuted",
];

function selectPair(palette: ExtractedPalette) {
  const swatches = Object.values(palette).filter(
    (swatch): swatch is PaletteSwatch => !!swatch,
  );
  const highestPopulation = Math.max(
    1,
    ...swatches.map((swatch) => swatch.population),
  );

  let best:
    | { background: PaletteSwatch; foreground: PaletteSwatch; score: number }
    | undefined;

  for (let first = 0; first < swatches.length; first += 1) {
    for (let second = first + 1; second < swatches.length; second += 1) {
      const a = swatches[first];
      const b = swatches[second];
      const background =
        a.population >= b.population ? a : b;
      const foreground = background === a ? b : a;
      const contrast = wcagContrast(a.hex, b.hex);
      const prominence =
        (background.population + foreground.population * 0.35) /
        highestPopulation;
      const character = foreground.vibrancy * 0.75 + background.vibrancy * 0.25;
      const score = Math.min(contrast, 10) * 2.4 + prominence + character;

      if (!best || score > best.score) {
        best = { background, foreground, score };
      }
    }
  }

  return best;
}

export async function extractColorPair(imageUrl: string): Promise<ColorPair> {
  const vibrantPalette = await Vibrant.from(imageUrl)
    .maxDimension(420)
    .quality(3)
    .getPalette();
  const palette: ExtractedPalette = {};

  PALETTE_NAMES.forEach((name) => {
    const swatch = vibrantPalette[name];
    if (!swatch) return;

    palette[name] = {
      name,
      hex: swatch.hex.toUpperCase(),
      population: swatch.population,
      vibrancy: swatch.hsl[1],
    };
  });

  const selected = selectPair(palette);
  if (!selected) throw new Error("No usable colors were found in this photo.");

  const originalForeground = selected.foreground.hex;
  const foreground = bumpToContrast(
    originalForeground,
    selected.background.hex,
    4.5,
  );

  return {
    background: selected.background.hex,
    foreground,
    originalForeground,
    wasBumped: foreground !== originalForeground,
    palette,
  };
}

export function createFallbackPair(photoColor: string): ColorPair {
  const background = photoColor.toUpperCase();
  const black = "#000000";
  const white = "#FFFFFF";
  const foreground =
    wcagContrast(black, background) >= wcagContrast(white, background)
      ? black
      : white;

  return {
    background,
    foreground,
    originalForeground: foreground,
    wasBumped: false,
    palette: {},
  };
}
