"use client";

import { useCallback, useEffect, useRef } from "react";
import { flushSync } from "react-dom";

import { motionValue } from "@/lib/motion";
import { setTheme, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

export type ThemeWipeDirection = "left" | "right";

const CLIP_PATHS: Record<ThemeWipeDirection, string[]> = {
  left: ["inset(0 100% 0 0)", "inset(0 0 0 0)"],
  right: ["inset(0 0 0 100%)", "inset(0 0 0 0)"],
};

/** The supplied 21st.dev horizontal reveal, connected to the existing theme pills. */
export function useThemeWipeToggle() {
  const transitionRef = useRef<ViewTransition | null>(null);
  const animationRef = useRef<Animation | null>(null);
  const versionRef = useRef(0);
  const pendingThemeRef = useRef<Theme | null>(null);

  const clear = useCallback(() => {
    versionRef.current += 1;
    animationRef.current?.cancel();
    animationRef.current = null;
    transitionRef.current?.skipTransition();
    transitionRef.current = null;
    pendingThemeRef.current = null;
    const root = document.documentElement;
    root.removeAttribute("data-theme-wipe");
    root.removeAttribute("data-theme-wipe-phase");
    root.removeAttribute("data-theme-transition");
  }, []);

  const settle = useCallback(() => {
    const next = pendingThemeRef.current;
    clear();
    if (next) flushSync(() => setTheme(next));
  }, [clear]);

  const changeTheme = useCallback((next: Theme) => {
    const root = document.documentElement;
    const current = root.dataset.theme === "light" ? "light" : "dark";
    if (pendingThemeRef.current === next) return;
    clear();
    if (document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof document.startViewTransition !== "function" || typeof root.animate !== "function") {
      flushSync(() => setTheme(next));
      return;
    }
    if (next === current) return;

    const direction: ThemeWipeDirection = next === "dark" ? "left" : "right";
    const version = versionRef.current;
    pendingThemeRef.current = next;
    root.dataset.themeWipe = direction;
    root.dataset.themeWipePhase = "capturing";
    root.setAttribute("data-theme-transition", "true");
    let transition: ViewTransition;
    try {
      transition = document.startViewTransition(() => {
        // skipTransition still runs the callback; invalidate older requests.
        if (versionRef.current === version) flushSync(() => setTheme(next));
      });
    } catch {
      settle();
      return;
    }
    transitionRef.current = transition;
    const fail = () => { if (versionRef.current === version) settle(); };
    void transition.updateCallbackDone.catch(fail);
    void transition.ready.then(() => {
      if (versionRef.current !== version) return;
      root.dataset.themeWipePhase = "revealing";
      try {
        const animation = root.animate({ clipPath: CLIP_PATHS[direction] }, {
          duration: motionValue("--theme-wipe-duration") * 1000,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
          fill: "both",
        });
        animationRef.current = animation;
        void animation.finished.catch(() => { /* Cancellation belongs to the next request. */ });
      } catch { fail(); }
    }, fail);
    void transition.finished.then(() => {
      if (versionRef.current === version) clear();
    }, fail);
  }, [clear, settle]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => { if (reduced.matches) settle(); };
    const onVisibility = () => { if (document.hidden) settle(); };
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) clear();
    };
    reduced.addEventListener("change", onMotionChange);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);
    window.addEventListener("resize", settle);
    return () => {
      clear();
      reduced.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("resize", settle);
    };
  }, [clear, settle]);

  return { changeTheme };
}
