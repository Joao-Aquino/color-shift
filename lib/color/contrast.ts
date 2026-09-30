import { calcAPCA } from "apca-w3";
import {
  clampChroma,
  converter,
  formatHex,
  wcagContrast,
  type Oklch,
} from "culori";

import type {
  ColorTarget,
  ContrastAlgorithm,
  ContrastGrade,
  ContrastScore,
} from "@/types/color-shift";

const toOklch = converter("oklch");
const LIGHTNESS_SAMPLES = 512;
const REFINE_STEPS = 18;

export const CONTRAST_THRESHOLDS: Record<ContrastAlgorithm, readonly number[]> = {
  WCAG: [1.5, 3, 4.5, 7],
  APCA: [30, 45, 60, 75],
};

export const DEFAULT_CONTRAST_THRESHOLD: Record<ContrastAlgorithm, number> = {
  WCAG: 4.5,
  APCA: 60,
};

interface ContrastAdjustment {
  color: string;
  against: string;
  algorithm: ContrastAlgorithm;
  target: number;
  colorTarget: ColorTarget;
  mode: "exact" | "minimum";
}

interface Candidate {
  hex: string;
  lightness: number;
  signedScore: number;
  score: number;
}

function candidateHex(color: Oklch, lightness: number) {
  const candidate = clampChroma(
    { ...color, l: lightness },
    "oklch",
    "rgb",
  );
  return formatHex(candidate).toUpperCase();
}

export function getSignedContrastValue(
  foreground: string,
  background: string,
  algorithm: ContrastAlgorithm,
) {
  return algorithm === "APCA"
    ? calcAPCA(foreground, background)
    : wcagContrast(foreground, background);
}

function gradeForScore(value: number, algorithm: ContrastAlgorithm): ContrastGrade {
  const [large, aa, aaa] =
    algorithm === "APCA" ? [45, 60, 75] : [3, 4.5, 7];

  if (value >= aaa) return "AAA";
  if (value >= aa) return "AA";
  if (value >= large) return "AA Large";
  return "Fail";
}

function descriptionForScore(
  grade: ContrastGrade,
  algorithm: ContrastAlgorithm,
) {
  if (algorithm === "APCA") {
    if (grade === "AAA") return "Excellent perceptual contrast for body text.";
    if (grade === "AA") return "Strong perceptual contrast for most text.";
    if (grade === "AA Large") return "Suitable for large text and display type.";
    return "This pair needs more perceptual contrast to remain readable.";
  }

  if (grade === "AAA") {
    return "Excellent contrast for text at every supported size.";
  }
  if (grade === "AA") {
    return "Good contrast for small text and excellent for large text.";
  }
  if (grade === "AA Large") {
    return "Suitable for large text only. Small text needs more contrast.";
  }
  return "This pair needs more contrast to remain readable.";
}

export function getContrastScore(
  foreground: string,
  background: string,
  algorithm: ContrastAlgorithm = "WCAG",
): ContrastScore {
  const signedValue = getSignedContrastValue(foreground, background, algorithm);
  const value = Math.abs(signedValue);
  const grade = gradeForScore(value, algorithm);

  return {
    algorithm,
    value,
    signedValue,
    grade,
    description: descriptionForScore(grade, algorithm),
  };
}

function getCandidate(
  base: Oklch,
  lightness: number,
  against: string,
  algorithm: ContrastAlgorithm,
  colorTarget: ColorTarget,
): Candidate {
  const hex = candidateHex(base, lightness);
  const signedScore =
    colorTarget === "foreground"
      ? getSignedContrastValue(hex, against, algorithm)
      : getSignedContrastValue(against, hex, algorithm);

  return {
    hex,
    lightness,
    signedScore,
    score: Math.abs(signedScore),
  };
}

function samePolarity(candidate: Candidate, polarity: number) {
  return polarity === 0 || Math.sign(candidate.signedScore) === polarity;
}

function isBetterExact(
  candidate: Candidate,
  best: Candidate,
  target: number,
  originalLightness: number,
) {
  const candidateError = Math.abs(candidate.score - target);
  const bestError = Math.abs(best.score - target);
  if (Math.abs(candidateError - bestError) > 0.0001) {
    return candidateError < bestError;
  }

  return (
    Math.abs(candidate.lightness - originalLightness) <
    Math.abs(best.lightness - originalLightness)
  );
}

function selectBestCandidate(
  candidates: Candidate[],
  target: number,
  originalLightness: number,
  mode: ContrastAdjustment["mode"],
) {
  if (mode === "minimum") {
    const passing = candidates.filter((candidate) => candidate.score >= target);
    if (passing.length > 0) {
      return passing.reduce((best, candidate) =>
        Math.abs(candidate.lightness - originalLightness) <
        Math.abs(best.lightness - originalLightness)
          ? candidate
          : best,
      );
    }

    return candidates.reduce((best, candidate) =>
      candidate.score > best.score ? candidate : best,
    );
  }

  const maximum = candidates.reduce((best, candidate) =>
    candidate.score > best.score ? candidate : best,
  );
  if (maximum.score < target) return maximum;

  return candidates.reduce((best, candidate) =>
    isBetterExact(candidate, best, target, originalLightness)
      ? candidate
      : best,
  );
}

export function adjustColorToContrast({
  color,
  against,
  algorithm,
  target,
  colorTarget,
  mode,
}: ContrastAdjustment) {
  const normalized = formatHex(color)?.toUpperCase() ?? color.toUpperCase();
  const base = toOklch(normalized);
  if (!base) return normalized;

  const current = getCandidate(
    base,
    base.l,
    against,
    algorithm,
    colorTarget,
  );
  if (mode === "minimum" && current.score >= target) return normalized;

  const polarity = algorithm === "APCA" ? Math.sign(current.signedScore) : 0;
  const sampled: Candidate[] = [];

  for (let step = 0; step <= LIGHTNESS_SAMPLES; step += 1) {
    const candidate = getCandidate(
      base,
      step / LIGHTNESS_SAMPLES,
      against,
      algorithm,
      colorTarget,
    );
    if (samePolarity(candidate, polarity)) sampled.push(candidate);
  }

  sampled.push(current);
  let best = selectBestCandidate(sampled, target, base.l, mode);
  let interval = 1 / LIGHTNESS_SAMPLES;

  for (let step = 0; step < REFINE_STEPS; step += 1) {
    const left = Math.max(0, best.lightness - interval);
    const right = Math.min(1, best.lightness + interval);
    const middleLeft = getCandidate(
      base,
      (left + best.lightness) / 2,
      against,
      algorithm,
      colorTarget,
    );
    const middleRight = getCandidate(
      base,
      (best.lightness + right) / 2,
      against,
      algorithm,
      colorTarget,
    );
    const refined = [best, middleLeft, middleRight].filter((candidate) =>
      samePolarity(candidate, polarity),
    );
    best = selectBestCandidate(refined, target, base.l, mode);
    interval /= 2;
  }

  return best.hex;
}

export function bumpToContrast(color: string, against: string, target: number) {
  return adjustColorToContrast({
    color,
    against,
    algorithm: "WCAG",
    target,
    colorTarget: "foreground",
    mode: "minimum",
  });
}
