"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

export function ControlFooter({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const footer = ref.current;
    if (!footer) return;
    const root = document.documentElement;
    const mobile = window.matchMedia("(max-width: 639px)");
    let frame = 0;
    function update() {
      const viewport = window.visualViewport;
      const offset = mobile.matches && viewport && viewport.scale === 1
        ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
        : 0;
      root.style.setProperty("--cs-keyboard-offset", `${offset}px`);
      root.style.setProperty("--cs-footer-height", `${footer!.getBoundingClientRect().height}px`);
      const active = document.activeElement;
      if (mobile.matches && active instanceof HTMLInputElement && active.closest("[data-color-editor]")) {
        const delta = active.getBoundingClientRect().bottom - footer!.getBoundingClientRect().top + 16;
        if (delta > 0) window.scrollBy({ top: delta, behavior: "instant" });
      }
    }
    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    }
    const observer = new ResizeObserver(schedule);
    observer.observe(footer);
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    document.addEventListener("focusin", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
      document.removeEventListener("focusin", schedule);
    };
  }, []);
  return (
    <footer className="cs-footer" data-control-footer data-sidebar-layout ref={ref}>
      <div aria-hidden="true" className="cs-footer-backdrop">
        <span />
        <span />
        <span />
        <span />
      </div>
      {children}
    </footer>
  );
}
