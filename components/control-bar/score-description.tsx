"use client";

import gsap from "gsap";
import { useLayoutEffect, useRef } from "react";

import { motionValue, prefersReducedMotion, sidebarEase } from "@/lib/motion";

/** Animate only the occupied space when the description wraps to more lines. */
export function ScoreDescription({ children }: { children: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const text = textRef.current;
    if (!root || !text) return;
    let height = text.offsetHeight;
    let tween: gsap.core.Tween | null = null;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const notify = () => root.dispatchEvent(new Event("cs:layout-motion", { bubbles: true }));
    const settle = () => {
      tween?.kill();
      tween = null;
      root.style.removeProperty("height");
      root.removeAttribute("data-description-moving");
      notify();
    };
    const observer = new ResizeObserver(() => {
      const next = text.offsetHeight;
      if (next === height) return;
      const from = tween ? root.offsetHeight : height;
      height = next;
      tween?.kill();
      if (prefersReducedMotion() || motionValue("--score-description-duration") === 0) {
        settle();
        return;
      }
      root.dataset.descriptionMoving = "true";
      tween = gsap.fromTo(root, { height: from }, {
        height: next,
        duration: motionValue("--score-description-duration"),
        ease: sidebarEase(),
        onUpdate: notify,
        onComplete: settle,
      });
    });
    observer.observe(text);
    const onMotionChange = () => { if (reduced.matches) settle(); };
    reduced.addEventListener("change", onMotionChange);
    return () => {
      observer.disconnect();
      reduced.removeEventListener("change", onMotionChange);
      settle();
    };
  }, []);

  return (
    <div ref={rootRef} className="overflow-hidden" data-score-description>
      <p ref={textRef} className="text-xs leading-5 text-[var(--color-text-muted)]">{children}</p>
    </div>
  );
}
