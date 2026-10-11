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
import { ChangelogTimelineMotion } from "@/components/changelog-timeline-motion";

type UnderlayDocumentId = "changelog" | "privacy" | "shortcuts" | "terms";

const DOCUMENT_TITLE_IDS: Record<UnderlayDocumentId, string> = {
  changelog: "changelog-title",
  privacy: "privacy-policy-title",
  shortcuts: "shortcuts-title",
  terms: "terms-of-service-title",
};

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

export function LegalUnderlay({
  changelog,
  children,
}: {
  changelog: ReactNode;
  children: ReactNode;
}) {
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
      gsap.set(main, { clearProps: "transform" });
      menu.setAttribute("aria-hidden", "true");
      document.body.removeAttribute("data-menu-status");
      setActiveDocument(null);
      if (restoreFocus) activeTrigger?.focus();
      activeTrigger = null;
    }

    function applyOpenState() {
      gsap.set(main, { x: getMenuOffset() });
    }

    function applyClosedState() {
      gsap.set(main, { clearProps: "transform" });
    }

    applyClosedState();

    function openDocument(event: Event) {
      const button = event.currentTarget;
      if (!(button instanceof HTMLButtonElement)) return;
      const documentId = button.dataset.legalDocument;
      if (
        documentId !== "changelog" &&
        documentId !== "privacy" &&
        documentId !== "shortcuts" &&
        documentId !== "terms"
      ) return;

      activeTrigger = button;
      setActiveDocument(documentId);
      menu.scrollTop = 0;
      updateTriggerState(true, documentId);

      if (isOpen) return;
      isOpen = true;
      window.requestAnimationFrame(() => {
        menu.setAttribute("aria-hidden", "false");
        document.body.setAttribute("data-menu-status", "open");

        motion?.kill();
        if (reducedMotion.matches) {
          applyOpenState();
        } else {
          motion = gsap.to(main, { x: getMenuOffset, duration: 0.7, ease: "energy" });
        }
        focusCloseButton();
      });
    }

    function closeDocument(restoreFocus = true) {
      if (!isOpen) return;
      isOpen = false;
      window.clearTimeout(focusTimer);
      document.body.setAttribute("data-menu-status", "closing");
      updateTriggerState(false);

      motion?.kill();
      if (reducedMotion.matches) {
        applyClosedState();
        finishClose(restoreFocus);
      } else {
        motion = gsap.to(main, {
          x: 0,
          duration: 0.6,
          ease: "power2.inOut",
          onComplete: () => finishClose(restoreFocus),
        });
      }
    }

    function handleOutsideClick(event: MouseEvent) {
      if (!isOpen) return;
      const target = event.target;
      if (
        !(target instanceof Element) ||
        menu.contains(target) ||
        target.closest("[data-legal-document]")
      ) return;
      closeDocument(false);
    }

    function handleCloseClick() {
      closeDocument();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeDocument();
        return;
      }
    }

    function handleResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (isOpen) gsap.set(main, { x: getMenuOffset() });
      }, 150);
    }

    documentButtons.forEach((button) => button.addEventListener("click", openDocument));
    closeButton.addEventListener("click", handleCloseClick);
    root.addEventListener("click", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      window.clearTimeout(focusTimer);
      window.clearTimeout(resizeTimer);
      documentButtons.forEach((button) => button.removeEventListener("click", openDocument));
      closeButton.removeEventListener("click", handleCloseClick);
      root.removeEventListener("click", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
      motion?.kill();
      applyClosedState();
      document.body.removeAttribute("data-menu-status");
    };
  }, []);

  return (
    <div className="underlay-nav" ref={rootRef}>
      {children}
      <div data-mobile-control-footer-root />
      <section
        aria-hidden={activeDocument === null}
        aria-labelledby={activeDocument ? DOCUMENT_TITLE_IDS[activeDocument] : undefined}
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
          <div hidden={activeDocument !== "changelog"}>
            {changelog}
          </div>
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
        <ChangelogTimelineMotion active={activeDocument === "changelog"} />
      </section>
    </div>
  );
}
