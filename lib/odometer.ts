"use client";

import gsap from "gsap";

export const ODOMETER_TIMING = {
  duration: 0.22,
  digitStagger: 0.02,
  revealDuration: 0.2,
};

const defaults = {
  ...ODOMETER_TIMING,
  ease: "power3.out",
  revealEase: "power2.out",
  digitCycles: 2,
};

function getOdometerTiming() {
  if (process.env.NODE_ENV !== "development") return ODOMETER_TIMING;

  const style = getComputedStyle(document.documentElement);
  function readTiming(property: string, fallback: number) {
    const value = Number.parseFloat(style.getPropertyValue(property));
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  }

  return {
    duration: readTiming("--odometer-duration", defaults.duration),
    digitStagger: readTiming("--odometer-digit-stagger", defaults.digitStagger),
    revealDuration: readTiming("--odometer-reveal-duration", defaults.revealDuration),
  };
}

type Segment = {
  type: "digit" | "static";
  char: string;
  startDigit?: number;
  hidden?: boolean;
};

type RollerEntry = {
  roller: HTMLElement;
  mask: HTMLElement;
  targetPos: number;
};

type ElementState = {
  logicalText: string;
  timeline: gsap.core.Timeline | null;
  rollers: RollerEntry[];
  step: number;
};

const states = new WeakMap<HTMLElement, ElementState>();

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getLineHeightRatio(el: HTMLElement) {
  const cs = getComputedStyle(el);
  const lh = cs.lineHeight;
  if (lh === "normal") return 1.2;
  return parseFloat(lh) / parseFloat(cs.fontSize);
}

function parseSegments(text: string): Segment[] {
  return [...text].map((char) => ({
    type: /\d/.test(char) ? "digit" : "static",
    char,
  }));
}

function patternKey(text: string) {
  return [...text].map((char) => (/\d/.test(char) ? "d" : char)).join("");
}

function mapStartDigits(segments: Segment[], startValue: number) {
  const digitSlots = segments.filter((s) => s.type === "digit");
  const padded = String(Math.floor(Math.abs(startValue)))
    .padStart(digitSlots.length, "0")
    .slice(-digitSlots.length);
  let di = 0;
  return segments.map((s) =>
    s.type === "digit"
      ? { ...s, startDigit: parseInt(padded[di++], 10) }
      : s,
  );
}

function markHiddenSegments(segments: Segment[], startValue: number) {
  const totalDigits = segments.filter((s) => s.type === "digit").length;
  const absStart = Math.floor(Math.abs(startValue));
  const startDigitCount = absStart === 0 ? 1 : String(absStart).length;
  const leadingZeros = Math.max(0, totalDigits - startDigitCount);
  if (leadingZeros === 0) return segments;
  let digitsSeen = 0;
  let firstDigitSeen = false;
  let prevDigitHidden = false;
  return segments.map((seg) => {
    if (seg.type === "digit") {
      firstDigitSeen = true;
      const hidden = digitsSeen < leadingZeros;
      prevDigitHidden = hidden;
      digitsSeen++;
      return { ...seg, hidden };
    }
    return { ...seg, hidden: firstDigitSeen && prevDigitHidden };
  });
}

function digitsFromText(text: string) {
  return [...text].filter((c) => /\d/.test(c)).join("");
}

function startValueFromText(text: string) {
  return parseInt(digitsFromText(text), 10) || 0;
}

function forwardTargetPos(startDigit: number, endDigit: number) {
  return endDigit > startDigit ? endDigit : 10 + endDigit;
}

function buildRollerDOM(
  el: HTMLElement,
  segments: Segment[],
  step: number,
  grow: boolean,
) {
  el.innerHTML = "";
  el.style.height = "";
  const rollers: RollerEntry[] = [];
  const revealEls: HTMLElement[] = [];
  const totalCells = 10 * defaults.digitCycles;

  segments.forEach((seg) => {
    if (seg.type === "static") {
      const span = document.createElement("span");
      span.setAttribute("data-odometer-part", "static");
      span.style.height = step + "em";
      span.style.lineHeight = String(step);
      span.textContent = seg.char;
      el.appendChild(span);
      if (grow && seg.hidden) {
        gsap.set(span, { opacity: 0 });
        revealEls.push(span);
      }
      return;
    }

    const mask = document.createElement("span");
    mask.setAttribute("data-odometer-part", "mask");
    mask.style.height = step + "em";
    mask.style.lineHeight = String(step);
    const roller = document.createElement("span");
    roller.setAttribute("data-odometer-part", "roller");
    roller.style.lineHeight = String(step);

    const cells: number[] = [];
    for (let d = 0; d < totalCells; d++) cells.push(d % 10);
    roller.textContent = cells.join("\n");
    mask.appendChild(roller);
    el.appendChild(mask);

    const startDigit = seg.startDigit || 0;
    const isReveal = grow && Boolean(seg.hidden);
    gsap.set(roller, {
      y: isReveal ? step + "em" : -startDigit * step + "em",
    });
    const endDigit = parseInt(seg.char, 10);
    const targetPos = forwardTargetPos(startDigit, endDigit);
    rollers.push({ roller, mask, targetPos });
    if (isReveal) revealEls.push(mask);
  });

  return { rollers, revealEls };
}

function cleanupElement(el: HTMLElement, finalText: string) {
  el.style.overflow = "";
  el.style.height = "";
  el.style.width = "";

  const digits = [...finalText].filter((c) => /\d/.test(c));
  let di = 0;

  el.querySelectorAll('[data-odometer-part="mask"]').forEach((mask) => {
    const roller = mask.querySelector('[data-odometer-part="roller"]');
    if (roller) roller.remove();
    (mask as HTMLElement).textContent = digits[di++] || "";
    (mask as HTMLElement).style.opacity = "";
    (mask as HTMLElement).style.overflow = "";
    (mask as HTMLElement).style.width = "";
  });

  el.querySelectorAll('[data-odometer-part="static"]').forEach((stat) => {
    (stat as HTMLElement).style.opacity = "";
  });
}

function setPlainText(el: HTMLElement, text: string) {
  const existing = states.get(el);
  if (existing?.timeline) existing.timeline.kill();
  gsap.set(el, { clearProps: "width,overflow,height" });
  el.textContent = text;
  states.set(el, {
    logicalText: text,
    timeline: null,
    rollers: [],
    step: getLineHeightRatio(el),
  });
}

function rollerPositionEm(roller: HTMLElement, fontSize: number) {
  const yEm = Number(gsap.getProperty(roller, "y", "em"));
  if (Number.isFinite(yEm)) return Math.abs(yEm);
  const y = Number(gsap.getProperty(roller, "y")) || 0;
  return Math.abs(y) / fontSize;
}

function syncStaticChars(el: HTMLElement, newText: string) {
  const parts = [...newText];
  let pi = 0;
  el.childNodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const part = node.getAttribute("data-odometer-part");
    if (part === "static") {
      while (pi < parts.length && /\d/.test(parts[pi]!)) pi++;
      if (pi < parts.length) {
        node.textContent = parts[pi]!;
        pi++;
      }
      return;
    }
    if (part === "mask") {
      while (pi < parts.length && !/\d/.test(parts[pi]!)) pi++;
      pi++;
    }
  });
}

function retargetRollers(
  el: HTMLElement,
  state: ElementState,
  newText: string,
  duration: number,
  ease: string,
  digitStagger: number,
) {
  if (state.timeline) state.timeline.kill();

  const step = state.step;
  const fontSize = parseFloat(getComputedStyle(el).fontSize) || 16;
  const endDigits = digitsFromText(newText);
  const maxPos = 10 * defaults.digitCycles - 1;

  const tl = gsap.timeline({
    onComplete() {
      cleanupElement(el, newText);
      states.set(el, {
        logicalText: newText,
        timeline: null,
        rollers: [],
        step,
      });
    },
  });

  state.rollers.forEach(({ roller }, digitIdx) => {
    const endDigit = parseInt(endDigits[digitIdx] ?? "0", 10);
    let currentPos = rollerPositionEm(roller, fontSize) / step;
    let startDigit = Math.round(currentPos) % 10;
    if (startDigit < 0) startDigit += 10;

    if (startDigit === endDigit && Math.abs(currentPos - Math.round(currentPos)) < 0.05) {
      return;
    }

    let targetPos = Math.floor(currentPos) - (Math.floor(currentPos) % 10) + endDigit;
    if (targetPos <= currentPos) targetPos += 10;

    if (targetPos > maxPos) {
      gsap.set(roller, { y: -startDigit * step + "em" });
      currentPos = startDigit;
      targetPos = forwardTargetPos(startDigit, endDigit);
    }

    const reversedIdx = state.rollers.length - 1 - digitIdx;
    tl.to(
      roller,
      {
        y: -targetPos * step + "em",
        duration,
        ease,
        force3D: true,
      },
      reversedIdx * digitStagger,
    );

    state.rollers[digitIdx]!.targetPos = targetPos;
  });

  syncStaticChars(el, newText);
  state.logicalText = newText;
  state.timeline = tl;
}

/**
 * Animate (or retarget) an odometer element to `newText`.
 * Tracks a logical string so mid-roll updates never parse the digit strip.
 */
export function updateOdometer(
  el: HTMLElement,
  newText: string,
  options: { duration?: number; ease?: string; immediate?: boolean } = {},
) {
  const state = states.get(el);
  const currentText = state?.logicalText ?? el.textContent?.trim() ?? "";

  if (options.immediate || prefersReducedMotion()) {
    setPlainText(el, newText);
    return;
  }

  if (currentText === newText && !state?.timeline) {
    if (!state) setPlainText(el, newText);
    return;
  }

  const timing = getOdometerTiming();
  const duration = options.duration ?? timing.duration;
  const ease = options.ease ?? defaults.ease;
  const step = getLineHeightRatio(el);

  const canRetarget =
    Boolean(state) &&
    state!.rollers.length > 0 &&
    patternKey(currentText) === patternKey(newText);

  if (canRetarget && state) {
    retargetRollers(el, state, newText, duration, ease, timing.digitStagger);
    return;
  }

  if (state?.timeline) {
    state.timeline.kill();
    state.timeline = null;
  }

  // Restore logical text before parsing — never parse the roller strip.
  el.textContent = currentText || newText;

  const startValue = startValueFromText(currentText || newText);
  let segments = parseSegments(newText);
  segments = mapStartDigits(segments, startValue);
  segments = markHiddenSegments(segments, startValue);

  const grow = Boolean(currentText) && patternKey(currentText) !== patternKey(newText);
  const fontSize = parseFloat(getComputedStyle(el).fontSize) || 16;
  const oldWidthEm = el.getBoundingClientRect().width / fontSize;

  const { rollers, revealEls } = buildRollerDOM(el, segments, step, grow);

  const newWidthEm = el.getBoundingClientRect().width / fontSize;
  const widthChanged = grow && Math.abs(oldWidthEm - newWidthEm) > 0.01;

  if (widthChanged) {
    gsap.set(el, { width: oldWidthEm + "em", overflow: "hidden" });
  }

  const tl = gsap.timeline({
    onComplete() {
      cleanupElement(el, newText);
      states.set(el, {
        logicalText: newText,
        timeline: null,
        rollers: [],
        step,
      });
    },
  });

  if (widthChanged) {
    tl.to(
      el,
      {
        width: newWidthEm + "em",
        duration: timing.revealDuration,
        ease: defaults.revealEase,
      },
      0,
    );
  }

  revealEls.forEach((revealEl) => {
    if (revealEl.getAttribute("data-odometer-part") === "static") {
      tl.to(revealEl, { opacity: 1, duration: 0.2 }, 0);
    } else {
      const widthEm = revealEl.getBoundingClientRect().width / fontSize || 0.6;
      gsap.set(revealEl, { width: 0, overflow: "hidden", opacity: 1 });
      tl.to(
        revealEl,
        {
          width: widthEm + "em",
          duration: timing.revealDuration,
          ease: defaults.revealEase,
        },
        0,
      );
    }
  });

  rollers.forEach(({ roller, targetPos }, digitIdx) => {
    const reversedIdx = rollers.length - 1 - digitIdx;
    tl.to(
      roller,
      {
        y: -targetPos * step + "em",
        duration,
        ease,
        force3D: true,
      },
      reversedIdx * timing.digitStagger,
    );
  });

  states.set(el, {
    logicalText: newText,
    timeline: tl,
    rollers,
    step,
  });
}

export function initOdometerValue(el: HTMLElement, text: string) {
  setPlainText(el, text);
}
