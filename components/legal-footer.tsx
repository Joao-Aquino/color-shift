import type { ReactNode } from "react";

function LegalDocumentButton({
  children,
  document,
}: {
  children: ReactNode;
  document: "changelog" | "privacy" | "shortcuts" | "terms";
}) {
  return (
    <button
      aria-controls="legal-underlay-panel"
      aria-expanded="false"
      aria-haspopup="dialog"
      data-legal-document={document}
      type="button"
    >
      {children}
    </button>
  );
}

export function LegalFooter() {
  return (
    <footer
      className="cs-legal-footer"
      data-name="Footer"
      data-node-id="3418:1067"
    >
      <p data-node-id="3417:409">ColorShift © João Aquino, 2026</p>
      <nav aria-label="Footer links" className="cs-legal-footer-links" data-name="Footer links" data-node-id="3417:414">
        <LegalDocumentButton document="changelog">Changelog</LegalDocumentButton>
        <LegalDocumentButton document="shortcuts">
          Shortcuts
        </LegalDocumentButton>
        <LegalDocumentButton document="terms">
          Terms of Service
        </LegalDocumentButton>
        <LegalDocumentButton document="privacy">
          Privacy Policy
        </LegalDocumentButton>
      </nav>
    </footer>
  );
}

export function MobileLegalFooter() {
  return (
    <section aria-label="Legal information" className="cs-mobile-legal-footer">
      <p>ColorShift © João Aquino, 2026</p>
      <nav aria-label="Legal links" className="cs-mobile-legal-footer-links">
        <LegalDocumentButton document="changelog">Changelog</LegalDocumentButton>
        <LegalDocumentButton document="terms">Terms of Service</LegalDocumentButton>
        <LegalDocumentButton document="privacy">Privacy Policy</LegalDocumentButton>
      </nav>
    </section>
  );
}
