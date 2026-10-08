import { converter } from "culori";

import type { Theme } from "@/lib/theme";
import type { Photo } from "@/types/color-shift";

const toRgb = converter("rgb");
const luma = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

async function photoBrightness(photo: Photo) {
  try {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = photo.thumbUrl;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        image.decode(),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => { image.src = ""; reject(new Error("Image sampling timed out")); }, 5000);
        }),
      ]);
    } finally { clearTimeout(timeout); }
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 32;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Image sampling unavailable");
    context.drawImage(image, 0, 0, 32, 32);
    const { data } = context.getImageData(0, 0, 32, 32);
    let total = 0;
    for (let i = 0; i < data.length; i += 4) total += luma(data[i], data[i + 1], data[i + 2]) / 255;
    return { value: total / (data.length / 4), sampled: true };
  } catch {
    // Metadata keeps generation usable if a thumbnail cannot be decoded/read.
    const color = toRgb(photo.color);
    return { value: color ? luma(color.r, color.g, color.b) : 0.5, sampled: false };
  }
}

/** One API batch; select real photo brightness without recoloring the image. */
export async function selectPhotoForTheme(photos: Photo[], getTheme: () => Theme) {
  if (!photos.length) throw new Error("No photo was returned.");
  const brightness = await Promise.all(photos.map(photoBrightness));
  const theme = getTheme();
  const hasSamples = brightness.some(sample => sample.sampled);
  let best = -1;
  for (let i = 0; i < photos.length; i += 1) {
    if (hasSamples && !brightness[i].sampled) continue;
    if (best === -1 || (theme === "light" ? brightness[i].value > brightness[best].value : brightness[i].value < brightness[best].value)) best = i;
  }
  return photos[best];
}
