"use client";

import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useLayoutEffect } from "react";

export function ChangelogTimelineMotion({ active }: { active: boolean }) {
  useLayoutEffect(() => {
    if (!active) return;

    const root = document.querySelector<HTMLElement>("[data-step-timeline-init]");
    if (!root) return;

    const line = root.querySelector<HTMLElement>("[data-step-timeline-line]");
    const fill = root.querySelector<HTMLElement>("[data-step-timeline-fill]");
    const items = Array.from(
      root.querySelectorAll<HTMLElement>("[data-step-timeline-item]"),
    );
    const scroller = root.closest<HTMLElement>("[data-underlay-nav-menu]");
    if (!line || !fill || !scroller || items.length === 0) return;

    const timelineLine = line;
    const timelineFill = fill;

    gsap.registerPlugin(ScrollTrigger);

    const anchors = items.map(
      (item) =>
        item.querySelector<HTMLElement>("[data-step-timeline-marker]") ?? item,
    );
    const activationInput = Number.parseFloat(
      root.dataset.stepTimelineActivation ?? "",
    );
    const activation = Number.isNaN(activationInput)
      ? 0.5
      : Math.min(Math.max(activationInput, 0), 1);
    const activationPercent = activation * 100;
    const lastIndex = items.length - 1;
    let anchorFractions = [0];
    let currentIndex = -2;
    let isMounted = true;

    function measureLine() {
      const wrapper = timelineLine.parentElement;
      if (!wrapper) return;

      const base = wrapper.getBoundingClientRect().top;
      const centers = anchors.map((anchor) => {
        const box = anchor.getBoundingClientRect();
        return box.top + box.height / 2 - base;
      });
      const firstCenter = centers[0];
      const span = centers[lastIndex] - firstCenter;

      timelineLine.style.top = `${firstCenter}px`;
      timelineLine.style.bottom = "auto";
      timelineLine.style.height = `${Math.max(span, 0)}px`;
      anchorFractions = centers.map((center) =>
        span > 0 ? (center - firstCenter) / span : 0,
      );
    }

    function setCurrentIndex(index: number) {
      if (index === currentIndex) return;
      currentIndex = index;

      items.forEach((item, itemIndex) => {
        const status = index >= 0 && itemIndex <= index ? "active" : "inactive";
        if (item.dataset.status !== status) item.dataset.status = status;
        item.toggleAttribute("data-current", itemIndex === index);
        item.toggleAttribute("data-previous", itemIndex === index - 1);
        item.toggleAttribute("data-next", itemIndex === index + 1);
      });
    }

    function indexForProgress(reached: boolean, progress: number) {
      if (!reached) return -1;

      let index = 0;
      for (let itemIndex = 0; itemIndex < anchorFractions.length; itemIndex += 1) {
        if (progress + 0.0001 >= anchorFractions[itemIndex]) index = itemIndex;
      }
      return index;
    }

    function updateFromScroll(trigger: ScrollTrigger) {
      const reached = trigger.isActive || trigger.progress >= 1;
      setCurrentIndex(indexForProgress(reached, trigger.progress));
    }

    setCurrentIndex(-1);
    gsap.set(timelineFill, { scaleY: 0, transformOrigin: "top" });

    const mediaQueries = gsap.matchMedia();
    mediaQueries.add("(prefers-reduced-motion: no-preference)", () => {
      measureLine();
      ScrollTrigger.addEventListener("refreshInit", measureLine);

      if (items.length > 1) {
        gsap.fromTo(
          timelineFill,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              scroller,
              trigger: timelineLine,
              start: `top ${activationPercent}%`,
              end: `bottom ${activationPercent}%`,
              scrub: true,
              onRefresh: updateFromScroll,
              onToggle: updateFromScroll,
              onUpdate: updateFromScroll,
            },
          },
        );
      } else {
        setCurrentIndex(0);
      }

      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh);
      void document.fonts?.ready.then(() => {
        if (isMounted) refresh();
      });
      ScrollTrigger.refresh();

      return () => {
        window.removeEventListener("load", refresh);
        ScrollTrigger.removeEventListener("refreshInit", measureLine);
      };
    });

    mediaQueries.add("(prefers-reduced-motion: reduce)", () => {
      measureLine();
      gsap.set(timelineFill, { scaleY: 1 });
      setCurrentIndex(lastIndex);
    });

    return () => {
      isMounted = false;
      mediaQueries.revert();
    };
  }, [active]);

  return null;
}
