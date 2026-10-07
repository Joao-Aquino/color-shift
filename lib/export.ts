import { formatColorReadout } from "@/lib/color/editor";
import { getContrastScore } from "@/lib/color/contrast";
import type { ColorFormat, Photo } from "@/types/color-shift";

const EXPORT_FORMATS: ColorFormat[] = ["HEX", "RGB", "HSL", "HSB", "OKLCH"];

interface ColorShiftExportInput {
  background: string;
  foreground: string;
  photo: Photo;
}

export interface ColorShiftExport {
  content: string;
  fileName: string;
}

function colorSection(label: string, color: string) {
  const values = EXPORT_FORMATS.map(
    (format) => `- **${format}:** ${formatColorReadout(color, format)}`,
  );

  return [`## ${label}`, "", ...values].join("\n");
}

export function createColorShiftExport({
  background,
  foreground,
  photo,
}: ColorShiftExportInput): ColorShiftExport {
  const wcag = getContrastScore(foreground, background, "WCAG");
  const apca = getContrastScore(foreground, background, "APCA");
  const backgroundHex = background.replace(/^#/, "").toUpperCase();
  const foregroundHex = foreground.replace(/^#/, "").toUpperCase();

  const content = [
    "# Color Shift",
    "",
    colorSection("Background", background),
    "",
    colorSection("Foreground", foreground),
    "",
    "## Contrast",
    "",
    `- **WCAG 2:** ${wcag.value.toFixed(2)}:1 (${wcag.grade})`,
    `- **APCA:** Lc ${apca.value.toFixed(1)} (${apca.grade})`,
    "",
    "## Photo",
    "",
    photo.source === "local"
      ? `Personal photo: ${photo.fileName ?? "Imported image"}.`
      : `Photo by [${photo.photographer}](${photo.photographerUrl}) on [Unsplash](${photo.photoUrl}).`,
    "",
  ].join("\n");

  return {
    content,
    fileName: `color-shift-${backgroundHex}-${foregroundHex}.md`,
  };
}
