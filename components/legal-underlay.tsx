"use client";

import gsap from "gsap";
import CustomEase from "gsap/CustomEase";
import { XIcon } from "@phosphor-icons/react/X";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { ShortcutKey, type Shortcut } from "@/components/ui/shortcut-key";

type UnderlayDocumentId = "privacy" | "shortcuts" | "terms";

const EFFECTIVE_DATE = "October 10, 2026";

function PrivacyPolicy() {
  return (
    <article aria-labelledby="privacy-policy-title" className="underlay-nav__document">
      <header className="underlay-nav__document-header">
        <p className="underlay-nav__eyebrow" data-reveal-s>Legal</p>
        <h2 id="privacy-policy-title" data-reveal-l>Privacy Policy</h2>
        <p className="underlay-nav__date" data-reveal-s>
          Effective and last updated {EFFECTIVE_DATE}
        </p>
      </header>

      <div className="underlay-nav__document-body">
        <p data-reveal-s>
          Color Shift is built and maintained by João Aquino as an individual developer. This policy explains what data Color Shift collects, how it is used, and your rights.
        </p>

        <section data-reveal-s>
          <h3>Who we are</h3>
          <p>
            Color Shift is developed and operated by João Aquino. For privacy inquiries, contact us at{" "}
            <a href="mailto:joao@co-opstudio.com">joao@co-opstudio.com</a>.
          </p>
        </section>

        <section data-reveal-s>
          <h3>What data we collect</h3>
          <p>
            <strong>We do not collect personal information.</strong> Color Shift does not require accounts, emails, names, or any other personal data to use the app.
          </p>
          <p>
            <strong>Photos you work with.</strong> When you select or upload a photo in Color Shift, the browser creates a local reference to that file on your device. The photo is processed entirely in your browser for color extraction. We do not upload, store, or transmit your photos to our servers.
          </p>
          <p>
            <strong>Theme preference.</strong> Color Shift stores your light or dark theme choice in your browser’s local storage so it persists across sessions. This data never leaves your device.
          </p>
          <p>
            <strong>Motion settings in development builds.</strong> Color Shift may store animation timing preferences locally for debugging. These settings never leave your device and are not present in production builds.
          </p>
        </section>

        <section data-reveal-s>
          <h3>Third-party services</h3>
          <p>
            <strong>Unsplash.</strong> Color Shift makes server-side requests to the Unsplash API to fetch photos and does not add names, email addresses, account IDs, or other profile data to those requests. Unsplash images are hosted by Unsplash and load directly in your browser, so Unsplash may receive standard request information such as your IP address and browser details. When you copy or download a color pair that uses an Unsplash photo, Color Shift sends a server-side request to Unsplash’s download tracking endpoint, as required by its API guidelines, so the photographer receives proper credit. Read the{" "}
            <a href="https://unsplash.com/privacy" rel="noreferrer" target="_blank">Unsplash Privacy Policy</a>.
          </p>
          <p>
            <strong>Vercel.</strong> Color Shift is hosted on Vercel. Vercel may process standard infrastructure data such as IP addresses, browser types, request times, and response codes while delivering the service. Read the{" "}
            <a href="https://vercel.com/legal/privacy-notice" rel="noreferrer" target="_blank">Vercel Privacy Notice</a>.
          </p>
          <p>
            <strong>Fonts.</strong> Geist and Geist Mono are bundled with Color Shift and served from the app’s own domain. Your browser does not contact Google to load them at runtime.
          </p>
        </section>

        <section data-reveal-s>
          <h3>Future iOS app</h3>
          <ul>
            <li>If you choose a photo from your library, Color Shift will request permission and process the selected photo on your device. It will not be uploaded or transmitted.</li>
            <li>If camera capture is added, the app will request camera permission and process captured photos on your device without uploading them.</li>
            <li>The iOS app is planned without third-party analytics or crash-reporting services. Apple may make crash reports available only when you opt in through iOS settings.</li>
          </ul>
        </section>

        <section data-reveal-s>
          <h3>Cookies</h3>
          <p>Color Shift does not set or use cookies.</p>
        </section>

        <section data-reveal-s>
          <h3>Data storage and security</h3>
          <p>
            The only data Color Shift stores is your theme preference and, in development builds, motion settings. Both stay in local storage on your device. We do not store user accounts, passwords, personal information, color values, specimen text, or uploaded photos on our servers.
          </p>
        </section>

        <section data-reveal-s>
          <h3>Children’s privacy</h3>
          <p>
            Color Shift does not knowingly collect personal information from children. The app does not require or request personal information from any user, regardless of age.
          </p>
        </section>

        <section data-reveal-s>
          <h3>Your rights</h3>
          <p>
            Because Color Shift does not collect personal information, there is no personal data held by Color Shift to access, modify, or delete. You can remove your local theme preference by clearing the site data stored by your browser or app.
          </p>
        </section>

        <section data-reveal-s>
          <h3>Changes and contact</h3>
          <p>
            We may update this policy from time to time. When we do, we will update the date at the top of this document. Questions about this policy can be sent to{" "}
            <a href="mailto:joao@co-opstudio.com">joao@co-opstudio.com</a>.
          </p>
        </section>
      </div>
    </article>
  );
}

function TermsOfService() {
  return (
    <article aria-labelledby="terms-of-service-title" className="underlay-nav__document">
      <header className="underlay-nav__document-header">
        <p className="underlay-nav__eyebrow" data-reveal-s>Legal</p>
        <h2 id="terms-of-service-title" data-reveal-l>Terms of Service</h2>
        <p className="underlay-nav__date" data-reveal-s>
          Effective and last updated {EFFECTIVE_DATE}
        </p>
      </header>

      <div className="underlay-nav__document-body">
        <p data-reveal-s>
          These terms govern your use of Color Shift. By using the app, you agree to these terms. If you do not agree, please do not use Color Shift.
        </p>

        <section data-reveal-s>
          <h3>The service</h3>
          <p>
            Color Shift is a visual tool for extracting color pairs from photos, editing those colors, evaluating contrast, and exporting the result. The service may change as the product develops.
          </p>
        </section>

        <section data-reveal-s>
          <h3>Using Color Shift</h3>
          <p>You may use Color Shift for lawful personal or commercial work. You agree not to:</p>
          <ul>
            <li>interfere with, overload, reverse engineer, or attempt to gain unauthorized access to the service or its infrastructure;</li>
            <li>use the service to violate another person’s rights or any applicable law; or</li>
            <li>misrepresent Color Shift, its output, or third-party content as your own service.</li>
          </ul>
        </section>

        <section data-reveal-s>
          <h3>Your photos and text</h3>
          <p>
            You keep all rights you already have in photos and text you bring to Color Shift. You are responsible for having permission to use that material. User-selected photos and specimen text are processed on your device and are not uploaded to Color Shift’s servers.
          </p>
        </section>

        <section data-reveal-s>
          <h3>Third-party photos and services</h3>
          <p>
            Color Shift displays photos supplied by Unsplash and uses Vercel to deliver the web app. Third-party content and services remain subject to their own terms, licenses, and privacy policies. Color Shift does not grant you rights in an Unsplash photo beyond those provided by Unsplash. Photographer and Unsplash attribution must remain intact where it is included in an export.
          </p>
        </section>

        <section data-reveal-s>
          <h3>Color Shift intellectual property</h3>
          <p>
            Color Shift’s name, interface, code, and original design remain the property of their respective owner or licensors. These terms give you permission to use the service; they do not transfer ownership of the service itself.
          </p>
        </section>

        <section data-reveal-s>
          <h3>Contrast results</h3>
          <p>
            Contrast scores and suggestions are provided as design aids. Standards, rendering environments, and user needs vary, so you remain responsible for testing your final work and confirming that it meets the accessibility, legal, and technical requirements that apply to your project.
          </p>
        </section>

        <section data-reveal-s>
          <h3>Availability and warranties</h3>
          <p>
            Color Shift is provided “as is” and “as available.” We do not promise that the service will always be uninterrupted, error-free, or suitable for a particular purpose. To the extent permitted by law, we disclaim implied warranties.
          </p>
        </section>

        <section data-reveal-s>
          <h3>Limitation of liability</h3>
          <p>
            To the extent permitted by law, Color Shift and its operator will not be liable for indirect, incidental, special, consequential, or punitive losses arising from your use of the service, third-party content, or exported results.
          </p>
        </section>

        <section data-reveal-s>
          <h3>Suspension and termination</h3>
          <p>
            We may restrict access to Color Shift when reasonably necessary to protect the service, comply with law, or address misuse. You may stop using the service at any time.
          </p>
        </section>

        <section data-reveal-s>
          <h3>Changes and contact</h3>
          <p>
            We may update these terms from time to time. The date at the top will show the latest version. Questions about these terms can be sent to{" "}
            <a href="mailto:joao@co-opstudio.com">joao@co-opstudio.com</a>.
          </p>
        </section>
      </div>
    </article>
  );
}

const SHORTCUTS: { key: Shortcut; label: string }[] = [
  { label: "Export", key: "S" },
  { label: "Switch", key: "S" },
  { label: "Controls", key: "S" },
  { label: "Switch Colors", key: "S" },
  { label: "Toggle Theme", key: "T" },
  { label: "Color Palette", key: "C" },
  { label: "Brightness Level", key: "B" },
  { label: "Hue Adjustment", key: "H" },
  { label: "Saturation Control", key: "S" },
];

function Shortcuts() {
  return (
    <article aria-labelledby="shortcuts-title" className="underlay-nav__document underlay-nav__document--shortcuts" data-node-id="3418:879">
      <header className="underlay-nav__document-header" data-node-id="3418:883">
        <h2 id="shortcuts-title" data-node-id="3418:885">Shortcuts</h2>
      </header>
      <dl className="underlay-nav__shortcut-list" data-node-id="3418:887">
        {SHORTCUTS.map(({ key, label }) => (
          <div className="underlay-nav__shortcut-row" key={label}>
            <dt>{label}</dt>
            <dd><ShortcutKey shortcut={key} withModifier /></dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export function LegalUnderlay({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeDocument, setActiveDocument] = useState<UnderlayDocumentId | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    gsap.registerPlugin(CustomEase);
    CustomEase.create("energy", "M0,0 C0.32,0.72 0,1 1,1");

    const toggleBtn = root.querySelector<HTMLButtonElement>("[data-underlay-nav-toggle]");
    const documentButtons = root.querySelectorAll<HTMLButtonElement>("[data-legal-document]");
    const menuEl = root.querySelector<HTMLElement>("[data-underlay-nav-menu]");
    const mainEl = root.querySelector<HTMLElement>("[data-main]");

    if (!toggleBtn || !menuEl || !mainEl) return;

    const closeButton = toggleBtn;
    const menu = menuEl;
    const main = mainEl;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const originalBodyOverflow = document.body.style.overflow;
    let isOpen = false;
    let focusTimer = 0;
    let resizeTimer = 0;
    let motion: gsap.core.Tween | null = null;
    let activeTrigger: HTMLButtonElement | null = null;

    const getMenuOffset = () => -menu.offsetWidth;

    function updateTriggerState(open: boolean, documentId?: string) {
      documentButtons.forEach((button) => {
        button.setAttribute("aria-expanded", String(open && button.dataset.legalDocument === documentId));
      });
      closeButton.setAttribute("aria-expanded", String(open));
    }

    function focusCloseButton() {
      window.clearTimeout(focusTimer);
      focusTimer = window.setTimeout(() => closeButton.focus(), reducedMotion.matches ? 0 : 700);
    }

    function finishClose(restoreFocus = true) {
      main.inert = false;
      menu.setAttribute("aria-hidden", "true");
      document.body.style.overflow = originalBodyOverflow;
      setActiveDocument(null);
      if (restoreFocus) activeTrigger?.focus();
      activeTrigger = null;
    }

    function applyOpenState() {
      gsap.set(main, { x: getMenuOffset() });
    }

    function applyClosedState() {
      gsap.set(main, { x: 0 });
    }

    applyClosedState();

    function openDocument(event: Event) {
      const button = event.currentTarget;
      if (!(button instanceof HTMLButtonElement)) return;
      const documentId = button.dataset.legalDocument;
      if (documentId !== "privacy" && documentId !== "shortcuts" && documentId !== "terms") return;

      activeTrigger = button;
      setActiveDocument(documentId);
      window.requestAnimationFrame(() => {
        isOpen = true;
        menu.scrollTop = 0;
        menu.setAttribute("aria-hidden", "false");
        main.inert = true;
        document.body.style.overflow = "hidden";
        document.body.setAttribute("data-menu-status", "open");
        updateTriggerState(true, documentId);

        motion?.kill();
        if (reducedMotion.matches) {
          applyOpenState();
        } else {
          motion = gsap.to(main, { x: getMenuOffset, duration: 0.7, ease: "energy" });
        }
        focusCloseButton();
      });
    }

    function closeDocument() {
      if (!isOpen) return;
      isOpen = false;
      window.clearTimeout(focusTimer);
      document.body.setAttribute("data-menu-status", "");
      updateTriggerState(false);

      motion?.kill();
      if (reducedMotion.matches) {
        applyClosedState();
        finishClose();
      } else {
        motion = gsap.to(main, {
          x: 0,
          duration: 0.6,
          ease: "power2.inOut",
          onComplete: () => finishClose(),
        });
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeDocument();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
        .filter((node) => !node.hidden && node.getClientRects().length > 0);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function handleResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (isOpen) gsap.set(main, { x: getMenuOffset() });
      }, 150);
    }

    documentButtons.forEach((button) => button.addEventListener("click", openDocument));
    closeButton.addEventListener("click", closeDocument);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      window.clearTimeout(focusTimer);
      window.clearTimeout(resizeTimer);
      documentButtons.forEach((button) => button.removeEventListener("click", openDocument));
      closeButton.removeEventListener("click", closeDocument);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
      motion?.kill();
      applyClosedState();
      main.inert = false;
      document.body.style.overflow = originalBodyOverflow;
      document.body.removeAttribute("data-menu-status");
    };
  }, []);

  return (
    <div className="underlay-nav" ref={rootRef}>
      {children}
      <section
        aria-hidden={activeDocument === null}
        aria-labelledby={activeDocument === "privacy" ? "privacy-policy-title" : activeDocument === "shortcuts" ? "shortcuts-title" : "terms-of-service-title"}
        aria-modal={activeDocument ? "true" : undefined}
        className="underlay-nav__menu"
        data-underlay-nav-menu
        id="legal-underlay-panel"
        role="dialog"
      >
        <header className="underlay-nav__header">
          <button
            aria-expanded="false"
            aria-label="Close panel"
            className="underlay-nav__toggle"
            data-underlay-nav-toggle
            type="button"
          >
            <XIcon aria-hidden size={16} weight="regular" />
          </button>
        </header>
        <div className="underlay-nav__inner">
          <div hidden={activeDocument !== "terms"}>
            <TermsOfService />
          </div>
          <div hidden={activeDocument !== "privacy"}>
            <PrivacyPolicy />
          </div>
          <div hidden={activeDocument !== "shortcuts"}>
            <Shortcuts />
          </div>
        </div>
      </section>
    </div>
  );
}
