"use client";

import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { Flip } from "gsap/Flip";
import { useEffect, useRef } from "react";

const TARGET = "[data-responsive-motion]";
const CAPTURE_OPTIONS = { kill: false, simple: false };
const TRANSFORM_PROPERTIES = [
  "transform",
  "transform-origin",
  "translate",
  "rotate",
  "scale",
] as const;

function saveProperties(element: HTMLElement, properties: readonly string[]) {
  const saved = properties.map((property) => ({
    property,
    value: element.style.getPropertyValue(property),
    priority: element.style.getPropertyPriority(property),
  }));
  return () => {
    if (properties.includes("transform")) gsap.set(element, { clearProps: "transform" });
    saved.forEach(({ property, value, priority }) => {
      if (value) element.style.setProperty(property, value, priority);
      else element.style.removeProperty(property);
    });
  };
}

export function useResponsiveLayoutMotion() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    gsap.registerPlugin(Flip, CustomEase);
    const ease = CustomEase.create("responsive-layout", "0.77,0,0.175,1");
    const small = window.matchMedia("(min-width: 40rem)");
    const desktop = window.matchMedia("(min-width: 73.75rem)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const getBand = () => (desktop.matches ? 2 : small.matches ? 1 : 0);
    let band = getBand();
    let width = window.innerWidth;
    let height = window.innerHeight;
    let frame = 0;
    let disposed = false;
    let refreshRequested = false;
    let baseline: Flip.FlipState | null = null;
    let visual: Flip.FlipState | null = null;
    let animation: gsap.core.Timeline | null = null;
    let restore: (() => void)[] = [];
    let targets: HTMLElement[] = [];
    const observed = new Set<HTMLElement>();

    function capture() {
      if (
        !targets.some((element) => element.dataset.responsiveMotion === "specimen") ||
        targets.some((element) => {
          const bounds = element.getBoundingClientRect();
          return !element.isConnected || bounds.width <= 0 || bounds.height <= 0 ||
            ![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite);
        })
      ) return null;
      // The default getState() would force an interrupted Flip to its old endpoint.
      return Flip.getState(targets, CAPTURE_OPTIONS);
    }

    function stop() {
      animation?.kill();
      animation = null;
      restore.forEach((restoreProperties) => restoreProperties());
      restore = [];
      visual = null;
    }

    function syncTargets() {
      targets = Array.from(root!.querySelectorAll<HTMLElement>(TARGET));
      const next = new Set([root!, ...targets]);
      observed.forEach((element) => {
        if (!next.has(element)) {
          observer.unobserve(element);
          observed.delete(element);
        }
      });
      next.forEach((element) => {
        if (!observed.has(element)) {
          observer.observe(element);
          observed.add(element);
        }
      });
    }

    function settle() {
      stop();
      syncTargets();
      band = getBand();
      width = window.innerWidth;
      height = window.innerHeight;
      baseline = capture();
    }

    function flush() {
      frame = 0;
      if (disposed) return;
      const nextBand = getBand();
      const resized = width !== window.innerWidth || height !== window.innerHeight;
      const crossing = nextBand !== band;
      const from = animation ? visual : baseline;
      const refresh = refreshRequested;
      refreshRequested = false;

      if (!crossing) {
        if (resized || refresh || !animation) settle();
        return;
      }

      // CSS has already reflowed. Keep the prior settled/last rendered geometry.
      stop();
      syncTargets();
      band = nextBand;
      width = window.innerWidth;
      height = window.innerHeight;
      baseline = capture();
      if (
        reduced.matches || !from || !baseline ||
        from.targets.length !== targets.length ||
        targets.some((element) => !from.targets.includes(element))
      ) return;

      restore = targets.map((element) => saveProperties(element, TRANSFORM_PROPERTIES));
      const preview = targets.find((element) => element.dataset.responsiveMotion === "preview");
      if (preview) {
        restore.push(saveProperties(preview, ["overflow", "overflow-x", "overflow-y"]));
        preview.style.overflow = "visible";
      }
      const controls = targets.find((element) => element.dataset.responsiveMotion === "controls");
      const previousControls = from.elementStates.find((state) => state.element === controls)?.bounds;
      const currentControls = controls?.getBoundingClientRect();
      const circle = targets.find((element) => element.dataset.responsiveMotion === "circle");
      const circleShape = circle?.querySelector<HTMLElement>("[data-responsive-circle-shape]");
      if (circleShape) restore.push(saveProperties(circleShape, TRANSFORM_PROPERTIES));

      function correctCircle() {
        const bounds = visual?.elementStates.find((state) => state.element === circle)?.bounds;
        if (circleShape && bounds && bounds.width > 0 && bounds.height > 0) {
          gsap.set(circleShape, {
            scaleX: Math.sqrt(bounds.height / bounds.width),
            scaleY: Math.sqrt(bounds.width / bounds.height),
          });
        }
      }

      animation = Flip.from(from, {
        targets: targets.filter((element) => element !== controls),
        duration: 0.2,
        ease,
        scale: true,
        nested: true,
        clearProps: false,
        onUpdate() {
          // Only sample during motion, and never replace the old frame after reflow.
          if (width === window.innerWidth && height === window.innerHeight && band === getBand()) {
            visual = capture();
            correctCircle();
          }
        },
        onComplete() {
          if (width !== window.innerWidth || height !== window.innerHeight || band !== getBand()) {
            schedule();
          } else settle();
        },
      });
      if (controls && previousControls && currentControls) {
        animation.fromTo(controls, {
          x: previousControls.left - currentControls.left,
          y: previousControls.top - currentControls.top,
          transformOrigin: "0 0",
        }, {
          x: 0,
          y: 0,
          duration: 0.2,
          ease,
        }, 0);
      }
      visual = capture();
      correctCircle();
    }

    function schedule() {
      if (!disposed && !frame) frame = window.requestAnimationFrame(flush);
    }

    function refresh() {
      refreshRequested = true;
      schedule();
    }

    function handlePreferenceChange() {
      if (reduced.matches) settle();
      else schedule();
    }

    const observer = new ResizeObserver(schedule);
    const mutations = new MutationObserver((records) => {
      // Ignore GSAP's temporary measurement nodes and unrelated content updates.
      if (records.some((record) => [...record.addedNodes, ...record.removedNodes].some(
        (node) => node instanceof HTMLElement && (node.matches(TARGET) || node.querySelector(TARGET)),
      ))) refresh();
    });
    syncTargets();
    baseline = capture();
    mutations.observe(root, { childList: true, subtree: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", refresh, true);
    small.addEventListener("change", schedule);
    desktop.addEventListener("change", schedule);
    reduced.addEventListener("change", handlePreferenceChange);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", refresh, true);
      small.removeEventListener("change", schedule);
      desktop.removeEventListener("change", schedule);
      reduced.removeEventListener("change", handlePreferenceChange);
      observer.disconnect();
      mutations.disconnect();
      stop();
    };
  }, []);

  return rootRef;
}
