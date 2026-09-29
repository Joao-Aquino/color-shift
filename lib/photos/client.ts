import type { Photo } from "@/types/color-shift";

interface PhotosResponse {
  photos?: Photo[];
  error?: string;
}

export async function fetchPhotos(count: number, signal?: AbortSignal) {
  const response = await fetch(`/api/photos?count=${count}`, {
    cache: "no-store",
    signal,
  });
  const data = (await response.json()) as PhotosResponse;

  if (!response.ok || !data.photos) {
    throw new Error(data.error ?? "Unable to load photos.");
  }

  return data.photos;
}
