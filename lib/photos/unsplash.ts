import "server-only";

import type { Photo } from "@/types/color-shift";
import type { Theme } from "@/lib/theme";

const UNSPLASH_API_URL = "https://api.unsplash.com/photos/random";
const PHOTO_QUERIES = [
  "abstract background",
  "abstract colorful texture",
  "abstract art",
  "vibrant abstract",
  "creative abstract",
  "abstract organic shapes",
];
const TRACKING_PARAMS = {
  utm_source: "color_shift",
  utm_medium: "referral",
};

interface UnsplashPhoto {
  id: string;
  width: number;
  height: number;
  color: string | null;
  alt_description: string | null;
  description: string | null;
  urls: {
    raw: string;
    small: string;
  };
  links: {
    html: string;
    download_location: string;
  };
  user: {
    name: string;
    links: {
      html: string;
    };
  };
}

function withTracking(url: string) {
  const trackedUrl = new URL(url);

  Object.entries(TRACKING_PARAMS).forEach(([key, value]) => {
    trackedUrl.searchParams.set(key, value);
  });

  return trackedUrl.toString();
}

function displayImageUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "max");
  url.searchParams.set("w", "2400");
  url.searchParams.set("q", "90");
  return url.toString();
}

function tinyImageUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  url.searchParams.set("w", "32");
  url.searchParams.set("h", "32");
  url.searchParams.set("q", "30");
  return url.toString();
}

function normalizePhoto(photo: UnsplashPhoto): Photo {
  return {
    id: photo.id,
    url: displayImageUrl(photo.urls.raw),
    thumbUrl: photo.urls.small,
    tinyUrl: tinyImageUrl(photo.urls.raw),
    color: photo.color ?? "#202020",
    width: photo.width,
    height: photo.height,
    alt: photo.alt_description ?? photo.description ?? "Unsplash photograph",
    photographer: photo.user.name,
    photographerUrl: withTracking(photo.user.links.html),
    photoUrl: withTracking(photo.links.html),
    downloadLocation: photo.links.download_location,
  };
}

export class UnsplashApiError extends Error {
  constructor(public readonly status: number, public readonly rateLimited: boolean) {
    super(`Unsplash responded with ${status}.`);
  }
}

function apiHeaders(accessKey: string) {
  return { Authorization: `Client-ID ${accessKey}`, "Accept-Version": "v1" };
}

export async function trackPhotoDownload(photoId: string, location: string) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) throw new Error("UNSPLASH_ACCESS_KEY is not configured.");

  const url = new URL(location);
  if (
    !/^[A-Za-z0-9_-]{1,64}$/.test(photoId) ||
    url.protocol !== "https:" || url.hostname !== "api.unsplash.com" ||
    url.port || url.username || url.password ||
    url.pathname !== `/photos/${photoId}/download`
  ) throw new Error("Invalid Unsplash download location.");

  const response = await fetch(url, { cache: "no-store", redirect: "manual", headers: apiHeaders(accessKey) });
  if (!response.ok) throw new UnsplashApiError(response.status, response.status === 429);
}

export async function getRandomPhotos(count: number, theme?: Theme): Promise<Photo[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    throw new Error("UNSPLASH_ACCESS_KEY is not configured.");
  }

  const url = new URL(UNSPLASH_API_URL);
  url.searchParams.set("count", String(count));
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("content_filter", "high");
  const query = PHOTO_QUERIES[Math.floor(Math.random() * PHOTO_QUERIES.length)];
  url.searchParams.set("query", theme === "light" ? `bright light ${query}` : theme === "dark" ? `dark ${query}` : query);

  const response = await fetch(url, {
    cache: "no-store",
    headers: apiHeaders(accessKey),
  });

  if (!response.ok) {
    throw new UnsplashApiError(
      response.status,
      response.status === 429 ||
        (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0"),
    );
  }

  const data = (await response.json()) as UnsplashPhoto[];
  return data.map(normalizePhoto);
}
