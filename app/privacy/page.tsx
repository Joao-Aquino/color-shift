import type { Metadata } from "next";
import Link from "next/link";
import { EFFECTIVE_DATE, PrivacyPolicyContent } from "@/components/legal-content";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description: "Privacy policy for Color Shift, a photo-driven color pair tool with guaranteed readable contrast.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <div className="legal-page__container">
        <nav className="legal-page__breadcrumb">
          <Link href="/">← Back to Color Shift</Link>
        </nav>
        
        <article className="legal-page__content">
          <header className="legal-page__header">
            <p className="legal-page__eyebrow">Legal</p>
            <h1>Privacy Policy</h1>
            <p className="legal-page__date">
              Effective and last updated {EFFECTIVE_DATE}
            </p>
          </header>

          <div className="legal-page__body">
            <PrivacyPolicyContent />
          </div>
        </article>
      </div>
    </main>
  );
}
