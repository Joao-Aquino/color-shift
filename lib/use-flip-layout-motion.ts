"use client";

import gsap from "gsap";
import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";

import { motionValue, prefersReducedMotion, sidebarEase } from "@/lib/motion";

const SELECTOR = "[data-sidebar-layout]";
const FADE_DURATION = 0.09;

interface CapturedState {
  height: number;
  paddingTop: number;
  paddingBottom: number;
  backgroundColor: string;
  borderColor: string;
  y: number;
}

/** Animate layout changes with real dimension changes (no scale distortion). */
export function useFlipLayoutMotion(rootRef: RefObject<HTMLElement | null>, state: string, openCount = 0, selector = SELECTOR, sidebar = false) {
  const pending = useRef<Map<HTMLElement, CapturedState> | null>(null);
  const context = useRef<gsap.Context | null>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const previousCount = useRef(openCount);
  const generation = useRef(0);
  const ghosts = useRef<HTMLElement[]>([]);

  const settle = useCallback(() => {
    timeline.current?.kill();
    timeline.current = null;
    context.current?.revert();
    context.current = null;
    ghosts.current.forEach(element => element.remove());
    ghosts.current = [];
    rootRef.current?.removeAttribute("data-layout-moving");
  }, [rootRef]);

  const prepare = useCallback(() => {
    const root = rootRef.current;
    if (!root || pending.current) return;
    generation.current += 1;
    root.dispatchEvent(new Event("cs:sidebar-will-change", { bubbles: true }));
    
    if (prefersReducedMotion()) {
      pending.current = null;
      settle();
      return;
    }

    const targets = Array.from(root.querySelectorAll<HTMLElement>(selector));
    const before = new Map<HTMLElement, CapturedState>();
    
    targets.forEach(element => {
      const computed = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      before.set(element, {
        height: rect.height,
        paddingTop: parseFloat(computed.paddingTop),
        paddingBottom: parseFloat(computed.paddingBottom),
        backgroundColor: computed.backgroundColor,
        borderColor: computed.borderColor,
        y: rect.top,
      });
    });
    
    pending.current = before;
    settle();
  }, [rootRef, settle, selector]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const before = pending.current;
    const exiting = openCount < previousCount.current;
    previousCount.current = openCount;
    pending.current = null;
    
    if (!root || !before || prefersReducedMotion()) return;
    
    const duration = motionValue(exiting ? "--exit-duration" : "--enter-duration");
    const ease = sidebar ? sidebarEase() : "power3.out";
    const version = generation.current;
    const targets = Array.from(root.querySelectorAll<HTMLElement>(selector));
    
    root.setAttribute("data-layout-moving", "true");
    context.current = gsap.context(() => {
      const scroll = window.scrollY;
      const shells = targets.filter(element => 
        element.hasAttribute("data-color-field-shell") || element.id === "contrast-score-panel"
      );
      const buttons = targets.filter(element => 
        element.hasAttribute("data-color-field")
      );
      const contents = targets.filter(element => 
        element.classList.contains("cs-layout-content")
      );
      const exitingContent = contents.filter(el => el.dataset.open === "false");
      const enteringContent = contents.filter(el => el.dataset.open === "true");
      
      const exits = exitingContent.map(original => {
        const copy = original.cloneNode(true) as HTMLElement;
        [copy, ...Array.from(copy.querySelectorAll<HTMLElement>("*"))].forEach(element => {
          Array.from(element.attributes).forEach(attribute => {
            if (attribute.name === "id" || attribute.name.startsWith("data-") || attribute.name.startsWith("aria-")) {
              element.removeAttribute(attribute.name);
            }
          });
        });
        copy.setAttribute("aria-hidden", "true");
        copy.setAttribute("data-motion-ghost", "true");
        copy.inert = true;
        const rect = original.getBoundingClientRect();
        const computed = getComputedStyle(original);
        ["--score-border", "--score-pill", "--score-pill-border", "--score-text"].forEach(property => {
          const value = computed.getPropertyValue(property);
          if (value) copy.style.setProperty(property, value);
        });
        Object.assign(copy.style, {
          position: "fixed",
          top: `${rect.top}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          margin: "0",
          display: "block",
          opacity: computed.opacity,
          pointerEvents: "none",
          zIndex: "35",
          backgroundColor: original.closest("#contrast-score-panel")
            ? getComputedStyle(original.closest("#contrast-score-panel")!).backgroundColor
            : "var(--color-chrome-bg)",
        });
        root.appendChild(copy);
        ghosts.current.push(copy);
        return copy;
      });

      timeline.current = gsap.timeline({
        onUpdate: () => {
          exits.forEach(copy => { copy.style.translate = `0px ${-(window.scrollY - scroll)}px`; });
          root.dispatchEvent(new Event("cs:layout-motion", { bubbles: true }));
        },
        onComplete: () => {
          queueMicrotask(() => { if (generation.current === version) settle(); });
        },
      });

      if (exiting && enteringContent.length > 0) {
        timeline.current.to(enteringContent, {
          opacity: 0,
          duration: FADE_DURATION,
          ease: "power2.out",
        }, 0);
      }

      shells.forEach(shell => {
        const prev = before.get(shell);
        if (!prev || !timeline.current) return;
        
        const afterRect = shell.getBoundingClientRect();
        const afterComputed = getComputedStyle(shell);
        const afterHeight = afterRect.height;
        const afterPaddingTop = parseFloat(afterComputed.paddingTop);
        const afterPaddingBottom = parseFloat(afterComputed.paddingBottom);
        const afterBackgroundColor = afterComputed.backgroundColor;
        const afterBorderColor = afterComputed.borderColor;
        
        const heightChanged = Math.abs(prev.height - afterHeight) > 1;
        const positionChanged = Math.abs(prev.y - afterRect.top) > 1;
        
        if (heightChanged || positionChanged) {
          const props: gsap.TweenVars = {
            duration,
            ease,
            clearProps: "height,paddingTop,paddingBottom,backgroundColor,borderColor",
          };
          
          if (heightChanged) {
            Object.assign(props, {
              height: afterHeight,
              paddingTop: afterPaddingTop,
              paddingBottom: afterPaddingBottom,
            });
          }
          
          if (prev.backgroundColor !== afterBackgroundColor) {
            props.backgroundColor = afterBackgroundColor;
          }
          
          if (prev.borderColor !== afterBorderColor) {
            props.borderColor = afterBorderColor;
          }
          
          const fromProps: gsap.TweenVars = {};
          if (heightChanged) {
            Object.assign(fromProps, {
              height: prev.height,
              paddingTop: prev.paddingTop,
              paddingBottom: prev.paddingBottom,
            });
          }
          
          if (prev.backgroundColor !== afterBackgroundColor) {
            fromProps.backgroundColor = prev.backgroundColor;
          }
          
          if (prev.borderColor !== afterBorderColor) {
            fromProps.borderColor = prev.borderColor;
          }
          
          timeline.current.fromTo(shell, fromProps, props, 0);
        }
      });

      buttons.forEach(button => {
        const prev = before.get(button);
        if (!prev || !timeline.current) return;
        
        const afterRect = button.getBoundingClientRect();
        const afterComputed = getComputedStyle(button);
        const afterHeight = afterRect.height;
        const afterPaddingTop = parseFloat(afterComputed.paddingTop);
        const afterPaddingBottom = parseFloat(afterComputed.paddingBottom);
        const afterPaddingLeft = parseFloat(afterComputed.paddingLeft);
        const afterPaddingRight = parseFloat(afterComputed.paddingRight);
        
        const heightChanged = Math.abs(prev.height - afterHeight) > 1;
        const paddingChanged = Math.abs(prev.paddingTop - afterPaddingTop) > 0.5 || 
                               Math.abs(prev.paddingBottom - afterPaddingBottom) > 0.5;
        
        if (heightChanged || paddingChanged) {
          timeline.current.fromTo(button, 
            { 
              height: prev.height,
              paddingTop: prev.paddingTop,
              paddingBottom: prev.paddingBottom,
              paddingLeft: parseFloat(getComputedStyle(button).paddingLeft),
              paddingRight: parseFloat(getComputedStyle(button).paddingRight),
            },
            { 
              height: afterHeight,
              paddingTop: afterPaddingTop,
              paddingBottom: afterPaddingBottom,
              paddingLeft: afterPaddingLeft,
              paddingRight: afterPaddingRight,
              duration,
              ease,
              clearProps: "height,paddingTop,paddingBottom,paddingLeft,paddingRight",
            },
            0
          );
        }
      });

      if (exits.length) {
        timeline.current.to(exits, {
          opacity: 0,
          y: -4,
          duration: FADE_DURATION,
          ease: "power2.out",
        }, 0);
      }

      if (!exiting && enteringContent.length > 0 && timeline.current) {
        timeline.current.fromTo(enteringContent, 
          { opacity: 0, y: 4 },
          { 
            opacity: 1,
            y: 0,
            duration: duration * 0.5,
            ease,
            clearProps: "opacity,y",
          },
          FADE_DURATION
        );
      }

      if (timeline.current) {
        targets.filter(el => 
          !shells.includes(el) && !contents.includes(el) && !buttons.includes(el) && 
          Math.abs((before.get(el)?.y ?? 0) - el.getBoundingClientRect().top) > 1
        ).forEach(element => {
          const prev = before.get(element);
          if (!prev || !timeline.current) return;
          const afterY = element.getBoundingClientRect().top;
          const delta = afterY - prev.y;
          if (Math.abs(delta) > 1) {
            timeline.current.fromTo(element, 
              { y: -delta },
              { y: 0, duration, ease, clearProps: "y" },
              0
            );
          }
        });
      }
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
