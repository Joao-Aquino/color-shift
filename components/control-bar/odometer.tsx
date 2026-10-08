"use client";

import { useEffect, useEffectEvent, useRef } from "react";

import { initOdometerValue, updateOdometer } from "@/lib/odometer";
import { cn } from "@/lib/utils";

interface OdometerProps {
  value: string;
  className?: string;
}

export function Odometer({ value, className }: OdometerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const primed = useRef(false);
  const settleValue = useEffectEvent(() => {
    if (ref.current) initOdometerValue(ref.current, value);
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!primed.current) {
      initOdometerValue(el, value);
      primed.current = true;
      return;
    }

    updateOdometer(el, value);
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onPreferenceChange = () => { if (reduced.matches) settleValue(); };
    reduced.addEventListener("change", onPreferenceChange);
    return () => {
      if (el) initOdometerValue(el, "");
      reduced.removeEventListener("change", onPreferenceChange);
    };
  }, []);

  return (
    <span
      aria-hidden
      className={cn("font-mono tabular-nums", className)}
      data-odometer-element
      ref={ref}
    />
  );
}
