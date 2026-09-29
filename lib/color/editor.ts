import {
  clampChroma,
  converter,
  displayable,
  formatHex,
  parse,
  type Color,
  type Hsl,
  type Hsv,
  type Oklch,
  type Rgb,
} from "culori";

import type { ColorFormat } from "@/types/color-shift";

const toRgb = converter("rgb");
const toHsl = converter("hsl");
const toHsv = converter("hsv");
const toOklch = converter("oklch");
const GAMUT_SEARCH_STEPS = 24;

export type ColorChannelKey = "r" | "g" | "b" | "h" | "s" | "l" | "v" | "c";

export interface EditorChannel {
  key: ColorChannelKey;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  precision: number;
  display: "decimal" | "hex";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hue(value: number | undefined, fallback: number) {
  if (value === undefined || Number.isNaN(value)) return fallback;
  return ((value % 360) + 360) % 360;
}

function round(value: number, precision: number) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function colorToHex(color: Color | string) {
  const parsed = typeof color === "string" ? parse(color) : color;
  if (!parsed) return null;
  if (parsed.alpha !== undefined && parsed.alpha < 1) return null;

  const mapped = clampChroma(parsed, "oklch", "rgb");
  return formatHex(mapped)?.toUpperCase() ?? null;
}

export function maxOklchChroma(lightness: number, colorHue: number) {
  let passing = 0;
  let failing = 0.5;

  for (let step = 0; step < GAMUT_SEARCH_STEPS; step += 1) {
    const chroma = (passing + failing) / 2;
    const candidate: Oklch = {
      mode: "oklch",
      l: clamp(lightness, 0, 1),
      c: chroma,
      h: hue(colorHue, 0),
    };

    if (displayable(candidate)) passing = chroma;
    else failing = chroma;
  }

  return passing;
}

export function getEditorChannels(
  color: string,
  format: ColorFormat,
  fallbackHue = 0,
): EditorChannel[] {
  if (format === "HEX" || format === "RGB") {
    const rgb = toRgb(color);
    if (!rgb) return [];
    const display = format === "HEX" ? "hex" : "decimal";

    return [
      { key: "r", label: "Red", value: rgb.r * 255, min: 0, max: 255, step: 1, precision: 0, display },
      { key: "g", label: "Green", value: rgb.g * 255, min: 0, max: 255, step: 1, precision: 0, display },
      { key: "b", label: "Blue", value: rgb.b * 255, min: 0, max: 255, step: 1, precision: 0, display },
    ];
  }

  if (format === "HSL") {
    const hsl = toHsl(color);
    if (!hsl) return [];
    return [
      { key: "h", label: "Hue", value: hue(hsl.h, fallbackHue), min: 0, max: 360, step: 1, precision: 0, display: "decimal" },
      { key: "s", label: "Saturation", value: hsl.s * 100, min: 0, max: 100, step: 1, precision: 0, display: "decimal" },
      { key: "l", label: "Lightness", value: hsl.l * 100, min: 0, max: 100, step: 1, precision: 0, display: "decimal" },
    ];
  }

  if (format === "HSB") {
    const hsv = toHsv(color);
    if (!hsv) return [];
    return [
      { key: "h", label: "Hue", value: hue(hsv.h, fallbackHue), min: 0, max: 360, step: 1, precision: 0, display: "decimal" },
      { key: "s", label: "Saturation", value: hsv.s * 100, min: 0, max: 100, step: 1, precision: 0, display: "decimal" },
      { key: "v", label: "Brightness", value: hsv.v * 100, min: 0, max: 100, step: 1, precision: 0, display: "decimal" },
    ];
  }

  const oklch = toOklch(color);
  if (!oklch) return [];
  const resolvedHue = hue(oklch.h, fallbackHue);
  const maxChroma = maxOklchChroma(oklch.l, resolvedHue);

  return [
    { key: "l", label: "Lightness", value: oklch.l * 100, min: 0, max: 100, step: 0.1, precision: 1, display: "decimal" },
    { key: "c", label: "Chroma", value: oklch.c, min: 0, max: maxChroma, step: 0.001, precision: 3, display: "decimal" },
    { key: "h", label: "Hue", value: resolvedHue, min: 0, max: 360, step: 1, precision: 0, display: "decimal" },
  ];
}

export function updateColorChannel(
  color: string,
  format: ColorFormat,
  channel: ColorChannelKey,
  value: number,
  fallbackHue = 0,
) {
  let candidate: Color | undefined;

  if (format === "HEX" || format === "RGB") {
    const rgb = toRgb(color);
    if (!rgb) return color;
    const next: Rgb = { ...rgb };
    if (channel === "r" || channel === "g" || channel === "b") {
      next[channel] = clamp(value, 0, 255) / 255;
    }
    candidate = next;
  } else if (format === "HSL") {
    const hsl = toHsl(color);
    if (!hsl) return color;
    const next: Hsl = { ...hsl, h: hue(hsl.h, fallbackHue) };
    if (channel === "h") next.h = hue(value, fallbackHue);
    if (channel === "s") next.s = clamp(value, 0, 100) / 100;
    if (channel === "l") next.l = clamp(value, 0, 100) / 100;
    candidate = next;
  } else if (format === "HSB") {
    const hsv = toHsv(color);
    if (!hsv) return color;
    const next: Hsv = { ...hsv, h: hue(hsv.h, fallbackHue) };
    if (channel === "h") next.h = hue(value, fallbackHue);
    if (channel === "s") next.s = clamp(value, 0, 100) / 100;
    if (channel === "v") next.v = clamp(value, 0, 100) / 100;
    candidate = next;
  } else {
    const oklch = toOklch(color);
    if (!oklch) return color;
    const next: Oklch = { ...oklch, h: hue(oklch.h, fallbackHue) };
    if (channel === "l") next.l = clamp(value, 0, 100) / 100;
    if (channel === "h") next.h = hue(value, fallbackHue);

    const maximum = maxOklchChroma(next.l, next.h ?? fallbackHue);
    if (channel === "c") next.c = clamp(value, 0, maximum);
    else next.c = Math.min(next.c, maximum);
    candidate = next;
  }

  return colorToHex(candidate) ?? color;
}

function gradientHex(color: Color) {
  return colorToHex(color) ?? "#000000";
}

export function getChannelGradient(
  color: string,
  format: ColorFormat,
  channel: ColorChannelKey,
  fallbackHue = 0,
) {
  if (format === "HEX" || format === "RGB") {
    const rgb = toRgb(color);
    if (!rgb) return "transparent";
    const start: Rgb = { ...rgb };
    const end: Rgb = { ...rgb };
    if (channel === "r" || channel === "g" || channel === "b") {
      start[channel] = 0;
      end[channel] = 1;
    }
    return `linear-gradient(to right, ${gradientHex(start)}, ${gradientHex(end)})`;
  }

  if (format === "HSL") {
    const hsl = toHsl(color);
    if (!hsl) return "transparent";
    const currentHue = hue(hsl.h, fallbackHue);
    if (channel === "h") {
      const stops = [0, 60, 120, 180, 240, 300, 360].map(
        (stop) => gradientHex({ ...hsl, h: stop }),
      );
      return `linear-gradient(to right, ${stops.join(", ")})`;
    }
    if (channel === "s") {
      return `linear-gradient(to right, ${gradientHex({ ...hsl, h: currentHue, s: 0 })}, ${gradientHex({ ...hsl, h: currentHue, s: 1 })})`;
    }
    return `linear-gradient(to right, ${gradientHex({ ...hsl, h: currentHue, l: 0 })}, ${gradientHex({ ...hsl, h: currentHue, l: 0.5 })}, ${gradientHex({ ...hsl, h: currentHue, l: 1 })})`;
  }

  if (format === "HSB") {
    const hsv = toHsv(color);
    if (!hsv) return "transparent";
    const currentHue = hue(hsv.h, fallbackHue);
    if (channel === "h") {
      const stops = [0, 60, 120, 180, 240, 300, 360].map(
        (stop) => gradientHex({ ...hsv, h: stop }),
      );
      return `linear-gradient(to right, ${stops.join(", ")})`;
    }
    if (channel === "s") {
      return `linear-gradient(to right, ${gradientHex({ ...hsv, h: currentHue, s: 0 })}, ${gradientHex({ ...hsv, h: currentHue, s: 1 })})`;
    }
    return `linear-gradient(to right, ${gradientHex({ ...hsv, h: currentHue, v: 0 })}, ${gradientHex({ ...hsv, h: currentHue, v: 1 })})`;
  }

  const oklch = toOklch(color);
  if (!oklch) return "transparent";
  const currentHue = hue(oklch.h, fallbackHue);

  if (channel === "l") {
    const stops = [0, 0.25, 0.5, 0.75, 1].map((lightness) =>
      gradientHex({ ...oklch, l: lightness, h: currentHue }),
    );
    return `linear-gradient(to right, ${stops.join(", ")})`;
  }

  if (channel === "c") {
    const maximum = maxOklchChroma(oklch.l, currentHue);
    return `linear-gradient(to right, ${gradientHex({ ...oklch, c: 0, h: currentHue })}, ${gradientHex({ ...oklch, c: maximum, h: currentHue })})`;
  }

  const stops = [0, 60, 120, 180, 240, 300, 360].map((stop) =>
    gradientHex({ ...oklch, h: stop }),
  );
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

export function formatChannelValue(channel: EditorChannel) {
  if (channel.display === "hex") {
    return Math.round(channel.value).toString(16).padStart(2, "0").toUpperCase();
  }
  return round(channel.value, channel.precision).toFixed(channel.precision);
}

export function parseChannelValue(value: string, channel: EditorChannel) {
  const parsed = channel.display === "hex"
    ? Number.parseInt(value.trim(), 16)
    : Number.parseFloat(value.trim());
  if (!Number.isFinite(parsed)) return null;
  return clamp(parsed, channel.min, channel.max);
}

export function formatColorReadout(
  color: string,
  format: ColorFormat,
  fallbackHue = 0,
) {
  if (format === "HEX") return color.toUpperCase();

  if (format === "RGB") {
    const rgb = toRgb(color);
    if (!rgb) return color;
    return `rgb(${Math.round(rgb.r * 255)} ${Math.round(rgb.g * 255)} ${Math.round(rgb.b * 255)})`;
  }

  if (format === "HSL") {
    const hsl = toHsl(color);
    if (!hsl) return color;
    return `hsl(${Math.round(hue(hsl.h, fallbackHue))} ${Math.round(hsl.s * 100)}% ${Math.round(hsl.l * 100)}%)`;
  }

  if (format === "HSB") {
    const hsv = toHsv(color);
    if (!hsv) return color;
    return `hsb(${Math.round(hue(hsv.h, fallbackHue))} ${Math.round(hsv.s * 100)}% ${Math.round(hsv.v * 100)}%)`;
  }

  const oklch = toOklch(color);
  if (!oklch) return color;
  return `oklch(${round(oklch.l * 100, 1)}% ${round(oklch.c, 3)} ${Math.round(hue(oklch.h, fallbackHue))})`;
}

function parseHsb(value: string) {
  const match = value.match(/^hs[bv]\(\s*([+-]?[\d.]+)(?:deg)?[\s,]+([+-]?[\d.]+)%?[\s,]+([+-]?[\d.]+)%?\s*\)$/i);
  if (!match) return null;

  const [, rawHue, rawSaturation, rawBrightness] = match;
  const colorHue = Number.parseFloat(rawHue);
  const saturation = Number.parseFloat(rawSaturation);
  const brightness = Number.parseFloat(rawBrightness);
  if (![colorHue, saturation, brightness].every(Number.isFinite)) return null;

  return colorToHex({
    mode: "hsv",
    h: hue(colorHue, 0),
    s: clamp(saturation, 0, 100) / 100,
    v: clamp(brightness, 0, 100) / 100,
  });
}

export function parseColorReadout(value: string) {
  const input = value.trim();
  if (!input) return null;
  if (/^hs[bv]\(/i.test(input)) return parseHsb(input);
  return colorToHex(input);
}
