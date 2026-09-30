"use client";

import { useEffect, useRef } from "react";

import { initOdometerValue, updateOdometer } from "@/lib/odometer";
import { cn } from "@/lib/utils";

interface OdometerProps {
  value: string;
  className?: string;
}

export function Odometer({ value, className }: OdometerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const primed = useRef(false);

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
    return () => {
      if (el) initOdometerValue(el, "");
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
