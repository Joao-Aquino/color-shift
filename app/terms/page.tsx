import type { Metadata } from "next";
import Link from "next/link";
import { EFFECTIVE_DATE, TermsOfServiceContent } from "@/components/legal-content";

export const metadata: Metadata = {
  title: "Terms of Service — Color Shift",
  description: "Terms of service for Color Shift, a photo-driven color pair tool with guaranteed readable contrast.",
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <div className="legal-page__container">
        <nav className="legal-page__breadcrumb">
          <Link href="/">← Back to Color Shift</Link>
        </nav>
        
        <article className="legal-page__content">
          <header className="legal-page__header">
            <p className="legal-page__eyebrow">Legal</p>
            <h1>Terms of Service</h1>
            <p className="legal-page__date">
              Effective and last updated {EFFECTIVE_DATE}
            </p>
          </header>

          <div className="legal-page__body">
            <TermsOfServiceContent />
          </div>
        </article>
      </div>
    </main>
  );
}
