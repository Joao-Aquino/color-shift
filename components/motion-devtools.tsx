"use client";

import { DialRoot, useDialKit } from "dialkit";
import { useEffect } from "react";

import { ODOMETER_TIMING } from "@/lib/odometer";

import "dialkit/styles.css";

export function MotionDevtools() {
  const values = useDialKit(
    "Score odometer",
    {
      durationMs: [ODOMETER_TIMING.duration * 1000, 100, 300, 10],
      digitStaggerMs: [ODOMETER_TIMING.digitStagger * 1000, 0, 40, 5],
      revealDurationMs: [ODOMETER_TIMING.revealDuration * 1000, 100, 300, 10],
    },
    { id: "color-shift-odometer", persist: true },
  );

  useEffect(() => {
    const style = document.documentElement.style;
    const properties = [
      ["--odometer-duration", values.durationMs],
      ["--odometer-digit-stagger", values.digitStaggerMs],
      ["--odometer-reveal-duration", values.revealDurationMs],
    ] as const;
    const previous = properties.map(([name]) => ({
      name,
      value: style.getPropertyValue(name),
      priority: style.getPropertyPriority(name),
    }));

    for (const [name, milliseconds] of properties) {
      style.setProperty(name, String(milliseconds / 1000));
    }

    return () => {
      for (const { name, value, priority } of previous) {
        if (value) style.setProperty(name, value, priority);
        else style.removeProperty(name);
      }
    };
  }, [values.durationMs, values.digitStaggerMs, values.revealDurationMs]);

  return <DialRoot position="top-right" theme="dark" />;
}
