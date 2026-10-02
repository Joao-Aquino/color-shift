"use client";

import { ListIcon } from "@phosphor-icons/react/List";
import { XIcon } from "@phosphor-icons/react/X";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { useCollapsiblePresence } from "@/lib/use-collapsible-presence";
import { IconButton } from "./icon-button";

export function MobileActions({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const { present, onTransitionEnd } = useCollapsiblePresence(open);
  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!open) return;
    const root = rootRef.current;
    const query = window.matchMedia("(min-width: 640px)");
    let lastFocused = root?.contains(document.activeElement) ? document.activeElement : null;
    function onFocus(event: FocusEvent) {
      lastFocused = event.target instanceof HTMLElement && root?.contains(event.target)
        ? event.target
        : null;
    }
    function onPointer(event: PointerEvent) {
      if (event.target instanceof Node && !root?.contains(event.target)) close(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    }
    function onResize() {
      if (!query.matches) return;
      // Hiding the mobile controls can blur them before matchMedia fires.
      const focused = root?.contains(document.activeElement) ||
        (document.activeElement === document.body && lastFocused !== null);
      const action = lastFocused instanceof HTMLElement
        ? lastFocused.closest<HTMLButtonElement>("button[data-action]")?.dataset.action
        : undefined;
      close(false);
      if (focused) {
        const equivalent = action
          ? document.querySelector<HTMLButtonElement>(`.cs-inline-actions [data-action="${CSS.escape(action)}"]:not(:disabled)`)
          : null;
        (equivalent ?? document.querySelector<HTMLButtonElement>('.cs-inline-actions button:not(:disabled)'))?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("focusin", onFocus);
    window.addEventListener("keydown", onKey, true);
    query.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("focusin", onFocus);
      window.removeEventListener("keydown", onKey, true);
      query.removeEventListener("change", onResize);
    };
  }, [close, open]);

  return (
    <div className="cs-mobile-actions" data-mobile-actions ref={rootRef}>
      <div
        aria-hidden={!open}
        className={`cs-mobile-action-list grid transition-[grid-template-rows,opacity,transform] duration-150 ease-out ${open ? "grid-rows-[1fr] translate-y-0 opacity-100" : "pointer-events-none grid-rows-[0fr] translate-y-2 opacity-0"}`}
        id={id}
        inert={!open ? true : undefined}
        onTransitionEnd={onTransitionEnd}
      >
        <div className="min-h-0 overflow-y-auto overscroll-contain" onClick={(event) => {
          if (!(event.target instanceof Element) || !event.target.closest("button[data-action]:not(:disabled)")) return;
          close();
        }}>
          {present ? children : null}
        </div>
      </div>
      <IconButton
        aria-controls={id}
        aria-expanded={open}
        className="bg-[var(--color-chrome-raised)] dark:bg-[var(--color-chrome-raised)]"
        icon={open ? XIcon : ListIcon}
        label={open ? "Close photo actions" : "Open photo actions"}
        onClick={(event) => {
          if (open) { close(); return; }
          setOpen(true);
          if (event.detail === 0) {
            requestAnimationFrame(() => rootRef.current?.querySelector<HTMLButtonElement>('.cs-mobile-action-list button:not(:disabled)')?.focus());
          }
        }}
        ref={triggerRef}
      />
    </div>
  );
}
