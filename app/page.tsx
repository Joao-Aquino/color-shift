import type { Metadata } from "next";

import { ChangelogContent } from "@/components/changelog-content";
import { ColorShiftApp } from "@/components/color-shift-app";
import { LegalUnderlay } from "@/components/legal-underlay";
import {
  buildPageMetadata,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_IMAGE_PATH,
} from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({ path: "/" });

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
    },
    {
      "@type": "WebApplication",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      image: `${SITE_URL}${SOCIAL_IMAGE_PATH}`,
      applicationCategory: "DesignApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript and a modern web browser.",
      featureList: [
        "Photo-derived color palettes",
        "WCAG 2 contrast checking",
        "APCA contrast checking",
        "Color editing and Markdown export",
      ],
      author: {
        "@type": "Person",
        name: "João Aquino",
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />
      <LegalUnderlay changelog={<ChangelogContent />}>
        <ColorShiftApp />
      </LegalUnderlay>
    </>
  );
}
