import {
  clampChroma,
  converter,
  formatHex,
  wcagContrast,
  type Oklch,
} from "culori";

import type { ContrastScore } from "@/types/color-shift";

const toOklch = converter("oklch");
const SEARCH_STEPS = 28;

function candidateHex(color: Oklch, lightness: number) {
  const candidate = clampChroma(
    { ...color, l: lightness },
    "oklch",
    "rgb",
  );
  return formatHex(candidate).toUpperCase();
}

function searchDarker(color: Oklch, against: string, target: number) {
  const endpoint = candidateHex(color, 0);
  if (wcagContrast(endpoint, against) < target) return null;

  let passing = 0;
  let failing = color.l;

  for (let step = 0; step < SEARCH_STEPS; step += 1) {
    const lightness = (passing + failing) / 2;
    const hex = candidateHex(color, lightness);

    if (wcagContrast(hex, against) >= target) passing = lightness;
    else failing = lightness;
  }

  return candidateHex(color, passing);
}

function searchLighter(color: Oklch, against: string, target: number) {
  const endpoint = candidateHex(color, 1);
  if (wcagContrast(endpoint, against) < target) return null;

  let failing = color.l;
  let passing = 1;

  for (let step = 0; step < SEARCH_STEPS; step += 1) {
    const lightness = (failing + passing) / 2;
    const hex = candidateHex(color, lightness);

    if (wcagContrast(hex, against) >= target) passing = lightness;
    else failing = lightness;
  }

  return candidateHex(color, passing);
}

export function bumpToContrast(color: string, against: string, target: number) {
  const normalized = formatHex(color)?.toUpperCase() ?? color.toUpperCase();
  if (wcagContrast(normalized, against) >= target) return normalized;

  const oklch = toOklch(normalized);
  if (!oklch) return normalized;

  const darker = searchDarker(oklch, against, target);
  const lighter = searchLighter(oklch, against, target);
  const candidates = [darker, lighter].filter((value): value is string => !!value);

  if (candidates.length === 0) {
    const black = "#000000";
    const white = "#FFFFFF";
    return wcagContrast(black, against) >= wcagContrast(white, against)
      ? black
      : white;
  }

  return candidates.reduce((closest, candidate) => {
    const closestColor = toOklch(closest);
    const candidateColor = toOklch(candidate);
    if (!closestColor || !candidateColor) return closest;

    return Math.abs(candidateColor.l - oklch.l) <
      Math.abs(closestColor.l - oklch.l)
      ? candidate
      : closest;
  });
}

export function getContrastScore(
  foreground: string,
  background: string,
): ContrastScore {
  const value = wcagContrast(foreground, background);

  if (value >= 7) {
    return {
      algorithm: "WCAG",
      value,
      grade: "AAA",
      description: "Excellent contrast for text at every supported size.",
    };
  }

  if (value >= 4.5) {
    return {
      algorithm: "WCAG",
      value,
      grade: "AA",
      description: "Good contrast for small text and excellent for large text.",
    };
  }

  if (value >= 3) {
    return {
      algorithm: "WCAG",
      value,
      grade: "AA Large",
      description: "Suitable for large text only. Small text needs more contrast.",
    };
  }

  return {
    algorithm: "WCAG",
    value,
    grade: "Fail",
    description: "This pair needs more contrast to remain readable.",
  };
}
