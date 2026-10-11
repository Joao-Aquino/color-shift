import type { Metadata } from "next";

export const SITE_NAME = "Color Shift";
export const SITE_TITLE = "Color Shift — Accessible color pairs from photos";
export const SITE_URL = "https://www.colorshiftapp.com";
export const SITE_DESCRIPTION =
  "Create accessible color pairs from photos, compare WCAG 2 and APCA contrast, and export palettes with Color Shift.";
export const SOCIAL_IMAGE_PATH = "/opengraph-image.jpg";
export const SOCIAL_IMAGE_ALT =
  "Color Shift initials over an abstract red, pink, black, and white long-exposure photograph.";

export function buildPageMetadata({
  description = SITE_DESCRIPTION,
  path,
  title,
}: {
  description?: string;
  path: `/${string}`;
  title?: string;
}): Metadata {
  const socialTitle = title ? `${title} | ${SITE_NAME}` : SITE_TITLE;

  return {
    ...(title ? { title } : {}),
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: socialTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      images: [
        {
          url: SOCIAL_IMAGE_PATH,
          width: 1200,
          height: 630,
          alt: SOCIAL_IMAGE_ALT,
          type: "image/jpeg",
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [
        {
          url: SOCIAL_IMAGE_PATH,
          alt: SOCIAL_IMAGE_ALT,
        },
      ],
    },
  };
}
