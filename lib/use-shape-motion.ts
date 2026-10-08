"use client";

import gsap from "gsap";
import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";

import { motionValue, prefersReducedMotion } from "@/lib/motion";

/**
 * Animates ColorField open/close by animating the shell's real height while
 * keeping corners and border perfect. Content fades in/out with choreography.
 * 
 * Choreography:
 * - Close: fade content out (~80-100ms), then shrink the shell
 * - Open: grow the shell, then fade content in
 */
export function useShapeMotion(
  shellRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  active: boolean
) {
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const previousActive = useRef(active);
  const fullHeight = useRef<number>(0);

  const animate = useCallback(() => {
    const shell = shellRef.current;
    const content = contentRef.current;

    if (!shell || prefersReducedMotion()) {
      // Instant for reduced motion
      if (shell) {
        gsap.set(shell, { clearProps: "height" });
      }
      if (content) {
        gsap.set(content, { clearProps: "all" });
      }
      return;
    }

    // Kill any existing animation
    timeline.current?.kill();

    const opening = active && !previousActive.current;
    const closing = !active && previousActive.current;
    const switching = active && previousActive.current;

    if (opening || switching) {
      // Opening or switching: grow shell first, then fade in content
      const enterDuration = motionValue("--enter-duration");
      const ease = "power3.out"; // easeOutQuart

      // Measure the full content height if we haven't yet
      if (fullHeight.current === 0 && content) {
        // Temporarily show content to measure
        const wasHidden = content.style.display === "none";
        if (wasHidden) {
          content.style.display = "";
        }
        fullHeight.current = shell.scrollHeight;
        if (wasHidden) {
          content.style.display = "none";
        }
      }

      const closedHeight = 48; // Height when collapsed (h-12 = 48px)
      const openHeight = fullHeight.current || shell.scrollHeight;

      timeline.current = gsap.timeline();

      // Start from closed height if opening (or current height if switching)
      if (opening) {
        gsap.set(shell, { height: closedHeight });
      }

      // Content starts invisible
      if (content) {
        gsap.set(content, { opacity: 0, y: 4, display: "" });
      }

      // Grow the shell to full height
      timeline.current.to(shell, {
        height: openHeight,
        duration: enterDuration,
        ease,
      }, 0);

      // Fade in content after shell reaches ~40% of its animation
      if (content) {
        timeline.current.to(content, 
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
      // Closing: fade content first, then shrink shell
      const exitDuration = motionValue("--exit-duration");
      const ease = "power3.out"; // easeOutQuart
      const contentFadeDuration = Math.min(0.1, exitDuration * 0.4);

      const closedHeight = 48;

      timeline.current = gsap.timeline({
        onComplete: () => {
          // Clean up after animation completes
          gsap.set(shell, { clearProps: "height" });
          if (content) {
            gsap.set(content, { clearProps: "all", display: "none" });
          }
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

      // Then shrink the shell
      timeline.current.to(shell, {
        height: closedHeight,
        duration: exitDuration - contentFadeDuration,
        ease,
      }, contentFadeDuration);
    }

    previousActive.current = active;
  }, [active, shellRef, contentRef]);

  useLayoutEffect(() => {
    animate();
  }, [animate]);

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cancel = () => {
      timeline.current?.kill();
      timeline.current = null;
      if (shellRef.current) {
        gsap.set(shellRef.current, { clearProps: "height" });
      }
      if (contentRef.current) {
        gsap.set(contentRef.current, { clearProps: "all" });
      }
    };

    reduced.addEventListener("change", cancel);
    window.addEventListener("resize", cancel);

    return () => {
      cancel();
      reduced.removeEventListener("change", cancel);
      window.removeEventListener("resize", cancel);
    };
  }, [shellRef, contentRef]);

  return animate;
}
