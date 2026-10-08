import type { Photo } from "@/types/color-shift";
import type { Theme } from "@/lib/theme";

interface PhotosResponse {
  photos?: Photo[];
  error?: string;
}

export async function fetchPhotos(count: number, signal?: AbortSignal, theme?: Theme) {
  const parameters = new URLSearchParams({ count: String(count) });
  if (theme) parameters.set("theme", theme);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(`/api/photos?${parameters}`, {
      cache: "no-store",
      signal,
    });
    const data = (await response.json()) as PhotosResponse;

    if (response.ok && data.photos) return data.photos;
    if (response.status === 502 && attempt === 0) continue;
    throw new Error(data.error ?? "Unable to load photos.");
  }
  throw new Error("Unable to load photos.");
}

export async function trackPhotoUse(photo: Photo) {
  if (photo.source === "local" || !photo.downloadLocation) return;
  const response = await fetch("/api/photos/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photoId: photo.id, location: photo.downloadLocation }),
  });
  if (!response.ok) throw new Error("Unable to record photo use.");
}
