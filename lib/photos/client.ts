import type { Photo } from "@/types/color-shift";
import type { Theme } from "@/lib/theme";

interface PhotosResponse {
  photos?: Photo[];
  error?: string;
}

export async function fetchPhotos(count: number, signal?: AbortSignal, theme?: Theme) {
  const parameters = new URLSearchParams({ count: String(count) });
  if (theme) parameters.set("theme", theme);
  const response = await fetch(`/api/photos?${parameters}`, {
    cache: "no-store",
    signal,
  });
  const data = (await response.json()) as PhotosResponse;

  if (!response.ok || !data.photos) {
    throw new Error(data.error ?? "Unable to load photos.");
  }

  return data.photos;
}
