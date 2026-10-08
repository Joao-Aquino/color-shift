"use client";

import { useCallback, useRef, type RefObject } from "react";

/**
 * Variant A: Real resize animation without scale transforms.
 * CSS transitions handle the actual dimension changes (grid-rows, padding, etc.).
 * This hook only prepares state before React commits changes.
 */
export function useRealResizeMotion(rootRef: RefObject<HTMLElement | null>, _state: string, _openCount = 0) {
  const prepare = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    
    // Notify any dependent systems that layout will change
    root.dispatchEvent(new Event("cs:sidebar-will-change", { bubbles: true }));
  }, [rootRef]);

  return prepare;
}
