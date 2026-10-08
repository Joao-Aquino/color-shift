"use client";

import { DialRoot, useDialKit } from "dialkit";
import { useEffect } from "react";

import { ODOMETER_TIMING } from "@/lib/odometer";
import { MOTION_DEFAULTS, SIDEBAR_EASES } from "@/lib/motion";

import "dialkit/styles.css";

export function MotionDevtools() {
  const motion = useDialKit("Phase 7 motion", {
    colorDurationMs: [MOTION_DEFAULTS["--color-duration"] * 1000, 0, 300, 10],
    themeWipe: {
      durationMs: [MOTION_DEFAULTS["--theme-wipe-duration"] * 1000, 100, 1000, 50],
    },
    photo: {
      durationMs: [MOTION_DEFAULTS["--photo-duration"] * 1000, 0, 300, 10],
      initialOpacity: [MOTION_DEFAULTS["--photo-opacity"], 0, 1, 0.05],
    },
    states: {
      easing: { type: "select", options: Object.keys(SIDEBAR_EASES), default: "easeOutQuart" },
      exitDurationMs: [MOTION_DEFAULTS["--exit-duration"] * 1000, 0, 250, 10],
      enterDurationMs: [MOTION_DEFAULTS["--enter-duration"] * 1000, 0, 500, 10],
    },
  }, { id: "color-shift-phase-7", persist: true });
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
      ["--color-duration", `${motion.colorDurationMs / 1000}s`],
      ["--theme-wipe-duration", `${motion.themeWipe.durationMs / 1000}s`],
      ["--photo-duration", `${motion.photo.durationMs / 1000}s`],
      ["--photo-opacity", String(motion.photo.initialOpacity)],
      ["--exit-duration", `${motion.states.exitDurationMs / 1000}s`],
      ["--enter-duration", `${motion.states.enterDurationMs / 1000}s`],
      ["--sidebar-easing", motion.states.easing],
    ] as const;
    const previous = properties.map(([name]) => ({ name, value: style.getPropertyValue(name), priority: style.getPropertyPriority(name) }));
    for (const [name, value] of properties) style.setProperty(name, value);
    return () => {
      for (const { name, value, priority } of previous) {
        if (value) style.setProperty(name, value, priority);
        else style.removeProperty(name);
      }
    };
  }, [motion.colorDurationMs, motion.themeWipe.durationMs, motion.photo.durationMs, motion.photo.initialOpacity,
    motion.states.exitDurationMs, motion.states.enterDurationMs, motion.states.easing]);

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
