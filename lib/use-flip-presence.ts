"use client";

import { useEffect, useState } from "react";
import { motionValue, prefersReducedMotion } from "@/lib/motion";

/** Retain leaving content while its decorative exit copy animates. */
export function useFlipPresence(open: boolean) {
  const [presence, setPresence] = useState({ open, rendered: open });
  if (presence.open !== open) setPresence({ open, rendered: open || presence.rendered });
  useEffect(() => {
    if (open || !presence.rendered) return;
    const timer = window.setTimeout(() => setPresence({ open: false, rendered: false }),
      prefersReducedMotion() ? 0 : motionValue("--exit-duration") * 1000 + 32);
    return () => window.clearTimeout(timer);
  }, [open, presence.rendered]);
  return open || presence.rendered;
}
