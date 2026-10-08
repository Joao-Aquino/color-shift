"use client";

import gsap from "gsap";
import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";

import { motionValue, prefersReducedMotion } from "@/lib/motion";

/**
 * Option B: Compositor-only animation.
 * The shell stays at full layout size. We reveal it with clip-path inset(round)
 * to keep 24px corners and 1px border perfect. Content fades independently.
 */
export function useClipRevealMotion(
  shellRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  active: boolean,
  closedHeight: number = 48
) {
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const previousActive = useRef(active);

  const animate = useCallback(() => {
    const shell = shellRef.current;
    const content = contentRef.current;

    if (!shell || prefersReducedMotion()) {
      if (shell) {
        gsap.set(shell, { clearProps: "clipPath" });
      }
      if (content) {
        gsap.set(content, { clearProps: "all" });
      }
      return;
    }

    timeline.current?.kill();

    const opening = active && !previousActive.current;
    const closing = !active && previousActive.current;
    const switching = active && previousActive.current;

    const openHeight = shell.scrollHeight;
    const topInset = openHeight - closedHeight;

    if (opening || switching) {
      const enterDuration = motionValue("--enter-duration");
      const ease = "power3.out";

      timeline.current = gsap.timeline();

      // Start with shell clipped to closed height
      if (opening) {
        gsap.set(shell, {
          clipPath: `inset(${topInset}px 0px 0px 0px round 24px)`,
        });
      }

      // Content starts invisible
      if (content) {
        gsap.set(content, { opacity: 0, y: 4 });
      }

      // Reveal the shell by animating clip-path inset
      timeline.current.to(shell, {
        clipPath: `inset(0px 0px 0px 0px round 24px)`,
        duration: enterDuration,
        ease,
      }, 0);

      // Fade in content after 40%
      if (content) {
        timeline.current.to(content, {
          opacity: 1,
          y: 0,
          duration: enterDuration * 0.6,
          ease,
        }, enterDuration * 0.4);
      }

    } else if (closing) {
      const exitDuration = motionValue("--exit-duration");
      const ease = "power3.out";
      const contentFadeDuration = Math.min(0.1, exitDuration * 0.4);

      timeline.current = gsap.timeline({
        onComplete: () => {
          gsap.set(shell, { clearProps: "clipPath" });
          if (content) {
            gsap.set(content, { clearProps: "all" });
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

      // Then clip the shell back to closed height
      timeline.current.to(shell, {
        clipPath: `inset(${topInset}px 0px 0px 0px round 24px)`,
        duration: exitDuration - contentFadeDuration,
        ease,
      }, contentFadeDuration);
    }

    previousActive.current = active;
  }, [active, shellRef, contentRef, closedHeight]);

  useLayoutEffect(() => {
    animate();
  }, [animate]);

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cancel = () => {
      timeline.current?.kill();
      timeline.current = null;
      if (shellRef.current) {
        gsap.set(shellRef.current, { clearProps: "clipPath" });
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
