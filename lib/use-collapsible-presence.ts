"use client";

import { useState, useSyncExternalStore, type TransitionEvent } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(REDUCED_MOTION).matches;
}

function getServerSnapshot() {
  return false;
}

export function useCollapsiblePresence(open: boolean) {
  const reducedMotion = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [presence, setPresence] = useState({ open, rendered: open });

  // Retain exit content before commit, rather than mounting it in a second effect pass.
  if (open !== presence.open || (!open && reducedMotion && presence.rendered)) {
    setPresence({ open, rendered: open || (!reducedMotion && presence.rendered) });
  }

  function onTransitionEnd(event: TransitionEvent<HTMLDivElement>) {
    if (event.propertyName !== "grid-template-rows") return;
    if (event.target !== event.currentTarget) return;
    if (!open) setPresence({ open, rendered: false });
  }

  return {
    present: open || (!reducedMotion && presence.rendered),
    onTransitionEnd,
  };
}
