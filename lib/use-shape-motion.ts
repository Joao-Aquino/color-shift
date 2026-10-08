"use client";

import gsap from "gsap";
import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";

import { motionValue, prefersReducedMotion, sidebarEase } from "@/lib/motion";

/**
 * Animates ColorField open/close by scaling the background shape while keeping
 * content at full size. This eliminates mid-animation distortion of text, swatches,
 * and rounded corners.
 * 
 * Choreography:
 * - Close: fade content out (~80-100ms), then shrink the shape
 * - Open: grow the shape, then fade content in
 */
export function useShapeMotion(
  shellRef: RefObject<HTMLElement | null>,
  backgroundRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  headerRef: RefObject<HTMLElement | null>,
  active: boolean
) {
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const previousActive = useRef(active);

  const animate = useCallback(() => {
    const shell = shellRef.current;
    const background = backgroundRef.current;
    const content = contentRef.current;
    const header = headerRef.current;

    if (!shell || !background || prefersReducedMotion()) {
      // Instant for reduced motion
      if (background) {
        gsap.set(background, { clearProps: "all" });
      }
      if (content) {
        gsap.set(content, { clearProps: "all" });
      }
      if (header) {
        gsap.set(header, { clearProps: "all" });
      }
      return;
    }

    // Kill any existing animation
    timeline.current?.kill();

    const opening = active && !previousActive.current;
    const closing = !active && previousActive.current;

    if (opening) {
      // Opening: grow shape first, then fade in content
      const enterDuration = motionValue("--enter-duration");
      const ease = sidebarEase();

      // Measure the final and initial states
      const closedHeight = 48; // Height when collapsed (h-12 = 48px)
      const openHeight = shell.scrollHeight;
      const scaleY = closedHeight / openHeight;

      timeline.current = gsap.timeline();

      // Set initial state: shape is scaled down
      gsap.set(background, {
        scaleY: scaleY,
        transformOrigin: "top center",
      });

      // Content and header start invisible
      if (content) {
        gsap.set(content, { opacity: 0, y: 4 });
      }
      if (header) {
        gsap.set(header, { opacity: 1 });
      }

      // Grow the shape
      timeline.current.to(background, {
        scaleY: 1,
        duration: enterDuration,
        ease,
      }, 0);

      // Fade in content after shape reaches ~40% of its animation
      if (content) {
        timeline.current.fromTo(content, 
          { opacity: 0, y: 4 },
          { 
            opacity: 1, 
            y: 0, 
            duration: enterDuration * 0.6,
            ease,
          }, 
          enterDuration * 0.4
        );
      }

    } else if (closing) {
      // Closing: fade content first, then shrink shape
      const exitDuration = motionValue("--exit-duration");
      const ease = sidebarEase();
      const contentFadeDuration = Math.min(0.1, exitDuration * 0.4);

      const closedHeight = 48;
      const openHeight = shell.scrollHeight;
      const scaleY = closedHeight / openHeight;

      timeline.current = gsap.timeline({
        onComplete: () => {
          // Clean up after animation completes
          gsap.set([background, content, header], { clearProps: "all" });
        }
      });

      // Fade out content first
      if (content) {
        timeline.current.to(content, {
          opacity: 0,
          y: -4,
          duration: contentFadeDuration,
          ease,
        }, 0);
      }

      // Then shrink the shape
      timeline.current.to(background, {
        scaleY: scaleY,
        duration: exitDuration - contentFadeDuration,
        ease,
        transformOrigin: "top center",
      }, contentFadeDuration);

      // Header stays visible throughout
      if (header) {
        gsap.set(header, { opacity: 1 });
      }
    }

    previousActive.current = active;
  }, [active, shellRef, backgroundRef, contentRef, headerRef]);

  useLayoutEffect(() => {
    animate();
  }, [animate]);

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cancel = () => {
      timeline.current?.kill();
      timeline.current = null;
      if (backgroundRef.current) {
        gsap.set(backgroundRef.current, { clearProps: "all" });
      }
      if (contentRef.current) {
        gsap.set(contentRef.current, { clearProps: "all" });
      }
      if (headerRef.current) {
        gsap.set(headerRef.current, { clearProps: "all" });
      }
    };

    reduced.addEventListener("change", cancel);
    window.addEventListener("resize", cancel);

    return () => {
      cancel();
      reduced.removeEventListener("change", cancel);
      window.removeEventListener("resize", cancel);
    };
  }, [backgroundRef, contentRef, headerRef]);

  return animate;
}
