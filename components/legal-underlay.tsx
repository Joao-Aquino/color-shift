"use client";

import gsap from "gsap";
import CustomEase from "gsap/CustomEase";
import { XIcon } from "@phosphor-icons/react/X";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { ShortcutKey, type Shortcut } from "@/components/ui/shortcut-key";
import {
  EFFECTIVE_DATE,
  PrivacyPolicyContent,
  TermsOfServiceContent,
} from "@/components/legal-content";

type UnderlayDocumentId = "privacy" | "shortcuts" | "terms";

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
        <PrivacyPolicyContent />
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
        <TermsOfServiceContent />
      </div>
    </article>
  );
}

const SHORTCUTS: { key: Shortcut; label: string }[] = [
  { label: "Export colors", key: "Export" },
  { label: "Undo color edit", key: "Undo" },
  { label: "Toggle theme", key: "T" },
  { label: "Previous photo", key: "ArrowLeft" },
  { label: "Next photo", key: "ArrowRight" },
  { label: "New random photo", key: "Space" },
  { label: "Swap colors", key: "S" },
  { label: "Fix contrast", key: "F" },
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
            <dd><ShortcutKey shortcut={key} /></dd>
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
