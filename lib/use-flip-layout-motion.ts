"use client";

import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";

import { motionValue, prefersReducedMotion, sidebarEase } from "@/lib/motion";

const SELECTOR = "[data-layout-item]";
const CAPTURE_OPTIONS = { kill: false, simple: false };

/** Capture before a React state change, then animate its committed layout. */
export function useFlipLayoutMotion(rootRef: RefObject<HTMLElement | null>, state: string, openCount = 0, selector = SELECTOR, sidebar = false) {
  const pending = useRef<Flip.FlipState | null>(null);
  const context = useRef<gsap.Context | null>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const previousCount = useRef(openCount);
  const generation = useRef(0);
  const restore = useRef<(() => void)[]>([]);
  const ghosts = useRef<HTMLElement[]>([]);
  const ghostSources = useRef(new Map<HTMLElement, HTMLElement>());
  const resumeOpacity = useRef(new Map<HTMLElement, number>());

  const settle = useCallback(() => {
    timeline.current?.kill();
    timeline.current = null;
    context.current?.revert();
    context.current = null;
    restore.current.forEach(restoreStyle => restoreStyle());
    restore.current = [];
    ghosts.current.forEach(element => element.remove());
    ghosts.current = [];
    ghostSources.current.clear();
    rootRef.current?.removeAttribute("data-layout-moving");
  }, [rootRef]);

  const prepare = useCallback(() => {
    const root = rootRef.current;
    if (!root || pending.current) return;
    generation.current += 1;
    ghostSources.current.forEach((copy, original) => {
      resumeOpacity.current.set(original, Number(getComputedStyle(copy).opacity));
    });
    // A breakpoint Flip owns the controls' parent transform. Settle it before
    // capturing descendants so the two layout systems cannot compound offsets.
    root.dispatchEvent(new Event("cs:sidebar-will-change", { bubbles: true }));
    gsap.registerPlugin(Flip);
    // kill:false preserves the current visual state during a rapid reversal.
    pending.current = prefersReducedMotion() ? null : Flip.getState(root.querySelectorAll(selector), CAPTURE_OPTIONS);
    settle();
  }, [rootRef, settle, selector]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const from = pending.current;
    const opacity = resumeOpacity.current;
    resumeOpacity.current = new Map();
    const exiting = openCount < previousCount.current;
    previousCount.current = openCount;
    pending.current = null;
    if (!root || !from || prefersReducedMotion()) return;
    const duration = motionValue(exiting ? "--exit-duration" : "--enter-duration");
    const ease = sidebar ? sidebarEase() : "power4.out";
    const version = generation.current;
    const targets = Array.from(root.querySelectorAll<HTMLElement>(selector));
    restore.current = targets.map(element => {
      const properties = ["transform", "transform-origin", "translate", "rotate", "scale", "opacity", "width", "height", "min-width", "min-height", "max-width", "max-height"];
      const saved = properties.map(property => ({ property, value: element.style.getPropertyValue(property), priority: element.style.getPropertyPriority(property) }));
      return () => {
        gsap.set(element, { clearProps: properties.join(",") });
        saved.forEach(({ property, value, priority }) => {
          if (value) element.style.setProperty(property, value, priority);
          else element.style.removeProperty(property);
        });
      };
    });
    root.setAttribute("data-layout-moving", "true");
    context.current = gsap.context(() => {
      // Flip's absoluteOnLeave pins other targets to their old dimensions. Keep
      // decorative exit copies instead so expanding shells retain natural size.
      const scroll = window.scrollY;
      const leaving = from.elementStates.filter(previous =>
        previous.element instanceof HTMLElement && previous.element.dataset.open === "false" && previous.isVisible,
      );
      const exits = leaving.map(previous => {
        const original = previous.element as HTMLElement;
        const copy = original.cloneNode(true) as HTMLElement;
        [copy, ...Array.from(copy.querySelectorAll<HTMLElement>("*"))].forEach(element => {
          Array.from(element.attributes).forEach(attribute => {
            if (attribute.name === "id" || attribute.name.startsWith("data-") || attribute.name.startsWith("aria-")) element.removeAttribute(attribute.name);
          });
        });
        copy.setAttribute("aria-hidden", "true");
        copy.setAttribute("data-motion-ghost", "true");
        copy.inert = true;
        const computed = getComputedStyle(original);
        ["--score-border", "--score-pill", "--score-pill-border", "--score-text"].forEach(property => {
          const value = computed.getPropertyValue(property);
          if (value) copy.style.setProperty(property, value);
        });
        Object.assign(copy.style, {
          position: "fixed", top: `${previous.bounds.top}px`, left: `${previous.bounds.left}px`,
          width: `${previous.bounds.width}px`, height: `${previous.bounds.height}px`, margin: "0",
          display: "block", transform: "none", opacity: String(previous.opacity), pointerEvents: "none", zIndex: "35",
          backgroundColor: original.closest("#contrast-score-panel")
            ? getComputedStyle(original.closest("#contrast-score-panel")!).backgroundColor
            : "var(--color-chrome-bg)",
        });
        root.appendChild(copy);
        ghosts.current.push(copy);
        ghostSources.current.set(original, copy);
        return { copy };
      });
      timeline.current = gsap.timeline({
        onUpdate: () => {
          exits.forEach(({ copy }) => { copy.style.translate = `0px ${-(window.scrollY - scroll)}px`; });
          root.dispatchEvent(new Event("cs:layout-motion", { bubbles: true }));
        },
        onComplete: () => {
          // Revert after the GSAP callback finishes, including zero-duration tuning.
          queueMicrotask(() => { if (generation.current === version) settle(); });
        },
      });
      timeline.current.add(Flip.from(from, {
        targets,
        duration,
        ease,
        scale: true,
        nested: true,
        prune: true,
        onEnter: elements => gsap.fromTo(elements, { opacity: (_index, element) => opacity.get(element) ?? 0, y: 4 }, { opacity: 1, y: 0, duration, ease }),
      }), 0);
      if (exits.length) timeline.current.to(exits.map(exit => exit.copy), {
        opacity: 0, y: -4, duration: motionValue("--exit-duration"), ease,
      }, 0);
    }, root);
  }, [state, openCount, rootRef, settle, selector, sidebar]);

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cancel = () => { pending.current = null; settle(); };
    reduced.addEventListener("change", cancel);
    window.addEventListener("resize", cancel);
    return () => {
      cancel();
      reduced.removeEventListener("change", cancel);
      window.removeEventListener("resize", cancel);
    };
  }, [settle]);

  return prepare;
}
