export const MOTION_DEFAULTS = {
  "--color-duration": 0.2,
  "--theme-wipe-duration": 0.7,
  "--photo-duration": 0.2,
  "--photo-opacity": 0,
  "--exit-duration": 0.15,
  "--enter-duration": 0.3,
} as const;

export type MotionProperty = keyof typeof MOTION_DEFAULTS;

export const SIDEBAR_EASES = {
  easeOutQuart: "power3.out",
  easeInOutQuart: "power3.inOut",
  easeInOutCubic: "power2.inOut",
  easeOutExpo: "expo.out",
  linear: "none",
} as const;

export function sidebarEase() {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--sidebar-easing").trim();
  return SIDEBAR_EASES[value as keyof typeof SIDEBAR_EASES] ?? SIDEBAR_EASES.easeOutQuart;
}

/** Durations use seconds in GSAP and s/ms units in CSS. */
export function motionValue(property: MotionProperty) {
  const fallback = MOTION_DEFAULTS[property];
  if (typeof document === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(property).trim();
  const value = parseFloat(raw) / (raw.endsWith("ms") ? 1000 : 1);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
